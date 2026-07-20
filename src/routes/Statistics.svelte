<script>
  import Chart from '../components/Chart.svelte';
  import Card from '../components/Card.svelte';
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
</script>

<div class="stats-screen">
  <div class="header">
    <h2 class="title">Personal Analytics</h2>
    <p class="subtitle">Track your break consistency & health trends.</p>
  </div>

  <!-- Summary Cards -->
  <div class="summary-grid">
    <Card padding="sm">
      <div class="summary-box">
        <span class="sum-val">{totalBreaksThisWeek}</span>
        <span class="sum-lbl">Total Breaks This Week</span>
      </div>
    </Card>
    <Card padding="sm">
      <div class="summary-box">
        <span class="sum-val">{avgWater} c</span>
        <span class="sum-lbl">Avg Water Intake</span>
      </div>
    </Card>
  </div>

  <!-- 4 Reusable Charts -->
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
      color="#3b82f6"
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
    padding: 24px 20px 100px;
    max-width: 480px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 18px;
    box-sizing: border-box;
  }

  .title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-h, #1f2937);
  }

  .subtitle {
    margin: 4px 0 0;
    font-size: 0.85rem;
    color: var(--text, #6b7280);
  }

  .summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .summary-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6px 0;
  }

  .sum-val {
    font-size: 1.4rem;
    font-weight: 800;
    color: #6366f1;
  }

  .sum-lbl {
    font-size: 0.72rem;
    color: var(--text, #6b7280);
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.3px;
  }

  .charts-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
</style>
