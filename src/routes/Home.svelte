<script>
  import { onMount, onDestroy } from 'svelte';
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  import WellnessSummaryModal from '../components/WellnessSummaryModal.svelte';
  import NotificationCenterModal from '../components/NotificationCenterModal.svelte';
  import { appStore, navigateTo, incrementWater } from '../stores/app.js';
  import { calculateWellnessScore, calculateWaterPercentage, calculateBreakGoalPercentage } from '../utils/wellness.js';
  import { triggerConfetti } from '../utils/confetti.js';

  $: user       = $appStore.user     || {};
  $: progress   = $appStore.progress || {};
  $: statistics = $appStore.statistics || {};
  $: settings   = $appStore.settings  || {};

  $: wellnessScore = calculateWellnessScore(progress, user, statistics);
  $: waterPercent  = calculateWaterPercentage(progress.water, user.dailyWaterGoal);
  $: breakPercent  = calculateBreakGoalPercentage(progress.completedBreaksToday, user.dailyBreakGoal);

  // Dynamic Greeting
  const currentHour = new Date().getHours();
  const greetingTime = currentHour < 12 ? 'Good Morning' : currentHour < 18 ? 'Good Afternoon' : 'Good Evening';
  $: streakDays = progress.streak || 7;
  $: dynamicStreakSubtext = streakDays > 1 
    ? `🔥 You're on a ${streakDays}-day streak! Let's keep it going.` 
    : `🔥 Start your posture streak today with a 2-minute break!`;

  // Focus Mode, Summary & Notification Center
  let focusMode = false;
  let isSummaryOpen = false;
  let isNotificationCenterOpen = false;
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
      <h1 class="greeting-text">{greetingTime}, {user.name || 'Mani'} 👋</h1>
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
        <span class="bell-badge"></span>
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

    <!-- ── 2. HERO NEXT BREAK CARD ── -->
    <section class="hero-section">
      <Card variant="hero" padding="lg">
        <div class="hero-card-inner">
          <div class="hero-badge-pill">
            <span class="material-symbols-outlined">alarm</span>
            <span>{isBreakDue ? 'Break Ready Now!' : 'Next Break'}</span>
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
    </section>

    <!-- ── 3. OVERALL WELLNESS SCORE WIDGET ── -->
    <section class="wellness-section">
      <Card variant="elevated" padding="md">
        <div class="score-widget-top">
          <div class="score-header-info">
            <span class="score-label">Overall Wellness</span>
            <div class="score-number-row">
              <span class="score-big">{wellnessScore}</span>
              <span class="score-tier">{wellnessScore >= 80 ? 'Excellent' : wellnessScore >= 60 ? 'Good' : 'Needs Focus'}</span>
            </div>
          </div>
          <button type="button" class="btn-summary-link" on:click={() => isSummaryOpen = true}>
            Report <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        <div class="rating-bar-track">
          <div class="rating-bar-fill" style="width: {wellnessScore}%"></div>
        </div>

        <!-- 4-Pillar Score Breakdown -->
        <div class="pillar-grid">
          <div class="pillar-item">
            <span class="pillar-title">Posture</span>
            <span class="pillar-val">90%</span>
          </div>
          <div class="pillar-item">
            <span class="pillar-title">Hydration</span>
            <span class="pillar-val">{waterPercent}%</span>
          </div>
          <div class="pillar-item">
            <span class="pillar-title">Movement</span>
            <span class="pillar-val">85%</span>
          </div>
          <div class="pillar-item">
            <span class="pillar-title">Breaks</span>
            <span class="pillar-val">{breakPercent}%</span>
          </div>
        </div>
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
    top: 9px;
    right: 9px;
    width: 8px;
    height: 8px;
    background: var(--color-rose);
    border-radius: 50%;
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
    align-items: baseline;
    gap: 8px;
    margin-top: 2px;
  }
  .score-big {
    font-size: 2.2rem;
    font-weight: 900;
    color: var(--text-heading);
  }
  .score-tier {
    font-size: 0.92rem;
    font-weight: 800;
    color: var(--color-success);
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
    background: linear-gradient(90deg, var(--color-success) 0%, var(--primary) 100%);
    border-radius: 99px;
    transition: width var(--anim-progress);
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
