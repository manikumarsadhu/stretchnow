import { writable } from 'svelte/store';
import { loadState, saveState, resetState as clearStorageState } from '../utils/storage.js';
import { scheduleStretchReminders, stopScheduler } from '../utils/notifications.js';

const initialState = loadState();
export const appStore = writable(initialState);

// Subscribe to automatically persist changes to LocalStorage
appStore.subscribe(($app) => {
  if (typeof window !== 'undefined' && $app) {
    saveState($app);
  }
});

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

export function updateSettings(settingsData) {
  appStore.update((state) => {
    const updatedSettings = {
      ...state.settings,
      ...settingsData
    };
    
    // Manage scheduler based on updated settings
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
  appStore.update((state) => ({
    ...state,
    progress: {
      ...state.progress,
      water: state.progress.water + 1
    }
  }));
}

export function completeBreak(scoreEarned = 50) {
  appStore.update((state) => {
    const todayIndex = new Date().getDay(); // 0 = Sun, 1 = Mon ...
    const updatedDailyBreaks = [...state.statistics.dailyBreaks];
    updatedDailyBreaks[todayIndex] = (updatedDailyBreaks[todayIndex] || 0) + 1;
    
    return {
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
  });
}

export function resetAppState() {
  const reset = clearStorageState();
  appStore.set(reset);
}
