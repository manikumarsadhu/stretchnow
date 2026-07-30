<script>
  import { onMount, onDestroy } from 'svelte';
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  import BadgesList from '../components/BadgesList.svelte';
  import InlineTutorial from '../components/InlineTutorial.svelte';
  import WellnessSummaryModal from '../components/WellnessSummaryModal.svelte';
  import { appStore, navigateTo, incrementWater, undoAction } from '../stores/app.js';
  import { calculateWellnessScore, calculateWaterPercentage, calculateBreakGoalPercentage } from '../utils/wellness.js';
  import { STRETCHES } from '../utils/stretches.js';

  $: user       = $appStore.user     || {};
  $: progress   = $appStore.progress || {};
  $: statistics = $appStore.statistics || {};
  $: settings   = $appStore.settings  || {};

  $: wellnessScore = calculateWellnessScore(progress, user, statistics);
  $: waterPercent  = calculateWaterPercentage(progress.water, user.dailyWaterGoal);
  $: breakPercent  = calculateBreakGoalPercentage(progress.completedBreaksToday, user.dailyBreakGoal);

  // XP / Level
  $: xp        = progress.xp || 0;
  $: level     = progress.level || 1;
  $: xpNeeded  = level * 200;
  $: xpPercent = Math.min(100, Math.round((xp / xpNeeded) * 100));

  // XP pulse micro-animation on increase
  let xpPulsing = false;
  let prevXp = 0;
  function handleXpChange(currentXp) {
    if (prevXp > 0 && currentXp > prevXp) {
      xpPulsing = true;
      setTimeout(() => { xpPulsing = false; }, 900);
    }
    prevXp = currentXp;
  }
  $: handleXpChange(xp);

  // Weekly Challenges
  $: dailyBreaks           = statistics.dailyBreaks || [];
  $: totalBreaksThisWeek   = dailyBreaks.reduce((a, b) => a + b, 0);
  $: waterIntake           = statistics.waterIntake || [];
  $: hydrationDaysThisWeek = waterIntake.filter(w => w >= (user.dailyWaterGoal || 8)).length;

  const featuredStretches = STRETCHES.slice(0, 3);

  // Focus Mode & Summary
  let focusMode      = false;
  let isSummaryOpen  = false;
  let showUndoSnackbar = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let undoTimeout = null;

  // Goals
  $: breakGoal        = user.dailyBreakGoal || 6;
  $: waterGoal        = user.dailyWaterGoal || 8;
  let todayIndex = (new Date().getDay() + 6) % 7;
  $: todaySittingHours = statistics.sittingHours ? statistics.sittingHours[todayIndex] : 4.5;
  $: checkBreak    = (progress.completedBreaksToday || 0) >= breakGoal;
  $: checkWater    = (progress.water || 0) >= waterGoal;
  $: checkDuration = ((progress.completedBreaksToday || 0) * 2) >= 12;
  $: checkSitting  = todaySittingHours < 8;
  $: completedGoalsCount = (checkBreak ? 1 : 0) + (checkWater ? 1 : 0) + (checkDuration ? 1 : 0) + (checkSitting ? 1 : 0);
  $: goalPercent = Math.round((completedGoalsCount / 4) * 100);

  // ── Rotating Wellness Tips ──
  const TIPS = [
    { emoji: '💡', text: 'Your spine needs you! Keep your habits ant feselver habits strong today.' },
    { emoji: '💧', text: 'Hydration check: Grab a glass of fresh water to boost focus.' },
    { emoji: '👀', text: 'Screen fatigue? Try the 20-20-20 rule: look 20ft away for 20s.' },
    { emoji: '🧘', text: 'Small breaks significantly reduce muscle tension and desk fatigue.' },
    { emoji: '🚶', text: 'Stand up, roll your shoulders, and stretch for two minutes.' },
    { emoji: '🔥', text: 'Consistency beats intensity. Every micro-break counts!' },
  ];
  let tipIndex = 0;
  let tipVisible = true;
  let tipInterval = null;

  function rotateTip() {
    tipVisible = false;
    setTimeout(() => {
      tipIndex = (tipIndex + 1) % TIPS.length;
      tipVisible = true;
    }, 250);
  }

  function calcNextBreak(start, end, interval) {
    if (!start || !end || !interval) return null;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin   = eh * 60 + em;
    if (nowMin >= endMin || nowMin < startMin) return { time: '05:00 PM', inMin: 24 };

    let nextMin = startMin + interval;
    while (nextMin < nowMin) nextMin += interval;
    if (nextMin >= endMin) return { time: '05:00 PM', inMin: 24 };

    const diffMin = nextMin - nowMin;
    if (diffMin <= 0) {
      return { time: 'Now', inMin: 0 };
    }

    const h = Math.floor(nextMin / 60) % 24;
    const m = nextMin % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12  = h % 12 || 12;
    return {
      time: `${h12}:${String(m).padStart(2,'0')} ${ampm}`,
      inMin: diffMin
    };
  }

  $: isBreakDue = nextBreak && nextBreak.inMin <= 0;

  let nextBreak = { time: '05:00 PM', inMin: 24 };
  let nextBreakInterval = null;

  function refreshNextBreak() {
    const calc = calcNextBreak(
      user.workStart || '09:00',
      user.workEnd || '17:00',
      settings.reminderIntervalMinutes || 45
    );
    if (calc) nextBreak = calc;
  }

  // ── Celebration Toast ──
  let celebrationMsg = '';
  let celebrationVisible = false;
  let celebrationTimeout = null;

  function showCelebration(msg) {
    if (celebrationTimeout) clearTimeout(celebrationTimeout);
    celebrationMsg = msg;
    celebrationVisible = true;
    celebrationTimeout = setTimeout(() => { celebrationVisible = false; }, 2500);
  }

  // Detect milestone changes
  let prevBreaksToday = 0;
  let prevWater       = 0;
  let prevLevel       = 1;
  let prevStreak      = 1;

  $: {
    if (progress) {
      const breaksNow = progress.completedBreaksToday || 0;
      const waterNow  = progress.water || 0;
      const levelNow  = progress.level || 1;
      const streakNow = progress.streak || 1;

      if (breaksNow > prevBreaksToday) {
        if (prevBreaksToday === 0 && breaksNow === 1) showCelebration('🎉 First stretch completed!');
        else if (breaksNow >= breakGoal && prevBreaksToday < breakGoal) showCelebration('🎯 Daily break goal reached!');
      }
      if (waterNow >= waterGoal && prevWater < waterGoal) {
        showCelebration('💧 Daily hydration goal reached!');
      }
      if (levelNow > prevLevel) { showCelebration(`⬆️ Level Up! You're now Level ${levelNow}!`); }
      if (streakNow > prevStreak && streakNow > 1) { showCelebration(`🔥 ${streakNow}-day streak! Keep it up!`); }

      // eslint-disable-next-line no-useless-assignment
      prevBreaksToday = breaksNow;
      // eslint-disable-next-line no-useless-assignment
      prevWater  = waterNow;
      // eslint-disable-next-line no-useless-assignment
      prevLevel  = levelNow;
      // eslint-disable-next-line no-useless-assignment
      prevStreak = streakNow;
    }
  }

  // Undo snackbar
  let prevActionTime = 0;
  function handleLastAction(lastAction) {
    if (lastAction && lastAction.timestamp !== prevActionTime) {
      prevActionTime = lastAction.timestamp;
      showUndoSnackbar = true;
      if (undoTimeout) clearTimeout(undoTimeout);
      undoTimeout = setTimeout(() => { showUndoSnackbar = false; }, 6000);
    }
  }
  $: handleLastAction(progress?.lastAction);

  function triggerUndo() { undoAction(); showUndoSnackbar = false; }

  // Formatted star rating score
  $: formattedScore = Math.min(5.0, Math.max(1.0, (wellnessScore / 20))).toFixed(1);

  onMount(() => {
    // Rotating tips every 7s
    tipInterval = setInterval(rotateTip, 7000);

    // Next break refresh every minute
    refreshNextBreak();
    nextBreakInterval = setInterval(refreshNextBreak, 60000);

    // End-of-day wellness summary
    const timer = setTimeout(() => {
      const today = new Date().toISOString().split('T')[0];
      const hasActivity = (progress.completedBreaksToday || 0) > 0 || (progress.water || 0) > 0;
      if (hasActivity && progress.lastSummaryShownDate !== today) {
        const hm = new Date().toTimeString().slice(0, 5);
        if (user.workEnd && hm >= user.workEnd) isSummaryOpen = true;
      }
    }, 10000);

    return () => clearTimeout(timer);
  });

  onDestroy(() => {
    if (tipInterval) clearInterval(tipInterval);
    if (nextBreakInterval) clearInterval(nextBreakInterval);
    if (undoTimeout) clearTimeout(undoTimeout);
    if (celebrationTimeout) clearTimeout(celebrationTimeout);
  });

  function makeDots(completed, goal) {
    return Array.from({ length: goal }, (_, i) => i < completed);
  }
