<script>
  import { onMount } from 'svelte';
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  import ProgressCard from '../components/ProgressCard.svelte';
  import ProgressRing from '../components/ProgressRing.svelte';
  import BadgesList from '../components/BadgesList.svelte';
  import InlineTutorial from '../components/InlineTutorial.svelte';
  import WellnessSummaryModal from '../components/WellnessSummaryModal.svelte';
  import { appStore, navigateTo, incrementWater, undoAction } from '../stores/app.js';
  import { calculateWellnessScore, calculateWaterPercentage, calculateBreakGoalPercentage, getMotivationalTip } from '../utils/wellness.js';
  import { STRETCHES } from '../utils/stretches.js';

  $: user = $appStore.user || {};
  $: progress = $appStore.progress || {};
  $: statistics = $appStore.statistics || {};
  $: wellnessScore = calculateWellnessScore(progress, user, statistics);
  $: waterPercent = calculateWaterPercentage(progress.water, user.dailyWaterGoal);
  $: breakPercent = calculateBreakGoalPercentage(progress.completedBreaksToday, user.dailyBreakGoal);
  $: tip = getMotivationalTip(progress.completedBreaksToday, progress.streak);

  // Level & XP variables
  $: xp = progress.xp || 0;
  $: level = progress.level || 1;
  $: xpNeeded = level * 200;
  $: xpPercent = Math.min(100, Math.round((xp / xpNeeded) * 100));

  // Weekly Challenge Stats
  $: dailyBreaks = statistics.dailyBreaks || [];
  $: totalBreaksThisWeek = dailyBreaks.reduce((a, b) => a + b, 0);
  $: waterIntake = statistics.waterIntake || [];
  $: hydrationDaysThisWeek = waterIntake.filter(w => w >= (user.dailyWaterGoal || 8)).length;

  const featuredStretches = STRETCHES.slice(0, 3);

  function getStars(score) {
    const starCount = Math.round(score / 20); // 0-100 -> 0-5
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= starCount) {
        stars += '★';
      } else {
        stars += '☆';
      }
    }
    return stars;
  }

  $: starRating = getStars(wellnessScore);

  // Focus Mode & Summary states
  let focusMode = false;
  let isSummaryOpen = false;
  let showUndoSnackbar = false;
  let undoTimeout = null;

  // Goals Checklist Calculations
  $: breakGoal = user.dailyBreakGoal || 6;
  $: waterGoal = user.dailyWaterGoal || 8;
  let todayIndex = (new Date().getDay() + 6) % 7;
  $: todaySittingHours = statistics.sittingHours ? statistics.sittingHours[todayIndex] : 7.5;

  $: checkBreak = progress.completedBreaksToday >= breakGoal;
  $: checkWater = progress.water >= waterGoal;
  $: checkDuration = (progress.completedBreaksToday * 2) >= 12; // 12-minute target
  $: checkSitting = todaySittingHours < 8; // Under 8 hours limit

  $: completedGoalsCount = (checkBreak ? 1 : 0) + (checkWater ? 1 : 0) + (checkDuration ? 1 : 0) + (checkSitting ? 1 : 0);
  $: goalPercent = Math.round((completedGoalsCount / 4) * 100);

  function renderBlocks(completed, goal) {
    const filled = Math.min(goal, completed);
    let str = '';
    for (let i = 0; i < filled; i++) str += '■';
    for (let i = filled; i < goal; i++) str += '□';
    return str;
  }

  // Watch for undo actions reactively
  let prevActionTime = 0;
  function handleLastAction(lastAction) {
    if (lastAction && lastAction.timestamp !== prevActionTime) {
      prevActionTime = lastAction.timestamp;
      showUndoSnackbar = true;
      if (undoTimeout) clearTimeout(undoTimeout);
      undoTimeout = setTimeout(() => {
        showUndoSnackbar = false;
      }, 6000);
    }
  }
  $: handleLastAction(progress.lastAction);

  function triggerUndo() {
    undoAction();
    showUndoSnackbar = false;
  }

  // Smart Summary trigger: triggers 10 seconds post app startup near or after workEnd
  onMount(() => {
    const timer = setTimeout(() => {
      const today = new Date().toISOString().split('T')[0];
      const hasActivity = (progress.completedBreaksToday || 0) > 0 || (progress.water || 0) > 0;
      
      if (hasActivity && progress.lastSummaryShownDate !== today) {
        const currentHourMin = new Date().toTimeString().slice(0, 5); // "HH:MM"
        if (user.workEnd && currentHourMin >= user.workEnd) {
          isSummaryOpen = true;
        }
      }
    }, 10000); // 10 seconds
    return () => clearTimeout(timer);
  });
