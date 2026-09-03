<script>
  import { tick } from 'svelte';
  import { generateAIResponse } from '../services/aiProvider.js';

  export let isOpen = false;
  export let onclose = () => {};

  let inputQuery = '';
  let isLoading = false;
  let chatFeedElement = null;

  let messages = [
    {
      id: 1,
      sender: 'bot',
      text: "👋 Hi! I'm your StretchNow AI Health & Posture Coach. Ask me anything about desk ergonomics, neck strain relief, hydration, or quick workplace stretches!"
    }
  ];

  const QUICK_QUESTIONS = [
    '🧘 Relieve neck & shoulder tension',
    '💧 How much water while sitting?',
    '👀 Explain 20-20-20 eye rule',
    '🏃 2-Minute office stretch routine'
  ];

  async function scrollToBottom() {
    await tick();
    if (chatFeedElement) {
      chatFeedElement.scrollTop = chatFeedElement.scrollHeight;
    }
  }

  async function handleSend(queryText = '') {
    const textToSend = queryText || inputQuery;
    if (!textToSend || !textToSend.trim() || isLoading) return;

    const userText = textToSend.trim();
    inputQuery = '';

    messages = [
      ...messages,
      { id: Date.now(), sender: 'user', text: userText }
    ];
    scrollToBottom();

    isLoading = true;

    try {
      const systemPrompt = "You are StretchNow AI, a friendly, concise wellness and desk ergonomics coach. Provide actionable, easy-to-read health advice in 2-4 short bullet points or sentences.";
      const botResponse = await generateAIResponse(userText, systemPrompt);

      messages = [
        ...messages,
        { id: Date.now() + 1, sender: 'bot', text: botResponse }
      ];
    } catch {
      messages = [
        ...messages,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: "💡 Quick Tip: Sit upright with shoulders relaxed and take 5 deep breaths! (AI connection momentarily busy)."
        }
      ];
    } finally {
      isLoading = false;
      scrollToBottom();
    }
  }
</script>

