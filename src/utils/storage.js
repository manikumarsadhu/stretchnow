const STORAGE_KEY = 'stretchnow_v1_data';

export const DEFAULT_STATE = {
  user: {
    name: 'Friend',
    occupation: 'Desk Worker',
    workStart: '09:00',
    workEnd: '17:00',
    dailyBreakGoal: 6,
    dailyWaterGoal: 8,
    onboarded: false
  },
  settings: {
    soundEnabled: true,
    notificationsEnabled: false,
    reminderIntervalMinutes: 45,
    darkMode: false
  },
  progress: {
    water: 0,
    streak: 1,
    score: 120,
    completedBreaksToday: 0,
    lastActiveDate: new Date().toISOString().split('T')[0]
  },
  statistics: {
    dailyBreaks: [3, 5, 4, 6, 5, 7, 4],
    weeklyProgress: [50, 70, 60, 85, 75, 100, 65],
    waterIntake: [5, 8, 6, 8, 7, 8, 6],
    sittingHours: [7.5, 8, 7, 8.5, 6.5, 5, 6]
  },
  timer: {
    durationSeconds: 120,
    remainingSeconds: 120,
    isRunning: false,
    isPaused: false,
    currentStretchIndex: 0,
    selectedCategory: 'all'
  },
  route: 'splash'
};

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    
    // Check if day changed to reset daily counters
    const today = new Date().toISOString().split('T')[0];
    if (parsed.progress && parsed.progress.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const maintainedStreak = parsed.progress.lastActiveDate === yesterday && parsed.progress.completedBreaksToday > 0;
      
      parsed.progress = {
        ...parsed.progress,
        water: 0,
        completedBreaksToday: 0,
        streak: maintainedStreak ? parsed.progress.streak + 1 : (parsed.progress.completedBreaksToday > 0 ? parsed.progress.streak : 1),
        lastActiveDate: today
      };
    }
    
    return {
      user: { ...DEFAULT_STATE.user, ...(parsed.user || {}) },
      settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
      progress: { ...DEFAULT_STATE.progress, ...(parsed.progress || {}) },
      statistics: { ...DEFAULT_STATE.statistics, ...(parsed.statistics || {}) },
      timer: { ...DEFAULT_STATE.timer, ...(parsed.timer || {}) },
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
      user: state.user,
      settings: state.settings,
      progress: state.progress,
      statistics: state.statistics
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.error('Error saving StretchNow storage:', err);
  }
}

export function resetState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error resetting StretchNow storage:', err);
  }
  return { ...DEFAULT_STATE, route: 'onboarding' };
}
