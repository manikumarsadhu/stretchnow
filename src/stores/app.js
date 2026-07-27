import { writable, get } from 'svelte/store';
import { loadState, saveState, resetState as clearStorageState } from '../utils/storage.js';
import { scheduleStretchReminders, stopScheduler } from '../utils/notifications.js';
import { getCurrentUser, logoutUser, databases, DATABASE_ID } from '../lib/appwrite.js';
import { getAdaptiveInterval } from '../services/scheduler.js';
import { formatTimelineTime } from '../utils/summaryGenerator.js';
import { enqueue } from '../sync/queue.js';
import { processQueue } from '../sync/manager.js';

const initialState = loadState();
export const appStore = writable(initialState);

// Subscribe to automatically persist changes to LocalStorage
appStore.subscribe(($app) => {
  if (typeof window !== 'undefined' && $app) {
    saveState($app);
  }
});

// Auto-initialize reminders on startup if enabled in settings
if (typeof window !== 'undefined' && initialState.settings?.notificationsEnabled) {
  scheduleStretchReminders(initialState.settings.reminderIntervalMinutes);
}

// Helper: sync progress to Appwrite database if user is logged in
async function triggerCloudSync(state) {
  const userId = state?.user?.appwriteId;
  if (!userId) return;

  const todayStr = new Date().toISOString().split('T')[0];

  // Enqueue profile write
  enqueue('profiles', userId, 'update', {
    userId,
    displayName: state.user.name || 'Friend',
    email: state.user.email || '',
    language: state.user.language || 'en',
    theme: state.settings.theme || 'system',
    occupation: state.user.occupation || ''
  });

  // Enqueue settings write
  enqueue('settings', userId, 'update', {
    reminderInterval: state.settings.reminderIntervalMinutes || 45,
    workStart: state.user.workStart || '09:00',
    workEnd: state.user.workEnd || '17:00',
    weekendMode: !!state.settings.smartSchedule?.weekendMode,
    lunchStart: state.settings.smartSchedule?.lunchStart || '12:00',
    lunchEnd: state.settings.smartSchedule?.lunchEnd || '13:00',
    notificationEnabled: !!state.settings.notificationsEnabled,
    waterGoal: state.user.dailyWaterGoal || 8,
    breakGoal: state.user.dailyBreakGoal || 6,
    largeText: !!state.settings.largeTextEnabled,
    highContrast: !!state.settings.highContrastEnabled,
    updatedAt: new Date().toISOString()
  });

  // Enqueue daily logs write
  enqueue('daily_logs', `${userId}_${todayStr}`, 'update', {
    userId,
    date: todayStr,
    breaksCompleted: state.progress.completedBreaksToday || 0,
    breaksSkipped: state.progress.consecutiveSkips || 0,
    stretchMinutes: (state.progress.completedBreaksToday || 0) * 2,
    waterCups: state.progress.water || 0,
    sittingMinutes: 480,
    wellnessScore: state.progress.score || 100,
    xpEarned: state.progress.xp || 0,
    mood: '🙂',
    notes: '',
    updatedAt: new Date().toISOString()
  });

  // Enqueue statistics write
  enqueue('statistics', userId, 'update', {
    totalBreaks: state.progress.totalCompletedBreaks || 0,
    totalWater: state.progress.water || 0,
    totalXP: state.progress.xp || 0,
    level: state.progress.level || 1,
    currentStreak: state.progress.streak || 1,
    longestStreak: state.progress.streak || 1,
    updatedAt: new Date().toISOString()
  });

  // Trigger background process execution
  processQueue();
}

// Helper actions
export function navigateTo(route) {
  appStore.update((state) => {
    const nextProgress = {
      ...state.progress,
      visitedAnalytics: state.progress.visitedAnalytics || route === 'statistics'
    };
    return {
      ...state,
      route,
      progress: nextProgress
    };
  });
}

