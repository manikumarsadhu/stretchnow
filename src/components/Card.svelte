<script>
  export let title = '';
  export let subtitle = '';
  export let icon = '';
  export let hover = false;
  export let padding = 'md'; // 'sm' | 'md' | 'lg'
  export let variant = 'default'; // 'default' | 'hero' | 'elevated' | 'glass' | 'compact' | 'ai' | 'warning' | 'success' | 'statistics'
</script>

<div class="card p-{padding} variant-{variant} {hover ? 'card-hover' : ''}">
  {#if title || icon}
    <div class="card-header">
      {#if icon}
        <span class="material-symbols-outlined card-icon icon-{variant}">{icon}</span>
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
    background: var(--bg-card, rgba(255, 255, 255, 0.85));
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border-card, rgba(226, 232, 240, 0.85));
    border-radius: var(--radius-lg, 22px);
    box-shadow: var(--shadow-sm);
    transition: all var(--anim-card, 250ms cubic-bezier(0.16, 1, 0.3, 1));
    box-sizing: border-box;
    overflow: hidden;
    position: relative;
  }

  .card-hover:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
    border-color: var(--border-card-hover);
  }

  /* Variants */
  .variant-hero {
    background: linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%);
    color: #ffffff;
    border: none;
    box-shadow: 0 12px 32px -4px rgba(99, 102, 241, 0.35);
  }
  .variant-hero .card-title { color: #ffffff; }
  .variant-hero .card-subtitle { color: rgba(255, 255, 255, 0.85); }
  .variant-hero .card-icon { background: rgba(255, 255, 255, 0.2); color: #ffffff; }

  .variant-ai {
    background: linear-gradient(135deg, var(--color-ai-light) 0%, var(--surface-1) 100%);
    border: 1px solid rgba(139, 92, 246, 0.3);
  }
  .variant-ai .card-icon { background: rgba(139, 92, 246, 0.18); color: var(--color-ai); }

  .variant-success {
    background: linear-gradient(135deg, var(--color-success-light) 0%, var(--surface-1) 100%);
    border: 1px solid rgba(16, 185, 129, 0.3);
  }
  .variant-success .card-icon { background: rgba(16, 185, 129, 0.18); color: var(--color-success); }

  .variant-warning {
    background: linear-gradient(135deg, var(--color-reminder-light) 0%, var(--surface-1) 100%);
    border: 1px solid rgba(245, 158, 11, 0.3);
  }
  .variant-warning .card-icon { background: rgba(245, 158, 11, 0.18); color: var(--color-reminder); }

  .variant-elevated {
    background: var(--surface-1);
    box-shadow: var(--shadow-md);
  }

  .variant-glass {
    background: var(--surface-elevated);
    backdrop-filter: blur(16px);
  }

  .variant-compact {
    border-radius: var(--radius-md, 16px);
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
    color: var(--primary);
    background: var(--primary-light);
    padding: 8px;
    border-radius: 12px;
    flex-shrink: 0;
  }

  .card-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-heading);
  }

  .card-subtitle {
    margin: 2px 0 0;
    font-size: 0.85rem;
    color: var(--text-muted);
  }
</style>
