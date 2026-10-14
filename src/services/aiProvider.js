/**
 * StretchNow Multi-Provider AI Failover System with Multi-Turn Context & Cancellation
 * 
 * Provider Priority Pool:
 * 1. Groq API (llama-3.3-70b-versatile - Ultra fast ~200ms)
 * 2. OpenRouter API (openrouter/auto)
 * 3. Cohere AI API (command-r-08-2024)
 * 4. Gemini API Keys (gemini-1.5-flash v1beta generateContent)
 * 5. Cerebras API (llama3.1-8b)
 * 
 * Features:
 * - Multi-turn conversation context memory
 * - AbortController signal support for instant user stop
 * - Automatic quota failover (429, 402, 403, 500)
 * - Real-time token and latency tracking for Admin console
 */

import { recordQueryUsage, recordUnansweredQuery, recordQuestionTopic } from './aiUsage.js';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const GROQ_KEY = env.VITE_GROQ_API_KEY;
const OPENROUTER_KEY = env.VITE_OPENROUTER_API_KEY;
const COHERE_KEY = env.VITE_COHERE_API_KEY;
const CEREBRAS_KEY = env.VITE_CEREBRAS_API_KEY;

const GEMINI_KEYS = [
  env.VITE_GEMINI_API_KEY_1,
  env.VITE_GEMINI_API_KEY_2,
  env.VITE_GEMINI_API_KEY_3
].filter(Boolean);

let activeGeminiIndex = 0;

export const AI_PROVIDERS_METADATA = [
  { id: 'Groq', name: 'Groq Cloud', model: 'llama-3.3-70b-versatile', speed: 'Ultra Fast (~200ms)', priority: 1, hasKey: !!GROQ_KEY },
  { id: 'OpenRouter', name: 'OpenRouter AI', model: 'openrouter/auto', speed: 'Fast (~600ms)', priority: 2, hasKey: !!OPENROUTER_KEY },
  { id: 'Cohere', name: 'Cohere AI', model: 'command-r-08-2024', speed: 'Moderate (~900ms)', priority: 3, hasKey: !!COHERE_KEY },
  { id: 'Gemini', name: 'Google Gemini', model: 'gemini-1.5-flash', speed: 'Fast (~700ms)', priority: 4, hasKey: GEMINI_KEYS.length > 0 },
  { id: 'Cerebras', name: 'Cerebras AI', model: 'llama3.1-8b', speed: 'Ultra Fast (~250ms)', priority: 5, hasKey: !!CEREBRAS_KEY }
];

/**
 * Validates, trims, and sanitizes user input queries for privacy and security.
 * - Enforces max length (1000 characters)
 * - Strips dangerous HTML/script elements
 * - Redacts sensitive tokens or card numbers
 * - Detects prompt injection attempts
 * @param {string} text
 * @returns {{ valid: boolean, sanitized: string, error?: string }}
 */
export function validateAndSanitizeQuery(text) {
  if (!text || typeof text !== 'string') {
    return { valid: false, sanitized: '', error: 'Query cannot be empty.' };
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return { valid: false, sanitized: '', error: 'Query cannot be empty.' };
  }

  if (trimmed.length > 1000) {
    return { valid: false, sanitized: trimmed.slice(0, 1000), error: 'Query exceeds 1,000 character limit.' };
  }

  // 1. Strip HTML/Script tags to prevent injection in client/DOM
  let sanitized = trimmed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '');

  // 2. Redact potential sensitive payment patterns (13-19 digits)
  sanitized = sanitized.replace(/\b(?:\d[ -]*?){13,19}\b/g, '[REDACTED_PAYMENT]');
  // Passwords or tokens e.g. "password=xyz" or "token=xyz"
  sanitized = sanitized.replace(/(password|secret|token|api[_-]?key)\s*[:=]\s*[^\s]+/gi, '$1: [REDACTED]');

  // 3. Prompt injection detection
  const injectionPatterns = [
    /ignore (?:all )?(?:previous|above) instructions/i,
    /system (?:prompt|directive|override)/i,
    /reveal (?:your |the )?(?:api|secret|keys?|environment)/i,
    /jailbreak/i,
    /you are now DAN/i
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(sanitized)) {
      return {
        valid: false,
        sanitized,
        error: 'Security Notice: System prompt overrides and key inquiries are not permitted.'
      };
    }
  }

  return { valid: true, sanitized };
}

export const MAX_OUTPUT_TOKENS = 250;
export const MAX_HISTORY_MESSAGES = 4;

