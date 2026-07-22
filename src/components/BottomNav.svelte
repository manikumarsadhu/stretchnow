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

<nav class="bottom-nav" aria-label="Bottom Navigation">
  <div class="nav-inner">
    {#each NAV_ITEMS as item}
      {#if item.special}
        <div class="special-item-wrap">
          <button
            type="button"
            class="nav-btn-special {activeRoute === 'break' ? 'active' : ''}"
            on:click={() => navigateTo('break')}
            title="Start Stretch Break"
            aria-label="Start Stretch Break"
          >
            <span class="material-symbols-outlined special-icon">{item.icon}</span>
          </button>
          <span class="nav-label special-label">{item.label}</span>
        </div>
      {:else}
        <button
          type="button"
          class="nav-item {activeRoute === item.id ? 'active' : ''}"
          on:click={() => navigateTo(item.id)}
          aria-label={item.label}
        >
          <div class="icon-wrap">
            <span class="material-symbols-outlined nav-icon {activeRoute === item.id ? 'filled' : ''}">
              {item.icon}
            </span>
          </div>
          <span class="nav-label">{item.label}</span>
        </button>
      {/if}
    {/each}
  </div>
</nav>

<style>
  .bottom-nav {
    position: fixed;
    bottom: 16px;
    left: 16px;
    right: 16px;
    margin: 0 auto;
    width: calc(100% - 32px);
    max-width: 440px;
    z-index: 1000;
    box-sizing: border-box;
    overflow: visible;
  }

  .nav-inner {
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.45);
    border-radius: var(--radius-lg, 24px);
    box-shadow: 0 12px 30px -4px rgba(15, 23, 42, 0.08),
                0 4px 12px -2px rgba(15, 23, 42, 0.03),
                inset 0 1px 0 rgba(255, 255, 255, 0.6);
    display: flex;
    align-items: center;
    justify-content: space-around;
    height: 72px;
    padding: 0 10px;
    width: 100%;
    box-sizing: border-box;
    overflow: visible;
  }

  :global(.dark-mode) .nav-inner {
    background: rgba(30, 41, 59, 0.7);
    border-color: rgba(255, 255, 255, 0.06);
    box-shadow: 0 12px 30px -4px rgba(0, 0, 0, 0.35),
                0 4px 12px -2px rgba(0, 0, 0, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  /* Regular Nav Item */
  .nav-item {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    cursor: pointer;
    color: var(--text-muted);
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    padding: 6px 0;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    position: relative;
    height: 100%;
  }

  .nav-item::after {
    content: '';
    position: absolute;
    bottom: 6px;
    width: 4px;
    height: 4px;
    background: var(--primary);
    border-radius: 50%;
    opacity: 0;
    transform: scale(0.3);
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  :global(.dark-mode) .nav-item::after {
    background: var(--primary);
  }

  .nav-item.active::after {
    opacity: 1;
    transform: scale(1);
  }

  .nav-item:active {
    transform: scale(0.92);
  }

  .icon-wrap {
    width: 42px;
    height: 28px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .nav-item.active .icon-wrap {
    background: var(--primary-light);
    transform: translateY(-2px);
  }

  .nav-item.active {
    color: var(--primary);
  }

  .nav-icon {
    font-size: 22px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
  }

  .nav-icon.filled {
    font-variation-settings: 'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24;
  }

  .nav-label {
    font-size: 0.68rem;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    opacity: 0.85;
    transition: all 0.2s ease;
  }

  .nav-item.active .nav-label {
    font-weight: 800;
    opacity: 1;
  }

  /* Center Special Floating Action Item */
  .special-item-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    height: 100%;
  }

  .nav-btn-special {
    position: absolute;
    top: -30px;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
    border: 5px solid #ffffff;
    width: 58px;
    height: 58px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    cursor: pointer;
    box-shadow: 0 8px 24px var(--primary-glow);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    -webkit-tap-highlight-color: transparent;
  }

  :global(.dark-mode) .nav-btn-special {
    border-color: #0f172a;
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
  }

  .nav-btn-special:hover {
    transform: translateY(-4px) scale(1.08);
    box-shadow: 0 12px 28px var(--primary-glow), 0 0 0 6px var(--primary-light);
  }

  :global(.dark-mode) .nav-btn-special:hover {
    box-shadow: 0 12px 28px rgba(99, 102, 241, 0.5), 0 0 0 6px rgba(99, 102, 241, 0.2);
  }

  .nav-btn-special:active {
    transform: translateY(-2px) scale(0.95);
  }

  .special-label {
    margin-top: 38px;
    font-weight: 800;
    color: var(--primary);
  }

  .special-icon {
    font-size: 28px;
    margin-left: 2px;
  }

  @media (max-width: 360px) {
    .bottom-nav {
      bottom: 12px;
      left: 12px;
      right: 12px;
      width: calc(100% - 24px);
    }
    .nav-inner {
      height: 66px;
      padding: 0 6px;
    }
    .icon-wrap {
      width: 36px;
      height: 24px;
    }
    .nav-label {
      font-size: 0.62rem;
    }
    .nav-btn-special {
      width: 50px;
      height: 50px;
      top: -24px;
    }
    .special-icon {
      font-size: 24px;
    }
    .special-label {
      margin-top: 32px;
    }
  }
</style>