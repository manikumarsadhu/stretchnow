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

<div class="home-screen animate-fade-in">
  <!-- Header -->
  <header class="header">
    <div class="user-greeting">
      <h2 class="greeting-text">Hello, {user.name || 'Friend'} 👋</h2>
      <div class="status-pill">
        <span class="pulse-dot"></span>
        <span>Posture Active • {user.occupation || 'Desk Worker'}</span>
      </div>
    </div>
    <button class="profile-badge" on:click={() => navigateTo('settings')} aria-label="Settings">
      <span class="material-symbols-outlined">settings</span>
    </button>
  </header>

  <!-- Motivational Tip -->
  <div class="tip-card">
    <div class="tip-icon-box">
      <span class="material-symbols-outlined tip-icon">lightbulb</span>
    </div>
    <div class="tip-content">
      <span class="tip-label">Daily Tip</span>
      <p class="tip-text">{tip}</p>
    </div>
  </div>

  <!-- Hero Start Break Card -->
  <Card hover padding="lg">
    <div class="hero-break">
      <div class="break-ring">
        <ProgressRing progress={breakPercent} size={110} strokeWidth={10} color="var(--primary)">
          <span class="material-symbols-outlined hero-ring-icon">self_improvement</span>
        </ProgressRing>
      </div>

      <div class="break-info">
        <span class="break-tag">Recommended Routine</span>
        <h3 class="break-title">2-Min Posture Reset</h3>
        <p class="break-desc">
          <strong>{progress.completedBreaksToday}</strong> of <strong>{user.dailyBreakGoal || 6}</strong> daily breaks completed
        </p>

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
      iconBg="rgba(244, 63, 94, 0.15)"
      iconColor="#f43f5e"
    />
  </div>

  <!-- Water Tracker Section -->
  <Card padding="md">
    <div class="water-section">
      <div class="water-header">
        <div class="water-title-wrap">
          <div class="water-icon-wrap">
            <span class="material-symbols-outlined water-icon">water_drop</span>
          </div>
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
        <div class="stretch-icon-wrap">
          <span class="material-symbols-outlined stretch-icon">{item.icon}</span>
        </div>
        <div class="stretch-details">
          <h4>{item.title}</h4>
          <span class="stretch-meta">{item.duration} sec • {item.difficulty} • {item.category}</span>
        </div>
        <span class="material-symbols-outlined arrow-icon">arrow_forward_ios</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .home-screen {
    padding: 24px 20px 110px;
    max-width: 480px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 18px;
    box-sizing: border-box;
    background: var(--bg-gradient, transparent);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .greeting-text {
    margin: 0 0 4px;
    font-size: 1.55rem;
    font-weight: 800;
    color: var(--text-heading);
    letter-spacing: -0.02em;
  }

  .status-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-muted);
  }

  .pulse-dot {
    width: 7px;
    height: 7px;
    background: var(--emerald);
    border-radius: 50%;
    box-shadow: 0 0 8px var(--emerald);
  }

  .profile-badge {
    background: var(--bg-card);
    border: 1px solid var(--border-card);
    color: var(--primary);
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: all 0.2s ease;
  }

  .profile-badge:hover {
    transform: scale(1.05);
    background: var(--primary-light);
  }

  .tip-card {
    background: var(--bg-card);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border-card);
    border-radius: var(--radius-md);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: var(--shadow-sm);
  }

  .tip-icon-box {
    width: 36px;
    height: 36px;
    background: var(--primary-light);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .tip-icon {
    font-size: 20px;
    color: var(--primary);
  }

  .tip-content {
    display: flex;
    flex-direction: column;
  }

  .tip-label {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--primary);
    letter-spacing: 0.04em;
  }

  .tip-text {
    margin: 2px 0 0;
    font-size: 0.84rem;
    color: var(--text-heading);
    line-height: 1.4;
    font-weight: 500;
  }

  .hero-break {
    display: flex;
    align-items: center;
    gap: 18px;
  }

  .hero-ring-icon {
    font-size: 44px;
    color: var(--primary);
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
    color: var(--primary);
    letter-spacing: 0.05em;
  }

  .break-title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--text-heading);
    letter-spacing: -0.02em;
  }

  .break-desc {
    margin: 0 0 6px;
    font-size: 0.82rem;
    color: var(--text-muted);
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
    gap: 12px;
  }

  .water-icon-wrap {
    width: 40px;
    height: 40px;
    background: rgba(14, 165, 233, 0.12);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .water-icon {
    font-size: 22px;
    color: #0284c7;
  }

  .water-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-heading);
  }

  .water-sub {
    font-size: 0.78rem;
    color: var(--text-muted);
  }

  .water-bar-track {
    width: 100%;
    height: 9px;
    background: rgba(226, 232, 240, 0.8);
    border-radius: 99px;
    overflow: hidden;
  }

  :global(.dark-mode) .water-bar-track {
    background: rgba(51, 65, 85, 0.8);
  }

  .water-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #0284c7 0%, #38bdf8 100%);
    border-radius: 99px;
    transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 6px;
  }

  .section-header h3 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--text-heading);
  }

  .see-all-btn {
    background: transparent;
    border: none;
    color: var(--primary);
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    transition: opacity 0.2s ease;
  }

  .see-all-btn:hover {
    opacity: 0.8;
  }

  .quick-stretches-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .stretch-card {
    background: var(--bg-card);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border-card);
    border-radius: var(--radius-md);
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 14px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    width: 100%;
    text-align: left;
    font: inherit;
    color: inherit;
    box-shadow: var(--shadow-sm);
  }

  .stretch-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .stretch-icon-wrap {
    width: 44px;
    height: 44px;
    background: var(--primary-light);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stretch-icon {
    font-size: 24px;
    color: var(--primary);
  }

  .stretch-details {
    flex-grow: 1;
  }

  .stretch-details h4 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-heading);
  }

  .stretch-meta {
    font-size: 0.78rem;
    color: var(--text-muted);
    margin-top: 2px;
    display: block;
  }

  .arrow-icon {
    color: var(--text-muted);
    font-size: 14px;
  }
</style>

