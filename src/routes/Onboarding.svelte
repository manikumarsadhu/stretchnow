<script>
  import Button from '../components/Button.svelte';
  import Card from '../components/Card.svelte';
  import { appStore, updateProfile, updateSettings, navigateTo } from '../stores/app.js';
  import { requestNotificationPermission } from '../utils/notifications.js';

  let step = 1;
  const TOTAL_STEPS = 4;

  // Step 1 fields
  let name = $appStore.user?.name || '';
  let occupation = $appStore.user?.occupation || 'Software Engineer';

  // Step 2 fields
  let workStart = $appStore.user?.workStart || '09:00';
  let workEnd = $appStore.user?.workEnd || '17:00';
  let lunchStart = $appStore.settings?.smartSchedule?.lunchStart || '12:00';
  let lunchEnd = $appStore.settings?.smartSchedule?.lunchEnd || '13:00';
  let hasLunch = false;
  let reminderIntervalMinutes = $appStore.settings?.reminderIntervalMinutes || 45;

  // Step 3 fields
  let dailyBreakGoal = $appStore.user?.dailyBreakGoal || 6;
  let dailyWaterGoal = $appStore.user?.dailyWaterGoal || 8;
  let stretchFocus = 'full';

  const OCCUPATIONS = [
    'Software Engineer',
    'Product / Graphic Designer',
    'Accountant / Finance',
    'Student / Researcher',
    'Customer Support',
    'Other Desk Worker'
  ];

  const STRETCH_FOCUSES = [
    { id: 'full',  label: 'Full Body',   icon: 'accessibility_new', desc: 'Balanced routine for all areas' },
    { id: 'upper', label: 'Upper Body',  icon: 'person',            desc: 'Neck, shoulders & back relief' },
    { id: 'eyes',  label: 'Eye Relief',  icon: 'visibility',        desc: 'Screen fatigue & eye strain' },
    { id: 'lower', label: 'Lower Body',  icon: 'directions_walk',   desc: 'Hip flexors & leg circulation' },
  ];

  // Live reminder schedule preview
  function generateReminderTimes(start, end, interval) {
    const times = [];
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin   = eh * 60 + em;
    let cur = startMin + Number(interval);
    while (cur < endMin && times.length < 6) {
      const h = Math.floor(cur / 60) % 24;
      const m = cur % 60;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12  = h % 12 || 12;
      times.push(`${h12}:${String(m).padStart(2, '0')} ${ampm}`);
      cur += Number(interval);
    }
    return times;
  }

  $: reminderTimes = generateReminderTimes(workStart, workEnd, reminderIntervalMinutes);

  function nextStep() { if (step < TOTAL_STEPS) step++; }
  function prevStep() { if (step > 1) step--; }

  async function saveAndNavigate(dest) {
    const granted = await requestNotificationPermission();
    updateProfile({
      name: name.trim() || 'Friend',
      occupation,
      workStart,
      workEnd,
      dailyBreakGoal: Number(dailyBreakGoal),
      dailyWaterGoal: Number(dailyWaterGoal),
      onboarded: true
    });
    updateSettings({
      reminderIntervalMinutes: Number(reminderIntervalMinutes),
      notificationsEnabled: granted,
      smartSchedule: hasLunch ? { lunchStart, lunchEnd, weekendMode: false } : undefined
    });
    navigateTo(dest);
  }
</script>

