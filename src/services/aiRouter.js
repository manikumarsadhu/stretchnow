/**
 * StretchNow Intent-Based AI Router
 * 
 * Token Saving Optimization #5:
 * Intercepts predictable, deterministic queries (greetings, navigation,
 * gratitude, health status, and medical red flags) directly in local code.
 * 
 * Benefits:
 * - 0 tokens consumed
 * - 0ms network latency
 * - Preserves user daily query credits
 */

/**
 * Normalizes input string for pattern matching
 * @param {string} text 
 * @returns {string}
 */
function cleanQuery(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?'"“”]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolves deterministic user intents locally without calling an LLM.
 * 
 * @param {string} rawQuery - The user's input text
 * @param {Object} [userContext] - User preferences and daily statistics
 * @returns {{ handled: boolean, response?: string, reason?: string }}
 */
export function resolveLocalIntent(rawQuery, userContext = {}) {
  const q = cleanQuery(rawQuery);
  if (!q) return { handled: false };

  const {
    userName = 'Friend',
    language = 'en',
    breaksCompleted = 0,
    dailyBreakGoal = 6,
    waterCount = 0,
    dailyWaterGoal = 8,
    todaySittingHours = 4,
    streak = 1
  } = userContext;

  // 1. GREETING INTENT
  // en: hi, hello, hey, good morning, good afternoon, good evening, howdy (with optional 'there', 'coach', etc.)
  // te: నమస్కారం, నమస్తే, హలో
  // hi: नमस्ते, नमस्कार, हेलो, सुप्रभात
  const greetingRegex = /^(hi|hello|hey|hiya|howdy|greetings|namaste|namaskar|good\s+(morning|afternoon|evening)|నమస్కారం|నమస్తే|హలో|नमस्ते|नमस्कार|हेलो|सुप्रभात)(\s+(there|coach|assistant|friend|everyone|team|all))?$/i;
  if (greetingRegex.test(q)) {
    let response;
    if (language === 'te' || /నమస్కారం|నమస్తే|హలో/i.test(rawQuery)) {
      response = `👋 నమస్కారం **${userName}**! నేను మీ స్ట్రెచ్‌నౌ హెల్త్ అసిస్టెంట్‌ని. ఈరోజు మీ డెస్క్ సౌకర్యం ఎలా ఉంది? డెస్క్ స్ట్రెచ్‌లు, వాటర్ రిమైండర్లు లేదా యాప్ ఫీచర్ల గురించి ఏదైనా అడగండి!\n\n• [nav:library] లేదా [nav:break]తో తక్షణమే ప్రారంభించండి.`;
    } else if (language === 'hi' || /नमस्ते|नमस्कार|हेलो|सुप्रभात/i.test(rawQuery)) {
      response = `👋 नमस्ते **${userName}**! मैं आपका स्ट्रेचनाउ हेल्थ असिस्टेंट हूँ। आज आप अपनी डेस्क पर कैसा महसूस कर रहे हैं? गर्दन/कमर के स्ट्रेच, पानी के रिमाइंडर या किसी भी फ़ीचर के बारे में पूछें!\n\n• तुरंत शुरू करने के लिए [nav:library] या [nav:break] पर क्लिक करें।`;
    } else {
      response = `👋 Hi **${userName}**! I'm your StretchNow Health & Ergonomics Assistant.\nHow can I help you feel better at your desk today? Ask me about quick stretches, posture tips, or navigating any StretchNow feature!\n\n• Jump right in: [nav:break] or browse exercises in [nav:library].`;
    }
    return { handled: true, response, reason: 'greeting' };
  }

  // 2. GRATITUDE & FAREWELL INTENT
  const farewellRegex = /^(thank\s*you|thanks|thx|bye|goodbye|see\s*you|take\s*care|ధన్యవాదాలు|సెలవు|धन्यवाद|अलविदा)(\s+(so\s+much|a\s+lot|very\s+much|there|coach|assistant))?$/i;
  if (farewellRegex.test(q)) {
    let response;
    if (language === 'te' || /ధన్యవాదాలు|సెలవు/i.test(rawQuery)) {
      response = `మీకు స్వాగతం! నిటారుగా కూర్చోండి, క్రమం తప్పకుండా మైక్రో-బ్రేక్‌లు తీసుకోండి మరియు తగినంత నీరు త్రాగండి. మీకు ఆరోగ్యకరమైన పనిదినం కలగాలని ఆశిస్తున్నాను! 🌟`;
    } else if (language === 'hi' || /धन्यवाद|अलविदा/i.test(rawQuery)) {
      response = `आपका स्वागत है! सीधे बैठें, नियमित रूप से छोटे ब्रेक लें और पर्याप्त पानी पिएं। आपका कार्यदिवस स्वस्थ और सुखद रहे! 🌟`;
    } else {
      response = `You're very welcome, **${userName}**! Remember to sit tall, roll your shoulders back, and stay hydrated. Have a productive and healthy workday! 🌟`;
    }
    return { handled: true, response, reason: 'farewell' };
  }

  // 3. CLINICAL RED FLAGS & MEDICAL ESCALATION (Strict safety boundary)
  const redFlagRegex = /\b(chest pain|heart attack|shooting pain|numbness in arm|loss of feeling|severe injury|can t breathe|radiating down leg|acute emergency)\b/i;
  if (redFlagRegex.test(q)) {
    const response = `🚨 **Urgent Medical Notice**:\nIf you are experiencing severe, acute, radiating pain, numbness, or chest discomfort, **do not attempt any desk stretches**.\n\nPlease stop working and immediately seek emergency medical attention or consult a qualified physician or physical therapist.\n\nFor app questions or human support: [support:contact] or support@stretchnow.app.`;
    return { handled: true, response, reason: 'medical_safety' };
  }

  // 4. DIRECT NAVIGATION INTENT
  // Settings & Preferences
  if (/\b(where is settings|open settings|go to settings|change interval|set timer|change sound|dnd mode|meeting mode|change theme)\b/i.test(q)) {
    const response = `⚙️ You can adjust reminder intervals (15–120 mins), work hours, audio chimes, Meeting Mode (DND), and color themes in **Settings**:\n\n[nav:settings]`;
    return { handled: true, response, reason: 'nav_settings' };
  }

  // Exercise Library
  if (/\b(where are exercises|open library|go to library|show stretches|exercise list|browse routines|exercise catalog)\b/i.test(q)) {
    const response = `🧘 Browse all 7 certified desk exercises for neck, shoulders, spine, wrists, hips, and eyes in the **Exercise Library**:\n\n[nav:library]`;
    return { handled: true, response, reason: 'nav_library' };
  }

  // Guided Break Session
  if (/\b(start break|take a break|guided break|start stretch|begin session|2 minute break|ready to stretch)\b/i.test(q)) {
    const response = `⏱️ Ready for a quick 2-minute posture reset? Start your guided micro-break session with timer and audio chimes now:\n\n[nav:break]`;
    return { handled: true, response, reason: 'nav_break' };
  }

  // Analytics & Statistics
  if (/\b(my stats|sitting hours|show analytics|view progress|how long sat|streak history|health score)\b/i.test(q)) {
    const response = `📊 View your sitting hours breakdown, daily break completion rate, and weekly consistency streaks in **Analytics**:\n\n[nav:statistics]`;
    return { handled: true, response, reason: 'nav_statistics' };
  }

  // Admin Console
  if (/\b(open admin|admin console|super admin|model failover|admin settings|ai telemetry)\b/i.test(q)) {
    const response = `🛡️ Access multi-model AI failover telemetry, provider ping health, and daily credit controls in the **Admin Console**:\n\n[nav:admin]`;
    return { handled: true, response, reason: 'nav_admin' };
  }

  // 5. TODAY'S PROGRESS / ACTIVITY SNAPSHOT
  if (/\b(my progress|today progress|how many breaks today|water status|how much water today|daily status|today stats)\b/i.test(q)) {
    const response = `📊 **Today's Activity Snapshot**:\n• Completed Breaks: **${breaksCompleted} / ${dailyBreakGoal}**\n• Water Logged: **${waterCount} / ${dailyWaterGoal}** cups\n• Sitting Time: **~${todaySittingHours}** hours\n• Active Streak: **${streak}** day${streak === 1 ? '' : 's'} 🔥\n\nKeep moving and staying hydrated! [nav:home]`;
    return { handled: true, response, reason: 'status_snapshot' };
  }

  // No deterministic match found -> fall through to cache or LLM
  return { handled: false };
}
