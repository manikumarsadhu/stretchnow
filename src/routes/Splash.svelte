<script>
  import { onMount } from 'svelte';
  import { appStore, navigateTo } from '../stores/app.js';

  onMount(() => {
    const timer = setTimeout(() => {
      if ($appStore.user?.onboarded) {
        navigateTo('home');
      } else {
        navigateTo('welcome');
      }
    }, 1800);

    return () => clearTimeout(timer);
  });
</script>

<div class="splash-container">
  <div class="logo-pulse">
    <span class="material-symbols-outlined logo-icon">self_improvement</span>
  </div>
  <h1 class="splash-title">StretchNow</h1>
  <p class="splash-tagline">Feel better. Sit smarter. Stretch now.</p>
  
  <div class="loader-bar">
    <div class="loader-fill"></div>
  </div>
</div>

<style>
  .splash-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
    color: #ffffff;
    text-align: center;
    padding: 24px;
    box-sizing: border-box;
  }

  .logo-pulse {
    width: 96px;
    height: 96px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(8px);
    border-radius: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    animation: pulse 1.6s infinite ease-in-out;
  }

  .logo-icon {
    font-size: 54px;
    color: #ffffff;
  }

  .splash-title {
    font-size: 2.5rem;
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.5px;
  }

  .splash-tagline {
    font-size: 1rem;
    opacity: 0.85;
    margin: 8px 0 32px;
  }

  .loader-bar {
    width: 140px;
    height: 4px;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 4px;
    overflow: hidden;
  }

  .loader-fill {
    width: 100%;
    height: 100%;
    background: #ffffff;
    animation: fillProgress 1.8s ease-in-out forwards;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
    50% { transform: scale(1.06); box-shadow: 0 0 0 16px rgba(255, 255, 255, 0); }
  }

  @keyframes fillProgress {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
</style>
