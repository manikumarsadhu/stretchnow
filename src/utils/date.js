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
