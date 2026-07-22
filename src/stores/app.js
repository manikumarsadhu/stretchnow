import { writable, get } from 'svelte/store';
import { loadState, saveState, resetState as clearStorageState } from '../utils/storage.js';
import { scheduleStretchReminders, stopScheduler } from '../utils/notifications.js';
import { getCurrentUser, logoutUser, saveUserProgress, loadUserProgress } from '../lib/appwrite.js';

const initialState = loadState();
export const appStore = writable(initialState);

// Subscribe to automatically persist changes to LocalStorage
appStore.subscribe(($app) => {
  if (typeof window !== 'undefined' && $app) {
    saveState($app);
  }
});

// Helper: sync progress to Appwrite database if user is logged in
async function triggerCloudSync(state) {
  if (state?.user?.appwriteId) {
    await saveUserProgress(state.user.appwriteId, state.progress);
  }
}

// Helper actions
export function navigateTo(route) {
  appStore.update((state) => ({
    ...state,
    route
  }));
}

export function updateProfile(userData) {
  appStore.update((state) => ({
    ...state,
    user: {
      ...state.user,
      ...userData
    }
  }));
}

export async function checkAndSyncAuth() {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    appStore.update((state) => ({
      ...state,
      user: {
        ...state.user,
        appwriteId: currentUser.$id,
        email: currentUser.email,
        name: currentUser.name || state.user.name,
        isAnonymous: currentUser.email === ''
      }
    }));

    // Fetch progress from DB
    const remoteProgress = await loadUserProgress(currentUser.$id);
    if (remoteProgress) {
      appStore.update((state) => ({
        ...state,
        progress: {
          ...state.progress,
          water: remoteProgress.water ?? state.progress.water,
          completedBreaksToday: remoteProgress.completedBreaksToday ?? state.progress.completedBreaksToday,
          score: remoteProgress.score ?? state.progress.score,
          streak: remoteProgress.streak ?? state.progress.streak
        }
      }));
    }
  }
}

export async function logoutAppwriteSession() {
  await logoutUser();
  appStore.update((state) => ({
    ...state,
    user: {
      ...state.user,
      appwriteId: null,
      email: null,
      isAnonymous: false
    }
  }));
}

export function updateSettings(settingsData) {
  appStore.update((state) => {
    const updatedSettings = {
      ...state.settings,
      ...settingsData
    };
    
    if (updatedSettings.notificationsEnabled) {
      scheduleStretchReminders(updatedSettings.reminderIntervalMinutes);
    } else {
      stopScheduler();
    }
    
    return {
      ...state,
      settings: updatedSettings
    };
  });
}

export function incrementWater() {
  appStore.update((state) => {
    const nextState = {
      ...state,
      progress: {
        ...state.progress,
        water: state.progress.water + 1
      }
    };
    triggerCloudSync(nextState);
    return nextState;
  });
}

export function completeBreak(scoreEarned = 50) {
  appStore.update((state) => {
    const todayIndex = new Date().getDay();
    const updatedDailyBreaks = [...state.statistics.dailyBreaks];
    updatedDailyBreaks[todayIndex] = (updatedDailyBreaks[todayIndex] || 0) + 1;
    
    const nextState = {
      ...state,
      progress: {
        ...state.progress,
        completedBreaksToday: state.progress.completedBreaksToday + 1,
        score: state.progress.score + scoreEarned
      },
      statistics: {
        ...state.statistics,
        dailyBreaks: updatedDailyBreaks
      }
    };

    triggerCloudSync(nextState);
    return nextState;
  });
}

export function resetAppState() {
  const reset = clearStorageState();
  appStore.set(reset);
}

