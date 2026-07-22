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
    font-size: 0.76rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .stat-value {
    font-size: 1.45rem;
    font-weight: 800;
    color: var(--text-heading);
    line-height: 1.2;
  }

  .stat-subtitle {
    font-size: 0.76rem;
    color: var(--emerald);
    font-weight: 600;
  }
</style>
