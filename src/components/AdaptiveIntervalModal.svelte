<script>
  import { appStore, updateSettings, toggleMeetingMode, navigateTo } from '../stores/app.js';
  import Modal from './Modal.svelte';
  import Button from './Button.svelte';

  export let isOpen = true;
  export let onclose = () => {};

  $: skips = $appStore.progress?.consecutiveSkips || 3;

  function handleReduceFrequency() {
    const current = $appStore.settings?.reminderIntervalMinutes || 45;
    updateSettings({ reminderIntervalMinutes: current + 15 });
    onclose();
  }

  function handleFocusMode() {
    toggleMeetingMode();
    onclose();
  }

  function handleEditSchedule() {
    onclose();
    navigateTo('settings');
  }
</script>

<Modal {isOpen} title="Missed Reminder Alert 🧘" {onclose}>
  <div class="adaptive-modal-body">
    <div class="alert-icon-header">
      <span class="material-symbols-outlined header-ico">motion_photos_paused</span>
    </div>

    <div class="modal-text">
      <h3>We noticed you skipped your last {skips} stretch breaks!</h3>
      <p>Would you like to adjust your reminder settings so they work better for your schedule right now?</p>
    </div>

    <div class="adaptive-options">
      <button class="option-card" on:click={handleReduceFrequency}>
        <div class="opt-icon-wrap primary">
          <span class="material-symbols-outlined">update</span>
        </div>
        <div class="opt-content">
          <span class="opt-title">Reduce Reminder Frequency</span>
          <span class="opt-desc">Extend intervals to every {$appStore.settings?.reminderIntervalMinutes + 15 || 60} mins</span>
        </div>
      </button>

      <button class="option-card" on:click={handleFocusMode}>
        <div class="opt-icon-wrap amber">
          <span class="material-symbols-outlined">do_not_disturb_on</span>
        </div>
        <div class="opt-content">
          <span class="opt-title">Enable Meeting / Focus Mode</span>
          <span class="opt-desc">Pause all reminders until you finish your busy work session</span>
        </div>
      </button>

      <button class="option-card" on:click={handleEditSchedule}>
        <div class="opt-icon-wrap cyan">
          <span class="material-symbols-outlined">edit_calendar</span>
        </div>
        <div class="opt-content">
          <span class="opt-title">Adjust Work Schedule</span>
          <span class="opt-desc">Update work hours or lunch break boundaries in Settings</span>
        </div>
      </button>
    </div>

    <div class="modal-footer-action">
      <Button variant="outline" size="md" onclick={onclose}>
        Keep Current Settings
      </Button>
    </div>
  </div>
</Modal>

<style>
  .adaptive-modal-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 8px 0;
    text-align: center;
  }

  .alert-icon-header {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .header-ico {
    font-size: 34px;
  }

  .modal-text h3 {
    margin: 0 0 6px;
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--text-heading);
  }

  .modal-text p {
    margin: 0;
    font-size: 0.88rem;
    color: var(--text-muted);
  }

  .adaptive-options {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 8px;
  }

  .option-card {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: var(--radius-sm, 12px);
    background: var(--bg-card);
    border: 1px solid var(--border-card);
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .option-card:hover {
    border-color: var(--primary);
    transform: translateY(-1px);
  }

  .opt-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .opt-icon-wrap.primary { background: rgba(99, 102, 241, 0.15); color: var(--primary); }
  .opt-icon-wrap.amber { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
  .opt-icon-wrap.cyan { background: rgba(6, 182, 212, 0.15); color: #06b6d4; }

  .opt-content {
    display: flex;
    flex-direction: column;
  }

  .opt-title {
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--text-heading);
  }

  .opt-desc {
    font-size: 0.78rem;
    color: var(--text-muted);
  }

  .modal-footer-action {
    width: 100%;
    margin-top: 8px;
  }
</style>
