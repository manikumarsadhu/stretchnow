<script>
  import Chart from '../components/Chart.svelte';
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  import { appStore } from '../stores/app.js';

  $: statistics = $appStore.statistics || {
    dailyBreaks: [3, 5, 4, 6, 5, 7, 4],
    weeklyProgress: [50, 70, 60, 85, 75, 100, 65],
    waterIntake: [5, 8, 6, 8, 7, 8, 6],
    sittingHours: [7.5, 8, 7, 8.5, 6.5, 5, 6]
  };

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  $: totalBreaksThisWeek = statistics.dailyBreaks.reduce((a, b) => a + b, 0);
  $: avgWater = (statistics.waterIntake.reduce((a, b) => a + b, 0) / 7).toFixed(1);

  // Advanced monthly report indicators
  $: maxBreaks = Math.max(...statistics.dailyBreaks);
  $: bestDayIndex = statistics.dailyBreaks.indexOf(maxBreaks);
  $: bestDay = bestDayIndex !== -1 ? DAYS[bestDayIndex] : 'N/A';
  
  $: minBreaks = Math.min(...statistics.dailyBreaks);
  $: worstDayIndex = statistics.dailyBreaks.indexOf(minBreaks);
  $: worstDay = worstDayIndex !== -1 ? DAYS[worstDayIndex] : 'N/A';
  
  $: avgSitting = (statistics.sittingHours.reduce((a, b) => a + b, 0) / 7).toFixed(1);
  $: consistencyCount = statistics.dailyBreaks.filter(b => b > 0).length;
  $: consistencyPercent = Math.round((consistencyCount / 7) * 100);

  function handlePrintPDF() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
</script>

<div class="stats-screen animate-fade-in">
  <div class="header-section">
    <div class="header">
      <h2 class="title">Personal Analytics</h2>
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
      data={statistics.dailyBreaks}
      color="#6366f1"
      chartType="bar"
      unit="breaks"
    />

    <Chart
      title="Weekly Posture Goal Progress"
      labels={DAYS}
      data={statistics.weeklyProgress}
      color="#10b981"
      chartType="line"
      unit="%"
    />

    <Chart
      title="Daily Water Intake"
      labels={DAYS}
      data={statistics.waterIntake}
      color="#0284c7"
      chartType="bar"
      unit="cups"
    />

    <Chart
      title="Sedentary Sitting Time"
      labels={DAYS}
      data={statistics.sittingHours}
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

