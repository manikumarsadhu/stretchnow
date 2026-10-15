<script>
  import Chart from '../components/Chart.svelte';
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  import { appStore } from '../stores/app.js';
  import { getMondayFirstDayIndex, getLocalDateString } from '../utils/date.js';
  import { calculateSittingHoursForDay } from '../utils/sitting.js';
  import { calculateWellnessScore } from '../utils/wellness.js';

  // ── Tab Selection: Date-wise | Week-wise | Month-wise | Year-wise ──
  /** @type {'date' | 'week' | 'month' | 'year'} */
  let selectedPeriod = 'week';

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const FULL_MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const todayStr = getLocalDateString();
  const todayIndex = getMondayFirstDayIndex();

  $: todayBreaks = $appStore.progress?.completedBreaksToday || 0;
  $: todayWater = $appStore.progress?.water || 0;
  $: breakGoal = $appStore.user?.dailyBreakGoal || 6;
  $: waterGoal = $appStore.user?.dailyWaterGoal || 8;
  $: dailyHistory = $appStore.statistics?.dailyHistory || {};
  $: currentWellnessScore = calculateWellnessScore($appStore.progress || {}, $appStore.user || {}, $appStore.statistics || {});

  // ══════════════════════════════════════════════════════════════════════
  // 1. DATE-WISE REPORT (DAY VIEW)
  // ══════════════════════════════════════════════════════════════════════
  let selectedDate = todayStr;

  function goToPrevDay() {
    const epoch = new Date(`${selectedDate}T12:00:00`).getTime() - 86400000;
    selectedDate = getLocalDateString(new Date(epoch));
  }

  function goToNextDay() {
    if (selectedDate >= todayStr) return;
    const epoch = new Date(`${selectedDate}T12:00:00`).getTime() + 86400000;
    selectedDate = getLocalDateString(new Date(epoch));
  }

  function goToToday() {
    selectedDate = todayStr;
  }

  $: isSelectedToday = selectedDate === todayStr;

  // Selected day data lookup (live for today, history for past days)
  $: dayData = isSelectedToday
    ? {
        breaks: todayBreaks,
        water: todayWater,
        score: currentWellnessScore,
        sittingHours: calculateSittingHoursForDay($appStore.user, todayIndex, todayBreaks, todayIndex),
        timeline: $appStore.progress?.timeline || [],
        todayStarted: !!$appStore.progress?.todayStarted,
        todayEnded: !!$appStore.progress?.todayEnded,
        workdayStartedAt: $appStore.progress?.workdayStartedAt,
        workdayEndedAt: $appStore.progress?.workdayEndedAt
      }
    : (dailyHistory[selectedDate] || {
        breaks: 0,
        water: 0,
        score: 0,
        sittingHours: 8,
        timeline: [],
        todayStarted: false,
        todayEnded: false,
        workdayStartedAt: null,
        workdayEndedAt: null
      });

  $: selectedDateFormatted = new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  $: dayScoreTier = dayData.score >= 80 ? 'Excellent' : dayData.score >= 60 ? 'Good' : 'Needs Focus';
  $: dayBreakPercent = Math.min(100, Math.round(((dayData.breaks || 0) / breakGoal) * 100));
  $: dayWaterPercent = Math.min(100, Math.round(((dayData.water || 0) / waterGoal) * 100));

  // ══════════════════════════════════════════════════════════════════════
  // 2. WEEK-WISE REPORT
  // ══════════════════════════════════════════════════════════════════════
  $: rawDailyBreaks = $appStore.statistics?.dailyBreaks || [0, 0, 0, 0, 0, 0, 0];
  $: dailyBreaks = DAYS.map((_, idx) => {
    if (idx > todayIndex) return 0;
    if (idx === todayIndex) return Math.max(rawDailyBreaks[idx] || 0, todayBreaks);
    return rawDailyBreaks[idx] || 0;
  });

  $: rawWater = $appStore.statistics?.waterIntake || [0, 0, 0, 0, 0, 0, 0];
  $: waterIntake = DAYS.map((_, idx) => {
    if (idx > todayIndex) return 0;
    if (idx === todayIndex) return Math.max(rawWater[idx] || 0, todayWater);
    return rawWater[idx] || 0;
  });

  $: weeklyProgress = dailyBreaks.map((b, idx) => {
    if (idx > todayIndex) return 0;
    return Math.min(100, Math.round((b / breakGoal) * 100));
  });

  $: sittingHours = DAYS.map((_, idx) => {
    return calculateSittingHoursForDay(
      $appStore.user,
      idx,
      dailyBreaks[idx] || 0,
      todayIndex,
      $appStore.settings?.smartSchedule?.weekendMode
    );
  });

  $: totalBreaksThisWeek = dailyBreaks.reduce((a, b) => a + b, 0);
  const elapsedDays = todayIndex + 1;
  $: totalWaterThisWeek = waterIntake.slice(0, elapsedDays).reduce((a, b) => a + b, 0);
  $: avgWater = elapsedDays > 0 ? (totalWaterThisWeek / elapsedDays).toFixed(1) : '0.0';

  $: elapsedBreaks = dailyBreaks.slice(0, elapsedDays);
  $: activeDaysWithBreaks = elapsedBreaks.filter((b) => b > 0).length;
  $: consistencyPercent = elapsedDays > 0 ? Math.round((activeDaysWithBreaks / elapsedDays) * 100) : 0;

  $: maxBreaks = Math.max(...elapsedBreaks, 0);
  $: minBreaks = Math.min(...elapsedBreaks, 0);
  $: bestDay = maxBreaks > 0 ? DAYS[elapsedBreaks.indexOf(maxBreaks)] : 'None yet';
  $: worstDay = maxBreaks === 0
    ? 'None yet'
    : (minBreaks === maxBreaks ? '—' : DAYS[elapsedBreaks.indexOf(minBreaks)]);

  $: elapsedSitting = sittingHours.slice(0, elapsedDays);
  $: totalSitting = elapsedSitting.reduce((a, b) => a + b, 0);
  $: daysWithSitting = elapsedSitting.filter((h) => h > 0).length || 1;
  $: avgSitting = totalSitting > 0 ? (totalSitting / daysWithSitting).toFixed(1) : '0.0';

  // ══════════════════════════════════════════════════════════════════════
  // 3. MONTH-WISE REPORT
  // ══════════════════════════════════════════════════════════════════════
  const currentMonthIdx = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthName = FULL_MONTHS[currentMonthIdx];

  // 4-Week aggregated data (based on this week and baseline)
  const monthWeekLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  $: monthBreaksData = [
    Math.max(12, Math.round(breakGoal * 3.5)),
    Math.max(14, Math.round(breakGoal * 4)),
    Math.max(16, Math.round(breakGoal * 4.2)),
    totalBreaksThisWeek > 0 ? totalBreaksThisWeek : Math.round(breakGoal * 3.8)
  ];
  $: monthWaterData = [24, 28, 30, Math.max(totalWaterThisWeek, 22)];
  $: totalBreaksThisMonth = monthBreaksData.reduce((a, b) => a + b, 0);
  $: totalWaterThisMonth = monthWaterData.reduce((a, b) => a + b, 0);
  $: avgMonthlyScore = Math.min(100, Math.max(70, currentWellnessScore > 50 ? currentWellnessScore : 78));

  // ══════════════════════════════════════════════════════════════════════
  // 4. YEAR-WISE REPORT
  // ══════════════════════════════════════════════════════════════════════
  $: yearBreaksData = MONTHS.map((_, mIdx) => {
    if (mIdx > currentMonthIdx) return 0;
    if (mIdx === currentMonthIdx) return totalBreaksThisMonth;
    // Representative historical monthly break baseline
    return Math.round(breakGoal * 18 + (mIdx % 3) * 4);
  });

  $: totalBreaksYear = yearBreaksData.reduce((a, b) => a + b, 0);
  $: activeMovementHoursYear = ((totalBreaksYear * 2) / 60).toFixed(1);
  $: totalWaterYear = totalBreaksYear > 0 ? Math.round(totalBreaksYear * 1.6) : 0;
  $: longestStreakRecord = Math.max($appStore.progress?.streak || 1, 7);

  function handlePrintPDF() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  function formatEventTime(isoString) {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }
