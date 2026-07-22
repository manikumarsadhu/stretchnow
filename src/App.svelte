<script>
  import { onMount } from 'svelte';
  import { appStore, checkAndSyncAuth, navigateTo } from './stores/app.js';
  import { client } from './lib/appwrite.js';
  import Splash from './routes/Splash.svelte';
  import Welcome from './routes/Welcome.svelte';
  import Onboarding from './routes/Onboarding.svelte';
  import Login from './routes/Login.svelte';
  import Home from './routes/Home.svelte';
  import Break from './routes/Break.svelte';
  import Library from './routes/Library.svelte';
  import Statistics from './routes/Statistics.svelte';
  import Settings from './routes/Settings.svelte';
  import BottomNav from './components/BottomNav.svelte';

  onMount(async () => {
    // Ping Appwrite backend server on startup to verify setup
    if (typeof client.ping === 'function') {
      client.ping().catch((err) => {
        console.log('Appwrite ping status:', err);
      });
    }

    const startTime = Date.now();

    // Check for existing Appwrite user session and sync progress
    try {
      await checkAndSyncAuth();
    } catch (err) {
      console.warn('Startup auth sync error:', err);
    }

    const elapsed = Date.now() - startTime;
    const minSplashTime = 800;
    const remainingDelay = Math.max(0, minSplashTime - elapsed);

    setTimeout(() => {
      // If returning from OAuth login redirect (e.g. ?auth=success)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('auth') === 'success') {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Route dynamically depending on user onboarding or cloud connection state
      const state = $appStore;
      if (state.user?.appwriteId || state.user?.onboarded) {
        navigateTo('home');
      } else {
        navigateTo('welcome');
      }
    }, remainingDelay);
  });

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
    {:else if route === 'login'}
      <Login />
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
