<script>
  import Button from '../components/Button.svelte';
  import Card from '../components/Card.svelte';
  import { appStore, updateProfile, updateSettings, navigateTo } from '../stores/app.js';
  import { requestNotificationPermission } from '../utils/notifications.js';

  let name = $appStore.user?.name || '';
  let occupation = $appStore.user?.occupation || 'Software Engineer';
  let workStart = $appStore.user?.workStart || '09:00';
  let workEnd = $appStore.user?.workEnd || '17:00';
  let dailyBreakGoal = $appStore.user?.dailyBreakGoal || 6;
  let dailyWaterGoal = $appStore.user?.dailyWaterGoal || 8;
  let reminderIntervalMinutes = $appStore.settings?.reminderIntervalMinutes || 45;

  const OCCUPATIONS = [
    'Software Engineer',
    'Product / Graphic Designer',
    'Accountant / Finance',
    'Student / Researcher',
    'Customer Support',
    'Other Desk Worker'
  ];

  async function handleSubmit(e) {
    e.preventDefault();

    // Ask notification permission once
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
      notificationsEnabled: granted
    });

    navigateTo('home');
  }
</script>

<div class="onboarding-screen animate-fade-in">
  <div class="header">
    <div class="step-pill">
      <span class="step-dot"></span>
      <span>Personal Setup</span>
    </div>
    <h2 class="title">Tailor your routine</h2>
    <p class="subtitle">Set your schedule to get timed micro-break reminders.</p>
  </div>

  <form on:submit={handleSubmit} class="form">
    <Card padding="md">
      <!-- Name -->
      <div class="form-group">
        <label for="name">
          <span class="material-symbols-outlined label-icon">person</span>
          <span>Your Name</span>
        </label>
        <input type="text" id="name" bind:value={name} placeholder="e.g. Alex" required />
      </div>

      <!-- Occupation -->
      <div class="form-group">
        <label for="occupation">
          <span class="material-symbols-outlined label-icon">work</span>
          <span>Primary Work Role</span>
        </label>
        <select id="occupation" bind:value={occupation}>
          {#each OCCUPATIONS as occ}
            <option value={occ}>{occ}</option>
          {/each}
        </select>
      </div>

      <!-- Work Hours -->
      <div class="form-row">
        <div class="form-group">
          <label for="workStart">
            <span class="material-symbols-outlined label-icon">schedule</span>
            <span>Work Start</span>
          </label>
          <input type="time" id="workStart" bind:value={workStart} />
        </div>
        <div class="form-group">
          <label for="workEnd">
            <span class="material-symbols-outlined label-icon">logout</span>
            <span>Work End</span>
          </label>
          <input type="time" id="workEnd" bind:value={workEnd} />
        </div>
      </div>

      <!-- Break & Water Goals -->
      <div class="form-row">
        <div class="form-group">
          <label for="breakGoal">
            <span class="material-symbols-outlined label-icon">directions_run</span>
            <span>Daily Breaks</span>
          </label>
          <input type="number" id="breakGoal" min="2" max="15" bind:value={dailyBreakGoal} />
        </div>
        <div class="form-group">
          <label for="waterGoal">
            <span class="material-symbols-outlined label-icon">water_drop</span>
            <span>Water (cups)</span>
          </label>
          <input type="number" id="waterGoal" min="4" max="16" bind:value={dailyWaterGoal} />
        </div>
      </div>

      <!-- Reminder Interval -->
      <div class="form-group">
        <label for="interval">
          <span class="material-symbols-outlined label-icon">notifications_active</span>
          <span>Break Frequency</span>
        </label>
        <select id="interval" bind:value={reminderIntervalMinutes}>
          <option value={30}>Every 30 minutes</option>
          <option value={45}>Every 45 minutes (Recommended)</option>
          <option value={60}>Every 60 minutes</option>
          <option value={90}>Every 90 minutes</option>
        </select>
      </div>
    </Card>

    <div class="actions">
      <Button type="submit" variant="primary" size="lg" fullWidth icon="check_circle">
        Complete Setup & Start
      </Button>
    </div>
  </form>
</div>

<style>
  .onboarding-screen {
    min-height: 100vh;
    padding: 28px 20px 40px;
    box-sizing: border-box;
    max-width: 480px;
    margin: 0 auto;
    background: var(--bg-gradient, transparent);
  }

  .header {
    margin-bottom: 22px;
  }

  .step-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--primary-light);
    color: var(--primary);
    font-size: 0.76rem;
    font-weight: 700;
    padding: 5px 12px;
    border-radius: 99px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .step-dot {
    width: 6px;
    height: 6px;
    background: var(--primary);
    border-radius: 50%;
  }

  .title {
    margin: 10px 0 4px;
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--text-heading);
    letter-spacing: -0.02em;
  }

  .subtitle {
    margin: 0;
    font-size: 0.92rem;
    color: var(--text-muted);
    line-height: 1.45;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }

  .form-group:last-child {
    margin-bottom: 0;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.84rem;
    font-weight: 600;
    color: var(--text-heading);
  }

  .label-icon {
    font-size: 18px;
    color: var(--primary);
  }

  input, select {
    width: 100%;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-card);
    padding: 11px 14px;
    font-size: 0.95rem;
    font-family: inherit;
    background: rgba(255, 255, 255, 0.9);
    color: var(--text-heading);
    box-sizing: border-box;
    margin: 0;
    transition: all 0.2s ease;
    outline: none;
  }

  input:focus, select:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-glow);
    background: #ffffff;
  }

  :global(.dark-mode) input, :global(.dark-mode) select {
    background: rgba(30, 41, 59, 0.9);
    border-color: rgba(51, 65, 85, 0.9);
    color: #f8fafc;
  }

  :global(.dark-mode) input:focus, :global(.dark-mode) select:focus {
    background: #1e293b;
  }

  .actions {
    margin-top: 4px;
  }
</style>

