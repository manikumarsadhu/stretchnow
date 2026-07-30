/**
 * Queries system permissions and browser specifications for diagnostic reviews.
 */
export async function runSystemDiagnostics() {
  const diagnostics = {
    notifications: 'unsupported',
    serviceWorker: 'unsupported',
    storageQuota: 'unknown',
    offlineMode: 'online',
    audioSupport: false,
    pwaInstalled: false,
    browserCompatible: true
  };

  if (typeof window !== 'undefined') {
    // 1. Notifications permission
    if ('Notification' in window) {
      diagnostics.notifications = Notification.permission; // 'granted' | 'denied' | 'default'
    }

    // 2. Service Worker status
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        diagnostics.serviceWorker = registrations.length > 0 ? 'active' : 'inactive';
      } catch {
        diagnostics.serviceWorker = 'supported';
      }
    }

    // 3. Local Storage quota estimate
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const usageMb = (((estimate.usage || 0)) / (1024 * 1024)).toFixed(2);
        const quotaMb = (((estimate.quota || 0)) / (1024 * 1024)).toFixed(2);
        diagnostics.storageQuota = `${usageMb} MB of ${quotaMb} MB used`;
      } catch {
        diagnostics.storageQuota = 'available';
      }
    } else {
      diagnostics.storageQuota = 'available (local)';
    }

    // 4. Offline mode status
    diagnostics.offlineMode = navigator.onLine ? 'online' : 'offline';

    // 5. Audio Synthesizer compatibility
    diagnostics.audioSupport = !!(window.AudioContext || /** @type {any} */(window).webkitAudioContext);

    // 6. PWA install stand-alone check
    diagnostics.pwaInstalled = window.matchMedia('(display-mode: standalone)').matches || /** @type {any} */(window.navigator).standalone === true;

    // 7. General browser compatibility
    diagnostics.browserCompatible = 'localStorage' in window && 'fetch' in window;
  }

  return diagnostics;
}
