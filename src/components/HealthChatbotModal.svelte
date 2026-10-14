<script>
  import { tick, onMount } from 'svelte';
  import { generateAIResponse, validateAndSanitizeQuery } from '../services/aiProvider.js';
  import { buildHealthCoachPrompt } from '../services/aiPrompts.js';
  import { resolveLocalIntent } from '../services/aiRouter.js';
  import { getCachedResponse, setCachedResponse } from '../services/aiCache.js';
  import {
    getDailyCredits,
    isAdminAuthenticated,
    recordMessageFeedback,
    recordUnansweredQuery,
    recordCacheHit,
    recordIntentResolved
  } from '../services/aiUsage.js';
  import { appStore, navigateTo } from '../stores/app.js';
  import { getMondayFirstDayIndex } from '../utils/date.js';
  import { calculateSittingHoursForDay } from '../utils/sitting.js';

  export let isOpen = false;
  export let onclose = () => {};

  let inputQuery = '';
  let isLoading = false;
  let chatFeedElement = null;
  let activeAbortController = null;
  let copiedMessageId = null;
  let isChatCopied = false;
  let isMaximized = false;
  let selectedLang = 'en';
  let feedbackState = {};
  let lastFailedQuery = '';

  const DEFAULT_GREETING = {
    id: 1,
    sender: 'bot',
    text: "👋 Hi! I'm your **StretchNow AI Health & Website Assistant**.\nAsk me about desk ergonomics, neck strain relief, guided stretches, or navigating any StretchNow feature! Available in English, తెలుగు, and हिन्दी."
  };

  let messages = [DEFAULT_GREETING];
  let dailyCredits = { limit: 10, used: 0, remaining: 10, isUnlimited: false };

  function refreshCredits() {
    const isAdmin = isAdminAuthenticated();
    dailyCredits = getDailyCredits(isAdmin);
  }

  const MULTILINGUAL_QUESTIONS = {
    en: [
      '🧘 Relieve neck & shoulder tension',
      '💧 How much water while sitting?',
      '👀 Explain 20-20-20 eye rule',
      '🏃 2-Minute office stretch routine',
      '🪑 Ideal ergonomic chair setup',
      '⚙️ Where to set reminder interval?'
    ],
    te: [
      '🧘 మెడ, భుజాల నొప్పి నివారణ వ్యాయామాలు',
      '💧 డెస్క్ వద్ద రోజూ ఎంత నీరు తాగాలి?',
      '👀 20-20-20 కంటి విశ్రాంతి సూత్రం ఏమిటి?',
      '🏃 2 నిమిషాల సులభమైన ఆఫీస్ రొటీన్',
      '⚙️ స్ట్రెచ్ రిమైండర్ సమయం ఎలా మార్చాలి?'
    ],
    hi: [
      '🧘 गर्दन और कंधों के दर्द के लिए स्ट्रेच',
      '💧 काम के दौरान कितना पानी पीना चाहिए?',
      '👀 20-20-20 आंखों का नियम समझाइए',
      '🏃 2-मिनट का आसान ऑफिस स्ट्रेच',
      '⚙️ स्ट्रेच रिमाइंडर्स की सेटिंग कहां है?'
    ]
  };

  $: currentChips = MULTILINGUAL_QUESTIONS[selectedLang] || MULTILINGUAL_QUESTIONS.en;

  let chipsElement = null;
  let canScrollLeft = false;
  let canScrollRight = false;

  function updateScrollButtons() {
    if (!chipsElement) return;
    canScrollLeft = chipsElement.scrollLeft > 4;
    canScrollRight = chipsElement.scrollLeft + chipsElement.clientWidth < chipsElement.scrollWidth - 4;
  }

  function scrollChips(offset) {
    if (!chipsElement) return;
    chipsElement.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(updateScrollButtons, 300);
  }

  function handleChipsWheel(e) {
    if (!chipsElement) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      chipsElement.scrollLeft += e.deltaY;
      updateScrollButtons();
      e.preventDefault();
    }
  }

  $: if (isOpen) {
    refreshCredits();
    if ($appStore?.user?.language && ['en', 'te', 'hi'].includes($appStore.user.language)) {
      selectedLang = $appStore.user.language;
    }
    scrollToBottom();
    tick().then(() => {
      updateScrollButtons();
    });
  }

  onMount(() => {
    refreshCredits();
    if ($appStore?.user?.language && ['en', 'te', 'hi'].includes($appStore.user.language)) {
      selectedLang = $appStore.user.language;
    }
  });

  async function scrollToBottom() {
    await tick();
    if (chatFeedElement) {
      chatFeedElement.scrollTop = chatFeedElement.scrollHeight;
    }
  }

  function handleNewChat() {
    if (isLoading && activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
      isLoading = false;
    }
    messages = [{ ...DEFAULT_GREETING, id: Date.now() }];
    inputQuery = '';
    lastFailedQuery = '';
    feedbackState = {};
    refreshCredits();
    scrollToBottom();
  }

  function handleStop() {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }
    isLoading = false;
  }

  /**
   * @param {string} text
   * @param {number | null} [id]
   */
  async function copyToClipboard(text, id = null) {
    try {
      await navigator.clipboard.writeText(text);
      if (id !== null) {
        copiedMessageId = id;
        setTimeout(() => { copiedMessageId = null; }, 2000);
      } else {
        isChatCopied = true;
        setTimeout(() => { isChatCopied = false; }, 2000);
      }
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
  }

  function copyFullChat() {
    const transcript = messages
      .map(m => `[${m.sender === 'bot' ? 'StretchNow Coach' : 'You'}]:\n${stripNavTags(m.text)}`)
      .join('\n\n--------------------\n\n');
    copyToClipboard(transcript, null);
  }

  function parseMessageSegments(text) {
    if (!text) return [];
    const cleaned = stripNavTags(text);
    const segments = [];
    const regex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(cleaned)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ isBold: false, text: cleaned.slice(lastIndex, match.index) });
      }
      segments.push({ isBold: true, text: match[1] });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < cleaned.length) {
      segments.push({ isBold: false, text: cleaned.slice(lastIndex) });
    }
    return segments;
  }

  const ROUTE_INFO = {
    home: { label: 'Go to Dashboard', icon: 'dashboard' },
    break: { label: 'Start Guided Break', icon: 'self_improvement' },
    library: { label: 'Open Stretch Library', icon: 'menu_book' },
    statistics: { label: 'View Health Analytics', icon: 'monitoring' },
    settings: { label: 'Open Preferences', icon: 'settings' },
    admin: { label: 'Open Admin Console', icon: 'shield_person' },
    login: { label: 'Cloud Sync Login', icon: 'login' }
  };

  function extractNavActions(text) {
    if (!text) return [];
    const matches = text.matchAll(/\[nav:([a-z0-9_-]+)\]/gi);
    const actions = [];
    for (const match of matches) {
      const route = match[1].toLowerCase();
      if (ROUTE_INFO[route] && !actions.some(a => a.route === route)) {
        actions.push({ route, ...ROUTE_INFO[route] });
      }
    }
    return actions;
  }

  function stripNavTags(text) {
    if (!text) return '';
    return text.replace(/\[nav:[a-z0-9_-]+\]/gi, '').replace(/\[support:contact\]/gi, '').trim();
  }

  function isSupportNeeded(text) {
    if (!text) return false;
    return /\[support:contact\]/i.test(text) ||
      /\b(human agent|human support|contact support|customer service|complaint|talk to doctor|physiotherapist consultation|medical emergency)\b/i.test(text);
  }

  function handleNavigate(route) {
    onclose();
    navigateTo(route);
  }

  function handleFeedback(msgId, rating) {
    feedbackState[msgId] = rating;
    feedbackState = { ...feedbackState };
    const lastUser = [...messages].reverse().find(m => m.id < msgId && m.sender === 'user');
    recordMessageFeedback(msgId, rating, lastUser?.text || '');
  }

  async function handleSend(queryText = '') {
    const textToSend = queryText || inputQuery;
    if (!textToSend || !textToSend.trim() || isLoading) return;

    // Check daily query limit
    refreshCredits();
    if (!dailyCredits.isUnlimited && dailyCredits.remaining <= 0) {
      return;
    }

    const rawText = textToSend.trim();
    inputQuery = '';

    // Validate and sanitize user input for safety and privacy
    const { valid, sanitized, error } = validateAndSanitizeQuery(rawText);
    if (!valid) {
      messages = [
        ...messages,
        { id: Date.now(), sender: 'bot', text: `🛡️ **Input Notice**: ${error || 'Please enter a valid question.'}` }
      ];
      scrollToBottom();
      return;
    }

    const userText = sanitized;
    const newMsg = { id: Date.now(), sender: 'user', text: userText };
    messages = [...messages, newMsg];
    scrollToBottom();

    // Prepare user context state
    const userState = $appStore?.user || {};
    const progressState = $appStore?.progress || {};
    const statsState = $appStore?.statistics || {};
    const todayIndex = getMondayFirstDayIndex();
    const todaySittingHours = (statsState.sittingHours && statsState.sittingHours[todayIndex] > 0)
      ? statsState.sittingHours[todayIndex]
      : calculateSittingHoursForDay(userState, todayIndex, progressState.completedBreaksToday || 0, todayIndex);

    // Feature #5: Intent-Based Fast-Path Routing (0 tokens, 0 delay, credits preserved)
    const localMatch = resolveLocalIntent(userText, {
      userName: userState.name || 'Friend',
      language: selectedLang,
      breaksCompleted: progressState.completedBreaksToday || 0,
      dailyBreakGoal: userState.dailyBreakGoal || 6,
      waterCount: progressState.water || 0,
      dailyWaterGoal: userState.dailyWaterGoal || 8,
      todaySittingHours,
      streak: progressState.streak || 1
    });

    if (localMatch.handled && localMatch.response) {
      recordIntentResolved(localMatch.reason || 'local_intent');
      messages = [
        ...messages,
        { id: Date.now() + 1, sender: 'bot', text: localMatch.response }
      ];
      scrollToBottom();
      return;
    }

    // Feature #4: Cache Repeated Answers & Quick Chips (0 tokens, 0 delay, credits preserved)
    const cachedAnswer = getCachedResponse(userText, selectedLang);
    if (cachedAnswer) {
      recordCacheHit({ query: userText });
      messages = [
        ...messages,
        { id: Date.now() + 1, sender: 'bot', text: cachedAnswer }
      ];
      scrollToBottom();
      return;
    }

    // Check daily query limit before calling LLM
    refreshCredits();
    if (!dailyCredits.isUnlimited && dailyCredits.remaining <= 0) {
      return;
    }

    isLoading = true;
    lastFailedQuery = '';
    activeAbortController = new AbortController();

    // Prepare multi-turn conversation messages context (Sliding window enforced in provider)
    const conversationPayload = messages.map(m => ({
      role: m.sender === 'bot' ? 'assistant' : 'user',
      content: stripNavTags(m.text)
    }));

    // Features #1 & #3: Short prompt + Targeted RAG knowledge retrieval
    const systemPrompt = buildHealthCoachPrompt({
      occupation: userState.occupation || 'Desk Worker',
      breaksCompleted: progressState.completedBreaksToday || 0,
      dailyBreakGoal: userState.dailyBreakGoal || 6,
      waterCount: progressState.water || 0,
      dailyWaterGoal: userState.dailyWaterGoal || 8,
      todaySittingHours,
      streak: progressState.streak || 1,
      userName: userState.name || 'Friend',
      language: selectedLang,
      query: userText
    });

    try {
      const botResponse = await generateAIResponse(conversationPayload, systemPrompt, {
        signal: activeAbortController.signal
      });

      // Save valid response into cache for repeated queries
      setCachedResponse(userText, selectedLang, botResponse);

      messages = [
        ...messages,
        { id: Date.now() + 1, sender: 'bot', text: botResponse }
      ];
    } catch (err) {
      const e = /** @type {any} */ (err);
      if (e?.name === 'AbortError' || activeAbortController?.signal?.aborted) {
        messages = [
          ...messages,
          { id: Date.now() + 1, sender: 'bot', text: '⏹ *Response paused by user.*' }
        ];
      } else {
        lastFailedQuery = userText;
        recordUnansweredQuery(userText, 'Connection or generation error');
        messages = [
          ...messages,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: "💡 **Quick Tip**: Sit upright with shoulders relaxed and take 5 deep breaths! (AI connection momentarily busy). [support:contact]",
            isError: true
          }
        ];
      }
    } finally {
      isLoading = false;
      activeAbortController = null;
      refreshCredits();
      scrollToBottom();
    }
  }

  function handleRetry() {
    if (lastFailedQuery) {
      const q = lastFailedQuery;
      lastFailedQuery = '';
      handleSend(q);
    }
  }

  function handleGoToAdmin() {
    onclose();
    navigateTo('admin');
  }
