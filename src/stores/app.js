import { writable } from 'svelte/store';
import { loadState, saveState, resetState as clearStorageState } from '../utils/storage.js';
import { scheduleStretchReminders, stopScheduler, startAlarmRinging, stopAlarmRinging } from '../utils/notifications.js';
import {
  getCurrentUser,
  logoutUser,
  databases,
  DATABASE_ID,
  Query,
  subscribeToDatabaseChanges,
  syncUserProgress,
  syncProfile,
  syncSettings,
  syncStatistics,
  syncDailyLog,
  COLLECTION_PROGRESS_ID,
  COLLECTION_PROFILES_ID,
  COLLECTION_SETTINGS_ID,
  COLLECTION_DAILY_LOGS_ID,
  COLLECTION_ACHIEVEMENTS_ID,
  COLLECTION_STATISTICS_ID
} from '../lib/appwrite.js';
import { getAdaptiveInterval } from '../services/scheduler.js';
import { formatTimelineTime } from '../utils/summaryGenerator.js';
import { enqueue } from '../sync/queue.js';
import { processQueue } from '../sync/manager.js';
import { getLocalDateString } from '../utils/date.js';
import { mergeProfile, mergeSettings, mergeDailyLogs, mergeAchievements, mergeStatistics } from '../sync/merge.js';

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

  const todayStr = getLocalDateString();

  // Enqueue user_progress write (matches Appwrite user_progress table)
  enqueue(COLLECTION_PROGRESS_ID, userId, 'update', {
    water: state.progress.water || 0,
    completedBreaksToday: state.progress.completedBreaksToday || 0,
    score: state.progress.score || 100,
    streak: state.progress.streak || 1
  });

  // Enqueue profile write
  enqueue(COLLECTION_PROFILES_ID, userId, 'update', {
    userId,
    displayName: state.user.name || 'Friend',
    email: state.user.email || '',
    language: state.user.language || 'en',
    theme: state.settings.theme || 'system',
    occupation: state.user.occupation || ''
  });

  // Enqueue settings write
  enqueue(COLLECTION_SETTINGS_ID, userId, 'update', {
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
  enqueue(COLLECTION_DAILY_LOGS_ID, `${userId}_${todayStr}`, 'update', {
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
  enqueue(COLLECTION_STATISTICS_ID, userId, 'update', {
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

let realtimeUnsubscribe = null;

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

    // Setup Realtime WebSocket Listener if not active
    if (!realtimeUnsubscribe) {
      try {
        realtimeUnsubscribe = subscribeToDatabaseChanges(currentUser.$id, (response) => {
          const payload = response.payload;
          if (!payload) return;
          appStore.update((state) => {
            const nextState = { ...state };
            if (payload.water !== undefined || payload.completedBreaksToday !== undefined) {
              nextState.progress = {
                ...nextState.progress,
                water: payload.water ?? nextState.progress.water,
                completedBreaksToday: payload.completedBreaksToday ?? nextState.progress.completedBreaksToday,
                score: payload.score ?? nextState.progress.score,
                streak: payload.streak ?? nextState.progress.streak
              };
            }
            return nextState;
          });
        });
      } catch (subErr) {
        console.warn("[Appwrite Realtime] Subscription error:", subErr);
      }
    }

    try {
      const todayStr = getLocalDateString();
      const dailyLogDocId = `${currentUser.$id}_${todayStr}`;

      const [remoteProgress, remoteStats, remoteSettings, remoteProfile, remoteDailyLog, remoteAchievements] = await Promise.all([
        databases.getDocument(DATABASE_ID, COLLECTION_PROGRESS_ID, currentUser.$id).catch(() => null),
        databases.getDocument(DATABASE_ID, COLLECTION_STATISTICS_ID, currentUser.$id).catch(() => null),
        databases.getDocument(DATABASE_ID, COLLECTION_SETTINGS_ID, currentUser.$id).catch(() => null),
        databases.getDocument(DATABASE_ID, COLLECTION_PROFILES_ID, currentUser.$id).catch(() => null),
        databases.getDocument(DATABASE_ID, COLLECTION_DAILY_LOGS_ID, dailyLogDocId).catch(() => null),
        databases.listDocuments(DATABASE_ID, COLLECTION_ACHIEVEMENTS_ID, [Query.equal('userId', currentUser.$id)]).catch(() => null)
      ]);

      appStore.update((state) => {
        let nextState = { ...state };

        // 0. Merge User Progress (from user_progress collection)
        if (remoteProgress) {
          nextState.progress = {
            ...nextState.progress,
            water: remoteProgress.water ?? nextState.progress.water,
            completedBreaksToday: remoteProgress.completedBreaksToday ?? nextState.progress.completedBreaksToday,
            score: remoteProgress.score ?? nextState.progress.score,
            streak: remoteProgress.streak ?? nextState.progress.streak
          };
        }

        // 1. Merge Profile
        if (remoteProfile) {
          const mergedProfile = mergeProfile(
            { ...state.user, updatedAt: state.user.updatedAt || 0 },
            remoteProfile
          );
          nextState.user = {
            ...nextState.user,
            name: mergedProfile.displayName || mergedProfile.name || nextState.user.name,
            occupation: mergedProfile.occupation || nextState.user.occupation,
            language: mergedProfile.language || nextState.user.language
          };
        }

        // 2. Merge Settings
        if (remoteSettings) {
          const mergedSettings = mergeSettings(
            { ...state.settings, updatedAt: state.settings.updatedAt || 0 },
            {
              reminderIntervalMinutes: remoteSettings.reminderInterval,
              notificationsEnabled: remoteSettings.notificationEnabled,
              largeTextEnabled: remoteSettings.largeText,
              highContrastEnabled: remoteSettings.highContrast,
              updatedAt: remoteSettings.updatedAt
            }
          );
          nextState.settings = {
            ...nextState.settings,
            ...mergedSettings
          };
        }

        // 3. Merge Statistics
        if (remoteStats) {
          const mergedStats = mergeStatistics(
            {
              totalBreaks: state.progress.totalCompletedBreaks || 0,
              totalWater: state.progress.water || 0,
              totalXP: state.progress.xp || 0,
              level: state.progress.level || 1,
              currentStreak: state.progress.streak || 1,
              longestStreak: state.progress.streak || 1
            },
            remoteStats
          );
          nextState.progress = {
            ...nextState.progress,
            totalCompletedBreaks: mergedStats.totalBreaks,
            xp: mergedStats.totalXP,
            level: mergedStats.level,
            streak: mergedStats.currentStreak
          };
        }

        // 4. Merge Daily Logs
        if (remoteDailyLog) {
          const mergedDaily = mergeDailyLogs(
            {
              breaksCompleted: state.progress.completedBreaksToday || 0,
              breaksSkipped: state.progress.consecutiveSkips || 0,
              stretchMinutes: (state.progress.completedBreaksToday || 0) * 2,
              waterCups: state.progress.water || 0,
              sittingMinutes: 480,
              wellnessScore: state.progress.score || 100,
              xpEarned: state.progress.xp || 0,
              updatedAt: state.progress.updatedAt || 0
            },
            remoteDailyLog
          );
          nextState.progress = {
            ...nextState.progress,
            completedBreaksToday: mergedDaily.breaksCompleted,
            consecutiveSkips: mergedDaily.breaksSkipped,
            water: mergedDaily.waterCups,
            score: mergedDaily.wellnessScore
          };
        }

        // 5. Merge Achievements
        if (remoteAchievements && remoteAchievements.documents) {
          const remoteBadgeIds = remoteAchievements.documents.map((doc) => doc.badgeId);
          const mergedBadges = mergeAchievements(state.progress.badges || [], remoteBadgeIds);
          nextState.progress = {
            ...nextState.progress,
            badges: mergedBadges
          };
        }

        // If first-time user on Appwrite Cloud (remote documents missing), perform initial sync write
        if (!remoteProgress) syncUserProgress(currentUser.$id, nextState.progress).catch(() => {});
        if (!remoteProfile) syncProfile(currentUser.$id, nextState.user).catch(() => {});
        if (!remoteSettings) syncSettings(currentUser.$id, nextState.settings).catch(() => {});
        if (!remoteStats) syncStatistics(currentUser.$id, nextState.statistics).catch(() => {});
        if (!remoteDailyLog) syncDailyLog(currentUser.$id, todayStr, nextState.progress).catch(() => {});

        return nextState;
      });
    } catch (err) {
      console.warn("Could not load cloud documents on startup:", err);
    }
  }
}

export async function logoutAppwriteSession() {
  if (realtimeUnsubscribe) {
    try {
      realtimeUnsubscribe();
    } catch (err) {
      console.warn("Error unsubscribing realtime listener during logout:", err);
    }
    realtimeUnsubscribe = null;
  }
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
        scheduleStretchReminders(interval, () => triggerAlarmRing());
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

export function triggerAlarmRing(title = 'Time to stretch! 🧘', body = 'Your body needs a quick posture refresh. Stand up & reset your energy!') {
  appStore.update((state) => {
    startAlarmRinging(state.settings?.reminderSound || 'zen');
    return {
      ...state,
      isAlarmRinging: true,
      activeAlarmInfo: { title, body, timestamp: Date.now() }
    };
  });
}

export function stopAlarmRing() {
  stopAlarmRinging();
  appStore.update((state) => ({
    ...state,
    isAlarmRinging: false,
    activeAlarmInfo: null
  }));
}

let snoozeTimerIntervalId = null;

export function snoozeAlarm(customMinutes) {
  stopAlarmRing();
  cancelSnooze();

  appStore.update((state) => {
    const minutes = customMinutes || state.settings?.smartSchedule?.snoozeDuration || 15;
    let totalSeconds = minutes * 60;

    snoozeTimerIntervalId = setInterval(() => {
      totalSeconds -= 1;
      appStore.update((s) => ({
        ...s,
        snoozeRemainingSeconds: Math.max(0, totalSeconds)
      }));

      if (totalSeconds <= 0) {
        cancelSnooze();
        triggerAlarmRing("Snooze Alarm Ended 🧘", "Time for your post-snooze stretch break!");
      }
    }, 1000);

    return {
      ...state,
      isAlarmRinging: false,
      activeAlarmInfo: null,
      snoozeRemainingSeconds: totalSeconds
    };
  });
}

export function cancelSnooze() {
  if (snoozeTimerIntervalId) {
    clearInterval(snoozeTimerIntervalId);
    snoozeTimerIntervalId = null;
  }
  appStore.update((state) => ({
    ...state,
    snoozeRemainingSeconds: 0
  }));
}

export function closeAdaptiveModal() {
  appStore.update((state) => ({
    ...state,
    showAdaptiveModal: false
  }));
}

export function snoozeReminder() {
  snoozeAlarm();
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
      showAdaptiveModal: nextSkips >= 3,
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

