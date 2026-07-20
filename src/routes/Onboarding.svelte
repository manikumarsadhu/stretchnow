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

<div class="onboarding-screen">
  <div class="header">
    <span class="step-badge">Step 1 of 1</span>
    <h2 class="title">Personalize your schedule</h2>
    <p class="subtitle">We'll tailor your posture breaks and stretch goals.</p>
  </div>

  <form on:submit={handleSubmit} class="form">
    <Card padding="md">
      <!-- Name -->
      <div class="form-group">
        <label for="name">Your Name</label>
        <input type="text" id="name" bind:value={name} placeholder="e.g. Alex" required />
      </div>

      <!-- Occupation -->
      <div class="form-group">
        <label for="occupation">Primary Occupation</label>
        <select id="occupation" bind:value={occupation}>
          {#each OCCUPATIONS as occ}
            <option value={occ}>{occ}</option>
          {/each}
        </select>
      </div>

      <!-- Work Hours -->
      <div class="form-row">
        <div class="form-group">
          <label for="workStart">Work Start</label>
          <input type="time" id="workStart" bind:value={workStart} />
        </div>
        <div class="form-group">
          <label for="workEnd">Work End</label>
          <input type="time" id="workEnd" bind:value={workEnd} />
        </div>
      </div>

      <!-- Break & Water Goals -->
      <div class="form-row">
        <div class="form-group">
          <label for="breakGoal">Daily Breaks</label>
          <input type="number" id="breakGoal" min="2" max="15" bind:value={dailyBreakGoal} />
        </div>
        <div class="form-group">
          <label for="waterGoal">Water Goal (cups)</label>
          <input type="number" id="waterGoal" min="4" max="16" bind:value={dailyWaterGoal} />
        </div>
      </div>

      <!-- Reminder Interval -->
      <div class="form-group">
        <label for="interval">Stretch Reminders Every</label>
        <select id="interval" bind:value={reminderIntervalMinutes}>
          <option value={30}>30 minutes</option>
          <option value={45}>45 minutes (Recommended)</option>
          <option value={60}>60 minutes</option>
          <option value={90}>90 minutes</option>
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
    padding: 24px 20px 40px;
    box-sizing: border-box;
    max-width: 480px;
    margin: 0 auto;
  }

  .header {
    margin-bottom: 20px;
  }

  .step-badge {
    background: rgba(99, 102, 241, 0.12);
    color: #6366f1;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 20px;
    text-transform: uppercase;
  }

  .title {
    margin: 10px 0 4px;
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--text-h, #1f2937);
  }

  .subtitle {
    margin: 0;
    font-size: 0.9rem;
    color: var(--text, #6b7280);
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
    margin-bottom: 14px;
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
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-h, #374151);
  }

  input, select {
    border-radius: 12px;
    border: 1px solid rgba(209, 213, 219, 0.9);
    padding: 10px 14px;
    font-size: 0.95rem;
    background: #ffffff;
    box-sizing: border-box;
    margin: 0;
  }

  :global(.dark-mode) input, :global(.dark-mode) select {
    background: #1e293b;
    border-color: #334155;
    color: #f8fafc;
  }

  .actions {
    margin-top: 8px;
  }
</style>
