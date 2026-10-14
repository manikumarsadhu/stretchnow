<script>
  import { onMount } from 'svelte';
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  import {
    getAdminMetrics,
    setAdminDailyLimit,
    resetTodayUsage,
    isAdminAuthenticated,
    setAdminAuthenticated,
    verifyAdminPassword,
    updateAdminPassword,
    clearUnansweredQueries
  } from '../services/aiUsage.js';
  import { AI_PROVIDERS_METADATA, testProviderPing, generateAIResponse } from '../services/aiProvider.js';
  import { runSystemDiagnostics } from '../services/diagnostics.js';
  import { appStore, navigateTo } from '../stores/app.js';
  import { DATABASE_ID } from '../lib/appwrite.js';

  let isAuthenticated = false;
  let adminPasswordInput = '';
  let loginError = '';
  let activeTab = 'ai'; // 'ai' | 'app' | 'logs'

  // Metrics & State
  /** @type {import('../services/aiUsage.js').AdminMetrics} */
  let metrics = getAdminMetrics();
  let dailyLimitInput = metrics.dailyLimit;
  let limitSavedNotice = '';
  let resetNotice = '';

  // Ping Testing State
  let pingResults = {}; // { [providerId]: { loading: boolean, latencyMs?: number, ok?: boolean, error?: string } }

  // Playground Sandbox State
  let playgroundPrompt = 'What are 3 quick ergonomic adjustments for dual monitor setups?';
  let playgroundResponse = '';
  let isPlaygroundLoading = false;
  let playgroundLatency = null;

  // Diagnostics State
  let diagnostics = null;

  // Change Password State
  let newPasswordInput = '';
  let passwordNotice = '';

  function refreshState() {
    isAuthenticated = isAdminAuthenticated();
    if (isAuthenticated) {
      metrics = getAdminMetrics();
      dailyLimitInput = metrics.dailyLimit;
    }
  }

  onMount(async () => {
    refreshState();
    if (isAuthenticated) {
      diagnostics = await runSystemDiagnostics();
    }
  });

  function handleLogin(e) {
    if (e) e.preventDefault();
    loginError = '';
    const success = verifyAdminPassword(adminPasswordInput);
    if (success) {
      adminPasswordInput = '';
      refreshState();
      runSystemDiagnostics().then(d => diagnostics = d);
    } else {
      loginError = 'Invalid admin passcode. (Default: admin or admin123)';
    }
  }

  function handleDemoLogin() {
    setAdminAuthenticated(true);
    refreshState();
    runSystemDiagnostics().then(d => diagnostics = d);
  }

  function handleLogout() {
    setAdminAuthenticated(false);
    refreshState();
  }

  function handleSaveLimit() {
    const updated = setAdminDailyLimit(dailyLimitInput);
    metrics = getAdminMetrics();
    limitSavedNotice = `Daily limit updated to ${updated} queries/user!`;
    setTimeout(() => { limitSavedNotice = ''; }, 3000);
  }

  function handleResetCredits() {
    resetTodayUsage();
    metrics = getAdminMetrics();
    resetNotice = "Today's user credits have been reset to zero!";
    setTimeout(() => { resetNotice = ''; }, 3000);
  }

  function handleClearUnanswered() {
    clearUnansweredQueries();
    metrics = getAdminMetrics();
  }

  async function handlePing(providerId) {
    pingResults[providerId] = { loading: true };
    pingResults = { ...pingResults };

    const res = await testProviderPing(providerId);
    pingResults[providerId] = {
      loading: false,
      latencyMs: res.latencyMs,
      ok: res.ok,
      error: res.error,
      model: res.model
    };
    pingResults = { ...pingResults };
  }

  async function handleRunPlayground() {
    if (!playgroundPrompt.trim() || isPlaygroundLoading) return;
    isPlaygroundLoading = true;
    playgroundResponse = '';
    playgroundLatency = null;
    const start = performance.now();

    try {
      const systemInstruction = "You are StretchNow AI Administrator Sandbox. Provide concise, bulleted, highly accurate ergonomic and health advice.";
      const res = await generateAIResponse(playgroundPrompt, systemInstruction);
      playgroundLatency = Math.round(performance.now() - start);
      playgroundResponse = res;
      metrics = getAdminMetrics();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      playgroundResponse = `Error executing prompt: ${msg}`;
    } finally {
      isPlaygroundLoading = false;
    }
  }

  function handleUpdatePasscode() {
    if (updateAdminPassword(newPasswordInput)) {
      passwordNotice = 'Admin passcode changed successfully!';
      newPasswordInput = '';
    } else {
      passwordNotice = 'Passcode must be at least 4 characters long.';
    }
    setTimeout(() => { passwordNotice = ''; }, 3500);
  }
