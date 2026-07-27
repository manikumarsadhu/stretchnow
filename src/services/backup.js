import { validateBackup } from '../validators/backupValidator.js';

/**
 * Exports current app store state to a versioned JSON backup file.
 */
export function exportBackup(state) {
  if (typeof document === 'undefined') return;

  const backupObject = {
    version: 2,
    exportedAt: new Date().toISOString(),
    app: 'StretchNow',
    data: {
      user: state.user,
      settings: state.settings,
      progress: state.progress,
      statistics: state.statistics
    }
  };

  try {
    const jsonString = JSON.stringify(backupObject, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `stretchnow_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export StretchNow backup:', err);
    throw new Error('Export failed: ' + (err instanceof Error ? err.message : String(err)), { cause: err });
  }
}

/**
 * Imports progress data from an uploaded JSON file and validates schema.
 */
export function importBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target.result;
        if (typeof result !== 'string') throw new Error('Unexpected file read result type.');
        const parsed = JSON.parse(result);
        validateBackup(parsed);
        resolve(parsed.data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file contents.'));
    reader.readAsText(file);
  });
}
