<script>
  import Button from '../components/Button.svelte';
  import { navigateTo } from '../stores/app.js';
</script>

<div class="welcome-screen animate-fade-in">
  <div class="hero-graphic">
    <div class="circle-bg"></div>
    <div class="circle-glow"></div>
    <div class="hero-icon-wrapper">
      <span class="material-symbols-outlined hero-icon">spa</span>
    </div>
    <div class="badge-float">
      <span class="material-symbols-outlined badge-icon">verified</span>
      <span>Desk-friendly</span>
    </div>
  </div>

  <div class="welcome-content">
    <h2 class="welcome-title">Transform your workday posture</h2>
    <p class="welcome-desc">
      Micro-breaks, targeted stretches, and smart reminders designed specifically for desk workers.
    </p>

    <div class="features-list">
      <div class="feature-item">
        <div class="feat-icon-wrap primary-gradient">
          <span class="material-symbols-outlined feat-icon">timer</span>
        </div>
        <div class="feat-info">
          <h4>2-Min Guided Breaks</h4>
          <p>Quick, effective routines right at your desk.</p>
        </div>
      </div>

      <div class="feature-item">
        <div class="feat-icon-wrap cyan-gradient">
          <span class="material-symbols-outlined feat-icon">water_drop</span>
        </div>
        <div class="feat-info">
          <h4>Hydration & Streak Score</h4>
          <p>Stay hydrated while building wellness streaks.</p>
        </div>
      </div>

      <div class="feature-item">
        <div class="feat-icon-wrap emerald-gradient">
          <span class="material-symbols-outlined feat-icon">analytics</span>
        </div>
        <div class="feat-info">
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
    <div class="login-link-wrap">
      <span>Already have an account?</span>
      <button class="login-link-btn" on:click={() => navigateTo('login')}>
        Sign In with Gmail
      </button>
    </div>
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
    background: var(--bg-gradient, transparent);
    width: 100%;
    min-width: 0;
  }

  @media (min-width: 768px) {
    .welcome-screen {
      max-width: 640px;
      justify-content: center;
      padding: 48px 32px;
    }
  }

  .hero-graphic {
    position: relative;
    height: 190px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 12px;
  }

  .circle-bg {
    position: absolute;
    width: 150px;
    height: 150px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(16, 185, 129, 0.18) 100%);
    border-radius: 50%;
  }

  .circle-glow {
    position: absolute;
    width: 120px;
    height: 120px;
    background: rgba(99, 102, 241, 0.25);
    filter: blur(25px);
    border-radius: 50%;
    animation: floatAnim 4s ease-in-out infinite;
  }

  .hero-icon-wrapper {
    position: relative;
    z-index: 2;
    width: 90px;
    height: 90px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    border-radius: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-lg);
    border: 1px solid rgba(255, 255, 255, 0.9);
  }

  :global(.dark-mode) .hero-icon-wrapper {
    background: rgba(30, 41, 59, 0.85);
    border-color: rgba(51, 65, 85, 0.9);
  }

  .hero-icon {
    font-size: 52px;
    color: var(--primary);
  }

  .badge-float {
    position: absolute;
    bottom: 15px;
    right: calc(50% - 110px);
    z-index: 3;
    background: #ffffff;
    padding: 6px 14px;
    border-radius: 99px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    font-weight: 700;
    color: #0f172a;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(226, 232, 240, 0.9);
    animation: floatAnim 3.5s ease-in-out infinite 0.5s;
  }

  :global(.dark-mode) .badge-float {
    background: #1e293b;
    color: #f8fafc;
    border-color: rgba(51, 65, 85, 0.9);
  }

  .badge-icon {
    font-size: 16px;
    color: var(--emerald);
  }

  .welcome-content {
    flex-grow: 1;
    margin-top: 16px;
  }

  .welcome-title {
    font-size: 1.85rem;
    font-weight: 800;
    margin: 0 0 10px;
    color: var(--text-heading);
    line-height: 1.25;
    letter-spacing: -0.02em;
  }

  .welcome-desc {
    font-size: 0.95rem;
    color: var(--text-muted);
    margin: 0 0 24px;
    line-height: 1.55;
  }

  .features-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: 14px;
    background: var(--bg-card);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 16px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-card);
    box-shadow: var(--shadow-sm);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .feature-item:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .feat-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .primary-gradient {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
  }

  .cyan-gradient {
    background: linear-gradient(135deg, #06b6d4, #0284c7);
  }

  .emerald-gradient {
    background: linear-gradient(135deg, #10b981, #059669);
  }

  .feat-icon {
    font-size: 22px;
    color: #ffffff;
  }

  .feat-info h4 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-heading);
  }

  .feat-info p {
    margin: 3px 0 0;
    font-size: 0.82rem;
    color: var(--text-muted);
  }

  .welcome-action {
    margin-top: 24px;
    margin-bottom: 8px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .login-link-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 0.84rem;
    color: var(--text-muted);
  }

  .login-link-btn {
    background: transparent;
    border: none;
    color: var(--primary);
    font-weight: 700;
    cursor: pointer;
    padding: 0;
  }

  .login-link-btn:hover {
    text-decoration: underline;
  }
</style>

