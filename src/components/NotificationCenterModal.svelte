<script>
  import Modal from './Modal.svelte';
  import {
    appStore,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    clearAllNotifications,
    navigateTo
  } from '../stores/app.js';

  export let isOpen = false;
  export let onclose = () => {};

  $: notifications = $appStore.notifications || [];
  $: unreadCount = notifications.filter((n) => n.unread).length;

  let activeFilter = 'all'; // 'all' | 'unread' | 'badge'

  $: filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'unread') return item.unread;
    if (activeFilter === 'badge') return item.type === 'badge';
    return true;
  });

  function formatRelativeTime(ts) {
    if (!ts) return 'Recent';
    const diffMs = Date.now() - Number(ts);
    if (diffMs < 0) return 'Just now';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function handleCardClick(item) {
    if (item.unread) {
      markNotificationAsRead(item.id);
    }
  }

  function handleActionClick(item, e) {
    e.stopPropagation();
    markNotificationAsRead(item.id);
    onclose();
    if (item.actionRoute) {
      navigateTo(item.actionRoute);
    }
  }

  function handleDismiss(id, e) {
    e.stopPropagation();
    removeNotification(id);
  }
</script>

<Modal {isOpen} title="Notification Center" icon="notifications" {onclose}>
  <div class="notification-center">
    <!-- Top Filter & Quick Controls Bar -->
    <div class="nc-top-bar">
      <div class="nc-filters">
        <button
          type="button"
          class="filter-pill {activeFilter === 'all' ? 'active' : ''}"
          on:click={() => (activeFilter = 'all')}
        >
          All <span class="pill-badge">{notifications.length}</span>
        </button>
        <button
          type="button"
          class="filter-pill {activeFilter === 'unread' ? 'active' : ''}"
          on:click={() => (activeFilter = 'unread')}
        >
          Unread {#if unreadCount > 0}<span class="pill-badge accent">{unreadCount}</span>{/if}
        </button>
        <button
          type="button"
          class="filter-pill {activeFilter === 'badge' ? 'active' : ''}"
          on:click={() => (activeFilter = 'badge')}
        >
          Achievements
        </button>
      </div>

      <div class="nc-global-actions">
        {#if unreadCount > 0}
          <button type="button" class="btn-link" on:click={markAllNotificationsAsRead}>
            Mark read
          </button>
        {/if}
        {#if notifications.length > 0}
          <button type="button" class="btn-link danger" on:click={clearAllNotifications}>
            Clear all
          </button>
        {/if}
      </div>
    </div>

    <!-- Notification List -->
    {#if filteredNotifications.length === 0}
      <div class="nc-empty">
        <div class="empty-icon-wrap">
          <span class="material-symbols-outlined empty-icon">
            {activeFilter === 'unread' ? 'mark_chat_read' : 'notifications_off'}
          </span>
        </div>
        <p class="empty-title">
          {activeFilter === 'unread' ? 'No unread alerts' : 'All caught up!'}
        </p>
        <p class="empty-sub">
          {activeFilter === 'unread'
            ? 'You have reviewed all your stretch notifications.'
            : 'No notifications at the moment. Active break reminders will appear here.'}
        </p>
      </div>
    {:else}
      <div class="nc-list">
        {#each filteredNotifications as item (item.id)}
          <div
            class="nc-item {item.unread ? 'unread' : ''}"
            on:click={() => handleCardClick(item)}
            on:keydown={(e) => e.key === 'Enter' && handleCardClick(item)}
            role="button"
            tabindex="0"
          >
            <div class="nc-icon-wrap type-{item.type || 'break'}">
              <span class="material-symbols-outlined">
                {item.icon || (item.type === 'badge' ? 'military_tech' : item.type === 'hydration' ? 'water_drop' : 'self_improvement')}
              </span>
            </div>

            <div class="nc-content">
              <div class="nc-top-row">
                <div class="title-wrap">
                  {#if item.unread}
                    <span class="unread-dot" title="Unread notification"></span>
                  {/if}
                  <span class="nc-title">{item.title}</span>
                </div>
                <div class="time-and-dismiss">
                  <span class="nc-time">{formatRelativeTime(item.timestamp)}</span>
                  <button
                    type="button"
                    class="btn-dismiss"
                    title="Dismiss notification"
                    aria-label="Dismiss notification"
                    on:click={(e) => handleDismiss(item.id, e)}
                  >
                    <span class="material-symbols-outlined dismiss-icon">close</span>
                  </button>
                </div>
              </div>

              <p class="nc-message">{item.message}</p>

              {#if item.actionRoute && item.actionLabel}
                <div class="nc-action-row">
                  <button
                    type="button"
                    class="nc-action-btn"
                    on:click={(e) => handleActionClick(item, e)}
                  >
                    <span>{item.actionLabel}</span>
                    <span class="material-symbols-outlined arrow-icon">arrow_forward</span>
                  </button>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</Modal>

<style>
  .notification-center {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .nc-top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border-card);
    gap: 8px;
    flex-wrap: wrap;
  }

  .nc-filters {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .filter-pill {
    background: var(--surface-2);
    border: 1px solid transparent;
    color: var(--text-muted);
    font-size: 0.78rem;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 99px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.15s ease;
  }

  .filter-pill:hover {
    color: var(--text-heading);
    background: var(--surface-1);
  }

  .filter-pill.active {
    background: var(--primary-light);
    color: var(--primary);
    border-color: rgba(99, 102, 241, 0.25);
    font-weight: 700;
  }

  .pill-badge {
    background: rgba(0, 0, 0, 0.08);
    font-size: 0.7rem;
    padding: 1px 6px;
    border-radius: 99px;
  }

  .pill-badge.accent {
    background: var(--primary);
    color: #ffffff;
  }

  .nc-global-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .btn-link {
    background: none;
    border: none;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0;
    transition: color 0.15s ease;
  }

  .btn-link:hover {
    color: var(--primary);
  }

  .btn-link.danger:hover {
    color: var(--color-rose);
  }

  /* List & Cards */
  .nc-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 380px;
    overflow-y: auto;
    padding-right: 6px;
    margin-right: -4px;
  }

  .nc-list::-webkit-scrollbar {
    width: 5px;
  }
  .nc-list::-webkit-scrollbar-track {
    background: transparent;
  }
  .nc-list::-webkit-scrollbar-thumb {
    background: var(--border-card);
    border-radius: 4px;
  }

  .nc-item {
    display: flex;
    gap: 12px;
    padding: 12px 14px;
    background: var(--surface-1);
    border: 1px solid var(--border-card);
    border-radius: var(--radius-md);
    cursor: pointer;
    text-align: left;
    transition: all 0.18s ease;
    position: relative;
  }

  .nc-item:hover {
    border-color: rgba(99, 102, 241, 0.4);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
    transform: translateY(-1px);
  }

  .nc-item.unread {
    background: rgba(99, 102, 241, 0.06);
    border-color: rgba(99, 102, 241, 0.28);
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

  .type-break {
    background: var(--color-reminder-light);
    color: var(--color-reminder);
  }

  .type-badge {
    background: rgba(245, 158, 11, 0.16);
    color: #d97706;
  }

  .type-hydration {
    background: rgba(2, 132, 199, 0.14);
    color: #0284c7;
  }

  .type-ai {
    background: var(--color-ai-light);
    color: var(--color-ai);
  }

  .type-system {
    background: rgba(99, 102, 241, 0.12);
    color: var(--primary);
  }

  .nc-content {
    flex: 1;
    min-width: 0;
  }

  .nc-top-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 3px;
    gap: 8px;
  }

  .title-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .unread-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--primary);
    flex-shrink: 0;
  }

  .nc-title {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--text-heading);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .time-and-dismiss {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .nc-time {
    font-size: 0.74rem;
    color: var(--text-muted);
  }

  .btn-dismiss {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.6;
    transition: all 0.15s ease;
  }

  .btn-dismiss:hover {
    opacity: 1;
    color: var(--color-rose);
    background: rgba(239, 68, 68, 0.1);
  }

  .dismiss-icon {
    font-size: 15px;
  }

  .nc-message {
    font-size: 0.82rem;
    color: var(--text-main);
    margin: 0;
    line-height: 1.4;
  }

  .nc-action-row {
    margin-top: 8px;
    display: flex;
  }

  .nc-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: var(--primary-light);
    color: var(--primary);
    border: 1px solid rgba(99, 102, 241, 0.2);
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .nc-action-btn:hover {
    background: var(--primary);
    color: #ffffff;
  }

  .arrow-icon {
    font-size: 14px;
  }

  /* Empty State */
  .nc-empty {
    text-align: center;
    padding: 36px 16px;
    color: var(--text-muted);
  }

  .empty-icon-wrap {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: var(--surface-2);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 12px;
  }

  .empty-icon {
    font-size: 32px;
    color: var(--text-muted);
    opacity: 0.7;
  }

  .empty-title {
    font-weight: 700;
    font-size: 1rem;
    margin: 0 0 4px;
    color: var(--text-heading);
  }

  .empty-sub {
    font-size: 0.84rem;
    margin: 0;
    max-width: 280px;
    margin: 0 auto;
    line-height: 1.4;
  }
</style>
