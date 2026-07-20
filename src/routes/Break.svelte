<script>
  import { onDestroy, onMount } from 'svelte';
  import Countdown from '../components/Countdown.svelte';
  import Button from '../components/Button.svelte';
  import Card from '../components/Card.svelte';
  import { appStore, completeBreak, navigateTo } from '../stores/app.js';
  import { startTimer, pauseTimer, resetTimer } from '../utils/timer.js';
  import { STRETCHES } from '../utils/stretches.js';

  // Select 3 guided poses for 2-minute break (40s each = 120s)
  const breakRoutine = STRETCHES.slice(0, 3);
  let currentStepIndex = 0;
  let remainingSeconds = 120;
  let isRunning = false;
  let isCompleted = false;

  $: currentPose = breakRoutine[currentStepIndex] || breakRoutine[0];

  function handleStart() {
    isRunning = true;
    startTimer(
      (updateFn) => {
        remainingSeconds = updateFn(remainingSeconds);
        // Switch pose step automatically based on time remaining
        if (remainingSeconds === 80) currentStepIndex = 1;
        if (remainingSeconds === 40) currentStepIndex = 2;
      },
      () => {
        isRunning = false;
        isCompleted = true;
        completeBreak(50);
      }
    );
  }

  function handlePause() {
    isRunning = false;
    pauseTimer();
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

  onMount(() => {
    handleStart();
  });

  onDestroy(() => {
    resetTimer();
  });
</script>

<div class="break-screen">
  <!-- Top Bar -->
  <div class="top-bar">
    <button class="back-btn" on:click={handleFinish}>
      <span class="material-symbols-outlined">close</span>
    </button>
    <span class="top-title">2-Min Guided Break</span>
    <span class="step-indicator">Step {currentStepIndex + 1} / {breakRoutine.length}</span>
  </div>

  {#if isCompleted}
    <div class="completion-view">
      <div class="trophy-badge">
        <span class="material-symbols-outlined trophy-icon">military_tech</span>
      </div>
      <h2>Break Completed! 🎉</h2>
      <p>Awesome work! You earned <strong>+50 Wellness Points</strong> and took care of your posture.</p>

      <Card padding="md">
        <div class="comp-stats">
          <div>
            <span class="stat-num">+50</span>
            <span class="stat-lbl">Points</span>
          </div>
          <div class="divider"></div>
          <div>
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
        <div class="pose-header">
          <span class="material-symbols-outlined pose-icon">{currentPose.icon}</span>
          <div>
            <h3 class="pose-title">{currentPose.title}</h3>
            <span class="pose-target">Target: {currentPose.target}</span>
          </div>
        </div>

        <ul class="instructions-list">
          {#each currentPose.instructions as step}
            <li>{step}</li>
          {/each}
        </ul>

        {#if currentPose.tips}
          <div class="tip-box">
            <span class="material-symbols-outlined">info</span>
            <span>{currentPose.tips}</span>
          </div>
        {/if}
      </div>
    </Card>

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
    padding: 20px 20px 100px;
    max-width: 480px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .back-btn {
    background: rgba(0, 0, 0, 0.05);
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text, #6b7280);
  }

  .top-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-h, #1f2937);
  }

  .step-indicator {
    font-size: 0.78rem;
    font-weight: 600;
    color: #6366f1;
    background: rgba(99, 102, 241, 0.1);
    padding: 4px 10px;
    border-radius: 14px;
  }

  .pose-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .pose-header {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .pose-icon {
    font-size: 28px;
    color: #6366f1;
    background: rgba(99, 102, 241, 0.12);
    padding: 10px;
    border-radius: 14px;
  }

  .pose-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-h, #1f2937);
  }

  .pose-target {
    font-size: 0.78rem;
    color: #10b981;
    font-weight: 600;
  }

  .instructions-list {
    margin: 4px 0 0;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .instructions-list li {
    font-size: 0.85rem;
    color: var(--text-h, #374151);
    line-height: 1.45;
  }

  .tip-box {
    background: rgba(245, 158, 11, 0.1);
    border-radius: 12px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.8rem;
    color: #b45309;
    font-weight: 500;
  }

  .controls-bar {
    margin-top: 24px;
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
    margin-top: 40px;
  }

  .trophy-badge {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 25px rgba(245, 158, 11, 0.4);
  }

  .trophy-icon {
    font-size: 48px;
    color: #ffffff;
  }

  .comp-stats {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 12px 24px;
  }

  .stat-num {
    display: block;
    font-size: 1.5rem;
    font-weight: 800;
    color: #6366f1;
  }

  .stat-lbl {
    font-size: 0.75rem;
    color: var(--text, #6b7280);
    text-transform: uppercase;
  }

  .divider {
    width: 1px;
    height: 36px;
    background: rgba(0, 0, 0, 0.1);
  }

  .comp-actions {
    width: 100%;
    margin-top: 16px;
  }
</style>