</script>

<div class="home-screen animate-fade-in">

  <!-- ── Celebration Toast ── -->
  {#if celebrationVisible}
    <div class="celebration-toast animate-fade-in" role="status" aria-live="polite">
      <span class="toast-text">{celebrationMsg}</span>
    </div>
  {/if}

  <!-- ── 1. HEADER ROW ── -->
  <header class="top-header">
    <div class="user-greeting">
      <h1 class="greeting-text">Welcome back, {user.name || 'Alex'} 👋</h1>
    </div>
    <button 
      class="alerts-pill {settings.meetingMode ? 'muted' : 'active'}"
      on:click={() => navigateTo('settings')}
      aria-label="Alerts Status. Click to manage settings."
    >
      <span class="material-symbols-outlined pill-bell">
        {settings.meetingMode ? 'notifications_off' : 'notifications'}
      </span>
      <span>{settings.meetingMode ? 'Alerts Paused' : 'Alerts Active'}</span>
    </button>
  </header>

  {#if focusMode}
    <!-- ── Focus Mode ── -->
    <div class="focus-mode-container animate-fade-in">
      <div class="focus-timer-card">
        <div class="focus-ring-content">
          <span class="material-symbols-outlined focus-timer-icon">self_improvement</span>
          <span class="focus-timer-label">Active Focus</span>
          <span class="focus-timer-sub">{progress.completedBreaksToday || 0} Breaks Completed ({breakPercent}% Goal)</span>
        </div>
      </div>
      <div class="focus-actions">
        <Button variant="primary" size="lg" icon="play_arrow" onclick={() => navigateTo('break')}>
          Start Focus Stretch
        </Button>
        <button class="focus-water-btn" on:click={incrementWater} aria-label="Log a cup of water">
          <span class="material-symbols-outlined">water_drop</span>
          <span>Log Glass ({progress.water || 0} logged)</span>
        </button>
        <button class="exit-focus-btn" on:click={() => focusMode = false}>Exit Focus Mode</button>
      </div>
    </div>

  {:else}

    <!-- ── 2. GAMIFICATION CARD ── -->
    <div class="gamification-card {xpPulsing ? 'pulse-gami' : ''}">
      <div class="gami-top-row">
        <h2 class="gami-card-title">Gamification Card</h2>
        <div class="gami-badges">
          <span class="lvl-badge">Lvl {level}</span>
          <span class="streak-badge">
            <span class="fire-icon">🔥</span> {progress.streak || 5} Day Streak
          </span>
        </div>
      </div>
      <div class="xp-container">
        <div class="xp-label">
          <span>XP: {xp} / {xpNeeded}</span>
        </div>
        <div class="xp-track">
          <div class="xp-fill {xpPulsing ? 'pulse-fill' : ''}" style="width:{xpPercent}%"></div>
        </div>
      </div>
    </div>

    <!-- ── 3. HERO CARD ── -->
    <div class="hero-card {isBreakDue ? 'due-glow' : ''}">
      <div class="hero-card-header">
        <span class="hero-tag">{isBreakDue ? '⏰ Break Time Ready!' : 'Hero Card'}</span>
      </div>
      <div class="hero-card-body">
        <span class="next-break-lbl">{isBreakDue ? 'Time for a Stretch! 🧘' : 'Next Break in'}</span>
        <div class="next-break-digits {isBreakDue ? 'due-pulse-text' : ''}">
          {isBreakDue ? 'Break Due!' : `${nextBreak ? nextBreak.inMin : 24} min`}
        </div>
        <p class="hero-motivational-text {tipVisible ? 'tip-in' : 'tip-out'}">
          {isBreakDue ? 'Your posture needs a quick reset! Tap below to start your 2-min stretch session.' : TIPS[tipIndex].text}
        </p>
        <button class="hero-action-btn {isBreakDue ? 'pulse-cta' : ''}" on:click={() => navigateTo('break')} aria-label="Start 2-Min Break Now">
          <span class="btn-avatar">
            <span class="material-symbols-outlined">directions_run</span>
          </span>
          <span>Start 2-Min Break Now</span>
        </button>
      </div>
    </div>

    <!-- ── 4. DAILY WELLNESS STATS (2x2 GRID) ── -->
    <div class="wellness-stats-section">
      <h2 class="section-heading">Daily Wellness Stats</h2>
      <div class="stats-matrix-2x2">
        
        <!-- Card 1: Wellness Score -->
        <div class="stat-matrix-card">
          <span class="stat-title">Wellness Score</span>
          <div class="stat-value-star">
            <span class="star-icon">★</span>
            <span class="score-num">{formattedScore}</span>
            <span class="star-icon">★</span>
          </div>
        </div>

        <!-- Card 2: Breaks Completed -->
        <div class="stat-matrix-card">
          <span class="stat-title">Breaks Completed</span>
          <div class="stat-value-row">
            <span class="material-symbols-outlined stat-icon icon-emerald">schedule</span>
            <span class="stat-num">{progress.completedBreaksToday || 3} <span class="stat-total">of {breakGoal}</span></span>
          </div>
        </div>

        <!-- Card 3: Water Intake -->
        <div class="stat-matrix-card">
          <div class="stat-header-flex">
            <span class="stat-title">Water Intake</span>
            <button class="quick-water-btn" on:click|stopPropagation={incrementWater} title="Log 1 glass of water" aria-label="Log 1 glass of water">
              +1
            </button>
          </div>
          <div class="stat-value-row">
            <span class="stat-num">{progress.water || 5} <span class="stat-total">of {waterGoal} glasses</span></span>
          </div>
          <div class="stat-mini-track">
            <div class="stat-mini-fill" style="width:{waterPercent}%"></div>
          </div>
        </div>

        <!-- Card 4: Sedentary Hours -->
        <div class="stat-matrix-card">
          <span class="stat-title">Sedentary Hours</span>
          <div class="stat-value-row">
            <span class="material-symbols-outlined stat-icon icon-teal">airline_seat_recline_normal</span>
            <span class="stat-num">{todaySittingHours} <span class="stat-unit">hrs</span></span>
          </div>
          <span class="stat-sub-target">Target: &lt; 8 hrs</span>
        </div>

      </div>
    </div>

    <button 
      class="alert-toast-banner" 
      on:click={rotateTip} 
      aria-label="Active posture alert tip. Click to show next reminder."
    >
      <span class="alert-bell-icon">🔔</span>
      <span class="alert-banner-text" role="status" aria-live="polite">{TIPS[tipIndex].text}</span>
    </button>

    <!-- ── 6. TODAY'S PROGRESS GOALS ── -->
    <Card padding="md">
      <div class="goals-section">
        <div class="goals-header">
          <h3 class="section-title">☑️ Today's Progress Checklist</h3>
          <span class="goals-pct">{goalPercent}% Done</span>
        </div>
        <div class="goals-prog-track">
          <div class="goals-prog-fill" style="width:{goalPercent}%"></div>
        </div>

        <ul class="goals-list">
          <!-- Breaks goal -->
          <li class="goal-item {checkBreak ? 'completed' : ''}">
            <span class="material-symbols-outlined check-ico" aria-hidden="true">
              {checkBreak ? 'check_box' : 'check_box_outline_blank'}
            </span>
            <div class="goal-info">
              <span class="goal-lbl">Breaks Completed</span>
              <div class="seg-bar" aria-label="{progress.completedBreaksToday || 0} of {breakGoal} breaks">
                {#each makeDots(progress.completedBreaksToday || 0, Math.min(breakGoal, 12)) as filled}
                  <span class="seg-dot {filled ? 'filled' : ''}"></span>
                {/each}
              </div>
            </div>
            <span class="goal-num">{progress.completedBreaksToday || 0} / {breakGoal}</span>
          </li>

          <!-- Water goal -->
          <li class="goal-item {checkWater ? 'completed' : ''}">
            <span class="material-symbols-outlined check-ico" aria-hidden="true">
              {checkWater ? 'check_box' : 'check_box_outline_blank'}
            </span>
            <div class="goal-info">
              <span class="goal-lbl">Water Intake</span>
              <div class="seg-bar" aria-label="{progress.water || 0} of {waterGoal} cups">
                {#each makeDots(progress.water || 0, Math.min(waterGoal, 12)) as filled}
                  <span class="seg-dot {filled ? 'filled water' : ''}"></span>
                {/each}
              </div>
            </div>
            <span class="goal-num">{progress.water || 0} / {waterGoal} c</span>
          </li>

          <!-- Stretch duration -->
          <li class="goal-item {checkDuration ? 'completed' : ''}">
            <span class="material-symbols-outlined check-ico" aria-hidden="true">
              {checkDuration ? 'check_box' : 'check_box_outline_blank'}
            </span>
            <div class="goal-info">
              <span class="goal-lbl">Stretch Target</span>
              <div class="seg-bar" aria-label="{(progress.completedBreaksToday || 0) * 2} of 12 minutes">
                {#each makeDots((progress.completedBreaksToday || 0) * 2, 12) as filled}
                  <span class="seg-dot {filled ? 'filled emerald' : ''}"></span>
                {/each}
              </div>
            </div>
            <span class="goal-num">{(progress.completedBreaksToday || 0) * 2} / 12 min</span>
          </li>

          <!-- Sitting hours -->
          <li class="goal-item {checkSitting ? 'completed' : ''}">
            <span class="material-symbols-outlined check-ico" aria-hidden="true">
              {checkSitting ? 'check_box' : 'check_box_outline_blank'}
            </span>
            <span class="goal-lbl">Sit less than 8 hours</span>
            <span class="goal-num text-amber">{todaySittingHours} / 8 hrs</span>
          </li>
        </ul>
      </div>
    </Card>

    <!-- ── 7. WEEKLY CHALLENGES ── -->
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
            <span class="challenge-desc">Meet water goal 5 days ({hydrationDaysThisWeek} / 5)</span>
          </div>
        </div>
      </div>
    </Card>

    <!-- ── 8. QUICK STRETCHES ── -->
    <div class="section-header">
      <h3>Quick Stretches</h3>
      <button class="see-all-btn" on:click={() => navigateTo('library')}>See All ({STRETCHES.length})</button>
    </div>
    <div class="quick-stretches-list">
      {#each featuredStretches as item}
        <button class="stretch-card" on:click={() => navigateTo('break')} aria-label="Start {item.title} stretch">
          <div class="stretch-icon-wrap">
            <span class="material-symbols-outlined stretch-icon">{item.icon}</span>
          </div>
          <div class="stretch-details">
            <h4>{item.title}</h4>
            <span class="stretch-meta">{item.duration} sec · {item.difficulty} · {item.category}</span>
          </div>
          <span class="material-symbols-outlined arrow-icon" aria-hidden="true">arrow_forward_ios</span>
        </button>
      {/each}
    </div>

    <!-- ── 9. ONBOARDING TUTORIAL & BADGES ── -->
    <InlineTutorial />
    <BadgesList />

  {/if}
</div>

<!-- Undo Snackbar -->
{#if showUndoSnackbar && progress.lastAction}
  <div class="undo-snackbar animate-fade-in" role="status">
    <div class="snackbar-content">
      <span class="snackbar-text">Action logged successfully</span>
      <button class="undo-btn" on:click={triggerUndo}>
        <span class="material-symbols-outlined undo-icon-sym">undo</span>
        Undo
      </button>
    </div>
  </div>
{/if}

<!-- Wellness Summary Modal -->
<WellnessSummaryModal isOpen={isSummaryOpen} onclose={() => isSummaryOpen = false} />

<style>
  .home-screen {
    padding: 20px 18px 110px;
    max-width: 480px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 18px;
    box-sizing: border-box;
    background: var(--bg-gradient, transparent);
  }

  /* ── Celebration Toast ── */
  .celebration-toast {
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, var(--primary) 0%, var(--emerald) 100%);
    color: #fff;
    padding: 12px 24px;
    border-radius: 99px;
    font-size: 0.92rem;
    font-weight: 800;
    box-shadow: var(--shadow-lg);
    z-index: 200;
    white-space: nowrap;
    pointer-events: none;
  }

  /* ── 1. HEADER ROW ── */
  .top-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 4px;
  }

  .greeting-text {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-heading);
    letter-spacing: -0.025em;
  }

  .alerts-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 99px;
    font-size: 0.82rem;
    font-weight: 700;
    background: var(--bg-card);
    border: 1px solid var(--emerald-light, rgba(16, 185, 129, 0.3));
    color: var(--emerald);
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: all 0.2s ease;
  }

  :global(.theme-blue) .alerts-pill {
    color: var(--primary);
    border-color: var(--primary-light);
  }

  .alerts-pill.muted {
    color: var(--text-muted);
    border-color: var(--border-card);
  }

  .alerts-pill:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .pill-bell {
    font-size: 16px;
  }

  /* ── 2. GAMIFICATION CARD ── */
  .gamification-card {
    background: #111827;
    color: #ffffff;
    border-radius: var(--radius-lg, 24px);
    padding: 18px 20px;
    box-shadow: 0 10px 28px -4px rgba(15, 23, 42, 0.25);
    display: flex;
    flex-direction: column;
    gap: 14px;
    position: relative;
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  :global(.dark-mode) .gamification-card {
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .pulse-gami {
    animation: pulseGlow 0.9s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .gami-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .gami-card-title {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.01em;
  }

  .gami-badges {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .lvl-badge {
    background: #16a34a;
    color: #ffffff;
    font-size: 0.78rem;
    font-weight: 800;
    padding: 4px 12px;
    border-radius: 99px;
    letter-spacing: 0.02em;
  }

  .streak-badge {
    background: rgba(255, 255, 255, 0.12);
    color: #fbbf24;
    font-size: 0.78rem;
    font-weight: 800;
    padding: 4px 10px;
    border-radius: 99px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .fire-icon {
    font-size: 0.85rem;
  }

  .xp-container {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .xp-label {
    font-size: 0.82rem;
    font-weight: 700;
    color: #cbd5e1;
  }

  .xp-track {
    height: 12px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 99px;
    overflow: hidden;
  }

  .xp-fill {
    height: 100%;
    background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
    border-radius: 99px;
    transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .pulse-fill {
    box-shadow: 0 0 12px #22c55e;
  }

  /* ── 3. HERO CARD ── */
  .hero-card {
    background: #f4f7f4;
    border: 1px solid #e2e8e2;
    border-radius: var(--radius-lg, 24px);
    padding: 24px 20px;
    text-align: center;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    transition: all 0.3s ease;
  }

  .hero-card.due-glow {
    border-color: #16a34a;
    box-shadow: 0 0 20px rgba(22, 163, 74, 0.25);
    background: linear-gradient(185deg, #f0fdf4 0%, #f4f7f4 100%);
  }

  :global(.dark-mode) .hero-card.due-glow {
    background: linear-gradient(185deg, #052e16 0%, rgba(30, 41, 59, 0.8) 100%);
    border-color: #22c55e;
  }

  .due-pulse-text {
    color: #16a34a !important;
    animation: dueTextPulse 1.5s infinite alternate;
  }

  .pulse-cta {
    animation: dueBtnPulse 1.6s infinite;
  }

  @keyframes dueTextPulse {
    from { opacity: 0.85; transform: scale(0.98); }
    to { opacity: 1; transform: scale(1.03); }
  }

  @keyframes dueBtnPulse {
    0%, 100% { box-shadow: 0 8px 20px -2px rgba(21, 128, 61, 0.4); }
    50% { box-shadow: 0 14px 30px 4px rgba(34, 197, 94, 0.6); transform: translateY(-2px); }
  }

  :global(.dark-mode) .hero-card {
    background: rgba(30, 41, 59, 0.6);
    border-color: rgba(255, 255, 255, 0.08);
  }

  .hero-card-header {
    width: 100%;
    text-align: left;
    margin-bottom: 2px;
  }

  .hero-tag {
    font-size: 0.88rem;
    font-weight: 800;
    color: var(--text-muted);
  }

  .hero-card-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .next-break-lbl {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-main);
  }

  .next-break-digits {
    font-family: var(--font-heading);
    font-size: 2.8rem;
    font-weight: 900;
    color: #14532d;
    line-height: 1.15;
    margin: 4px 0 8px;
    letter-spacing: -0.03em;
  }

  :global(.dark-mode) .next-break-digits {
    color: #4ade80;
  }

  .hero-motivational-text {
    font-size: 0.88rem;
    color: var(--text-muted);
    font-weight: 600;
    max-width: 320px;
    margin: 0 0 18px;
    line-height: 1.45;
    transition: opacity 0.3s ease;
  }

  .hero-action-btn {
    width: 100%;
    max-width: 300px;
    background: #15803d;
    color: #ffffff;
    border: none;
    border-radius: 99px;
    padding: 12px 20px;
    font-size: 0.95rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    cursor: pointer;
    box-shadow: 0 8px 20px -2px rgba(21, 128, 61, 0.35);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .hero-action-btn:hover {
    background: #166534;
    transform: translateY(-2px);
    box-shadow: 0 12px 24px -2px rgba(21, 128, 61, 0.45);
  }

  .hero-action-btn:active {
    transform: translateY(0) scale(0.98);
  }

  .btn-avatar {
    width: 28px;
    height: 28px;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  /* ── 4. DAILY WELLNESS STATS (2x2 GRID) ── */
  .wellness-stats-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section-heading {
    margin: 0;
    font-size: 1.12rem;
    font-weight: 800;
    color: var(--text-heading);
    letter-spacing: -0.015em;
  }

  .stats-matrix-2x2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-matrix-card {
    background: #fdfbf7;
    border: 1px solid #eef0ea;
    border-radius: var(--radius-md, 18px);
    padding: 14px 14px 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 100px;
    box-shadow: var(--shadow-sm);
  }

  :global(.dark-mode) .stat-matrix-card {
    background: var(--bg-card);
    border-color: var(--border-card);
  }

  .stat-title {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-heading);
    margin-bottom: 6px;
    display: block;
  }

  .stat-value-star {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 1.4rem;
    font-weight: 900;
    color: #15803d;
    margin: 6px 0;
  }

  :global(.dark-mode) .stat-value-star {
    color: #4ade80;
  }

  .star-icon {
    color: #15803d;
    font-size: 1.3rem;
  }

  :global(.dark-mode) .star-icon {
    color: #4ade80;
  }

  .stat-value-row {
    display: flex;
    align-items: flex-baseline;
    gap: 6px;
    margin: 4px 0 2px;
  }

  .stat-icon {
    font-size: 20px;
    line-height: 1;
    align-self: center;
  }

  .icon-emerald { color: #15803d; }
  .icon-teal    { color: #0f766e; }

  .stat-num {
    font-size: 1.35rem;
    font-weight: 900;
    color: var(--text-heading);
    line-height: 1.1;
  }

  .stat-total {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
  }

  .stat-unit {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text-muted);
  }

  .stat-header-flex {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .quick-water-btn {
    background: rgba(2, 132, 199, 0.12);
    color: #0284c7;
    border: none;
    border-radius: 99px;
    padding: 2px 8px;
    font-size: 0.75rem;
    font-weight: 800;
    cursor: pointer;
    transition: background 0.2s;
  }

  .quick-water-btn:hover {
    background: rgba(2, 132, 199, 0.22);
  }

  .stat-mini-track {
    width: 100%;
    height: 5px;
    background: rgba(2, 132, 199, 0.15);
    border-radius: 99px;
    overflow: hidden;
    margin-top: 6px;
  }

  .stat-mini-fill {
    height: 100%;
    background: #0284c7;
    border-radius: 99px;
    transition: width 0.4s ease;
  }

  .stat-sub-target {
    font-size: 0.74rem;
    font-weight: 700;
    color: var(--text-muted);
    margin-top: 4px;
    display: block;
  }

  /* ── 5. ROTATED ALERT TOAST BANNER ── */
  .alert-toast-banner {
    width: 100%;
    background: #fdfbf7;
    border: 1px solid #e5e7eb;
    border-radius: 99px;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    text-align: center;
  }

  :global(.dark-mode) .alert-toast-banner {
    background: var(--bg-card);
    border-color: var(--border-card);
  }

  .alert-toast-banner:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .alert-bell-icon {
    font-size: 0.95rem;
  }

  .alert-banner-text {
    font-size: 0.84rem;
    font-weight: 700;
    color: var(--text-heading);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ── 6. TODAY'S CHECKLIST GOALS ── */
  .goals-section { display: flex; flex-direction: column; gap: 12px; }

  .goals-header { display: flex; justify-content: space-between; align-items: center; }

  .section-title { margin: 0; font-size: 0.98rem; font-weight: 800; color: var(--text-heading); }

  .goals-pct { font-size: 0.76rem; font-weight: 700; color: var(--primary); }

  .goals-prog-track {
    width: 100%;
    height: 6px;
    background: rgba(148,163,184,0.15);
    border-radius: 99px;
    overflow: hidden;
  }

  .goals-prog-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary) 0%, var(--emerald) 100%);
    border-radius: 99px;
    transition: width 0.4s ease-out;
  }

  .goals-list {
    margin: 4px 0 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .goal-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.84rem;
    color: var(--text-muted);
  }

  .goal-item.completed { color: var(--emerald); }

  .check-ico { font-size: 18px; color: var(--text-muted); }
  .goal-item.completed .check-ico { color: var(--emerald); }

  .goal-info { display: flex; flex-direction: column; flex-grow: 1; gap: 4px; }

  .goal-lbl { font-weight: 700; font-size: 0.82rem; color: var(--text-heading); }
  .goal-item.completed .goal-lbl { color: var(--emerald); }

  .goal-num { font-size: 0.78rem; font-weight: 700; color: var(--text-heading); white-space: nowrap; }
  .text-amber { color: var(--amber); }

  .seg-bar { display: flex; flex-wrap: wrap; gap: 4px; }

  .seg-dot {
    width: 10px; height: 10px; border-radius: 3px;
    background: rgba(148,163,184,0.2); transition: background 0.3s ease; flex-shrink: 0;
  }

  .seg-dot.filled { background: var(--primary); }
  .seg-dot.filled.water { background: #0284c7; }
  .seg-dot.filled.emerald { background: var(--emerald); }

  /* ── 7. WEEKLY CHALLENGES ── */
  .challenges-section { display: flex; flex-direction: column; gap: 12px; }
  .challenge-item { display: flex; align-items: center; gap: 12px; }
  .challenge-icon { font-size: 22px; color: var(--text-muted); }
  .challenge-icon.completed { color: var(--emerald); }
  .challenge-info { display: flex; flex-direction: column; }
  .challenge-title { font-size: 0.88rem; font-weight: 700; color: var(--text-heading); }
  .challenge-desc { font-size: 0.76rem; color: var(--text-muted); }

  /* ── 8. QUICK STRETCHES ── */
  .section-header {
    display: flex; align-items: center; justify-content: space-between; margin-top: 4px;
  }
  .section-header h3 { margin: 0; font-size: 1.05rem; font-weight: 800; color: var(--text-heading); }
  .see-all-btn {
    background: transparent; border: none; color: var(--primary);
    font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: opacity 0.2s;
  }
  .see-all-btn:hover { opacity: 0.8; }
  .quick-stretches-list { display: flex; flex-direction: column; gap: 10px; }
  .stretch-card {
    background: var(--bg-card); border: 1px solid var(--border-card);
    border-radius: var(--radius-md); padding: 14px 16px;
    display: flex; align-items: center; gap: 14px;
    cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease;
    width: 100%; text-align: left; font: inherit; color: inherit; box-shadow: var(--shadow-sm);
    min-height: 44px;
  }
  .stretch-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
  .stretch-icon-wrap {
    width: 44px; height: 44px; background: var(--primary-light);
    border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .stretch-icon { font-size: 24px; color: var(--primary); }
  .stretch-details { flex-grow: 1; }
  .stretch-details h4 { margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--text-heading); }
  .stretch-meta { font-size: 0.78rem; color: var(--text-muted); margin-top: 2px; display: block; }
  .arrow-icon { color: var(--text-muted); font-size: 14px; }

  /* ── FOCUS MODE ── */
  .focus-mode-container {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 30px; padding: 40px 10px; text-align: center;
  }
  .focus-timer-card {
    background: var(--bg-card); border: 1px solid var(--border-card);
    border-radius: 50%; width: 230px; height: 230px;
    display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-lg);
  }
  .focus-ring-content { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .focus-timer-icon { font-size: 48px; color: var(--primary); }
  .focus-timer-label { font-size: 0.95rem; font-weight: 800; color: var(--text-heading); }
  .focus-timer-sub   { font-size: 0.78rem; color: var(--text-muted); font-weight: 600; }
  .focus-actions { display: flex; flex-direction: column; width: 100%; max-width: 280px; gap: 12px; }
  .focus-water-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    background: rgba(14,165,233,0.1); border: 1px dashed rgba(14,165,233,0.4);
    color: #0284c7; border-radius: 12px; padding: 10px;
    font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: background 0.2s;
    min-height: 44px;
  }
  .focus-water-btn:hover { background: rgba(14,165,233,0.16); }
  .exit-focus-btn {
    background: transparent; border: none; color: var(--text-muted);
    font-size: 0.8rem; font-weight: 700; cursor: pointer;
    text-decoration: underline; margin-top: 10px;
  }

  /* ── UNDO SNACKBAR ── */
  .undo-snackbar {
    position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
    background: #1e293b; border: 1px solid #334155; box-shadow: var(--shadow-lg);
    border-radius: var(--radius-sm); padding: 10px 16px;
    width: calc(100% - 40px); max-width: 400px; z-index: 99;
  }
  :global(.dark-mode) .undo-snackbar { background: #0f172a; border-color: #1e293b; }
  .snackbar-content { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  .snackbar-text { font-size: 0.8rem; color: #fff; font-weight: 600; }
  .undo-btn {
    background: transparent; border: none; color: var(--primary);
    font-weight: 800; font-size: 0.8rem; cursor: pointer;
    display: flex; align-items: center; gap: 4px;
    padding: 4px 8px; border-radius: 4px; transition: background 0.2s; min-height: 44px;
  }
  .undo-btn:hover { background: var(--primary-light); }
  .undo-icon-sym { font-size: 14px; }

  /* ── ANIMATIONS ── */
  @keyframes pulseGlow {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
    50% { transform: scale(1.015); box-shadow: 0 0 20px 4px rgba(34, 197, 94, 0.6); }
    100% { transform: scale(1); box-shadow: 0 10px 28px -4px rgba(15, 23, 42, 0.25); }
  }

  /* ── REDUCED MOTION ── */
  @media (prefers-reduced-motion: reduce) {
    .animate-fade-in { animation: none; }
    .pulse-gami, .pulse-fill { animation: none; }
    .xp-fill, .stat-mini-fill { transition: none; }
  }
</style>
