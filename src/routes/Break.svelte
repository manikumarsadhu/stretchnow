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

  // Break routine: 3 guided poses × 40s = 120s total
  const breakRoutine = STRETCHES.slice(0, 3);
  let currentStepIndex = 0;
  let remainingSeconds  = 120;
  let isRunning   = false;
  let isCompleted = false;
  let selectedSound = 'none';

  // Breath phase: 'inhale' | 'hold' | 'exhale'
  let breathPhase = 'inhale';
  let breathInterval = null;

  const BREATH_CYCLE = [
    { phase: 'inhale', dur: 4000, label: 'Breathe In' },
    { phase: 'hold',   dur: 2000, label: 'Hold'       },
    { phase: 'exhale', dur: 6000, label: 'Breathe Out' },
  ];

  let breathCycleIdx = 0;

  function startBreathCycle() {
    stopBreathCycle();
    function tick() {
      const step = BREATH_CYCLE[breathCycleIdx % BREATH_CYCLE.length];
      breathPhase = step.phase;
      breathCycleIdx++;
      breathInterval = setTimeout(tick, step.dur);
    }
    tick();
  }

  function stopBreathCycle() {
    if (breathInterval) { clearTimeout(breathInterval); breathInterval = null; }
    breathPhase = 'inhale';
    breathCycleIdx = 0;
  }

  $: currentPose = breakRoutine[currentStepIndex] || breakRoutine[0];

  const SOUND_OPTIONS = [
    { id: 'none',        label: 'Silent',      emoji: '🔇' },
    { id: 'ocean',       label: 'Ocean',        emoji: '🌊' },
    { id: 'rain',        label: 'Rain',         emoji: '🌧' },
    { id: 'forest',      label: 'Wind',         emoji: '🍃' },
    { id: 'white_noise', label: 'White Noise',  emoji: '💨' },
  ];

  function handleStart() {
    isRunning = true;
    startBreathCycle();
    if (selectedSound !== 'none') playRelaxationSound(selectedSound);
    startTimer(
      (updateFn) => {
        const next = updateFn(remainingSeconds);
        if ($appStore.settings?.soundEnabled && (next === 80 || next === 40)) playChime();
        remainingSeconds = next;
        if (remainingSeconds === 80) currentStepIndex = 1;
        if (remainingSeconds === 40) currentStepIndex = 2;
      },
      () => {
        isRunning   = false;
        isCompleted = true;
        stopBreathCycle();
        stopRelaxationSound();
        if ($appStore.settings?.soundEnabled) playChime();
        completeBreak(50);
      }
    );
  }

  function handlePause() {
    isRunning = false;
    pauseTimer();
    stopBreathCycle();
    stopRelaxationSound();
  }

  function handleReset() {
    handlePause();
    remainingSeconds  = 120;
    currentStepIndex  = 0;
    isCompleted       = false;
    breathCycleIdx    = 0;
    breathPhase       = 'inhale';
  }

  function handleSkipStep() {
    if (currentStepIndex < breakRoutine.length - 1) {
      currentStepIndex++;
      remainingSeconds = Math.max(0, 120 - currentStepIndex * 40);
    }
  }

  function handleFinish() {
    if (!isCompleted) completeBreak(30);
    handlePause();
    navigateTo('home');
  }

  function selectSound(id) {
    selectedSound = id;
    if (id === 'none') {
      stopRelaxationSound();
    } else {
      playRelaxationSound(id);
    }
  }

  function handleKeydown(e) {
    if (isCompleted) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    switch (e.key) {
      case ' ':      e.preventDefault(); isRunning ? handlePause() : handleStart(); break;
      case 's': case 'S': handleSkipStep(); break;
      case 'r': case 'R': handleReset();    break;
      case 'Escape':      handleFinish();   break;
    }
  }

  // Detect desktop (pointer: fine = mouse) for keyboard hints
  let isDesktop = false;

  onMount(() => {
    handleStart();
    if (typeof window !== 'undefined') {
      isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    }
  });

  onDestroy(() => {
    resetTimer();
    stopRelaxationSound();
    stopBreathCycle();
  });
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="break-screen animate-fade-in">

  <!-- Top Bar -->
  <div class="top-bar">
    <button class="back-btn" on:click={handleFinish} aria-label="Close and go back to dashboard">
      <span class="material-symbols-outlined">close</span>
    </button>
    <span class="top-title">2-Min Guided Break</span>
    <span class="step-indicator" aria-label="Step {currentStepIndex + 1} of {breakRoutine.length}">
      Step {currentStepIndex + 1} / {breakRoutine.length}
    </span>
  </div>

  {#if isCompleted}
    <!-- ── Completion View ── -->
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
    <!-- ── Active Timer ── -->

    <!-- Breath Ring Wrapper — breathing-synced pulse -->
    <div class="breath-ring-wrapper {isRunning ? `breath-${breathPhase}` : ''}" aria-hidden="true">
      <div class="breath-label-wrap">
        {#if isRunning}
          <span class="breath-label">
            {#if breathPhase === 'inhale'}Breathe In
            {:else if breathPhase === 'hold'}Hold
            {:else}Breathe Out{/if}
          </span>
        {/if}
      </div>
    </div>

    <Countdown seconds={remainingSeconds} totalSeconds={120} {isRunning} label="Step {currentStepIndex + 1}: {currentPose.title}" />

    <!-- Current Pose Card -->
    <Card padding="md">
      <div class="pose-container">
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

    <!-- ── Visual Sound Selector ── -->
    <div class="sounds-section">
      <span class="sounds-heading">
        <span class="material-symbols-outlined sounds-heading-icon">music_note</span>
        Relaxation Audio
      </span>
      <div class="sound-cards">
        {#each SOUND_OPTIONS as s}
          <button
            class="sound-card {selectedSound === s.id ? 'active' : ''}"
            type="button"
            on:click={() => selectSound(s.id)}
            aria-pressed={selectedSound === s.id}
            aria-label="{s.label} ambient sound"
          >
            <span class="sound-emoji">{s.emoji}</span>
            <span class="sound-label">{s.label}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- ── Controls ── -->
    <div class="controls-bar">
      <Button variant="outline" size="md" icon="restart_alt" onclick={handleReset}>Reset</Button>

      {#if isRunning}
        <Button variant="primary" size="lg" icon="pause" onclick={handlePause}>Pause</Button>
      {:else}
        <Button variant="primary" size="lg" icon="play_arrow" onclick={handleStart}>Resume</Button>
      {/if}

      <Button variant="ghost" size="md" icon="skip_next" onclick={handleSkipStep}>Skip</Button>
    </div>

    <!-- ── Keyboard Shortcuts (desktop only) ── -->
    {#if isDesktop}
      <div class="kbd-hints" aria-label="Keyboard shortcuts">
        <span class="kbd-hints-label">Keyboard Shortcuts</span>
        <div class="kbd-row">
          <span class="kbd-item"><kbd>Space</kbd> Pause</span>
          <span class="kbd-item"><kbd>S</kbd> Skip</span>
          <span class="kbd-item"><kbd>R</kbd> Reset</span>
          <span class="kbd-item"><kbd>Esc</kbd> Exit</span>
        </div>
      </div>
    {/if}
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

  /* ── Top Bar ── */
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
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-muted);
    transition: all 0.2s ease;
  }

  .back-btn:hover { color: var(--text-heading); transform: scale(1.05); }

  .top-title { font-size: 1rem; font-weight: 800; color: var(--text-heading); }

  .step-indicator {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--primary);
    background: var(--primary-light);
    padding: 5px 12px;
    border-radius: 99px;
  }

  /* ── Breathing Ring ── */
  .breath-ring-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    margin: -8px 0 -4px;
  }

  .breath-label-wrap {
    height: 20px;
    display: flex;
    align-items: center;
  }

  .breath-label {
    font-size: 0.78rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--primary);
    opacity: 0.8;
  }

  /* The actual breathing animation is applied to the Countdown ring via global
     scope — we scale the outer wrapper around the Countdown component */
  :global(.breath-ring-wrapper.breath-inhale + .countdown-wrapper > div) {
    animation: breatheIn 4s ease-in-out forwards;
  }

  :global(.breath-ring-wrapper.breath-hold + .countdown-wrapper > div) {
    animation: breatheHold 2s ease-in-out forwards;
  }

  :global(.breath-ring-wrapper.breath-exhale + .countdown-wrapper > div) {
    animation: breatheOut 6s ease-in-out forwards;
  }

  @keyframes breatheIn {
    from { transform: scale(1); }
    to   { transform: scale(1.06); }
  }

  @keyframes breatheHold {
    from { transform: scale(1.06); }
    to   { transform: scale(1.06); }
  }

  @keyframes breatheOut {
    from { transform: scale(1.06); }
    to   { transform: scale(1); }
  }

  /* ── Pose Card ── */
  .pose-container { display: flex; flex-direction: column; gap: 14px; }
  .pose-header { display: flex; align-items: center; gap: 14px; }
  .pose-header-info { display: flex; flex-direction: column; gap: 2px; }
  .pose-title { margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--text-heading); }
  .pose-target { font-size: 0.8rem; color: var(--emerald); font-weight: 600; display: flex; align-items: center; gap: 4px; }
  .target-bullet { font-size: 14px; }
  .instructions-wrap { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
  .instruction-row { display: flex; align-items: flex-start; gap: 10px; }
  .step-num-badge {
    width: 22px; height: 22px; border-radius: 50%;
    background: var(--primary-light); color: var(--primary);
    font-size: 0.75rem; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; margin-top: 2px;
  }
  .instruction-text { font-size: 0.88rem; color: var(--text-heading); line-height: 1.45; }
  .tip-box {
    background: var(--amber-light); border-radius: var(--radius-sm);
    padding: 10px 14px; display: flex; align-items: center; gap: 10px;
    font-size: 0.82rem; color: var(--amber); font-weight: 600;
  }
  .tip-box-icon { font-size: 18px; flex-shrink: 0; }

  /* ── Visual Sound Selector ── */
  .sounds-section { display: flex; flex-direction: column; gap: 10px; margin: 6px 0; }

  .sounds-heading {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
  }

  .sounds-heading-icon { font-size: 16px; color: var(--primary); }

  .sound-cards {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none;
  }

  .sound-cards::-webkit-scrollbar { display: none; }

  .sound-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    border: 2px solid var(--border-card);
    background: var(--bg-card);
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
    min-width: 64px;
    min-height: 44px;
  }

  .sound-card:hover {
    border-color: var(--primary);
    background: var(--primary-light);
  }

  .sound-card.active {
    border-color: var(--primary);
    background: var(--primary-light);
    box-shadow: 0 0 0 3px var(--primary-glow);
  }

  .sound-emoji { font-size: 1.4rem; }

  .sound-label {
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--text-heading);
    white-space: nowrap;
  }

  /* ── Controls ── */
  .controls-bar {
    margin-top: 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  /* ── Keyboard Hints (desktop only) ── */
  .kbd-hints {
    margin-top: 14px;
    background: var(--bg-card);
    border: 1px solid var(--border-card);
    border-radius: var(--radius-sm);
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .kbd-hints-label {
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-muted);
  }

  .kbd-row {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .kbd-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
  }

  kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-app);
    border: 1px solid var(--border-card);
    border-bottom-width: 2px;
    border-radius: 5px;
    padding: 2px 7px;
    font-size: 0.75rem;
    font-weight: 700;
    font-family: var(--font-body);
    color: var(--text-heading);
    box-shadow: 0 1px 0 var(--border-card);
    min-width: 28px;
    text-align: center;
  }

  /* Hide keyboard hints on touch devices */
  @media (hover: none), (pointer: coarse) {
    .kbd-hints { display: none; }
  }

  /* ── Completion View ── */
  .completion-view {
    text-align: center; display: flex; flex-direction: column;
    align-items: center; gap: 16px; margin-top: 30px;
  }
  .trophy-wrapper { position: relative; display: flex; align-items: center; justify-content: center; }
  .trophy-badge {
    width: 88px; height: 88px;
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 12px 30px rgba(245,158,11,0.45); z-index: 2;
  }
  .glow-ring {
    position: absolute; width: 110px; height: 110px;
    background: rgba(245,158,11,0.2); border-radius: 50%;
    animation: pulse 2s infinite;
  }
  .trophy-icon { font-size: 52px; color: #fff; }
  .comp-title { font-size: 1.75rem; font-weight: 800; margin: 0; color: var(--text-heading); }
  .comp-desc  { font-size: 0.92rem; color: var(--text-muted); margin: 0; line-height: 1.5; }
  .comp-stats { display: flex; align-items: center; justify-content: space-around; padding: 8px 20px; }
  .stat-item  { display: flex; flex-direction: column; align-items: center; }
  .stat-num   { display: block; font-size: 1.6rem; font-weight: 800; color: var(--primary); }
  .stat-lbl   { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
  .divider    { width: 1px; height: 36px; background: var(--border-card); }
  .comp-actions { width: 100%; margin-top: 12px; }

  /* ── Animations ── */
  @keyframes pulse {
    0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245,158,11,0.6); }
    70%  { transform: scale(1);    box-shadow: 0 0 0 14px rgba(245,158,11,0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245,158,11,0); }
  }

  /* ── Reduced Motion ── */
  @media (prefers-reduced-motion: reduce) {
    .glow-ring { animation: none; }
    .animate-fade-in { animation: none; }
    :global(.breath-ring-wrapper + .countdown-wrapper > div) { animation: none !important; }
  }
</style>
