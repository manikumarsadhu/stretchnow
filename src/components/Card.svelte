<script>
  export let title = '';
  export let subtitle = '';
  export let icon = '';
  export let hover = false;
  export let padding = 'md'; // 'sm' | 'md' | 'lg'
</script>

<div class="card p-{padding} {hover ? 'card-hover' : ''}">
  {#if title || icon}
    <div class="card-header">
      {#if icon}
        <span class="material-symbols-outlined card-icon">{icon}</span>
      {/if}
      <div class="card-titles">
        {#if title}
          <h3 class="card-title">{title}</h3>
        {/if}
        {#if subtitle}
          <p class="card-subtitle">{subtitle}</p>
        {/if}
      </div>
    </div>
  {/if}

  <div class="card-content">
    <slot />
  </div>
</div>

<style>
  .card {
    background: var(--card-bg, rgba(255, 255, 255, 0.85));
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--card-border, rgba(229, 231, 235, 0.8));
    border-radius: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-sizing: border-box;
    overflow: hidden;
  }

  .card-hover:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(99, 102, 241, 0.12);
    border-color: rgba(99, 102, 241, 0.3);
  }

  .p-sm { padding: 12px 16px; }
  .p-md { padding: 20px; }
  .p-lg { padding: 28px; }

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
  }

  .card-icon {
    font-size: 24px;
    color: #6366f1;
    background: rgba(99, 102, 241, 0.1);
    padding: 8px;
    border-radius: 12px;
  }

  .card-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-h, #1f2937);
  }

  .card-subtitle {
    margin: 2px 0 0;
    font-size: 0.85rem;
    color: var(--text, #6b7280);
  }
</style>
