/**
 * StretchNow AI Response Cache
 * 
 * Token Saving Optimization #4:
 * Caches answers to frequent queries (preset chips, FAQs, repeated user questions).
 * Hits return in <2ms with 0 tokens consumed and 0 API cost.
 */

import { LocalRepository } from '../storage/LocalRepository.js';

const CACHE_STORAGE_KEY = 'stretchnow_ai_response_cache';
const MAX_CACHE_ENTRIES = 60;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Normalizes a query for consistent cache lookup.
 * Strips leading/trailing emojis, symbols, and collapses whitespace.
 * 
 * @param {string} query 
 * @param {string} [lang='en']
 * @returns {string}
 */
export function normalizeCacheKey(query, lang = 'en') {
  if (!query || typeof query !== 'string') return '';
  const cleaned = query
    .toLowerCase()
    // Strip emojis
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '')
    // Strip punctuation
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?'"“”]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return `${lang || 'en'}:${cleaned}`;
}

// In-memory memory layer for instant lookup
const memoryCache = new Map();

/**
 * Pre-seeded high quality answers for default multilingual quick chips.
 * Ensures initial clicks on chip suggestions cost 0 tokens.
 */
const SEED_RESPONSES = {
  // English
  'en:relieve neck shoulder tension': `💡 **Quick Neck & Shoulder Relief**:\n• **Gentle Neck Release (30s)**: Sit tall, gently tilt right ear to right shoulder for 15s, then switch sides.\n• **Shoulder Blade Rolls (30s)**: Roll shoulders up, back, and down 5 times while taking deep breaths.\n• Keep your chin tucked slightly to prevent forward-head posture.\n\nPractice in [nav:library] or start a [nav:break]. Ask if you'd like more details.`,
  
  'en:how much water while sitting': `💧 **Hydration for Desk Workers**:\n• Aim for **8–10 cups (2–2.5 liters)** of water spread across your working hours.\n• Drink a glass every 60–90 minutes; it also naturally prompts you to stand up and walk.\n• Limit excess caffeine which dehydrates intervertebral spinal discs.\n\nLog your intake in the [nav:home] tracker. Ask if you'd like more details.`,

  'en:explain 20 20 20 eye rule': `👀 **The 20-20-20 Eye Rest Rule**:\n• Every **20 minutes**, shift your gaze away from the screen.\n• Look at an object at least **20 feet (6 meters)** away.\n• Hold your focus there for at least **20 seconds** and blink 5 times.\n• Relaxes the ciliary muscles in your eyes and prevents digital eye strain.\n\nTry the guided routine in [nav:library]. Ask if you'd like more details.`,

  'en:2 minute office stretch routine': `🏃 **2-Minute Office Reset**:\n1. **Shoulder Blade Rolls (30s)**: Open chest and loosen trapezius.\n2. **Seated Spinal Twist (30s)**: Decompress lumbar spine.\n3. **Wrist & Forearm Stretch (30s)**: Relieve typing strain.\n4. **Deep Belly Breaths (30s)**: Inhale 4s, exhale 6s to lower cortisol.\n\nStart your interactive timer now in [nav:break]. Ask if you'd like more details.`,

  'en:ideal ergonomic chair setup': `🪑 **Ergonomic Chair Setup Checklist**:\n• **Seat Height**: Knees at 90° with feet flat on the floor or footrest.\n• **Lumbar Support**: Fit curved cushion into the small of your lower back.\n• **Armrests**: Elbows resting gently at 90°, shoulders relaxed.\n• **Screen**: Top third of monitor level with eye line, arm's length away.\n\nNeed to adjust work intervals? Visit [nav:settings]. Ask if you'd like more details.`,

  'en:where to set reminder interval': `⚙️ **Setting Stretch Reminder Intervals**:\n• Go to **Preferences & Settings** in the app.\n• Choose your reminder frequency from **15 to 120 minutes** (45–60 mins recommended).\n• Configure sound chimes, Meeting Mode (DND), and daily working hours.\n\nClick here to customize: [nav:settings]. Ask if you'd like more details.`,

  // Telugu
  'te:మెడ భుజాల నొప్పి నివారణ వ్యాయామాలు': `💡 **మెడ, భుజాల ఉపశమనం**:\n• **మెడ సాగదీయడం (30 సెకన్లు)**: తల నిటారుగా ఉంచి, కుడి చెవిని కుడి భుజం వైపు మెల్లగా వంచండి. 15 సెకన్ల తర్వాత ఎడమ వైపు చేయండి.\n• **భుజాల రోలింగ్ (30 సెకన్లు)**: భుజాలను వెనుకకు 5 సార్లు గుండ్రంగా తిప్పండి.\n\nపూర్తి రొటీన్ కోసం [nav:library] లేదా [nav:break] చూడండి. మరిన్ని వివరాలు కావాలంటే అడగండి.`,

  'te:డెస్క్ వద్ద రోజూ ఎంత నీరు తాగాలి': `💧 **డెస్క్ వద్ద నీటి అవసరం**:\n• పని గంటలలో రోజుకు **8–10 గ్లాసుల (2–2.5 లీటర్లు)** నీరు త్రాగండి.\n• ప్రతి 60–90 నిమిషాలకు ఒక గ్లాసు నీరు త్రాగడం వల్ల శరీరం డీహైడ్రేషన్ బారిన పడకుండా ఉంటుంది.\n\nమీ రోజువారీ నీటిని [nav:home]లో ట్రాక్ చేయండి. మరిన్ని వివరాలు కావాలంటే అడగండి.`,

  'te:20 20 20 కంటి విశ్రాంతి సూత్రం ఏమిటి': `👀 **20-20-20 కంటి నియమం**:\n• ప్రతి **20 నిమిషాల** పని తర్వాత స్క్రీన్ నుండి చూపు తిప్పండి.\n• **20 అడుగుల** దూరంలో ఉన్న వస్తువును **20 సెకన్ల** పాటు చూడండి.\n• 5 సార్లు నెమ్మదిగా కనురెప్పలు వేయండి. ఇది కంటి అలసటను తగ్గిస్తుంది.\n\nరొటీన్ కోసం [nav:library] చూడండి. మరిన్ని వివరాలు కావాలంటే అడగండి.`,

  // Hindi
  'hi:गर्दन और कंधों के दर्द के लिए स्ट्रेच': `💡 **गर्दन और कंधों के लिए तुरंत राहत**:\n• **गर्दन का स्ट्रेच (30 सेकंड)**: सीधे बैठें, सिर को धीरे से दाएं कंधे की ओर झुकाएं (15 सेकंड), फिर बाएं तरफ दोहराएं।\n• **कंधे घुमाना (30 सेकंड)**: कंधों को 5 बार पीछे की ओर गोल घुमाएं।\n\nपूरी एक्सरसाइज के लिए [nav:library] या [nav:break] देखें। अधिक जानकारी के लिए पूछें।`,

  'hi:काम के दौरान कितना पानी पीना चाहिए': `💧 **डेस्क पर पानी की आवश्यकता**:\n• काम के दौरान रोजाना **8–10 गिलास (2–2.5 लीटर)** पानी जरूर पिएं।\n• हर 1–1.5 घंटे में एक गिलास पानी पीने से ताजगी बनी रहती है और रीढ़ की हड्डी स्वस्थ रहती है।\n\nअपने पानी का हिसाब [nav:home] में दर्ज करें। अधिक जानकारी के लिए पूछें।`,

  'hi:20 20 20 आंखों का नियम समझाइए': `👀 **20-20-20 आंखों का नियम**:\n• हर **20 मिनट** के स्क्रीन वर्क के बाद,\n• कम से कम **20 फीट** की दूरी पर किसी वस्तु को,\n• **20 सेकंड** तक देखें और पलकें झपकाएं।\n• यह आंखों की थकान और खिंचाव को दूर करता है।\n\nगाइडेड एक्सरसाइज के लिए [nav:library] देखें। अधिक जानकारी के लिए पूछें।`
};

