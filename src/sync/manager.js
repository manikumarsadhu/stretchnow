import { syncState, lastSyncTime } from './status.js';
import { getQueue, removeOperation, incrementRetry } from './queue.js';
import { databases, DATABASE_ID } from '../lib/appwrite.js';

// Sync concurrency lock
let isSyncing = false;

// Backoff delays for failed retries (Exponential: 2s -> 5s -> 15s -> 30s)
const BACKOFF_DELAYS = [2000, 5000, 15000, 30000];

/**
 * Initializes listeners for online/offline events to trigger syncs automatically.
 */
export function initSyncManager() {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    console.log('Network online. Processing sync queue.');
    syncState.set('PENDING_CHANGES');
    processQueue();
  });

  window.addEventListener('offline', () => {
    console.log('Network offline. Pausing sync.');
    syncState.set('OFFLINE');
  });

  // Run initial sync on load
  processQueue();
}

/**
 * Processes queued database transactions sequentially.
 */
export async function processQueue() {
  if (isSyncing) return; // Prevent concurrent loops
  
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    syncState.set('OFFLINE');
    return;
  }

  const queueObj = getQueue();
  if (!queueObj.operations || queueObj.operations.length === 0) {
    syncState.set('IDLE');
    return;
  }

  isSyncing = true;
  syncState.set('SYNCING');

  // Process operations sequentially
  for (const op of queueObj.operations) {
    let success = false;
    try {
      // Execute the database write to Appwrite collections
      await databases.updateDocument(
        DATABASE_ID,
        op.collection, // Collection ID (e.g. 'daily_logs')
        op.documentId, // Document ID (e.g. 'userId_date')
        op.payload     // Partial update payload
      );
      success = true;
    } catch (err) {
      console.warn(`Sync operation ${op.id} failed:`, err);
      
      // If doc is missing (404), try creating it first
      if (err?.code === 404) {
        try {
          await databases.createDocument(
            DATABASE_ID,
            op.collection,
            op.documentId,
            op.payload
          );
          success = true;
        } catch (createErr) {
          console.error(`Document creation failed for ${op.id}:`, createErr);
        }
      }
    }

    if (success) {
      removeOperation(op.id);
    } else {
      incrementRetry(op.id);
      const updatedOp = getQueue().operations.find(o => o.id === op.id);
      const retryCount = updatedOp ? updatedOp.retryCount : 1;

      if (retryCount >= 4) {
        // Exceeded maximum retries (4 attempts)
        console.error(`Operation ${op.id} exceeded retry limits. Sync failed.`);
        syncState.set('FAILED');
        isSyncing = false;
        return;
      } else {
        // Schedule retry with exponential backoff
        const delay = BACKOFF_DELAYS[retryCount - 1] || 2000;
        console.log(`Scheduling retry for ${op.id} in ${delay}ms (Attempt #${retryCount})`);
        syncState.set('RETRYING');
        isSyncing = false;

        setTimeout(() => {
          processQueue();
        }, delay);
        return;
      }
    }
  }

  // Complete processing
  lastSyncTime.set(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  syncState.set('IDLE');
  isSyncing = false;

  // Double check if any new transactions were enqueued during sync
  const finalCheck = getQueue();
  if (finalCheck.operations.length > 0) {
    processQueue();
  }
}
