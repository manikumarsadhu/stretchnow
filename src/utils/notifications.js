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
  return { alertMode: 'tone', soundEnabled: true, reminderSound: 'zen', celebrationSound: 'victory' };
}

let sharedAudioCtx = null;
function getAudioContext() {
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || /** @type {any} */(window).webkitAudioContext;
    if (AudioContextClass) sharedAudioCtx = new AudioContextClass();
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

// ── Alert Sound Profiles ──
export function playAlertSound(type = 'zen', volumeMultiplier = 1.0) {
  try {
    const audioCtx = getAudioContext();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const settings = getAlertSettings();
    const baseVolume = (settings.alarmVolume ?? 0.8) * volumeMultiplier;

    if (type === 'crystal') {
      // High crisp 3-note triad: C6 (1046.5Hz), E6 (1318.5Hz), G6 (1567.98Hz)
      [1046.5, 1318.5, 1567.98].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2 * baseVolume, now + idx * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.5);
      });
    } else if (type === 'marimba') {
      // Warm wooden percussive double knock: F4 (349.23Hz) -> C5 (523.25Hz)
      [349.23, 523.25].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.001, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.35, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.3);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.35);
      });
    } else if (type === 'digital') {
      // Tech double-beep: 900Hz -> 1350Hz
      [900, 1350].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.001, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.1 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.12);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.14);
      });
    } else if (type === 'gong') {
      // Low resonant gong: 220Hz -> 440Hz
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.8);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.start(now);
      osc.stop(now + 1.25);
    } else {
      // Default Zen Bell dual tone: E5 (659.25Hz) -> A5 (880Hz)
      playChime();
    }
  } catch (e) {
    console.warn('Could not play alert sound:', e);
  }
}

// ── Celebration Sound Profiles ──
export function playCelebrationSound(type = 'victory') {
  try {
    const audioCtx = getAudioContext();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    if (type === 'level_up') {
      // Fast ascending 5-note sparkle arpeggio: C5 -> E5 -> G5 -> C6 -> E6
      [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.001, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.22, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.4);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.45);
      });
    } else if (type === 'fanfare') {
      // Grand brass triad chord: G4 + C5 + E5 + G5
      [392.00, 523.25, 659.25, 783.99].forEach((freq) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        osc.start(now);
        osc.stop(now + 0.95);
      });
    } else if (type === 'bubbly') {
      // Bubbly joy: 3 fast rising popping tones
      [440, 660, 880].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.3, now + idx * 0.06 + 0.08);
        gain.gain.setValueAtTime(0.001, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.28);
      });
    } else {
      // Victory Fanfare (Default): C5 -> E5 -> G5 -> C6
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = idx === 3 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.001, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.09 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + (idx === 3 ? 0.7 : 0.35));
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + (idx === 3 ? 0.75 : 0.4));
      });
    }
  } catch (e) {
    console.warn('Could not play celebration sound:', e);
  }
}

export function playChime() {
  try {
    const audioCtx = getAudioContext();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    
    // Tone 1 (E5)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.25, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc1.start(now);
    osc1.stop(now + 0.6);
    
    // Tone 2 (A5)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now + 0.12);
    gain2.gain.setValueAtTime(0.001, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.17);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.67);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.72);
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

let alarmSoundIntervalId = null;
let autoStopTimeoutId = null;

export function startAlarmRinging(soundType = 'zen') {
  stopAlarmRinging();
  let ringCount = 0;
  playAlertSound(soundType, 0.2); // Start 0s at 20% volume
  
  alarmSoundIntervalId = setInterval(() => {
    ringCount++;
    // Ramp volume over 10s (4 intervals * 2.5s) from 20% to 100%
    const volumeRamp = Math.min(1.0, 0.2 + (ringCount * 0.2));
    playAlertSound(soundType, volumeRamp);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([400, 200, 400]);
    }
  }, 2500);

  // Smart Auto Stop after 30s of unattended ringing
  autoStopTimeoutId = setTimeout(() => {
    stopAlarmRinging();
  }, 30000);

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([400, 200, 400]);
  }
}

export function stopAlarmRinging() {
  if (alarmSoundIntervalId) {
    clearInterval(alarmSoundIntervalId);
    alarmSoundIntervalId = null;
  }
  if (autoStopTimeoutId) {
    clearTimeout(autoStopTimeoutId);
    autoStopTimeoutId = null;
  }
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(0);
  }
}

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
        badge: '/icon-192.png',
        silent: isSilent,
        requireInteraction: true, // Holds on screen-off / mobile lock screen
        tag: 'stretchnow-alarm',
        renotify: true
      });
      
      if (mode === 'tone' && settings.soundEnabled !== false) {
        startAlarmRinging(settings.reminderSound || 'zen');
      } else if (mode === 'vibrate' && 'vibrate' in navigator) {
        navigator.vibrate([500, 250, 500, 250, 500]);
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