/**
 * Initializes memory cache from localStorage and seed data
 */
function initCache() {
  if (memoryCache.size > 0) return;

  // 1. Load seed responses
  for (const [key, response] of Object.entries(SEED_RESPONSES)) {
    memoryCache.set(key, { response, timestamp: Date.now() });
  }

  // 2. Hydrate from persistent store
  try {
    const stored = LocalRepository.get(CACHE_STORAGE_KEY, {});
    const now = Date.now();
    for (const [key, item] of Object.entries(stored)) {
      if (item && item.response && (now - item.timestamp < CACHE_TTL_MS)) {
        memoryCache.set(key, item);
      }
    }
  } catch (err) {
    console.warn('Could not hydrate AI cache:', err);
  }
}

/**
 * Gets a cached answer if available and not expired.
 * 
 * @param {string} query 
 * @param {string} [lang='en']
 * @returns {string | null}
 */
export function getCachedResponse(query, lang = 'en') {
  initCache();
  const key = normalizeCacheKey(query, lang);
  if (!key) return null;

  const entry = memoryCache.get(key);
  if (!entry) return null;

  // Check TTL
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    memoryCache.delete(key);
    persistCache();
    return null;
  }

  return entry.response;
}

/**
 * Stores an AI response in both memory and localStorage with LRU eviction.
 * 
 * @param {string} query 
 * @param {string} lang 
 * @param {string} response 
 */
export function setCachedResponse(query, lang = 'en', response) {
  if (!query || !response) return;
  initCache();

  const key = normalizeCacheKey(query, lang);
  if (!key) return;

  // Evict oldest entry if at capacity
  if (memoryCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }

  memoryCache.set(key, {
    response: response.trim(),
    timestamp: Date.now()
  });

  persistCache();
}

/**
 * Saves current memory cache entries to LocalRepository
 */
function persistCache() {
  try {
    const obj = {};
    for (const [k, v] of memoryCache.entries()) {
      obj[k] = v;
    }
    LocalRepository.set(CACHE_STORAGE_KEY, obj);
  } catch (err) {
    console.warn('Could not persist AI cache:', err);
  }
}

/**
 * Resets and clears the AI response cache.
 */
export function clearAICache() {
  memoryCache.clear();
  try {
    LocalRepository.set(CACHE_STORAGE_KEY, {});
  } catch {
    // Ignore in non-browser env
  }
}

/**
 * Returns cache statistics for Admin diagnostics
 * @returns {{ size: number, max: number }}
 */
export function getCacheStats() {
  initCache();
  return {
    size: memoryCache.size,
    max: MAX_CACHE_ENTRIES
  };
}
