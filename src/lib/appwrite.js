import { Client, Account, Databases, ID, Query } from "appwrite";

const APPWRITE_ENDPOINT = "https://fra.cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = "6a5e1ace0000d7425757";

const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);

const DATABASE_ID = "6a5e1dd9003a5437c98e";
const COLLECTION_PROGRESS_ID = "user_progress";

// Collection IDs mapping
const COLLECTION_PROFILES_ID = "profiles";
const COLLECTION_SETTINGS_ID = "settings";
const COLLECTION_DAILY_LOGS_ID = "daily_logs";
const COLLECTION_ACHIEVEMENTS_ID = "achievements";
const COLLECTION_STATISTICS_ID = "statistics";

/**
 * Register a new user with Email and Password
 */
export async function registerWithEmail(email, password, name) {
  const user = await account.create(ID.unique(), email, password, name);
  await loginWithEmail(email, password);
  return user;
}

/**
 * Log in with Email and Password
 */
export async function loginWithEmail(email, password) {
  if (typeof account.createEmailPasswordSession === 'function') {
    return await account.createEmailPasswordSession(email, password);
  } else if (typeof /** @type {any} */(account).createEmailSession === 'function') {
    return await /** @type {any} */(account).createEmailSession(email, password);
  }
  throw new Error("Email login method unavailable in current SDK");
}

/**
 * Log in Anonymously as a guest
 */
export async function loginAnonymous() {
  return await account.createAnonymousSession();
}

/**
 * Log in with OAuth provider ('google' | 'github' | 'apple')
 */
export function loginWithOAuth(provider = 'google') {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  return account.createOAuth2Session(
    /** @type {any} */(provider),
    `${origin}/?auth=success`,
    `${origin}/?auth=failure`
  );
}

/**
 * Get currently authenticated Appwrite user
 */
export async function getCurrentUser() {
  try {
    return await account.get();
  } catch {
    return null;
  }
}

/**
 * Log out current Appwrite session
 */
export async function logoutUser() {
  try {
    return await account.deleteSession('current');
  } catch (err) {
    console.warn("Logout error:", err);
    return null;
  }
}

/**
 * Generic sync helper that updates a document, or creates it if not found.
 */
async function syncCollectionDocument(collectionId, docId, data) {
  try {
    return await databases.updateDocument(DATABASE_ID, collectionId, docId, data);
  } catch (err) {
    if (/** @type {any} */(err)?.code === 404) {
      try {
        return await databases.createDocument(DATABASE_ID, collectionId, docId, data);
      } catch (createErr) {
        console.error(`Failed to create document in collection ${collectionId}:`, createErr);
        throw createErr;
      }
    }
    throw err;
  }
}

export async function syncProfile(userId, data) {
  return syncCollectionDocument(COLLECTION_PROFILES_ID, userId, {
    userId,
    displayName: data.displayName || 'Friend',
    email: data.email || '',
    language: data.language || 'en',
    theme: data.theme || 'system',
    occupation: data.occupation || '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    updatedAt: new Date().toISOString()
  });
}

export async function syncSettings(userId, data) {
  return syncCollectionDocument(COLLECTION_SETTINGS_ID, userId, {
    reminderInterval: data.reminderIntervalMinutes || 45,
    workStart: data.workStart || '09:00',
    workEnd: data.workEnd || '17:00',
    weekendMode: !!data.smartSchedule?.weekendMode,
    lunchStart: data.smartSchedule?.lunchStart || '12:00',
    lunchEnd: data.smartSchedule?.lunchEnd || '13:00',
    notificationEnabled: !!data.notificationsEnabled,
    waterGoal: data.dailyWaterGoal || 8,
    breakGoal: data.dailyBreakGoal || 6,
    largeText: !!data.largeTextEnabled,
    highContrast: !!data.highContrastEnabled,
    updatedAt: new Date().toISOString()
  });
}

export async function syncDailyLog(userId, dateStr, data) {
  const docId = `${userId}_${dateStr}`;
  return syncCollectionDocument(COLLECTION_DAILY_LOGS_ID, docId, {
    userId,
    date: dateStr,
    breaksCompleted: data.breaksCompleted || 0,
    breaksSkipped: data.breaksSkipped || 0,
    stretchMinutes: data.stretchMinutes || 0,
    waterCups: data.waterCups || 0,
    sittingMinutes: data.sittingMinutes || 480,
    wellnessScore: data.wellnessScore || 100,
    xpEarned: data.xpEarned || 0,
    mood: data.mood || '🙂',
    notes: data.notes || '',
    updatedAt: new Date().toISOString()
  });
}

export async function syncAchievement(userId, badgeId) {
  const docId = `${userId}_${badgeId}`;
  return syncCollectionDocument(COLLECTION_ACHIEVEMENTS_ID, docId, {
    userId,
    badgeId,
    unlockedAt: new Date().toISOString()
  });
}

export async function syncStatistics(userId, data) {
  return syncCollectionDocument(COLLECTION_STATISTICS_ID, userId, {
    totalBreaks: data.totalBreaks || 0,
    totalWater: data.totalWater || 0,
    totalXP: data.totalXP || 0,
    level: data.level || 1,
    currentStreak: data.currentStreak || 1,
    longestStreak: data.longestStreak || 1,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Subscribes to realtime updates for user collections.
 */
export function subscribeToDatabaseChanges(userId, callback) {
  const collectionPaths = [
    `databases.${DATABASE_ID}.collections.${COLLECTION_PROFILES_ID}.documents.${userId}`,
    `databases.${DATABASE_ID}.collections.${COLLECTION_SETTINGS_ID}.documents.${userId}`,
    `databases.${DATABASE_ID}.collections.${COLLECTION_STATISTICS_ID}.documents.${userId}`
  ];

  return client.subscribe(collectionPaths, (response) => {
    callback(response);
  });
}

export { client, account, databases, ID, Query, DATABASE_ID, COLLECTION_PROGRESS_ID };

