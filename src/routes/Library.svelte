<script>
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  import Modal from '../components/Modal.svelte';
  import { navigateTo } from '../stores/app.js';
  import { STRETCH_CATEGORIES, STRETCHES } from '../utils/stretches.js';
  import StretchAnimation from '../components/StretchAnimation.svelte';

  let selectedCategory = 'all';
  let searchQuery = '';
  let activeModalStretch = null;

  $: filteredStretches = STRETCHES.filter((s) => {
    const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.target.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  function openStretchModal(stretch) {
    activeModalStretch = stretch;
  }

  function closeModal() {
    activeModalStretch = null;
  }
</script>

<div class="library-screen animate-fade-in">
  <div class="header">
    <h2 class="title">Stretch Library</h2>
    <p class="subtitle">Targeted routines for desk fatigue & tension relief.</p>
  </div>

  <!-- Search Input -->
  <div class="search-wrap">
    <span class="material-symbols-outlined search-icon">search</span>
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Search neck, back, wrists, eyes..."
    />
    {#if searchQuery}
      <button class="clear-btn" on:click={() => searchQuery = ''} aria-label="Clear search">
        <span class="material-symbols-outlined">close</span>
      </button>
    {/if}
  </div>

  <!-- Category Pills -->
  <div class="categories-scroll">
    {#each STRETCH_CATEGORIES as cat}
      <button
        class="cat-pill {selectedCategory === cat.id ? 'active' : ''}"
        on:click={() => selectedCategory = cat.id}
      >
        <span class="material-symbols-outlined pill-icon">{cat.icon}</span>
        <span>{cat.label}</span>
      </button>
    {/each}
  </div>

  <!-- Stretches Grid -->
  <div class="stretches-list">
    {#if filteredStretches.length === 0}
      <div class="empty-state">
        <span class="material-symbols-outlined empty-icon">search_off</span>
        <p>No routines match your search filter.</p>
      </div>
    {:else}
      {#each filteredStretches as s}
        <button class="card-item" on:click={() => openStretchModal(s)}>
          <Card hover padding="md">
            <div class="item-inner">
              <div class="item-icon-wrap">
                <span class="material-symbols-outlined item-icon">{s.icon}</span>
              </div>
              <div class="item-info">
                <div class="item-top">
                  <h4 class="item-title">{s.title}</h4>
                  <span class="badge badge-{s.difficulty.toLowerCase()}">{s.difficulty}</span>
                </div>
                <span class="item-target">🎯 {s.target}</span>
                <span class="item-duration">⏱️ {s.duration} seconds</span>
              </div>
            </div>
          </Card>
        </button>
      {/each}
    {/if}
  </div>

  <!-- Detail Modal -->
  {#if activeModalStretch}
    <Modal isOpen={true} title={activeModalStretch.title} onclose={closeModal}>
      <div class="modal-detail">
        <!-- Dynamic Stretch Animation Guide -->
        <StretchAnimation id={activeModalStretch.id} />

        <div class="detail-header">
          <div>
            <span class="detail-target">Target: {activeModalStretch.target}</span>
            <span class="detail-time">{activeModalStretch.duration} sec • {activeModalStretch.difficulty}</span>
          </div>
        </div>

        <h4 class="section-heading">Step-by-Step Instructions</h4>
        <div class="modal-steps-wrap">
          {#each activeModalStretch.instructions as step, idx}
            <div class="modal-step-item">
              <span class="step-num">{idx + 1}</span>
              <span>{step}</span>
            </div>
          {/each}
        </div>

        {#if activeModalStretch.tips}
          <div class="modal-tip">
            <span class="material-symbols-outlined tip-icon">lightbulb</span>
            <p>{activeModalStretch.tips}</p>
          </div>
        {/if}
      </div>

      <div slot="footer" class="modal-footer-btns">
        <Button variant="outline" size="md" onclick={closeModal}>
          Close
        </Button>
        <Button variant="primary" size="md" icon="play_arrow" onclick={() => { closeModal(); navigateTo('break'); }}>
          Start Routine
        </Button>
      </div>
    </Modal>
  {/if}
</div>

<style>
  .library-screen {
    padding: 24px 20px 110px;
    max-width: 480px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-sizing: border-box;
    background: var(--bg-gradient, transparent);
  }

  .title {
    margin: 0;
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--text-heading);
    letter-spacing: -0.02em;
  }

  .subtitle {
    margin: 4px 0 0;
    font-size: 0.88rem;
    color: var(--text-muted);
  }

  .search-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 14px;
    color: var(--text-muted);
    font-size: 20px;
  }

  .search-wrap input {
    width: 100%;
    padding: 12px 38px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-card);
    font-size: 0.92rem;
    font-family: inherit;
    background: var(--bg-card);
    color: var(--text-heading);
    box-sizing: border-box;
    outline: none;
    transition: all 0.2s ease;
  }

  .search-wrap input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-glow);
  }

  .clear-btn {
    position: absolute;
    right: 12px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    display: flex;
    align-items: center;
  }

  .categories-scroll {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 6px;
    scrollbar-width: none;
  }

  .categories-scroll::-webkit-scrollbar {
    display: none;
  }

  .cat-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--bg-card);
    border: 1px solid var(--border-card);
    padding: 8px 14px;
    border-radius: 99px;
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text-muted);
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .cat-pill.active {
    background: var(--primary);
    color: #ffffff;
    border-color: var(--primary);
    box-shadow: 0 4px 12px var(--primary-glow);
  }

  .pill-icon {
    font-size: 18px;
  }

  .stretches-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .card-item {
    cursor: pointer;
    background: transparent;
    border: none;
    padding: 0;
    margin: 0;
    width: 100%;
    text-align: left;
    font: inherit;
    color: inherit;
  }

  .item-inner {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  .item-icon-wrap {
    width: 46px;
    height: 46px;
    background: var(--primary-light);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .item-icon {
    font-size: 24px;
    color: var(--primary);
  }

  .item-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex-grow: 1;
  }

  .item-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .item-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-heading);
  }

  .badge {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 8px;
  }

  .badge-easy { background: var(--emerald-light); color: var(--emerald); }
  .badge-medium { background: var(--amber-light); color: var(--amber); }
  .badge-gentle { background: var(--primary-light); color: var(--primary); }

  .item-target {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .item-duration {
    font-size: 0.78rem;
    color: var(--primary);
    font-weight: 700;
  }

  .empty-state {
    text-align: center;
    padding: 40px 0;
    color: var(--text-muted);
  }

  .empty-icon {
    font-size: 48px;
  }

  .detail-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 16px;
  }

  .detail-icon-wrap {
    width: 52px;
    height: 52px;
    background: var(--primary-light);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .detail-icon {
    font-size: 30px;
    color: var(--primary);
  }

  .detail-target {
    display: block;
    font-size: 0.86rem;
    font-weight: 700;
    color: var(--emerald);
  }

  .detail-time {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .section-heading {
    margin: 14px 0 10px;
    font-size: 0.98rem;
    font-weight: 800;
    color: var(--text-heading);
  }

  .modal-steps-wrap {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .modal-step-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 0.88rem;
    color: var(--text-heading);
    line-height: 1.45;
  }

  .step-num {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--primary-light);
    color: var(--primary);
    font-size: 0.72rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .modal-tip {
    background: var(--amber-light);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 16px;
  }

  .tip-icon {
    color: var(--amber);
    font-size: 20px;
    flex-shrink: 0;
  }

  .modal-tip p {
    margin: 0;
    font-size: 0.82rem;
    color: var(--amber);
    font-weight: 600;
  }

  .modal-footer-btns {
    display: flex;
    gap: 10px;
    width: 100%;
    justify-content: flex-end;
  }
</style>

