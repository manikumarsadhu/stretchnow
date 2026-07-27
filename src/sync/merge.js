/**
 * Conflict Resolution and Merging Algorithms for StretchNow.
 */

/**
 * Resolves profile conflicts: Latest timestamp wins.
 */
export function mergeProfile(local, cloud) {
  const localTime = new Date(local.updatedAt || 0).getTime();
  const cloudTime = new Date(cloud.updatedAt || 0).getTime();
  return localTime >= cloudTime ? local : cloud;
}

/**
 * Resolves settings conflicts: Latest timestamp wins.
 */
export function mergeSettings(local, cloud) {
  const localTime = new Date(local.updatedAt || 0).getTime();
  const cloudTime = new Date(cloud.updatedAt || 0).getTime();
  return localTime >= cloudTime ? local : cloud;
}

/**
 * Resolves daily logs conflicts:
 * Merges numeric counters by taking the maximum, combining notes/moods, and using the latest timestamp.
 */
export function mergeDailyLogs(local, cloud) {
  return {
    breaksCompleted: Math.max(local.breaksCompleted || 0, cloud.breaksCompleted || 0),
    breaksSkipped: Math.max(local.breaksSkipped || 0, cloud.breaksSkipped || 0),
    stretchMinutes: Math.max(local.stretchMinutes || 0, cloud.stretchMinutes || 0),
    waterCups: Math.max(local.waterCups || 0, cloud.waterCups || 0),
    sittingMinutes: Math.max(local.sittingMinutes || 0, cloud.sittingMinutes || 0),
    wellnessScore: Math.max(local.wellnessScore || 0, cloud.wellnessScore || 0),
    xpEarned: Math.max(local.xpEarned || 0, cloud.xpEarned || 0),
    mood: local.mood || cloud.mood || '🙂',
    notes: local.notes || cloud.notes || '',
    updatedAt: new Date(Math.max(
      new Date(local.updatedAt || 0).getTime(),
      new Date(cloud.updatedAt || 0).getTime()
    )).toISOString()
  };
}

/**
 * Resolves achievements conflicts:
 * Merges unlocked badges using a Set Union (never delete).
 */
export function mergeAchievements(localBadges = [], cloudBadges = []) {
  const merged = new Set([...localBadges, ...cloudBadges]);
  return Array.from(merged);
}

/**
 * Resolves statistics conflicts:
 * Takes max totals or recalculates aggregates.
 */
export function mergeStatistics(local, cloud) {
  return {
    totalBreaks: Math.max(local.totalBreaks || 0, cloud.totalBreaks || 0),
    totalWater: Math.max(local.totalWater || 0, cloud.totalWater || 0),
    totalXP: Math.max(local.totalXP || 0, cloud.totalXP || 0),
    level: Math.max(local.level || 1, cloud.level || 1),
    currentStreak: Math.max(local.currentStreak || 1, cloud.currentStreak || 1),
    longestStreak: Math.max(local.longestStreak || 1, cloud.longestStreak || 1),
    updatedAt: new Date().toISOString()
  };
}
