let reminderIntervalId = null;

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Browser does not support desktop notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

export function sendStretchNotification(title = 'Stretch Time!', body = 'Stand up and stretch for 2 minutes.') {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.svg',
        silent: false
      });
    } catch (e) {
      console.warn('Could not launch Notification:', e);
    }
  }
}

export function scheduleStretchReminders(intervalMinutes = 45, onTrigger) {
  if (reminderIntervalId) {
    clearInterval(reminderIntervalId);
  }
  
  if (!intervalMinutes || intervalMinutes <= 0) return;
  
  const intervalMs = intervalMinutes * 60 * 1000;
  reminderIntervalId = setInterval(() => {
    sendStretchNotification(
      'Posture & Stretch Reminder 🧘‍♂️',
      'Time to take a quick 2-minute break and loosen up!'
    );
    if (onTrigger) onTrigger();
  }, intervalMs);
}

export function stopScheduler() {
  if (reminderIntervalId) {
    clearInterval(reminderIntervalId);
    reminderIntervalId = null;
  }
}
