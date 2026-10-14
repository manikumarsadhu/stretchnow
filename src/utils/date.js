/**
 * Returns a date string formatted as YYYY-MM-DD in the user's local timezone.
 * Uses 'sv-SE' locale which natively formats as ISO YYYY-MM-DD without UTC conversion.
 * 
 * @param {Date | number} [date] - Optional Date object or epoch timestamp (defaults to now)
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function getLocalDateString(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('sv-SE');
}

/**
 * Returns yesterday's date string formatted as YYYY-MM-DD in the user's local timezone,
 * using calendar arithmetic to handle daylight saving time (DST) and month boundaries correctly.
 * 
 * @param {Date | number} [referenceDate] - Optional reference Date (defaults to now)
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function getYesterdayLocalDateString(referenceDate = new Date()) {
  const d = referenceDate instanceof Date ? new Date(referenceDate) : new Date(referenceDate);
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('sv-SE');
}

/**
 * Returns Monday-first index of the day of the week (0 = Monday, ..., 6 = Sunday).
 * Corrects JavaScript's default 0 = Sunday convention to match Monday-first weekly analytics.
 * 
 * @param {Date | number} [date]
 * @returns {number} 0 for Monday through 6 for Sunday
 */
export function getMondayFirstDayIndex(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return (d.getDay() + 6) % 7;
}

/**
 * Returns Monday Date object of the calendar week for the given date.
 * 
 * @param {Date | number | string} [date]
 * @returns {Date} Date set to Monday 00:00:00 of that week
 */
export function getMondayOfWeek(date = new Date()) {
  const d = date instanceof Date ? new Date(date) : new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Checks if two dates fall within the same Monday-to-Sunday calendar week.
 * 
 * @param {Date | number | string} d1
 * @param {Date | number | string} d2
 * @returns {boolean}
 */
export function isSameCalendarWeek(d1, d2) {
  if (!d1 || !d2) return false;
  return getMondayOfWeek(d1).getTime() === getMondayOfWeek(d2).getTime();
}
