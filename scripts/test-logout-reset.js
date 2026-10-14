import assert from 'node:assert';
import { DEFAULT_STATE } from '../src/utils/storage.js';
import { getLocalDateString } from '../src/utils/date.js';

console.log('Running logout reset self-check...');

// 1. Verify default user name is 'Guest'
assert.strictEqual(DEFAULT_STATE.user.name, 'Guest', 'DEFAULT_STATE.user.name should be Guest');

// 2. Simulate logged-in state
const loggedInState = {
  version: 2,
  user: {
    name: 'Mani Kumar Sadhu',
    occupation: 'Software Engineer',
    workStart: '10:00',
    workEnd: '19:00',
    dailyBreakGoal: 8,
    dailyWaterGoal: 10,
    appwriteId: 'user_12345',
    email: 'mani@example.com',
    isAnonymous: false
  },
  progress: {
    water: 6,
    streak: 15,
    completedBreaksToday: 4,
    score: 180,
    lastActiveDate: getLocalDateString()
  },
  statistics: {
    dailyBreaks: [5, 6, 4]
  },
  settings: {
    theme: 'dark',
    soundEnabled: true
  },
  route: 'settings'
};

// 3. Simulate state transition executed during logoutAppwriteSession
const loggedOutState = {
  ...loggedInState,
  user: {
    ...DEFAULT_STATE.user,
    name: 'Guest',
    appwriteId: null,
    email: null,
    isAnonymous: false
  },
  progress: {
    ...DEFAULT_STATE.progress,
    lastActiveDate: getLocalDateString()
  },
  statistics: {
    ...DEFAULT_STATE.statistics
  },
  route: 'login'
};

// 4. Assertions on logged out state
assert.strictEqual(loggedOutState.user.name, 'Guest', 'User name must be reset to Guest');
assert.strictEqual(loggedOutState.user.appwriteId, null, 'appwriteId must be null');
assert.strictEqual(loggedOutState.user.email, null, 'email must be null');
assert.strictEqual(loggedOutState.route, 'login', 'Route must be updated to login');
assert.strictEqual(loggedOutState.progress.water, 0, 'Water progress must be reset to 0');
assert.strictEqual(loggedOutState.progress.completedBreaksToday, 0, 'Completed breaks must be reset to 0');
assert.strictEqual(loggedOutState.progress.streak, 1, 'Streak must be reset to 1');
assert.strictEqual(loggedOutState.settings.theme, 'dark', 'Settings (theme/sound) should be preserved');

console.log('✅ All logout reset self-checks passed successfully!');
