<script>
  import { appStore } from './stores/app.js';
  import Splash from './routes/Splash.svelte';
  import Welcome from './routes/Welcome.svelte';
  import Onboarding from './routes/Onboarding.svelte';
  import Home from './routes/Home.svelte';
  import Break from './routes/Break.svelte';
  import Library from './routes/Library.svelte';
  import Statistics from './routes/Statistics.svelte';
  import Settings from './routes/Settings.svelte';
  import BottomNav from './components/BottomNav.svelte';

  $: route = $appStore.route || 'splash';
  $: isDarkMode = $appStore.settings?.darkMode || false;

  // Routes where BottomNav should be visible
  $: showBottomNav = ['home', 'break', 'library', 'statistics', 'settings'].includes(route);
</script>

<div class="app-shell {isDarkMode ? 'dark-mode' : ''}">
  <main class="main-content">
    {#if route === 'splash'}
      <Splash />
    {:else if route === 'welcome'}
      <Welcome />
    {:else if route === 'onboarding'}
      <Onboarding />
    {:else if route === 'home'}
      <Home />
    {:else if route === 'break'}
      <Break />
    {:else if route === 'library'}
      <Library />
    {:else if route === 'statistics'}
      <Statistics />
    {:else if route === 'settings'}
      <Settings />
    {/if}
  </main>

  {#if showBottomNav}
    <BottomNav />
  {/if}
</div>

<style>
  .app-shell {
    min-height: 100vh;
    background-color: #f8fafc;
    color: #0f172a;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  .app-shell.dark-mode {
    background-color: #0f172a;
    color: #f8fafc;
  }

  .main-content {
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    min-height: 100vh;
    position: relative;
    box-sizing: border-box;
  }
</style>
