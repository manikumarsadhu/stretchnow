let reminderIntervalId = null;

function getAlertSettings() {
  try {
    const raw = localStorage.getItem('stretchnow_v1_data');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.settings || {};
    }
  } catch (e) {
    console.error('Error reading settings for notification alert:', e);
  }
  return { alertMode: 'tone', soundEnabled: true };
}

export function playChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const audioCtx = new AudioContext();
    
    // Tone 1 (E5)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime);
    gain1.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.55);
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.6);
    
    // Tone 2 (A5)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.001, audioCtx.currentTime + 0.12);
    gain2.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.17);
    gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.67);
    osc2.start(audioCtx.currentTime + 0.12);
    osc2.stop(audioCtx.currentTime + 0.72);
  } catch (e) {
    console.warn('Synthesized chime failed to play:', e);
  }
}

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

const ROTATING_MESSAGES = [
  { title: "Time to stretch! 🧘", body: "Your spine needs you 😊" },
  { title: "Micro-break time! ⏱️", body: "Stand up for 2 minutes" },
  { title: "Screen fatigue? 👀", body: "Your eyes deserve a break" },
  { title: "Stay refreshed! 💧", body: "Hydrate now and take a posture reset" },
  { title: "Streak protection! 🔥", body: "Keep your streak alive by stretching" },
  { title: "Mindful break! 💨", body: "Loosen up with a breathing reset" }
];
let messageIndex = 0;

export function sendStretchNotification(title, body) {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    const settings = getAlertSettings();
    const mode = settings.alertMode || 'tone';
    
    // Check smart schedule criteria
    const now = new Date();
    if (settings.smartSchedule) {
      const { weekendMode, lunchStart, lunchEnd, activeMeetingMode } = settings.smartSchedule;
      
      if (activeMeetingMode) {
        console.log("Reminder skipped: Meeting Mode is active");
        return;
      }
      
      const day = now.getDay();
      const isWeekend = day === 0 || day === 6;
      if (isWeekend && !weekendMode) {
        console.log("Reminder skipped: Weekend (disabled)");
        return;
      }
      
      const currentHourMin = now.toTimeString().slice(0, 5); // "HH:MM"
      if (lunchStart && lunchEnd && currentHourMin >= lunchStart && currentHourMin <= lunchEnd) {
        console.log("Reminder skipped: Lunch break pause");
        return;
      }
    }
    
    // Use rotating message if none supplied
    let displayTitle = title;
    let displayBody = body;
    if (!displayTitle || !displayBody) {
      const rot = ROTATING_MESSAGES[messageIndex];
      displayTitle = rot.title;
      displayBody = rot.body;
      messageIndex = (messageIndex + 1) % ROTATING_MESSAGES.length;
    }
    
    const isSilent = mode === 'silent' || mode === 'vibrate' || mode === 'tone';
    
    try {
      new Notification(displayTitle, {
        body: displayBody,
        icon: '/icon-192.png',
        silent: isSilent
      });
      
      if (mode === 'tone' && settings.soundEnabled !== false) {
        playChime();
      }
      
      if (mode === 'vibrate' && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
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
    sendStretchNotification(); // Automatically uses rotated messages
    if (onTrigger) onTrigger();
  }, intervalMs);
}

export function stopScheduler() {
  if (reminderIntervalId) {
    clearInterval(reminderIntervalId);
    reminderIntervalId = null;
  }
}
