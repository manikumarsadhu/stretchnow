<script>
  // Presentation loader component. Routing transitions are controlled centrally in App.svelte on boot.
</script>

<div class="splash-container">
  <div class="bg-glow"></div>
  
  <div class="logo-wrapper">
    <div class="logo-pulse">
      <img src="/icon-192.png" alt="StretchNow App Logo" class="logo-img" />
    </div>
    <div class="sparkle sparkle-1"></div>
    <div class="sparkle sparkle-2"></div>
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
    background: linear-gradient(145deg, #4f46e5 0%, #6366f1 45%, #0284c7 100%);
    color: #ffffff;
    text-align: center;
    padding: 24px;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
  }

  .bg-glow {
    position: absolute;
    width: 320px;
    height: 320px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 70%);
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    animation: floatAnim 4s ease-in-out infinite;
  }

  .logo-wrapper {
    position: relative;
    margin-bottom: 28px;
  }

  .logo-pulse {
    width: 104px;
    height: 104px;
    background: rgba(255, 255, 255, 0.22);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.35);
    border-radius: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4);
    animation: splashPulse 2s infinite ease-in-out;
  }

  .logo-img {
    width: 64px;
    height: 64px;
    object-fit: contain;
    filter: drop-shadow(0 4px 12px rgba(0,0,0,0.15));
  }

  .sparkle {
    position: absolute;
    width: 8px;
    height: 8px;
    background: #ffffff;
    border-radius: 50%;
    box-shadow: 0 0 12px #ffffff;
  }
  .sparkle-1 { top: -6px; right: -6px; animation: floatAnim 3s ease-in-out infinite alternate; }
  .sparkle-2 { bottom: 0px; left: -10px; animation: floatAnim 2.5s ease-in-out infinite 0.5s alternate; }

  .splash-title {
    font-family: var(--font-heading, 'Outfit', sans-serif);
    font-size: 2.8rem;
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.03em;
    background: linear-gradient(180deg, #ffffff 0%, #e0e7ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .splash-tagline {
    font-size: 1.05rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    margin: 10px 0 40px;
    letter-spacing: -0.01em;
  }

  .loader-bar {
    width: 160px;
    height: 5px;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 99px;
    overflow: hidden;
    backdrop-filter: blur(4px);
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
  }

  .loader-fill {
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #ffffff, #a5b4fc);
    border-radius: 99px;
    animation: fillProgress 1.8s cubic-bezier(0.65, 0, 0.35, 1) forwards;
  }

  @keyframes splashPulse {
    0%, 100% { transform: scale(1); box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18); }
    50% { transform: scale(1.06); box-shadow: 0 0 35px rgba(255, 255, 255, 0.35); }
  }

  @keyframes fillProgress {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
</style>

