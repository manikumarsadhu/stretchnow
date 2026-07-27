<script>
  import Button from '../components/Button.svelte';
  import { navigateTo } from '../stores/app.js';
</script>

<div class="not-found-screen animate-fade-in">
  <div class="not-found-card">
    <div class="icon-wrap">
      <span class="material-symbols-outlined not-found-icon">explore_off</span>
    </div>
    <h1 class="title">404 - Page Not Found</h1>
    <p class="description">
      Oops! The wellness view or stretch section you are looking for could not be found or has moved.
    </p>
    <div class="action-wrap">
      <Button variant="primary" size="lg" icon="home" onclick={() => navigateTo('home')}>
        Return to Dashboard
      </Button>
    </div>
  </div>
</div>

<style>
  .not-found-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
    padding: 1.5rem;
    box-sizing: border-box;
    text-align: center;
  }

  .not-found-card {
    background: var(--card-bg, #ffffff);
    border: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
    border-radius: 1.25rem;
    padding: 2.5rem 1.75rem;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
  }

  :global(.dark-mode) .not-found-card {
    background: #1e293b;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .icon-wrap {
    width: 72px;
    height: 72px;
    margin: 0 auto 1.25rem;
    border-radius: 50%;
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .not-found-icon {
    font-size: 38px;
  }

  .title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.75rem 0;
    color: var(--text-color, #0f172a);
  }

  :global(.dark-mode) .title {
    color: #f8fafc;
  }

  .description {
    font-size: 0.95rem;
    color: #64748b;
    line-height: 1.5;
    margin: 0 0 1.75rem 0;
  }

  :global(.dark-mode) .description {
    color: #94a3b8;
  }

  .action-wrap {
    display: flex;
    justify-content: center;
  }
</style>
