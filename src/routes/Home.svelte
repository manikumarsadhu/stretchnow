<script>
  import { onMount, onDestroy } from 'svelte';
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  import WellnessSummaryModal from '../components/WellnessSummaryModal.svelte';
  import NotificationCenterModal from '../components/NotificationCenterModal.svelte';
  import { appStore, navigateTo, incrementWater, startTodayAction, endTodayAction } from '../stores/app.js';
  import { calculateWellnessScore, calculateWaterPercentage, calculateBreakGoalPercentage } from '../utils/wellness.js';
  import { triggerConfetti } from '../utils/confetti.js';

  $: user       = $appStore.user     || {};
  $: progress   = $appStore.progress || {};
  $: statistics = $appStore.statistics || {};
  $: settings   = $appStore.settings  || {};

  $: wellnessScore = calculateWellnessScore(progress, user, statistics);
  $: waterPercent  = calculateWaterPercentage(progress.water, user.dailyWaterGoal);
  $: breakPercent  = calculateBreakGoalPercentage(progress.completedBreaksToday, user.dailyBreakGoal);

  $: scoreTier = wellnessScore >= 80 
    ? { key: 'excellent', label: 'Excellent', icon: 'check_circle' } 
    : wellnessScore >= 60 
    ? { key: 'good', label: 'Good', icon: 'thumb_up' } 
    : { key: 'focus', label: 'Needs Focus', icon: 'track_changes' };

  $: focusAreas = [
    waterPercent < 60 && `Hydration (${waterPercent}%)`,
    breakPercent < 60 && `Breaks (${breakPercent}%)`
  ].filter(Boolean);

  // Dynamic Greeting
  const currentHour = new Date().getHours();
  const greetingTime = currentHour < 12 ? 'Good Morning' : currentHour < 18 ? 'Good Afternoon' : 'Good Evening';
  $: streakDays = progress.streak || 7;
  $: dynamicStreakSubtext = streakDays > 1 
    ? `🔥 You're on a ${streakDays}-day streak! Let's keep it going.` 
    : `🔥 Start your posture streak today with a 2-minute break!`;

  $: workdayStartTimeFormatted = progress.workdayStartedAt
    ? new Date(progress.workdayStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  function handleStartToday() {
    startTodayAction();
    showCelebration('🚀 Workday targets activated! Have a great day.');
  }

  function handleEndToday() {
    endTodayAction();
    showCelebration('👏 Workday finished! Well done today.');
  }

  // Focus Mode, Summary & Notification Center
  let focusMode = false;
  let isSummaryOpen = false;
  let isNotificationCenterOpen = false;
  $: unreadCount = ($appStore?.notifications || []).filter((n) => n.unread).length;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let undoTimeout = null;

  // Goals
  $: breakGoal = user.dailyBreakGoal || 6;
  $: waterGoal = user.dailyWaterGoal || 8;

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
    if (diffMin <= 0) return { time: 'Now', inMin: 0 };

    const h = Math.floor(nextMin / 60) % 24;
    const m = nextMin % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12  = h % 12 || 12;
    return {
      time: `${h12}:${String(m).padStart(2,'0')} ${ampm}`,
      inMin: diffMin
    };
  }

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

  // ── Celebration Toast & Confetti ──
  let celebrationMsg = '';
  let celebrationVisible = false;
  let celebrationTimeout = null;

  function showCelebration(msg) {
    if (celebrationTimeout) clearTimeout(celebrationTimeout);
    celebrationMsg = msg;
    celebrationVisible = true;
    if (settings.celebrationAnimations !== false) {
      triggerConfetti();
    }
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

  $: isBreakDue = nextBreak && nextBreak.inMin <= 0;

  onMount(() => {
    refreshNextBreak();
    nextBreakInterval = setInterval(refreshNextBreak, 60000);
  });

  onDestroy(() => {
    if (nextBreakInterval) clearInterval(nextBreakInterval);
    if (undoTimeout) clearTimeout(undoTimeout);
    if (celebrationTimeout) clearTimeout(celebrationTimeout);
  });
</script>

<div class="home-screen animate-fade-in">

  <!-- ── Celebration Toast ── -->
  {#if celebrationVisible}
    <div class="celebration-toast animate-fade-in" role="status" aria-live="polite">
      <span class="toast-text">{celebrationMsg}</span>
    </div>
  {/if}

  <!-- ── 1. DYNAMIC HEADER & GREETING ── -->
  <header class="top-header">
    <div class="user-greeting">
      <h1 class="greeting-text">{greetingTime}, {user.name || 'Guest'} 👋</h1>
      <p class="greeting-subtext">{dynamicStreakSubtext}</p>
    </div>
    <div class="header-actions">
      <button 
        type="button"
        class="bell-btn"
        on:click={() => isNotificationCenterOpen = true}
        title="In-App Notification History"
        aria-label="Open In-App Notification Center"
      >
        <span class="material-symbols-outlined">notifications</span>
        {#if unreadCount > 0}
          <span class="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        {/if}
      </button>
      <button 
        type="button"
        class="alerts-pill {settings.meetingMode ? 'muted' : 'active'}"
        on:click={() => navigateTo('settings')}
        title={settings.meetingMode ? 'Meeting Mode Active (Alerts Paused)' : 'Alerts Active'}
        aria-label="Alerts Status"
      >
        <span class="material-symbols-outlined pill-bell">
          {settings.meetingMode ? 'notifications_off' : 'notifications_active'}
        </span>
      </button>
    </div>
  </header>

  {#if focusMode}
    <!-- ── Focus Mode ── -->
    <div class="focus-mode-container animate-fade-in">
      <Card variant="hero" padding="lg">
        <div class="focus-ring-content">
          <span class="material-symbols-outlined focus-timer-icon">self_improvement</span>
          <h2 class="focus-timer-label">Active Focus Mode</h2>
          <p class="focus-timer-sub">{progress.completedBreaksToday || 0} Breaks Completed ({breakPercent}% Goal)</p>
        </div>
      </Card>
      <div class="focus-actions">
        <Button variant="primary" size="lg" icon="play_arrow" fullWidth onclick={() => navigateTo('break')}>
          Start Focus Stretch
        </Button>
        <button type="button" class="focus-water-btn" on:click={incrementWater}>
          <span class="material-symbols-outlined">water_drop</span>
          <span>Log Glass ({progress.water || 0} logged)</span>
        </button>
        <button type="button" class="exit-focus-btn" on:click={() => focusMode = false}>Exit Focus Mode</button>
      </div>
    </div>

  {:else}

    <!-- ── 2. HERO WORKDAY & NEXT BREAK SECTION ── -->
    <section class="hero-section">
      {#if !progress.todayStarted}
        <!-- State A: Workday Not Started Yet -->
        <Card variant="hero" padding="lg">
          <div class="start-today-card-inner">
            <div class="hero-badge-pill">
              <span class="material-symbols-outlined">wb_sunny</span>
              <span>{greetingTime}! Ready for work?</span>
            </div>
            <h2 class="start-today-title">Start Today's Targets</h2>
            <p class="start-today-desc">
              Tap to begin tracking your posture breaks, hydration, and daily wellness goals.
            </p>
            
            <div class="targets-preview-grid">
              <div class="target-chip">
                <span class="material-symbols-outlined chip-icon">self_improvement</span>
                <span class="chip-val">{breakGoal}</span>
                <span class="chip-lbl">Breaks Target</span>
              </div>
              <div class="target-chip">
                <span class="material-symbols-outlined chip-icon">water_drop</span>
                <span class="chip-val">{waterGoal}</span>
                <span class="chip-lbl">Water Cups</span>
              </div>
              <div class="target-chip">
                <span class="material-symbols-outlined chip-icon">timer</span>
                <span class="chip-val">{settings.reminderIntervalMinutes || 45}m</span>
                <span class="chip-lbl">Break Cadence</span>
              </div>
            </div>

            <div class="start-cta-wrap">
              <Button variant="secondary" size="lg" icon="play_arrow" fullWidth onclick={handleStartToday}>
                Start Today
              </Button>
            </div>
            <button type="button" class="quick-stretch-link" on:click={() => navigateTo('break')}>
              Or start a 2-min stretch now →
            </button>
          </div>
        </Card>

      {:else if progress.todayEnded}
        <!-- State B: Workday Finished -->
        <Card variant="elevated" padding="lg">
          <div class="day-ended-card-inner">
            <div class="day-ended-icon-wrap">
              <span class="material-symbols-outlined day-ended-icon">task_alt</span>
            </div>
            <h2 class="day-ended-title">Workday Complete! 🎉</h2>
            <p class="day-ended-desc">
              Great posture consistency today. You finished <strong>{progress.completedBreaksToday || 0} breaks</strong> and logged <strong>{progress.water || 0} water cups</strong>.
            </p>
            <div class="day-ended-actions">
              <Button variant="outline" size="md" icon="restart_alt" onclick={handleStartToday}>
                Resume Workday
              </Button>
              <Button variant="primary" size="md" icon="insights" onclick={() => navigateTo('statistics')}>
                View Daily Report
              </Button>
            </div>
          </div>
        </Card>

      {:else}
        <!-- State C: Workday Active -->
        <Card variant="hero" padding="lg">
          <div class="hero-card-inner">
            <div class="hero-status-row">
              <div class="hero-badge-pill active-pill">
                <span class="status-pulse-dot"></span>
                <span>Workday Active {workdayStartTimeFormatted ? `· Started ${workdayStartTimeFormatted}` : ''}</span>
              </div>
              <button type="button" class="end-day-btn" on:click={handleEndToday} title="End workday session">
                End Day
              </button>
            </div>

            <div class="hero-countdown">
              {isBreakDue ? 'Ready!' : `${nextBreak.inMin} min`}
            </div>
            <p class="hero-scheduled">Scheduled for {nextBreak.time || '03:45 PM'}</p>
            <div class="hero-cta-wrap">
              <Button variant="secondary" size="lg" icon="play_arrow" fullWidth onclick={() => navigateTo('break')}>
                Start Stretch
              </Button>
            </div>
          </div>
        </Card>
      {/if}
    </section>

    <!-- ── 3. OVERALL WELLNESS SCORE WIDGET ── -->
    <section class="wellness-section">
      <Card variant="elevated" padding="md">
        <div class="score-widget-top">
          <div class="score-header-info">
            <span class="score-label">Overall Wellness</span>
            <div class="score-number-row">
              <span class="score-big">{wellnessScore}</span>
              <span class="score-max">/ 100</span>
              <span class="score-tier tier-{scoreTier.key}">
                <span class="material-symbols-outlined tier-icon">{scoreTier.icon}</span>
                {scoreTier.label}
              </span>
            </div>
          </div>
          <button type="button" class="btn-summary-link" on:click={() => navigateTo('statistics')}>
            Report <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        <div class="rating-bar-track">
          <div class="rating-bar-fill fill-{scoreTier.key}" style="width: {wellnessScore}%"></div>
        </div>

        <!-- 4-Pillar Score Breakdown -->
        <div class="pillar-grid">
          <div class="pillar-item">
            <span class="pillar-title">Posture</span>
            <span class="pillar-val">90%</span>
            <span class="pillar-tag tag-good">Optimal</span>
          </div>
          <div class="pillar-item" class:item-focus={waterPercent < 60}>
            <span class="pillar-title">Hydration</span>
            <span class="pillar-val" class:val-focus={waterPercent < 60}>{waterPercent}%</span>
            <span class="pillar-tag" class:tag-focus={waterPercent < 60} class:tag-good={waterPercent >= 60}>
              {waterPercent < 60 ? 'Needs Focus' : 'Good'}
            </span>
          </div>
          <div class="pillar-item">
            <span class="pillar-title">Movement</span>
            <span class="pillar-val">85%</span>
            <span class="pillar-tag tag-good">Optimal</span>
          </div>
          <div class="pillar-item" class:item-focus={breakPercent < 60}>
            <span class="pillar-title">Breaks</span>
            <span class="pillar-val" class:val-focus={breakPercent < 60}>{breakPercent}%</span>
            <span class="pillar-tag" class:tag-focus={breakPercent < 60} class:tag-good={breakPercent >= 60}>
              {breakPercent < 60 ? 'Needs Focus' : 'Good'}
            </span>
          </div>
        </div>

        {#if focusAreas.length > 0}
          <div class="focus-callout">
            <span class="material-symbols-outlined focus-callout-icon">flag</span>
            <div class="focus-callout-text">
              <span class="focus-callout-title">Focus Target:</span>
              <span class="focus-callout-desc">Boost {focusAreas.join(' and ')} to elevate your wellness score.</span>
            </div>
          </div>
        {/if}
      </Card>
    </section>

    <!-- ── 4. DATA-DRIVEN AI COACH CARD ── -->
    <section class="ai-coach-section">
      <Card variant="ai" padding="md">
        <div class="ai-card-content">
          <div class="ai-badge-row">
            <span class="material-symbols-outlined ai-sparkle">psychology</span>
            <span class="ai-title-badge">AI Ergonomics Coach</span>
          </div>
          <h3 class="ai-insight-headline">
            {(progress.completedBreaksToday || 0) < 2 
              ? 'You skipped afternoon breaks. Neck strain risk is increasing.' 
              : 'Great posture consistency today! Keep momentum.'}
          </h3>
          <p class="ai-insight-body">
            Recommendation: Take a 2-minute upper back & shoulder stretch to release desk tension.
          </p>
          <div class="ai-btn-row">
            <Button variant="primary" size="sm" icon="play_arrow" onclick={() => navigateTo('break')}>
              Start Stretch
            </Button>
          </div>
        </div>
      </Card>
    </section>

    <!-- ── 5. DAILY ACTIVITY TIMELINE ── -->
    <section class="timeline-section">
      <Card variant="compact" padding="md">
        <h3 class="section-title">
          <span class="material-symbols-outlined">schedule</span>
          Today's Timeline
        </h3>
        <div class="timeline-feed">
          <div class="timeline-item">
            <div class="timeline-dot dot-start"></div>
            <div class="timeline-info">
              <span class="timeline-time">{user.workStart || '09:00 AM'}</span>
              <span class="timeline-text">Started Workday</span>
            </div>
          </div>
          {#if (progress.completedBreaksToday || 0) > 0}
            <div class="timeline-item">
              <div class="timeline-dot dot-break"></div>
              <div class="timeline-info">
                <span class="timeline-time">10:15 AM</span>
                <span class="timeline-text">Desk Stretch Completed ✓ (+50 XP)</span>
              </div>
            </div>
          {/if}
          {#if (progress.water || 0) > 0}
            <div class="timeline-item">
              <div class="timeline-dot dot-water"></div>
              <div class="timeline-info">
                <span class="timeline-time">11:30 AM</span>
                <span class="timeline-text">Hydration Glass Logged 💧 ({progress.water || 0} cups)</span>
              </div>
            </div>
          {/if}
          <div class="timeline-item">
            <div class="timeline-dot dot-lunch"></div>
            <div class="timeline-info">
              <span class="timeline-time">12:30 PM</span>
              <span class="timeline-text">Lunch Break Pause</span>
            </div>
          </div>
        </div>
      </Card>
    </section>

    <!-- ── 6. QUICK ACTIONS BAR ── -->
    <section class="quick-actions-bar">
      <button type="button" class="qa-pill qa-water" on:click={incrementWater}>
        <span class="material-symbols-outlined">water_drop</span>
        <span>+ Drink Water</span>
      </button>
      <button type="button" class="qa-pill qa-skip" on:click={() => navigateTo('break')}>
        <span class="material-symbols-outlined">skip_next</span>
        <span>Skip Break</span>
      </button>
      <button type="button" class="qa-pill qa-focus" on:click={() => focusMode = true}>
        <span class="material-symbols-outlined">filter_tilt_shift</span>
        <span>Focus Mode</span>
      </button>
    </section>

  {/if}

  <!-- Modals -->
  {#if isSummaryOpen}
    <WellnessSummaryModal isOpen={isSummaryOpen} onclose={() => isSummaryOpen = false} />
  {/if}

  {#if isNotificationCenterOpen}
    <NotificationCenterModal isOpen={isNotificationCenterOpen} onclose={() => isNotificationCenterOpen = false} />
  {/if}
</div>

<style>
  .home-screen {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 16px 16px 100px;
    max-width: 480px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
    min-width: 0;
  }

  /* Tablet Responsive Layout (768px - 1023px) */
  @media (min-width: 768px) and (max-width: 1023px) {
    .home-screen {
      max-width: 100%;
      padding: 20px 24px 100px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-areas:
        "header header"
        "hero wellness"
        "aicoach aicoach"
        "timeline quickactions";
      gap: 20px;
    }

    .top-header { grid-area: header; }
    .hero-section { grid-area: hero; }
    .wellness-section { grid-area: wellness; }
    .ai-coach-section { grid-area: aicoach; }
    .timeline-section { grid-area: timeline; }
    .quick-actions-bar { grid-area: quickactions; }

    .hero-card-inner {
      padding: 16px;
    }
  }

  /* Desktop Responsive Dashboard (>= 1024px) */
  @media (min-width: 1024px) {
    .top-header {
      display: none !important;
    }

    .home-screen {
      max-width: 1440px;
      margin: 0 auto;
      padding: 28px 32px;
      display: grid;
      grid-template-columns: minmax(0, 1.4fr) minmax(340px, 1fr);
      grid-template-areas:
        "hero wellness"
        "aicoach aicoach"
        "timeline quickactions";
      gap: 24px;
    }

    .hero-section { grid-area: hero; }
    .wellness-section { grid-area: wellness; }
    .ai-coach-section { grid-area: aicoach; }
    .timeline-section { grid-area: timeline; }
    .quick-actions-bar {
      grid-area: quickactions;
      flex-direction: column;
      justify-content: flex-start;
      gap: 12px;
    }

    .qa-pill {
      padding: 14px 16px;
      font-size: 0.9rem;
      justify-content: flex-start;
    }

    .hero-card-inner {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      text-align: left;
      padding: 16px 20px;
    }

    .hero-countdown {
      margin: 4px 0;
      font-size: 3.2rem;
    }

    .hero-cta-wrap {
      width: auto;
      min-width: 180px;
    }
  }

  /* Header */
  .top-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 8px;
  }
  .greeting-text {
    font-size: 1.35rem;
    font-weight: 800;
    margin: 0;
    color: var(--text-heading);
  }
  .greeting-subtext {
    font-size: 0.84rem;
    color: var(--text-muted);
    margin: 2px 0 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .bell-btn {
    position: relative;
    background: var(--surface-1);
    border: 1px solid var(--border-card);
    width: 42px;
    height: 42px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-heading);
    cursor: pointer;
    transition: all var(--anim-card);
  }
  .bell-btn:hover {
    border-color: var(--primary);
    transform: translateY(-2px);
  }
  .bell-badge {
    position: absolute;
    top: 5px;
    right: 5px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    background: var(--color-rose);
    color: #ffffff;
    border-radius: 99px;
    font-size: 0.65rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--surface-1);
    box-sizing: border-box;
    pointer-events: none;
  }

  .alerts-pill {
    background: var(--surface-1);
    border: 1px solid var(--border-card);
    width: 42px;
    height: 42px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary);
    cursor: pointer;
    transition: all var(--anim-card);
  }
  .alerts-pill:hover {
    border-color: var(--primary);
    transform: translateY(-2px);
  }
  .alerts-pill.muted {
    color: var(--text-muted);
  }

  /* Focus Mode Container & Actions */
  .focus-mode-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
  }
  .focus-ring-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 16px 8px;
  }
  .focus-timer-icon {
    font-size: 48px;
    margin-bottom: 8px;
  }
  .focus-timer-label {
    font-size: 1.6rem;
    font-weight: 800;
    margin: 0;
    color: #ffffff;
  }
  .focus-timer-sub {
    font-size: 0.9rem;
    opacity: 0.9;
    margin: 6px 0 0;
  }
  .focus-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }
  .focus-water-btn, .exit-focus-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    border-radius: var(--radius-md);
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    transition: all var(--anim-card);
    box-sizing: border-box;
  }
  .focus-water-btn {
    background: var(--surface-1);
    border: 1px solid var(--border-card);
    color: var(--color-calm);
  }
  .focus-water-btn:hover {
    border-color: var(--color-calm);
    transform: translateY(-2px);
  }
  .exit-focus-btn {
    background: rgba(244, 63, 94, 0.1);
    border: 1px solid rgba(244, 63, 94, 0.25);
    color: var(--color-rose);
  }
  .exit-focus-btn:hover {
    background: rgba(244, 63, 94, 0.2);
    transform: translateY(-2px);
  }

  /* Hero Section */
  .hero-card-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 8px 0;
  }
  .hero-badge-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 14px;
    border-radius: 99px;
    font-size: 0.82rem;
    font-weight: 700;
  }
  .hero-countdown {
    font-size: 2.8rem;
    font-weight: 900;
    margin: 12px 0 4px;
    letter-spacing: -0.03em;
  }
  .hero-scheduled {
    font-size: 0.88rem;
    opacity: 0.9;
    margin: 0 0 20px;
  }
  .hero-cta-wrap {
    width: 100%;
    max-width: 280px;
  }

  /* Start Today Hero Card */
  .start-today-card-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 8px 0;
  }
  .start-today-title {
    font-size: 1.8rem;
    font-weight: 900;
    margin: 14px 0 6px;
    letter-spacing: -0.02em;
    color: #ffffff;
  }
  .start-today-desc {
    font-size: 0.9rem;
    opacity: 0.92;
    margin: 0 0 16px;
    max-width: 320px;
    line-height: 1.4;
    color: #ffffff;
  }
  .targets-preview-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    width: 100%;
    margin-bottom: 20px;
  }
  .target-chip {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: var(--radius-sm);
    padding: 8px 4px;
    color: #ffffff;
  }
  .chip-icon {
    font-size: 20px;
    margin-bottom: 2px;
  }
  .chip-val {
    font-size: 1.1rem;
    font-weight: 800;
  }
  .chip-lbl {
    font-size: 0.68rem;
    font-weight: 600;
    opacity: 0.9;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .start-cta-wrap {
    width: 100%;
    max-width: 280px;
  }
  .quick-stretch-link {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.82rem;
    font-weight: 700;
    margin-top: 12px;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
    padding: 4px;
  }

  /* Day Ended Card */
  .day-ended-card-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 12px 8px;
  }
  .day-ended-icon-wrap {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--color-success-light);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }
  .day-ended-icon {
    font-size: 32px;
    color: var(--color-success);
  }
  .day-ended-title {
    font-size: 1.4rem;
    font-weight: 800;
    margin: 0 0 6px;
    color: var(--text-heading);
  }
  .day-ended-desc {
    font-size: 0.9rem;
    color: var(--text-muted);
    margin: 0 0 18px;
    line-height: 1.4;
    max-width: 320px;
  }
  .day-ended-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
  }

  /* Active Workday Status Row */
  .hero-status-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 8px;
    margin-bottom: 4px;
  }
  .hero-badge-pill.active-pill {
    background: rgba(255, 255, 255, 0.25);
  }
  .status-pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #34d399;
    box-shadow: 0 0 8px #34d399;
    animation: pulse-dot 1.5s infinite;
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.85); }
  }
  .end-day-btn {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: #ffffff;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 99px;
    cursor: pointer;
    transition: all var(--anim-card);
  }
  .end-day-btn:hover {
    background: rgba(244, 63, 94, 0.4);
    border-color: rgba(244, 63, 94, 0.6);
  }

  /* Wellness Score Widget */
  .score-widget-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .score-label {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }
  .score-number-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 2px;
    flex-wrap: wrap;
  }
  .score-big {
    font-size: 2.2rem;
    font-weight: 900;
    color: var(--text-heading);
    line-height: 1;
  }
  .score-max {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-muted);
    margin-right: 2px;
  }
  .score-tier {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 99px;
    font-size: 0.82rem;
    font-weight: 800;
    letter-spacing: -0.01em;
  }
  .score-tier .tier-icon {
    font-size: 15px;
  }
  .score-tier.tier-focus {
    background: var(--color-reminder-light);
    color: var(--color-reminder);
    border: 1px solid rgba(245, 158, 11, 0.35);
  }
  .score-tier.tier-good {
    background: var(--color-calm-light);
    color: var(--color-calm);
    border: 1px solid rgba(2, 132, 199, 0.35);
  }
  .score-tier.tier-excellent {
    background: var(--color-success-light);
    color: var(--color-success);
    border: 1px solid rgba(16, 185, 129, 0.35);
  }
  .btn-summary-link {
    background: none;
    border: none;
    color: var(--primary);
    font-size: 0.85rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 0;
  }

  .rating-bar-track {
    height: 10px;
    background: var(--surface-2);
    border-radius: 99px;
    overflow: hidden;
    margin-bottom: 16px;
  }
  .rating-bar-fill {
    height: 100%;
    border-radius: 99px;
    transition: width var(--anim-progress);
  }
  .rating-bar-fill.fill-focus {
    background: linear-gradient(90deg, var(--color-reminder) 0%, #f97316 100%);
  }
  .rating-bar-fill.fill-good {
    background: linear-gradient(90deg, var(--color-calm) 0%, var(--primary) 100%);
  }
  .rating-bar-fill.fill-excellent {
    background: linear-gradient(90deg, var(--color-success) 0%, var(--primary) 100%);
  }

  .pillar-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    text-align: center;
    background: var(--surface-2);
    padding: 10px;
    border-radius: var(--radius-md);
  }
  .pillar-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 4px;
    border-radius: var(--radius-sm);
    transition: all var(--anim-card);
  }
  .pillar-item.item-focus {
    background: rgba(245, 158, 11, 0.08);
    border: 1px solid rgba(245, 158, 11, 0.3);
  }
  .pillar-title {
    display: block;
    font-size: 0.72rem;
    color: var(--text-muted);
    font-weight: 600;
  }
  .pillar-val {
    display: block;
    font-size: 0.95rem;
    font-weight: 800;
    color: var(--text-heading);
    margin-top: 2px;
  }
  .pillar-val.val-focus {
    color: var(--color-reminder);
  }
  .pillar-tag {
    display: inline-block;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .pillar-tag.tag-good {
    background: var(--color-success-light);
    color: var(--color-success);
  }
  .pillar-tag.tag-focus {
    background: var(--color-reminder-light);
    color: var(--color-reminder);
  }

  .focus-callout {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
    padding: 9px 12px;
    border-radius: var(--radius-sm);
    background: var(--color-reminder-light);
    border: 1px solid rgba(245, 158, 11, 0.25);
  }
  .focus-callout-icon {
    font-size: 18px;
    color: var(--color-reminder);
    flex-shrink: 0;
  }
  .focus-callout-text {
    font-size: 0.8rem;
    color: var(--text-main);
    line-height: 1.35;
    text-align: left;
  }
  .focus-callout-title {
    font-weight: 800;
    color: var(--color-reminder);
    margin-right: 4px;
  }
  .focus-callout-desc {
    color: var(--text-heading);
    font-weight: 500;
  }

  /* AI Coach Card */
  .ai-card-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ai-badge-row {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--color-ai);
    font-weight: 800;
    font-size: 0.85rem;
  }
  .ai-insight-headline {
    font-size: 1rem;
    font-weight: 800;
    margin: 0;
    color: var(--text-heading);
  }
  .ai-insight-body {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin: 0;
  }
  .ai-btn-row {
    margin-top: 6px;
  }

  /* Timeline */
  .section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.95rem;
    font-weight: 800;
    margin: 0 0 14px;
    color: var(--text-heading);
  }
  .timeline-feed {
    display: flex;
    flex-direction: column;
    gap: 14px;
    position: relative;
    padding-left: 8px;
  }
  .timeline-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .timeline-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .dot-start { background: var(--text-muted); }
  .dot-break { background: var(--color-success); }
  .dot-water { background: var(--color-calm); }
  .dot-lunch { background: var(--color-reminder); }

  .timeline-info {
    display: flex;
    gap: 8px;
    font-size: 0.85rem;
  }
  .timeline-time {
    font-weight: 700;
    color: var(--text-muted);
    min-width: 60px;
  }
  .timeline-text {
    font-weight: 600;
    color: var(--text-heading);
  }

  /* Quick Actions Bar */
  .quick-actions-bar {
    display: flex;
    gap: 10px;
    justify-content: space-between;
  }
  .qa-pill {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 8px;
    background: var(--surface-1);
    border: 1px solid var(--border-card);
    border-radius: var(--radius-md);
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-heading);
    cursor: pointer;
    transition: all var(--anim-card);
  }
  .qa-pill:hover {
    transform: translateY(-2px);
    border-color: var(--primary);
  }
  .qa-water { color: var(--color-calm); }
  .qa-skip { color: var(--color-reminder); }
  .qa-focus { color: var(--color-ai); }

  .celebration-toast {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #0f172a;
    color: #ffffff;
    padding: 10px 20px;
    border-radius: 99px;
    font-size: 0.9rem;
    font-weight: 700;
    z-index: 10000;
    box-shadow: var(--shadow-lg);
  }
</style>
