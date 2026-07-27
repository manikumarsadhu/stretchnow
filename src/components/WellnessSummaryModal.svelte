<script>
  import Modal from './Modal.svelte';
  import Button from './Button.svelte';
  import { appStore, addReflection, updateSettings } from '../stores/app.js';
  import { calculateWellnessScore } from '../utils/wellnessScore.js';
  import { compileDailySummary } from '../utils/summaryGenerator.js';
  import { getAICoachAdvice } from '../services/aiCoach.js';

  export let isOpen = false;
  export let onclose = () => {};

  $: progress = $appStore.progress || {};
  $: user = $appStore.user || {};
  $: statistics = $appStore.statistics || {};

  $: wellnessScore = calculateWellnessScore(progress, user, statistics);
  $: summary = compileDailySummary(progress, user, wellnessScore);

  // Reflection states
  let selectedMood = '🙂';
  let reflectionNotes = '';
  const MOODS = ['🙂', '😐', '🙁'];

  // AI loading and caching states
  let aiAdvice = '';
  let isLoadingAI = false;

  $: displayAdvice = aiAdvice || summary.recommendation;

  async function handleGenerateAIAdvice() {
    isLoadingAI = true;
    try {
      const liveAdvice = await getAICoachAdvice(progress, user, statistics);
      if (liveAdvice) {
        aiAdvice = liveAdvice;
      }
    } catch (err) {
      console.warn("AI generation failed:", err);
    } finally {
      isLoadingAI = false;
    }
  }

  function handleSaveReflection() {
    const today = new Date().toISOString().split('T')[0];
    addReflection(today, {
      mood: selectedMood,
      notes: reflectionNotes.trim(),
      score: wellnessScore,
      breaks: summary.breaksCompleted,
      water: summary.waterCount,
      timestamp: Date.now()
    });

    // Mark summary as shown today in progress
    appStore.update(state => ({
      ...state,
      progress: {
        ...state.progress,
        lastSummaryShownDate: today
      }
    }));

    onclose();
  }

  function handleSnoozeSummary() {
    const snoozeDuration = 30; // Snooze for 30 minutes
    const snoozeTimeMs = snoozeDuration * 60 * 1000;

    // Reset summary date so it will trigger again post snooze
    setTimeout(() => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification("StretchNow Summary", {
          body: "Time to review your workday posture summary! 📅",
          icon: "/icon-192.png"
        });
      }
      // Force trigger summary modal by clearing the summary shown date
      appStore.update(state => ({
        ...state,
        progress: {
          ...state.progress,
          lastSummaryShownDate: null
        }
      }));
    }, snoozeTimeMs);

    onclose();
  }

  function getStars(score) {
    const starsCount = Math.round(score / 20);
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += i <= starsCount ? '★' : '☆';
    }
    return stars;
  }

  function renderBlocks(completed, goal) {
    const filled = Math.min(goal, completed);
    let str = '';
    for (let i = 0; i < filled; i++) str += '■';
    for (let i = filled; i < goal; i++) str += '□';
    return str;
  }
</script>

