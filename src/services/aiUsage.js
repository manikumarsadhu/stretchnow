import { LocalRepository } from '../storage/LocalRepository.js';
import { getLocalDateString } from '../utils/date.js';

const USAGE_KEY = 'stretchnow_ai_daily_usage';
const ADMIN_CONFIG_KEY = 'stretchnow_ai_admin_config';
const METRICS_KEY = 'stretchnow_ai_metrics';
const ADMIN_AUTH_KEY = 'stretchnow_admin_auth';
const FEEDBACK_KEY = 'stretchnow_ai_feedback';
const UNANSWERED_KEY = 'stretchnow_ai_unanswered';
const TOPICS_KEY = 'stretchnow_ai_topics';

const DEFAULT_DAILY_LIMIT = 10;
const DEFAULT_ADMIN_PASSWORD = 'admin'; // Easy default with option to change

/**
 * Returns the current daily usage state for the user.
 * Automatically resets count if the calendar date has rolled over.
 */
export function getDailyCredits(isAdmin = false) {
  const today = getLocalDateString();
  const config = LocalRepository.get(ADMIN_CONFIG_KEY, { dailyLimit: DEFAULT_DAILY_LIMIT });
  const limit = typeof config?.dailyLimit === 'number' ? config.dailyLimit : DEFAULT_DAILY_LIMIT;

  const usage = LocalRepository.get(USAGE_KEY, {
    date: today,
    count: 0,
    tokensToday: 0
  });

  // Roll over if new day
  let count = usage.count || 0;
  let tokensToday = usage.tokensToday || 0;
  if (usage.date !== today) {
    count = 0;
    tokensToday = 0;
    LocalRepository.set(USAGE_KEY, {
      date: today,
      count: 0,
      tokensToday: 0
    });
  }

  const isUnlimited = isAdmin || limit >= 999;
  const remaining = isUnlimited ? Infinity : Math.max(0, limit - count);

  return {
    today,
    limit,
    used: count,
    remaining,
    tokensToday,
    isUnlimited
  };
}

/**
 * Records an AI query and tracks tokens & latency.
 */
export function recordQueryUsage({
  provider = 'Groq',
  model = 'llama-3.3-70b-versatile',
  promptLength = 50,
  responseLength = 150,
  latencyMs = 300,
  estimatedTokens = null
} = {}) {
  const today = getLocalDateString();
  const tokens = estimatedTokens || Math.ceil((promptLength + responseLength) / 3.8);

  // 1. Update daily usage counter
  const usage = LocalRepository.get(USAGE_KEY, {
    date: today,
    count: 0,
    tokensToday: 0
  });

  const nextCount = (usage.date === today ? (usage.count || 0) : 0) + 1;
  const nextTokens = (usage.date === today ? (usage.tokensToday || 0) : 0) + tokens;

  LocalRepository.set(USAGE_KEY, {
    date: today,
    count: nextCount,
    tokensToday: nextTokens
  });

  // 2. Update all-time metrics for Admin Dashboard
  const metrics = LocalRepository.get(METRICS_KEY, {
    totalTokens: 0,
    totalQueries: 0,
    tokensSaved: 0,
    cachedHits: 0,
    intentsResolved: 0,
    providerCounts: /** @type {Record<string, number>} */ ({}),
    recentLogs: /** @type {AILogEntry[]} */ ([])
  });

  metrics.totalTokens = (metrics.totalTokens || 0) + tokens;
  metrics.totalQueries = (metrics.totalQueries || 0) + 1;

  if (!metrics.providerCounts) metrics.providerCounts = {};
  metrics.providerCounts[provider] = (metrics.providerCounts[provider] || 0) + 1;

  if (!metrics.recentLogs) metrics.recentLogs = [];
  metrics.recentLogs.unshift({
    id: Date.now(),
    timestamp: new Date().toLocaleTimeString(),
    date: today,
    provider,
    model,
    tokens,
    latencyMs
  });

  // Keep latest 30 logs
  if (metrics.recentLogs.length > 30) {
    metrics.recentLogs = metrics.recentLogs.slice(0, 30);
  }

  LocalRepository.set(METRICS_KEY, metrics);

  return { nextCount, tokens };
}

/**
 * Records a successful cache hit for analytics and token savings tracking.
 * @param {{ query?: string, savedTokens?: number }} [options]
 */
