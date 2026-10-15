import { writable } from 'svelte/store';

/**
 * @typedef {Object} ToastData
 * @property {string} message
 * @property {string} [icon]
 * @property {string} [actionText]
 * @property {(() => void) | null} [onAction]
 * @property {'info' | 'success' | 'warning' | 'error'} [type]
 */

/** @type {import('svelte/store').Writable<ToastData | null>} */
export const toast = writable(null);

let toastTimer = null;

/**
 * Displays a snackbar notification with optional actionable button.
 * @param {ToastData & { duration?: number }} options
 */
export function showToast({
  message,
  icon = 'info',
  actionText = '',
  onAction = null,
  type = 'info',
  duration = 4000
}) {
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }

  toast.set({
    message,
    icon,
    actionText,
    onAction,
    type
  });

  if (duration > 0) {
    toastTimer = setTimeout(() => {
      toast.set(null);
      toastTimer = null;
    }, duration);
  }
}

/**
 * Hides current snackbar notification.
 */
export function hideToast() {
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
  toast.set(null);
}