<Modal {isOpen} title="Daily Wellness Summary 🏆" onclose={onclose}>
  <div class="summary-wrapper">
    <p class="summary-intro">Great work today, <strong>{user.name || 'Friend'}</strong>! Here is your daily posture & wellness report.</p>

    <!-- Metrics Cards -->
    <div class="metrics-grid">
      <div class="metric-row">
        <span class="m-label">Breaks Completed</span>
        <div class="m-val-wrap">
          <span class="blocks">{renderBlocks(summary.breaksCompleted, summary.breakGoal)}</span>
          <span class="numeric">{summary.breaksCompleted} / {summary.breakGoal}</span>
        </div>
      </div>

      <div class="metric-row">
        <span class="m-label">Hydration Goal</span>
        <div class="m-val-wrap">
          <span class="blocks">{renderBlocks(summary.waterCount, summary.waterGoal)}</span>
          <span class="numeric">{summary.waterCount} / {summary.waterGoal} c</span>
        </div>
      </div>

      <div class="metric-row">
        <span class="m-label">Sitting Time</span>
        <span class="m-value text-amber">{summary.sittingHours} hrs today</span>
      </div>

      <div class="metric-row">
        <span class="m-label">Wellness Score</span>
        <div class="score-wrap">
          <span class="score-stars">{getStars(wellnessScore)}</span>
          <span class="score-num">{wellnessScore} / 100</span>
        </div>
      </div>

      <div class="metric-row inline-stats">
        <span>XP Earned: <strong>+{summary.breaksCompleted * 50} XP</strong></span>
        <span>Streak Status: <strong>{summary.streak} Days 🔥</strong></span>
      </div>
    </div>

    <!-- AI Coaching & Insights -->
    <div class="coach-advice-box">
      <div class="advice-header">
        <span class="material-symbols-outlined advice-icon">spa</span>
        <span class="advice-title">Wellness Coach Recommendation</span>
      </div>
      <p class="advice-content">{displayAdvice}</p>
      
      {#if !aiAdvice}
        <button class="ai-gen-btn" on:click={handleGenerateAIAdvice} disabled={isLoadingAI}>
          <span class="material-symbols-outlined btn-ico">auto_awesome</span>
          <span>{isLoadingAI ? 'Analyzing...' : 'Generate Personalized AI Advice'}</span>
        </button>
      {/if}
    </div>

    <!-- Daily Reflection notes -->
    <div class="reflection-box">
      <span class="reflection-label">How is your body feeling today?</span>
      <div class="mood-selector">
        {#each MOODS as m}
          <button
            class="mood-btn {selectedMood === m ? 'active' : ''}"
            on:click={() => selectedMood = m}
          >
            {m}
          </button>
        {/each}
      </div>

      <span class="reflection-label">Short Reflection Notes</span>
      <textarea
        class="reflection-textarea"
        bind:value={reflectionNotes}
        placeholder="e.g. My neck felt much better after the stretching breaks."
        rows="3"
      ></textarea>
    </div>
  </div>

  <div slot="footer" class="summary-footer">
    <Button variant="outline" size="md" icon="snooze" onclick={handleSnoozeSummary}>
      Remind Me Later
    </Button>
    <Button variant="primary" size="md" icon="check_circle" onclick={handleSaveReflection}>
      Save Reflection & Finish
    </Button>
  </div>
</Modal>

<style>
  .summary-wrapper {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .summary-intro {
    margin: 0;
    font-size: 0.88rem;
    color: var(--text-main);
    line-height: 1.45;
  }

  .metrics-grid {
    background: rgba(148, 163, 184, 0.08);
    border: 1px solid var(--border-card);
    border-radius: var(--radius-sm);
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .metric-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.84rem;
    color: var(--text-main);
  }

  .m-label {
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    font-size: 0.72rem;
    letter-spacing: 0.04em;
  }

  .m-val-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .blocks {
    font-family: monospace;
    font-size: 0.95rem;
    letter-spacing: 2px;
    color: var(--primary);
  }

  .numeric {
    font-weight: 700;
    font-size: 0.84rem;
    color: var(--text-heading);
  }

  .m-value {
    font-weight: 700;
  }

  .score-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .score-stars {
    color: var(--amber);
    font-size: 0.9rem;
    letter-spacing: 1px;
  }

  .score-num {
    font-weight: 800;
    color: var(--text-heading);
  }

  .inline-stats {
    padding-top: 8px;
    border-top: 1px dashed var(--border-card);
    display: flex;
    justify-content: space-between;
    width: 100%;
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .coach-advice-box {
    background: var(--primary-light);
    border: 1px solid var(--primary-glow);
    border-radius: var(--radius-sm);
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .advice-header {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--primary);
  }

  .advice-icon {
    font-size: 20px;
  }

  .advice-title {
    font-size: 0.84rem;
    font-weight: 800;
  }

  .advice-content {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.45;
    color: var(--text-main);
  }

  .ai-gen-btn {
    align-self: flex-start;
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--primary);
    border: none;
    border-radius: 8px;
    color: #ffffff;
    padding: 6px 12px;
    font-size: 0.76rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .ai-gen-btn:hover:not(:disabled) {
    background: var(--primary-hover);
  }

  .ai-gen-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-ico {
    font-size: 14px;
  }

  /* Reflection box styling */
  .reflection-box {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .reflection-label {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text-heading);
  }

  .mood-selector {
    display: flex;
    gap: 12px;
    margin-bottom: 4px;
  }

  .mood-btn {
    flex-grow: 1;
    background: var(--bg-app);
    border: 1px solid var(--border-card);
    border-radius: 10px;
    padding: 8px;
    font-size: 1.3rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .mood-btn:hover {
    border-color: var(--primary);
    background: var(--bg-card-hover);
  }

  .mood-btn.active {
    background: var(--primary-light);
    border-color: var(--primary);
    box-shadow: 0 4px 10px var(--primary-glow);
  }

  .reflection-textarea {
    width: 100%;
    padding: 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-card);
    background: var(--bg-app);
    color: var(--text-heading);
    font-size: 0.84rem;
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
    resize: none;
  }

  .reflection-textarea:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-glow);
  }

  .summary-footer {
    display: flex;
    width: 100%;
    gap: 10px;
    justify-content: flex-end;
  }
</style>