/**
 * Normalizes input prompt or array of messages into OpenAI-compatible format
 * Enforces a smart sliding memory window (Feature #2) to cap conversational token explosion.
 * 
 * ponytail: slicing to latest 4 messages + 1-line context marker keeps zero-latency client
 * operation without an expensive LLM summarization turn.
 * 
 * @param {string | Array<{role: string, content: string}>} input
 * @param {string} [systemInstruction='']
 * @param {number} [maxHistory=MAX_HISTORY_MESSAGES]
 * @returns {Array<{role: string, content: string}>}
 */
export function normalizeMessages(input, systemInstruction = '', maxHistory = MAX_HISTORY_MESSAGES) {
  const normalized = [];
  if (systemInstruction) {
    normalized.push({ role: 'system', content: systemInstruction });
  }

  if (typeof input === 'string') {
    const { sanitized } = validateAndSanitizeQuery(input);
    normalized.push({ role: 'user', content: sanitized || input });
  } else if (Array.isArray(input)) {
    const parsed = [];
    for (const msg of input) {
      if (!msg || !msg.content) continue;
      const role = (msg.role === 'bot' || msg.role === 'assistant') ? 'assistant' : (msg.role === 'system' ? 'system' : 'user');
      const content = role === 'user' ? (validateAndSanitizeQuery(msg.content).sanitized || msg.content) : msg.content;
      parsed.push({ role, content });
    }

    // Feature #2: Smart conversation memory sliding window
    const nonSystem = parsed.filter(m => m.role !== 'system');
    if (nonSystem.length > maxHistory) {
      normalized.push({
        role: 'system',
        content: '[Context: Continuing ongoing desk ergonomics consultation.]'
      });
      normalized.push(...nonSystem.slice(-maxHistory));
    } else {
      normalized.push(...nonSystem);
    }
  }

  return normalized;
}

/**
 * 1. Groq API Call
 */
async function callGroqAPI(messages, signal) {
  if (!GROQ_KEY) throw new Error('NO_KEY');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: {
      'Authorization': `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: MAX_OUTPUT_TOKENS
    })
  });

  if (res.status === 429 || res.status === 402 || res.status === 403) throw new Error('QUOTA_EXHAUSTED');
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);

  const data = await res.json();
  return {
    content: data?.choices?.[0]?.message?.content,
    tokens: data?.usage?.total_tokens || null,
    model: 'llama-3.3-70b-versatile'
  };
}

/**
 * 2. OpenRouter API Call
 */
async function callOpenRouterAPI(messages, signal) {
  if (!OPENROUTER_KEY) throw new Error('NO_KEY');
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openrouter/auto',
      messages,
      temperature: 0.7,
      max_tokens: MAX_OUTPUT_TOKENS
    })
  });

  if (res.status === 429 || res.status === 402 || res.status === 403) throw new Error('QUOTA_EXHAUSTED');
  if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);

  const data = await res.json();
  return {
    content: data?.choices?.[0]?.message?.content,
    tokens: data?.usage?.total_tokens || null,
    model: 'openrouter/auto'
  };
}

/**
 * 3. Cohere API Call
 */
async function callCohereAPI(messages, systemInstruction, signal) {
  if (!COHERE_KEY) throw new Error('NO_KEY');
  const latestUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || 'Provide desk wellness advice.';
  const chatHistory = messages
    .filter(m => m.role !== 'system')
    .slice(0, -1)
    .map(m => ({
      role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
      message: m.content
    }));

  const res = await fetch('https://api.cohere.com/v1/chat', {
    method: 'POST',
    signal,
    headers: {
      'Authorization': `Bearer ${COHERE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: latestUserMsg,
      chat_history: chatHistory.length > 0 ? chatHistory : undefined,
      preamble: systemInstruction || undefined,
      model: 'command-r-08-2024',
      max_tokens: MAX_OUTPUT_TOKENS
    })
  });

  if (res.status === 429 || res.status === 402 || res.status === 403) throw new Error('QUOTA_EXHAUSTED');
  if (!res.ok) throw new Error(`Cohere HTTP ${res.status}`);

  const data = await res.json();
  return {
    content: data?.text,
    tokens: (data?.meta?.tokens?.input_tokens || 0) + (data?.meta?.tokens?.output_tokens || 0) || null,
    model: 'command-r-08-2024'
  };
}

/**
 * 4. Gemini API Call
 */
async function callGeminiAPI(messages, systemInstruction, signal) {
  if (GEMINI_KEYS.length === 0) throw new Error('NO_KEY');
  const apiKey = GEMINI_KEYS[activeGeminiIndex];

  // Map messages to Gemini multi-turn parts
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  const bodyPayload = {
    contents,
    generationConfig: {
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.7
    }
  };

  if (systemInstruction) {
    bodyPayload.system_instruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload)
    }
  );

  if (res.status === 429 || res.status === 402 || res.status === 403) {
    activeGeminiIndex = (activeGeminiIndex + 1) % GEMINI_KEYS.length;
    throw new Error('QUOTA_EXHAUSTED');
  }

  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  const tokens = data?.usageMetadata?.totalTokenCount || null;
  return {
    content: text,
    tokens,
    model: 'gemini-1.5-flash'
  };
}

