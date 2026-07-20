<script>
  export let checked = false;
  export let label = '';
  export let description = '';
  export let onchange = () => {};

  function handleToggle(e) {
    checked = e.target.checked;
    if (onchange) onchange(checked);
  }
</script>

<label class="toggle-container">
  <div class="toggle-text">
    <span class="toggle-label">{label}</span>
    {#if description}
      <span class="toggle-desc">{description}</span>
    {/if}
  </div>
  <div class="switch">
    <input type="checkbox" {checked} on:change={handleToggle} />
    <span class="slider"></span>
  </div>
</label>

<style>
  .toggle-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    cursor: pointer;
    user-select: none;
    gap: 16px;
  }

  .toggle-text {
    display: flex;
    flex-direction: column;
  }

  .toggle-label {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-h, #1f2937);
  }

  .toggle-desc {
    font-size: 0.8rem;
    color: var(--text, #6b7280);
    margin-top: 2px;
  }

  .switch {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 26px;
    flex-shrink: 0;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #cbd5e1;
    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 26px;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  input:checked + .slider {
    background-color: #6366f1;
  }

  input:checked + .slider:before {
    transform: translateX(22px);
  }
</style>