</script>

<div class="home-screen animate-fade-in">
  <!-- Header -->
  <header class="header">
    <div class="user-greeting">
      <h2 class="greeting-text">Hello, {user.name || 'Friend'} 👋</h2>
      <div class="status-pill">
        <span class="pulse-dot"></span>
        <span>Posture Active • {user.occupation || 'Desk Worker'}</span>
      </div>
    </div>
    <div class="header-actions">
      <!-- Focus mode toggle -->
      <button class="focus-mode-badge {focusMode ? 'active' : ''}" on:click={() => focusMode = !focusMode} aria-label="Toggle Focus Mode">
        <span class="material-symbols-outlined">{focusMode ? 'visibility_off' : 'center_focus_strong'}</span>
      </button>
      <button class="profile-badge" on:click={() => navigateTo('settings')} aria-label="Settings">
        <span class="material-symbols-outlined">settings</span>
      </button>
    </div>
  </header>

  {#if focusMode}
    <!-- Focus Mode Minimized Interface -->
    <div class="focus-mode-container animate-fade-in">
      <div class="focus-timer-card">
        <ProgressRing progress={breakPercent} size={180} strokeWidth={14} color="var(--primary)">
          <div class="focus-ring-content">
            <span class="material-symbols-outlined focus-timer-icon">self_improvement</span>
            <span class="focus-timer-label">Active Focus</span>
            <span class="focus-timer-sub">{progress.completedBreaksToday} Breaks</span>
          </div>
        </ProgressRing>
      </div>

      <div class="focus-actions">
        <Button variant="primary" size="lg" icon="play_arrow" onclick={() => navigateTo('break')}>
          Start Focus Stretch
        </Button>
        
        <!-- Minimized Water log -->
        <button class="focus-water-btn" on:click={incrementWater}>
          <span class="material-symbols-outlined">water_drop</span>
          <span>Log Cup ({progress.water} logged)</span>
        </button>
        
        <button class="exit-focus-btn" on:click={() => focusMode = false}>
          Exit Focus Mode
        </button>
      </div>
    </div>
  {:else}
    <!-- Normal Full Workspace Dashboard -->

    <!-- XP & Level Container -->
    <div class="xp-level-container">
      <div class="xp-header">
        <div class="level-badge">Lv. {level}</div>
        <span class="xp-text">{xp} / {xpNeeded} XP</span>
      </div>
      <div class="xp-bar-track">
        <div class="xp-bar-fill" style="width: {xpPercent}%;"></div>
      </div>
    </div>

    <!-- Onboarding Tutorial checklist -->
    <InlineTutorial />

    <!-- Goals Checklist Panel -->
    <Card padding="md">
      <div class="goals-section">
        <div class="goals-header">
          <h3 class="section-title">☑️ Today's Progress Goals</h3>
          <span class="goals-pct">{goalPercent}% Done</span>
        </div>
        <div class="goals-progress-track">
          <div class="goals-progress-fill" style="width: {goalPercent}%;"></div>
        </div>

        <ul class="goals-list">
          <li class="goal-item {checkBreak ? 'completed' : ''}">
            <span class="material-symbols-outlined check-ico">
              {checkBreak ? 'check_box' : 'check_box_outline_blank'}
            </span>
            <div class="goal-info">
              <span class="goal-lbl">Breaks Completed</span>
              <span class="goal-blocks">{renderBlocks(progress.completedBreaksToday || 0, breakGoal)}</span>
            </div>
            <span class="goal-num">{progress.completedBreaksToday} / {breakGoal}</span>
          </li>

          <li class="goal-item {checkWater ? 'completed' : ''}">
            <span class="material-symbols-outlined check-ico">
              {checkWater ? 'check_box' : 'check_box_outline_blank'}
            </span>
            <div class="goal-info">
              <span class="goal-lbl">Water Intake</span>
              <span class="goal-blocks">{renderBlocks(progress.water || 0, waterGoal)}</span>
            </div>
            <span class="goal-num">{progress.water} / {waterGoal} c</span>
          </li>

          <li class="goal-item {checkDuration ? 'completed' : ''}">
            <span class="material-symbols-outlined check-ico">
              {checkDuration ? 'check_box' : 'check_box_outline_blank'}
            </span>
            <div class="goal-info">
              <span class="goal-lbl">Stretch Time Target</span>
              <span class="goal-blocks">{renderBlocks(Math.round((progress.completedBreaksToday || 0) * 2), 12)}</span>
            </div>
            <span class="goal-num">{progress.completedBreaksToday * 2} / 12 min</span>
          </li>

          <li class="goal-item {checkSitting ? 'completed' : ''}">
            <span class="material-symbols-outlined check-ico">
              {checkSitting ? 'check_box' : 'check_box_outline_blank'}
            </span>
            <span class="goal-lbl">Sit less than 8 hours limit</span>
            <span class="goal-num text-amber">{todaySittingHours} / 8 hrs</span>
          </li>
        </ul>
      </div>
    </Card>

    <!-- Motivational Tip -->
    <div class="tip-card">
      <div class="tip-icon-box">
        <span class="material-symbols-outlined tip-icon">lightbulb</span>
      </div>
      <div class="tip-content">
        <span class="tip-label">Daily Tip</span>
        <p class="tip-text">{tip}</p>
      </div>
    </div>

    <!-- Hero Start Break Card -->
    <Card hover padding="lg">
      <div class="hero-break">
        <div class="break-ring">
          <ProgressRing progress={breakPercent} size={110} strokeWidth={10} color="var(--primary)">
            <span class="material-symbols-outlined hero-ring-icon">self_improvement</span>
          </ProgressRing>
        </div>

        <div class="break-info">
          <span class="break-tag">Recommended Routine</span>
          <h3 class="break-title">2-Min Posture Reset</h3>
          <p class="break-desc">
            <strong>{progress.completedBreaksToday}</strong> of <strong>{breakGoal}</strong> daily breaks completed
          </p>

          <Button variant="primary" size="md" icon="play_arrow" onclick={() => navigateTo('break')}>
            Start Break Now
          </Button>
        </div>
      </div>
    </Card>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <ProgressCard
        title="Wellness Score"
        value={`${wellnessScore} / 100`}
        subtitle={starRating}
        icon="bolt"
        iconBg="rgba(245, 158, 11, 0.15)"
        iconColor="#f59e0b"
      />

      <ProgressCard
        title="Day Streak"
        value={`${progress.streak || 1} Days`}
        subtitle="On a roll!"
        icon="local_fire_department"
        iconBg="rgba(244, 63, 94, 0.15)"
        iconColor="#f43f5e"
      />
    </div>

    <!-- Water Tracker Section -->
    <Card padding="md">
      <div class="water-section">
        <div class="water-header">
          <div class="water-title-wrap">
            <div class="water-icon-wrap">
              <span class="material-symbols-outlined water-icon">water_drop</span>
            </div>
            <div>
              <h4 class="water-title">Hydration Tracker</h4>
              <span class="water-sub">{progress.water || 0} of {waterGoal} cups ({waterPercent}%)</span>
            </div>
          </div>
          <Button variant="secondary" size="sm" icon="add" onclick={incrementWater}>
            +1 Cup
          </Button>
        </div>

        <div class="water-bar-track">
          <div class="water-bar-fill" style="width: {waterPercent}%;"></div>
        </div>
      </div>
    </Card>

    <!-- Weekly Challenges Card -->
    <Card padding="md">
      <div class="challenges-section">
        <h3 class="section-title">📅 Weekly Challenges</h3>
        
        <div class="challenge-item">
          <span class="material-symbols-outlined challenge-icon {totalBreaksThisWeek >= 15 ? 'completed' : ''}">
            {totalBreaksThisWeek >= 15 ? 'check_box' : 'check_box_outline_blank'}
          </span>
          <div class="challenge-info">
            <span class="challenge-title">Stretch Master Weekly</span>
            <span class="challenge-desc">Complete 15 breaks this week ({totalBreaksThisWeek} / 15)</span>
          </div>
        </div>
        
        <div class="challenge-item">
          <span class="material-symbols-outlined challenge-icon {hydrationDaysThisWeek >= 5 ? 'completed' : ''}">
            {hydrationDaysThisWeek >= 5 ? 'check_box' : 'check_box_outline_blank'}
          </span>
          <div class="challenge-info">
            <span class="challenge-title">Hydration Regular</span>
            <span class="challenge-desc">Meet daily water goal 5 times ({hydrationDaysThisWeek} / 5)</span>
          </div>
        </div>
      </div>
    </Card>

    <!-- Activity Timeline Feed Section -->
    <Card padding="md">
      <div class="timeline-section">
        <h3 class="section-title">🕒 Today's Activity Log</h3>
        {#if !progress.timeline || progress.timeline.length === 0}
          <div class="timeline-empty-state">
            <span class="material-symbols-outlined timeline-empty-icon">history</span>
            <p>Your workday activities (stretches, hydration, skips) will be logged here in real time.</p>
          </div>
        {:else}
          <div class="timeline-list">
            {#each progress.timeline as item}
              <div class="timeline-item">
                <span class="time-stamp">{item.time}</span>
                <span class="material-symbols-outlined timeline-bullet timeline-{item.type}">
                  {item.type === 'stretch' ? 'self_improvement' : item.type === 'water' ? 'water_drop' : item.type === 'skip' ? 'block' : 'star'}
                </span>
                <span class="timeline-label">{item.label}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </Card>

    <!-- Quick Stretch Routines -->
    <div class="section-header">
      <h3>Quick Stretches</h3>
      <button class="see-all-btn" on:click={() => navigateTo('library')}>
        See All ({STRETCHES.length})
      </button>
    </div>

    <div class="quick-stretches-list">
      {#each featuredStretches as item}
        <button class="stretch-card" on:click={() => navigateTo('break')}>
          <div class="stretch-icon-wrap">
            <span class="material-symbols-outlined stretch-icon">{item.icon}</span>
          </div>
          <div class="stretch-details">
            <h4>{item.title}</h4>
            <span class="stretch-meta">{item.duration} sec • {item.difficulty} • {item.category}</span>
          </div>
          <span class="material-symbols-outlined arrow-icon">arrow_forward_ios</span>
        </button>
      {/each}
    </div>

    <!-- Achievements/Badges Grid -->
    <BadgesList />
  {/if}
</div>

<!-- Undo Action Snackbar -->
{#if showUndoSnackbar && progress.lastAction}
  <div class="undo-snackbar animate-fade-in">
    <div class="snackbar-content">
      <span class="snackbar-text">Action logged successfully</span>
      <button class="undo-btn" on:click={triggerUndo}>
        <span class="material-symbols-outlined undo-icon-sym">undo</span>
        <span>Undo</span>
      </button>
    </div>
  </div>
{/if}

<!-- Workday Wellness Summary Modal -->
<WellnessSummaryModal isOpen={isSummaryOpen} onclose={() => isSummaryOpen = false} />

<style>
  .home-screen {
    padding: 24px 20px 110px;
    max-width: 480px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 18px;
    box-sizing: border-box;
    background: var(--bg-gradient, transparent);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .greeting-text {
    margin: 0 0 4px;
    font-size: 1.55rem;
    font-weight: 800;
    color: var(--text-heading);
    letter-spacing: -0.02em;
  }

  .status-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-muted);
  }

  .pulse-dot {
    width: 7px;
    height: 7px;
    background: var(--emerald);
    border-radius: 50%;
    box-shadow: 0 0 8px var(--emerald);
  }

  .profile-badge {
    background: var(--bg-card);
    border: 1px solid var(--border-card);
    color: var(--primary);
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: all 0.2s ease;
  }

  .profile-badge:hover {
    transform: scale(1.05);
    background: var(--primary-light);
  }

  .tip-card {
    background: var(--bg-card);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border-card);
    border-radius: var(--radius-md);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: var(--shadow-sm);
  }

  .tip-icon-box {
    width: 36px;
    height: 36px;
    background: var(--primary-light);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .tip-icon {
    font-size: 20px;
    color: var(--primary);
  }

  .tip-content {
    display: flex;
    flex-direction: column;
  }

  .tip-label {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--primary);
    letter-spacing: 0.04em;
  }

  .tip-text {
    margin: 2px 0 0;
    font-size: 0.84rem;
    color: var(--text-heading);
    line-height: 1.4;
    font-weight: 500;
  }

  .hero-break {
    display: flex;
    align-items: center;
    gap: 18px;
  }

  .hero-ring-icon {
    font-size: 44px;
    color: var(--primary);
  }

  .break-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-grow: 1;
  }

  .break-tag {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--primary);
    letter-spacing: 0.05em;
  }

  .break-title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--text-heading);
    letter-spacing: -0.02em;
  }

  .break-desc {
    margin: 0 0 6px;
    font-size: 0.82rem;
    color: var(--text-muted);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .water-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .water-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .water-title-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .water-icon-wrap {
    width: 40px;
    height: 40px;
    background: rgba(14, 165, 233, 0.12);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .water-icon {
    font-size: 22px;
    color: #0284c7;
  }

  .water-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-heading);
  }

  .water-sub {
    font-size: 0.78rem;
    color: var(--text-muted);
  }

  .water-bar-track {
    width: 100%;
    height: 9px;
    background: rgba(226, 232, 240, 0.8);
    border-radius: 99px;
    overflow: hidden;
  }

  :global(.dark-mode) .water-bar-track {
    background: rgba(51, 65, 85, 0.8);
  }

  .water-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #0284c7 0%, #38bdf8 100%);
    border-radius: 99px;
    transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 6px;
  }

  .section-header h3 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--text-heading);
  }

  .see-all-btn {
    background: transparent;
    border: none;
    color: var(--primary);
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    transition: opacity 0.2s ease;
  }

  .see-all-btn:hover {
    opacity: 0.8;
  }

  .quick-stretches-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .stretch-card {
    background: var(--bg-card);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border-card);
    border-radius: var(--radius-md);
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 14px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    width: 100%;
    text-align: left;
    font: inherit;
    color: inherit;
    box-shadow: var(--shadow-sm);
  }

  .stretch-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .stretch-icon-wrap {
    width: 44px;
    height: 44px;
    background: var(--primary-light);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stretch-icon {
    font-size: 24px;
    color: var(--primary);
  }

  .stretch-details {
    flex-grow: 1;
  }

  .stretch-details h4 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-heading);
  }

  .stretch-meta {
    font-size: 0.78rem;
    color: var(--text-muted);
    margin-top: 2px;
    display: block;
  }

  .arrow-icon {
    color: var(--text-muted);
    font-size: 14px;
  }

  /* Gamification styling */
  .xp-level-container {
    background: var(--bg-card);
    border: 1px solid var(--border-card);
    border-radius: var(--radius-sm);
    padding: 12px 16px;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .xp-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .level-badge {
    font-size: 0.85rem;
    font-weight: 800;
    color: #ffffff;
    background: var(--primary);
    padding: 2px 10px;
    border-radius: 99px;
  }
  .xp-text {
    font-size: 0.78rem;
    color: var(--text-muted);
    font-weight: 600;
  }
  .xp-bar-track {
    height: 8px;
    background: rgba(148, 163, 184, 0.15);
    border-radius: 99px;
    overflow: hidden;
  }
  .xp-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary) 0%, var(--primary-hover) 100%);
    border-radius: 99px;
    transition: width 0.4s ease-out;
  }

  /* Weekly challenges styling */
  .challenges-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .challenges-section h3 {
    margin: 0 0 4px;
    font-size: 1rem;
    font-weight: 800;
    color: var(--text-heading);
  }
  .challenge-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .challenge-icon {
    font-size: 22px;
    color: var(--text-muted);
  }
  .challenge-icon.completed {
    color: var(--emerald);
  }
  .challenge-info {
    display: flex;
    flex-direction: column;
  }
  .challenge-title {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--text-heading);
  }
  .challenge-desc {
    font-size: 0.76rem;
    color: var(--text-muted);
  }

  /* Header actions */
  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .focus-mode-badge {
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, color 0.2s;
  }
  .focus-mode-badge:hover, .focus-mode-badge.active {
    background: var(--primary-light);
    color: var(--primary);
  }

  /* Focus Mode Layout */
  .focus-mode-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 30px;
    padding: 40px 10px;
    text-align: center;
  }
  .focus-timer-card {
    background: var(--bg-card);
    border: 1px solid var(--border-card);
    border-radius: 50%;
    width: 230px;
    height: 230px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-lg);
  }
  .focus-ring-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .focus-timer-icon {
    font-size: 48px;
    color: var(--primary);
  }
  .focus-timer-label {
    font-size: 0.95rem;
    font-weight: 800;
    color: var(--text-heading);
  }
  .focus-timer-sub {
    font-size: 0.78rem;
    color: var(--text-muted);
    font-weight: 600;
  }
  .focus-actions {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 280px;
    gap: 12px;
  }
  .focus-water-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: rgba(14, 165, 233, 0.1);
    border: 1px dashed rgba(14, 165, 233, 0.4);
    color: #0284c7;
    border-radius: 12px;
    padding: 10px;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
  }
  .focus-water-btn:hover {
    background: rgba(14, 165, 233, 0.16);
  }
  .exit-focus-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: underline;
    margin-top: 10px;
  }

  /* Goals Checklist styling */
  .goals-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .goals-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .goals-pct {
    font-size: 0.76rem;
    font-weight: 700;
    color: var(--primary);
  }
  .goals-progress-track {
    width: 100%;
    height: 6px;
    background: rgba(148, 163, 184, 0.15);
    border-radius: 99px;
    overflow: hidden;
  }
  .goals-progress-fill {
    height: 100%;
    background: var(--primary);
    border-radius: 99px;
    transition: width 0.4s ease-out;
  }
  .goals-list {
    margin: 4px 0 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .goal-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.84rem;
    color: var(--text-muted);
    transition: color 0.2s;
  }
  .goal-item.completed {
    color: var(--emerald);
  }
  .check-ico {
    font-size: 18px;
    color: var(--text-muted);
  }
  .goal-item.completed .check-ico {
    color: var(--emerald);
  }
  .goal-info {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: 2px;
  }
  .goal-lbl {
    font-weight: 700;
    font-size: 0.82rem;
    color: var(--text-heading);
  }
  .goal-item.completed .goal-lbl {
    color: var(--emerald);
  }
  .goal-blocks {
    font-family: monospace;
    font-size: 0.85rem;
    letter-spacing: 1px;
    color: var(--primary);
  }
  .goal-item.completed .goal-blocks {
    color: var(--emerald);
  }
  .goal-num {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--text-heading);
  }

  /* Activity Timeline feed */
  .timeline-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .timeline-empty-state {
    padding: 16px 8px;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.8rem;
  }
  .timeline-empty-icon {
    font-size: 32px;
    margin-bottom: 6px;
    opacity: 0.5;
  }
  .timeline-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
    position: relative;
    padding-left: 8px;
  }
  .timeline-list::before {
    content: '';
    position: absolute;
    top: 6px;
    bottom: 6px;
    left: 49px;
    width: 2px;
    background: rgba(148, 163, 184, 0.15);
  }
  .timeline-item {
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 0.82rem;
    color: var(--text-main);
  }
  .time-stamp {
    font-size: 0.74rem;
    font-weight: 700;
    color: var(--text-muted);
    width: 32px;
    text-align: right;
  }
  .timeline-bullet {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--bg-app);
    color: var(--text-muted);
    border: 2px solid var(--border-card);
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
  }
  .timeline-bullet.timeline-stretch {
    color: var(--primary);
    border-color: var(--primary);
  }
  .timeline-bullet.timeline-water {
    color: #0284c7;
    border-color: #0284c7;
  }
  .timeline-bullet.timeline-skip {
    color: #ef4444;
    border-color: #ef4444;
  }
  .timeline-bullet.timeline-tutorial {
    color: var(--amber);
    border-color: var(--amber);
  }
  .timeline-label {
    font-weight: 600;
    font-size: 0.8rem;
    color: var(--text-heading);
  }

  /* Undo Action Snackbar */
  .undo-snackbar {
    position: fixed;
    bottom: 90px;
    left: 50%;
    transform: translateX(-50%);
    background: #1e293b;
    border: 1px solid #334155;
    box-shadow: var(--shadow-lg);
    border-radius: var(--radius-sm);
    padding: 10px 16px;
    width: calc(100% - 40px);
    max-width: 400px;
    z-index: 99;
  }
  :global(.dark-mode) .undo-snackbar {
    background: #0f172a;
    border-color: #1e293b;
  }
  .snackbar-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .snackbar-text {
    font-size: 0.8rem;
    color: #ffffff;
    font-weight: 600;
  }
  .undo-btn {
    background: transparent;
    border: none;
    color: var(--primary);
    font-weight: 800;
    font-size: 0.8rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background 0.2s;
  }
  .undo-btn:hover {
    background: var(--primary-light);
  }
  .undo-icon-sym {
    font-size: 14px;
  }
</style>