<div class="onboarding-screen animate-fade-in">

  <!-- Step Progress Bar -->
  <div class="progress-header">
    <div class="step-indicators">
      {#each Array(TOTAL_STEPS) as _, i}
        <div class="step-dot-wrapper">
          <div
            class="step-circle {i + 1 < step ? 'done' : i + 1 === step ? 'active' : 'pending'}"
            aria-label="Step {i + 1}"
          >
            {#if i + 1 < step}
              <span class="material-symbols-outlined step-check-icon">check</span>
            {:else}
              <span class="step-num">{i + 1}</span>
            {/if}
          </div>
          {#if i < TOTAL_STEPS - 1}
            <div class="step-connector {i + 1 < step ? 'filled' : ''}"></div>
          {/if}
        </div>
      {/each}
    </div>
    <span class="step-label-text">Step {step} of {TOTAL_STEPS}</span>
  </div>

  <!-- ── STEP 1: Welcome ── -->
  {#if step === 1}
    <div class="step-content animate-fade-in">
      <div class="step-hero">
        <div class="hero-orb">
          <span class="material-symbols-outlined hero-icon">spa</span>
        </div>
        <div class="hero-badge-float">
          <span class="material-symbols-outlined" style="font-size:14px;color:var(--emerald)">verified</span>
          Desk-friendly
        </div>
      </div>

      <div class="step-header">
        <p class="step-tagline">Welcome to StretchNow</p>
        <h2 class="step-title">Let's personalize your wellness routine</h2>
        <p class="step-desc">We'll tailor StretchNow to fit your workday in just a few steps.</p>
      </div>

      <Card padding="md">
        <div class="form-group">
          <label for="ob-name">
            <span class="material-symbols-outlined label-icon">person</span>
            Your Name
          </label>
          <input type="text" id="ob-name" bind:value={name} placeholder="e.g. Alex" autocomplete="given-name" />
        </div>
        <div class="form-group last-group">
          <label for="ob-occupation">
            <span class="material-symbols-outlined label-icon">work</span>
            Primary Work Role
          </label>
          <select id="ob-occupation" bind:value={occupation}>
            {#each OCCUPATIONS as occ}
              <option value={occ}>{occ}</option>
            {/each}
          </select>
        </div>
      </Card>

      <div class="step-actions">
        <Button variant="primary" size="lg" fullWidth icon="arrow_forward" onclick={nextStep}>
          Get Started
        </Button>
      </div>
    </div>

  <!-- ── STEP 2: Work Schedule ── -->
  {:else if step === 2}
    <div class="step-content animate-fade-in">
      <div class="step-header">
        <p class="step-tagline">Work Schedule</p>
        <h2 class="step-title">When do you work?</h2>
        <p class="step-desc">Reminders will only arrive during your work hours — no disruptions outside.</p>
      </div>

      <Card padding="md">
        <div class="form-row">
          <div class="form-group">
            <label for="ob-start">
              <span class="material-symbols-outlined label-icon">schedule</span>
              Work Start
            </label>
            <input type="time" id="ob-start" bind:value={workStart} />
          </div>
          <div class="form-group">
            <label for="ob-end">
              <span class="material-symbols-outlined label-icon">logout</span>
              Work End
            </label>
            <input type="time" id="ob-end" bind:value={workEnd} />
          </div>
        </div>

        <div class="form-group">
          <label for="ob-interval">
            <span class="material-symbols-outlined label-icon">notifications_active</span>
            Break Frequency
          </label>
          <select id="ob-interval" bind:value={reminderIntervalMinutes}>
            <option value={30}>Every 30 minutes</option>
            <option value={45}>Every 45 minutes (Recommended)</option>
            <option value={60}>Every 60 minutes</option>
            <option value={90}>Every 90 minutes</option>
          </select>
        </div>

        <div class="lunch-row">
          <span class="lunch-label">
            <span class="material-symbols-outlined label-icon">restaurant</span>
            Skip during lunch break
          </span>
          <button
            class="toggle-btn {hasLunch ? 'on' : 'off'}"
            type="button"
            on:click={() => hasLunch = !hasLunch}
            aria-pressed={hasLunch}
            aria-label="Toggle lunch break"
          >
            <span class="toggle-knob"></span>
          </button>
        </div>

        {#if hasLunch}
          <div class="form-row animate-fade-in" style="margin-top:12px">
            <div class="form-group last-group">
              <label for="ob-lunch-s">
                <span class="material-symbols-outlined label-icon">free_breakfast</span>
                Lunch Start
              </label>
              <input type="time" id="ob-lunch-s" bind:value={lunchStart} />
            </div>
            <div class="form-group last-group">
              <label for="ob-lunch-e">
                <span class="material-symbols-outlined label-icon">lunch_dining</span>
                Lunch End
              </label>
              <input type="time" id="ob-lunch-e" bind:value={lunchEnd} />
            </div>
          </div>
        {/if}
      </Card>

      <!-- Live Reminder Preview -->
      <div class="reminder-preview">
        <div class="preview-header">
          <span class="material-symbols-outlined preview-icon">schedule_send</span>
          <span class="preview-title">You'll receive reminders at:</span>
        </div>
        <div class="preview-times">
          {#each reminderTimes as t}
            <span class="preview-pill">{t}</span>
          {/each}
          {#if reminderTimes.length === 0}
            <span class="preview-empty">Adjust your hours to see reminders</span>
          {:else if reminderTimes.length >= 6}
            <span class="preview-pill faded">…and more</span>
          {/if}
        </div>
      </div>

      <div class="step-actions two-col">
        <Button variant="outline" size="lg" icon="arrow_back" onclick={prevStep}>Back</Button>
        <Button variant="primary" size="lg" icon="arrow_forward" onclick={nextStep}>Next</Button>
      </div>
    </div>

  <!-- ── STEP 3: Wellness Goals ── -->
  {:else if step === 3}
    <div class="step-content animate-fade-in">
      <div class="step-header">
        <p class="step-tagline">Wellness Goals</p>
        <h2 class="step-title">Set your daily targets</h2>
        <p class="step-desc">You can adjust these anytime in Settings.</p>
      </div>

      <!-- Recommendation Banner -->
      <div class="rec-banner">
        <div class="rec-banner-header">
          <span class="material-symbols-outlined rec-icon">thumb_up</span>
          <span class="rec-title">Recommended for desk workers</span>
        </div>
        <div class="rec-items">
          <span class="rec-item"><span class="material-symbols-outlined rec-check">check_circle</span>6 breaks/day</span>
          <span class="rec-item"><span class="material-symbols-outlined rec-check">check_circle</span>8 glasses water</span>
          <span class="rec-item"><span class="material-symbols-outlined rec-check">check_circle</span>2-min stretches</span>
        </div>
      </div>

      <Card padding="md">
        <div class="form-row steppers-row">
          <!-- Break Goal Stepper -->
          <div class="stepper-group">
            <label>
              <span class="material-symbols-outlined label-icon">self_improvement</span>
              Daily Breaks
            </label>
            <div class="stepper">
              <button class="stepper-btn" type="button" on:click={() => dailyBreakGoal = Math.max(2, dailyBreakGoal - 1)} aria-label="Decrease breaks">−</button>
              <span class="stepper-val">{dailyBreakGoal}</span>
              <button class="stepper-btn" type="button" on:click={() => dailyBreakGoal = Math.min(20, dailyBreakGoal + 1)} aria-label="Increase breaks">+</button>
            </div>
            <span class="stepper-unit">breaks / day</span>
          </div>
          <!-- Water Goal Stepper -->
          <div class="stepper-group">
            <label>
              <span class="material-symbols-outlined label-icon">water_drop</span>
              Water Goal
            </label>
            <div class="stepper">
              <button class="stepper-btn" type="button" on:click={() => dailyWaterGoal = Math.max(2, dailyWaterGoal - 1)} aria-label="Decrease water">−</button>
              <span class="stepper-val">{dailyWaterGoal}</span>
              <button class="stepper-btn" type="button" on:click={() => dailyWaterGoal = Math.min(20, dailyWaterGoal + 1)} aria-label="Increase water">+</button>
            </div>
            <span class="stepper-unit">cups / day</span>
          </div>
        </div>

        <!-- Stretch Focus Grid -->
        <div class="focus-section">
          <label>
            <span class="material-symbols-outlined label-icon">fitness_center</span>
            Stretch Focus
          </label>
          <div class="focus-grid">
            {#each STRETCH_FOCUSES as f}
              <button
                type="button"
                class="focus-card {stretchFocus === f.id ? 'active' : ''}"
                on:click={() => stretchFocus = f.id}
                aria-pressed={stretchFocus === f.id}
              >
                <span class="material-symbols-outlined focus-card-icon">{f.icon}</span>
                <span class="focus-card-label">{f.label}</span>
                <span class="focus-card-desc">{f.desc}</span>
              </button>
            {/each}
          </div>
        </div>
      </Card>

      <div class="step-actions two-col">
        <Button variant="outline" size="lg" icon="arrow_back" onclick={prevStep}>Back</Button>
        <Button variant="primary" size="lg" icon="arrow_forward" onclick={nextStep}>Next</Button>
      </div>
    </div>

  <!-- ── STEP 4: Ready! ── -->
  {:else if step === 4}
    <div class="step-content animate-fade-in">
      <div class="ready-hero">
        <div class="ready-ring">
          <span class="material-symbols-outlined ready-icon">celebration</span>
        </div>
        <div class="confetti" aria-hidden="true">🎉 ✨ 🌟 🎊 ✨</div>
      </div>

      <div class="step-header" style="text-align:center">
        <h2 class="step-title">You're all set, {name.trim() || 'Friend'}!</h2>
        <p class="step-desc">Your wellness journey starts now. Here's your daily plan:</p>
      </div>

      <Card padding="md">
        <div class="ready-goals">
          <div class="ready-goal">
            <div class="ready-goal-icon" style="background:var(--primary-light)">
              <span class="material-symbols-outlined" style="color:var(--primary);font-size:22px">self_improvement</span>
            </div>
            <span class="ready-val">{dailyBreakGoal}</span>
            <span class="ready-lbl">Breaks</span>
          </div>
          <div class="ready-goal-divider"></div>
          <div class="ready-goal">
            <div class="ready-goal-icon" style="background:rgba(14,165,233,0.12)">
              <span class="material-symbols-outlined" style="color:#0284c7;font-size:22px">water_drop</span>
            </div>
            <span class="ready-val">{dailyWaterGoal}</span>
            <span class="ready-lbl">Water cups</span>
          </div>
          <div class="ready-goal-divider"></div>
          <div class="ready-goal">
            <div class="ready-goal-icon" style="background:var(--emerald-light)">
              <span class="material-symbols-outlined" style="color:var(--emerald);font-size:22px">timer</span>
            </div>
            <span class="ready-val">2</span>
            <span class="ready-lbl">Min each</span>
          </div>
        </div>
      </Card>

      <div class="schedule-summary">
        <span class="material-symbols-outlined" style="font-size:18px;color:var(--primary);flex-shrink:0">notifications_active</span>
        <span>Reminders every <strong>{reminderIntervalMinutes} min</strong> · <strong>{workStart}</strong> to <strong>{workEnd}</strong></span>
      </div>

      <div class="step-actions ready-actions">
        <Button variant="primary" size="lg" fullWidth icon="play_arrow" onclick={() => saveAndNavigate('break')}>
          Start My First Break
        </Button>
        <button class="skip-link" type="button" on:click={() => saveAndNavigate('home')}>
          Skip to Dashboard →
        </button>
      </div>
    </div>
  {/if}

</div>

<style>
  .onboarding-screen {
    min-height: 100vh;
    padding: 24px 20px 44px;
    box-sizing: border-box;
    max-width: 480px;
    margin: 0 auto;
    background: var(--bg-gradient, transparent);
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* ── Step Progress Bar ── */
  .progress-header {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .step-indicators {
    display: flex;
    align-items: center;
    width: 100%;
  }

  .step-dot-wrapper {
    display: flex;
    align-items: center;
    flex: 1;
  }

  .step-dot-wrapper:last-child { flex: none; }

  .step-circle {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.3s ease, box-shadow 0.3s ease;
  }

  .step-circle.pending {
    background: var(--bg-card);
    border: 2px solid var(--border-card);
    color: var(--text-muted);
  }

  .step-circle.active {
    background: var(--primary);
    border: 2px solid var(--primary);
    color: #fff;
    box-shadow: 0 0 0 4px var(--primary-glow);
  }

  .step-circle.done {
    background: var(--emerald);
    border: 2px solid var(--emerald);
    color: #fff;
  }

  .step-num { font-size: 0.84rem; font-weight: 800; }

  .step-check-icon { font-size: 18px; }

  .step-connector {
    flex: 1;
    height: 3px;
    background: var(--border-card);
    border-radius: 99px;
    margin: 0 4px;
    transition: background 0.35s ease;
  }

  .step-connector.filled { background: var(--emerald); }

  .step-label-text {
    font-size: 0.74rem;
    font-weight: 700;
    color: var(--text-muted);
    text-align: right;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* ── Step Content ── */
  .step-content {
    display: flex;
    flex-direction: column;
    gap: 18px;
    flex: 1;
  }

  /* ── Step 1 Hero ── */
  .step-hero {
    position: relative;
    height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hero-orb {
    width: 106px;
    height: 106px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary-light) 0%, var(--emerald-light) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-lg);
    animation: floatAnim 4s ease-in-out infinite;
  }

  .hero-icon { font-size: 56px; color: var(--primary); }

  .hero-badge-float {
    position: absolute;
    bottom: 4px;
    left: calc(50% + 28px);
    background: #fff;
    border: 1px solid var(--border-card);
    border-radius: 99px;
    padding: 5px 12px;
    font-size: 0.75rem;
    font-weight: 700;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 5px;
    box-shadow: var(--shadow-sm);
    animation: floatAnim 3.5s ease-in-out infinite 0.5s;
  }

  :global(.dark-mode) .hero-badge-float {
    background: #1e293b;
    color: #f8fafc;
    border-color: rgba(51,65,85,0.9);
  }

  /* ── Step Header ── */
  .step-header { display: flex; flex-direction: column; gap: 4px; }

  .step-tagline {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--primary);
  }

  .step-title {
    margin: 0;
    font-size: 1.65rem;
    font-weight: 800;
    color: var(--text-heading);
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .step-desc {
    margin: 2px 0 0;
    font-size: 0.9rem;
    color: var(--text-muted);
    line-height: 1.5;
  }

  /* ── Form Elements ── */
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }

  .form-group.last-group { margin-bottom: 0; }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 16px;
  }

  label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.84rem;
    font-weight: 600;
    color: var(--text-heading);
  }

  .label-icon { font-size: 18px; color: var(--primary); }

  input, select {
    width: 100%;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--border-card);
    padding: 11px 14px;
    font-size: 0.95rem;
    font-family: inherit;
    background: rgba(255,255,255,0.9);
    color: var(--text-heading);
    box-sizing: border-box;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    outline: none;
    min-height: 44px;
  }

  input:focus, select:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-glow);
    background: #fff;
  }

  :global(.dark-mode) input, :global(.dark-mode) select {
    background: rgba(30,41,59,0.9);
    border-color: rgba(51,65,85,0.9);
    color: #f8fafc;
  }

  :global(.dark-mode) input:focus, :global(.dark-mode) select:focus {
    background: #1e293b;
  }

  /* ── Lunch Toggle ── */
  .lunch-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0 0;
    border-top: 1px solid var(--border-card);
    margin-top: 4px;
  }

  .lunch-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.84rem;
    font-weight: 600;
    color: var(--text-heading);
  }

  .toggle-btn {
    width: 48px;
    height: 28px;
    border-radius: 99px;
    border: none;
    cursor: pointer;
    padding: 3px;
    display: flex;
    align-items: center;
    transition: background 0.25s ease;
    flex-shrink: 0;
    min-width: 48px;
    min-height: 28px;
  }

  .toggle-btn.on  { background: var(--primary);     justify-content: flex-end; }
  .toggle-btn.off { background: var(--border-card);  justify-content: flex-start; }

  .toggle-knob {
    width: 22px;
    height: 22px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  }

  /* ── Reminder Preview ── */
  .reminder-preview {
    background: var(--primary-light);
    border: 1px solid rgba(99,102,241,0.2);
    border-radius: var(--radius-md);
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .preview-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .preview-icon { font-size: 18px; color: var(--primary); }

  .preview-title {
    font-size: 0.78rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--primary);
  }

  .preview-times { display: flex; flex-wrap: wrap; gap: 6px; }

  .preview-pill {
    background: rgba(255,255,255,0.85);
    border: 1px solid rgba(99,102,241,0.25);
    border-radius: 99px;
    padding: 4px 12px;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--primary);
  }

  :global(.dark-mode) .preview-pill {
    background: rgba(30,41,59,0.8);
    color: #818cf8;
    border-color: rgba(129,140,248,0.3);
  }

  .preview-pill.faded { opacity: 0.55; font-style: italic; }
  .preview-empty { font-size: 0.8rem; color: var(--primary); opacity: 0.7; }

  /* ── Recommendation Banner ── */
  .rec-banner {
    background: var(--emerald-light);
    border: 1px solid rgba(16,185,129,0.25);
    border-radius: var(--radius-md);
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .rec-banner-header { display: flex; align-items: center; gap: 8px; }

  .rec-icon { font-size: 18px; color: var(--emerald); }

  .rec-title {
    font-size: 0.78rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--emerald);
  }

  .rec-items { display: flex; gap: 16px; flex-wrap: wrap; }

  .rec-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-heading);
  }

  .rec-check { font-size: 16px; color: var(--emerald); }

  /* ── Stepper ── */
  .steppers-row { margin-bottom: 0; }

  .stepper-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    text-align: center;
  }

  .stepper-group label { justify-content: center; }

  .stepper {
    display: flex;
    align-items: center;
    border: 1.5px solid var(--border-card);
    border-radius: var(--radius-sm);
    overflow: hidden;
    background: rgba(255,255,255,0.9);
    width: 100%;
  }

  :global(.dark-mode) .stepper {
    background: rgba(30,41,59,0.9);
    border-color: rgba(51,65,85,0.9);
  }

  .stepper-btn {
    width: 44px;
    height: 44px;
    font-size: 1.3rem;
    font-weight: 700;
    background: var(--primary-light);
    border: none;
    color: var(--primary);
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.2s;
  }

  .stepper-btn:hover { background: rgba(99,102,241,0.18); }

  .stepper-val {
    flex: 1;
    text-align: center;
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--text-heading);
  }

  .stepper-unit {
    font-size: 0.72rem;
    color: var(--text-muted);
    font-weight: 600;
  }

  /* ── Focus Grid ── */
  .focus-section {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .focus-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .focus-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 14px 8px;
    border-radius: var(--radius-sm);
    border: 2px solid var(--border-card);
    background: var(--bg-card);
    cursor: pointer;
    transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
    text-align: center;
    min-height: 44px;
  }

  .focus-card:hover { border-color: var(--primary); background: var(--primary-light); }

  .focus-card.active {
    border-color: var(--primary);
    background: var(--primary-light);
    box-shadow: 0 0 0 3px var(--primary-glow);
  }

  .focus-card-icon {
    font-size: 26px;
    color: var(--text-muted);
    transition: color 0.2s;
  }

  .focus-card.active .focus-card-icon { color: var(--primary); }

  .focus-card-label {
    font-size: 0.82rem;
    font-weight: 800;
    color: var(--text-heading);
  }

  .focus-card-desc {
    font-size: 0.7rem;
    color: var(--text-muted);
    line-height: 1.3;
  }

  /* ── Step 4 Ready ── */
  .ready-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding-top: 4px;
  }

  .ready-ring {
    width: 94px;
    height: 94px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary) 0%, var(--emerald) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 0 12px var(--primary-glow), var(--shadow-lg);
    animation: readyPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  @keyframes readyPop {
    from { transform: scale(0.5); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
  }

  .ready-icon { font-size: 54px; color: #fff; }

  .confetti {
    font-size: 1.4rem;
    letter-spacing: 6px;
    animation: fadeIn 0.8s 0.4s ease both;
  }

  .ready-goals {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 8px 0;
  }

  .ready-goal {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    flex: 1;
    padding: 8px 4px;
  }

  .ready-goal-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ready-goal-divider {
    width: 1px;
    height: 60px;
    background: var(--border-card);
    flex-shrink: 0;
  }

  .ready-val {
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--text-heading);
    line-height: 1;
  }

  .ready-lbl {
    font-size: 0.72rem;
    color: var(--text-muted);
    font-weight: 600;
    text-align: center;
  }

  .schedule-summary {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--primary-light);
    border: 1px solid rgba(99,102,241,0.2);
    border-radius: var(--radius-sm);
    padding: 12px 16px;
    font-size: 0.85rem;
    color: var(--text-heading);
    line-height: 1.45;
  }

  /* ── Actions ── */
  .step-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: auto;
  }

  .step-actions.two-col {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px;
  }

  .ready-actions { display: flex; flex-direction: column; gap: 10px; }

  .skip-link {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    text-align: center;
    padding: 8px;
    transition: color 0.2s;
  }

  .skip-link:hover { color: var(--primary); }

  /* ── Animations ── */
  @keyframes floatAnim {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-6px); }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Reduced Motion ── */
  @media (prefers-reduced-motion: reduce) {
    .hero-orb, .hero-badge-float, .ready-ring, .confetti { animation: none; }
    .animate-fade-in { animation: none; }
  }
</style>