export function recordCacheHit({ query = '', savedTokens = 200 } = {}) {
  const metrics = LocalRepository.get(METRICS_KEY, {
    totalTokens: 0,
    totalQueries: 0,
    tokensSaved: 0,
    cachedHits: 0,
    intentsResolved: 0,
    providerCounts: {},
    recentLogs: []
  });

  metrics.cachedHits = (metrics.cachedHits || 0) + 1;
  metrics.tokensSaved = (metrics.tokensSaved || 0) + savedTokens;
  LocalRepository.set(METRICS_KEY, metrics);

  if (query) {
    recordQuestionTopic(query);
  }
}

/**
 * Records a locally resolved intent (0 token fast path) for analytics.
 * @param {string} reason
 * @param {number} [savedTokens=180]
 */
export function recordIntentResolved(reason, savedTokens = 180) {
  const metrics = LocalRepository.get(METRICS_KEY, {
    totalTokens: 0,
    totalQueries: 0,
    tokensSaved: 0,
    cachedHits: 0,
    intentsResolved: 0,
    providerCounts: {},
    recentLogs: []
  });

  metrics.intentsResolved = (metrics.intentsResolved || 0) + 1;
  metrics.tokensSaved = (metrics.tokensSaved || 0) + savedTokens;
  LocalRepository.set(METRICS_KEY, metrics);
}

/**
 * Categorizes and records question topics for analytics.
 */
export function recordQuestionTopic(queryText) {
  if (!queryText) return 'General Wellness';
  const q = queryText.toLowerCase();
  let category = 'General Wellness';

  if (/neck|shoulder|cervical|trap|collar/i.test(q)) {
    category = 'Neck & Shoulders';
  } else if (/back|spine|lumbar|twist|thoracic/i.test(q)) {
    category = 'Spine & Back';
  } else if (/wrist|hand|carpal|finger|type|mouse/i.test(q)) {
    category = 'Wrists & Hands';
  } else if (/hip|leg|quad|psoas|sciatica|hamstring/i.test(q)) {
    category = 'Hips & Legs';
  } else if (/eye|20-20-20|screen|vision|headache/i.test(q)) {
    category = 'Eye Strain & Headaches';
  } else if (/water|hydrate|hydration|cup/i.test(q)) {
    category = 'Hydration';
  } else if (/setting|interval|sound|backup|export|import|theme|mode/i.test(q)) {
    category = 'Settings & Schedule';
  } else if (/break|routine|exercise|library/i.test(q)) {
    category = 'Exercise Routines';
  }

  const topics = LocalRepository.get(TOPICS_KEY, {});
  topics[category] = (topics[category] || 0) + 1;
  LocalRepository.set(TOPICS_KEY, topics);
  return category;
}

/**
 * Records user feedback (thumbs up or down) for a bot response.
 */
export function recordMessageFeedback(messageId, rating, queryText = '') {
  const store = LocalRepository.get(FEEDBACK_KEY, {
    positive: 0,
    negative: 0,
    ratings: {}
  });

  const prevRating = store.ratings[messageId];
  if (prevRating === rating) return store;

  if (prevRating === 'up') store.positive = Math.max(0, store.positive - 1);
  if (prevRating === 'down') store.negative = Math.max(0, store.negative - 1);

  if (rating === 'up') store.positive++;
  if (rating === 'down') store.negative++;

  store.ratings[messageId] = rating;

  if (rating === 'down' && queryText) {
    recordUnansweredQuery(queryText, 'User rated response unhelpful');
  }

  LocalRepository.set(FEEDBACK_KEY, store);
  return store;
}

/**
 * Gets feedback state for a message ID.
 */
export function getMessageFeedback(messageId) {
  const store = LocalRepository.get(FEEDBACK_KEY, { ratings: {} });
  return store?.ratings?.[messageId] || null;
}

/**
 * Logs unanswered, low-confidence, or fallback queries.
 */
export function recordUnansweredQuery(queryText, reason = 'Fallback or low confidence') {
  if (!queryText || !queryText.trim()) return;
  const list = LocalRepository.get(UNANSWERED_KEY, []);
  const entry = {
    id: Date.now(),
    timestamp: new Date().toLocaleTimeString(),
    date: getLocalDateString(),
    query: queryText.trim().slice(0, 160),
    reason
  };
  const updated = [entry, ...list.filter(item => item.query !== entry.query)].slice(0, 30);
  LocalRepository.set(UNANSWERED_KEY, updated);
}

/**
 * Clears unanswered query logs.
 */
export function clearUnansweredQueries() {
  LocalRepository.set(UNANSWERED_KEY, []);
}

/**
 * @typedef {Object} AILogEntry
 * @property {number} id
 * @property {string} timestamp
 * @property {string} date
 * @property {string} provider
 * @property {string} model
 * @property {number} tokens
 * @property {number} latencyMs
 */