export function updateProfile(userData) {
  appStore.update((state) => {
    const nextState = {
      ...state,
      user: {
        ...state.user,
        ...userData
      }
    };
    triggerCloudSync(nextState);
    return nextState;
  });
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

    try {
      const [remoteStats, remoteSettings] = await Promise.all([
        databases.getDocument(DATABASE_ID, 'statistics', currentUser.$id).catch(() => null),
        databases.getDocument(DATABASE_ID, 'settings', currentUser.$id).catch(() => null)
      ]);

      if (remoteStats || remoteSettings) {
        appStore.update((state) => {
          const nextProgress = { ...state.progress };
          if (remoteStats) {
            nextProgress.totalCompletedBreaks = remoteStats.totalBreaks ?? nextProgress.totalCompletedBreaks;
            nextProgress.xp = remoteStats.totalXP ?? nextProgress.xp;
            nextProgress.level = remoteStats.level ?? nextProgress.level;
            nextProgress.streak = remoteStats.currentStreak ?? nextProgress.streak;
          }

          const nextSettings = { ...state.settings };
          if (remoteSettings) {
            nextSettings.reminderIntervalMinutes = remoteSettings.reminderInterval ?? nextSettings.reminderIntervalMinutes;
            nextSettings.notificationsEnabled = remoteSettings.notificationEnabled ?? nextSettings.notificationsEnabled;
            nextSettings.largeTextEnabled = remoteSettings.largeText ?? nextSettings.largeTextEnabled;
            nextSettings.highContrastEnabled = remoteSettings.highContrast ?? nextSettings.highContrastEnabled;
          }

          return {
            ...state,
            progress: nextProgress,
            settings: nextSettings
          };
        });
      }
    } catch (err) {
      console.warn("Could not load cloud documents on startup:", err);
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
      // Calculate dynamic intervals based on current skips
      const interval = getAdaptiveInterval(updatedSettings.reminderIntervalMinutes, state.progress.consecutiveSkips);
      if (interval > 0) {
        scheduleStretchReminders(interval);
      } else {
        stopScheduler();
      }
    } else {
      stopScheduler();
    }
    
    return {
      ...state,
      settings: updatedSettings
    };
  });
}

export function updateTheme(theme) {
  appStore.update((state) => ({
    ...state,
    settings: {
      ...state.settings,
      theme
    },
    progress: {
      ...state.progress,
      customizedTheme: true
    }
  }));
}

export function updateSmartSchedule(smartScheduleData) {
  appStore.update((state) => {
    const nextSmartSchedule = {
      ...state.settings.smartSchedule,
      ...smartScheduleData
    };
    
    const nextSettings = {
      ...state.settings,
      smartSchedule: nextSmartSchedule
    };

    // Re-schedule based on new smart schedule configurations
    if (nextSettings.notificationsEnabled) {
      const interval = getAdaptiveInterval(nextSettings.reminderIntervalMinutes, state.progress.consecutiveSkips);
      if (interval > 0) {
        scheduleStretchReminders(interval);
      } else {
        stopScheduler();
      }
    }

    return {
      ...state,
      settings: nextSettings
    };
  });
}

export function snoozeReminder() {
  appStore.update((state) => {
    const snoozeDuration = state.settings?.smartSchedule?.snoozeDuration || 15;
    const snoozeTimeMs = snoozeDuration * 60 * 1000;
    
    setTimeout(() => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification("StretchNow Reminder", {
          body: "Time for your post-snooze stretch break! 🧘",
          icon: "/icon-192.png"
        });
      }
    }, snoozeTimeMs);
    
    return state;
  });
}

export function toggleMeetingMode() {
  appStore.update((state) => {
    const nextMeetingMode = !state.settings.smartSchedule.activeMeetingMode;
    const nextState = {
      ...state,
      settings: {
        ...state.settings,
        smartSchedule: {
          ...state.settings.smartSchedule,
          activeMeetingMode: nextMeetingMode
        }
      }
    };
    
    if (nextState.settings.notificationsEnabled) {
      if (nextMeetingMode) {
        stopScheduler();
      } else {
        const interval = getAdaptiveInterval(nextState.settings.reminderIntervalMinutes, nextState.progress.consecutiveSkips);
        if (interval > 0) scheduleStretchReminders(interval);
      }
    }
    
    return nextState;
  });
}

