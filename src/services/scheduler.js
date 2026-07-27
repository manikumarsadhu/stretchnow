/**
 * Manages adaptive scheduling intervals based on skips and sitting history.
 */

/**
 * Calculates dynamic intervals based on user skipped break logs.
 * Skips escalation rules:
 * - 0-1 skips: Normal base interval
 * - 2 skips: 1.5x interval
 * - 3-4 skips: 2.0x interval
 * - 5+ skips: Pauses reminders (returns 0)
 */
export function getAdaptiveInterval(baseIntervalMinutes, consecutiveSkips) {
  if (!consecutiveSkips || consecutiveSkips <= 1) {
    return baseIntervalMinutes;
  }
  if (consecutiveSkips === 2) {
    return Math.round(baseIntervalMinutes * 1.5);
  }
  if (consecutiveSkips >= 3 && consecutiveSkips <= 4) {
    return baseIntervalMinutes * 2;
  }
  return 0; // 5+ skips triggers pause
}

/**
 * Evaluates if the user has been sitting continuously without a break for 2+ hours.
 */
export function checkContinuousSitting(lastBreakTimeTimestamp) {
  if (!lastBreakTimeTimestamp) return false;
  const twoHoursMs = 2 * 60 * 60 * 1000;
  const elapsed = Date.now() - lastBreakTimeTimestamp;
  return elapsed >= twoHoursMs;
}