/**
 * 5. Cerebras API Call
 */
async function callCerebrasAPI(messages, signal) {
  if (!CEREBRAS_KEY) throw new Error('NO_KEY');
  const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: {
      'Authorization': `Bearer ${CEREBRAS_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama3.1-8b',
      messages,
      temperature: 0.7,
      max_tokens: MAX_OUTPUT_TOKENS
    })
  });

  if (res.status === 429 || res.status === 402 || res.status === 403) throw new Error('QUOTA_EXHAUSTED');
  if (!res.ok) throw new Error(`Cerebras HTTP ${res.status}`);

  const data = await res.json();
  return {
    content: data?.choices?.[0]?.message?.content,
    tokens: data?.usage?.total_tokens || null,
    model: 'llama3.1-8b'
  };
}

/**
 * Main AI Generation Entry Point with Multi-Turn Context, Signal Cancellation & Failover
 * 
 * @param {string | Array<{role: string, content: string}>} promptOrMessages
 * @param {string} [systemInstruction]
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<string>}
 */
export async function generateAIResponse(promptOrMessages, systemInstruction = '', options = {}) {
  const signal = options?.signal;
  const messages = normalizeMessages(promptOrMessages, systemInstruction);

  // If already cancelled
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  // Extract latest user query text for topic analytics
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  const latestUserQuery = lastUserMsg?.content || '';

  if (latestUserQuery) {
    recordQuestionTopic(latestUserQuery);
  }

  const providers = [
    { name: 'Groq', fn: () => callGroqAPI(messages, signal) },
    { name: 'OpenRouter', fn: () => callOpenRouterAPI(messages, signal) },
    { name: 'Cohere', fn: () => callCohereAPI(messages, systemInstruction, signal) },
    { name: 'Gemini', fn: () => callGeminiAPI(messages, systemInstruction, signal) },
    { name: 'Cerebras', fn: () => callCerebrasAPI(messages, signal) }
  ];

  for (const provider of providers) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const startTime = performance.now();
    try {
      const result = await provider.fn();
      const output = result?.content;

      if (output && output.trim()) {
        const latencyMs = Math.round(performance.now() - startTime);

        // Record metrics for Admin Dashboard and Daily Quota
        recordQueryUsage({
          provider: provider.name,
          model: result.model,
          promptLength: JSON.stringify(messages).length,
          responseLength: output.length,
          latencyMs,
          estimatedTokens: result.tokens
        });

        return output.trim();
      }
    } catch (err) {
      const e = /** @type {any} */ (err);
      if (e?.name === 'AbortError' || signal?.aborted) {
        throw err;
      }
      console.warn(`Provider ${provider.name} failed (${e?.message || e}). Moving to next AI provider in pool...`);
    }
  }

  // Smart local ergonomic fallback if network / all API quotas are exhausted
  if (latestUserQuery) {
    recordUnansweredQuery(latestUserQuery, 'All multi-model API providers exhausted or network offline');
  }

  return "💡 **Desk Wellness Tip**:\n• Sit tall with feet flat on the floor and uncross your legs.\n• Roll your **shoulders backward 5 times** while taking deep breaths.\n• Keep your screen at eye level and rest your eyes with the **20-20-20 rule** (look 20 ft away for 20 seconds).\n\nNeed personalized help? Reach our team at support@stretchnow.app or [nav:library] to browse targeted routines.";
}

/**
 * Pings a specific AI provider for latency & health testing (Used in Admin Dashboard)
 * 
 * @param {string} providerId
 * @returns {Promise<{ ok: boolean, latencyMs: number, error?: string, model: string }>}
 */
export async function testProviderPing(providerId) {
  const testMessages = [
    { role: 'user', content: 'Say "pong" in 1 word.' }
  ];
  const startTime = performance.now();

  try {
    let result = null;
    if (providerId === 'Groq') result = await callGroqAPI(testMessages);
    else if (providerId === 'OpenRouter') result = await callOpenRouterAPI(testMessages);
    else if (providerId === 'Cohere') result = await callCohereAPI(testMessages, '');
    else if (providerId === 'Gemini') result = await callGeminiAPI(testMessages, '');
    else if (providerId === 'Cerebras') result = await callCerebrasAPI(testMessages);
    else throw new Error('Unknown provider');

    const latencyMs = Math.round(performance.now() - startTime);
    return {
      ok: !!result?.content,
      latencyMs,
      model: result?.model || providerId
    };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - startTime);
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      latencyMs,
      error: msg || 'Connection error',
      model: providerId
    };
  }
}