export function skipBreakAction() {
  appStore.update((state) => {
    const nextSkips = (state.progress.consecutiveSkips || 0) + 1;
    const baseInterval = state.settings.reminderIntervalMinutes || 45;
    const nextInterval = getAdaptiveInterval(baseInterval, nextSkips);
    
    if (state.settings.notificationsEnabled) {
      if (nextInterval > 0) {
        scheduleStretchReminders(nextInterval);
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification("StretchNow Delay", {
            body: `We noticed you're busy! Reminders extended to every ${nextInterval} mins.`,
            icon: "/icon-192.png"
          });
        }
      } else {
        stopScheduler();
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification("Reminders Paused", {
            body: "Stretch reminders are paused until you log your next stretch session.",
            icon: "/icon-192.png"
          });
        }
      }
    }
    
    const timeline = [...(state.progress.timeline || [])];
    timeline.push({
      time: formatTimelineTime(),
      type: 'skip',
      label: `Reminder Skipped (Skip #${nextSkips})`
    });
    
    const nextState = {
      ...state,
      progress: {
        ...state.progress,
        consecutiveSkips: nextSkips,
        timeline,
        lastAction: {
          type: 'skip',
          timestamp: Date.now()
        }
      }
    };
    return nextState;
  });
}

export function undoAction() {
  appStore.update((state) => {
    const lastAction = state.progress.lastAction;
    if (!lastAction) return state;
    
    const nextProgress = { ...state.progress };
    const nextStats = { ...state.statistics };
    
    if (lastAction.type === 'water') {
      nextProgress.water = Math.max(0, nextProgress.water - 1);
    } else if (lastAction.type === 'stretch') {
      nextProgress.completedBreaksToday = Math.max(0, nextProgress.completedBreaksToday - 1);
      nextProgress.totalCompletedBreaks = Math.max(0, (nextProgress.totalCompletedBreaks || 0) - 1);
      nextProgress.score = Math.max(0, nextProgress.score - (lastAction.scoreEarned || 50));
      nextProgress.xp = Math.max(0, nextProgress.xp - (lastAction.scoreEarned || 50));
      
      const todayIndex = new Date().getDay();
      const updatedDailyBreaks = [...state.statistics.dailyBreaks];
      updatedDailyBreaks[todayIndex] = Math.max(0, (updatedDailyBreaks[todayIndex] || 0) - 1);
      nextStats.dailyBreaks = updatedDailyBreaks;
    } else if (lastAction.type === 'skip') {
      nextProgress.consecutiveSkips = Math.max(0, nextProgress.consecutiveSkips - 1);
      
      if (state.settings.notificationsEnabled) {
        const baseInterval = state.settings.reminderIntervalMinutes || 45;
        const prevInterval = getAdaptiveInterval(baseInterval, nextProgress.consecutiveSkips);
        if (prevInterval > 0) {
          scheduleStretchReminders(prevInterval);
        } else {
          stopScheduler();
        }
      }
    }
    
    // Remove last matching timeline log
    if (nextProgress.timeline && nextProgress.timeline.length > 0) {
      let lastIdx = -1;
      for (let i = nextProgress.timeline.length - 1; i >= 0; i--) {
        if (nextProgress.timeline[i].type === lastAction.type) {
          lastIdx = i;
          break;
        }
      }
      if (lastIdx !== -1) {
        nextProgress.timeline = nextProgress.timeline.filter((_, idx) => idx !== lastIdx);
      }
    }
    
    nextProgress.lastAction = null;
    
    const nextState = {
      ...state,
      progress: nextProgress,
      statistics: nextStats
    };
    
    triggerCloudSync(nextState);
    return nextState;
  });
}

export function addTimelineEvent(type, label) {
  appStore.update((state) => {
    const timeline = [...(state.progress.timeline || [])];
    timeline.push({
      time: formatTimelineTime(),
      type,
      label
    });
    return {
      ...state,
      progress: {
        ...state.progress,
        timeline
      }
    };
  });
}

export function addReflection(dateStr, reflectionData) {
  appStore.update((state) => {
    const reflections = { ...(state.progress.reflections || {}) };
    reflections[dateStr] = {
      ...reflections[dateStr],
      ...reflectionData
    };
    return {
      ...state,
      progress: {
        ...state.progress,
        reflections
      }
    };
  });
}

export function completeTutorialAction() {
  appStore.update((state) => {
    if (state.progress.tutorialCompleted) return state;
    
    const bonusXp = 100;
    let newXp = (state.progress.xp || 0) + bonusXp;
    let newLevel = state.progress.level || 1;
    const xpNeeded = newLevel * 200;
    
    if (newXp >= xpNeeded) {
      newXp -= xpNeeded;
      newLevel += 1;
    }
    
    const timeline = [...(state.progress.timeline || [])];
    timeline.push({
      time: formatTimelineTime(),
      type: 'tutorial',
      label: 'Onboarding Checklist Completed! 🎉 (+100 XP)'
    });
    
    return {
      ...state,
      progress: {
        ...state.progress,
        tutorialCompleted: true,
        xp: newXp,
        level: newLevel,
        timeline
      }
    };
  });
}

