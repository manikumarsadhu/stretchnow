<script>

  export let isOpen = false;
  export let title = '';
  export let icon = '';
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
        {#if icon}
          <span class="material-symbols-outlined modal-icon">{icon}</span>
        {/if}
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
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 16px;
    animation: fadeIn 0.2s ease-out;
  }

  .modal-card {
    background: var(--bg-card);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--border-card);
    border-radius: var(--radius-lg);
    width: 100%;
    max-width: 440px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px 14px;
    border-bottom: 1px solid var(--border-card);
  }

  .modal-title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--text-heading);
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
    color: var(--text-muted);
    transition: background 0.2s;
  }

  .close-btn:hover {
    background: var(--primary-light);
    color: var(--primary);
  }

  .modal-body {
    padding: 20px 24px;
    overflow-y: auto;
    flex-grow: 1;
  }

  .modal-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--border-card);
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
