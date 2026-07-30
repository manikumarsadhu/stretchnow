<script>
  export let width = '100%';
  export let height = '20px';
  export let radius = 'var(--radius-md, 16px)';
  export let count = 1;
</script>

<div class="skeleton-wrapper" style="--sk-width: {width}; --sk-height: {height}; --sk-radius: {radius};">
  {#each Array(count) as _, i}
    <div class="skeleton-shimmer skeleton-item" style="animation-delay: {i * 120}ms"></div>
  {/each}
</div>

<style>
  .skeleton-wrapper {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: var(--sk-width);
  }

  .skeleton-item {
    width: 100%;
    height: var(--sk-height);
    border-radius: var(--sk-radius);
  }
</style>
