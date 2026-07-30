<script>
  import neckVideo from '../media/neck excercise video.mp4';
  import shoulderRollsVideo from '../media/shoulder_rolls.mp4';
  import seatedSpinalVideo from '../media/seated_spinal.mp4';
  import { getAppwriteStorageVideoUrl } from '../lib/appwrite.js';

  export let id = '';
  export let poseName = '';
  export let duration = 3;
  export let videoUrl = '';
  export let posterOnly = false;
  export let active = true;

  let isZoomed = false;
  let animateMotion = active;

  /** @type {Record<string, string>} */
  const CLOUD_STORAGE_FILES = {
    'neck-tilt': '6a6af236001a9cd9ec67',
    'shoulder-rolls': '6a6b290f000b5e85b843',
    'seated-twist': '6a6b2d900008c793435b'
  };

  /** @type {Record<string, string>} */
  const VIDEO_MAP = {
    'neck-tilt': neckVideo,
    'shoulder-rolls': shoulderRollsVideo,
    'seated-twist': seatedSpinalVideo
  };

  /** @type {Record<string, string>} */
  const POSTER_MAP = {
    'neck-tilt': '/images/stretches/neck-tilt.png',
    'shoulder-rolls': '/images/stretches/shoulder-rolls.png',
    'seated-twist': '/images/stretches/seated-twist.png',
    'wrist-extension': '/images/stretches/wrist-extension.png',
    'hip-opener': '/images/stretches/hip-opener.png',
    'eye-20-20-20': '/images/stretches/eye-20-20-20.png',
    'box-breathing': '/images/stretches/box-breathing.png'
  };

  /** Movement labels for easy visual identification */
  const MOTION_LABELS = {
    'neck-tilt': '↔️ Tilt Head Side-to-Side',
    'shoulder-rolls': '🔄 Roll Shoulders Backward',
    'seated-twist': '🔁 Twist Torso Smoothly',
    'wrist-extension': '⬆️ Pull Fingers Backward',
    'hip-opener': '⤵️ Hinge Hips Forward',
    'eye-20-20-20': '👀 Focus Softly 20ft Away',
    'box-breathing': '🫁 4s Inhale • Hold • Exhale'
  };

  let videoElement = null;

  $: cloudVideoUrl = CLOUD_STORAGE_FILES[id] ? getAppwriteStorageVideoUrl(CLOUD_STORAGE_FILES[id]) : null;
  $: videoSrc = videoUrl || VIDEO_MAP[id] || cloudVideoUrl;
  $: posterSrc = POSTER_MAP[id] || `/images/stretches/${id}.png`;
  $: motionLabel = MOTION_LABELS[id] || '✨ Follow Stretch Motion';

  $: if (videoElement && videoSrc) {
    videoElement.play().catch(() => {});
  }
</script>