</script>

<div class="admin-page animate-fade-in">
  {#if !isAuthenticated}
    <!-- Admin Login Screen -->
    <div class="admin-login-wrapper">
      <div class="admin-login-card">
        <div class="login-header">
          <div class="shield-avatar">
            <span class="material-symbols-outlined">shield_person</span>
          </div>
          <h2 class="login-title">Admin Console Access</h2>
          <p class="login-subtitle">
            Sign in to inspect AI assistant tokens, manage user credits, ping multi-model providers, and review system diagnostics.
          </p>
        </div>

        {#if loginError}
          <div class="error-banner">
            <span class="material-symbols-outlined">error</span>
            <span>{loginError}</span>
          </div>
        {/if}

        <form on:submit={handleLogin} class="admin-login-form">
          <div class="form-group">
            <label for="admin-pass">Admin Passcode</label>
            <input
              id="admin-pass"
              type="password"
              bind:value={adminPasswordInput}
              placeholder="Enter admin passcode (e.g. admin)"
              required
            />
          </div>

          <div class="login-btn-row">
            <Button type="submit" variant="primary" size="lg" fullWidth icon="key">
              Sign In to Admin
            </Button>
          </div>
        </form>

        <div class="demo-login-box">
          <p class="demo-hint">Need instant demo access?</p>
          <button type="button" class="demo-btn" on:click={handleDemoLogin}>
            <span class="material-symbols-outlined">bolt</span>
            <span>One-Click Demo Admin Login</span>
          </button>
        </div>

        <button type="button" class="back-link" on:click={() => navigateTo('home')}>
          ← Back to StretchNow App
        </button>
      </div>
    </div>
  {:else}
    <!-- Admin Dashboard Main Layout -->
    <div class="admin-dashboard-container">
      <!-- Admin Header -->
      <header class="admin-header">
        <div class="admin-header-left">
          <div class="admin-badge-icon">
            <span class="material-symbols-outlined">admin_panel_settings</span>
          </div>
          <div>
            <div class="title-with-badge">
              <h1 class="admin-title">StretchNow Admin & AI Control Center</h1>
              <span class="status-pill active">Super Admin</span>
            </div>
            <p class="admin-subtitle">Monitoring multi-model LLM failovers, token telemetry, user credits & app diagnostics.</p>
          </div>
        </div>

        <div class="admin-header-actions">
          <button type="button" class="header-btn secondary" on:click={() => navigateTo('home')}>
            <span class="material-symbols-outlined">dashboard</span>
            <span>User Dashboard</span>
          </button>
          <button type="button" class="header-btn danger" on:click={handleLogout}>
            <span class="material-symbols-outlined">logout</span>
            <span>Exit Admin</span>
          </button>
        </div>
      </header>

      <!-- Navigation Tabs -->
      <div class="admin-tabs">
        <button
          type="button"
          class="tab-btn {activeTab === 'ai' ? 'active' : ''}"
          on:click={() => activeTab = 'ai'}
        >
          <span class="material-symbols-outlined">smart_toy</span>
          <span>AI Assistant & Models</span>
        </button>
        <button
          type="button"
          class="tab-btn {activeTab === 'app' ? 'active' : ''}"
          on:click={() => activeTab = 'app'}
        >
          <span class="material-symbols-outlined">hub</span>
          <span>App Ecosystem & Backend</span>
        </button>
        <button
          type="button"
          class="tab-btn {activeTab === 'logs' ? 'active' : ''}"
          on:click={() => activeTab = 'logs'}
        >
          <span class="material-symbols-outlined">list_alt</span>
          <span>Query Activity Logs ({metrics.recentLogs.length})</span>
        </button>
      </div>

      <!-- Tab 1: AI Assistant & Models -->
      {#if activeTab === 'ai'}
        <!-- Key Metrics Cards -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-title">Tokens Consumed</span>
              <span class="material-symbols-outlined metric-icon purple">generating_tokens</span>
            </div>
            <div class="metric-value">{metrics.totalTokens.toLocaleString()}</div>
            <span class="metric-sub">~{metrics.tokensToday.toLocaleString()} tokens used today</span>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-title">Tokens Saved</span>
              <span class="material-symbols-outlined metric-icon green">energy_savings_leaf</span>
            </div>
            <div class="metric-value">{(metrics.tokensSaved || 0).toLocaleString()}</div>
            <span class="metric-sub">{(metrics.cachedHits || 0) + (metrics.intentsResolved || 0)} queries via Cache & Fast-Path</span>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-title">Queries Logged</span>
              <span class="material-symbols-outlined metric-icon blue">chat</span>
            </div>
            <div class="metric-value">{metrics.totalQueries}</div>
            <span class="metric-sub">{metrics.queriesToday} queries today across users</span>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-title">User Daily Credit Limit</span>
              <span class="material-symbols-outlined metric-icon amber">bolt</span>
            </div>
            <div class="metric-value">{metrics.dailyLimit}</div>
            <span class="metric-sub">Queries permitted per user/day</span>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-title">Failover Pool Status</span>
              <span class="material-symbols-outlined metric-icon green">check_circle</span>
            </div>
            <div class="metric-value">Active</div>
            <span class="metric-sub">5 Models in automatic priority order</span>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-title">User Satisfaction</span>
              <span class="material-symbols-outlined metric-icon green">thumb_up</span>
            </div>
            <div class="metric-value">{metrics.feedback?.rate ?? 100}%</div>
            <span class="metric-sub">{metrics.feedback?.positive || 0} helpful • {metrics.feedback?.negative || 0} unhelpful</span>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-title">Unanswered Queries</span>
              <span class="material-symbols-outlined metric-icon amber">report_problem</span>
            </div>
            <div class="metric-value">{(metrics.unansweredQueries || []).length}</div>
            <span class="metric-sub">Flagged questions & fallbacks</span>
          </div>
        </div>

        <!-- Multi-Model Providers Health Table -->
        <Card title="Multi-Model Failover Priority Pool" icon="alt_route" padding="lg">
          <p class="section-desc">
            If an AI provider encounters rate limits (HTTP 429), credit exhaustion (HTTP 402), or network drops,
            the failover engine automatically routes to the next model in real time without lag.
          </p>

          <div class="models-table-wrap">
            <table class="models-table">
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Provider</th>
                  <th>Model Identifier</th>
                  <th>Speed</th>
                  <th>Key Status</th>
                  <th>Ping Health</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {#each AI_PROVIDERS_METADATA as provider}
                  <tr>
                    <td>
                      <span class="priority-pill">#{provider.priority}</span>
                    </td>
                    <td>
                      <strong>{provider.name}</strong>
                    </td>
                    <td>
                      <code>{provider.model}</code>
                    </td>
                    <td>
                      <span class="speed-tag">{provider.speed}</span>
                    </td>
                    <td>
                      {#if provider.hasKey}
                        <span class="status-pill configured">Active Key</span>
                      {:else}
                        <span class="status-pill missing">Key Missing</span>
                      {/if}
                    </td>
                    <td>
                      {#if pingResults[provider.id]?.loading}
                        <span class="ping-tag loading">Pinging...</span>
                      {:else if pingResults[provider.id]?.ok}
                        <span class="ping-tag success">
                          ⚡ {pingResults[provider.id].latencyMs}ms (Online)
                        </span>
                      {:else if pingResults[provider.id]?.error}
                        <span class="ping-tag error" title={pingResults[provider.id].error}>
                          Failed ({pingResults[provider.id].latencyMs}ms)
                        </span>
                      {:else}
                        <span class="ping-tag neutral">Untested</span>
                      {/if}
                    </td>
                    <td>
                      <button
                        type="button"
                        class="ping-btn"
                        disabled={pingResults[provider.id]?.loading}
                        on:click={() => handlePing(provider.id)}
                      >
                        <span class="material-symbols-outlined ping-icon">network_ping</span>
                        <span>Test Ping</span>
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </Card>

        <!-- Daily Credits & Quota Management -->
        <div class="grid-2-col">
          <Card title="Daily User Credit Settings" icon="tune" padding="md">
            <p class="section-desc">Set how many free daily queries each user gets before needing admin clearance.</p>

            <div class="limit-slider-wrap">
              <div class="slider-header">
                <span>Daily Limit per User:</span>
                <strong class="limit-display">{dailyLimitInput} queries</strong>
              </div>
              <input
                type="range"
                min="3"
                max="50"
                step="1"
                bind:value={dailyLimitInput}
                class="limit-range"
              />
              <div class="limit-quick-buttons">
                <button type="button" class="chip-preset" on:click={() => dailyLimitInput = 5}>5 / day</button>
                <button type="button" class="chip-preset" on:click={() => dailyLimitInput = 10}>10 (Standard)</button>
                <button type="button" class="chip-preset" on:click={() => dailyLimitInput = 20}>20 (Generous)</button>
                <button type="button" class="chip-preset" on:click={() => dailyLimitInput = 50}>50 (Pro)</button>
              </div>
            </div>

            {#if limitSavedNotice}
              <div class="success-banner">{limitSavedNotice}</div>
            {/if}

            <div class="limit-actions-row">
              <Button variant="primary" size="sm" icon="save" onclick={handleSaveLimit}>
                Save Daily Limit
              </Button>
              <Button variant="secondary" size="sm" icon="restart_alt" onclick={handleResetCredits}>
                Reset Today's Credits
              </Button>
            </div>

            {#if resetNotice}
              <div class="success-banner">{resetNotice}</div>
            {/if}
          </Card>

          <!-- Model Usage Breakdown -->
          <Card title="Queries by Provider" icon="pie_chart" padding="md">
            <p class="section-desc">Distribution of queries handled across the multi-model failover network.</p>
            <div class="providers-bar-list">
              {#each Object.entries(metrics.providerCounts || {}) as [pName, pCount]}
                <div class="p-row">
                  <div class="p-info">
                    <strong>{pName}</strong>
                    <span>{pCount} requests ({metrics.totalQueries > 0 ? Math.round((pCount / metrics.totalQueries) * 100) : 0}%)</span>
                  </div>
                  <div class="p-bar-track">
                    <div
                      class="p-bar-fill"
                      style="width: {metrics.totalQueries > 0 ? (pCount / metrics.totalQueries) * 100 : 0}%"
                    ></div>
                  </div>
                </div>
              {/each}
              {#if Object.keys(metrics.providerCounts || {}).length === 0}
                <p class="empty-state">No queries recorded yet. Start chatting to populate metrics!</p>
              {/if}
            </div>
          </Card>
        </div>

        <!-- Assistant Question Analytics & Unanswered Queries -->
        <div class="grid-2-col" style="margin-top: 20px;">
          <!-- Topic Frequency Breakdown -->
          <Card title="Common Question Topics" icon="category" padding="md">
            <p class="section-desc">Frequency of health and product topics asked in the AI Assistant.</p>
            <div class="providers-bar-list">
              {#each Object.entries(metrics.commonTopics || {}) as [topicName, topicCount]}
                <div class="p-row">
                  <div class="p-info">
                    <strong>{topicName}</strong>
                    <span>{topicCount} queries</span>
                  </div>
                  <div class="p-bar-track">
                    <div
                      class="p-bar-fill"
                      style="width: {metrics.totalQueries > 0 ? Math.min(100, (topicCount / metrics.totalQueries) * 100) : 0}%"
                    ></div>
                  </div>
                </div>
              {/each}
              {#if Object.keys(metrics.commonTopics || {}).length === 0}
                <p class="empty-state">No topic questions categorized yet.</p>
              {/if}
            </div>
          </Card>

          <!-- Unanswered & Flagged Queries -->
          <Card title="Unanswered & Flagged Queries ({(metrics.unansweredQueries || []).length})" icon="report_problem" padding="md">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <p class="section-desc" style="margin: 0;">Queries that hit fallbacks or were downvoted by users.</p>
              {#if (metrics.unansweredQueries || []).length > 0}
                <Button variant="outline" size="sm" icon="delete_sweep" onclick={handleClearUnanswered}>
                  Clear Log
                </Button>
              {/if}
            </div>

            <div class="unanswered-list">
              {#if (metrics.unansweredQueries || []).length > 0}
                <div class="unanswered-scroll-box">
                  {#each metrics.unansweredQueries as item}
                    <div class="unanswered-item">
                      <div class="unanswered-item-header">
                        <span class="unanswered-time">{item.timestamp} • {item.date}</span>
                        <span class="unanswered-reason">{item.reason}</span>
                      </div>
                      <p class="unanswered-query">"{item.query}"</p>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="empty-state" style="padding: 24px; text-align: center;">
                  <span class="material-symbols-outlined" style="font-size: 32px; color: #10b981;">check_circle</span>
                  <p style="margin-top: 8px;">No unanswered queries! Knowledge base coverage is 100% healthy.</p>
                </div>
              {/if}
            </div>
          </Card>
        </div>

        <!-- AI Sandbox & Prompt Playground -->
        <Card title="Live Model Sandbox & Diagnostics" icon="science" padding="lg">
          <p class="section-desc">Run immediate test prompts through the failover pool to verify response quality, tokens, and latency.</p>

          <div class="playground-body">
            <div class="playground-input-group">
              <label for="sandbox-prompt" class="pg-lbl">Test Prompt:</label>
              <textarea
                id="sandbox-prompt"
                bind:value={playgroundPrompt}
                rows="3"
                class="pg-textarea"
                placeholder="Enter prompt to evaluate model responses..."
              ></textarea>
            </div>

            <div class="playground-actions">
              <Button
                variant="primary"
                size="md"
                disabled={isPlaygroundLoading || !playgroundPrompt.trim()}
                icon={isPlaygroundLoading ? 'hourglass_top' : 'send'}
                onclick={handleRunPlayground}
              >
                {isPlaygroundLoading ? 'Generating Response...' : 'Run Test Generation'}
              </Button>

              {#if playgroundLatency !== null}
                <span class="latency-badge">
                  ⚡ Response time: <strong>{playgroundLatency}ms</strong>
                </span>
              {/if}
            </div>

            {#if playgroundResponse}
              <div class="playground-output">
                <span class="output-title">Model Response:</span>
                <div class="output-box">{playgroundResponse}</div>
              </div>
            {/if}
          </div>
        </Card>
      {/if}

      <!-- Tab 2: App Ecosystem & Backend -->
      {#if activeTab === 'app'}
        <div class="grid-2-col">
          <Card title="Appwrite Cloud Database" icon="cloud" padding="md">
            <div class="appwrite-status-list">
              <div class="status-item">
                <span class="status-lbl">Database ID:</span>
                <code>{DATABASE_ID}</code>
              </div>
              <div class="status-item">
                <span class="status-lbl">Endpoint:</span>
                <code>https://fra.cloud.appwrite.io/v1</code>
              </div>
              <div class="status-item">
                <span class="status-lbl">Sync Engine:</span>
                <span class="status-pill active">Online / Auto Queue</span>
              </div>
              <div class="status-item">
                <span class="status-lbl">Current Active User:</span>
                <strong>{$appStore?.user?.name || 'Guest'} ({$appStore?.user?.occupation || 'Desk Worker'})</strong>
              </div>
            </div>
          </Card>

          <Card title="Device & Browser Diagnostics" icon="devices" padding="md">
            {#if diagnostics}
              <div class="diag-list">
                <div class="status-item">
                  <span class="status-lbl">Notifications:</span>
                  <span class="status-pill {diagnostics.notifications === 'granted' ? 'configured' : 'missing'}">
                    {diagnostics.notifications}
                  </span>
                </div>
                <div class="status-item">
                  <span class="status-lbl">Storage Quota:</span>
                  <span>{diagnostics.storageQuota}</span>
                </div>
                <div class="status-item">
                  <span class="status-lbl">Service Worker:</span>
                  <span class="status-pill {diagnostics.serviceWorker === 'active' ? 'configured' : 'missing'}">
                    {diagnostics.serviceWorker}
                  </span>
                </div>
                <div class="status-item">
                  <span class="status-lbl">PWA Mode:</span>
                  <span>{diagnostics.pwaInstalled ? 'Standalone Installed' : 'Browser View'}</span>
                </div>
              </div>
            {:else}
              <p>Loading diagnostics report...</p>
            {/if}
          </Card>
        </div>

        <Card title="Security & Admin Passcode" icon="lock" padding="md">
          <p class="section-desc">Change the administrative password protecting this console.</p>
          <div class="passcode-form">
            <input
              type="password"
              bind:value={newPasswordInput}
              placeholder="Enter new admin passcode (min 4 characters)"
              class="passcode-input"
            />
            <Button variant="secondary" size="md" icon="check" onclick={handleUpdatePasscode}>
              Update Passcode
            </Button>
          </div>
          {#if passwordNotice}
            <div class="success-banner" style="margin-top: 10px;">{passwordNotice}</div>
          {/if}
        </Card>
      {/if}

      <!-- Tab 3: Activity Logs -->
      {#if activeTab === 'logs'}
        <Card title="Recent AI Assistant Request Telemetry" icon="history" padding="lg">
          <p class="section-desc">Real-time trace logs of AI queries, models invoked, token usage, and latency.</p>

          <div class="logs-table-wrap">
            {#if metrics.recentLogs.length > 0}
              <table class="logs-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Date</th>
                    <th>Provider</th>
                    <th>Model</th>
                    <th>Tokens</th>
                    <th>Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {#each metrics.recentLogs as log}
                    <tr>
                      <td>{log.timestamp}</td>
                      <td>{log.date}</td>
                      <td><strong>{log.provider}</strong></td>
                      <td><code>{log.model}</code></td>
                      <td>~{log.tokens} tokens</td>
                      <td>
                        <span class="speed-tag">{log.latencyMs}ms</span>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            {:else}
              <div class="empty-logs">
                <span class="material-symbols-outlined">inbox</span>
                <p>No queries logged yet. Ask questions in the AI Assistant to see telemetry traces here!</p>
              </div>
            {/if}
          </div>
        </Card>
      {/if}
    </div>
  {/if}
</div>

<style>
  .admin-page {
    width: 100%;
    min-height: 100vh;
    padding: 32px 24px;
    box-sizing: border-box;
    background: #f8fafc;
  }

  :global(.dark-mode) .admin-page {
    background: #0b0f19;
  }

  /* Login Screen */
  .admin-login-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80vh;
  }

  .admin-login-card {
    width: 100%;
    max-width: 480px;
    background: var(--surface-1, #ffffff);
    border: 1px solid var(--border-card);
    border-radius: 24px;
    padding: 36px;
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  :global(.dark-mode) .admin-login-card {
    background: #0f172a;
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  }

  .shield-avatar {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }

  .shield-avatar span {
    font-size: 32px;
  }

  .login-title {
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--text-heading);
    margin: 0 0 6px 0;
  }

  .login-subtitle {
    font-size: 0.88rem;
    color: var(--text-muted);
    line-height: 1.5;
    margin: 0;
  }

  .admin-login-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group label {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-heading);
  }

  .form-group input {
    padding: 12px 16px;
    border-radius: 12px;
    border: 1.5px solid var(--border-card);
    font-size: 0.95rem;
    outline: none;
    transition: all 0.2s ease;
  }

  .form-group input:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
  }

  .demo-login-box {
    text-align: center;
    padding-top: 10px;
    border-top: 1px dashed var(--border-card);
  }

  .demo-hint {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin: 0 0 8px 0;
  }

  .demo-btn {
    width: 100%;
    padding: 10px 16px;
    border-radius: 12px;
    background: #eef2ff;
    color: #4338ca;
    border: 1px solid #c7d2fe;
    font-size: 0.88rem;
    font-weight: 750;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  :global(.dark-mode) .demo-btn {
    background: rgba(99, 102, 241, 0.2);
    color: #c7d2fe;
    border-color: rgba(99, 102, 241, 0.4);
  }

  .demo-btn:hover {
    background: #4338ca;
    color: #ffffff;
  }

  .back-link {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 0.84rem;
    font-weight: 600;
    cursor: pointer;
    text-align: center;
    margin-top: 8px;
  }

  .back-link:hover {
    color: var(--text-heading);
    text-decoration: underline;
  }

  /* Admin Main Dashboard */
  .admin-dashboard-container {
    max-width: 1240px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .admin-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    background: var(--surface-1, #ffffff);
    border: 1px solid var(--border-card);
    border-radius: 20px;
  }

  :global(.dark-mode) .admin-header {
    background: #0f172a;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .admin-header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .admin-badge-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .title-with-badge {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .admin-title {
    font-size: 1.35rem;
    font-weight: 850;
    margin: 0;
    color: var(--text-heading);
  }

  .admin-subtitle {
    font-size: 0.82rem;
    color: var(--text-muted);
    margin: 4px 0 0 0;
  }

  .admin-header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .header-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 0.82rem;
    font-weight: 750;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
  }

  .header-btn.secondary {
    background: var(--surface-2, #e2e8f0);
    color: var(--text-heading);
  }

  .header-btn.danger {
    background: #fee2e2;
    color: #dc2626;
  }

  .header-btn:hover {
    transform: translateY(-1px);
  }

  /* Tabs */
  .admin-tabs {
    display: flex;
    gap: 8px;
    border-bottom: 1px solid var(--border-card);
    padding-bottom: 4px;
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: 12px;
    background: transparent;
    border: none;
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tab-btn.active {
    background: #4f46e5;
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
  }

  /* Metrics Grid */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 16px;
  }

  .metric-card {
    background: var(--surface-1, #ffffff);
    border: 1px solid var(--border-card);
    border-radius: 18px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
  }

  :global(.dark-mode) .metric-card {
    background: #0f172a;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .metric-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .metric-title {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .metric-icon {
    font-size: 20px;
    padding: 6px;
    border-radius: 8px;
  }

  .metric-icon.purple { background: #f3e8ff; color: #9333ea; }
  .metric-icon.blue { background: #e0f2fe; color: #0284c7; }
  .metric-icon.amber { background: #fef3c7; color: #d97706; }
  .metric-icon.green { background: #dcfce7; color: #16a34a; }

  .metric-value {
    font-size: 1.8rem;
    font-weight: 850;
    color: var(--text-heading);
  }

  .metric-sub {
    font-size: 0.76rem;
    color: var(--text-muted);
  }

  /* Models Table */
  .models-table-wrap, .logs-table-wrap {
    overflow-x: auto;
    margin-top: 12px;
  }

  .models-table, .logs-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
  }

  .models-table th, .logs-table th {
    text-align: left;
    padding: 12px 16px;
    border-bottom: 2px solid var(--border-card);
    color: var(--text-muted);
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .models-table td, .logs-table td {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-card);
    vertical-align: middle;
  }

  .priority-pill {
    padding: 4px 8px;
    border-radius: 6px;
    background: #e0e7ff;
    color: #4338ca;
    font-weight: 800;
    font-size: 0.78rem;
  }

  .speed-tag {
    font-size: 0.78rem;
    color: var(--text-muted);
    font-weight: 600;
  }

  .status-pill {
    padding: 4px 10px;
    border-radius: 99px;
    font-size: 0.74rem;
    font-weight: 750;
    display: inline-flex;
    align-items: center;
  }

  .status-pill.active, .status-pill.configured {
    background: #dcfce7;
    color: #15803d;
  }

  .status-pill.missing {
    background: #fee2e2;
    color: #b91c1c;
  }

  .ping-tag {
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 0.76rem;
    font-weight: 700;
  }

  .ping-tag.loading { background: #e0f2fe; color: #0369a1; }
  .ping-tag.success { background: #dcfce7; color: #15803d; }
  .ping-tag.error { background: #fee2e2; color: #b91c1c; }
  .ping-tag.neutral { background: #f1f5f9; color: #64748b; }

  .ping-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: 8px;
    background: #e0e7ff;
    color: #4338ca;
    border: 1px solid #c7d2fe;
    font-size: 0.78rem;
    font-weight: 750;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .ping-btn:hover:not(:disabled) {
    background: #4338ca;
    color: #ffffff;
  }

  .ping-icon {
    font-size: 16px;
  }

  /* Grid Layouts */
  .grid-2-col {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 20px;
  }

  .section-desc {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin: 0 0 16px 0;
    line-height: 1.5;
  }

  /* Limit Slider */
  .limit-slider-wrap {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 16px 0;
  }

  .slider-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
  }

  .limit-display {
    color: #4f46e5;
    font-size: 1rem;
  }

  .limit-range {
    width: 100%;
    accent-color: #4f46e5;
  }

  .limit-quick-buttons {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .chip-preset {
    padding: 4px 10px;
    border-radius: 8px;
    background: var(--surface-2, #e2e8f0);
    border: none;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-heading);
    cursor: pointer;
  }

  .limit-actions-row {
    display: flex;
    gap: 10px;
    margin-top: 12px;
  }

  /* Providers Bar List */
  .providers-bar-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .p-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.82rem;
    margin-bottom: 4px;
  }

  .p-bar-track {
    width: 100%;
    height: 8px;
    background: rgba(148, 163, 184, 0.2);
    border-radius: 99px;
    overflow: hidden;
  }

  .p-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    border-radius: 99px;
  }

  /* Playground */
  .playground-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .pg-lbl {
    font-size: 0.82rem;
    font-weight: 750;
    color: var(--text-heading);
  }

  .pg-textarea {
    width: 100%;
    padding: 12px 16px;
    border-radius: 12px;
    border: 1.5px solid var(--border-card);
    font-size: 0.9rem;
    outline: none;
    box-sizing: border-box;
    font-family: inherit;
  }

  .pg-textarea:focus {
    border-color: #4f46e5;
  }

  .playground-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .latency-badge {
    font-size: 0.82rem;
    color: #10b981;
    font-weight: 700;
  }

  .playground-output {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
  }

  .output-title {
    font-size: 0.82rem;
    font-weight: 800;
    color: var(--text-heading);
  }

  .output-box {
    padding: 16px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid var(--border-card);
    font-size: 0.9rem;
    line-height: 1.6;
    white-space: pre-wrap;
  }

  :global(.dark-mode) .output-box {
    background: #1e293b;
    border-color: rgba(255, 255, 255, 0.1);
  }

  /* Banners */
  .success-banner {
    padding: 10px 14px;
    border-radius: 10px;
    background: #dcfce7;
    color: #15803d;
    font-size: 0.82rem;
    font-weight: 750;
  }

  .error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 10px;
    background: #fee2e2;
    color: #dc2626;
    font-size: 0.84rem;
  }

  /* Diagnostics Status Items */
  .appwrite-status-list, .diag-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--border-card);
    font-size: 0.86rem;
  }

  .status-lbl {
    color: var(--text-muted);
  }

  /* Passcode Form */
  .passcode-form {
    display: flex;
    gap: 10px;
    max-width: 480px;
  }

  .passcode-input {
    flex: 1;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1.5px solid var(--border-card);
    outline: none;
  }

  .empty-logs, .empty-state {
    text-align: center;
    padding: 24px;
    color: var(--text-muted);
    font-size: 0.88rem;
  }

  .empty-logs span {
    font-size: 36px;
    margin-bottom: 8px;
    opacity: 0.5;
  }

  /* Unanswered Queries List */
  .unanswered-scroll-box {
    max-height: 280px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-right: 4px;
  }

  .unanswered-item {
    background: var(--surface-2, #f8fafc);
    border: 1px solid var(--border-card);
    border-radius: 10px;
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  :global(.dark-mode) .unanswered-item {
    background: rgba(30, 41, 59, 0.6);
  }

  .unanswered-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.74rem;
  }

  .unanswered-time {
    color: var(--text-muted);
    font-weight: 600;
  }

  .unanswered-reason {
    color: #b45309;
    background: #fef3c7;
    padding: 2px 8px;
    border-radius: 99px;
    font-weight: 700;
    font-size: 0.7rem;
  }

  :global(.dark-mode) .unanswered-reason {
    color: #fef08a;
    background: rgba(180, 83, 9, 0.4);
  }

  .unanswered-query {
    margin: 0;
    font-size: 0.84rem;
    color: var(--text-heading);
    font-weight: 600;
    font-style: italic;
  }
</style>
