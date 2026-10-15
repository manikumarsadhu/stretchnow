import { getLocalDateString, getYesterdayLocalDateString, getMondayFirstDayIndex, isSameCalendarWeek } from './date.js';
import { LocalRepository } from '../storage/LocalRepository.js';

const STORAGE_KEY = 'stretchnow_v1_data';

export const DEFAULT_STATE = {
  version: 2,
  user: {
    name: 'Guest',
    occupation: 'Desk Worker',
    workStart: '09:00',
    workEnd: '17:00',
    dailyBreakGoal: 6,
    dailyWaterGoal: 8,
    onboarded: true
  },
  settings: {
    soundEnabled: true,
    notificationsEnabled: false,
    reminderIntervalMinutes: 45,
    darkMode: false,
    alertMode: 'tone',
    theme: 'light',
    smartSchedule: {
      weekendMode: false,
      lunchStart: '12:00',
      lunchEnd: '13:00',
      snoozeDuration: 15,
      activeMeetingMode: false
    }
  },
  progress: {
    water: 0,
    streak: 1,
    score: 120,
    xp: 0,
    level: 1,
    badges: [],
    completedBreaksToday: 0,
    consecutiveSkips: 0,
    lastBreakTime: Date.now(),
    todayStarted: false,
    todayEnded: false,
    workdayStartedAt: null,
    workdayEndedAt: null,
    tutorialCompleted: false,
    lastSummaryShownDate: null,
    timeline: [],
    reflections: {},
    lastActiveDate: getLocalDateString()
  },
  statistics: {
    dailyBreaks: [0, 0, 0, 0, 0, 0, 0],
    weeklyProgress: [0, 0, 0, 0, 0, 0, 0],
    waterIntake: [0, 0, 0, 0, 0, 0, 0],
    sittingHours: [0, 0, 0, 0, 0, 0, 0],
    dailyHistory: {}
  },
  timer: {
    durationSeconds: 120,
    remainingSeconds: 120,
    isRunning: false,
    isPaused: false,
    currentStretchIndex: 0,
    selectedCategory: 'all'
  },
  notifications: [
    {
      id: 'welcome_1',
      type: 'break',
      title: 'Welcome to StretchNow! 🧘',
      message: 'Take a 2-minute posture break whenever you need a boost.',
      timestamp: Date.now() - 600000,
      icon: 'self_improvement',
      actionRoute: 'break',
      actionLabel: 'Try Quick Stretch',
      unread: true
    }
  ],
  route: 'splash'
};

export function loadState() {
  try {
    const parsed = LocalRepository.get(STORAGE_KEY);
    if (!parsed) return { ...DEFAULT_STATE };
    
    // Check if day changed to reset daily counters
    const today = getLocalDateString();
    if (parsed.progress && parsed.progress.lastActiveDate !== today) {
      const yesterday = getYesterdayLocalDateString();
      const maintainedStreak = parsed.progress.lastActiveDate === yesterday && parsed.progress.completedBreaksToday > 0;
      const isNewWeek = !isSameCalendarWeek(parsed.progress.lastActiveDate, today);

      // Archive previous active day into dailyHistory
      const prevDate = parsed.progress.lastActiveDate;
      if (prevDate) {
        if (!parsed.statistics) parsed.statistics = { ...DEFAULT_STATE.statistics };
        if (!parsed.statistics.dailyHistory) parsed.statistics.dailyHistory = {};
        parsed.statistics.dailyHistory[prevDate] = {
          date: prevDate,
          breaks: parsed.progress.completedBreaksToday || 0,
          water: parsed.progress.water || 0,
          score: parsed.progress.score || 100,
          todayStarted: !!parsed.progress.todayStarted,
          workdayStartedAt: parsed.progress.workdayStartedAt || null,
          workdayEndedAt: parsed.progress.workdayEndedAt || null,
          timeline: [...(parsed.progress.timeline || [])]
        };
      }

      parsed.progress = {
        ...parsed.progress,
        water: 0,
        completedBreaksToday: 0,
        consecutiveSkips: 0,
        timeline: [],
        todayStarted: false,
        todayEnded: false,
        workdayStartedAt: null,
        workdayEndedAt: null,
        streak: maintainedStreak ? parsed.progress.streak + 1 : (parsed.progress.completedBreaksToday > 0 ? parsed.progress.streak : 1),
        lastActiveDate: today
      };

      // Reset weekly stats on new calendar week
      if (isNewWeek) {
        parsed.statistics = {
          ...parsed.statistics,
          dailyBreaks: [0, 0, 0, 0, 0, 0, 0],
          weeklyProgress: [0, 0, 0, 0, 0, 0, 0],
          waterIntake: [0, 0, 0, 0, 0, 0, 0],
          sittingHours: [0, 0, 0, 0, 0, 0, 0]
        };
      }
    }

    // Purge legacy hardcoded mock statistics if present in user storage
    const legacyBreaks = [3, 5, 4, 6, 5, 7, 4];
    const isLegacy = parsed.statistics?.dailyBreaks && 
      parsed.statistics.dailyBreaks.length === 7 && 
      parsed.statistics.dailyBreaks.every((val, idx) => val === legacyBreaks[idx]);
    if (isLegacy || !parsed.statistics) {
      parsed.statistics = {
        dailyBreaks: [0, 0, 0, 0, 0, 0, 0],
        weeklyProgress: [0, 0, 0, 0, 0, 0, 0],
        waterIntake: [0, 0, 0, 0, 0, 0, 0],
        sittingHours: [0, 0, 0, 0, 0, 0, 0]
      };
    }

    // Keep today's statistics index synchronized with today's live progress
    const todayIndex = getMondayFirstDayIndex();
    if (parsed.statistics?.dailyBreaks) {
      const todayBreaks = parsed.progress?.completedBreaksToday || 0;
      if (todayBreaks > (parsed.statistics.dailyBreaks[todayIndex] || 0)) {
        parsed.statistics.dailyBreaks[todayIndex] = todayBreaks;
      }
    }
    if (parsed.statistics?.waterIntake) {
      const todayWater = parsed.progress?.water || 0;
      if (todayWater > (parsed.statistics.waterIntake[todayIndex] || 0)) {
        parsed.statistics.waterIntake[todayIndex] = todayWater;
      }
    }
    
    return {
      version: parsed.version || 2,
      user: { ...DEFAULT_STATE.user, ...(parsed.user || {}) },
      settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
      progress: { ...DEFAULT_STATE.progress, ...(parsed.progress || {}) },
      statistics: { ...DEFAULT_STATE.statistics, ...(parsed.statistics || {}) },
      timer: { ...DEFAULT_STATE.timer, ...(parsed.timer || {}) },
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [...DEFAULT_STATE.notifications],
      route: 'splash'
    };
  } catch (err) {
    console.error('Error loading StretchNow storage:', err);
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state) {
  try {
    const toSave = {
      version: state.version || 2,
      user: state.user,
      settings: state.settings,
      progress: state.progress,
      statistics: state.statistics,
      notifications: state.notifications || []
    };
    LocalRepository.set(STORAGE_KEY, toSave);
  } catch (err) {
    console.error('Error saving StretchNow storage:', err);
  }
}

export function resetState() {
  try {
    LocalRepository.remove(STORAGE_KEY);
  } catch (err) {
    console.error('Error resetting StretchNow storage:', err);
  }
  return { ...DEFAULT_STATE, route: 'onboarding' };
}
