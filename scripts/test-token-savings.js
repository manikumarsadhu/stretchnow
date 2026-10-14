import assert from 'node:assert';

// Mock browser environment for LocalRepository tests in Node
const store = new Map();
globalThis.window = {};
globalThis.localStorage = {
  getItem: (key) => store.get(key) || null,
  setItem: (key, val) => store.set(key, String(val)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear()
};

import { retrieveRelevantKnowledge, buildHealthCoachPrompt } from '../src/services/aiPrompts.js';
import { normalizeMessages, MAX_OUTPUT_TOKENS, MAX_HISTORY_MESSAGES } from '../src/services/aiProvider.js';
import { resolveLocalIntent } from '../src/services/aiRouter.js';
import { normalizeCacheKey, getCachedResponse, setCachedResponse, clearAICache } from '../src/services/aiCache.js';
import { getAdminMetrics, recordCacheHit, recordIntentResolved } from '../src/services/aiUsage.js';

console.log('--- Testing 6 Token-Saving AI Features ---');

// =========================================================================
// Feature 1 & 3: Short Prompts & Relevant Knowledge Retrieval (RAG)
// =========================================================================
console.log('Testing Feature 1 & 3: Short Prompts & RAG Retrieval...');
const neckKnowledge = retrieveRelevantKnowledge('I have severe neck and shoulder tension');
assert.ok(neckKnowledge.includes('Gentle Neck Release'), 'Should match neck/shoulder chunk');
assert.ok(neckKnowledge.includes('[nav:library]'), 'Should include navigation tag');

const eyeKnowledge = retrieveRelevantKnowledge('How does the 20-20-20 eye rule work?');
assert.ok(eyeKnowledge.includes('20-20-20 Eye Rest'), 'Should match eye rest chunk');

const genericKnowledge = retrieveRelevantKnowledge('tell me about your application');
assert.ok(genericKnowledge.includes('StretchNow is an offline-first'), 'Should return lightweight general fallback');

const prompt = buildHealthCoachPrompt({
  occupation: 'Software Engineer',
  breaksCompleted: 3,
  dailyBreakGoal: 6,
  userName: 'Mani',
  language: 'en',
  query: 'neck stiffness'
});

assert.ok(prompt.includes('Mani'), 'Prompt should include user name');
assert.ok(prompt.includes('60–120 words max'), 'Prompt should enforce concise length constraint');
assert.ok(prompt.includes('Gentle Neck Release'), 'Prompt should dynamically include RAG chunk');
assert.ok(prompt.length < 1200, `Prompt length (${prompt.length} chars) should be ultra-lean compared to legacy 5,200 chars`);
console.log(`✓ Short Prompt & RAG passed (Prompt size: ~${Math.round(prompt.length / 4)} tokens vs legacy ~1,200 tokens)`);

// =========================================================================
// Feature 2: Smart Conversation Memory (Sliding Window)
// =========================================================================
console.log('Testing Feature 2: Smart Conversation Memory (Sliding Window)...');
const longConversation = [];
for (let i = 1; i <= 10; i++) {
  longConversation.push({ role: 'user', content: `Question ${i}` });
  longConversation.push({ role: 'assistant', content: `Answer ${i}` });
}
assert.strictEqual(longConversation.length, 20, 'Input has 20 messages');

const normalized = normalizeMessages(longConversation, 'System directive', 4);
// Should have: 1 system directive + 1 rolling context tag + 4 latest messages = 6 total
assert.ok(normalized.length <= 6, `Normalized length should be capped (got ${normalized.length})`);
assert.strictEqual(normalized[normalized.length - 1].content, 'Answer 10', 'Latest assistant answer should be preserved');
assert.strictEqual(normalized[normalized.length - 2].content, 'Question 10', 'Latest user question should be preserved');
assert.strictEqual(normalized[normalized.length - 3].content, 'Answer 9', 'Previous assistant answer should be preserved');
assert.strictEqual(normalized[normalized.length - 4].content, 'Question 9', 'Previous user question should be preserved');
assert.ok(normalized.some(m => m.content.includes('Continuing ongoing')), 'Should include continuity context marker');
console.log('✓ Sliding memory window passed (20 turns safely capped to latest 4 messages)');

// =========================================================================
// Feature 4: Cache Repeated Answers
// =========================================================================
console.log('Testing Feature 4: Answer Caching...');
clearAICache();

// Key normalization
const rawKey = '🧘 Relieve neck & shoulder tension!!';
const normKey = normalizeCacheKey(rawKey, 'en');
assert.strictEqual(normKey, 'en:relieve neck shoulder tension', 'Should strip emojis and punctuation');

// Seeded response lookup
const seededAnswer = getCachedResponse('🧘 Relieve neck & shoulder tension', 'en');
assert.ok(seededAnswer && seededAnswer.includes('Gentle Neck Release'), 'Seeded chip query should return instant response');

// Cache write & read
setCachedResponse('best desk ergonomics', 'en', 'Keep monitor at eye level and sit tall.');
const cachedResult = getCachedResponse('best desk ergonomics', 'en');
assert.strictEqual(cachedResult, 'Keep monitor at eye level and sit tall.', 'Cached query should be returned');
console.log('✓ Zero-token answer caching passed');

// =========================================================================
// Feature 5: Intent-Based Fast-Path Routing
// =========================================================================
console.log('Testing Feature 5: Intent-Based Routing...');
// 1. Greeting
const greetingRes = resolveLocalIntent('Hello there!', { userName: 'Alex', language: 'en' });
assert.strictEqual(greetingRes.handled, true, 'Greeting should be handled locally');
assert.strictEqual(greetingRes.reason, 'greeting', 'Reason should be greeting');
assert.ok(greetingRes.response.includes('Alex'), 'Response should be personalized');

// 2. Multilingual Greeting (Telugu)
const teGreeting = resolveLocalIntent('నమస్కారం', { userName: 'రవి', language: 'te' });
assert.strictEqual(teGreeting.handled, true, 'Telugu greeting should be handled locally');
assert.ok(teGreeting.response.includes('రవి'), 'Should address user in Telugu');

// 3. Navigation
const navRes = resolveLocalIntent('where is settings menu?');
assert.strictEqual(navRes.handled, true, 'Navigation query should be handled locally');
assert.ok(navRes.response.includes('[nav:settings]'), 'Should provide clickable settings tag');

// 4. Activity status
const statusRes = resolveLocalIntent('how many breaks today?', {
  breaksCompleted: 4,
  dailyBreakGoal: 6,
  waterCount: 5,
  dailyWaterGoal: 8,
  todaySittingHours: 3.5,
  streak: 7
});
assert.strictEqual(statusRes.handled, true, 'Status query should be handled locally');
assert.ok(statusRes.response.includes('**4 / 6**'), 'Should show completed breaks');
assert.ok(statusRes.response.includes('**7** days'), 'Should show active streak');

// 5. Medical Safety Red Flag
const safetyRes = resolveLocalIntent('I have sharp chest pain while sitting');
assert.strictEqual(safetyRes.handled, true, 'Medical emergency query should be handled locally');
assert.strictEqual(safetyRes.reason, 'medical_safety', 'Should trigger clinical safety escalation');
assert.ok(safetyRes.response.includes('[support:contact]'), 'Should provide support contact tag');

// 6. Complex clinical reasoning question (Passes through to LLM)
const unhandled = resolveLocalIntent('Can forward head posture cause thoracic outlet syndrome symptoms?');
assert.strictEqual(unhandled.handled, false, 'Complex clinical query should fall through to LLM');
console.log('✓ Intent-based routing passed (0 tokens used for deterministic intents)');

// =========================================================================
// Feature 6: Limit Response Length Constants
// =========================================================================
console.log('Testing Feature 6: Output Token Capping...');
assert.strictEqual(MAX_OUTPUT_TOKENS, 250, 'Max output tokens should be capped to 250 across providers');
assert.strictEqual(MAX_HISTORY_MESSAGES, 4, 'Max history messages should be capped to 4');
console.log('✓ Output token limit constant verified (250 tokens)');

// =========================================================================
// Metrics Verification
// =========================================================================
console.log('Testing Metrics Tracking for Token Savings...');
recordCacheHit({ query: 'neck stretch', savedTokens: 250 });
recordIntentResolved('greeting', 180);

const metrics = getAdminMetrics();
assert.ok(metrics.tokensSaved >= 430, `Tokens saved should reflect cache hits and intent fast-paths (got ${metrics.tokensSaved})`);
assert.ok(metrics.cachedHits >= 1, 'Cache hits should be recorded');
assert.ok(metrics.intentsResolved >= 1, 'Intents resolved should be recorded');
console.log(`✓ Admin token telemetry passed (Tokens Saved: ${metrics.tokensSaved}, Cached Hits: ${metrics.cachedHits}, Fast Paths: ${metrics.intentsResolved})`);

console.log('\n======================================================');
console.log('🎉 ALL 6 TOKEN-SAVING FEATURES VERIFIED SUCCESSFULLY!');
console.log('======================================================');
