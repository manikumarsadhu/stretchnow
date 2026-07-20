<script>
  import { onMount, onDestroy } from 'svelte';
  import Chart from 'chart.js/auto';

  export let title = '';
  export let labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  export let data = [0, 0, 0, 0, 0, 0, 0];
  export let color = '#6366f1';
  export let chartType = 'bar';
  export let unit = '';

  let canvasEl;
  let chartInstance = null;

  function renderChart() {
    if (!canvasEl) return;
    if (chartInstance) {
      chartInstance.destroy();
    }

    const ctx = canvasEl.getContext('2d');
    
    // Create soft gradient for line/bar charts
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, `${color}20`);

    chartInstance = new Chart(ctx, {
      type: chartType,
      data: {
        labels: labels,
        datasets: [
          {
            label: title,
            data: data,
            backgroundColor: chartType === 'line' ? gradient : `${color}cc`,
            borderColor: color,
            borderWidth: 2,
            borderRadius: chartType === 'bar' ? 8 : 0,
            tension: 0.35,
            fill: chartType === 'line'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.parsed.y} ${unit}`
            }
          }
        },
        scales: chartType !== 'doughnut' ? {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, color: '#94a3b8' }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(226, 232, 240, 0.5)' },
            ticks: { font: { size: 11 }, color: '#94a3b8' }
          }
        } : {}
      }
    });
  }

  onMount(() => {
    renderChart();
  });

  onDestroy(() => {
    if (chartInstance) {
      chartInstance.destroy();
    }
  });

  $: if (chartInstance && (data || labels || color)) {
    renderChart();
  }
</script>

<div class="chart-card">
  {#if title}
    <div class="chart-header">
      <h4 class="chart-title">{title}</h4>
    </div>
  {/if}
  <div class="chart-canvas-container">
    <canvas bind:this={canvasEl}></canvas>
  </div>
</div>

<style>
  .chart-card {
    background: var(--card-bg, rgba(255, 255, 255, 0.85));
    border: 1px solid var(--card-border, rgba(229, 231, 235, 0.8));
    border-radius: 20px;
    padding: 18px 20px;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    width: 100%;
    box-sizing: border-box;
  }

  .chart-header {
    margin-bottom: 12px;
  }

  .chart-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-h, #1f2937);
  }

  .chart-canvas-container {
    position: relative;
    height: 180px;
    width: 100%;
  }
</style>
