<script>
  export let id = '';
</script>

<div class="animation-container">
  {#if id === 'neck-tilt'}
    <!-- Neck Tilt Animation -->
    <svg viewBox="0 0 160 120" class="stretch-svg" aria-label="Neck tilt stretch guide">
      <!-- Chair -->
      <path d="M70,95 L70,75 L95,75 M70,75 L62,55" fill="none" stroke="var(--text-muted)" stroke-width="3" stroke-linecap="round" />
      
      <!-- Body (Torso and Legs) -->
      <path d="M80,95 L80,75 L95,75 L95,95" fill="none" stroke="#475569" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M80,75 L80,50" fill="none" stroke="var(--primary)" stroke-width="7" stroke-linecap="round" />
      
      <!-- Arms resting on thighs -->
      <path d="M80,55 L90,65 L94,74" fill="none" stroke="var(--primary-glow)" stroke-width="3" stroke-linecap="round" />

      <!-- Neck & Head (Animated) -->
      <g class="animated-neck-head">
        <!-- Neck -->
        <line x1="80" y1="50" x2="80" y2="40" stroke="var(--text-main)" stroke-width="5" stroke-linecap="round" />
        <!-- Head -->
        <circle cx="80" cy="30" r="12" fill="#fcd34d" stroke="#d97706" stroke-width="1.5" />
        <!-- Hair -->
        <path d="M68,28 C68,18 74,18 80,18 C86,18 92,18 92,28 C92,20 88,18 80,18 C72,18 68,20 68,28 Z" fill="#334155" />
        <!-- Face Features -->
        <circle cx="76" cy="30" r="1" fill="#334155" />
        <circle cx="84" cy="30" r="1" fill="#334155" />
        <path d="M77,35 Q80,37 83,35" fill="none" stroke="#334155" stroke-width="1" stroke-linecap="round" />
      </g>

      <!-- Motion Direction Arrows -->
      <path d="M55,30 A 25 25 0 0 1 105,30" fill="none" stroke="var(--emerald)" stroke-width="2" stroke-dasharray="3,3" />
      <path d="M55,30 L59,34 M55,30 L59,26" fill="none" stroke="var(--emerald)" stroke-width="2" stroke-linecap="round" />
      <path d="M105,30 L101,34 M105,30 L101,26" fill="none" stroke="var(--emerald)" stroke-width="2" stroke-linecap="round" />
    </svg>

  {:else if id === 'shoulder-rolls'}
    <!-- Shoulder Rolls Animation -->
    <svg viewBox="0 0 160 120" class="stretch-svg" aria-label="Shoulder rolls guide">
      <!-- Chair Backrest -->
      <path d="M55,95 L55,60" fill="none" stroke="var(--text-muted)" stroke-width="3" />

      <!-- Torso (Facing front) -->
      <path d="M60,95 L65,65 C68,58 72,55 80,55 C88,55 92,58 95,65 L100,95" fill="none" stroke="var(--primary)" stroke-width="8" stroke-linecap="round" />
      <!-- Head -->
      <circle cx="80" cy="40" r="11" fill="#fcd34d" stroke="#d97706" stroke-width="1.5" />
      <path d="M69,38 C69,28 75,28 80,28 C85,28 91,28 91,38 C91,30 87,28 80,28 C73,28 69,30 69,38 Z" fill="#334155" />
      <circle cx="76" cy="40" r="1" fill="#334155" />
      <circle cx="84" cy="40" r="1" fill="#334155" />
      <path d="M78,45 Q80,47 82,45" fill="none" stroke="#334155" stroke-width="1" stroke-linecap="round" />

      <!-- Left Shoulder Joint (Animated) -->
      <g class="animated-shoulder-joint-l">
        <circle cx="64" cy="62" r="5.5" fill="var(--emerald)" />
        <circle cx="64" cy="62" r="2" fill="#ffffff" />
        <path d="M64,62 L60,82 L70,82" fill="none" stroke="var(--primary-glow)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      </g>

      <!-- Right Shoulder Joint (Animated) -->
      <g class="animated-shoulder-joint-r">
        <circle cx="96" cy="62" r="5.5" fill="var(--emerald)" />
        <circle cx="96" cy="62" r="2" fill="#ffffff" />
        <path d="M96,62 L100,82 L90,82" fill="none" stroke="var(--primary-glow)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      </g>

      <!-- Roll Indicator Loops -->
      <path d="M64,72 A 8 8 0 1 1 64,52 A 8 8 0 1 1 64,72" fill="none" stroke="var(--emerald)" stroke-width="1.5" stroke-dasharray="2,2" />
      <path d="M96,72 A 8 8 0 1 1 96,52 A 8 8 0 1 1 96,72" fill="none" stroke="var(--emerald)" stroke-width="1.5" stroke-dasharray="2,2" />
    </svg>

  {:else if id === 'seated-twist'}
    <!-- Seated Twist Animation -->
    <svg viewBox="0 0 160 120" class="stretch-svg" aria-label="Seated twist guide">
      <!-- Chair Base & Backrest -->
      <path d="M50,95 L110,95 M80,95 L80,72 M65,72 L95,72 M65,72 L65,45" fill="none" stroke="var(--text-muted)" stroke-width="3.5" stroke-linecap="round" />

      <!-- Twisting Body (Animated Torso Scale/Skew) -->
      <g class="animated-torso-twist">
        <!-- Legs sitting -->
        <path d="M72,72 L86,72 L90,95" fill="none" stroke="#475569" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
        <!-- Torso -->
        <line x1="75" y1="72" x2="75" y2="44" stroke="var(--primary)" stroke-width="7.5" stroke-linecap="round" />
        <!-- Arms (Wrapping chair and knees) -->
        <path d="M75,48 C60,48 58,58 58,64" fill="none" stroke="var(--emerald)" stroke-width="3" stroke-linecap="round" />
        <path d="M75,48 C90,48 94,58 94,70" fill="none" stroke="var(--emerald)" stroke-width="3" stroke-linecap="round" />
        <!-- Head -->
        <circle cx="75" cy="28" r="10" fill="#fcd34d" stroke="#d97706" stroke-width="1.5" />
        <path d="M65,26 C65,18 70,16 75,16 C80,16 85,18 85,26 C85,20 81,18 75,18 C69,18 65,20 65,26 Z" fill="#334155" />
      </g>

      <!-- Rotation Direction Indicators -->
      <path d="M48,34 Q38,26 48,18 M102,34 Q112,26 102,18" fill="none" stroke="var(--emerald)" stroke-width="2.5" stroke-linecap="round" />
      <polygon points="48,18 43,23 51,22" fill="var(--emerald)" />
      <polygon points="102,18 107,23 99,22" fill="var(--emerald)" />
    </svg>

  {:else if id === 'wrist-extension'}
    <!-- Wrist & Forearm Extension Animation -->
    <svg viewBox="0 0 160 120" class="stretch-svg" aria-label="Wrist extension guide">
      <!-- Extending Arm (Left side) -->
      <g class="extended-arm">
        <!-- Shoulder & Arm -->
        <path d="M25,50 C35,50 45,50 65,50" fill="none" stroke="var(--primary)" stroke-width="7" stroke-linecap="round" />
        <!-- Sleeve cuffs -->
        <line x1="60" y1="46" x2="60" y2="54" stroke="var(--primary-hover)" stroke-width="2" />
        
        <!-- Extended Hand (Animated flexion) -->
        <g class="animated-stretching-hand">
          <!-- Wrist joint / Palm -->
          <path d="M65,50 L75,46 L86,41 C89,39 92,39 94,36 L102,33 C104,32 105,35 104,37 L98,42 L103,43 C105,44 105,47 103,48 L97,50 L101,52 C103,53 103,56 101,57 L93,59 L83,61 Z" fill="#fcd34d" stroke="#d97706" stroke-width="1.5" stroke-linejoin="round" />
        </g>
      </g>

      <!-- Assisting Hand (Applies pull pressure, static) -->
      <g class="assisting-hand">
        <!-- Arm coming down -->
        <path d="M102,15 L95,33" fill="none" stroke="var(--primary-glow)" stroke-width="6" stroke-linecap="round" />
        <!-- Hand fingers holding the extended fingertips -->
        <path d="M95,33 C92,34 89,38 90,44" fill="none" stroke="var(--emerald)" stroke-width="3" stroke-linecap="round" />
      </g>

      <!-- Force Arrow Indicator -->
      <path d="M88,20 L80,26 M80,26 L85,27 M80,26 L81,21" fill="none" stroke="var(--emerald)" stroke-width="2" stroke-linecap="round" />
    </svg>

  {:else if id === 'hip-opener'}
    <!-- Seated Figure-4 Hip Opener -->
    <svg viewBox="0 0 160 120" class="stretch-svg" aria-label="Hip opener guide">
      <!-- Chair Base & Backrest -->
      <path d="M45,95 L95,95 M65,95 L65,70 M50,70 L80,70 M50,70 L50,45" fill="none" stroke="var(--text-muted)" stroke-width="3.5" stroke-linecap="round" />

      <!-- Lower Body Sitting Leg & Crossed Leg -->
      <!-- Crossed leg in a figure-4 (Right ankle on Left knee) -->
      <path d="M60,70 L72,70 L72,95 M72,70 L86,70 L86,95" fill="none" stroke="#475569" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M62,70 L78,56 L55,56 L55,70" fill="none" stroke="var(--emerald)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />

      <!-- Seated Torso Hinging Forward (Animated) -->
      <g class="animated-torso-hinge">
        <!-- Spine -->
        <line x1="60" y1="70" x2="52" y2="40" stroke="var(--primary)" stroke-width="7" stroke-linecap="round" />
        <!-- Head -->
        <circle cx="48" cy="24" r="10" fill="#fcd34d" stroke="#d97706" stroke-width="1.5" />
        <path d="M38,22 C38,14 43,12 48,12 C53,12 58,14 58,22 C58,16 54,14 48,14 C42,14 38,16 38,22 Z" fill="#334155" />
      </g>

      <!-- Hinge Direction Arrow -->
      <path d="M72,25 Q58,26 56,33" fill="none" stroke="var(--emerald)" stroke-width="2" stroke-linecap="round" />
      <polygon points="56,33 54,28 60,30" fill="var(--emerald)" />
    </svg>

  {:else if id === 'eye-20-20-20'}
    <!-- 20-20-20 Eye Rest Guide -->
    <svg viewBox="0 0 160 120" class="stretch-svg" aria-label="Eye strain relief guide">
      <!-- Human Face Close-up with Eyes -->
      <!-- Left Eye -->
      <g class="animated-eye-close">
        <path d="M20,60 Q40,35 60,60 Q40,85 20,60 Z" fill="var(--primary-light)" stroke="var(--primary)" stroke-width="3" />
        <!-- Pupil -->
        <circle cx="40" cy="60" r="9" fill="#1e293b" />
        <circle cx="40" cy="60" r="5" fill="var(--emerald)" />
        <circle cx="37" cy="57" r="2" fill="#ffffff" />
      </g>

      <!-- Right Eye -->
      <g class="animated-eye-close">
        <path d="M70,60 Q90,35 110,60 Q90,85 70,60 Z" fill="var(--primary-light)" stroke="var(--primary)" stroke-width="3" />
        <!-- Pupil -->
        <circle cx="90" cy="60" r="9" fill="#1e293b" />
        <circle cx="90" cy="60" r="5" fill="var(--emerald)" />
        <circle cx="87" cy="57" r="2" fill="#ffffff" />
      </g>

      <!-- Target Object (Distant tree/mountain icon on the right) -->
      <g class="distant-target">
        <polygon points="140,55 132,75 148,75" fill="var(--emerald)" />
        <polygon points="140,43 135,60 145,60" fill="var(--emerald)" />
        <line x1="140" y1="75" x2="140" y2="82" stroke="#d97706" stroke-width="2.5" />
      </g>

      <!-- Visual focal waves toward the tree -->
      <g class="focal-rays">
        <path d="M102,60 L128,60 M102,55 L128,58 M102,65 L128,62" fill="none" stroke="var(--emerald)" stroke-width="1.5" stroke-dasharray="3,3" />
      </g>
    </svg>

  {:else if id === 'box-breathing'}
    <!-- Box Breathing Lungs Animation -->
    <svg viewBox="0 0 160 120" class="stretch-svg" aria-label="Box breathing lungs guide">
      <!-- Human chest outline -->
      <path d="M40,95 C45,72 55,60 80,60 C105,60 115,72 120,95" fill="none" stroke="var(--text-muted)" stroke-width="2.5" />
      <!-- Airway -->
      <path d="M80,25 L80,45" fill="none" stroke="var(--text-muted)" stroke-width="3" stroke-linecap="round" />

      <!-- Animated Lungs (Expanding and Contracting) -->
      <g class="animated-breathing-lungs">
        <!-- Left Lung -->
        <path d="M78,42 C72,36 58,38 56,52 C54,66 62,80 77,82 C78,82 79,78 79,70 Z" fill="var(--primary-light)" stroke="var(--primary)" stroke-width="4" stroke-linejoin="round" />
        <!-- Right Lung -->
        <path d="M82,42 C88,36 102,38 104,52 C106,66 98,80 83,82 C82,82 81,78 81,70 Z" fill="var(--primary-light)" stroke="var(--primary)" stroke-width="4" stroke-linejoin="round" />
      </g>

      <!-- Dynamic Breathing Phase Guide Overlay -->
      <g class="breathing-guide-box">
        <!-- Frame -->
        <rect x="5" y="5" width="150" height="110" rx="14" fill="none" stroke="var(--border-card)" stroke-width="2.5" />
        <!-- Moving tracer dot -->
        <circle cx="5" cy="5" r="5" fill="var(--emerald)" class="tracer-dot" />
        
        <!-- Breathing Text Indicators in corners -->
        <g class="breathing-labels">
          <text x="80" y="103" text-anchor="middle" class="breath-text inhale">INHALE (4S)</text>
          <text x="80" y="103" text-anchor="middle" class="breath-text hold-1">HOLD (4S)</text>
          <text x="80" y="103" text-anchor="middle" class="breath-text exhale">EXHALE (4S)</text>
          <text x="80" y="103" text-anchor="middle" class="breath-text hold-2">HOLD (4S)</text>
        </g>
      </g>
    </svg>
  {/if}
</div>

<style>
  .animation-container {
    width: 100%;
    height: 180px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(226, 232, 240, 0.25) 100%);
    border-radius: var(--radius-md, 18px);
    border: 1px solid var(--border-card);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 10px;
    box-sizing: border-box;
    position: relative;
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.02);
  }

  :global(.dark-mode) .animation-container {
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.3) 0%, rgba(15, 23, 42, 0.4) 100%);
    border-color: rgba(255, 255, 255, 0.05);
  }

  .stretch-svg {
    height: 100%;
    max-width: 100%;
    overflow: visible;
  }

  /* 1. Neck Tilt Animation */
  .animated-neck-head {
    transform-origin: 80px 50px;
    animation: neckTiltLoop 6s ease-in-out infinite;
  }

  @keyframes neckTiltLoop {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(20deg); }
    50% { transform: rotate(0deg); }
    75% { transform: rotate(-20deg); }
  }

  /* 2. Shoulder Roll Animations */
  .animated-shoulder-joint-l {
    transform-origin: 64px 62px;
    animation: shoulderCircularL 3.5s linear infinite;
  }

  .animated-shoulder-joint-r {
    transform-origin: 96px 62px;
    animation: shoulderCircularR 3.5s linear infinite;
  }

  @keyframes shoulderCircularL {
    0% { transform: translate(0, 0); }
    25% { transform: translate(-3px, -5px); }
    50% { transform: translate(0, 0); }
    75% { transform: translate(3px, 5px); }
    100% { transform: translate(0, 0); }
  }

  @keyframes shoulderCircularR {
    0% { transform: translate(0, 0); }
    25% { transform: translate(3px, -5px); }
    50% { transform: translate(0, 0); }
    75% { transform: translate(-3px, 5px); }
    100% { transform: translate(0, 0); }
  }

  /* 3. Seated Spinal Twist Animation */
  .animated-torso-twist {
    transform-origin: 75px 72px;
    animation: spinalTwistLoop 6s ease-in-out infinite;
  }

  @keyframes spinalTwistLoop {
    0%, 100% { transform: scaleX(1); }
    25% { transform: scaleX(0.72) skewY(4deg); }
    50% { transform: scaleX(1); }
    75% { transform: scaleX(0.72) skewY(-4deg); }
  }

  /* 4. Wrist Extension Animation */
  .animated-stretching-hand {
    transform-origin: 65px 50px;
    animation: wristExtendLoop 4s ease-in-out infinite;
  }

  @keyframes wristExtendLoop {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(-26deg); }
  }

  /* 5. Figure-4 Hip Opener Hinge */
  .animated-torso-hinge {
    transform-origin: 60px 70px;
    animation: hipHingeLoop 5s ease-in-out infinite;
  }

  @keyframes hipHingeLoop {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(20deg); }
  }

  /* 6. Eye Strain Blinking / Rays */
  .animated-eye-close {
    transform-origin: 50% 50%;
    animation: eyeBlinkLoop 4s ease-in-out infinite;
  }

  .focal-rays path {
    animation: radarWaves 2s ease-in-out infinite;
  }

  @keyframes eyeBlinkLoop {
    0%, 90%, 100% { transform: scaleY(1); }
    95% { transform: scaleY(0.12); }
  }

  @keyframes radarWaves {
    0% { opacity: 0.1; stroke-dashoffset: 0; }
    50% { opacity: 1; }
    100% { opacity: 0.1; stroke-dashoffset: -10; }
  }

  /* 7. Lungs Breathing / Tracer Dot */
  .animated-breathing-lungs {
    transform-origin: 80px 60px;
    animation: lungsBreathLoop 8s ease-in-out infinite;
  }

  .tracer-dot {
    animation: traceBoxGuide 8s linear infinite;
  }

  .breath-text {
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    opacity: 0;
  }

  .breath-text.inhale {
    fill: var(--primary);
    animation: textInhale 8s steps(1) infinite;
  }

  .breath-text.hold-1 {
    fill: var(--emerald);
    animation: textHold1 8s steps(1) infinite;
  }

  .breath-text.exhale {
    fill: var(--rose);
    animation: textExhale 8s steps(1) infinite;
  }

  .breath-text.hold-2 {
    fill: var(--amber);
    animation: textHold2 8s steps(1) infinite;
  }

  @keyframes lungsBreathLoop {
    0%, 100%, 75% { transform: scale(0.85); }
    25%, 50% { transform: scale(1.15); }
  }

  @keyframes traceBoxGuide {
    /* Top: 0-25%, Right: 25-50%, Bottom: 50-75%, Left: 75-100% */
    0% { cx: 5px; cy: 5px; }
    25% { cx: 155px; cy: 5px; }
    50% { cx: 155px; cy: 115px; }
    75% { cx: 5px; cy: 115px; }
    100% { cx: 5px; cy: 5px; }
  }

  @keyframes textInhale {
    0%, 24.9% { opacity: 1; }
    25%, 100% { opacity: 0; }
  }

  @keyframes textHold1 {
    0%, 24.9% { opacity: 0; }
    25%, 49.9% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }

  @keyframes textExhale {
    0%, 49.9% { opacity: 0; }
    50%, 74.9% { opacity: 1; }
    75%, 100% { opacity: 0; }
  }

  @keyframes textHold2 {
    0%, 74.9% { opacity: 0; }
    75%, 99.9% { opacity: 1; }
    100% { opacity: 0; }
  }
</style>
