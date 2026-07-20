<script>
  import Card from './Card.svelte';

  export let title = '';
  export let value = '0';
  export let subtitle = '';
  export let icon = 'speed';
  export let iconBg = 'rgba(99, 102, 241, 0.12)';
  export let iconColor = '#6366f1';
</script>

<Card padding="sm">
  <div class="stat-card">
    <div class="stat-icon-wrapper" style="background: {iconBg}; color: {iconColor};">
      <span class="material-symbols-outlined">{icon}</span>
    </div>
    <div class="stat-info">
      <span class="stat-title">{title}</span>
      <div class="stat-value">{value}</div>
      {#if subtitle}
        <span class="stat-subtitle">{subtitle}</span>
      {/if}
    </div>
  </div>
</Card>

<style>
  .stat-card {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .stat-icon-wrapper {
    width: 46px;
    height: 46px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-icon-wrapper span {
    font-size: 24px;
  }

  .stat-info {
    display: flex;
    flex-direction: column;
  }

  .stat-title {
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--text, #6b7280);
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  .stat-value {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--text-h, #111827);
    line-height: 1.2;
  }

  .stat-subtitle {
    font-size: 0.75rem;
    color: #10b981;
    font-weight: 500;
  }
</style>
