<script>
  import ProgressRing from './ProgressRing.svelte';
  import { formatTime } from '../utils/timer.js';

  export let seconds = 120;
  export let totalSeconds = 120;
  export let isRunning = false;
  export let label = 'Remaining Time';

  $: progress = totalSeconds > 0 ? Math.round(((totalSeconds - seconds) / totalSeconds) * 100) : 0;
  $: formatted = formatTime(seconds);
</script>

<div class="countdown-wrapper">
  <ProgressRing {progress} size={220} strokeWidth={14} color="var(--primary)">
    <span class="timer-digits">{formatted}</span>
    <span class="timer-label">{label}</span>
    {#if isRunning}
      <span class="pulse-dot"></span>
    {/if}
  </ProgressRing>
</div>

<style>
  .countdown-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 16px 0;
  }

  .timer-digits {
    font-size: 3.2rem;
    font-weight: 800;
    font-family: var(--font-heading, 'Outfit', sans-serif);
    letter-spacing: -0.03em;
    color: var(--text-heading);
    line-height: 1;
  }

  .timer-label {
    font-size: 0.8rem;
    color: var(--primary);
    margin-top: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    max-width: 170px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pulse-dot {
    width: 8px;
    height: 8px;
    background: var(--emerald);
    border-radius: 50%;
    margin-top: 8px;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  }
</style>

