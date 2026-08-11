/**
 * LocalRepository Abstraction Layer for StretchNow.
 * Decouples application logic and stores from underlying storage mechanisms.
 * Currently backed by localStorage; designed for seamless migration to IndexedDB (Dexie / IDB) without breaking component signatures.
 */

export class StorageDriver {
  /**
   * Retrieves a parsed JSON value by key.
   * @param {string} key
   * @returns {any}
   */
  get(key) {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (err) {
      console.error(`LocalRepository read error for key "${key}":`, err);
      return null;
    }
  }

  /**
   * Persists a JSON serializable value by key.
   * @param {string} key
   * @param {any} value
   */
  set(key, value) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`LocalRepository write error for key "${key}":`, err);
    }
  }

  /**
   * Removes a stored item by key.
   * @param {string} key
   */
  remove(key) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error(`LocalRepository remove error for key "${key}":`, err);
    }
  }
}

export const defaultDriver = new StorageDriver();

export const LocalRepository = {
  /**
   * Reads a record from local storage with optional fallback.
   * @template T
   * @param {string} key
   * @param {T} [fallback]
   * @returns {T|null}
   */
  get(key, fallback = null) {
    const data = defaultDriver.get(key);
    return data !== null && data !== undefined ? data : fallback;
  },

  /**
   * Saves a record to local storage.
   * @param {string} key
   * @param {any} value
   */
  set(key, value) {
    defaultDriver.set(key, value);
  },

  /**
   * Removes a record from local storage.
   * @param {string} key
   */
  remove(key) {
    defaultDriver.remove(key);
  }
};