export function importBackupAction(backupData) {
  appStore.update((state) => {
    const nextState = {
      ...state,
      user: { ...state.user, ...(backupData.user || {}) },
      settings: { ...state.settings, ...(backupData.settings || {}) },
      progress: { ...state.progress, ...(backupData.progress || {}) },
      statistics: { ...state.statistics, ...(backupData.statistics || {}) }
    };
    
    if (nextState.settings.notificationsEnabled) {
      const interval = getAdaptiveInterval(nextState.settings.reminderIntervalMinutes, nextState.progress.consecutiveSkips);
      if (interval > 0) {
        scheduleStretchReminders(interval);
      } else {
        stopScheduler();
      }
    } else {
      stopScheduler();
    }
    
    return nextState;
  });
}

export function incrementWater() {
  appStore.update((state) => {
    const newWater = state.progress.water + 1;
    const currentBadges = [...(state.progress.badges || [])];
    
    if (newWater >= (state.user.dailyWaterGoal || 8) && !currentBadges.includes('water-goal')) {
      currentBadges.push('water-goal');
    }
    
    const timeline = [...(state.progress.timeline || [])];
    timeline.push({
      time: formatTimelineTime(),
      type: 'water',
      label: 'Logged +1 water cup'
    });
    
    const nextState = {
      ...state,
      progress: {
        ...state.progress,
        water: newWater,
        badges: currentBadges,
        timeline,
        lastAction: {
          type: 'water',
          timestamp: Date.now()
        }
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
    
    const totalBreaks = (state.progress.totalCompletedBreaks || 0) + 1;
    
    const xpGained = scoreEarned;
    let newXp = (state.progress.xp || 0) + xpGained;
    let newLevel = state.progress.level || 1;
    const xpNeededForNextLevel = newLevel * 200;
    
    let leveledUp = false;
    if (newXp >= xpNeededForNextLevel) {
      newXp -= xpNeededForNextLevel;
      newLevel += 1;
      leveledUp = true;
    }
    
    // Restore scheduling to normal base interval since break is completed
    if (state.settings.notificationsEnabled) {
      scheduleStretchReminders(state.settings.reminderIntervalMinutes || 45);
    }
    
    const timeline = [...(state.progress.timeline || [])];
    timeline.push({
      time: formatTimelineTime(),
      type: 'stretch',
      label: 'Completed Posture stretch break'
    });
    
    const currentBadges = [...(state.progress.badges || [])];
    const currentHour = new Date().getHours();
    
    if (currentHour < 10 && !currentBadges.includes('early-stretch')) {
      currentBadges.push('early-stretch');
    }
    if (currentHour >= 18 && !currentBadges.includes('night-stretch')) {
      currentBadges.push('night-stretch');
    }
    
    if (totalBreaks >= 10 && !currentBadges.includes('stretches-10')) {
      currentBadges.push('stretches-10');
    }
    if (totalBreaks >= 100 && !currentBadges.includes('stretches-100')) {
      currentBadges.push('stretches-100');
    }
    
    const currentStreak = state.progress.streak || 1;
    if (currentStreak >= 7 && !currentBadges.includes('streak-7')) {
      currentBadges.push('streak-7');
    }
    if (currentStreak >= 30 && !currentBadges.includes('streak-30')) {
      currentBadges.push('streak-30');
    }
    
    const nextState = {
      ...state,
      progress: {
        ...state.progress,
        completedBreaksToday: state.progress.completedBreaksToday + 1,
        totalCompletedBreaks: totalBreaks,
        score: state.progress.score + scoreEarned,
        xp: newXp,
        level: newLevel,
        badges: currentBadges,
        consecutiveSkips: 0, // Reset skips
        lastBreakTime: Date.now(), // Update break time
        timeline,
        lastAction: {
          type: 'stretch',
          timestamp: Date.now(),
          scoreEarned
        }
      },
      statistics: {
        ...state.statistics,
        dailyBreaks: updatedDailyBreaks
      }
    };
    
    if (leveledUp) {
      console.log('Leveled up to Level', newLevel);
    }

    triggerCloudSync(nextState);
    return nextState;
  });
}

export function resetAppState() {
  const reset = clearStorageState();
  appStore.set(reset);
}

