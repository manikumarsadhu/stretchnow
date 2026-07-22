<script>
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  import Toggle from '../components/Toggle.svelte';
  import Modal from '../components/Modal.svelte';
  import AuthModal from '../components/AuthModal.svelte';
  import { appStore, updateSettings, resetAppState, navigateTo, logoutAppwriteSession, checkAndSyncAuth } from '../stores/app.js';
  import { requestNotificationPermission } from '../utils/notifications.js';

  $: user = $appStore.user || {};
  $: settings = $appStore.settings || {};

  let isResetModalOpen = false;
  let isAuthModalOpen = false;

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

  async function handleLogout() {
    await logoutAppwriteSession();
  }

  function handleAuthClose() {
    isAuthModalOpen = false;
    checkAndSyncAuth();
  }
</script>

<div class="settings-screen animate-fade-in">
  <div class="header">
    <h2 class="title">Settings & Preferences</h2>
    <p class="subtitle">Customize notifications, work schedules, and cloud sync.</p>
  </div>

  <!-- Appwrite Cloud Account Sync Card -->
  <Card title="Appwrite Cloud Account" icon="cloud_sync" padding="md">
    <div class="account-card-body">
      {#if user.appwriteId}
        <div class="account-status-box logged-in">
          <div class="status-icon-wrap">
            <span class="material-symbols-outlined status-icon">verified_user</span>
          </div>
          <div class="status-details">
            <span class="account-name">{user.name || 'Cloud User'}</span>
            <span class="account-sub">
              {user.isAnonymous ? 'Guest Anonymous Session' : (user.email || 'Cloud Account')}
            </span>
          </div>
        </div>

        <div class="account-actions">
          <Button variant="outline" size="sm" icon="logout" onclick={handleLogout}>
            Sign Out Session
          </Button>
        </div>
      {:else}
        <div class="account-status-box logged-out">
          <p class="cloud-desc">Connect Appwrite Cloud to sync your posture streaks, water intake, and breaks across all devices.</p>
          <Button variant="primary" size="md" icon="cloud" fullWidth onclick={() => isAuthModalOpen = true}>
            Sign In / Create Appwrite Account
          </Button>
        </div>
      {/if}
    </div>
  </Card>

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
  <Card title="App System Info" icon="verified" padding="md">
    <div class="future-list">
      <div class="future-item">
        <div class="f-icon-wrap primary-light">
          <span class="material-symbols-outlined f-icon primary-color">install_mobile</span>
        </div>
        <div>
          <span class="f-title">Progressive Web App (PWA)</span>
          <span class="f-status">Service Worker ready • Installable</span>
        </div>
      </div>
      <div class="future-item">
        <div class="f-icon-wrap cyan-light">
          <span class="material-symbols-outlined f-icon cyan-color">cloud_sync</span>
        </div>
        <div>
          <span class="f-title">Data Storage</span>
          <span class="f-status">100% Local & Private</span>
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

  <!-- Appwrite Auth Modal -->
  <AuthModal isOpen={isAuthModalOpen} onclose={handleAuthClose} />

  <!-- Confirm Reset Modal -->
  {#if isResetModalOpen}
    <Modal isOpen={true} title="Reset All Data?" onclose={() => isResetModalOpen = false}>
      <p class="reset-msg">Are you sure you want to clear your local storage data? This will reset your streaks, water count, and profile preferences.</p>

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
    padding: 24px 20px 110px;
    max-width: 480px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 18px;
    box-sizing: border-box;
    background: var(--bg-gradient, transparent);
  }

  .title {
    margin: 0;
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--text-heading);
    letter-spacing: -0.02em;
  }

  .subtitle {
    margin: 4px 0 0;
    font-size: 0.88rem;
    color: var(--text-muted);
  }

  .account-card-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .cloud-desc {
    margin: 0 0 12px;
    font-size: 0.85rem;
    color: var(--text-muted);
    line-height: 1.45;
  }

  .account-status-box {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    background: var(--primary-light);
  }

  .status-icon-wrap {
    width: 36px;
    height: 36px;
    background: var(--emerald-light);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--emerald);
  }

  .status-icon {
    font-size: 20px;
  }

  .status-details {
    display: flex;
    flex-direction: column;
  }

  .account-name {
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--text-heading);
  }

  .account-sub {
    font-size: 0.78rem;
    color: var(--text-muted);
  }

  .account-actions {
    margin-top: 4px;
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
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border-card);
  }

  .info-row span {
    color: var(--text-muted);
    font-weight: 500;
  }

  .info-row strong {
    color: var(--text-heading);
    font-weight: 700;
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

  .f-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .primary-light { background: var(--primary-light); }
  .primary-color { color: var(--primary); }
  .cyan-light { background: rgba(2, 132, 199, 0.12); }
  .cyan-color { color: #0284c7; }

  .f-icon {
    font-size: 22px;
  }

  .f-title {
    display: block;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text-heading);
  }

  .f-status {
    display: block;
    font-size: 0.78rem;
    color: var(--emerald);
    font-weight: 600;
    margin-top: 2px;
  }

  .reset-wrap {
    margin-top: 10px;
  }

  .reset-msg {
    margin: 0;
    font-size: 0.9rem;
    color: var(--text-heading);
    line-height: 1.5;
  }

  .modal-footer {
    display: flex;
    gap: 10px;
  }
</style>

