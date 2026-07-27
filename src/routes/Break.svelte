<script>
  import { onDestroy, onMount } from 'svelte';
  import Countdown from '../components/Countdown.svelte';
  import Button from '../components/Button.svelte';
  import Card from '../components/Card.svelte';
  import { appStore, completeBreak, navigateTo } from '../stores/app.js';
  import { startTimer, pauseTimer, resetTimer } from '../utils/timer.js';
  import { STRETCHES } from '../utils/stretches.js';
  import StretchAnimation from '../components/StretchAnimation.svelte';
  import { playChime } from '../utils/notifications.js';
  import { playRelaxationSound, stopRelaxationSound } from '../utils/sounds.js';

  // Select 3 guided poses for 2-minute break (40s each = 120s)
  const breakRoutine = STRETCHES.slice(0, 3);
  let currentStepIndex = 0;
  let remainingSeconds = 120;
  let isRunning = false;
  let isCompleted = false;
  let selectedSound = 'none';

  $: currentPose = breakRoutine[currentStepIndex] || breakRoutine[0];

  function handleStart() {
    isRunning = true;
    if (selectedSound !== 'none') {
      playRelaxationSound(selectedSound);
    }
    startTimer(
      (updateFn) => {
        const nextSeconds = updateFn(remainingSeconds);
        // Play chime on transitions (80s, 40s) if audio is enabled
        if ($appStore.settings?.soundEnabled && (nextSeconds === 80 || nextSeconds === 40)) {
          playChime();
        }
        remainingSeconds = nextSeconds;
        if (remainingSeconds === 80) currentStepIndex = 1;
        if (remainingSeconds === 40) currentStepIndex = 2;
      },
      () => {
        isRunning = false;
        isCompleted = true;
        stopRelaxationSound();
        if ($appStore.settings?.soundEnabled) {
          playChime();
        }
        completeBreak(50);
      }
    );
  }

  function handlePause() {
    isRunning = false;
    pauseTimer();
    stopRelaxationSound();
  }

  function handleReset() {
    handlePause();
    remainingSeconds = 120;
    currentStepIndex = 0;
    isCompleted = false;
  }

  function handleSkipStep() {
    if (currentStepIndex < breakRoutine.length - 1) {
      currentStepIndex += 1;
      remainingSeconds = Math.max(0, 120 - currentStepIndex * 40);
    }
  }

  function handleFinish() {
    if (!isCompleted) {
      completeBreak(30);
    }
    handlePause();
    navigateTo('home');
  }

  function handleSoundChange(e) {
    selectedSound = e.target.value;
    if (selectedSound === 'none') {
      stopRelaxationSound();
    } else if (isRunning) {
      playRelaxationSound(selectedSound);
    } else {
      // Play immediately if selected, even if paused
      playRelaxationSound(selectedSound);
    }
  }

  function handleKeydown(e) {
    if (isCompleted) return;
    
    // Ignore input text areas if any (none on this page, but good safety)
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        if (isRunning) {
          handlePause();
        } else {
          handleStart();
        }
        break;
      case 's':
      case 'S':
        handleSkipStep();
        break;
      case 'r':
      case 'R':
        handleReset();
        break;
      case 'Escape':
        handleFinish();
        break;
    }
  }

  onMount(() => {
    handleStart();
  });

  onDestroy(() => {
    resetTimer();
    stopRelaxationSound();
  });
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="break-screen animate-fade-in">
  <!-- Top Bar -->
  <div class="top-bar">
    <button class="back-btn" on:click={handleFinish} aria-label="Close stretch break">
      <span class="material-symbols-outlined">close</span>
    </button>
    <span class="top-title">2-Min Guided Break</span>
    <span class="step-indicator">Step {currentStepIndex + 1} / {breakRoutine.length}</span>
  </div>

  {#if isCompleted}
    <div class="completion-view animate-fade-in">
      <div class="trophy-wrapper">
        <div class="trophy-badge">
          <span class="material-symbols-outlined trophy-icon">military_tech</span>
        </div>
        <div class="glow-ring"></div>
      </div>
      
      <h2 class="comp-title">Break Completed! 🎉</h2>
      <p class="comp-desc">Awesome work! You earned <strong>+50 Wellness Points</strong> and gave your spine a healthy refresh.</p>

      <Card padding="md">
        <div class="comp-stats">
          <div class="stat-item">
            <span class="stat-num">+50</span>
            <span class="stat-lbl">Points</span>
          </div>
          <div class="divider"></div>
          <div class="stat-item">
            <span class="stat-num">2:00</span>
            <span class="stat-lbl">Duration</span>
          </div>
        </div>
      </Card>

      <div class="comp-actions">
        <Button variant="primary" size="lg" fullWidth icon="check" onclick={handleFinish}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  {:else}
    <!-- Active Timer View -->
    <Countdown seconds={remainingSeconds} totalSeconds={120} {isRunning} label={`Step ${currentStepIndex + 1}: ${currentPose.title}`} />

    <!-- Current Pose Card -->
    <Card padding="md">
      <div class="pose-container">
        <!-- Visual Stretch Animation Guide -->
        <StretchAnimation id={currentPose.id} />

        <div class="pose-header">
          <div class="pose-header-info">
            <h3 class="pose-title">{currentPose.title}</h3>
            <span class="pose-target">
              <span class="material-symbols-outlined target-bullet">adjust</span>
              Target: {currentPose.target}
            </span>
          </div>
        </div>

        <div class="instructions-wrap">
          {#each currentPose.instructions as step, idx}
            <div class="instruction-row">
              <span class="step-num-badge">{idx + 1}</span>
              <span class="instruction-text">{step}</span>
            </div>
          {/each}
        </div>

        {#if currentPose.tips}
          <div class="tip-box">
            <span class="material-symbols-outlined tip-box-icon">info</span>
            <span>{currentPose.tips}</span>
          </div>
        {/if}
      </div>
    </Card>

    <!-- Relaxation Sounds Panel -->
    <div class="sounds-panel">
      <span class="material-symbols-outlined sound-panel-icon">music_note</span>
      <span class="sounds-label">Relaxation Audio:</span>
      <select class="sounds-select" value={selectedSound} on:change={handleSoundChange}>
        <option value="none">🔇 Muted</option>
        <option value="ocean">🌊 Ocean Waves</option>
        <option value="rain">🌧️ Gentle Rain</option>
        <option value="forest">🌲 Whistling Wind</option>
        <option value="white_noise">💨 Steady White Noise</option>
      </select>
    </div>

    <!-- Controls -->
    <div class="controls-bar">
      <Button variant="outline" size="md" icon="restart_alt" onclick={handleReset}>
        Reset
      </Button>

      {#if isRunning}
        <Button variant="primary" size="lg" icon="pause" onclick={handlePause}>
          Pause
        </Button>
      {:else}
        <Button variant="primary" size="lg" icon="play_arrow" onclick={handleStart}>
          Resume
        </Button>
      {/if}

      <Button variant="ghost" size="md" icon="skip_next" onclick={handleSkipStep}>
        Skip
      </Button>
    </div>
  {/if}
</div>

<style>
  .break-screen {
    min-height: 100vh;
    padding: 20px 20px 110px;
    max-width: 480px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    background: var(--bg-gradient, transparent);
  }

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .back-btn {
    background: var(--bg-card);
    border: 1px solid var(--border-card);
    border-radius: 50%;
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-muted);
    transition: all 0.2s ease;
  }

  .back-btn:hover {
    color: var(--text-heading);
    transform: scale(1.05);
  }

  .top-title {
    font-size: 1rem;
    font-weight: 800;
    color: var(--text-heading);
  }

  .step-indicator {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--primary);
    background: var(--primary-light);
    padding: 5px 12px;
    border-radius: 99px;
  }

  .pose-container {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .pose-header {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .pose-header-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .pose-title {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--text-heading);
  }

  .pose-target {
    font-size: 0.8rem;
    color: var(--emerald);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .target-bullet {
    font-size: 14px;
  }

  .instructions-wrap {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 4px;
  }

  .instruction-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .step-num-badge {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--primary-light);
    color: var(--primary);
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .instruction-text {
    font-size: 0.88rem;
    color: var(--text-heading);
    line-height: 1.45;
  }

  .tip-box {
    background: var(--amber-light);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.82rem;
    color: var(--amber);
    font-weight: 600;
  }

  .tip-box-icon {
    font-size: 18px;
    flex-shrink: 0;
  }

  .controls-bar {
    margin-top: 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .completion-view {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    margin-top: 30px;
  }

  .trophy-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .trophy-badge {
    width: 88px;
    height: 88px;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 12px 30px rgba(245, 158, 11, 0.45);
    z-index: 2;
  }

  .glow-ring {
    position: absolute;
    width: 110px;
    height: 110px;
    background: rgba(245, 158, 11, 0.2);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  .trophy-icon {
    font-size: 52px;
    color: #ffffff;
  }

  .comp-title {
    font-size: 1.75rem;
    font-weight: 800;
    margin: 0;
    color: var(--text-heading);
  }

  .comp-desc {
    font-size: 0.92rem;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.5;
  }

  .comp-stats {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 8px 20px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .stat-num {
    display: block;
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--primary);
  }

  .stat-lbl {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    font-weight: 700;
  }

  .divider {
    width: 1px;
    height: 36px;
    background: var(--border-card);
  }

  .comp-actions {
    width: 100%;
    margin-top: 12px;
  }

  /* Relaxation sounds selector styles */
  .sounds-panel {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--bg-card);
    border: 1px solid var(--border-card);
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    margin: 14px 0 6px;
    box-shadow: var(--shadow-sm);
  }
  .sound-panel-icon {
    font-size: 20px;
    color: var(--primary);
  }
  .sounds-label {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text-muted);
  }
  .sounds-select {
    flex-grow: 1;
    background: transparent;
    border: none;
    color: var(--text-heading);
    font-size: 0.82rem;
    font-weight: 700;
    outline: none;
    cursor: pointer;
  }
</style>

