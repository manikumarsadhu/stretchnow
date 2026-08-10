<script>
  import { appStore, navigateTo } from '../stores/app.js';

  $: activeRoute = $appStore.route;
  $: user = $appStore.user || {};
  $: progress = $appStore.progress || {};

  const NAV_ITEMS = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'break', label: 'Breaks', icon: 'play_arrow', isSpecial: true },
    { id: 'library', label: 'Stretch Library', icon: 'self_improvement' },
    { id: 'statistics', label: 'Statistics', icon: 'bar_chart' },
    { id: 'goals', label: 'Goals', icon: 'flag' },
    { id: 'aicoach', label: 'AI Coach', icon: 'psychology' },
    { id: 'settings', label: 'Settings', icon: 'settings' }
  ];

  function handleNav(id) {
    if (id === 'goals') {
      navigateTo('statistics');
    } else if (id === 'aicoach') {
      navigateTo('home');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-chatbot'));
        setTimeout(() => {
          const aiElem = document.querySelector('.ai-coach-section');
          if (aiElem) aiElem.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      navigateTo(id);
    }
  }
</script>

<aside class="desktop-sidebar" aria-label="Desktop Sidebar Navigation">
  <!-- Brand Header -->
  <div class="sidebar-brand" on:click={() => handleNav('home')} role="button" tabindex="0" on:keydown={(e) => e.key === 'Enter' && handleNav('home')}>
    <div class="brand-icon-wrap">
      <span class="material-symbols-outlined brand-icon">self_improvement</span>
    </div>
    <div class="brand-text-wrap">
      <span class="brand-title">StretchNow</span>
      <span class="brand-subtitle">Personal Wellness</span>
    </div>
  </div>

  <!-- Primary Navigation Links -->
  <nav class="sidebar-menu">
    <div class="menu-section-label">Menu</div>
    {#each NAV_ITEMS as item}
      <button
        type="button"
        class="nav-link {activeRoute === item.id ? 'active' : ''} {item.isSpecial ? 'special-link' : ''}"
        on:click={() => handleNav(item.id)}
      >
        <span class="material-symbols-outlined nav-icon {activeRoute === item.id ? 'filled' : ''}">
          {item.icon}
        </span>
        <span class="nav-text">{item.label}</span>
        {#if item.isSpecial}
          <span class="special-badge">Start</span>
        {/if}
      </button>
    {/each}
  </nav>

  <!-- User Profile Snippet & Streak -->
  <div class="sidebar-user-card">
    <div class="user-avatar">
      <span class="material-symbols-outlined">person</span>
    </div>
    <div class="user-info">
      <span class="user-name">{user.name || 'Mani Kumar'}</span>
      <span class="user-streak">🔥 {progress.streak || 7}-Day Streak</span>
    </div>
  </div>
</aside>

<style>
  .desktop-sidebar {
    width: 260px;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    background: var(--surface-1);
    border-right: 1px solid var(--border-card);
    display: flex;
    flex-direction: column;
    padding: 24px 16px;
    box-sizing: border-box;
    z-index: 100;
    overflow-y: auto;
  }

  .sidebar-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    margin-bottom: 20px;
    cursor: pointer;
    border-radius: var(--radius-md);
    transition: background-color var(--anim-card);
  }

  .sidebar-brand:hover {
    background: var(--surface-2);
  }

  .brand-icon-wrap {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    box-shadow: 0 4px 12px var(--primary-glow);
    flex-shrink: 0;
  }

  .brand-icon {
    font-size: 26px;
  }

  .brand-text-wrap {
    display: flex;
    flex-direction: column;
  }

  .brand-title {
    font-family: var(--font-heading);
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--text-heading);
    line-height: 1.1;
    letter-spacing: -0.02em;
  }

  .brand-subtitle {
    font-size: 0.72rem;
    color: var(--text-muted);
    font-weight: 600;
    margin-top: 2px;
  }

  .sidebar-menu {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: auto;
  }

  .menu-section-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    padding: 0 12px;
    margin-bottom: 4px;
  }

  .nav-link {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    padding: 9px 12px !important;
    border-radius: var(--radius-md) !important;
    background: transparent !important;
    border: 1px solid transparent !important;
    color: var(--text-main) !important;
    font-size: 0.9rem !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    transition: all var(--anim-card) !important;
    text-align: left !important;
    width: 100% !important;
    box-sizing: border-box !important;
    position: relative !important;
    margin: 0 !important;
    height: auto !important;
    min-height: 40px !important;
    box-shadow: none !important;
    outline: none !important;
  }

  .nav-link:hover {
    background: var(--surface-2) !important;
    color: var(--text-heading) !important;
    transform: translateX(2px) !important;
  }

  .nav-link.active {
    background: var(--primary-light) !important;
    color: var(--primary) !important;
    font-weight: 800 !important;
    border-color: rgba(99, 102, 241, 0.25) !important;
  }

  .nav-link.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 6px;
    bottom: 6px;
    width: 4px;
    background: var(--primary);
    border-radius: 0 4px 4px 0;
  }

  .nav-icon {
    font-size: 22px;
    transition: transform var(--anim-card);
  }

  .nav-icon.filled {
    font-variation-settings: 'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24;
  }

  .nav-text {
    flex: 1;
  }

  .special-link {
    background: rgba(16, 185, 129, 0.08);
    color: var(--color-success);
  }

  .special-link:hover {
    background: rgba(16, 185, 129, 0.16);
    color: var(--color-success);
  }

  .special-link.active {
    background: var(--color-success-light);
    color: var(--color-success);
    border-color: rgba(16, 185, 129, 0.3);
  }

  .special-badge {
    font-size: 0.7rem;
    font-weight: 800;
    background: var(--color-success);
    color: #ffffff;
    padding: 2px 8px;
    border-radius: 99px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .sidebar-user-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--surface-2);
    border: 1px solid var(--border-card);
    border-radius: var(--radius-md);
    margin-top: auto;
  }

  .user-avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: var(--primary-light);
    color: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .user-name {
    font-size: 0.88rem;
    font-weight: 800;
    color: var(--text-heading);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-streak {
    font-size: 0.74rem;
    color: var(--text-muted);
    font-weight: 600;
  }

  /* Desktop sidebar hidden on screens below 1024px */
  @media (max-width: 1023px) {
    .desktop-sidebar {
      display: none !important;
    }
  }
</style>