<div class="poster-container {posterOnly ? 'poster-only' : ''} {animateMotion ? 'animated-mode' : ''}">
  <div class="poster-wrapper">
    {#if videoSrc && !posterOnly}
      <video
        bind:this={videoElement}
        src={videoSrc}
        autoplay
        loop
        muted
        playsinline
        poster={posterSrc}
        class="stretch-video stretch-{id}"
      >
        <track kind="captions" />
      </video>
    {:else}
      <img
        src={posterSrc}
        alt="Real men stretch poster guide for {id}"
        class="poster-img stretch-{id} {animateMotion ? 'active-motion' : ''}"
      />
    {/if}
    
    <!-- Motion Overlay Animations & Target Hotspots (Only shown when not playing video) -->
    {#if !videoSrc || posterOnly}
      {#if id === 'neck-tilt'}
        <div class="motion-overlay neck-tilt-motion">
          <div class="motion-arc-line neck-arc"></div>
          <span class="material-symbols-outlined motion-arrow left">arrow_back</span>
          <span class="hotspot-node neck-node" title="Target: Neck & Upper Traps"></span>
          <span class="material-symbols-outlined motion-arrow right">arrow_forward</span>
        </div>
      {:else if id === 'shoulder-rolls'}
        <div class="motion-overlay shoulder-rolls-motion">
          <div class="roll-ring roll-left"></div>
          <span class="hotspot-node shoulder-left-node"></span>
          <span class="hotspot-node shoulder-right-node"></span>
          <div class="roll-ring roll-right"></div>
        </div>
      {:else if id === 'seated-twist'}
        <div class="motion-overlay twist-motion">
          <span class="material-symbols-outlined twist-icon">sync</span>
          <span class="hotspot-node spine-node"></span>
        </div>
      {:else if id === 'wrist-extension'}
        <div class="motion-overlay wrist-motion">
          <span class="material-symbols-outlined pull-icon">arrow_upward</span>
          <span class="hotspot-node wrist-node"></span>
        </div>
      {:else if id === 'hip-opener'}
        <div class="motion-overlay hip-motion">
          <span class="material-symbols-outlined hinge-icon">keyboard_arrow_down</span>
          <span class="hotspot-node hip-node"></span>
        </div>
      {:else if id === 'box-breathing'}
        <div class="motion-overlay breathing-overlay">
          <div class="breath-ring outer"></div>
          <div class="breath-ring inner"></div>
          <span class="breath-tag">4s Box</span>
        </div>
      {:else}
        <div class="motion-overlay generic-motion">
          <span class="hotspot-node generic-node"></span>
        </div>
      {/if}

      <!-- Top Badge with Clear Movement Label -->
      <div class="poster-badge-bar">
        <div class="poster-badge">
          <span class="material-symbols-outlined badge-icon">motion_photos_on</span>
          <span>{motionLabel}</span>
        </div>
      </div>

      <!-- Action Controls (Play/Pause Motion & Fullscreen Zoom) -->
      <div class="poster-controls">
        <button
          class="ctrl-btn {animateMotion ? 'active' : ''}"
          on:click={() => animateMotion = !animateMotion}
          aria-label="Toggle motion animation"
          title={animateMotion ? "Pause movement animation" : "Play movement animation"}
        >
          <span class="material-symbols-outlined">{animateMotion ? 'pause_circle' : 'play_circle'}</span>
        </button>

        <button
          class="ctrl-btn"
          on:click={() => isZoomed = !isZoomed}
          aria-label="Toggle full poster preview"
          title="View full poster"
        >
          <span class="material-symbols-outlined">{isZoomed ? 'close' : 'fullscreen'}</span>
        </button>
      </div>
    {/if}
  </div>
</div>

{#if isZoomed}
  <div
    class="full-poster-modal animate-fade-in"
    on:click={() => isZoomed = false}
    on:keydown={(e) => e.key === 'Escape' && (isZoomed = false)}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    aria-label="Full resolution poster preview"
  >
    <div
      class="full-poster-card"
      on:click|stopPropagation={() => {}}
      on:keydown|stopPropagation={() => {}}
      role="presentation"
    >
      <img src={posterSrc} alt="Full resolution real men stretch poster" class="full-poster-img" />
      <button class="modal-close-btn" on:click={() => isZoomed = false} aria-label="Close poster view">
        <span class="material-symbols-outlined">close</span>
      </button>
      <div class="modal-poster-caption">
        <span class="material-symbols-outlined">verified</span>
        <span>Real Men Stretch Poster • {motionLabel}</span>
      </div>
    </div>
  </div>
{/if}

<style>
  .poster-container {
    width: 100%;
    height: 220px;
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
    border-radius: var(--radius-md, 18px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    overflow: hidden;
    position: relative;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  }

  .poster-container.poster-only {
    height: 100%;
    min-height: 180px;
  }

  .poster-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  /* Core Poster Image Styling & Hover */
  .poster-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 20%;
    transition: transform 0.4s ease, filter 0.4s ease;
    will-change: transform;
  }

  .stretch-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--radius-md, 12px);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
  }

  .poster-container:hover .poster-img {
    filter: brightness(1.08);
  }

  /* ----------------------------------------------------
     PHYSICAL EXERCISE POSTER ANIMATIONS
     Direct movements applied to the poster image
  ----------------------------------------------------- */

  /* Neck Tilt: Realistic Side-to-Side Head Tilting */
  .poster-img.stretch-neck-tilt.active-motion {
    animation: posterNeckTilt 4s ease-in-out infinite alternate;
  }
  @keyframes posterNeckTilt {
    0% { transform: rotate(-5deg) translateX(-8px) scale(1.02); }
    50% { transform: rotate(0deg) translateX(0px) scale(1); }
    100% { transform: rotate(5deg) translateX(8px) scale(1.02); }
  }

  /* Shoulder Rolls: Smooth Circular Shoulder Movement */
  .poster-img.stretch-shoulder-rolls.active-motion {
    animation: posterShoulderRoll 3.5s cubic-bezier(0.45, 0, 0.2, 1) infinite;
  }
  @keyframes posterShoulderRoll {
    0% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(5px, -7px) scale(1.03); }
    50% { transform: translate(0, -9px) scale(1.04); }
    75% { transform: translate(-5px, -3px) scale(1.02); }
    100% { transform: translate(0, 0) scale(1); }
  }

  /* Seated Twist: Torso Rotation Perspective Sway */
  .poster-img.stretch-seated-twist.active-motion {
    animation: posterSeatedTwist 4.5s ease-in-out infinite alternate;
  }
  @keyframes posterSeatedTwist {
    0% { transform: perspective(600px) rotateY(-8deg) scale(1.03); }
    100% { transform: perspective(600px) rotateY(8deg) scale(1.03); }
  }

  /* Wrist Extension: Flex and Extend Backward Pulling */
  .poster-img.stretch-wrist-extension.active-motion {
    animation: posterWristFlex 3s ease-in-out infinite alternate;
  }
  @keyframes posterWristFlex {
    0% { transform: translateY(4px) rotate(2deg) scale(1); }
    100% { transform: translateY(-6px) rotate(-3deg) scale(1.04); }
  }

  /* Hip Opener: Forward Hinge Bounce Motion */
  .poster-img.stretch-hip-opener.active-motion {
    transform-origin: bottom center;
    animation: posterHipHinge 4s ease-in-out infinite alternate;
  }
  @keyframes posterHipHinge {
    0% { transform: perspective(600px) rotateX(10deg) translateY(6px) scale(1.03); }
    100% { transform: perspective(600px) rotateX(0deg) translateY(-2px) scale(1); }
  }

  /* Eye Strain Relief: Soft Lens Zoom Focus */
  .poster-img.stretch-eye-20-20-20.active-motion {
    animation: posterEyeFocus 4.5s ease-in-out infinite alternate;
  }
  @keyframes posterEyeFocus {
    0% { transform: scale(1); filter: brightness(100%); }
    100% { transform: scale(1.06); filter: brightness(112%) contrast(108%); }
  }

  /* Box Breathing: Rhythmic Expansion & Contraction */
  .poster-img.stretch-box-breathing.active-motion {
    animation: posterBreathe 6s ease-in-out infinite alternate;
  }
  @keyframes posterBreathe {
    0% { transform: scale(0.97); }
    50% { transform: scale(1.07); }
    100% { transform: scale(0.97); }
  }

  /* ----------------------------------------------------
     MOTION OVERLAYS & TARGET MUSCLE HOTSPOTS
  ----------------------------------------------------- */

  .motion-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Muscle Target Hotspot Node */
  .hotspot-node {
    position: absolute;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #10b981;
    border: 2px solid #ffffff;
    box-shadow: 0 0 16px #10b981, 0 0 0 4px rgba(16, 185, 129, 0.4);
    animation: hotspotPulse 2s ease-in-out infinite alternate;
    z-index: 2;
  }

  @keyframes hotspotPulse {
    0% { transform: scale(0.85); box-shadow: 0 0 8px #10b981, 0 0 0 2px rgba(16, 185, 129, 0.3); }
    100% { transform: scale(1.3); box-shadow: 0 0 22px #10b981, 0 0 0 8px rgba(16, 185, 129, 0); }
  }

  .neck-node { top: 32%; left: 50%; transform: translateX(-50%); }
  .shoulder-left-node { top: 36%; left: 35%; }
  .shoulder-right-node { top: 36%; right: 35%; }
  .spine-node { top: 48%; left: 50%; transform: translate(-50%, -50%); }
  .wrist-node { top: 52%; left: 44%; }
  .hip-node { top: 58%; left: 50%; transform: translateX(-50%); }
  .generic-node { top: 45%; left: 50%; transform: translateX(-50%); }

  /* Neck Tilt Overlay */
  .neck-tilt-motion {
    gap: 64px;
  }
  .motion-arc-line {
    position: absolute;
    width: 140px;
    height: 50px;
    border: 2px dashed rgba(16, 185, 129, 0.8);
    border-color: transparent transparent rgba(16, 185, 129, 0.9) transparent;
    border-radius: 50%;
    top: 24%;
    animation: arcWave 3s ease-in-out infinite alternate;
  }
  @keyframes arcWave {
    0% { transform: rotate(-6deg); }
    100% { transform: rotate(6deg); }
  }
  .motion-arrow {
    font-size: 26px;
    color: #ffffff;
    background: rgba(16, 185, 129, 0.6);
    backdrop-filter: blur(4px);
    border-radius: 50%;
    padding: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: sidePulse 2s ease-in-out infinite alternate;
  }
  .motion-arrow.left { animation-delay: 0s; }
  .motion-arrow.right { animation-delay: 1s; }

  /* Shoulder Rolls Overlay */
  .shoulder-rolls-motion {
    gap: 84px;
  }
  .roll-ring {
    width: 40px;
    height: 40px;
    border: 2px dashed rgba(16, 185, 129, 0.9);
    border-radius: 50%;
    animation: spinRing 3s linear infinite;
  }

  /* Twist Overlay */
  .twist-icon {
    font-size: 44px;
    color: #ffffff;
    background: rgba(99, 102, 241, 0.55);
    backdrop-filter: blur(6px);
    border-radius: 50%;
    padding: 10px;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
    animation: twistSpin 4.5s ease-in-out infinite;
  }

  /* Wrist Overlay */
  .pull-icon {
    font-size: 34px;
    color: #ffffff;
    background: rgba(16, 185, 129, 0.55);
    backdrop-filter: blur(4px);
    border-radius: 50%;
    padding: 8px;
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
    animation: pullUp 2.5s ease-in-out infinite;
  }

  /* Hip Opener Overlay */
  .hinge-icon {
    font-size: 38px;
    color: #ffffff;
    background: rgba(245, 158, 11, 0.55);
    backdrop-filter: blur(4px);
    border-radius: 50%;
    padding: 6px;
    box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);
    animation: bounceDown 2s ease-in-out infinite;
  }

  /* Breathing Overlay */
  .breathing-overlay {
    position: absolute;
    inset: 0;
  }
  .breath-ring {
    position: absolute;
    border-radius: 50%;
    border: 2px solid rgba(16, 185, 129, 0.8);
  }
  .breath-ring.outer {
    width: 90px;
    height: 90px;
    animation: breathPulseOuter 6s ease-in-out infinite;
  }
  .breath-ring.inner {
    width: 50px;
    height: 50px;
    animation: breathPulseInner 6s ease-in-out infinite;
  }
  .breath-tag {
    position: absolute;
    bottom: 25px;
    background: rgba(16, 185, 129, 0.85);
    color: #ffffff;
    font-weight: 800;
    font-size: 0.75rem;
    padding: 3px 9px;
    border-radius: 99px;
    letter-spacing: 0.04em;
  }

  /* ----------------------------------------------------
     BADGES & TOP CONTROLS
  ----------------------------------------------------- */

  .poster-badge-bar {
    position: absolute;
    top: 12px;
    left: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 3;
  }

  .poster-badge {
    background: rgba(15, 23, 42, 0.82);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 99px;
    padding: 5px 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.74rem;
    font-weight: 700;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .badge-icon {
    font-size: 15px;
    color: var(--emerald, #10b981);
    animation: pulseBadge 1.8s ease-in-out infinite alternate;
  }

  @keyframes pulseBadge {
    from { opacity: 0.7; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1.1); }
  }

  .poster-controls {
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    z-index: 3;
  }

  .ctrl-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(15, 23, 42, 0.82);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .ctrl-btn:hover {
    background: rgba(99, 102, 241, 0.9);
    transform: scale(1.08);
  }

  .ctrl-btn.active {
    border-color: #10b981;
    color: #10b981;
  }

  .ctrl-btn .material-symbols-outlined {
    font-size: 20px;
  }

  /* Modal Fullscreen Preview */
  .full-poster-modal {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(15, 23, 42, 0.92);
    backdrop-filter: blur(14px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
  }

  .full-poster-card {
    position: relative;
    max-width: 540px;
    width: 100%;
    max-height: 88vh;
    background: #0f172a;
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
    display: flex;
    flex-direction: column;
  }

  .full-poster-img {
    width: 100%;
    max-height: 75vh;
    object-fit: cover;
    display: block;
  }

  .modal-close-btn {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .modal-poster-caption {
    padding: 16px 20px;
    background: #1e293b;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.92rem;
    font-weight: 700;
  }

  .modal-poster-caption .material-symbols-outlined {
    color: var(--emerald, #10b981);
  }

  /* Keyframe Animations */
  @keyframes sidePulse {
    0% { transform: translateX(-5px) scale(0.95); opacity: 0.7; }
    100% { transform: translateX(5px) scale(1.1); opacity: 1; }
  }

  @keyframes spinRing {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes twistSpin {
    0%, 100% { transform: rotate(0deg) scale(1); }
    50% { transform: rotate(180deg) scale(1.15); }
  }

  @keyframes pullUp {
    0%, 100% { transform: translateY(4px); }
    50% { transform: translateY(-7px); }
  }

  @keyframes bounceDown {
    0%, 100% { transform: translateY(-5px); }
    50% { transform: translateY(7px); }
  }

  @keyframes breathPulseOuter {
    0%, 100% { transform: scale(0.7); opacity: 0.3; }
    50% { transform: scale(1.35); opacity: 0.95; }
  }

  @keyframes breathPulseInner {
    0%, 100% { transform: scale(1.2); opacity: 0.9; }
    50% { transform: scale(0.6); opacity: 0.4; }
  }
</style>
