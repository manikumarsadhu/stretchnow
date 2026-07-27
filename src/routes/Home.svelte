<script>
  import { onMount, onDestroy } from 'svelte';
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  import ProgressCard from '../components/ProgressCard.svelte';
  import ProgressRing from '../components/ProgressRing.svelte';
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
  let undoTimeout: ReturnType<typeof setTimeout> | null = null;

  // Goals
  $: breakGoal        = user.dailyBreakGoal || 6;
  $: waterGoal        = user.dailyWaterGoal || 8;
  let todayIndex = (new Date().getDay() + 6) % 7;
  $: todaySittingHours = statistics.sittingHours ? statistics.sittingHours[todayIndex] : 7.5;
  $: checkBreak    = (progress.completedBreaksToday || 0) >= breakGoal;
  $: checkWater    = (progress.water || 0) >= waterGoal;
  $: checkDuration = ((progress.completedBreaksToday || 0) * 2) >= 12;
  $: checkSitting  = todaySittingHours < 8;
  $: completedGoalsCount = (checkBreak ? 1 : 0) + (checkWater ? 1 : 0) + (checkDuration ? 1 : 0) + (checkSitting ? 1 : 0);
  $: goalPercent = Math.round((completedGoalsCount / 4) * 100);

  // ── Rotating Wellness Tips ──
  const TIPS = [
    { emoji: '💧', text: 'Time for a glass of water.' },
    { emoji: '👀', text: 'Try the 20-20-20 rule: look 20ft away for 20s.' },
    { emoji: '🧘', text: 'Small breaks significantly reduce muscle tension.' },
    { emoji: '🚶', text: 'Stand up and stretch for two minutes.' },
    { emoji: '🔥', text: 'Consistency beats intensity. Every break counts.' },
    { emoji: '💤', text: 'Micro-rest prevents cumulative strain.' },
  ];
  let tipIndex = 0;
  let tipVisible = true;
  let tipInterval = null;

  function rotateTip() {
    tipVisible = false;
    setTimeout(() => {
      tipIndex = (tipIndex + 1) % TIPS.length;
      tipVisible = true;
    }, 300);
  }

  // ── Next Break Timer ──
  function calcNextBreak(start, end, interval) {
    if (!start || !end || !interval) return null;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin   = eh * 60 + em;
    if (nowMin >= endMin || nowMin < startMin) return null;

    let nextMin = startMin + interval;
    while (nextMin <= nowMin) nextMin += interval;
    if (nextMin >= endMin) return null;

    const diffMin = nextMin - nowMin;
    const h = Math.floor(nextMin / 60) % 24;
    const m = nextMin % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12  = h % 12 || 12;
    return {
      time: `${h12}:${String(m).padStart(2,'0')} ${ampm}`,
      inMin: diffMin
    };
  }

  let nextBreak = null;
  let nextBreakInterval = null;

  function refreshNextBreak() {
    nextBreak = calcNextBreak(
      user.workStart,
      user.workEnd,
      settings.reminderIntervalMinutes || 45
    );
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

  // Detect milestone changes — initialize with safe defaults (never read from reactive `progress` at module init)
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
        prevBreaksToday = breaksNow;
      }
      if (waterNow >= waterGoal && prevWater < waterGoal) {
        showCelebration('💧 Daily hydration goal reached!');
      }
      if (levelNow > prevLevel) { showCelebration(`⬆️ Level Up! You're now Level ${levelNow}!`); }
      if (streakNow > prevStreak && streakNow > 1) { showCelebration(`🔥 ${streakNow}-day streak! Keep it up!`); }

      prevWater  = waterNow;
      prevLevel  = levelNow;
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

  // Stars for wellness score
  function getStars(score) {
    const n = Math.round(score / 20);
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }
  $: starRating = getStars(wellnessScore);

  onMount(() => {
    // Rotating tips every 6s
    tipInterval = setInterval(rotateTip, 6000);

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

  // Segmented dots helper — replaces ASCII blocks
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

  <!-- ── Header ── -->
  <header class="header">
    <div class="user-greeting">
      <h2 class="greeting-text">Hello, {user.name || 'Friend'} 👋</h2>
      <div class="status-pill">
        <span class="pulse-dot"></span>
        <span>Posture Active · {user.occupation || 'Desk Worker'}</span>
      </div>
    </div>
    <div class="header-actions">
      <button
        class="icon-btn {focusMode ? 'active' : ''}"
        on:click={() => focusMode = !focusMode}
        aria-label={focusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
      >
        <span class="material-symbols-outlined">{focusMode ? 'visibility_off' : 'center_focus_strong'}</span>
      </button>
      <button class="icon-btn" on:click={() => navigateTo('settings')} aria-label="Settings">
        <span class="material-symbols-outlined">settings</span>
      </button>
    </div>
  </header>

  {#if focusMode}
    <!-- ── Focus Mode ── -->
    <div class="focus-mode-container animate-fade-in">
      <div class="focus-timer-card">
        <ProgressRing progress={breakPercent} size={180} strokeWidth={14} color="var(--primary)">
          <div class="focus-ring-content">
            <span class="material-symbols-outlined focus-timer-icon">self_improvement</span>
            <span class="focus-timer-label">Active Focus</span>
            <span class="focus-timer-sub">{progress.completedBreaksToday || 0} Breaks</span>
          </div>
        </ProgressRing>
      </div>
      <div class="focus-actions">
        <Button variant="primary" size="lg" icon="play_arrow" onclick={() => navigateTo('break')}>
          Start Focus Stretch
        </Button>
        <button class="focus-water-btn" on:click={incrementWater} aria-label="Log a cup of water">
          <span class="material-symbols-outlined">water_drop</span>
          <span>Log Cup ({progress.water || 0} logged)</span>
        </button>
        <button class="exit-focus-btn" on:click={() => focusMode = false}>Exit Focus Mode</button>
      </div>
    </div>

  {:else}
    <!-- ── ROTATING WELLNESS TIP ── -->
    <div class="tip-carousel {tipVisible ? 'tip-visible' : 'tip-hidden'}">
      <div class="tip-emoji">{TIPS[tipIndex].emoji}</div>
      <p class="tip-text">{TIPS[tipIndex].text}</p>
      <div class="tip-dots">
        {#each TIPS as _, i}
          <span class="tip-dot {i === tipIndex ? 'active' : ''}"></span>
        {/each}
      </div>
    </div>

    <!-- ── XP / Level Bar ── -->
    <div class="xp-bar-container">
      <div class="xp-header">
        <div class="level-badge">Lv. {level}</div>
        <span class="xp-text">{xp} / {xpNeeded} XP</span>
      </div>
      <div class="xp-track">
        <div class="xp-fill" style="width:{xpPercent}%"></div>
      </div>
    </div>

    <!-- ── HERO: Start Break CTA ── -->
    <Card hover padding="lg">
      <div class="hero-break">
        <div class="break-ring">
          <ProgressRing progress={breakPercent} size={100} strokeWidth={9} color="var(--primary)">
            <span class="material-symbols-outlined hero-ring-icon">self_improvement</span>
          </ProgressRing>
        </div>
        <div class="break-info">
          <span class="break-tag">Recommended Routine</span>
          <h3 class="break-title">2-Min Posture Reset</h3>
          <p class="break-desc">
            <strong>{progress.completedBreaksToday || 0}</strong> of <strong>{breakGoal}</strong> daily breaks completed
          </p>
          <Button variant="primary" size="md" icon="play_arrow" onclick={() => navigateTo('break')}>
            Start Break Now
          </Button>
        </div>
      </div>
    </Card>

    <!-- ── Onboarding Tutorial ── -->
    <InlineTutorial />

    <!-- ── TODAY'S PROGRESS GOALS ── -->
    <Card padding="md">
      <div class="goals-section">
        <div class="goals-header">
          <h3 class="section-title">☑️ Today's Progress Goals</h3>
          <span class="goals-pct">{goalPercent}% Done</span>
        </div>
        <div class="goals-prog-track">
          <div class="goals-prog-fill" style="width:{goalPercent}%"></div>
        </div>

        {#if progress.completedBreaksToday === 0 && (progress.water || 0) === 0}
          <!-- Empty State -->
          <div class="goals-empty-state">
            <span class="material-symbols-outlined goals-empty-icon">rocket_launch</span>
            <p>Your wellness journey starts today — tap <strong>Start Break</strong> to begin!</p>
          </div>
        {:else}
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
                <span class="goal-lbl">Stretch Time Target</span>
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
        {/if}
      </div>
    </Card>

    <!-- ── NEXT BREAK CARD ── -->
    {#if nextBreak}
      <div class="next-break-card">
        <div class="next-break-left">
          <span class="material-symbols-outlined next-break-icon">alarm</span>
          <div>
            <span class="next-break-label">Next Break</span>
            <span class="next-break-time">{nextBreak.time}</span>
          </div>
        </div>
        <span class="next-break-countdown">in {nextBreak.inMin} min</span>
      </div>
    {/if}

    <!-- ── Stats Grid ── -->
    <div class="stats-grid">
      <ProgressCard
        title="Wellness Score"
        value="{wellnessScore} / 100"
        subtitle={starRating}
        icon="bolt"
        iconBg="rgba(245,158,11,0.15)"
        iconColor="#f59e0b"
      />
      <ProgressCard
        title="Day Streak"
        value="{progress.streak || 1} Days"
        subtitle="On a roll!"
        icon="local_fire_department"
        iconBg="rgba(244,63,94,0.15)"
        iconColor="#f43f5e"
      />
    </div>

    <!-- ── Water Tracker ── -->
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
          <Button variant="secondary" size="sm" icon="add" onclick={incrementWater}>+1 Cup</Button>
        </div>
        <div class="water-bar-track">
          <div class="water-bar-fill" style="width:{waterPercent}%"></div>
        </div>
      </div>
    </Card>

    <!-- ── Weekly Challenges ── -->
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

    <!-- ── Activity Timeline ── -->
    <Card padding="md">
      <div class="timeline-section">
        <h3 class="section-title">🕒 Today's Activity Log</h3>
        {#if !progress.timeline || progress.timeline.length === 0}
          <div class="timeline-empty-state">
            <span class="material-symbols-outlined timeline-empty-icon">history</span>
            <p>Complete your first stretch to see your activity log here.</p>
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

    <!-- ── Quick Stretches ── -->
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

    <!-- ── Badges ── -->
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
    padding: 24px 20px 110px;
    max-width: 480px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
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

  /* ── Header ── */
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
    animation: pulse 2s infinite;
  }

  .header-actions { display: flex; align-items: center; gap: 10px; }

  .icon-btn {
    background: var(--bg-card);
    border: 1px solid var(--border-card);
    color: var(--text-muted);
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

  .icon-btn:hover, .icon-btn.active {
    background: var(--primary-light);
    color: var(--primary);
    transform: scale(1.05);
  }

  /* ── Rotating Tip Carousel ── */
  .tip-carousel {
    background: var(--bg-card);
    border: 1px solid var(--border-card);
    border-radius: var(--radius-md);
    padding: 14px 18px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: var(--shadow-sm);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .tip-visible  { opacity: 1; transform: translateY(0); }
  .tip-hidden   { opacity: 0; transform: translateY(4px); }

  .tip-emoji { font-size: 1.5rem; flex-shrink: 0; }

  .tip-text {
    flex: 1;
    margin: 0;
    font-size: 0.86rem;
    font-weight: 600;
    color: var(--text-heading);
    line-height: 1.4;
  }

  .tip-dots {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex-shrink: 0;
  }

  .tip-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--border-card);
    transition: background 0.3s;
  }

  .tip-dot.active { background: var(--primary); }

  /* ── XP Bar ── */
  .xp-bar-container {
    background: var(--bg-card);
    border: 1px solid var(--border-card);
    border-radius: var(--radius-sm);
    padding: 12px 16px;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .xp-header { display: flex; justify-content: space-between; align-items: center; }

  .level-badge {
    font-size: 0.85rem;
    font-weight: 800;
    color: #fff;
    background: var(--primary);
    padding: 2px 10px;
    border-radius: 99px;
  }

  .xp-text { font-size: 0.78rem; color: var(--text-muted); font-weight: 600; }

  .xp-track {
    height: 8px;
    background: rgba(148,163,184,0.15);
    border-radius: 99px;
    overflow: hidden;
  }

  .xp-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary) 0%, var(--emerald) 100%);
    border-radius: 99px;
    transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* ── Hero Break CTA ── */
  .hero-break { display: flex; align-items: center; gap: 18px; }

  .break-ring { flex-shrink: 0; }

  .hero-ring-icon { font-size: 42px; color: var(--primary); }

  .break-info { display: flex; flex-direction: column; gap: 6px; flex-grow: 1; }

  .break-tag {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--primary);
    letter-spacing: 0.05em;
  }

  .break-title { margin: 0; font-size: 1.2rem; font-weight: 800; color: var(--text-heading); }

  .break-desc { margin: 0 0 6px; font-size: 0.82rem; color: var(--text-muted); }

  /* ── Goals Section ── */
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

  .goals-empty-state {
    text-align: center;
    padding: 16px 8px;
    color: var(--text-muted);
    font-size: 0.84rem;
    line-height: 1.5;
  }

  .goals-empty-icon {
    font-size: 32px;
    color: var(--primary);
    opacity: 0.5;
    display: block;
    margin-bottom: 6px;
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
    transition: color 0.2s;
  }

  .goal-item.completed { color: var(--emerald); }

  .check-ico { font-size: 18px; color: var(--text-muted); }
  .goal-item.completed .check-ico { color: var(--emerald); }

  .goal-info { display: flex; flex-direction: column; flex-grow: 1; gap: 4px; }

  .goal-lbl { font-weight: 700; font-size: 0.82rem; color: var(--text-heading); }
  .goal-item.completed .goal-lbl { color: var(--emerald); }

  .goal-num { font-size: 0.78rem; font-weight: 700; color: var(--text-heading); white-space: nowrap; }
  .text-amber { color: var(--amber); }

  /* ── Segmented Dot Bars ── */
  .seg-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .seg-dot {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    background: rgba(148,163,184,0.2);
    transition: background 0.3s ease;
    flex-shrink: 0;
  }

  .seg-dot.filled {
    background: var(--primary);
  }

  .seg-dot.filled.water { background: #0284c7; }
  .seg-dot.filled.emerald { background: var(--emerald); }

  .goal-item.completed .seg-dot.filled { background: var(--emerald); }

  /* ── Next Break Card ── */
  .next-break-card {
    background: var(--bg-card);
    border: 1px solid var(--border-card);
    border-radius: var(--radius-md);
    padding: 14px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: var(--shadow-sm);
    border-left: 3px solid var(--primary);
  }

  .next-break-left { display: flex; align-items: center; gap: 12px; }

  .next-break-icon { font-size: 24px; color: var(--primary); }

  .next-break-label {
    display: block;
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .next-break-time {
    display: block;
    font-size: 1.1rem;
    font-weight: 800;
    color: var(--text-heading);
  }

  .next-break-countdown {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--primary);
    background: var(--primary-light);
    padding: 5px 12px;
    border-radius: 99px;
  }

  /* ── Stats Grid ── */
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

  /* ── Water Tracker ── */
  .water-section { display: flex; flex-direction: column; gap: 12px; }
  .water-header { display: flex; align-items: center; justify-content: space-between; }
  .water-title-wrap { display: flex; align-items: center; gap: 12px; }
  .water-icon-wrap {
    width: 40px; height: 40px;
    background: rgba(14,165,233,0.12);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
  }
  .water-icon { font-size: 22px; color: #0284c7; }
  .water-title { margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--text-heading); }
  .water-sub { font-size: 0.78rem; color: var(--text-muted); }
  .water-bar-track {
    width: 100%; height: 9px;
    background: rgba(226,232,240,0.8);
    border-radius: 99px; overflow: hidden;
  }
  :global(.dark-mode) .water-bar-track { background: rgba(51,65,85,0.8); }
  .water-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #0284c7 0%, #38bdf8 100%);
    border-radius: 99px;
    transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* ── Weekly Challenges ── */
  .challenges-section { display: flex; flex-direction: column; gap: 12px; }
  .challenge-item { display: flex; align-items: center; gap: 12px; }
  .challenge-icon { font-size: 22px; color: var(--text-muted); }
  .challenge-icon.completed { color: var(--emerald); }
  .challenge-info { display: flex; flex-direction: column; }
  .challenge-title { font-size: 0.88rem; font-weight: 700; color: var(--text-heading); }
  .challenge-desc { font-size: 0.76rem; color: var(--text-muted); }

  /* ── Timeline ── */
  .timeline-section { display: flex; flex-direction: column; gap: 12px; }
  .timeline-empty-state {
    padding: 16px 8px; text-align: center;
    color: var(--text-muted); font-size: 0.82rem; line-height: 1.5;
  }
  .timeline-empty-icon {
    font-size: 32px; margin-bottom: 6px; opacity: 0.5;
    display: block;
  }
  .timeline-list { display: flex; flex-direction: column; gap: 14px; }
  .timeline-item { display: flex; align-items: center; gap: 14px; font-size: 0.82rem; }
  .time-stamp { font-size: 0.74rem; font-weight: 700; color: var(--text-muted); width: 32px; text-align: right; }
  .timeline-bullet {
    width: 20px; height: 20px; border-radius: 50%;
    background: var(--bg-app); color: var(--text-muted);
    border: 2px solid var(--border-card); font-size: 12px;
    display: flex; align-items: center; justify-content: center; z-index: 2;
  }
  .timeline-bullet.timeline-stretch { color: var(--primary); border-color: var(--primary); }
  .timeline-bullet.timeline-water   { color: #0284c7; border-color: #0284c7; }
  .timeline-bullet.timeline-skip    { color: #ef4444; border-color: #ef4444; }
  .timeline-label { font-weight: 600; font-size: 0.8rem; color: var(--text-heading); }

  /* ── Quick Stretches ── */
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

  /* ── Focus Mode ── */
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

  /* ── Undo Snackbar ── */
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

  /* ── Animations ── */
  @keyframes pulse {
    0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16,185,129,0.7); }
    70%  { transform: scale(1);    box-shadow: 0 0 0 10px rgba(16,185,129,0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16,185,129,0); }
  }

  /* ── Reduced Motion ── */
  @media (prefers-reduced-motion: reduce) {
    .pulse-dot { animation: none; }
    .animate-fade-in { animation: none; }
    .celebration-toast { animation: none; }
    .xp-fill, .goals-prog-fill, .water-bar-fill, .seg-dot { transition: none; }
    .tip-carousel { transition: none; }
  }
</style>
