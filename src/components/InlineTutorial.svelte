<script>
  import Card from './Card.svelte';
  import { appStore, completeTutorialAction } from '../stores/app.js';

  $: progress = $appStore.progress || {};
  $: settings = $appStore.settings || {};

  $: breakDone = (progress.completedBreaksToday || 0) > 0 || (progress.totalCompletedBreaks || 0) > 0;
  $: waterDone = (progress.water || 0) > 0;
  $: notifyDone = !!settings.notificationsEnabled;
  $: analyticsDone = !!progress.visitedAnalytics;
  $: themeDone = !!progress.customizedTheme;

  $: allDone = breakDone && waterDone && notifyDone && analyticsDone && themeDone;

  // Reactively trigger XP completion bonus
  $: if (allDone && !progress.tutorialCompleted) {
    completeTutorialAction();
  }
</script>

{#if !progress.tutorialCompleted}
  <Card padding="md">
    <div class="tutorial-card">
      <div class="tut-header">
        <h3 class="tut-title">🎯 Getting Started Checklist</h3>
        <span class="tut-badge">Tutorial Onboarding</span>
      </div>
      <p class="tut-desc">Complete these five simple steps to optimize your daily workflow and earn <strong>+100 XP</strong>.</p>

      <ul class="tut-list">
        <li class="tut-item {breakDone ? 'checked' : ''}">
          <span class="material-symbols-outlined check-icon">
            {breakDone ? 'check_circle' : 'circle'}
          </span>
          <span class="tut-text">Complete your first 2-min stretch break</span>
        </li>

        <li class="tut-item {waterDone ? 'checked' : ''}">
          <span class="material-symbols-outlined check-icon">
            {waterDone ? 'check_circle' : 'circle'}
          </span>
          <span class="tut-text">Log your first glass of water</span>
        </li>

        <li class="tut-item {notifyDone ? 'checked' : ''}">
          <span class="material-symbols-outlined check-icon">
            {notifyDone ? 'check_circle' : 'circle'}
          </span>
          <span class="tut-text">Enable desktop stretch notifications in Settings</span>
        </li>

        <li class="tut-item {analyticsDone ? 'checked' : ''}">
          <span class="material-symbols-outlined check-icon">
            {analyticsDone ? 'check_circle' : 'circle'}
          </span>
          <span class="tut-text">Visit the Personal Analytics tab</span>
        </li>

        <li class="tut-item {themeDone ? 'checked' : ''}">
          <span class="material-symbols-outlined check-icon">
            {themeDone ? 'check_circle' : 'circle'}
          </span>
          <span class="tut-text">Customize the visual theme in Settings</span>
        </li>
      </ul>
    </div>
  </Card>
{:else}
  <Card padding="md">
    <div class="tutorial-card complete">
      <div class="complete-inner animate-fade-in">
        <div class="trophy-badge-wrap">
          <span class="material-symbols-outlined trophy-icon">stars</span>
        </div>
        <div>
          <h4 class="complete-title">🎉 Onboarding Tutorial Complete!</h4>
          <p class="complete-desc">You unlocked the <strong>+100 XP onboarding bonus</strong>. Keep up the active habits!</p>
        </div>
      </div>
    </div>
  </Card>
{/if}

<style>
  .tutorial-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .tut-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .tut-title {
    margin: 0;
    font-size: 0.98rem;
    font-weight: 800;
    color: var(--text-heading);
  }

  .tut-badge {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--primary);
    background: var(--primary-light);
    padding: 3px 8px;
    border-radius: 99px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .tut-desc {
    margin: 0 0 8px;
    font-size: 0.8rem;
    color: var(--text-muted);
    line-height: 1.4;
  }

  .tut-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .tut-item {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-muted);
    transition: color 0.2s ease;
  }

  .tut-item.checked {
    color: var(--emerald);
  }

  .check-icon {
    font-size: 20px;
    color: var(--text-muted);
    transition: color 0.2s ease;
  }

  .tut-item.checked .check-icon {
    color: var(--emerald);
  }

  .tut-text {
    font-size: 0.84rem;
    font-weight: 600;
  }

  .tut-item.checked .tut-text {
    text-decoration: line-through;
    opacity: 0.85;
  }

  /* Complete card styling */
  .tutorial-card.complete {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%);
    border-radius: var(--radius-sm);
    padding: 2px;
  }

  .complete-inner {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .trophy-badge-wrap {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: var(--emerald-light);
    color: var(--emerald);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: var(--shadow-sm);
  }

  .trophy-icon {
    font-size: 26px;
  }

  .complete-title {
    margin: 0;
    font-size: 0.92rem;
    font-weight: 800;
    color: var(--text-heading);
  }

  .complete-desc {
    margin: 2px 0 0;
    font-size: 0.78rem;
    color: var(--text-muted);
  }
</style>
