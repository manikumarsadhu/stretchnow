<script>
  import { onMount } from 'svelte';
  import { appStore, checkAndSyncAuth, navigateTo } from './stores/app.js';
  import { client } from './lib/appwrite.js';
  import { initSyncManager } from './sync/manager.js';
  import Splash from './routes/Splash.svelte';
  import Welcome from './routes/Welcome.svelte';
  import Onboarding from './routes/Onboarding.svelte';
  import Login from './routes/Login.svelte';
  import Home from './routes/Home.svelte';
  import Break from './routes/Break.svelte';
  import Library from './routes/Library.svelte';
  import Statistics from './routes/Statistics.svelte';
  import Settings from './routes/Settings.svelte';
  import NotFound from './routes/NotFound.svelte';
  import BottomNav from './components/BottomNav.svelte';
  import SidebarNav from './components/SidebarNav.svelte';
  import DesktopHeader from './components/DesktopHeader.svelte';
  import AlarmModal from './components/AlarmModal.svelte';
  import SnoozeBanner from './components/SnoozeBanner.svelte';
  import AdaptiveIntervalModal from './components/AdaptiveIntervalModal.svelte';
  import HealthChatbotModal from './components/HealthChatbotModal.svelte';
  import { closeAdaptiveModal } from './stores/app.js';
  import { getRouteMetadata } from './lib/seo.js';
  import { getStructuredDataJSON } from './lib/structuredData.js';

  let isChatbotOpen = false;

  onMount(() => {
    // Start background operational sync loops
    initSyncManager();
    // Ping Appwrite backend server on startup to verify setup
    if (typeof client.ping === 'function') {
      client.ping().catch((err) => {
        console.log('Appwrite ping status:', err);
      });
    }

    // Trigger auth sync in background so network latency never blocks UI startup
    checkAndSyncAuth().catch((err) => {
      console.warn('Startup auth sync error:', err);
    });

    const minSplashTime = 800;

    setTimeout(() => {
      // If returning from OAuth login redirect (e.g. ?auth=success)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('auth') === 'success') {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Default to home page on startup
      navigateTo('home');
    }, minSplashTime);
  });

  $: route = $appStore.route || 'splash';
  $: settings = $appStore.settings || {};
  $: theme = settings.theme || 'light';
  
  let systemPrefersDark = false;
  onMount(() => {
    if (typeof window !== 'undefined') {
      const handleOpenChatbot = () => { isChatbotOpen = true; };
      window.addEventListener('open-chatbot', handleOpenChatbot);

      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      systemPrefersDark = mq.matches;
      /** @param {MediaQueryListEvent} e */
      const listener = (e) => {
        systemPrefersDark = e.matches;
      };
      mq.addEventListener('change', listener);
      return () => {
        window.removeEventListener('open-chatbot', handleOpenChatbot);
        mq.removeEventListener('change', listener);
      };
    }
  });

  $: computedDark = theme === 'dark' || (theme === 'system' && systemPrefersDark);
  $: themeClass = (theme === 'blue' || theme === 'green') ? `theme-${theme}` : '';
  $: largeTextClass = settings.largeTextEnabled ? 'large-text' : '';
  $: highContrastClass = settings.highContrastEnabled ? 'high-contrast' : '';

  // Routes where BottomNav should be visible
  $: showBottomNav = ['home', 'break', 'library', 'statistics', 'settings'].includes(route);

  // Dynamic SEO metadata per route
  $: meta = getRouteMetadata(route);
  // eslint-disable-next-line no-unused-vars
  const structuredDataJson = getStructuredDataJSON();
</script>

<svelte:head>
  <title>{meta.title}</title>
  <meta name="description" content={meta.description} />
  <script type="application/ld+json">
    {@html structuredDataJson}
  </script>
</svelte:head>

<div class="app-shell {computedDark ? 'dark-mode' : ''} {themeClass} {largeTextClass} {highContrastClass}">
  {#if showBottomNav}
    <SidebarNav />
  {/if}

  <div class="app-content-wrapper">
    {#if showBottomNav}
      <DesktopHeader />
    {/if}

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
      {:else}
        <NotFound />
      {/if}
    </main>
  </div>

  {#if showBottomNav}
    <BottomNav />
  {/if}

  <SnoozeBanner />

  {#if $appStore.isAlarmRinging}
    <AlarmModal />
  {/if}

  {#if showBottomNav}
    <button
      type="button"
      class="floating-chatbot-btn"
      on:click={() => isChatbotOpen = true}
      title="Ask AI Health Assistant"
      aria-label="Open AI Health Assistant"
    >
      <span class="material-symbols-outlined chat-icon">smart_toy</span>
      <span class="chat-badge">AI Assistant</span>
    </button>

    <HealthChatbotModal isOpen={isChatbotOpen} onclose={() => isChatbotOpen = false} />
  {/if}

  {#if $appStore.showAdaptiveModal}
    <AdaptiveIntervalModal isOpen={true} onclose={closeAdaptiveModal} />
  {/if}
</div>

<style>
  .floating-chatbot-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 900;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: 99px;
    background: linear-gradient(135deg, var(--primary, #6366f1) 0%, var(--color-ai, #8b5cf6) 100%);
    color: #ffffff;
    border: none;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);
    transition: all var(--anim-card, 0.25s ease);
    margin: 0 !important;
  }

  .floating-chatbot-btn:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 12px 30px rgba(99, 102, 241, 0.5);
  }

  .chat-icon {
    font-size: 22px;
  }

  .chat-badge {
    font-size: 0.82rem;
    font-weight: 800;
    letter-spacing: -0.01em;
  }

  @media (max-width: 1023px) {
    .floating-chatbot-btn {
      bottom: 96px;
      right: 16px;
      padding: 10px 14px;
    }
    .chat-badge {
      display: none;
    }
  }
  .app-shell {
    min-height: 100vh;
    background-color: #f8fafc;
    color: #0f172a;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transition: background-color 0.3s ease, color 0.3s ease;
    display: block;
    width: 100%;
    overflow-x: hidden;
  }

  .app-shell.dark-mode {
    background-color: #0f172a;
    color: #f8fafc;
  }

  .app-content-wrapper {
    width: 100%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  .main-content {
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    min-height: 100vh;
    position: relative;
    box-sizing: border-box;
    min-width: 0;
  }

  /* Desktop App Shell (>= 1024px) */
  @media (min-width: 1024px) {
    .app-shell {
      display: block;
      min-height: 100vh;
      width: 100%;
    }

    .app-content-wrapper {
      margin-left: 260px;
      width: calc(100% - 260px);
      min-width: 0;
    }

    .main-content {
      max-width: 100%;
      margin: 0;
      min-height: calc(100vh - 73px);
    }
  }

  /* Tablet layout adjustment (768px - 1023px) */
  @media (min-width: 768px) and (max-width: 1023px) {
    .main-content {
      max-width: 94%;
      margin: 0 auto;
    }
  }
</style>
