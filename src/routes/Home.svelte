<script>
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  import ProgressCard from '../components/ProgressCard.svelte';
  import ProgressRing from '../components/ProgressRing.svelte';
  import { appStore, navigateTo, incrementWater } from '../stores/app.js';
  import { calculateWellnessScore, calculateWaterPercentage, calculateBreakGoalPercentage, getMotivationalTip } from '../utils/wellness.js';
  import { STRETCHES } from '../utils/stretches.js';

  $: user = $appStore.user || {};
  $: progress = $appStore.progress || {};
  $: wellnessScore = calculateWellnessScore(progress, user);
  $: waterPercent = calculateWaterPercentage(progress.water, user.dailyWaterGoal);
  $: breakPercent = calculateBreakGoalPercentage(progress.completedBreaksToday, user.dailyBreakGoal);
  $: tip = getMotivationalTip(progress.completedBreaksToday, progress.streak);

  const featuredStretches = STRETCHES.slice(0, 3);
</script>

<div class="home-screen">
  <!-- Header -->
  <header class="header">
    <div class="user-greeting">
      <h2 class="greeting-text">Hello, {user.name || 'Friend'} 👋</h2>
      <span class="user-occupation">{user.occupation || 'Desk Worker'}</span>
    </div>
    <button class="profile-badge" on:click={() => navigateTo('settings')}>
      <span class="material-symbols-outlined">person</span>
    </button>
  </header>

  <!-- Motivational Tip -->
  <div class="tip-card">
    <span class="material-symbols-outlined tip-icon">lightbulb</span>
    <p class="tip-text">{tip}</p>
  </div>

  <!-- Hero Start Break Card -->
  <Card hover padding="lg">
    <div class="hero-break">
      <div class="break-ring">
        <ProgressRing progress={breakPercent} size={110} strokeWidth={10} color="#6366f1">
          <span class="material-symbols-outlined hero-ring-icon">self_improvement</span>
        </ProgressRing>
      </div>

      <div class="break-info">
        <span class="break-tag">Recommended Routine</span>
        <h3 class="break-title">2-Min Posture Reset</h3>
        <p class="break-desc">{progress.completedBreaksToday} of {user.dailyBreakGoal || 6} daily breaks completed</p>

        <Button variant="primary" size="md" icon="play_arrow" onclick={() => navigateTo('break')}>
          Start Break Now
        </Button>
      </div>
    </div>
  </Card>

  <!-- Stats Grid -->
  <div class="stats-grid">
    <ProgressCard
      title="Wellness Score"
      value={wellnessScore}
      subtitle="Top 15% Today"
      icon="bolt"
      iconBg="rgba(245, 158, 11, 0.15)"
      iconColor="#f59e0b"
    />

    <ProgressCard
      title="Day Streak"
      value={`${progress.streak || 1} Days`}
      subtitle="On a roll!"
      icon="local_fire_department"
      iconBg="rgba(239, 68, 68, 0.15)"
      iconColor="#ef4444"
    />
  </div>

  <!-- Water Tracker Section -->
  <Card padding="md">
    <div class="water-section">
      <div class="water-header">
        <div class="water-title-wrap">
          <span class="material-symbols-outlined water-icon">water_drop</span>
          <div>
            <h4 class="water-title">Hydration Tracker</h4>
            <span class="water-sub">{progress.water || 0} of {user.dailyWaterGoal || 8} cups ({waterPercent}%)</span>
          </div>
        </div>
        <Button variant="secondary" size="sm" icon="add" onclick={incrementWater}>
          +1 Cup
        </Button>
      </div>

      <div class="water-bar-track">
        <div class="water-bar-fill" style="width: {waterPercent}%;"></div>
      </div>
    </div>
  </Card>

  <!-- Quick Stretch Routines -->
  <div class="section-header">
    <h3>Quick Stretches</h3>
    <button class="see-all-btn" on:click={() => navigateTo('library')}>
      See All ({STRETCHES.length})
    </button>
  </div>

  <div class="quick-stretches-list">
    {#each featuredStretches as item}
      <button class="stretch-card" on:click={() => navigateTo('break')}>
        <span class="material-symbols-outlined stretch-icon">{item.icon}</span>
        <div class="stretch-details">
          <h4>{item.title}</h4>
          <span>{item.duration} sec • {item.difficulty}</span>
        </div>
        <span class="material-symbols-outlined arrow-icon">chevron_right</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .home-screen {
    padding: 24px 20px 100px;
    max-width: 480px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 18px;
    box-sizing: border-box;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .greeting-text {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-h, #1f2937);
  }

  .user-occupation {
    font-size: 0.82rem;
    color: var(--text, #6b7280);
    font-weight: 500;
  }

  .profile-badge {
    background: rgba(99, 102, 241, 0.1);
    color: #6366f1;
    border: none;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .tip-card {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 16px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .tip-icon {
    font-size: 22px;
    color: #6366f1;
    flex-shrink: 0;
  }

  .tip-text {
    margin: 0;
    font-size: 0.85rem;
    color: var(--text-h, #374151);
    line-height: 1.4;
    font-weight: 500;
  }

  .hero-break {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .hero-ring-icon {
    font-size: 40px;
    color: #6366f1;
  }

  .break-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-grow: 1;
  }

  .break-tag {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #6366f1;
    letter-spacing: 0.5px;
  }

  .break-title {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-h, #1f2937);
  }

  .break-desc {
    margin: 0 0 6px;
    font-size: 0.8rem;
    color: var(--text, #6b7280);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .water-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .water-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .water-title-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .water-icon {
    font-size: 26px;
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.12);
    padding: 8px;
    border-radius: 12px;
  }

  .water-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-h, #1f2937);
  }

  .water-sub {
    font-size: 0.78rem;
    color: var(--text, #6b7280);
  }

  .water-bar-track {
    width: 100%;
    height: 8px;
    background: rgba(226, 232, 240, 0.8);
    border-radius: 4px;
    overflow: hidden;
  }

  :global(.dark-mode) .water-bar-track {
    background: rgba(51, 65, 85, 0.8);
  }

  .water-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%);
    border-radius: 4px;
    transition: width 0.4s ease;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 6px;
  }

  .section-header h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-h, #1f2937);
  }

  .see-all-btn {
    background: transparent;
    border: none;
    color: #6366f1;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .quick-stretches-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .stretch-card {
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(229, 231, 235, 0.8);
    border-radius: 16px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
    text-align: left;
    font: inherit;
    color: inherit;
  }

  :global(.dark-mode) .stretch-card {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(51, 65, 85, 0.8);
  }

  .stretch-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
  }

  .stretch-icon {
    font-size: 24px;
    color: #6366f1;
    background: rgba(99, 102, 241, 0.1);
    padding: 8px;
    border-radius: 12px;
  }

  .stretch-details {
    flex-grow: 1;
  }

  .stretch-details h4 {
    margin: 0;
    font-size: 0.92rem;
    font-weight: 600;
    color: var(--text-h, #1f2937);
  }

  .stretch-details span {
    font-size: 0.78rem;
    color: var(--text, #6b7280);
  }

  .arrow-icon {
    color: #94a3b8;
    font-size: 20px;
  }
</style>
