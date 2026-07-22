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

<div class="stats-screen animate-fade-in">
  <div class="header">
    <h2 class="title">Personal Analytics</h2>
    <p class="subtitle">Track your break consistency & health trends.</p>
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
</style>

