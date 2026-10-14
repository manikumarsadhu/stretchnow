/**
 * StretchNow AI Prompt Engineering & Dynamic Context Retrieval (RAG)
 * Certified Workplace Ergonomics, Physical Therapy Wellness & Website Knowledge Base
 * 
 * Token Saving Optimizations:
 * 1. Short Prompts: Concise core instructions (~140 tokens vs previous ~1,200 tokens).
 * 2. Targeted RAG Retrieval: Only inject the 1-2 knowledge chunks relevant to the user's query.
 * 3. Compact Output Directives: Strict 60-120 word budget with markdown bullets.
 */

/**
 * Modular Knowledge Chunks for targeted RAG retrieval.
 * Instead of dumping all 7 exercises and the full app manual into every prompt,
 * we retrieve only the 1-2 chunks matching the user's intent or query keywords.
 */
const KNOWLEDGE_CHUNKS = [
  {
    id: 'neck_shoulders',
    keywords: ['neck', 'shoulder', 'cervical', 'trapezius', 'trap', 'collar', 'మెడ', 'భుజ', 'गर्दन', 'कंध'],
    content: `• Gentle Neck Release (30s): Cervical spine & upper trap relief from forward-head posture.\n• Shoulder Blade Rolls (30s): Rhomboids & traps, opens chest and shoulder girdle.\nAction tag: [nav:library]`
  },
  {
    id: 'spine_hips',
    keywords: ['spine', 'back', 'hip', 'lower back', 'psoas', 'lumbar', 'నడుము', 'వెన్ను', 'कमर', 'पीठ'],
    content: `• Seated Spinal Twist (30s): Thoracic mobility & lumbar decompression.\n• Seated Hip Flexor Opener (45s): Releases tight psoas from sitting.\nAction tag: [nav:library]`
  },
  {
    id: 'wrists_typing',
    keywords: ['wrist', 'hand', 'typing', 'mouse', 'carpal', 'finger', 'forearm', 'మణికట్టు', 'చేయి', 'कलाई', 'हाथ'],
    content: `• Wrist & Forearm Flexor Stretch (30s): Relieves typing strain & carpal tunnel symptoms.\nAction tag: [nav:library]`
  },
  {
    id: 'eyes_breathing',
    keywords: ['eye', 'vision', 'screen', '20-20-20', 'breath', 'stress', 'mind', 'కంటి', 'శ్వాస', 'आंख', 'सांस'],
    content: `• 20-20-20 Eye Rest (20s): Look 20ft away for 20s to relax ciliary eye muscles.\n• Deep Diaphragmatic Breathing (60s): Downregulates sympathetic nervous stress.\nAction tag: [nav:library]`
  },
  {
    id: 'guided_break',
    keywords: ['break', 'timer', 'guided', 'start break', 'pause', 'chime', 'విరామం', 'టైమర్', 'ब्रेक', 'टाइमर'],
    content: `• Guided Break: 2-minute posture reset with audio chime and countdown. Shortcuts: Space=Pause, S=Skip, R=Reset, Esc=Quit.\nAction tag: [nav:break]`
  },
  {
    id: 'settings_prefs',
    keywords: ['setting', 'interval', 'dnd', 'meeting', 'sound', 'schedule', 'hour', 'backup', 'సెట్టింగ్', 'సమయం', 'सेटिंग', 'समय'],
    content: `• Settings: Adjust reminder intervals (15-120 mins), work hours, Meeting Mode (DND), sound alerts, and JSON backup.\nAction tag: [nav:settings]`
  },
  {
    id: 'stats_analytics',
    keywords: ['stat', 'analytic', 'sitting', 'hour', 'streak', 'history', 'గణాంకాలు', 'సాధన', 'आंकड़े', 'घंटे'],
    content: `• Analytics: Tracks sitting hours, break completion rates, and weekly consistency streaks.\nAction tag: [nav:statistics]`
  },
  {
    id: 'pricing_credits',
    keywords: ['free', 'price', 'pricing', 'credit', 'cost', 'subscription', 'limit', 'పరిమితి', 'ఉచిత', 'क्रेडिट', 'मुफ्त'],
    content: `• Pricing: 10 free AI queries per day (resets at midnight). Core routines and app features are 100% free with no credit card required.`
  }
];

/**
 * Retrieves the top 1-2 most relevant knowledge chunks based on query keywords (RAG).
 * ponytail: simple keyword scan matches fast client-side in O(n) without vector embeddings library.
 * @param {string} [query]
 * @returns {string}
 */
export function retrieveRelevantKnowledge(query = '') {
  if (!query || typeof query !== 'string') {
    return 'StretchNow is an offline-first workplace wellness app with 7 desk exercises, 2-min guided breaks, and posture reminders. [nav:library]';
  }

  const q = query.toLowerCase();

  // Score chunks by keyword matches
  const matches = [];
  for (const chunk of KNOWLEDGE_CHUNKS) {
    let score = 0;
    for (const kw of chunk.keywords) {
      if (q.includes(kw.toLowerCase())) {
        score++;
      }
    }
    if (score > 0) {
      matches.push({ chunk, score });
    }
  }

  // Sort by score descending and take top 2 chunks
  matches.sort((a, b) => b.score - a.score);
  const selected = matches.slice(0, 2).map(m => m.chunk.content);

  if (selected.length === 0) {
    return 'StretchNow is an offline-first workplace wellness app with 7 desk exercises, 2-min guided breaks, and posture reminders. [nav:library]';
  }

  return selected.join('\n');
}

/**
 * Builds a lean, high-signal system prompt for the AI health coach.
 * Features:
 * - Concise base prompt (~140 tokens)
 * - Dynamic RAG knowledge context (~50-80 tokens)
 * - Strict length limit (60-120 words)
 * 
 * @param {Object} context
 * @returns {string}
 */
export function buildHealthCoachPrompt(context = {}) {
  const {
    occupation = 'Desk Worker',
    breaksCompleted = 0,
    dailyBreakGoal = 6,
    waterCount = 0,
    dailyWaterGoal = 8,
    todaySittingHours = 4,
    streak = 1,
    userName = 'Friend',
    language = 'en',
    query = ''
  } = context;

  const relevantKnowledge = retrieveRelevantKnowledge(query);

  return `You are StretchNow AI, certified desk ergonomics coach for ${userName}.
User: ${occupation}, breaks: ${breaksCompleted}/${dailyBreakGoal}, water: ${waterCount}/${dailyWaterGoal}, sitting: ~${todaySittingHours}h, streak: ${streak}d. Language: ${language}.

=== CONSTRAINTS ===
1. Keep answers direct, friendly, and practical (60–120 words max).
2. Format with bullet points & bold keywords. End with: "Ask if you'd like more details."
3. Safety: Gentle movement only. Stop immediately for sharp pain. Escalation email: support@stretchnow.app [support:contact].
4. Navigation: Use tags [nav:home], [nav:break], [nav:library], [nav:settings], [nav:statistics], [nav:admin] when referencing features.
5. Multilingual: If user writes in Telugu or Hindi, reply natively in that language (Telugu: తెలుగు, Hindi: हिन्दी).

=== RELEVANT CONTEXT ===
${relevantKnowledge}`;
}
