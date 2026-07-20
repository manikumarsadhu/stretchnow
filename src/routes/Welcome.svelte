<script>
  import Button from '../components/Button.svelte';
  import { navigateTo } from '../stores/app.js';
</script>

<div class="welcome-screen">
  <div class="hero-graphic">
    <div class="circle-bg"></div>
    <span class="material-symbols-outlined hero-icon">spa</span>
  </div>

  <div class="welcome-content">
    <h2 class="welcome-title">Transform your workday posture</h2>
    <p class="welcome-desc">
      Micro-breaks, targeted stretches, and smart reminders designed specifically for desk workers.
    </p>

    <div class="features-list">
      <div class="feature-item">
        <span class="material-symbols-outlined feat-icon">timer</span>
        <div>
          <h4>2-Min Guided Breaks</h4>
          <p>Quick, effective routines right at your desk.</p>
        </div>
      </div>

      <div class="feature-item">
        <span class="material-symbols-outlined feat-icon">water_drop</span>
        <div>
          <h4>Hydration & Score Tracking</h4>
          <p>Stay hydrated while building wellness streaks.</p>
        </div>
      </div>

      <div class="feature-item">
        <span class="material-symbols-outlined feat-icon">analytics</span>
        <div>
          <h4>Personal Analytics</h4>
          <p>Visualize daily breaks and posture habits.</p>
        </div>
      </div>
    </div>
  </div>

  <div class="welcome-action">
    <Button variant="primary" size="lg" fullWidth icon="arrow_forward" onclick={() => navigateTo('onboarding')}>
      Get Started
    </Button>
  </div>
</div>

<style>
  .welcome-screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 32px 24px;
    box-sizing: border-box;
    max-width: 480px;
    margin: 0 auto;
  }

  .hero-graphic {
    position: relative;
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 16px;
  }

  .circle-bg {
    position: absolute;
    width: 140px;
    height: 140px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%);
    border-radius: 50%;
  }

  .hero-icon {
    font-size: 80px;
    color: #6366f1;
    z-index: 1;
  }

  .welcome-content {
    flex-grow: 1;
    margin-top: 24px;
  }

  .welcome-title {
    font-size: 1.8rem;
    font-weight: 700;
    margin: 0 0 12px;
    color: var(--text-h, #1f2937);
    line-height: 1.25;
  }

  .welcome-desc {
    font-size: 0.95rem;
    color: var(--text, #6b7280);
    margin: 0 0 28px;
    line-height: 1.5;
  }

  .features-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .feature-item {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    background: rgba(248, 250, 252, 0.8);
    padding: 14px 16px;
    border-radius: 16px;
    border: 1px solid rgba(226, 232, 240, 0.8);
  }

  :global(.dark-mode) .feature-item {
    background: rgba(30, 41, 59, 0.6);
    border-color: rgba(51, 65, 85, 0.8);
  }

  .feat-icon {
    font-size: 24px;
    color: #6366f1;
    background: rgba(99, 102, 241, 0.1);
    padding: 8px;
    border-radius: 12px;
    flex-shrink: 0;
  }

  .feature-item h4 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-h, #1f2937);
  }

  .feature-item p {
    margin: 2px 0 0;
    font-size: 0.8rem;
    color: var(--text, #6b7280);
  }

  .welcome-action {
    margin-top: 24px;
  }
</style>
