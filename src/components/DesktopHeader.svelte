<script>
  import { appStore, navigateTo } from '../stores/app.js';
  import NotificationCenterModal from './NotificationCenterModal.svelte';

  $: user = $appStore?.user || {};
  $: settings = $appStore?.settings || {};
  $: route = $appStore?.route || 'home';

  let isNotificationCenterOpen = false;

  const currentHour = new Date().getHours();
  const greetingTime = currentHour < 12 ? 'Good Morning' : currentHour < 18 ? 'Good Afternoon' : 'Good Evening';

  $: pageTitle = (route === 'home') 
    ? `${greetingTime}, ${user?.name || 'Mani'} 👋`
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
        title="In-App Notification History"
        aria-label="Open In-App Notification Center"
      >
        <span class="material-symbols-outlined">notifications</span>
        <span class="bell-badge"></span>
      </button>

      <!-- Meeting Mode Shortcut -->
      <button 
        type="button" 
        class="header-action-btn alerts-pill {settings?.smartSchedule?.activeMeetingMode ? 'muted' : 'active'}"
        on:click={() => navigateTo('settings')}
        title={settings?.smartSchedule?.activeMeetingMode ? 'Meeting Mode Active (Alerts Paused)' : 'Alerts Active'}
        aria-label="Alerts Status"
      >
        <span class="material-symbols-outlined">
          {settings?.smartSchedule?.activeMeetingMode ? 'notifications_off' : 'notifications_active'}
        </span>
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
        <span class="profile-name">{user?.name || 'Mani'}</span>
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

  .alerts-pill {
    color: var(--primary);
  }

  .alerts-pill.muted {
    color: var(--text-muted);
  }

  .bell-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 8px;
    height: 8px;
    background: var(--color-rose);
    border-radius: 50%;
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
