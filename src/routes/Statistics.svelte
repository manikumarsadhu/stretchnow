<script>
  import Chart from '../components/Chart.svelte';
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  import { appStore } from '../stores/app.js';
  import { getMondayFirstDayIndex } from '../utils/date.js';
  import { calculateSittingHoursForDay } from '../utils/sitting.js';

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const todayIndex = getMondayFirstDayIndex();
  $: todayBreaks = $appStore.progress?.completedBreaksToday || 0;
  $: todayWater = $appStore.progress?.water || 0;
  $: breakGoal = $appStore.user?.dailyBreakGoal || 6;

  // Daily breaks array with live today overlay (future days are 0)
  $: rawDailyBreaks = $appStore.statistics?.dailyBreaks || [0, 0, 0, 0, 0, 0, 0];
  $: dailyBreaks = DAYS.map((_, idx) => {
    if (idx > todayIndex) return 0;
    if (idx === todayIndex) return Math.max(rawDailyBreaks[idx] || 0, todayBreaks);
    return rawDailyBreaks[idx] || 0;
  });

  // Daily water array with live today overlay (future days are 0)
  $: rawWater = $appStore.statistics?.waterIntake || [0, 0, 0, 0, 0, 0, 0];
  $: waterIntake = DAYS.map((_, idx) => {
    if (idx > todayIndex) return 0;
    if (idx === todayIndex) return Math.max(rawWater[idx] || 0, todayWater);
    return rawWater[idx] || 0;
  });

  // Weekly posture goal progress (% of daily break goal achieved)
  $: weeklyProgress = dailyBreaks.map((b, idx) => {
    if (idx > todayIndex) return 0;
    return Math.min(100, Math.round((b / breakGoal) * 100));
  });

  // Sedentary sitting time (calculated per workday minus active break time)
  $: sittingHours = DAYS.map((_, idx) => {
    return calculateSittingHoursForDay(
      $appStore.user,
      idx,
      dailyBreaks[idx] || 0,
      todayIndex,
      $appStore.settings?.smartSchedule?.weekendMode
    );
  });

  // Total breaks completed this week
  $: totalBreaksThisWeek = dailyBreaks.reduce((a, b) => a + b, 0);

  // Days elapsed so far in the current week (e.g. Mon=1 day, Tue=2 days, Wed=3 days)
  const elapsedDays = todayIndex + 1;

  // Avg daily water intake over elapsed days of this week
  $: totalWaterThisWeek = waterIntake.slice(0, elapsedDays).reduce((a, b) => a + b, 0);
  $: avgWater = elapsedDays > 0 ? (totalWaterThisWeek / elapsedDays).toFixed(1) : '0.0';

  // Break Consistency (% of elapsed days with at least 1 break)
  $: elapsedBreaks = dailyBreaks.slice(0, elapsedDays);
  $: activeDaysWithBreaks = elapsedBreaks.filter(b => b > 0).length;
  $: consistencyPercent = elapsedDays > 0 ? Math.round((activeDaysWithBreaks / elapsedDays) * 100) : 0;

  // Best and Worst stretching days (only evaluated across elapsed days)
  $: maxBreaks = Math.max(...elapsedBreaks);
  $: minBreaks = Math.min(...elapsedBreaks);

  $: bestDay = maxBreaks > 0 ? DAYS[elapsedBreaks.indexOf(maxBreaks)] : 'None yet';
  $: worstDay = maxBreaks === 0
    ? 'None yet'
    : (minBreaks === maxBreaks ? '—' : DAYS[elapsedBreaks.indexOf(minBreaks)]);

  // Average sitting hours over elapsed days
  $: elapsedSitting = sittingHours.slice(0, elapsedDays);
  $: totalSitting = elapsedSitting.reduce((a, b) => a + b, 0);
  $: daysWithSitting = elapsedSitting.filter(h => h > 0).length || 1;
  $: avgSitting = totalSitting > 0 ? (totalSitting / daysWithSitting).toFixed(1) : '0.0';

  function handlePrintPDF() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
</script>

<div class="stats-screen animate-fade-in">
  <div class="header-section">
    <div class="header">
      <h1 class="title">Personal Analytics</h1>
      <p class="subtitle">Track your break consistency & health trends.</p>
    </div>
    <div class="print-btn">
      <Button variant="outline" size="sm" icon="picture_as_pdf" onclick={handlePrintPDF}>
        Export PDF
      </Button>
    </div>
  </div>

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

  <!-- Monthly Summary Report Card -->
  <Card title="Monthly Wellness Summary" icon="insights" padding="md">
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

  <!-- Reusable Charts -->
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
  }

  .title {
    margin: 0;
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--text-heading);
    letter-spacing: -0.02em;
  }

  .subtitle {
    margin: 4px 0 0;
    font-size: 0.88rem;
    color: var(--text-muted);
  }

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

  .primary-light { background: var(--primary-light); }
  .primary-color { color: var(--primary); }
  .cyan-light { background: rgba(2, 132, 199, 0.12); }
  .cyan-color { color: #0284c7; }

  .sum-icon {
    font-size: 22px;
  }

  .sum-info {
    display: flex;
    flex-direction: column;
  }

  .sum-val {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--text-heading);
    line-height: 1.1;
  }

  .sum-lbl {
    font-size: 0.72rem;
    color: var(--text-muted);
    font-weight: 600;
    margin-top: 2px;
  }

  .charts-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .monthly-report-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    padding: 6px 0;
  }

  .report-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .report-label {
    font-size: 0.76rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .report-value {
    font-size: 1.15rem;
    font-weight: 800;
  }

  .text-amber { color: var(--amber); }
  .text-emerald { color: var(--emerald); }
  .text-primary { color: var(--primary); }
  .text-rose { color: var(--rose); }

  /* CSS print layout */
  @media print {
    :global(body) {
      background: #ffffff !important;
      color: #000000 !important;
    }
    :global(.app-shell) {
      background: #ffffff !important;
      color: #000000 !important;
      box-shadow: none !important;
    }
    .print-btn, :global(nav), :global(.bottom-nav) {
      display: none !important;
    }
    .stats-screen {
      padding: 0 !important;
      max-width: 100% !important;
      margin: 0 !important;
    }
    .charts-container {
      page-break-inside: avoid;
    }
  }
</style>

