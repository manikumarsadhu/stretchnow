<script>
  import { BADGES } from '../data/badges.js';
  import { appStore } from '../stores/app.js';

  $: unlockedBadges = $appStore.progress?.badges || [];
</script>

<div class="badges-container">
  <div class="badges-header">
    <h3>🎖️ Achievement Badges</h3>
    <span class="unlocked-counter">
      {unlockedBadges.length} / {BADGES.length} Unlocked
    </span>
  </div>

  <div class="badges-grid">
    {#each BADGES as badge}
      {@const isUnlocked = unlockedBadges.includes(badge.id)}
      <div class="badge-card {isUnlocked ? 'unlocked' : 'locked'}" style="--badge-color: {badge.color}">
        <div class="badge-icon-wrapper">
          <span class="material-symbols-outlined badge-icon">{badge.icon}</span>
        </div>
        <div class="badge-info">
          <h4 class="badge-title">{badge.title}</h4>
          <p class="badge-desc">{badge.description}</p>
        </div>
        {#if isUnlocked}
          <div class="unlocked-indicator">
            <span class="material-symbols-outlined check-badge">check_circle</span>
          </div>
        {:else}
          <div class="locked-indicator">
            <span class="material-symbols-outlined lock-badge">lock</span>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .badges-container {
    background: var(--bg-card);
    border: 1px solid var(--border-card);
    border-radius: var(--radius-md);
    padding: 20px;
    box-shadow: var(--shadow-sm);
  }

  .badges-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .badges-header h3 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--text-heading);
  }

  .unlocked-counter {
    font-size: 0.8rem;
    font-weight: 700;
    background: var(--primary-light);
    color: var(--primary);
    padding: 4px 10px;
    border-radius: 99px;
  }

  .badges-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .badge-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-card);
    position: relative;
    transition: all 0.25s ease;
    background: rgba(255, 255, 255, 0.4);
  }

  :global(.dark-mode) .badge-card {
    background: rgba(15, 23, 42, 0.2);
  }

  .badge-card.unlocked {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(226, 232, 240, 0.9);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  }

  :global(.dark-mode) .badge-card.unlocked {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(51, 65, 85, 0.8);
  }

  .badge-card.unlocked:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
  }

  .badge-card.locked {
    opacity: 0.55;
    background: rgba(241, 245, 249, 0.3);
  }

  :global(.dark-mode) .badge-card.locked {
    background: rgba(30, 41, 59, 0.2);
  }

  .badge-icon-wrapper {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: rgba(148, 163, 184, 0.1);
    color: var(--text-muted);
    transition: all 0.2s ease;
  }

  .unlocked .badge-icon-wrapper {
    background: var(--primary-light);
    color: var(--badge-color, var(--primary));
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
  }

  .badge-icon {
    font-size: 26px;
  }

  .badge-info {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-right: 20px;
  }

  .badge-title {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text-heading);
  }

  .badge-desc {
    margin: 0;
    font-size: 0.74rem;
    color: var(--text-muted);
    line-height: 1.3;
  }

  .unlocked-indicator, .locked-indicator {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .check-badge {
    color: var(--emerald);
    font-size: 20px;
  }

  .lock-badge {
    color: var(--text-muted);
    font-size: 18px;
  }
</style>
