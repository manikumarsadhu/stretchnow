<script>
  export let checked = false;
  export let label = '';
  export let description = '';
  export let onchange = (_val) => {};

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
    font-weight: 700;
    color: var(--text-heading);
  }

  .toggle-desc {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-top: 2px;
    line-height: 1.4;
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
    background-color: var(--border-card);
    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 99px;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 3px;
    bottom: 3px;
    background-color: #ffffff;
    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  input:checked + .slider {
    background-color: var(--primary);
  }

  input:checked + .slider:before {
    transform: translateX(22px);
  }
</style>
