<script>
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  import Toggle from '../components/Toggle.svelte';
  import Modal from '../components/Modal.svelte';
  import { appStore, updateProfile, updateSettings, resetAppState, navigateTo } from '../stores/app.js';
  import { requestNotificationPermission } from '../utils/notifications.js';

  $: user = $appStore.user || {};
  $: settings = $appStore.settings || {};

  let isResetModalOpen = false;

  async function handleToggleNotifications(val) {
    if (val) {
      const granted = await requestNotificationPermission();
      updateSettings({ notificationsEnabled: granted });
    } else {
      updateSettings({ notificationsEnabled: false });
    }
  }

  function handleToggleDarkMode(val) {
    updateSettings({ darkMode: val });
  }

  function handleToggleSound(val) {
    updateSettings({ soundEnabled: val });
  }

  function handleResetConfirm() {
    isResetModalOpen = false;
    resetAppState();
    navigateTo('onboarding');
  }
</script>

<div class="settings-screen">
  <div class="header">
    <h2 class="title">Settings & Preferences</h2>
    <p class="subtitle">Customize notifications, work schedules, and themes.</p>
  </div>

  <!-- Profile Card -->
  <Card title="Profile & Schedule" icon="person" padding="md">
    <div class="profile-info">
      <div class="info-row">
        <span>Name</span>
        <strong>{user.name || 'Friend'}</strong>
      </div>
      <div class="info-row">
        <span>Occupation</span>
        <strong>{user.occupation || 'Desk Worker'}</strong>
      </div>
      <div class="info-row">
        <span>Work Schedule</span>
        <strong>{user.workStart || '09:00'} - {user.workEnd || '17:00'}</strong>
      </div>
      <div class="info-row">
        <span>Daily Goals</span>
        <strong>{user.dailyBreakGoal || 6} Breaks • {user.dailyWaterGoal || 8} Water Cups</strong>
      </div>

      <div class="edit-btn-wrap">
        <Button variant="outline" size="sm" icon="edit" onclick={() => navigateTo('onboarding')}>
          Edit Profile Schedule
        </Button>
      </div>
    </div>
  </Card>

  <!-- Reminders & Preferences -->
  <Card title="Reminders & Audio" icon="notifications" padding="md">
    <div class="toggles-list">
      <Toggle
        checked={settings.notificationsEnabled}
        label="Desktop Stretch Reminders"
        description="Receive native browser alerts during work hours."
        onchange={handleToggleNotifications}
      />
      <Toggle
        checked={settings.soundEnabled}
        label="Sound Chimes"
        description="Play gentle chimes when break countdowns complete."
        onchange={handleToggleSound}
      />
      <Toggle
        checked={settings.darkMode}
        label="Dark Theme"
        description="Reduce eye strain in low-light environments."
        onchange={handleToggleDarkMode}
      />
    </div>
  </Card>

  <!-- Future Ready Placeholders -->
  <Card title="Future-Ready Features" icon="rocket_launch" padding="md">
    <div class="future-list">
      <div class="future-item">
        <span class="material-symbols-outlined f-icon">install_mobile</span>
        <div>
          <span class="f-title">Progressive Web App (PWA)</span>
          <span class="f-status">Ready for Service Worker manifest</span>
        </div>
      </div>
      <div class="future-item">
        <span class="material-symbols-outlined f-icon">cloud_sync</span>
        <div>
          <span class="f-title">Cloud Sync (Appwrite)</span>
          <span class="f-status">Placeholder endpoint configured</span>
        </div>
      </div>
      <div class="future-item">
        <span class="material-symbols-outlined f-icon">wifi_off</span>
        <div>
          <span class="f-title">Offline Cache</span>
          <span class="f-status">100% LocalStorage supported</span>
        </div>
      </div>
    </div>
  </Card>

  <!-- Reset Actions -->
  <div class="reset-wrap">
    <Button variant="danger" size="md" fullWidth icon="delete" onclick={() => isResetModalOpen = true}>
      Reset All Local Data
    </Button>
  </div>

  <!-- Confirm Reset Modal -->
  {#if isResetModalOpen}
    <Modal isOpen={true} title="Reset All Data?" onclose={() => isResetModalOpen = false}>
      <p>Are you sure you want to clear your local storage data? This will reset your streaks, water count, and profile preferences.</p>

      <div slot="footer" class="modal-footer">
        <Button variant="ghost" size="md" onclick={() => isResetModalOpen = false}>
          Cancel
        </Button>
        <Button variant="danger" size="md" icon="delete_forever" onclick={handleResetConfirm}>
          Yes, Reset Everything
        </Button>
      </div>
    </Modal>
  {/if}
</div>

<style>
  .settings-screen {
    padding: 24px 20px 100px;
    max-width: 480px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 18px;
    box-sizing: border-box;
  }

  .title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-h, #1f2937);
  }

  .subtitle {
    margin: 4px 0 0;
    font-size: 0.85rem;
    color: var(--text, #6b7280);
  }

  .profile-info {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.88rem;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  .info-row span {
    color: var(--text, #6b7280);
  }

  .info-row strong {
    color: var(--text-h, #1f2937);
  }

  .edit-btn-wrap {
    margin-top: 6px;
  }

  .toggles-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .future-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .future-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .f-icon {
    font-size: 22px;
    color: #6366f1;
    background: rgba(99, 102, 241, 0.1);
    padding: 8px;
    border-radius: 12px;
  }

  .f-title {
    display: block;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-h, #1f2937);
  }

  .f-status {
    display: block;
    font-size: 0.75rem;
    color: #10b981;
    font-weight: 500;
  }

  .reset-wrap {
    margin-top: 10px;
  }

  .modal-footer {
    display: flex;
    gap: 10px;
  }
</style>
