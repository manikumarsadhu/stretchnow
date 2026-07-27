<script>
  import { onMount } from 'svelte';
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  import Toggle from '../components/Toggle.svelte';
  import Modal from '../components/Modal.svelte';
  import AuthModal from '../components/AuthModal.svelte';
  import { appStore, updateSettings, resetAppState, navigateTo, logoutAppwriteSession, checkAndSyncAuth, importBackupAction, updateProfile } from '../stores/app.js';
  import { requestNotificationPermission } from '../utils/notifications.js';
  import { exportBackup, importBackup } from '../services/backup.js';
  import { runSystemDiagnostics } from '../services/diagnostics.js';
  import { loadLocale } from '../utils/i18n.js';

  $: user = $appStore.user || {};
  $: settings = $appStore.settings || {};

  let isResetModalOpen = false;
  let isAuthModalOpen = false;

  /** @type {Awaited<ReturnType<typeof runSystemDiagnostics>> | null} */
  let diagnosticsData = null;
  let isRunningDiagnostics = false;
  let importError = '';
  let importSuccess = false;

  async function triggerDiagnostics() {
    isRunningDiagnostics = true;
    try {
      diagnosticsData = await runSystemDiagnostics();
    } catch (err) {
      console.error(err);
    } finally {
      isRunningDiagnostics = false;
    }
  }

  function handleExport() {
    exportBackup($appStore);
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    importError = '';
    importSuccess = false;
    try {
      const data = await importBackup(file);
      importBackupAction(data);
      importSuccess = true;
      triggerDiagnostics();
    } catch (err) {
      const error = /** @type {any} */ (err);
      importError = error.message;
    }
  }

  onMount(() => {
    triggerDiagnostics();
  });

  async function handleToggleNotifications(val) {
    if (val) {
      const granted = await requestNotificationPermission();
      updateSettings({ notificationsEnabled: granted });
    } else {
      updateSettings({ notificationsEnabled: false });
    }
  }

  function handleToggleSound(val) {
    updateSettings({ soundEnabled: val });
  }

  function handleSelectTheme(e) {
    updateSettings({ theme: e.target.value });
  }

  function handleToggleLargeText(val) {
    updateSettings({ largeTextEnabled: val });
  }

  function handleToggleHighContrast(val) {
    updateSettings({ highContrastEnabled: val });
  }

  function handleToggleWeekendMode(val) {
    const smartSchedule = settings.smartSchedule || {};
    updateSettings({
      smartSchedule: {
        ...smartSchedule,
        weekendMode: val
      }
    });
  }

  function handleToggleMeetingMode(val) {
    const smartSchedule = settings.smartSchedule || {};
    updateSettings({
      smartSchedule: {
        ...smartSchedule,
        activeMeetingMode: val
      }
    });
  }

  function handleLunchStartChange(e) {
    const smartSchedule = settings.smartSchedule || {};
    updateSettings({
      smartSchedule: {
        ...smartSchedule,
        lunchStart: e.target.value
      }
    });
  }

  function handleLunchEndChange(e) {
    const smartSchedule = settings.smartSchedule || {};
    updateSettings({
      smartSchedule: {
        ...smartSchedule,
        lunchEnd: e.target.value
      }
    });
  }

  function handleSnoozeDurationChange(e) {
    const smartSchedule = settings.smartSchedule || {};
    updateSettings({
      smartSchedule: {
        ...smartSchedule,
        snoozeDuration: Number(e.target.value)
      }
    });
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

  function handleSelectLanguage(e) {
    const lang = e.target.value;
    loadLocale(lang);
    updateProfile({ language: lang });
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
      <div class="info-row select-row">
        <span>App Language</span>
        <select class="settings-lang-select" value={user.language || 'en'} on:change={handleSelectLanguage}>
          <option value="en">English</option>
          <option value="te">తెలుగు (Telugu)</option>
          <option value="hi">हिन्दी (Hindi)</option>
        </select>
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

      {#if settings.notificationsEnabled}
        <div class="alert-mode-section animate-fade-in">
          <span class="section-label">Alert Mode</span>
          <div class="mode-selector-grid">
            <button
              class="mode-btn {settings.alertMode === 'tone' ? 'active' : ''}"
              on:click={() => updateSettings({ alertMode: 'tone' })}
              aria-label="Sound / Tone mode"
            >
              <span class="material-symbols-outlined mode-icon">volume_up</span>
              <span class="mode-text">Sound / Tone</span>
            </button>
            <button
              class="mode-btn {settings.alertMode === 'vibrate' ? 'active' : ''}"
              on:click={() => updateSettings({ alertMode: 'vibrate' })}
              aria-label="Vibrate Only mode"
            >
              <span class="material-symbols-outlined mode-icon">vibration</span>
              <span class="mode-text">Vibrate Only</span>
            </button>
            <button
              class="mode-btn {settings.alertMode === 'silent' ? 'active' : ''}"
              on:click={() => updateSettings({ alertMode: 'silent' })}
              aria-label="Silent Mode"
            >
              <span class="material-symbols-outlined mode-icon">volume_mute</span>
              <span class="mode-text">Silent Mode</span>
            </button>
          </div>
        </div>
      {/if}

      <Toggle
        checked={settings.soundEnabled}
        label="Sound Chimes"
        description="Play gentle chimes when break countdowns complete."
        onchange={handleToggleSound}
      />
    </div>
  </Card>

  <!-- Theme Options -->
  <Card title="Visual Theme" icon="palette" padding="md">
    <div class="theme-select-section">
      <span class="section-label">App Color Theme</span>
      <select class="preference-select" value={settings.theme || 'system'} on:change={handleSelectTheme}>
        <option value="system">🖥️ System Preference</option>
        <option value="light">☀️ Light Theme</option>
        <option value="dark">🌙 Dark Theme</option>
        <option value="blue">🌊 Ocean Blue Theme</option>
        <option value="green">🍃 Forest Green Theme</option>
      </select>
    </div>
  </Card>

  <!-- Smart Work Schedule preferences -->
  <Card title="Smart Work Schedule" icon="calendar_month" padding="md">
    <div class="smart-schedule-list">
      <Toggle
        checked={settings.smartSchedule?.activeMeetingMode || false}
        label="Meeting Mode (DND)"
        description="Temporarily pause all stretch break reminders."
        onchange={handleToggleMeetingMode}
      />
      <Toggle
        checked={settings.smartSchedule?.weekendMode || false}
        label="Weekend Mode"
        description="Allow reminders on Saturdays and Sundays."
        onchange={handleToggleWeekendMode}
      />
      
      <div class="schedule-inputs-grid">
        <div class="input-item">
          <label class="input-label" for="lunchStart">Lunch Start</label>
          <input
            id="lunchStart"
            type="time"
            value={settings.smartSchedule?.lunchStart || '12:00'}
            on:change={handleLunchStartChange}
          />
        </div>
        <div class="input-item">
          <label class="input-label" for="lunchEnd">Lunch End</label>
          <input
            id="lunchEnd"
            type="time"
            value={settings.smartSchedule?.lunchEnd || '13:00'}
            on:change={handleLunchEndChange}
          />
        </div>
      </div>

      <div class="snooze-duration-wrap">
        <label class="input-label" for="snooze">Snooze Duration (minutes)</label>
        <select id="snooze" class="preference-select" value={settings.smartSchedule?.snoozeDuration || 15} on:change={handleSnoozeDurationChange}>
          <option value={5}>5 minutes</option>
          <option value={10}>10 minutes</option>
          <option value={15}>15 minutes (Default)</option>
          <option value={30}>30 minutes</option>
        </select>
      </div>
    </div>
  </Card>

  <!-- Accessibility Toggles -->
  <Card title="Accessibility" icon="accessibility_new" padding="md">
    <div class="accessibility-list">
      <Toggle
        checked={settings.largeTextEnabled || false}
        label="Large Text Mode"
        description="Increases typography sizes across all screens."
        onchange={handleToggleLargeText}
      />
      <Toggle
        checked={settings.highContrastEnabled || false}
        label="High Contrast Mode"
        description="Sharper color bounds and darker texts."
        onchange={handleToggleHighContrast}
      />
      <div class="keyboard-guide">
        <span class="material-symbols-outlined guide-icon">keyboard</span>
        <p class="guide-text">During active breaks, you can use: <strong>Space</strong> (Pause), <strong>S</strong> (Skip), <strong>R</strong> (Reset), or <strong>Esc</strong> (Quit).</p>
      </div>
    </div>
  </Card>

  <!-- Backup & Restore -->
  <Card title="Backup & Restore" icon="backup" padding="md">
    <div class="backup-card-body">
      <p class="backup-desc">Export a copy of your preferences and statistics, or restore them from a JSON file.</p>
      
      <div class="backup-actions-btns">
        <Button variant="secondary" size="md" icon="download" onclick={handleExport}>
          Export Backup JSON
        </Button>
        
        <label class="import-file-btn">
          <span class="material-symbols-outlined btn-ico">upload</span>
          <span>Import Backup JSON</span>
          <input type="file" accept=".json" on:change={handleImport} style="display: none;" />
        </label>
      </div>

      {#if importSuccess}
        <div class="import-status success animate-fade-in">
          <span class="material-symbols-outlined status-ico">check_circle</span>
          <span>Backup imported successfully! Dashboard updated.</span>
        </div>
      {/if}
      {#if importError}
        <div class="import-status error animate-fade-in">
          <span class="material-symbols-outlined status-ico">error</span>
          <span>{importError}</span>
        </div>
      {/if}
    </div>
  </Card>

  <!-- System Diagnostics & Troubleshooting -->
  <Card title="System Diagnostics" icon="verified" padding="md">
    <div class="diagnostics-card-body">
      <div class="diag-header-row">
        <p class="diag-desc">Live status of your browser and device integrations.</p>
        <button class="diag-refresh-btn" on:click={triggerDiagnostics} disabled={isRunningDiagnostics}>
          <span class="material-symbols-outlined diag-ref-ico {isRunningDiagnostics ? 'spinning' : ''}">autorenew</span>
        </button>
      </div>

      {#if diagnosticsData}
        <div class="diag-grid">
          <div class="diag-item">
            <span class="diag-lbl">Notifications</span>
            <span class="diag-val badge-{diagnosticsData.notifications === 'granted' ? 'success' : 'warn'}">
              {diagnosticsData.notifications}
            </span>
          </div>

          <div class="diag-item">
            <span class="diag-lbl">Service Worker</span>
            <span class="diag-val badge-{diagnosticsData.serviceWorker === 'active' ? 'success' : 'warn'}">
              {diagnosticsData.serviceWorker}
            </span>
          </div>

          <div class="diag-item">
            <span class="diag-lbl">Storage Quota</span>
            <span class="diag-val">{diagnosticsData.storageQuota}</span>
          </div>

          <div class="diag-item">
            <span class="diag-lbl">Network Status</span>
            <span class="diag-val badge-{diagnosticsData.offlineMode === 'online' ? 'success' : 'warn'}">
              {diagnosticsData.offlineMode}
            </span>
          </div>

          <div class="diag-item">
            <span class="diag-lbl">Audio Synth</span>
            <span class="diag-val badge-{diagnosticsData.audioSupport ? 'success' : 'error'}">
              {diagnosticsData.audioSupport ? 'Compatible' : 'Unsupported'}
            </span>
          </div>

          <div class="diag-item">
            <span class="diag-lbl">PWA Installed</span>
            <span class="diag-val badge-{diagnosticsData.pwaInstalled ? 'success' : 'inactive'}">
              {diagnosticsData.pwaInstalled ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      {:else}
        <p class="diag-loading">Loading system report...</p>
      {/if}
    </div>
  </Card>

  <!-- Privacy Dashboard -->
  <Card title="Privacy Settings" icon="lock" padding="md">
    <div class="privacy-dashboard-body">
      <p class="privacy-desc">StretchNow is designed on privacy-first principles:</p>
      
      <ul class="privacy-list">
        <li>
          <span class="material-symbols-outlined priv-ico success-color">check_circle</span>
          <div class="priv-text-wrap">
            <strong>100% Offline-First</strong>
            <span>All data, hydration logs, and preferences stay on your device local storage.</span>
          </div>
        </li>
        <li>
          <span class="material-symbols-outlined priv-ico success-color">check_circle</span>
          <div class="priv-text-wrap">
            <strong>Anonymized AI Prompting</strong>
            <span>AI Coach requests only submit aggregate statistics without email or location logs.</span>
          </div>
        </li>
        <li>
          <span class="material-symbols-outlined priv-ico success-color">check_circle</span>
          <div class="priv-text-wrap">
            <strong>No Accounts Required</strong>
            <span>Use the entire workspace without signups, tracking cookies, or passwords.</span>
          </div>
        </li>
      </ul>
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

  .alert-mode-section {
    padding: 10px 0 16px;
    border-bottom: 1px solid var(--border-card);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .section-label {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .mode-selector-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .mode-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 6px;
    background: var(--bg-app);
    border: 1px solid var(--border-card);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--text-main);
  }

  .mode-btn:hover {
    background: var(--bg-card-hover);
    border-color: var(--primary);
  }

  .mode-btn.active {
    background: var(--primary-light);
    border-color: var(--primary);
    color: var(--primary);
    box-shadow: 0 4px 12px var(--primary-glow);
  }

  .mode-icon {
    font-size: 20px;
  }

  .mode-text {
    font-size: 0.72rem;
    font-weight: 700;
  }

  /* Custom preferences styling */
  .theme-select-section, .snooze-duration-wrap {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .preference-select {
    width: 100%;
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-card);
    background: var(--bg-app);
    color: var(--text-heading);
    font-size: 0.9rem;
    font-weight: 600;
    outline: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .preference-select:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-glow);
  }

  .smart-schedule-list, .accessibility-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .schedule-inputs-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border-card);
  }

  .input-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .input-label {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .schedule-inputs-grid input[type="time"] {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-card);
    background: var(--bg-app);
    color: var(--text-heading);
    font-size: 0.9rem;
    outline: none;
    font-weight: 600;
  }

  .keyboard-guide {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 14px;
    background: var(--primary-light);
    border-radius: var(--radius-sm);
    color: var(--primary);
  }

  .guide-icon {
    font-size: 20px;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .guide-text {
    margin: 0;
    font-size: 0.78rem;
    line-height: 1.4;
    color: var(--text-main);
  }

  .guide-text strong {
    color: var(--primary);
  }

  /* Backup & Restore Styling */
  .backup-card-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .backup-desc {
    margin: 0;
    font-size: 0.84rem;
    color: var(--text-muted);
    line-height: 1.45;
  }
  .backup-actions-btns {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .import-file-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: var(--bg-app);
    border: 1px solid var(--border-card);
    border-radius: 12px;
    padding: 10px 16px;
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--text-heading);
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
  }
  .import-file-btn:hover {
    background: var(--bg-card-hover);
    border-color: var(--primary);
  }
  .btn-ico {
    font-size: 18px;
    color: var(--primary);
  }
  .import-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.82rem;
    font-weight: 600;
    padding: 8px 12px;
    border-radius: 8px;
    margin-top: 4px;
  }
  .import-status.success {
    background: var(--emerald-light);
    color: var(--emerald);
  }
  .import-status.error {
    background: rgba(239, 68, 68, 0.08);
    color: #ef4444;
  }
  .status-ico {
    font-size: 16px;
  }

  /* Diagnostics Styling */
  .diagnostics-card-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .diag-header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }
  .diag-desc {
    margin: 0;
    font-size: 0.84rem;
    color: var(--text-muted);
    line-height: 1.45;
  }
  .diag-refresh-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }
  .diag-refresh-btn:hover {
    background: var(--primary-light);
    color: var(--primary);
  }
  .diag-ref-ico {
    font-size: 20px;
  }
  .diag-ref-ico.spinning {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .diag-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: var(--bg-app);
    border: 1px solid var(--border-card);
    border-radius: var(--radius-sm);
    padding: 12px;
  }
  .diag-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.82rem;
  }
  .diag-lbl {
    font-weight: 700;
    color: var(--text-heading);
  }
  .diag-val {
    color: var(--text-muted);
    font-weight: 600;
  }
  .diag-val.badge-success {
    color: var(--emerald);
    font-weight: 700;
  }
  .diag-val.badge-warn {
    color: var(--amber);
    font-weight: 700;
  }
  .diag-val.badge-error {
    color: #ef4444;
    font-weight: 700;
  }
  .diag-loading {
    font-size: 0.82rem;
    color: var(--text-muted);
    font-style: italic;
  }

  /* Privacy Settings Dashboard */
  .privacy-dashboard-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .privacy-desc {
    margin: 0;
    font-size: 0.84rem;
    color: var(--text-muted);
    line-height: 1.45;
  }
  .privacy-list {
    margin: 4px 0 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .privacy-list li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  .priv-ico {
    font-size: 18px;
    margin-top: 2px;
    flex-shrink: 0;
  }
  .success-color {
    color: var(--emerald);
  }
  .priv-text-wrap {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .priv-text-wrap strong {
    font-size: 0.84rem;
    color: var(--text-heading);
    font-weight: 700;
  }
  .priv-text-wrap span {
    font-size: 0.78rem;
    color: var(--text-muted);
    line-height: 1.4;
  }

  .settings-lang-select {
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid var(--border-card);
    background: var(--bg-app);
    color: var(--text-heading);
    font-size: 0.8rem;
    font-weight: 700;
    font-family: inherit;
    outline: none;
    cursor: pointer;
  }
  .settings-lang-select:focus {
    border-color: var(--primary);
  }
</style>