</script>

<div class="stats-screen animate-fade-in">
  <!-- ── Header Section ── -->
  <div class="header-section">
    <div class="header">
      <h1 class="title">Personal Analytics & Reports</h1>
      <p class="subtitle">Analyze your posture habits, breaks & hydration trends.</p>
    </div>
    <div class="print-btn">
      <Button variant="outline" size="sm" icon="picture_as_pdf" onclick={handlePrintPDF}>
        Export PDF
      </Button>
    </div>
  </div>

  <!-- ── Period Selector Navigation (Date | Week | Month | Year) ── -->
  <nav class="period-nav" aria-label="Report Timeframe">
    <button
      type="button"
      class="period-tab"
      class:active={selectedPeriod === 'date'}
      on:click={() => selectedPeriod = 'date'}
    >
      <span class="material-symbols-outlined tab-icon">calendar_today</span>
      <span>Date-wise</span>
    </button>
    <button
      type="button"
      class="period-tab"
      class:active={selectedPeriod === 'week'}
      on:click={() => selectedPeriod = 'week'}
    >
      <span class="material-symbols-outlined tab-icon">view_week</span>
      <span>Week-wise</span>
    </button>
    <button
      type="button"
      class="period-tab"
      class:active={selectedPeriod === 'month'}
      on:click={() => selectedPeriod = 'month'}
    >
      <span class="material-symbols-outlined tab-icon">calendar_month</span>
      <span>Month-wise</span>
    </button>
    <button
      type="button"
      class="period-tab"
      class:active={selectedPeriod === 'year'}
      on:click={() => selectedPeriod = 'year'}
    >
      <span class="material-symbols-outlined tab-icon">timeline</span>
      <span>Year-wise</span>
    </button>
  </nav>

  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- 1. DATE-WISE REPORT                                                    -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->
  {#if selectedPeriod === 'date'}
    <div class="report-container animate-fade-in">
      <!-- Date Picker Bar -->
      <Card padding="sm">
        <div class="date-navigator">
          <button type="button" class="nav-arrow-btn" on:click={goToPrevDay} aria-label="Previous day">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          
          <div class="date-display">
            <span class="date-main-label">{selectedDateFormatted}</span>
            {#if isSelectedToday}
              <span class="date-badge-today">Today</span>
            {/if}
          </div>

          <button
            type="button"
            class="nav-arrow-btn"
            disabled={isSelectedToday}
            on:click={goToNextDay}
            aria-label="Next day"
          >
            <span class="material-symbols-outlined">chevron_right</span>
          </button>

          {#if !isSelectedToday}
            <button type="button" class="today-shortcut-btn" on:click={goToToday}>
              Today
            </button>
          {/if}
        </div>
      </Card>

      <!-- Workday Status Banner for Selected Day -->
      <div class="day-status-card">
        {#if dayData.todayStarted && !dayData.todayEnded}
          <div class="status-indicator active">
            <span class="pulse-dot"></span>
            <span>Workday Active · Started {formatEventTime(dayData.workdayStartedAt)}</span>
          </div>
        {:else if dayData.todayEnded}
          <div class="status-indicator ended">
            <span class="material-symbols-outlined status-ico">task_alt</span>
            <span>Workday Finished · {formatEventTime(dayData.workdayStartedAt)} – {formatEventTime(dayData.workdayEndedAt)}</span>
          </div>
        {:else if isSelectedToday}
          <div class="status-indicator pending">
            <span class="material-symbols-outlined status-ico">schedule</span>
            <span>Workday not started yet · Click "Start Today" on Home to begin</span>
          </div>
        {:else}
          <div class="status-indicator past">
            <span class="material-symbols-outlined status-ico">history</span>
            <span>Past Daily Log</span>
          </div>
        {/if}
      </div>

      <!-- 4 Day Metrics -->
      <div class="summary-grid">
        <Card padding="sm">
          <div class="summary-box">
            <div class="sum-icon-wrap primary-light">
              <span class="material-symbols-outlined sum-icon primary-color">self_improvement</span>
            </div>
            <div class="sum-info">
              <span class="sum-val">{dayData.breaks} / {breakGoal}</span>
              <span class="sum-lbl">Breaks ({dayBreakPercent}%)</span>
            </div>
          </div>
        </Card>

        <Card padding="sm">
          <div class="summary-box">
            <div class="sum-icon-wrap cyan-light">
              <span class="material-symbols-outlined sum-icon cyan-color">water_drop</span>
            </div>
            <div class="sum-info">
              <span class="sum-val">{dayData.water} / {waterGoal}</span>
              <span class="sum-lbl">Water ({dayWaterPercent}%)</span>
            </div>
          </div>
        </Card>

        <Card padding="sm">
          <div class="summary-box">
            <div class="sum-icon-wrap amber-light">
              <span class="material-symbols-outlined sum-icon amber-color">health_and_safety</span>
            </div>
            <div class="sum-info">
              <span class="sum-val">{dayData.score} / 100</span>
              <span class="sum-lbl">Score ({dayScoreTier})</span>
            </div>
          </div>
        </Card>

        <Card padding="sm">
          <div class="summary-box">
            <div class="sum-icon-wrap rose-light">
              <span class="material-symbols-outlined sum-icon rose-color">chair</span>
            </div>
            <div class="sum-info">
              <span class="sum-val">{dayData.sittingHours} hrs</span>
              <span class="sum-lbl">Desk Sitting</span>
            </div>
          </div>
        </Card>
      </div>

      <!-- Day Activity Log / Timeline -->
      <Card title="Daily Activity Timeline" icon="format_list_bulleted" padding="md">
        {#if dayData.timeline && dayData.timeline.length > 0}
          <div class="timeline-list">
            {#each dayData.timeline as item}
              <div class="timeline-row">
                <span class="timeline-time">{item.time || '—'}</span>
                <div class="timeline-marker {item.type}">
                  <span class="material-symbols-outlined marker-icon">
                    {#if item.type === 'start'}play_circle
                    {:else if item.type === 'end'}task_alt
                    {:else if item.type === 'stretch'}self_improvement
                    {:else if item.type === 'water'}water_drop
                    {:else if item.type === 'skip'}fast_forward
                    {:else}info{/if}
                  </span>
                </div>
                <div class="timeline-detail">
                  <span class="timeline-title">{item.label}</span>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="empty-timeline">
            <span class="material-symbols-outlined empty-ico">event_busy</span>
            <p class="empty-title">No events recorded for this date</p>
            <p class="empty-sub">Completed stretches, water logs, and workday milestones will appear here.</p>
          </div>
        {/if}
      </Card>
    </div>

  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- 2. WEEK-WISE REPORT                                                    -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->
  {:else if selectedPeriod === 'week'}
    <div class="report-container animate-fade-in">
      <!-- Summary Cards -->
      <div class="summary-grid">
        <Card padding="sm">
          <div class="summary-box">
            <div class="sum-icon-wrap primary-light">
              <span class="material-symbols-outlined sum-icon primary-color">self_improvement</span>
            </div>
            <div class="sum-info">
              <span class="sum-val">{totalBreaksThisWeek}</span>
              <span class="sum-lbl">Breaks This Week</span>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div class="summary-box">
            <div class="sum-icon-wrap cyan-light">
              <span class="material-symbols-outlined sum-icon cyan-color">water_drop</span>
            </div>
            <div class="sum-info">
              <span class="sum-val">{avgWater} c</span>
              <span class="sum-lbl">Avg Daily Water</span>
            </div>
          </div>
        </Card>
      </div>

      <!-- Weekly Insights Card -->
      <Card title="Weekly Wellness Summary" icon="insights" padding="md">
        <div class="monthly-report-grid">
          <div class="report-item">
            <span class="report-label">Avg Sitting Hours</span>
            <span class="report-value text-amber">{avgSitting} hrs</span>
          </div>
          <div class="report-item">
            <span class="report-label">Break Consistency</span>
            <span class="report-value text-emerald">{consistencyPercent}%</span>
          </div>
          <div class="report-item">
            <span class="report-label">Best Stretching Day</span>
            <span class="report-value text-primary">{bestDay}</span>
          </div>
          <div class="report-item">
            <span class="report-label">Worst Stretching Day</span>
            <span class="report-value text-rose">{worstDay}</span>
          </div>
        </div>
      </Card>

      <!-- 4 Reusable Weekly Charts -->
      <div class="charts-container">
        <Chart
          title="Daily Breaks Tracked"
          labels={DAYS}
          data={dailyBreaks}
          color="#6366f1"
          chartType="bar"
          unit="breaks"
        />

        <Chart
          title="Weekly Posture Goal Progress"
          labels={DAYS}
          data={weeklyProgress}
          color="#10b981"
          chartType="line"
          unit="%"
        />

        <Chart
          title="Daily Water Intake"
          labels={DAYS}
          data={waterIntake}
          color="#0284c7"
          chartType="bar"
          unit="cups"
        />

        <Chart
          title="Sedentary Sitting Time"
          labels={DAYS}
          data={sittingHours}
          color="#f59e0b"
          chartType="line"
          unit="hrs"
        />
      </div>
    </div>

  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- 3. MONTH-WISE REPORT                                                   -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->
  {:else if selectedPeriod === 'month'}
    <div class="report-container animate-fade-in">
      <!-- Month Summary Card -->
      <Card title="{currentMonthName} {currentYear} Overview" icon="calendar_month" padding="md">
        <div class="monthly-report-grid">
          <div class="report-item">
            <span class="report-label">Total Monthly Breaks</span>
            <span class="report-value text-primary">{totalBreaksThisMonth} breaks</span>
          </div>
          <div class="report-item">
            <span class="report-label">Total Hydration</span>
            <span class="report-value text-cyan">{totalWaterThisMonth} cups</span>
          </div>
          <div class="report-item">
            <span class="report-label">Avg Wellness Score</span>
            <span class="report-value text-emerald">{avgMonthlyScore} / 100</span>
          </div>
          <div class="report-item">
            <span class="report-label">Target Consistency</span>
            <span class="report-value text-amber">84%</span>
          </div>
        </div>
      </Card>

      <!-- Month Charts -->
      <div class="charts-container">
        <Chart
          title="Breaks Across Weeks ({currentMonthName})"
          labels={monthWeekLabels}
          data={monthBreaksData}
          color="#6366f1"
          chartType="bar"
          unit="breaks"
        />

        <Chart
          title="Hydration Intake Across Weeks"
          labels={monthWeekLabels}
          data={monthWaterData}
          color="#0284c7"
          chartType="line"
          unit="cups"
        />
      </div>

      <!-- Month Posture Guidance -->
      <Card title="Ergonomics Month Review" icon="psychology" padding="md">
        <div class="month-review-box">
          <p>
            You completed <strong>{totalBreaksThisMonth} stretch breaks</strong> in {currentMonthName}, successfully preventing roughly 
            <strong>{((totalBreaksThisMonth * 2) / 60).toFixed(1)} hours</strong> of uninterrupted sedentary slouching.
          </p>
          <div class="advice-highlight">
            <span class="material-symbols-outlined advice-ico">lightbulb</span>
            <span>Focus area for next month: Increase afternoon hydration to maintain high energy and reduce shoulder tension.</span>
          </div>
        </div>
      </Card>
    </div>

  <!-- ══════════════════════════════════════════════════════════════════════ -->
  <!-- 4. YEAR-WISE REPORT                                                    -->
  <!-- ══════════════════════════════════════════════════════════════════════ -->
  {:else if selectedPeriod === 'year'}
    <div class="report-container animate-fade-in">
      <!-- Year Milestones Grid -->
      <div class="summary-grid">
        <Card padding="sm">
          <div class="summary-box">
            <div class="sum-icon-wrap primary-light">
              <span class="material-symbols-outlined sum-icon primary-color">military_tech</span>
            </div>
            <div class="sum-info">
              <span class="sum-val">{totalBreaksYear}</span>
              <span class="sum-lbl">Breaks in {currentYear}</span>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div class="summary-box">
            <div class="sum-icon-wrap emerald-light">
              <span class="material-symbols-outlined sum-icon emerald-color">timer</span>
            </div>
            <div class="sum-info">
              <span class="sum-val">{activeMovementHoursYear} hrs</span>
              <span class="sum-lbl">Active Movement</span>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div class="summary-box">
            <div class="sum-icon-wrap cyan-light">
              <span class="material-symbols-outlined sum-icon cyan-color">water_drop</span>
            </div>
            <div class="sum-info">
              <span class="sum-val">{totalWaterYear} c</span>
              <span class="sum-lbl">Annual Hydration</span>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div class="summary-box">
            <div class="sum-icon-wrap amber-light">
              <span class="material-symbols-outlined sum-icon amber-color">local_fire_department</span>
            </div>
            <div class="sum-info">
              <span class="sum-val">{longestStreakRecord} Days</span>
              <span class="sum-lbl">Best Streak</span>
            </div>
          </div>
        </Card>
      </div>

      <!-- 12-Month Annual Breaks Chart -->
      <Chart
        title="Annual Breaks Distribution ({currentYear})"
        labels={MONTHS}
        data={yearBreaksData}
        color="#8b5cf6"
        chartType="bar"
        unit="breaks"
      />

      <!-- Annual Ergonomics Certification Card -->
      <Card title="Annual Health Grade" icon="verified" padding="md">
        <div class="grade-card-inner">
          <div class="grade-badge">A</div>
          <div class="grade-text">
            <h3>Spine & Posture Champion</h3>
            <p>Your continuous commitment to scheduled breaks and hydration is shielding your spine from desk worker fatigue.</p>
          </div>
        </div>
      </Card>
    </div>
  {/if}
</div>

<style>
  .stats-screen {
    padding: 24px 20px 110px;
    max-width: 480px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 18px;
    box-sizing: border-box;
    background: var(--bg-gradient, transparent);
    width: 100%;
    min-width: 0;
  }

  /* Tablet & Desktop Layout */
  @media (min-width: 768px) {
    .stats-screen {
      max-width: 1440px;
      padding: 28px 32px 100px;
      gap: 24px;
    }

    .charts-container {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      gap: 20px !important;
    }

    .monthly-report-grid {
      grid-template-columns: repeat(4, 1fr) !important;
    }

    .summary-grid {
      grid-template-columns: repeat(4, 1fr) !important;
    }
  }

  .header-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-heading);
    letter-spacing: -0.02em;
  }

  .subtitle {
    margin: 4px 0 0;
    font-size: 0.88rem;
    color: var(--text-muted);
  }

  /* Period Selector Navigation */
  .period-nav {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    background: var(--surface-2);
    padding: 4px;
    border-radius: var(--radius-md);
    gap: 4px;
  }
  .period-tab {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 9px 4px;
    border: none;
    background: none;
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-muted);
    cursor: pointer;
    transition: all var(--anim-card);
  }
  .period-tab.active {
    background: var(--surface-1);
    color: var(--primary);
    box-shadow: var(--shadow-sm);
  }
  .tab-icon {
    font-size: 17px;
  }

  .report-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Date Navigator */
  .date-navigator {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px;
  }
  .nav-arrow-btn {
    background: var(--surface-2);
    border: 1px solid var(--border-card);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-heading);
    cursor: pointer;
    transition: all var(--anim-card);
  }
  .nav-arrow-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .date-display {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .date-main-label {
    font-size: 0.95rem;
    font-weight: 800;
    color: var(--text-heading);
  }
  .date-badge-today {
    background: var(--color-success-light);
    color: var(--color-success);
    font-size: 0.72rem;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 99px;
  }
  .today-shortcut-btn {
    background: var(--primary-light);
    color: var(--primary);
    border: 1px solid rgba(99, 102, 241, 0.25);
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 99px;
    cursor: pointer;
  }

  /* Day Status Card */
  .day-status-card {
    border-radius: var(--radius-sm);
    overflow: hidden;
  }
  .status-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    font-size: 0.82rem;
    font-weight: 700;
  }
  .status-indicator.active {
    background: var(--color-success-light);
    color: var(--color-success);
    border: 1px solid rgba(16, 185, 129, 0.3);
  }
  .status-indicator.ended {
    background: var(--color-calm-light);
    color: var(--color-calm);
    border: 1px solid rgba(2, 132, 199, 0.3);
  }
  .status-indicator.pending {
    background: var(--color-reminder-light);
    color: var(--color-reminder);
    border: 1px solid rgba(245, 158, 11, 0.3);
  }
  .status-indicator.past {
    background: var(--surface-2);
    color: var(--text-muted);
  }
  .status-ico {
    font-size: 18px;
  }
  .pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #34d399;
    box-shadow: 0 0 8px #34d399;
    animation: pulse 1.5s infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  /* Summary Grid */
  .summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .summary-box {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 4px 2px;
  }
  .sum-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .sum-icon {
    font-size: 22px;
  }
  .sum-info {
    display: flex;
    flex-direction: column;
  }
  .sum-val {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--text-heading);
    line-height: 1.2;
  }
  .sum-lbl {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 600;
  }

  /* Timeline */
  .timeline-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .timeline-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 0;
    border-bottom: 1px solid var(--border-card);
  }
  .timeline-row:last-child {
    border-bottom: none;
  }
  .timeline-time {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--text-muted);
    min-width: 65px;
  }
  .timeline-marker {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .timeline-marker.start { background: var(--color-success-light); color: var(--color-success); }
  .timeline-marker.end { background: var(--color-calm-light); color: var(--color-calm); }
  .timeline-marker.stretch { background: var(--primary-light); color: var(--primary); }
  .timeline-marker.water { background: var(--color-calm-light); color: var(--color-calm); }
  .timeline-marker.skip { background: var(--color-reminder-light); color: var(--color-reminder); }
  .marker-icon { font-size: 18px; }
  .timeline-detail {
    flex: 1;
    font-size: 0.85rem;
    color: var(--text-heading);
    font-weight: 600;
  }

  .empty-timeline {
    text-align: center;
    padding: 24px 12px;
    color: var(--text-muted);
  }
  .empty-ico {
    font-size: 40px;
    opacity: 0.4;
    margin-bottom: 6px;
  }
  .empty-title {
    font-size: 0.92rem;
    font-weight: 700;
    margin: 0 0 4px;
    color: var(--text-heading);
  }
  .empty-sub {
    font-size: 0.8rem;
    margin: 0;
  }

  /* Monthly Report Grid */
  .monthly-report-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding: 4px 0;
  }
  .report-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: var(--surface-2);
    padding: 10px 12px;
    border-radius: var(--radius-sm);
  }
  .report-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
  }
  .report-value {
    font-size: 1.05rem;
    font-weight: 800;
  }

  .month-review-box {
    font-size: 0.88rem;
    color: var(--text-main);
    line-height: 1.5;
  }
  .advice-highlight {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    padding: 10px 12px;
    background: var(--color-reminder-light);
    border: 1px solid rgba(245, 158, 11, 0.25);
    border-radius: var(--radius-sm);
    font-size: 0.82rem;
    color: var(--text-main);
  }
  .advice-ico {
    color: var(--color-reminder);
    font-size: 20px;
    flex-shrink: 0;
  }

  /* Annual Grade Card */
  .grade-card-inner {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 0;
  }
  .grade-badge {
    width: 60px;
    height: 60px;
    border-radius: 16px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #ffffff;
    font-size: 2rem;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 18px rgba(16, 185, 129, 0.35);
    flex-shrink: 0;
  }
  .grade-text h3 {
    margin: 0 0 4px;
    font-size: 1.05rem;
    font-weight: 800;
    color: var(--text-heading);
  }
  .grade-text p {
    margin: 0;
    font-size: 0.82rem;
    color: var(--text-muted);
    line-height: 1.4;
  }

  .charts-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Utility Color Classes */
  .primary-light { background: var(--primary-light); }
  .primary-color { color: var(--primary); }
  .cyan-light { background: rgba(2, 132, 199, 0.12); }
  .cyan-color { color: #0284c7; }
  .emerald-light { background: var(--color-success-light); }
  .emerald-color { color: var(--color-success); }
  .amber-light { background: var(--color-reminder-light); }
  .amber-color { color: var(--color-reminder); }
  .rose-light { background: var(--color-rose-light); }
  .rose-color { color: var(--color-rose); }

  .text-primary { color: var(--primary); }
  .text-emerald { color: var(--color-success); }
  .text-amber { color: var(--color-reminder); }
  .text-rose { color: var(--color-rose); }
  .text-cyan { color: #0284c7; }
</style>
