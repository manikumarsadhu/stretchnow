import { writable } from 'svelte/store';

/**
 * Synchronization states:
 * - 'IDLE': No pending queue items, cloud state matches local.
 * - 'PENDING_CHANGES': Local changes registered, waiting to sync.
 * - 'SYNCING': Lock active, uploading operational payloads.
 * - 'RETRYING': Backoff delay in progress after a connection query error.
 * - 'FAILED': Exceeded retry limits, sync halted.
 */
export const syncState = writable('IDLE');

/**
 * Keeps track of the last successful synchronization date/time.
 */
export const lastSyncTime = writable(null);
