<script>
  import { appStore, cancelSnooze } from '../stores/app.js';

  $: snoozeSeconds = $appStore.snoozeRemainingSeconds || 0;

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
</script>

{#if snoozeSeconds > 0}
  <div class="snooze-banner animate-fade-in">
    <div class="snooze-info">
      <div class="snooze-icon-wrap">
        <span class="material-symbols-outlined snooze-ico">snooze</span>
      </div>
      <div class="snooze-text">
        <span class="snooze-lbl">Alarm Snoozed</span>
        <span class="snooze-timer">Next reminder in <strong>{formatTime(snoozeSeconds)}</strong></span>
      </div>
    </div>

    <button class="cancel-snooze-btn" on:click={cancelSnooze} aria-label="Cancel Snooze Timer">
      <span>Cancel Snooze</span>
    </button>
  </div>
{/if}

<style>
  .snooze-banner {
    position: fixed;
    bottom: 84px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    width: calc(100% - 32px);
    max-width: 440px;
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.94) 0%, rgba(15, 23, 42, 0.94) 100%);
    border: 1px solid rgba(245, 158, 11, 0.35);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 16px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 20px rgba(245, 158, 11, 0.15);
    box-sizing: border-box;
  }

  .snooze-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .snooze-icon-wrap {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: rgba(245, 158, 11, 0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fbbf24;
    flex-shrink: 0;
  }

  .snooze-ico {
    font-size: 22px;
  }

  .snooze-text {
    display: flex;
    flex-direction: column;
    text-align: left;
  }

  .snooze-lbl {
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #fbbf24;
  }

  .snooze-timer {
    font-size: 0.85rem;
    color: #cbd5e1;
  }

  .snooze-timer strong {
    color: #ffffff;
    font-family: monospace;
    font-size: 0.92rem;
  }

  .cancel-snooze-btn {
    background: rgba(239, 68, 68, 0.16);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.3);
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;
  }

  .cancel-snooze-btn:active {
    background: rgba(239, 68, 68, 0.28);
    transform: scale(0.96);
  }
</style>
