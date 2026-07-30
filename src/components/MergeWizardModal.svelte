<script>
  import Modal from './Modal.svelte';
  import Button from './Button.svelte';

  export let isOpen = false;
  export let onresolve = (_choice) => {};
  export let onclose = () => {};

  let selectedChoice = 'merge'; // 'merge' | 'local' | 'cloud'

  function handleSubmit() {
    onresolve(selectedChoice);
  }
</script>

<Modal {isOpen} title="Cloud Data Sync Wizard 🔄" onclose={onclose}>
  <div class="wizard-body">
    <p class="wizard-desc">
      We detected existing local stretching and hydration logs on this device, and active data on your cloud account. Please select how you want to handle this:
    </p>

    <div class="options-list">
      <!-- Option 1: Merge -->
      <button class="option-card {selectedChoice === 'merge' ? 'active' : ''}" on:click={() => selectedChoice = 'merge'}>
        <div class="opt-header">
          <span class="material-symbols-outlined opt-ico">merge_type</span>
          <div class="opt-title-wrap">
            <strong class="opt-title">Merge Both (Recommended)</strong>
            <span class="opt-sub">Unions achievements and merges daily logs.</span>
          </div>
        </div>
      </button>

      <!-- Option 2: Keep Local -->
      <button class="option-card {selectedChoice === 'local' ? 'active' : ''}" on:click={() => selectedChoice = 'local'}>
        <div class="opt-header">
          <span class="material-symbols-outlined opt-ico">file_download</span>
          <div class="opt-title-wrap">
            <strong class="opt-title">Keep Local Data</strong>
            <span class="opt-sub">Overwrites cloud history with this device's logs.</span>
          </div>
        </div>
      </button>

      <!-- Option 3: Keep Cloud -->
      <button class="option-card {selectedChoice === 'cloud' ? 'active' : ''}" on:click={() => selectedChoice = 'cloud'}>
        <div class="opt-header">
          <span class="material-symbols-outlined opt-ico">cloud_download</span>
          <div class="opt-title-wrap">
            <strong class="opt-title">Keep Cloud Data</strong>
            <span class="opt-sub">Replaces this device's logs with cloud data.</span>
          </div>
        </div>
      </button>
    </div>
  </div>

  <div slot="footer" class="wizard-footer">
    <Button variant="ghost" size="md" onclick={onclose}>
      Cancel
    </Button>
    <Button variant="primary" size="md" icon="sync" onclick={handleSubmit}>
      Confirm & Resolve Sync
    </Button>
  </div>
</Modal>

<style>
  .wizard-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .wizard-desc {
    margin: 0;
    font-size: 0.86rem;
    color: var(--text-main);
    line-height: 1.45;
  }

  .options-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 6px;
  }

  .option-card {
    background: var(--bg-app);
    border: 1px solid var(--border-card);
    border-radius: var(--radius-sm);
    padding: 12px 14px;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s ease;
    display: flex;
    width: 100%;
    box-sizing: border-box;
  }

  .option-card:hover {
    border-color: var(--primary);
    background: var(--bg-card-hover);
  }

  .option-card.active {
    background: var(--primary-light);
    border-color: var(--primary);
    box-shadow: 0 4px 12px var(--primary-glow);
  }

  .opt-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .opt-ico {
    font-size: 22px;
    color: var(--text-muted);
    margin-top: 2px;
  }

  .option-card.active .opt-ico {
    color: var(--primary);
  }

  .opt-title-wrap {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .opt-title {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--text-heading);
  }

  .opt-sub {
    font-size: 0.78rem;
    color: var(--text-muted);
    line-height: 1.35;
  }

  .wizard-footer {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    width: 100%;
  }
</style>
