<script>
  import Button from './Button.svelte';

  export let isOpen = false;
  export let title = '';
  export let onclose = () => {};

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) {
      onclose();
    }
  }
</script>

{#if isOpen}
  <!-- Modal Overlay -->
  <div class="modal-backdrop" on:click={handleBackdrop} on:keydown={(e) => e.key === 'Escape' && onclose()} role="dialog" aria-modal="true" tabindex="-1">
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="modal-title">{title}</h3>
        <button class="close-btn" on:click={onclose}>
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="modal-body">
        <slot />
      </div>

      {#if $$slots.footer}
        <div class="modal-footer">
          <slot name="footer" />
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 16px;
    animation: fadeIn 0.2s ease-out;
  }

  .modal-card {
    background: var(--bg, #ffffff);
    border-radius: 24px;
    width: 100%;
    max-width: 440px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    animation: slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .modal-title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text-h, #1f2937);
  }

  .close-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: var(--text, #6b7280);
    transition: background 0.2s;
  }

  .close-btn:hover {
    background: rgba(0, 0, 0, 0.06);
  }

  .modal-body {
    padding: 20px 24px;
    overflow-y: auto;
    flex-grow: 1;
  }

  .modal-footer {
    padding: 16px 24px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    background: rgba(0, 0, 0, 0.02);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
</style>
