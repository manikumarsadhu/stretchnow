<script>
  import Modal from './Modal.svelte';
  import Button from './Button.svelte';

  export let isOpen = false;
  export let onclose = () => {};

  // Mock / stored notification activity events
  let notifications = [
    {
      id: 1,
      type: 'break',
      title: 'Stretch Break Reminder',
      message: 'Time for your 2-minute desk stretch pose! Keep your spine flexible.',
      time: '10 mins ago',
      icon: 'self_improvement',
      unread: true
    },
    {
      id: 2,
      type: 'badge',
      title: 'Achievement Unlocked!',
      message: 'You earned the 7-Day Hydration Hero badge! +100 XP',
      time: '2 hours ago',
      icon: 'military_tech',
      unread: false
    },
    {
      id: 3,
      type: 'ai',
      title: 'AI Ergonomic Insight',
      message: 'You skipped 2 afternoon breaks. Shoulder strain risk detected.',
      time: 'Yesterday',
      icon: 'psychology',
      unread: false
    },
    {
      id: 4,
      type: 'sync',
      title: 'Cloud Sync Completed',
      message: 'All daily progress synced securely to your Appwrite account.',
      time: 'Yesterday',
      icon: 'cloud_done',
      unread: false
    }
  ];

  function markAllRead() {
    notifications = notifications.map(n => ({ ...n, unread: false }));
  }

  function clearNotifications() {
    notifications = [];
  }
</script>

<Modal {isOpen} title="Notification Center" icon="notifications" {onclose}>
  <div class="notification-center">
    <div class="nc-header-actions">
      <span class="nc-count">{notifications.filter(n => n.unread).length} unread</span>
      <div class="nc-action-buttons">
        <button type="button" class="btn-text" on:click={markAllRead}>Mark all read</button>
        <button type="button" class="btn-text danger" on:click={clearNotifications}>Clear all</button>
      </div>
    </div>

    {#if notifications.length === 0}
      <div class="nc-empty">
        <span class="material-symbols-outlined empty-icon">notifications_off</span>
        <p class="empty-title">All caught up!</p>
        <p class="empty-sub">No recent notifications or activity alerts.</p>
      </div>
    {:else}
      <div class="nc-list">
        {#each notifications as item (item.id)}
          <div class="nc-item {item.unread ? 'unread' : ''}">
            <div class="nc-icon-wrap type-{item.type}">
              <span class="material-symbols-outlined">{item.icon}</span>
            </div>
            <div class="nc-content">
              <div class="nc-top-row">
                <span class="nc-title">{item.title}</span>
                <span class="nc-time">{item.time}</span>
              </div>
              <p class="nc-message">{item.message}</p>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <div class="nc-footer">
      <Button variant="outline" fullWidth onclick={onclose}>Close Center</Button>
    </div>
  </div>
</Modal>

<style>
  .notification-center {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .nc-header-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-card);
  }

  .nc-count {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--primary);
  }

  .nc-action-buttons {
    display: flex;
    gap: 12px;
  }

  .btn-text {
    background: none;
    border: none;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0;
  }
  .btn-text:hover { color: var(--primary); }
  .btn-text.danger:hover { color: var(--color-rose); }

  .nc-empty {
    text-align: center;
    padding: 32px 16px;
    color: var(--text-muted);
  }
  .empty-icon {
    font-size: 44px;
    opacity: 0.4;
    margin-bottom: 8px;
  }
  .empty-title {
    font-weight: 700;
    margin: 4px 0 2px;
    color: var(--text-heading);
  }
  .empty-sub {
    font-size: 0.85rem;
    margin: 0;
  }

  .nc-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 340px;
    overflow-y: auto;
  }

  .nc-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: var(--surface-1);
    border: 1px solid var(--border-card);
    border-radius: var(--radius-md);
    transition: background var(--anim-card);
  }
  .nc-item.unread {
    background: var(--primary-light);
    border-color: rgba(99, 102, 241, 0.3);
  }

  .nc-icon-wrap {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .type-break { background: var(--color-reminder-light); color: var(--color-reminder); }
  .type-badge { background: rgba(245, 158, 11, 0.15); color: #d97706; }
  .type-ai { background: var(--color-ai-light); color: var(--color-ai); }
  .type-sync { background: var(--color-success-light); color: var(--color-success); }

  .nc-content {
    flex: 1;
    min-width: 0;
  }

  .nc-top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;
  }
  .nc-title {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--text-heading);
  }
  .nc-time {
    font-size: 0.75rem;
    color: var(--text-muted);
  }
  .nc-message {
    font-size: 0.82rem;
    color: var(--text-main);
    margin: 0;
    line-height: 1.35;
  }

  .nc-footer {
    margin-top: 8px;
  }
</style>
