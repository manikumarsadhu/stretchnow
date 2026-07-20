<script>
  import { appStore, navigateTo } from '../stores/app.js';

  $: activeRoute = $appStore.route;

  const NAV_ITEMS = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'library', label: 'Library', icon: 'self_improvement' },
    { id: 'break', label: 'Stretch', icon: 'play_arrow', special: true },
    { id: 'statistics', label: 'Stats', icon: 'bar_chart' },
    { id: 'settings', label: 'Settings', icon: 'settings' }
  ];
</script>

<nav class="bottom-nav">
  <div class="nav-inner">
    {#each NAV_ITEMS as item}
      {#if item.special}
        <button
          class="nav-btn-special {activeRoute === 'break' ? 'active' : ''}"
          on:click={() => navigateTo('break')}
          title="Start Break"
        >
          <span class="material-symbols-outlined special-icon">{item.icon}</span>
        </button>
      {:else}
        <button
          class="nav-item {activeRoute === item.id ? 'active' : ''}"
          on:click={() => navigateTo(item.id)}
        >
          <span class="material-symbols-outlined nav-icon">{item.icon}</span>
          <span class="nav-label">{item.label}</span>
        </button>
      {/if}
    {/each}
  </div>
</nav>

<style>
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 480px;
    z-index: 900;
    padding: 8px 16px 16px;
    box-sizing: border-box;
    pointer-events: none;
  }

  .nav-inner {
    pointer-events: auto;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(229, 231, 235, 0.9);
    border-radius: 24px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-around;
    height: 64px;
    padding: 0 8px;
  }

  :global(.dark-mode) .nav-inner {
    background: rgba(30, 41, 59, 0.92);
    border-color: rgba(51, 65, 85, 0.9);
  }

  .nav-item {
    background: transparent;
    border: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    cursor: pointer;
    color: #94a3b8;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 6px 12px;
    border-radius: 14px;
  }

  .nav-item.active {
    color: #6366f1;
    background: rgba(99, 102, 241, 0.08);
  }

  .nav-icon {
    font-size: 22px;
  }

  .nav-label {
    font-size: 0.72rem;
    font-weight: 600;
  }

  .nav-btn-special {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    border: 4px solid #ffffff;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    cursor: pointer;
    margin-top: -24px;
    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  :global(.dark-mode) .nav-btn-special {
    border-color: #1e293b;
  }

  .nav-btn-special:hover {
    transform: scale(1.08);
  }

  .special-icon {
    font-size: 30px;
  }
</style>