</script>

{#if isOpen}
  <div class="chatbot-backdrop animate-fade-in" role="dialog" aria-modal="true">
    <div class="chatbot-container {isMaximized ? 'maximized' : ''}">
      <!-- Header -->
      <header class="chatbot-header">
        <div class="header-title-wrap">
          <div class="bot-avatar">
            <span class="material-symbols-outlined">smart_toy</span>
          </div>
          <div class="title-info">
            <div class="title-row">
              <h3 class="bot-name">StretchNow Health AI</h3>
              {#if dailyCredits.isUnlimited}
                <span class="admin-badge">Admin Unlimited</span>
              {/if}
            </div>
            <span class="bot-status">
              <span class="status-dot"></span> Active • Multi-Model Failover
            </span>
          </div>
        </div>

        <!-- Header Actions: Copy All, New Chat, Maximize, Close -->
        <div class="header-actions">
          <button
            type="button"
            class="action-icon-btn"
            on:click={copyFullChat}
            title={isChatCopied ? 'Chat Copied!' : 'Copy Full Chat Transcript'}
            aria-label="Copy Full Chat"
          >
            <span class="material-symbols-outlined {isChatCopied ? 'success-icon' : ''}">
              {isChatCopied ? 'check' : 'content_copy'}
            </span>
          </button>

          <button
            type="button"
            class="action-icon-btn"
            on:click={handleNewChat}
            title="Start Fresh Chat Session"
            aria-label="Start New Chat"
          >
            <span class="material-symbols-outlined">restart_alt</span>
          </button>

          <button
            type="button"
            class="action-icon-btn"
            on:click={() => isMaximized = !isMaximized}
            title={isMaximized ? 'Restore Size' : 'Maximize Assistant'}
            aria-label="Toggle Size"
          >
            <span class="material-symbols-outlined">{isMaximized ? 'fullscreen_exit' : 'fullscreen'}</span>
          </button>

          <button type="button" class="close-btn" on:click={onclose} aria-label="Close Chatbot">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      </header>

      <!-- Credits & Limit Status Bar -->
      <div class="credits-bar">
        <div class="credits-info">
          <span class="material-symbols-outlined credit-ico">bolt</span>
          {#if dailyCredits.isUnlimited}
            <span class="credit-text"><strong>Unlimited Credits</strong> (Admin Mode)</span>
          {:else}
            <span class="credit-text">
              Daily Credits: <strong>{dailyCredits.remaining} / {dailyCredits.limit}</strong> remaining
            </span>
          {/if}
        </div>
        {#if !dailyCredits.isUnlimited}
          <div class="credit-track">
            <div
              class="credit-fill"
              style="width: {Math.min(100, (dailyCredits.remaining / dailyCredits.limit) * 100)}%"
            ></div>
          </div>
        {/if}
      </div>

      <!-- Multilingual Language Selector Strip -->
      <div class="lang-strip">
        <span class="lang-label">
          <span class="material-symbols-outlined lang-ico">translate</span>
          Lang:
        </span>
        <button
          type="button"
          class="lang-pill {selectedLang === 'en' ? 'active' : ''}"
          on:click={() => selectedLang = 'en'}
        >
          English
        </button>
        <button
          type="button"
          class="lang-pill {selectedLang === 'te' ? 'active' : ''}"
          on:click={() => selectedLang = 'te'}
        >
          తెలుగు
        </button>
        <button
          type="button"
          class="lang-pill {selectedLang === 'hi' ? 'active' : ''}"
          on:click={() => selectedLang = 'hi'}
        >
          हिन्दी
        </button>
      </div>

      <!-- Quick Suggestion Chips with Scroll -->
      <div class="quick-chips-wrapper">
        {#if canScrollLeft}
          <button
            type="button"
            class="chips-scroll-btn left"
            on:click={() => scrollChips(-180)}
            title="Scroll left"
            aria-label="Scroll left"
          >
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
        {/if}

        <div
          class="quick-chips"
          bind:this={chipsElement}
          on:scroll={updateScrollButtons}
          on:wheel={handleChipsWheel}
        >
          {#each currentChips as chip}
            <button
              type="button"
              class="chip-btn"
              disabled={isLoading || (!dailyCredits.isUnlimited && dailyCredits.remaining <= 0)}
              on:click={() => handleSend(chip)}
            >
              {chip}
            </button>
          {/each}
        </div>

        {#if canScrollRight}
          <button
            type="button"
            class="chips-scroll-btn right"
            on:click={() => scrollChips(180)}
            title="Scroll right"
            aria-label="Scroll right"
          >
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        {/if}
      </div>

      <!-- Chat Feed -->
      <div class="chat-feed" bind:this={chatFeedElement}>
        {#each messages as msg (msg.id)}
          <div class="message-wrapper {msg.sender}">
            {#if msg.sender === 'bot'}
              <div class="msg-avatar">
                <span class="material-symbols-outlined">psychology</span>
              </div>
            {/if}
            <div class="message-bubble {msg.sender}">
              <div class="msg-content">
                <p class="msg-text">
                  {#each parseMessageSegments(msg.text) as segment}
                    {#if segment.isBold}
                      <strong>{segment.text}</strong>
                    {:else}
                      {segment.text}
                    {/if}
                  {/each}
                </p>
              </div>

              <!-- Interactive Website Navigation Action Buttons -->
              {#if msg.sender === 'bot'}
                {@const navActions = extractNavActions(msg.text)}
                {#if navActions.length > 0}
                  <div class="nav-shortcuts-grid">
                    {#each navActions as nav}
                      <button
                        type="button"
                        class="nav-shortcut-btn"
                        on:click={() => handleNavigate(nav.route)}
                      >
                        <span class="material-symbols-outlined nav-btn-ico">{nav.icon}</span>
                        <span class="nav-btn-lbl">{nav.label}</span>
                        <span class="material-symbols-outlined nav-arrow">arrow_forward</span>
                      </button>
                    {/each}
                  </div>
                {/if}

                <!-- Human Support Fallback Card -->
                {#if isSupportNeeded(msg.text) || msg.isError}
                  <div class="support-card animate-fade-in">
                    <div class="support-card-head">
                      <div class="support-icon-wrap">
                        <span class="material-symbols-outlined support-ico">support_agent</span>
                      </div>
                      <div class="support-head-text">
                        <strong class="support-card-title">Human Health & App Support</strong>
                        <span class="support-card-sub">Reach our clinical ergonomics team or get help</span>
                      </div>
                    </div>
                    <div class="support-card-body">
                      <a
                        href="mailto:support@stretchnow.app?subject=StretchNow%20Support%20Request"
                        class="support-mail-btn"
                      >
                        <span class="material-symbols-outlined">mail</span>
                        <span>Email Support (support@stretchnow.app)</span>
                      </a>
                      {#if lastFailedQuery}
                        <button type="button" class="retry-btn" on:click={handleRetry}>
                          <span class="material-symbols-outlined">replay</span>
                          <span>Retry Question</span>
                        </button>
                      {/if}
                      <p class="support-disclaimer">
                        ⚠️ <em>Note:</em> For sharp, shooting, or acute nerve pain, stop stretching and consult a licensed physician or physiotherapist.
                      </p>
                    </div>
                  </div>
                {/if}

                <!-- Message Footer with Thumbs Up/Down and Copy Button -->
                <div class="msg-footer">
                  <div class="feedback-group">
                    <button
                      type="button"
                      class="msg-feedback-btn {feedbackState[msg.id] === 'up' ? 'active-up' : ''}"
                      on:click={() => handleFeedback(msg.id, 'up')}
                      title="Helpful response"
                      aria-label="Thumbs up"
                    >
                      <span class="material-symbols-outlined feedback-ico">thumb_up</span>
                    </button>
                    <button
                      type="button"
                      class="msg-feedback-btn {feedbackState[msg.id] === 'down' ? 'active-down' : ''}"
                      on:click={() => handleFeedback(msg.id, 'down')}
                      title="Not helpful"
                      aria-label="Thumbs down"
                    >
                      <span class="material-symbols-outlined feedback-ico">thumb_down</span>
                    </button>
                    {#if feedbackState[msg.id]}
                      <span class="feedback-ack">Saved</span>
                    {/if}
                  </div>

                  <button
                    type="button"
                    class="msg-copy-btn"
                    on:click={() => copyToClipboard(stripNavTags(msg.text), msg.id)}
                    title={copiedMessageId === msg.id ? 'Copied to clipboard!' : 'Copy this answer'}
                  >
                    <span class="material-symbols-outlined copy-icon">
                      {copiedMessageId === msg.id ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedMessageId === msg.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              {/if}
            </div>
          </div>
        {/each}

        {#if isLoading}
          <div class="message-wrapper bot">
            <div class="msg-avatar">
              <span class="material-symbols-outlined">psychology</span>
            </div>
            <div class="message-bubble bot typing-bubble">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-label">Formulating clinical advice...</span>
            </div>
          </div>
        {/if}
      </div>

      <!-- Stop Generating Floating Action (if generating) -->
      {#if isLoading}
        <div class="floating-stop-wrap animate-fade-in">
          <button type="button" class="floating-stop-btn" on:click={handleStop}>
            <span class="material-symbols-outlined">stop_circle</span>
            <span>Stop generating</span>
          </button>
        </div>
      {/if}

      <!-- Daily Limit Reached Warning -->
      {#if !dailyCredits.isUnlimited && dailyCredits.remaining <= 0}
        <div class="limit-reached-banner animate-fade-in">
          <div class="limit-content">
            <span class="material-symbols-outlined limit-icon">hourglass_top</span>
            <div class="limit-text">
              <strong>Daily limit reached ({dailyCredits.limit}/{dailyCredits.limit})</strong>
              <span>Resets tomorrow at midnight. Upgrade or sign in as Admin for unlimited access.</span>
            </div>
          </div>
          <button type="button" class="admin-link-btn" on:click={handleGoToAdmin}>
            Admin Login
          </button>
        </div>
      {/if}

      <!-- Input Area -->
      <form on:submit|preventDefault={() => handleSend()} class="chat-input-bar">
        <input
          type="text"
          bind:value={inputQuery}
          placeholder={!dailyCredits.isUnlimited && dailyCredits.remaining <= 0 ? 'Daily query limit reached' : 'Ask about desk ergonomics, stretches, pain relief...'}
          disabled={isLoading || (!dailyCredits.isUnlimited && dailyCredits.remaining <= 0)}
        />

        {#if isLoading}
          <button
            type="button"
            class="stop-btn"
            on:click={handleStop}
            title="Stop Generating"
            aria-label="Stop Generating"
          >
            <span class="material-symbols-outlined">stop</span>
          </button>
        {:else}
          <button
            type="submit"
            class="send-btn"
            disabled={!inputQuery.trim() || (!dailyCredits.isUnlimited && dailyCredits.remaining <= 0)}
            title="Send Question"
          >
            <span class="material-symbols-outlined">send</span>
          </button>
        {/if}
      </form>
    </div>
  </div>
{/if}

<style>
  .chatbot-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(15, 23, 42, 0.2);
    backdrop-filter: blur(2px);
    pointer-events: auto;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    padding: 24px;
    box-sizing: border-box;
  }

  /* Increased Size Container */
  .chatbot-container {
    width: 100%;
    max-width: 560px;
    height: 720px;
    max-height: 88vh;
    background: var(--surface-1, #ffffff);
    border: 1px solid var(--border-card, rgba(226, 232, 240, 0.9));
    border-radius: var(--radius-lg, 24px);
    box-shadow: 0 25px 60px rgba(15, 23, 42, 0.35);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .chatbot-container.maximized {
    max-width: 820px;
    height: 860px;
    max-height: 94vh;
  }

  :global(.dark-mode) .chatbot-container {
    background: #0f172a;
    border-color: rgba(255, 255, 255, 0.14);
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
  }

  /* Header */
  .chatbot-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: var(--surface-elevated, #f8fafc);
    border-bottom: 1px solid var(--border-card);
  }

  :global(.dark-mode) .chatbot-header {
    background: #1e293b;
  }

  .header-title-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .bot-avatar {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--primary, #6366f1) 0%, var(--color-ai, #8b5cf6) 100%);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px var(--primary-glow);
  }

  .title-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .bot-name {
    font-family: var(--font-heading);
    font-size: 1.05rem;
    font-weight: 800;
    color: var(--text-heading);
    margin: 0;
  }

  .admin-badge {
    font-size: 0.68rem;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 99px;
    background: #fef3c7;
    color: #b45309;
    border: 1px solid #fde68a;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  :global(.dark-mode) .admin-badge {
    background: rgba(245, 158, 11, 0.2);
    color: #fcd34d;
    border-color: rgba(245, 158, 11, 0.4);
  }

  .bot-status {
    font-size: 0.74rem;
    color: var(--color-success, #10b981);
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .status-dot {
    width: 7px;
    height: 7px;
    background: var(--color-success, #10b981);
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .action-icon-btn, .close-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    margin: 0 !important;
  }

  .action-icon-btn:hover, .close-btn:hover {
    background: var(--surface-2);
    color: var(--text-heading);
  }

  .success-icon {
    color: var(--color-success, #10b981);
  }

  /* Credits Bar */
  .credits-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 18px;
    background: #f1f5f9;
    border-bottom: 1px solid var(--border-card);
    font-size: 0.75rem;
  }

  :global(.dark-mode) .credits-bar {
    background: #151e2e;
  }

  .credits-info {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-muted);
  }

  .credit-ico {
    font-size: 16px;
    color: #eab308;
  }

  .credit-text strong {
    color: var(--text-heading);
  }

  .credit-track {
    width: 80px;
    height: 6px;
    background: rgba(148, 163, 184, 0.3);
    border-radius: 99px;
    overflow: hidden;
  }

  .credit-fill {
    height: 100%;
    background: linear-gradient(90deg, #6366f1, #10b981);
    border-radius: 99px;
    transition: width 0.3s ease;
  }

  /* Multilingual Language Selector Strip */
  .lang-strip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(241, 245, 249, 0.7);
    border-bottom: 1px solid var(--border-card);
    font-size: 0.78rem;
    overflow-x: auto;
  }

  :global(.dark-mode) .lang-strip {
    background: rgba(15, 23, 42, 0.75);
  }

  .lang-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 700;
    color: var(--text-muted);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    flex-shrink: 0;
  }

  .lang-ico {
    font-size: 15px;
    color: #6366f1;
  }

  .lang-pill {
    padding: 3px 10px;
    border-radius: 99px;
    font-size: 0.76rem;
    font-weight: 650;
    background: var(--surface-1, #ffffff);
    color: var(--text-muted);
    border: 1px solid var(--border-card);
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
    margin: 0 !important;
  }

  .lang-pill:hover {
    color: #4f46e5;
    border-color: #818cf8;
    background: #eef2ff;
  }

  .lang-pill.active {
    background: #4f46e5;
    color: #ffffff;
    border-color: #4f46e5;
    box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25);
  }

  :global(.dark-mode) .lang-pill {
    background: #1e293b;
    color: #94a3b8;
    border-color: rgba(255, 255, 255, 0.12);
  }

  :global(.dark-mode) .lang-pill:hover {
    color: #c7d2fe;
    border-color: #6366f1;
  }

  :global(.dark-mode) .lang-pill.active {
    background: #6366f1;
    color: #ffffff;
    border-color: #6366f1;
  }

  /* Quick Chips Wrapper & Controls */
  .quick-chips-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: #f8fafc;
    border-bottom: 1px solid var(--border-card);
  }

  :global(.dark-mode) .quick-chips-wrapper {
    background: #0f172a;
  }

  .quick-chips {
    display: flex;
    gap: 8px;
    padding: 10px 16px 10px 16px;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: rgba(99, 102, 241, 0.4) transparent;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }

  .quick-chips::-webkit-scrollbar {
    height: 4px;
  }

  .quick-chips::-webkit-scrollbar-track {
    background: transparent;
  }

  .quick-chips::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.3);
    border-radius: 99px;
  }

  .quick-chips::-webkit-scrollbar-thumb:hover {
    background: rgba(99, 102, 241, 0.6);
  }

  :global(.dark-mode) .quick-chips {
    scrollbar-color: rgba(165, 180, 252, 0.4) transparent;
  }

  :global(.dark-mode) .quick-chips::-webkit-scrollbar-thumb {
    background: rgba(165, 180, 252, 0.35);
  }

  :global(.dark-mode) .quick-chips::-webkit-scrollbar-thumb:hover {
    background: rgba(165, 180, 252, 0.7);
  }

  .chips-scroll-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #ffffff;
    border: 1px solid rgba(99, 102, 241, 0.3);
    color: #4f46e5;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.16);
    z-index: 5;
    transition: all 0.2s ease;
    padding: 0 !important;
    margin: 0 !important;
  }

  .chips-scroll-btn:hover {
    background: #4f46e5;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
    transform: translateY(-50%) scale(1.1);
  }

  .chips-scroll-btn.left {
    left: 4px;
  }

  .chips-scroll-btn.right {
    right: 4px;
  }

  .chips-scroll-btn .material-symbols-outlined {
    font-size: 18px;
    line-height: 1;
  }

  :global(.dark-mode) .chips-scroll-btn {
    background: #1e293b;
    border-color: rgba(165, 180, 252, 0.35);
    color: #c7d2fe;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }

  :global(.dark-mode) .chips-scroll-btn:hover {
    background: #6366f1;
    color: #ffffff;
  }

  .chip-btn {
    white-space: nowrap;
    font-size: 0.78rem;
    font-weight: 700;
    color: #4338ca;
    background: #e0e7ff;
    border: 1px solid rgba(99, 102, 241, 0.3);
    padding: 6px 14px;
    border-radius: 99px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin: 0 !important;
    flex-shrink: 0;
  }

  :global(.dark-mode) .chip-btn {
    color: #c7d2fe;
    background: rgba(99, 102, 241, 0.25);
    border-color: rgba(165, 180, 252, 0.3);
  }

  .chip-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
    transform: translateY(-1px);
  }

  .chip-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  /* Chat Feed */
  .chat-feed {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: #ffffff;
    scroll-behavior: smooth;
  }

  :global(.dark-mode) .chat-feed {
    background: #0b0f19;
  }

  .message-wrapper {
    display: flex;
    gap: 12px;
    max-width: 90%;
  }

  .message-wrapper.user {
    align-self: flex-end;
    flex-direction: row-reverse;
  }

  .message-wrapper.bot {
    align-self: flex-start;
  }

  .msg-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
    color: #4338ca;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
  }

  :global(.dark-mode) .msg-avatar {
    background: rgba(99, 102, 241, 0.3);
    color: #a5b4fc;
  }

  .message-bubble {
    padding: 14px 18px;
    border-radius: 18px;
    font-size: 0.93rem;
    line-height: 1.6;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .message-bubble.bot {
    background: #f8fafc;
    border: 1px solid rgba(99, 102, 241, 0.22);
    border-left: 4px solid #4f46e5;
    border-top-left-radius: 4px;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
  }

  :global(.dark-mode) .message-bubble.bot {
    background: #1e293b;
    border-color: rgba(255, 255, 255, 0.14);
    border-left-color: #8b5cf6;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
  }

  .message-bubble.user {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: #ffffff;
    font-weight: 600;
    border-top-right-radius: 4px;
    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
  }

  .msg-text {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    color: #0f172a;
  }

  :global(.dark-mode) .msg-text {
    color: #f8fafc;
  }

  .message-bubble.user .msg-text {
    color: #ffffff;
  }

  /* Interactive Navigation Shortcuts */
  .nav-shortcuts-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 8px 0 4px 0;
  }

  .nav-shortcut-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 10px;
    background: #eef2ff;
    color: #4338ca;
    border: 1px solid rgba(99, 102, 241, 0.3);
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    margin: 0 !important;
  }

  :global(.dark-mode) .nav-shortcut-btn {
    background: rgba(99, 102, 241, 0.2);
    color: #c7d2fe;
    border-color: rgba(165, 180, 252, 0.3);
  }

  .nav-shortcut-btn:hover {
    background: #4f46e5;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
    transform: translateY(-1px);
  }

  .nav-btn-ico {
    font-size: 15px;
  }

  .nav-arrow {
    font-size: 14px;
    opacity: 0.7;
  }

  /* Human Support Fallback Card */
  .support-card {
    margin: 10px 0 4px 0;
    padding: 12px 14px;
    background: rgba(254, 242, 242, 0.9);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-left: 4px solid #ef4444;
    border-radius: 12px;
  }

  :global(.dark-mode) .support-card {
    background: rgba(69, 10, 10, 0.4);
    border-color: rgba(239, 68, 68, 0.4);
    border-left-color: #f87171;
  }

  .support-card-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .support-icon-wrap {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #fee2e2;
    color: #dc2626;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .support-ico {
    font-size: 16px;
  }

  .support-head-text {
    display: flex;
    flex-direction: column;
  }

  .support-card-title {
    font-size: 0.84rem;
    color: #991b1b;
    margin: 0;
  }

  :global(.dark-mode) .support-card-title {
    color: #fca5a5;
  }

  .support-card-sub {
    font-size: 0.74rem;
    color: #7f1d1d;
  }

  :global(.dark-mode) .support-card-sub {
    color: #f87171;
  }

  .support-card-body {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .support-mail-btn,
  .retry-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    background: #dc2626;
    color: #ffffff !important;
    text-decoration: none;
    font-size: 0.76rem;
    font-weight: 700;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
    width: fit-content;
  }

  .support-mail-btn:hover {
    background: #b91c1c;
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
  }

  .retry-btn {
    background: #4b5563;
  }

  .retry-btn:hover {
    background: #374151;
  }

  .support-disclaimer {
    font-size: 0.72rem;
    color: #7f1d1d;
    margin: 4px 0 0 0;
    line-height: 1.4;
  }

  :global(.dark-mode) .support-disclaimer {
    color: #fca5a5;
  }

  /* Message Footer & Copy / Feedback Controls */
  .msg-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px dashed rgba(148, 163, 184, 0.3);
  }

  .feedback-group {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .msg-feedback-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 0.75rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3px 6px;
    border-radius: 6px;
    transition: all 0.2s ease;
    margin: 0 !important;
  }

  .feedback-ico {
    font-size: 14px;
  }

  .msg-feedback-btn:hover {
    background: rgba(99, 102, 241, 0.1);
    color: #4f46e5;
  }

  .msg-feedback-btn.active-up {
    color: #10b981;
    background: rgba(16, 185, 129, 0.15);
  }

  .msg-feedback-btn.active-down {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.15);
  }

  .feedback-ack {
    font-size: 0.7rem;
    color: #10b981;
    font-weight: 700;
    margin-left: 2px;
  }

  .msg-copy-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 0.73rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 6px;
    transition: all 0.2s ease;
    margin: 0 !important;
  }

  .msg-copy-btn:hover {
    background: rgba(99, 102, 241, 0.1);
    color: #4f46e5;
  }

  .copy-icon {
    font-size: 14px;
  }

  /* Typing Dots */
  .typing-bubble {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    padding: 14px 18px;
  }

  .typing-dot {
    width: 8px;
    height: 8px;
    background: #4f46e5;
    border-radius: 50%;
    animation: typingBounce 1.4s infinite ease-in-out both;
  }

  .typing-dot:nth-child(1) { animation-delay: 0s; }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }

  .typing-label {
    font-size: 0.78rem;
    color: var(--text-muted);
    margin-left: 6px;
    font-style: italic;
  }

  @keyframes typingBounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1.1); opacity: 1; }
  }

  /* Floating Stop Pill */
  .floating-stop-wrap {
    display: flex;
    justify-content: center;
    padding: 6px 16px;
    background: transparent;
  }

  .floating-stop-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 16px;
    border-radius: 99px;
    background: #fee2e2;
    color: #dc2626;
    border: 1px solid #fecaca;
    font-size: 0.8rem;
    font-weight: 750;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
    transition: all 0.2s ease;
    margin: 0 !important;
  }

  :global(.dark-mode) .floating-stop-btn {
    background: rgba(220, 38, 38, 0.2);
    border-color: rgba(220, 38, 38, 0.4);
    color: #f87171;
  }

  .floating-stop-btn:hover {
    background: #dc2626;
    color: #ffffff;
    transform: scale(1.03);
  }

  /* Limit Reached Banner */
  .limit-reached-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 18px;
    background: #fffbeb;
    border-top: 1px solid #fef3c7;
    border-bottom: 1px solid #fef3c7;
  }

  :global(.dark-mode) .limit-reached-banner {
    background: #1c1917;
    border-color: rgba(245, 158, 11, 0.3);
  }

  .limit-content {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .limit-icon {
    font-size: 22px;
    color: #f59e0b;
  }

  .limit-text {
    display: flex;
    flex-direction: column;
    font-size: 0.78rem;
    line-height: 1.35;
  }

  .limit-text strong {
    color: #b45309;
  }

  :global(.dark-mode) .limit-text strong {
    color: #fcd34d;
  }

  .admin-link-btn {
    white-space: nowrap;
    padding: 6px 12px;
    border-radius: 8px;
    background: #f59e0b;
    color: #ffffff;
    font-size: 0.75rem;
    font-weight: 800;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    margin: 0 !important;
  }

  .admin-link-btn:hover {
    background: #d97706;
  }

  /* Input Bar */
  .chat-input-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 18px;
    background: #f8fafc;
    border-top: 1px solid var(--border-card);
  }

  :global(.dark-mode) .chat-input-bar {
    background: #1e293b;
  }

  .chat-input-bar input {
    flex: 1;
    padding: 12px 18px;
    border-radius: 99px;
    border: 1.5px solid rgba(99, 102, 241, 0.25);
    background: #ffffff;
    color: #0f172a;
    font-weight: 600;
    font-size: 0.92rem;
    outline: none;
    margin: 0 !important;
    transition: all 0.2s ease;
  }

  :global(.dark-mode) .chat-input-bar input {
    background: #0f172a;
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.2);
  }

  .chat-input-bar input:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
  }

  .send-btn, .stop-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    color: #ffffff;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    margin: 0 !important;
    flex-shrink: 0;
  }

  .send-btn {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  }

  .send-btn:hover:not(:disabled) {
    transform: scale(1.08);
    box-shadow: 0 6px 18px rgba(79, 70, 229, 0.45);
  }

  .send-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .stop-btn {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35);
    animation: pulseStop 1.5s infinite;
  }

  .stop-btn:hover {
    transform: scale(1.08);
  }

  @keyframes pulseStop {
    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
    50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
  }

  @media (max-width: 640px) {
    .chatbot-backdrop {
      padding: 0;
    }
    .chatbot-container {
      max-width: 100%;
      height: 100vh;
      max-height: 100vh;
      border-radius: 0;
    }
  }
</style>
