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
  } else if (typeof account.createEmailSession === 'function') {
    return await account.createEmailSession(email, password);
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
    provider,
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
 * Save user progress data to Appwrite Database
 */
export async function saveUserProgress(userId, progressData) {
  if (!userId) return null;
  try {
    return await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_PROGRESS_ID,
      userId,
      {
        water: progressData.water || 0,
        completedBreaksToday: progressData.completedBreaksToday || 0,
        score: progressData.score || 0,
        streak: progressData.streak || 1,
        updatedAt: new Date().toISOString()
      }
    );
  } catch (err) {
    // If document doesn't exist, try creating it
    if (err?.code === 404 && err?.type === 'document_not_found') {
      try {
        return await databases.createDocument(
          DATABASE_ID,
          COLLECTION_PROGRESS_ID,
          userId,
          {
            water: progressData.water || 0,
            completedBreaksToday: progressData.completedBreaksToday || 0,
            score: progressData.score || 0,
            streak: progressData.streak || 1,
            updatedAt: new Date().toISOString()
          }
        );
      } catch {
        // Silently fallback to local state if database/collection is not created yet in Appwrite console
      }
    }
  }
  return null;
}

/**
 * Load user progress data from Appwrite Database
 */
export async function loadUserProgress(userId) {
  if (!userId) return null;
  try {
    const doc = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_PROGRESS_ID,
      userId
    );
    return doc;
  } catch {
    // Silently fallback to local state if database/collection is not created yet
    return null;
  }
}

export { client, account, databases, ID, Query, DATABASE_ID, COLLECTION_PROGRESS_ID };

