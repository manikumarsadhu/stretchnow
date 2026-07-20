<script>
  export let progress = 0; // 0 to 100
  export let size = 180;
  export let strokeWidth = 12;
  export let color = '#6366f1';
  export let trackColor = 'rgba(99, 102, 241, 0.15)';

  $: radius = (size - strokeWidth) / 2;
  $: circumference = 2 * Math.PI * radius;
  $: offset = circumference - (progress / 100) * circumference;
</script>

<div class="ring-container" style="width: {size}px; height: {size}px;">
  <svg width={size} height={size} viewBox="0 0 {size} {size}">
    <!-- Background Track -->
    <circle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      stroke={trackColor}
      stroke-width={strokeWidth}
      fill="none"
    />
    <!-- Progress Line -->
    <circle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      stroke={color}
      stroke-width={strokeWidth}
      stroke-dasharray={circumference}
      stroke-dashoffset={offset}
      stroke-linecap="round"
      fill="none"
      class="progress-circle"
    />
  </svg>
  <div class="ring-content">
    <slot />
  </div>
</div>

<style>
  .ring-container {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  svg {
    transform: rotate(-90deg);
  }

  .progress-circle {
    transition: stroke-dashoffset 0.5s ease-out, stroke 0.3s ease;
  }

  .ring-content {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
</style>
