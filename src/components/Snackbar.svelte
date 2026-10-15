<script>
  import { toast, hideToast } from '../stores/toast.js';

  function handleAction() {
    if ($toast?.onAction) {
      $toast.onAction();
    }
    hideToast();
  }
</script>

{#if $toast}
  <aside class="snackbar-wrapper animate-fade-in" role="status" aria-live="polite">
    <div class="snackbar-card {$toast.type || 'info'}">
      {#if $toast.icon}
        <span class="material-symbols-outlined snackbar-icon" aria-hidden="true">
          {$toast.icon}
        </span>
      {/if}

      <span class="snackbar-message">
        {$toast.message}
      </span>

      {#if $toast.actionText && $toast.onAction}
        <button
          type="button"
          class="snackbar-action"
          on:click={handleAction}
        >
          {$toast.actionText}
        </button>
      {/if}

      <button
        type="button"
        class="snackbar-dismiss"
        on:click={hideToast}
        aria-label="Dismiss notification"
      >
        <span class="material-symbols-outlined" aria-hidden="true">close</span>
      </button>
    </div>
  </aside>
{/if}

<style>
  .snackbar-wrapper {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9995;
    pointer-events: none;
    display: flex;
    justify-content: center;
    width: auto;
    max-width: calc(100vw - 32px);
  }

  .snackbar-card {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 12px;
    background: #0f172a;
    color: #f8fafc;
    border: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.45), 0 0 16px rgba(99, 102, 241, 0.15);
    border-radius: 999px;
    padding: 10px 18px;
    font-size: 0.9rem;
    font-weight: 500;
    line-height: 1.4;
    transition: all 0.2s ease;
  }

  .snackbar-card.success .snackbar-icon {
    color: #34d399;
  }

  .snackbar-card.warning .snackbar-icon {
    color: #fbbf24;
  }

  .snackbar-card.error .snackbar-icon {
    color: #f87171;
  }

  .snackbar-card.info .snackbar-icon {
    color: #818cf8;
  }

  .snackbar-icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  .snackbar-message {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .snackbar-action {
    background: rgba(99, 102, 241, 0.25);
    color: #a5b4fc;
    border: 1px solid rgba(165, 180, 252, 0.35);
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s ease;
    margin-left: 4px;
  }

  .snackbar-action:hover {
    background: #6366f1;
    color: #ffffff;
    border-color: #6366f1;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
  }

  .snackbar-dismiss {
    background: transparent;
    border: none;
    color: #94a3b8;
    padding: 2px;
    margin-left: 2px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: color 0.15s ease;
  }

  .snackbar-dismiss:hover {
    color: #f8fafc;
  }

  .snackbar-dismiss .material-symbols-outlined {
    font-size: 18px;
  }

  @media (max-width: 768px) {
    .snackbar-wrapper {
      bottom: 84px; /* Float above BottomNav */
      width: calc(100% - 32px);
    }

    .snackbar-card {
      width: 100%;
      border-radius: 14px;
      padding: 10px 14px;
      gap: 10px;
    }

    .snackbar-message {
      white-space: normal;
      font-size: 0.85rem;
    }
  }
</style>
