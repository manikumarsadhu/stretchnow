<script>
  import { onMount } from 'svelte';
  import { appStore, snoozeAlarm, stopAlarmRing, navigateTo } from '../stores/app.js';

  $: alarmInfo = $appStore.activeAlarmInfo || {};
  $: completedBreaks = $appStore.progress?.completedBreaksToday || 0;
  $: goalBreaks = $appStore.user?.dailyBreakGoal || 6;
  $: progressPercent = Math.min(100, Math.round((completedBreaks / goalBreaks) * 100));

  function handleStop() {
    stopAlarmRing();
  }

  function handleSnooze() {
    const minutes = $appStore.settings?.smartSchedule?.snoozeDuration || 15;
    snoozeAlarm(minutes);
  }

  function handleStartStretch() {
    stopAlarmRing();
    navigateTo('break');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleStartStretch();
    } else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      handleSnooze();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleStop();
    }
  }

  let cardEl;
  onMount(() => {
    if (cardEl && typeof cardEl.focus === 'function') {
      cardEl.focus();
    }
  });
</script>

<div
  class="alarm-overlay animate-fade-in"
  role="dialog"
  aria-modal="true"
  aria-label="Stretch Alarm Active"
  tabindex="0"
  on:keydown={handleKeyDown}
>
  <div class="alarm-backdrop"></div>

  <div class="alarm-card animate-scale-up" bind:this={cardEl} tabindex="-1">
    <!-- Animated Pulsing Bell Icon -->
    <div class="alarm-bell-wrap">
      <div class="bell-ripple"></div>
      <div class="bell-ripple delay"></div>
      <div class="bell-icon-inner">
        <span class="material-symbols-outlined bell-icon">notifications_active</span>
      </div>
    </div>

    <!-- Alarm Title & Message -->
    <div class="alarm-text-group">
      <span class="alarm-badge">⏰ STRETCH ALARM RINGING</span>
      <h2 class="alarm-title">{alarmInfo.title || 'Time for Your Stretch Break! 🧘'}</h2>
      <p class="alarm-body">{alarmInfo.body || 'Your body needs a quick posture refresh. Stand up & reset your energy!'}</p>
    </div>

    <!-- Today's Progress Bar -->
    <div class="today-progress-box">
      <div class="progress-info-row">
        <span class="progress-lbl">Today's Progress</span>
        <span class="progress-count">{completedBreaks} / {goalBreaks} breaks</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width: {progressPercent}%;"></div>
      </div>
    </div>

    <!-- Primary Action Controls: Stop, Snooze, Start -->
    <div class="alarm-actions-grid">
      <button class="alarm-btn btn-start" on:click={handleStartStretch} aria-label="Start Stretch Now (Press Enter)">
        <span class="material-symbols-outlined btn-ico">play_arrow</span>
        <span>Start Stretch Now</span>
      </button>

      <div class="secondary-actions">
        <button class="alarm-btn btn-snooze" on:click={handleSnooze} aria-label="Snooze Alarm (Press Space)">
          <span class="material-symbols-outlined btn-ico">snooze</span>
          <span>Snooze ({$appStore.settings?.smartSchedule?.snoozeDuration || 15}m)</span>
        </button>

        <button class="alarm-btn btn-stop" on:click={handleStop} aria-label="Stop Alarm (Press Escape)">
          <span class="material-symbols-outlined btn-ico">stop_circle</span>
          <span>Stop Alarm</span>
        </button>
      </div>
    </div>

    <div class="shortcut-hints">
      <span>⌨️ Shortcuts: <strong>Enter</strong> Start • <strong>Space</strong> Snooze • <strong>Esc</strong> Stop</span>
    </div>
  </div>
</div>

<style>
  .alarm-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
  }

  .alarm-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .alarm-card {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 400px;
    background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 28px;
    padding: 32px 24px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.25);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 24px;
    box-sizing: border-box;
  }

  /* Pulsing Bell Icon & Ripples */
  .alarm-bell-wrap {
    position: relative;
    width: 96px;
    height: 96px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bell-icon-inner {
    position: relative;
    z-index: 3;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.5);
  }

  .bell-icon {
    font-size: 42px;
    color: #ffffff;
    animation: bellShake 1.2s ease-in-out infinite;
  }

  .bell-ripple {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid rgba(99, 102, 241, 0.6);
    animation: rippleExpand 2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
  }

  .bell-ripple.delay {
    animation-delay: 0.8s;
  }

  @keyframes bellShake {
    0%, 100% { transform: rotate(0deg); }
    15% { transform: rotate(14deg); }
    30% { transform: rotate(-14deg); }
    45% { transform: rotate(10deg); }
    60% { transform: rotate(-10deg); }
    75% { transform: rotate(5deg); }
    90% { transform: rotate(-5deg); }
  }

  @keyframes rippleExpand {
    0% { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  .alarm-text-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .alarm-badge {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #818cf8;
    background: rgba(99, 102, 241, 0.16);
    padding: 4px 12px;
    border-radius: 99px;
    border: 1px solid rgba(99, 102, 241, 0.3);
  }

  .alarm-title {
    margin: 0;
    font-size: 1.45rem;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.25;
  }

  .alarm-body {
    margin: 0;
    font-size: 0.9rem;
    color: #94a3b8;
    line-height: 1.4;
  }

  /* Actions Grid */
  .alarm-actions-grid {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .alarm-btn {
    width: 100%;
    padding: 16px;
    border-radius: 16px;
    border: none;
    font-size: 1rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-sizing: border-box;
  }

  .btn-start {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #ffffff;
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.35);
  }

  .btn-start:active {
    transform: scale(0.98);
  }

  .secondary-actions {
    display: flex;
    gap: 10px;
    width: 100%;
  }

  .btn-snooze {
    flex: 1;
    background: rgba(245, 158, 11, 0.16);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  .btn-snooze:active {
    background: rgba(245, 158, 11, 0.28);
  }

  .btn-stop {
    flex: 1;
    background: rgba(239, 68, 68, 0.16);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .btn-stop:active {
    background: rgba(239, 68, 68, 0.28);
  }

  .btn-ico {
    font-size: 22px;
  }

  /* Today's Progress Box */
  .today-progress-box {
    width: 100%;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    box-sizing: border-box;
  }

  .progress-info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.78rem;
  }

  .progress-lbl {
    color: #94a3b8;
    font-weight: 600;
  }

  .progress-count {
    color: #10b981;
    font-weight: 700;
  }

  .progress-track {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 99px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
    border-radius: 99px;
    transition: width 0.4s ease;
  }

  .shortcut-hints {
    font-size: 0.72rem;
    color: #64748b;
    margin-top: 4px;
  }

  .shortcut-hints strong {
    color: #94a3b8;
  }
</style>
