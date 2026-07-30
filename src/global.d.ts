/**
 * Global type definitions for StretchNow web application.
 * Extends standard DOM types where TypeScript lib definitions are incomplete.
 */

interface NotificationOptions {
  /**
   * Indicates whether the user should be notified after a new notification
   * replaces an old one with the same tag.
   * Standard Web API feature supported by modern browsers.
   */
  renotify?: boolean;
}
