<script>
  import { appStore, navigateTo } from '../stores/app.js';
  import NotificationCenterModal from './NotificationCenterModal.svelte';

  $: user = $appStore?.user || {};
  $: route = $appStore?.route || 'home';
  $: unreadCount = ($appStore?.notifications || []).filter((n) => n.unread).length;

  let isNotificationCenterOpen = false;

  const currentHour = new Date().getHours();
  const greetingTime = currentHour < 12 ? 'Good Morning' : currentHour < 18 ? 'Good Afternoon' : 'Good Evening';

  $: pageTitle = (route === 'home') 
    ? `${greetingTime}, ${user?.name || 'Guest'} 👋`
    : (route === 'break') ? 'Active Stretch Session 🧘'
    : (route === 'library') ? 'Stretch Routine Library 📚'
    : (route === 'statistics') ? 'Personal Wellness Analytics 📊'
    : (route === 'settings') ? 'Application Preferences ⚙️'
    : 'StretchNow Dashboard';
</script>

<header class="desktop-header">
  <div class="header-content-inner">
    <div class="header-left">
      <h1 class="page-title">{pageTitle}</h1>
    </div>

    <div class="header-right">
      <!-- Quick Action: Start Stretch -->
      <button 
        type="button" 
        class="quick-stretch-btn" 
        on:click={() => navigateTo('break')}
        title="Start Quick Stretch Routine"
      >
        <span class="material-symbols-outlined">play_arrow</span>
        <span>Start Stretch</span>
      </button>

      <!-- Notification Center Trigger -->
      <button 
        type="button" 
        class="header-action-btn bell-btn" 
        on:click={() => isNotificationCenterOpen = true}
        title={unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'Notification Center'}
        aria-label="Open In-App Notification Center"
      >
        <span class="material-symbols-outlined">notifications</span>
        {#if unreadCount > 0}
          <span class="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        {/if}
      </button>

      <!-- Admin Console Quick Trigger -->
      <button 
        type="button" 
        class="header-action-btn admin-btn" 
        on:click={() => navigateTo('admin')}
        title="Admin Console & AI Control Center"
        aria-label="Open Admin Console"
      >
        <span class="material-symbols-outlined">admin_panel_settings</span>
      </button>

      <!-- Profile Avatar Button -->
      <button
        type="button"
        class="profile-btn"
        on:click={() => navigateTo('settings')}
        title="Account & Settings"
      >
        <div class="avatar-circle">
          <span class="material-symbols-outlined">person</span>
        </div>
        <span class="profile-name">{user?.name || 'Guest'}</span>
      </button>
    </div>
  </div>
</header>

{#if isNotificationCenterOpen}
  <NotificationCenterModal isOpen={isNotificationCenterOpen} onclose={() => isNotificationCenterOpen = false} />
{/if}

<style>
  .desktop-header {
    width: 100%;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-card);
    padding: 16px 32px;
    box-sizing: border-box;
    position: sticky;
    top: 0;
    z-index: 90;
    transition: background-color 0.3s ease;
  }

  :global(.dark-mode) .desktop-header {
    background: rgba(15, 23, 42, 0.85);
  }

  .header-content-inner {
    max-width: 1440px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .page-title {
    font-family: var(--font-heading);
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--text-heading);
    margin: 0;
    letter-spacing: -0.02em;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .quick-stretch-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: linear-gradient(135deg, var(--color-success) 0%, #059669 100%);
    color: #ffffff;
    border: none;
    border-radius: var(--radius-md);
    font-size: 0.86rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px var(--color-success-light);
    transition: all var(--anim-card);
  }

  .quick-stretch-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.35);
  }

  .header-action-btn {
    position: relative;
    background: var(--surface-1);
    border: 1px solid var(--border-card);
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-heading);
    cursor: pointer;
    transition: all var(--anim-card);
  }

  .header-action-btn:hover {
    border-color: var(--primary);
    transform: translateY(-2px);
  }


  .bell-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    background: var(--color-rose);
    color: #ffffff;
    border-radius: 99px;
    font-size: 0.65rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--surface-1);
    box-sizing: border-box;
    pointer-events: none;
  }

  .profile-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--surface-1);
    border: 1px solid var(--border-card);
    padding: 4px 12px 4px 4px;
    border-radius: 99px;
    cursor: pointer;
    transition: all var(--anim-card);
  }

  .profile-btn:hover {
    border-color: var(--primary);
    transform: translateY(-2px);
  }

  .avatar-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--primary-light);
    color: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .profile-name {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--text-heading);
  }

  /* Desktop Header hidden on screens below 1024px */
  @media (max-width: 1023px) {
    .desktop-header {
      display: none !important;
    }
  }
</style>