{#if isOpen}
  <div class="chatbot-backdrop animate-fade-in" role="dialog" aria-modal="true">
    <div class="chatbot-container">
      <!-- Header -->
      <header class="chatbot-header">
        <div class="header-title-wrap">
          <div class="bot-avatar">
            <span class="material-symbols-outlined">smart_toy</span>
          </div>
          <div class="title-info">
            <h3 class="bot-name">StretchNow Health AI</h3>
            <span class="bot-status">
              <span class="status-dot"></span> Active • Multi-Model Failover
            </span>
          </div>
        </div>
        <button type="button" class="close-btn" on:click={onclose} aria-label="Close Chatbot">
          <span class="material-symbols-outlined">close</span>
        </button>
      </header>

      <!-- Quick Suggestion Chips -->
      <div class="quick-chips">
        {#each QUICK_QUESTIONS as chip}
          <button type="button" class="chip-btn" on:click={() => handleSend(chip)}>
            {chip}
          </button>
        {/each}
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
              <p class="msg-text">{msg.text}</p>
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
            </div>
          </div>
        {/if}
      </div>

      <!-- Input Area -->
      <form on:submit|preventDefault={() => handleSend()} class="chat-input-bar">
        <input
          type="text"
          bind:value={inputQuery}
          placeholder="Ask a health, posture, or stretch question..."
          disabled={isLoading}
        />
        <button type="submit" class="send-btn" disabled={isLoading || !inputQuery.trim()} title="Send Question">
          <span class="material-symbols-outlined">send</span>
        </button>
      </form>
    </div>
  </div>
{/if}

<style>
  .chatbot-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: transparent;
    pointer-events: none;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    padding: 20px;
    box-sizing: border-box;
  }

  .chatbot-container {
    pointer-events: auto;
    width: 100%;
    max-width: 440px;
    height: 600px;
    max-height: 90vh;
    background: var(--surface-1, #ffffff);
    border: 1px solid var(--border-card, rgba(226, 232, 240, 0.8));
    border-radius: var(--radius-lg, 24px);
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  :global(.dark-mode) .chatbot-container {
    background: #0f172a;
    border-color: rgba(255, 255, 255, 0.12);
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
    width: 38px;
    height: 38px;
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
  }

  .bot-name {
    font-family: var(--font-heading);
    font-size: 1rem;
    font-weight: 800;
    color: var(--text-heading);
    margin: 0;
  }

  .bot-status {
    font-size: 0.72rem;
    color: var(--color-success, #10b981);
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    background: var(--color-success, #10b981);
    border-radius: 50%;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--anim-card);
    margin: 0 !important;
  }

  .close-btn:hover {
    background: var(--surface-2);
    color: var(--text-heading);
  }

  /* Quick Chips */
  .quick-chips {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    overflow-x: auto;
    background: #f8fafc;
    border-bottom: 1px solid var(--border-card);
    scrollbar-width: none;
  }

  :global(.dark-mode) .quick-chips {
    background: #0f172a;
  }

  .quick-chips::-webkit-scrollbar { display: none; }

  .chip-btn {
    white-space: nowrap;
    font-size: 0.78rem;
    font-weight: 750;
    color: #4338ca;
    background: #e0e7ff;
    border: 1px solid rgba(99, 102, 241, 0.35);
    padding: 6px 14px;
    border-radius: 99px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin: 0 !important;
    flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(99, 102, 241, 0.12);
  }

  :global(.dark-mode) .chip-btn {
    color: #c7d2fe;
    background: rgba(99, 102, 241, 0.25);
    border-color: rgba(165, 180, 252, 0.3);
  }

  .chip-btn:hover {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
    transform: translateY(-1px);
  }

  /* Chat Feed */
  .chat-feed {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 14px;
    background: #ffffff;
  }

  :global(.dark-mode) .chat-feed {
    background: #0b0f19;
  }

  .message-wrapper {
    display: flex;
    gap: 10px;
    max-width: 88%;
  }

  .message-wrapper.user {
    align-self: flex-end;
    flex-direction: row-reverse;
  }

  .message-wrapper.bot {
    align-self: flex-start;
  }

  .msg-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
    color: #4338ca;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
  }

  :global(.dark-mode) .msg-avatar {
    background: rgba(99, 102, 241, 0.3);
    color: #a5b4fc;
  }

  .message-bubble {
    padding: 13px 18px;
    border-radius: 18px;
    font-size: 0.92rem;
    line-height: 1.55;
    transition: all 0.2s ease;
  }

  .message-bubble.bot {
    background: #f8fafc;
    border: 1px solid rgba(99, 102, 241, 0.22);
    border-left: 4px solid #4f46e5;
    border-top-left-radius: 4px;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
  }

  :global(.dark-mode) .message-bubble.bot {
    background: #1e293b;
    border-color: rgba(255, 255, 255, 0.15);
    border-left-color: #8b5cf6;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
  }

  .message-bubble.user {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: #ffffff;
    font-weight: 700;
    border-top-right-radius: 4px;
    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
  }

  .msg-text {
    margin: 0;
    white-space: pre-wrap;
    font-weight: 650;
    color: #0f172a;
    letter-spacing: 0.01em;
  }

  :global(.dark-mode) .msg-text {
    color: #f8fafc;
  }

  .message-bubble.user .msg-text {
    color: #ffffff;
  }

  /* Typing Dots */
  .typing-bubble {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 14px 18px;
  }

  .typing-dot {
    width: 7px;
    height: 7px;
    background: #4f46e5;
    border-radius: 50%;
    animation: typingBounce 1.4s infinite ease-in-out both;
  }

  .typing-dot:nth-child(1) { animation-delay: 0s; }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }

  @keyframes typingBounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1.1); opacity: 1; }
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
    padding: 11px 16px;
    border-radius: 99px;
    border: 1.5px solid rgba(99, 102, 241, 0.25);
    background: #ffffff;
    color: #0f172a;
    font-weight: 600;
    font-size: 0.9rem;
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

  .send-btn {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: #ffffff;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    margin: 0 !important;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  }

  .send-btn:hover:not(:disabled) {
    transform: scale(1.08);
    box-shadow: 0 6px 18px rgba(79, 70, 229, 0.45);
  }

  .send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
