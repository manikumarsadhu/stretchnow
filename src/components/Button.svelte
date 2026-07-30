<script>
  export let variant = 'primary'; // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  export let size = 'md'; // 'sm' | 'md' | 'lg'
  export let icon = '';
  export let disabled = false;
  export let fullWidth = false;
  /** @type {'button' | 'submit' | 'reset'} */
  export let type = 'button';
  export let onclick = () => {};
</script>

<button
  {type}
  {disabled}
  class="btn btn-{variant} btn-{size} {fullWidth ? 'full-width' : ''}"
  on:click={onclick}
>
  {#if icon}
    <span class="material-symbols-outlined btn-icon">{icon}</span>
  {/if}
  <span class="btn-text">
    <slot />
  </span>
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid transparent;
    outline: none;
    margin: 0;
  }
  
  .btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
  
  .btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Sizes */
  .btn-sm {
    padding: 6px 14px;
    font-size: 0.85rem;
  }
  .btn-md {
    padding: 10px 20px;
    font-size: 0.95rem;
  }
  .btn-lg {
    padding: 14px 28px;
    font-size: 1.1rem;
  }

  /* Variants */
  .btn-primary {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
  }
  .btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
  }

  .btn-secondary {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
  }

  .btn-outline {
    background: transparent;
    border-color: rgba(99, 102, 241, 0.4);
    color: #6366f1;
  }
  .btn-outline:hover:not(:disabled) {
    background: rgba(99, 102, 241, 0.08);
  }

  .btn-ghost {
    background: transparent;
    color: var(--text-h, #333);
  }
  .btn-ghost:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.05);
  }

  .btn-danger {
    background: #ef4444;
    color: #fff;
  }

  .full-width {
    width: 100%;
  }

  .btn-icon {
    font-size: 1.25em;
  }
</style>
