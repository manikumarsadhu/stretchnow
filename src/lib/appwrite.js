import { Client, Account, Databases, Storage, ID, Query, Permission, Role } from "appwrite";

const APPWRITE_ENDPOINT = import.meta.env?.VITE_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = import.meta.env?.VITE_APPWRITE_PROJECT_ID || "6a5e1ace0000d7425757";

const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

const DATABASE_ID = import.meta.env?.VITE_APPWRITE_DATABASE_ID || "6a5e1dd9003a5437c98e";
const BUCKET_VIDEOS_ID = import.meta.env?.VITE_APPWRITE_BUCKET_ID || "6a6af1340022b62d45a4";
const COLLECTION_PROGRESS_ID = import.meta.env?.VITE_APPWRITE_COLLECTION_PROGRESS_ID || "user_progress";

// Collection IDs mapping (support env variable overrides)
const COLLECTION_PROFILES_ID = import.meta.env?.VITE_APPWRITE_COLLECTION_PROFILES_ID || "profiles";
const COLLECTION_SETTINGS_ID = import.meta.env?.VITE_APPWRITE_COLLECTION_SETTINGS_ID || "settings";
const COLLECTION_DAILY_LOGS_ID = import.meta.env?.VITE_APPWRITE_COLLECTION_DAILY_LOGS_ID || "daily_logs";
const COLLECTION_ACHIEVEMENTS_ID = import.meta.env?.VITE_APPWRITE_COLLECTION_ACHIEVEMENTS_ID || "achievements";
const COLLECTION_STATISTICS_ID = import.meta.env?.VITE_APPWRITE_COLLECTION_STATISTICS_ID || "statistics";

/**
 * Returns document-level security permissions restricting read, update, and delete access strictly to the document owner.
 * @param {string} userId
 */
export function getOwnerPermissions(userId) {
  if (!userId) return [];
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId))
  ];
}

/**
 * Checks if an Appwrite Exception is caused by a non-existent Database Collection.
 * @param {any} err
 * @returns {boolean}
 */
export function isCollectionNotFoundError(err) {
  if (!err) return false;
  const type = String(err.type || '');
  const message = String(err.message || '').toLowerCase();
  
  // Document not found (404) is expected for new users, not a collection missing error
  if (type === 'document_not_found' || message.includes('document with the requested id')) {
    return false;
  }

  return type === 'collection_not_found' ||
         (message.includes('collection') && message.includes('not found') && !message.includes('document'));
}

/**
 * Gets direct public URL for exercise video stored in Appwrite Storage Bucket
 * @param {string} fileId
 * @returns {string}
 */
export function getAppwriteStorageVideoUrl(fileId) {
  return `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_VIDEOS_ID}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`;
}

/**
 * Uploads exercise video to Appwrite Cloud Storage
 * @param {File} file
 * @param {string} [customFileId]
 */
export async function uploadExerciseVideoToStorage(file, customFileId) {
  const fileId = customFileId || ID.unique();
  return await storage.createFile(BUCKET_VIDEOS_ID, fileId, file);
}

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
 * Automatically attaches strict document-level user permissions upon document creation.
 */
async function syncCollectionDocument(collectionId, docId, data, userId) {
  try {
    return await databases.updateDocument(DATABASE_ID, collectionId, docId, data);
  } catch (err) {
    const errCode = /** @type {any} */(err)?.code;

    // If update failed because document does not exist yet (404/401/403), fallback to createDocument
    if (errCode === 404 || errCode === 401 || errCode === 403 || String(err).includes('404')) {
      try {
        const permissions = userId ? getOwnerPermissions(userId) : undefined;
        return await databases.createDocument(DATABASE_ID, collectionId, docId, data, permissions);
      } catch (createErr) {
        if (isCollectionNotFoundError(createErr)) {
          console.warn(`[Appwrite] Collection '${collectionId}' does not exist in Database '${DATABASE_ID}'. Create it in your Appwrite Console or set VITE_APPWRITE_COLLECTION_${collectionId.toUpperCase()}_ID.`);
          return null;
        }
        console.error(`Failed to create document in collection ${collectionId}:`, createErr);
        return null;
      }
    }

    if (isCollectionNotFoundError(err)) {
      console.warn(`[Appwrite] Collection '${collectionId}' does not exist in Database '${DATABASE_ID}'. Create it in your Appwrite Console or set VITE_APPWRITE_COLLECTION_${collectionId.toUpperCase()}_ID.`);
      return null;
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
  }, userId);
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
  }, userId);
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
  }, userId);
}

export async function syncAchievement(userId, badgeId) {
  const docId = `${userId}_${badgeId}`;
  return syncCollectionDocument(COLLECTION_ACHIEVEMENTS_ID, docId, {
    userId,
    badgeId,
    unlockedAt: new Date().toISOString()
  }, userId);
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
  }, userId);
}

export async function syncUserProgress(userId, data) {
  return syncCollectionDocument(COLLECTION_PROGRESS_ID, userId, {
    water: data.water || 0,
    completedBreaksToday: data.completedBreaksToday || 0,
    score: data.score || 100,
    streak: data.streak || 1
  }, userId);
}


/**
 * Subscribes to realtime updates for user collections.
 */
export function subscribeToDatabaseChanges(userId, callback) {
  // Subscribe to real-time updates for active user progress
  const collectionPaths = [
    `databases.${DATABASE_ID}.collections.${COLLECTION_PROGRESS_ID}.documents.${userId}`
  ];

  return client.subscribe(collectionPaths, (response) => {
    callback(response);
  });
}

export {
  client,
  account,
  databases,
  storage,
  BUCKET_VIDEOS_ID,
  ID,
  Query,
  DATABASE_ID,
  COLLECTION_PROGRESS_ID,
  COLLECTION_PROFILES_ID,
  COLLECTION_SETTINGS_ID,
  COLLECTION_DAILY_LOGS_ID,
  COLLECTION_ACHIEVEMENTS_ID,
  COLLECTION_STATISTICS_ID
};


