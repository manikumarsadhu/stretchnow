/**
 * Validates a backup JSON import for StretchNow.
 * Checks version metadata, app namespace, and required key structures.
 */
export function validateBackup(backup) {
  if (!backup || typeof backup !== 'object') {
    throw new Error('Invalid backup file format: Root must be a JSON object.');
  }

  if (backup.app !== 'StretchNow') {
    throw new Error('Invalid backup file: Not a StretchNow database backup.');
  }

  if (typeof backup.version !== 'number' || backup.version <= 0) {
    throw new Error('Invalid backup version tag.');
  }

  const { data } = backup;
  if (!data || typeof data !== 'object') {
    throw new Error('Backup data block is missing or corrupt.');
  }

  // Required nested states
  const requiredKeys = ['user', 'settings', 'progress', 'statistics'];
  for (const key of requiredKeys) {
    if (!data[key] || typeof data[key] !== 'object') {
      throw new Error(`Data integrity check failed: Missing state category "${key}".`);
    }
  }

  // Verify structure values roughly
  if (typeof data.user.dailyBreakGoal !== 'number' || typeof data.user.dailyWaterGoal !== 'number') {
    throw new Error('User profile data format is corrupt.');
  }

  if (!Array.isArray(data.statistics.dailyBreaks) || !Array.isArray(data.statistics.waterIntake)) {
    throw new Error('Statistics data arrays are missing or corrupt.');
  }

  return true;
}
