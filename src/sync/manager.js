import { syncState, lastSyncTime } from './status.js';
import { getQueue, removeOperation, incrementRetry } from './queue.js';
import { databases, DATABASE_ID, isCollectionNotFoundError } from '../lib/appwrite.js';

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
 * Groups and batches pending queue operations targeting the same document into a single merged payload.
 * @param {Array} operations
 * @returns {Array}
 */
export function batchOperations(operations) {
  if (!operations || operations.length <= 1) {
    return operations.map(op => ({ ...op, opIds: [op.id] }));
  }

  const batchedMap = new Map();
  const batchedList = [];

  for (const op of operations) {
    const key = `${op.collection}:${op.documentId}`;
    if (op.operation === 'update' && batchedMap.has(key)) {
      const existing = batchedMap.get(key);
      existing.payload = {
        ...existing.payload,
        ...op.payload
      };
      existing.opIds.push(op.id);
      existing.timestamp = Math.max(existing.timestamp, op.timestamp || 0);
    } else {
      const batchedOp = {
        ...op,
        opIds: [op.id]
      };
      batchedMap.set(key, batchedOp);
      batchedList.push(batchedOp);
    }
  }

  return batchedList;
}

/**
 * Processes queued database transactions with batch deduplication.
 */
export async function processQueue() {
  if (isSyncing) return; // Prevent concurrent sync loops
  
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

  // Deduplicate and batch operations per document before making API calls
  const batchedOps = batchOperations([...queueObj.operations]);
  let _processedCount = 0;

  for (const op of batchedOps) {
    let success = false;
    try {
      // Execute 1 batched database write per document
      await databases.updateDocument(
        DATABASE_ID,
        op.collection,
        op.documentId,
        op.payload
      );
      success = true;
    } catch (err) {
      if (isCollectionNotFoundError(err)) {
        console.warn(`[Appwrite Sync] Collection '${op.collection}' does not exist in Database '${DATABASE_ID}'. Dequeuing operations.`);
        op.opIds.forEach(id => removeOperation(id));
        _processedCount++;
        continue;
      }

      console.warn(`Sync operation for ${op.documentId} failed:`, err);
      
      // If doc is missing (404), try creating it with batched payload
      if (/** @type {any} */(err)?.code === 404) {
        try {
          await databases.createDocument(
            DATABASE_ID,
            op.collection,
            op.documentId,
            op.payload
          );
          success = true;
        } catch (createErr) {
          if (isCollectionNotFoundError(createErr)) {
            console.warn(`[Appwrite Sync] Collection '${op.collection}' does not exist. Dequeuing operations.`);
            op.opIds.forEach(id => removeOperation(id));
            _processedCount++;
            continue;
          }
          console.error(`Document creation failed for ${op.documentId}:`, createErr);
        }
      }
    }

    if (success) {
      // Mark all coalesced operations as completed and remove from queue
      op.opIds.forEach(id => removeOperation(id));
      _processedCount++;
    } else {
      op.opIds.forEach(id => incrementRetry(id));
      const updatedOp = getQueue().operations.find(o => op.opIds.includes(o.id));
      const retryCount = updatedOp ? updatedOp.retryCount : 1;

      if (retryCount >= 4) {
        console.error(`Operation for ${op.documentId} exceeded retry limits. Sync failed.`);
        syncState.set('FAILED');
        isSyncing = false;
        return;
      } else {
        const delay = BACKOFF_DELAYS[retryCount - 1] || 2000;
        console.log(`Scheduling retry for ${op.documentId} in ${delay}ms (Attempt #${retryCount})`);
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
  const remainingOps = getQueue().operations;
  if (remainingOps.length === 0) {
    lastSyncTime.set(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    syncState.set('IDLE');
  } else {
    syncState.set('PENDING_CHANGES');
  }
  isSyncing = false;

  // Double check if any new transactions were enqueued during sync
  const finalCheck = getQueue();
  if (finalCheck.operations.length > 0 && finalCheck.operations.length !== remainingOps.length) {
    processQueue();
  }
}

