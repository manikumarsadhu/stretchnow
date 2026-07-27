<script>
  import { syncState, lastSyncTime } from '../sync/status.js';

  $: state = $syncState;
  $: lastTime = $lastSyncTime;
</script>

<div class="sync-status-badge state-{state.toLowerCase()}">
  <span class="status-dot"></span>
  <span class="status-text">
    {#if state === 'IDLE'}
      Synced {lastTime ? `at ${lastTime}` : ''}
    {:else}
      {state.replace('_', ' ')}
    {/if}
  </span>
</div>

<style>
  .sync-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 8px;
    border-radius: 99px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    background: rgba(148, 163, 184, 0.08);
    border: 1px solid var(--border-card);
    transition: all 0.3s ease;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--text-muted);
    transition: background 0.3s ease;
  }

  /* Idle / Synced state */
  .state-idle {
    color: var(--emerald);
    background: rgba(16, 185, 129, 0.06);
    border-color: rgba(16, 185, 129, 0.15);
  }
  .state-idle .status-dot {
    background: var(--emerald);
  }

  /* Syncing & Retrying states */
  .state-syncing, .state-retrying {
    color: var(--amber);
    background: rgba(245, 158, 11, 0.06);
    border-color: rgba(245, 158, 11, 0.15);
  }
  .state-syncing .status-dot, .state-retrying .status-dot {
    background: var(--amber);
    animation: pulse 1s infinite alternate;
  }

  /* Pending changes state */
  .state-pending_changes {
    color: #0284c7;
    background: rgba(14, 165, 233, 0.06);
    border-color: rgba(14, 165, 233, 0.15);
  }
  .state-pending_changes .status-dot {
    background: #0284c7;
  }

  /* Offline state */
  .state-offline {
    color: var(--text-muted);
    background: rgba(148, 163, 184, 0.08);
    border-color: var(--border-card);
  }
  .state-offline .status-dot {
    background: var(--text-muted);
  }

  /* Failed state */
  .state-failed {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.06);
    border-color: rgba(239, 68, 68, 0.15);
  }
  .state-failed .status-dot {
    background: #ef4444;
  }

  @keyframes pulse {
    from { opacity: 0.5; }
    to { opacity: 1; }
  }
</style>
