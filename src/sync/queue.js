/**
 * Persistent Operational Transaction Queue for StretchNow.
 * Stores sync operations in localStorage to survive browser reloads or crashes.
 */

const QUEUE_KEY = 'stretchnow_sync_queue';
const QUEUE_VERSION = 2;

export function getQueue() {
  if (typeof window === 'undefined') {
    return { version: QUEUE_VERSION, createdAt: new Date().toISOString(), operations: [] };
  }
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return { version: QUEUE_VERSION, createdAt: new Date().toISOString(), operations: [] };
    const parsed = JSON.parse(raw);
    if (parsed.version !== QUEUE_VERSION) {
      // Version mismatch fallback / migration
      return { version: QUEUE_VERSION, createdAt: new Date().toISOString(), operations: [] };
    }
    return parsed;
  } catch {
    return { version: QUEUE_VERSION, createdAt: new Date().toISOString(), operations: [] };
  }
}

export function saveQueue(queueObj) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queueObj));
  } catch (err) {
    console.error('Failed to save operational sync queue:', err);
  }
}

/**
 * Pushes a new operation to the queue, coalescing duplicate updates.
 */
export function enqueue(collection, documentId, operation, payload) {
  const queueObj = getQueue();
  const id = `op_${Math.random().toString(36).slice(2, 9)}`;
  const timestamp = Date.now();

  // Deduplication/Coalescing Logic:
  // If there's already an 'update' operation queued for the same document,
  // we merge the properties to reduce network payload and server write limits.
  if (operation === 'update') {
    const existingIdx = queueObj.operations.findIndex(
      (op) => op.collection === collection && op.documentId === documentId && op.operation === 'update'
    );
    if (existingIdx !== -1) {
      const existingOp = queueObj.operations[existingIdx];
      // Merge partial updates
      existingOp.payload = {
        ...existingOp.payload,
        ...payload
      };
      existingOp.timestamp = timestamp;
      saveQueue(queueObj);
      return;
    }
  }

  const newOp = {
    id,
    collection,
    documentId,
    operation,
    payload,
    timestamp,
    retryCount: 0
  };

  queueObj.operations.push(newOp);
  saveQueue(queueObj);
}

/**
 * Removes a transaction operation by ID post successful sync.
 */
export function removeOperation(opId) {
  const queueObj = getQueue();
  queueObj.operations = queueObj.operations.filter((op) => op.id !== opId);
  saveQueue(queueObj);
}

/**
 * Increments the retry count of a failed operation.
 */
export function incrementRetry(opId) {
  const queueObj = getQueue();
  const op = queueObj.operations.find((o) => o.id === opId);
  if (op) {
    op.retryCount += 1;
    saveQueue(queueObj);
  }
}

/**
 * Clears the queue data.
 */
export function clearQueue() {
  saveQueue({ version: QUEUE_VERSION, createdAt: new Date().toISOString(), operations: [] });
}
