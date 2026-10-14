import { getMondayFirstDayIndex } from './date.js';

/**
 * Calculates estimated sedentary sitting hours for a given day in the current week.
 * 
 * @param {Object} user - User object with workStart and workEnd
 * @param {number} dayIndex - Monday-first day index (0 = Mon, ..., 6 = Sun)
 * @param {number} [breaksCount=0] - Number of breaks completed on this day
 * @param {number} [todayIndex] - Current day index (defaults to today)
 * @param {boolean} [weekendMode=false] - Whether user works on weekends
 * @returns {number} Sitting hours rounded to 1 decimal place
 */
export function calculateSittingHoursForDay(user, dayIndex, breaksCount = 0, todayIndex = getMondayFirstDayIndex(), weekendMode = false) {
  // Days in the future have not occurred yet
  if (dayIndex > todayIndex) {
    return 0;
  }

  const [sH = 9, sM = 0] = (user?.workStart || '09:00').split(':').map(Number);
  const [eH = 17, eM = 0] = (user?.workEnd || '17:00').split(':').map(Number);
  const startDec = sH + (sM || 0) / 60;
  const endDec = eH + (eM || 0) / 60;
  const totalWorkHours = Math.max(1, endDec - startDec);

  const isWeekend = dayIndex >= 5;
  if (isWeekend && !weekendMode && breaksCount === 0) {
    return 0;
  }

  // Each posture break takes user away from sedentary sitting for ~15 mins (0.25 hrs)
  const breakReduction = breaksCount * 0.25;

  if (dayIndex === todayIndex) {
    const now = new Date();
    const currentDec = now.getHours() + now.getMinutes() / 60;

    let elapsedWorkHours;
    if (currentDec <= startDec) {
      elapsedWorkHours = 0;
    } else if (currentDec >= endDec) {
      elapsedWorkHours = totalWorkHours;
    } else {
      elapsedWorkHours = currentDec - startDec;
    }

    return Math.max(0, +(elapsedWorkHours - breakReduction).toFixed(1));
  }

  // Past day within current week
  return Math.max(0, +(totalWorkHours - breakReduction).toFixed(1));
}