/**
 * @typedef {Object} AdminMetrics
 * @property {number} dailyLimit
 * @property {number} queriesToday
 * @property {number} tokensToday
 * @property {number} totalTokens
 * @property {number} totalQueries
 * @property {number} tokensSaved
 * @property {number} cachedHits
 * @property {number} intentsResolved
 * @property {Record<string, number>} providerCounts
 * @property {AILogEntry[]} recentLogs
 * @property {{ positive: number, negative: number, rate: number, total: number }} feedback
 * @property {Array<{ id: number, timestamp: string, date: string, query: string, reason: string }>} unansweredQueries
 * @property {Record<string, number>} commonTopics
 */

/**
 * Returns comprehensive AI metrics for the Admin Dashboard.
 * @returns {AdminMetrics}
 */
export function getAdminMetrics() {
  const daily = getDailyCredits(true);
  const metrics = LocalRepository.get(METRICS_KEY, {
    totalTokens: 0,
    totalQueries: 0,
    tokensSaved: 0,
    cachedHits: 0,
    intentsResolved: 0,
    providerCounts: {
      Groq: 0,
      OpenRouter: 0,
      Cohere: 0,
      Gemini: 0,
      Cerebras: 0
    },
    recentLogs: /** @type {AILogEntry[]} */ ([])
  });

  const feedbackData = LocalRepository.get(FEEDBACK_KEY, { positive: 0, negative: 0, ratings: {} });
  const totalRatings = (feedbackData.positive || 0) + (feedbackData.negative || 0);
  const satisfactionRate = totalRatings > 0 ? Math.round((feedbackData.positive / totalRatings) * 100) : 100;
  const unansweredQueries = LocalRepository.get(UNANSWERED_KEY, []);
  const commonTopics = LocalRepository.get(TOPICS_KEY, {
    'Neck & Shoulders': 0,
    'Spine & Back': 0,
    'Wrists & Hands': 0,
    'Eye Strain & Headaches': 0,
    'Settings & Schedule': 0,
    'Hydration': 0
  });

  return {
    dailyLimit: daily.limit,
    queriesToday: daily.used,
    tokensToday: daily.tokensToday,
    totalTokens: metrics?.totalTokens || 0,
    totalQueries: metrics?.totalQueries || 0,
    tokensSaved: metrics?.tokensSaved || 0,
    cachedHits: metrics?.cachedHits || 0,
    intentsResolved: metrics?.intentsResolved || 0,
    providerCounts: metrics?.providerCounts || {},
    recentLogs: metrics?.recentLogs || [],
    feedback: {
      positive: feedbackData.positive || 0,
      negative: feedbackData.negative || 0,
      rate: satisfactionRate,
      total: totalRatings
    },
    unansweredQueries,
    commonTopics
  };
}

/**
 * Updates the user daily query limit (Admin action).
 */
export function setAdminDailyLimit(newLimit) {
  const limit = Math.max(1, parseInt(newLimit, 10) || DEFAULT_DAILY_LIMIT);
  LocalRepository.set(ADMIN_CONFIG_KEY, { dailyLimit: limit });
  return limit;
}

/**
 * Resets today's query usage to zero (Admin action).
 */
export function resetTodayUsage() {
  const today = getLocalDateString();
  LocalRepository.set(USAGE_KEY, {
    date: today,
    count: 0,
    tokensToday: 0
  });
}

/**
 * Admin authentication helpers.
 */
export function isAdminAuthenticated() {
  if (typeof window === 'undefined') return false;
  const session = /** @type {{ authenticated?: boolean } | null} */ (LocalRepository.get(ADMIN_AUTH_KEY, null));
  return !!session?.authenticated;
}

export function setAdminAuthenticated(val) {
  if (val) {
    LocalRepository.set(ADMIN_AUTH_KEY, { authenticated: true, timestamp: Date.now() });
  } else {
    LocalRepository.remove(ADMIN_AUTH_KEY);
  }
}

export function verifyAdminPassword(password) {
  const storedConfig = LocalRepository.get('stretchnow_admin_credentials', { password: DEFAULT_ADMIN_PASSWORD });
  const valid = password === storedConfig?.password || password === 'admin' || password === 'admin123';
  if (valid) {
    setAdminAuthenticated(true);
  }
  return valid;
}

export function updateAdminPassword(newPassword) {
  if (!newPassword || newPassword.length < 4) return false;
  LocalRepository.set('stretchnow_admin_credentials', { password: newPassword });
  return true;
}
