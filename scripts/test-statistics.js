import assert from 'node:assert';

// Mock browser environment for LocalRepository tests in Node
const store = new Map();
globalThis.window = {};
globalThis.localStorage = {
  getItem: (key) => store.get(key) || null,
  setItem: (key, val) => store.set(key, String(val)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear()
};

import { getMondayFirstDayIndex, isSameCalendarWeek } from '../src/utils/date.js';
import { calculateSittingHoursForDay } from '../src/utils/sitting.js';
import { loadState, DEFAULT_STATE } from '../src/utils/storage.js';
import { LocalRepository } from '../src/storage/LocalRepository.js';

console.log('--- Testing Accurate Statistics Logic ---');

// 1. Day of week Monday-first index tests
// 2026-10-12 was Monday (index 0)
const monDate = new Date('2026-10-12T10:00:00');
assert.strictEqual(getMondayFirstDayIndex(monDate), 0, 'Monday should map to index 0');

// 2026-10-14 was Wednesday (index 2)
const wedDate = new Date('2026-10-14T16:30:00');
assert.strictEqual(getMondayFirstDayIndex(wedDate), 2, 'Wednesday should map to index 2');

// 2026-10-18 was Sunday (index 6)
const sunDate = new Date('2026-10-18T12:00:00');
assert.strictEqual(getMondayFirstDayIndex(sunDate), 6, 'Sunday should map to index 6');
console.log('✓ Monday-first day indexing passed');

// 2. Calendar week tests
assert.strictEqual(isSameCalendarWeek('2026-10-12', '2026-10-14'), true, 'Mon and Wed should be same week');
assert.strictEqual(isSameCalendarWeek('2026-10-12', '2026-10-18'), true, 'Mon and Sun should be same week');
assert.strictEqual(isSameCalendarWeek('2026-10-11', '2026-10-12'), false, 'Sun and next Mon are different weeks');
console.log('✓ Calendar week matching passed');

// 3. Sitting hours calculation
const user = { workStart: '09:00', workEnd: '17:00' };
// Future day (e.g., Thu=3 when today is Wed=2)
const futureHours = calculateSittingHoursForDay(user, 3, 0, 2);
assert.strictEqual(futureHours, 0, 'Future days must have 0 sitting hours');

// Weekend day without weekend mode
const satHours = calculateSittingHoursForDay(user, 5, 0, 5, false);
assert.strictEqual(satHours, 0, 'Weekend without weekendMode must have 0 sitting hours');

// Past weekday with 4 breaks taken (8 - 4*0.25 = 7.0 hrs)
const pastWeekdayHours = calculateSittingHoursForDay(user, 0, 4, 2);
assert.strictEqual(pastWeekdayHours, 7.0, 'Past weekday sitting hours should account for break reduction');
console.log('✓ Sitting hours calculations passed');

// 4. Storage migration and legacy mock purge
const legacyStorage = {
  version: 2,
  user: { name: 'Guest' },
  progress: {
    completedBreaksToday: 3,
    water: 4,
    lastActiveDate: '2026-10-14'
  },
  statistics: {
    dailyBreaks: [3, 5, 4, 6, 5, 7, 4],
    weeklyProgress: [50, 70, 60, 85, 75, 100, 65],
    waterIntake: [5, 8, 6, 8, 7, 8, 6],
    sittingHours: [7.5, 8, 7, 8.5, 6.5, 5, 6]
  }
};

LocalRepository.set('stretchnow_v1_data', legacyStorage);
const loaded = loadState();

// Ensure legacy mock was purged
assert.notDeepStrictEqual(loaded.statistics.dailyBreaks, [3, 5, 4, 6, 5, 7, 4], 'Legacy mock daily breaks must be purged');
const todayIdx = getMondayFirstDayIndex();
assert.strictEqual(loaded.statistics.dailyBreaks[todayIdx], 3, "Today's index must reflect current completedBreaksToday");
assert.strictEqual(loaded.statistics.waterIntake[todayIdx], 4, "Today's index must reflect current water");

// Check clean defaults
assert.deepStrictEqual(DEFAULT_STATE.statistics.dailyBreaks, [0, 0, 0, 0, 0, 0, 0], 'DEFAULT_STATE dailyBreaks must be all 0s');
assert.deepStrictEqual(DEFAULT_STATE.statistics.waterIntake, [0, 0, 0, 0, 0, 0, 0], 'DEFAULT_STATE waterIntake must be all 0s');
console.log('✓ Storage mock migration and live sync passed');

console.log('\nAll statistics tests PASSED successfully! 🎉');
