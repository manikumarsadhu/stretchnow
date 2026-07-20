<script>
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  import Modal from '../components/Modal.svelte';
  import { navigateTo } from '../stores/app.js';
  import { STRETCH_CATEGORIES, STRETCHES } from '../utils/stretches.js';

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

<div class="library-screen">
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
      <button class="clear-btn" on:click={() => searchQuery = ''}>
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
              <span class="material-symbols-outlined item-icon">{s.icon}</span>
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
        <div class="detail-header">
          <span class="material-symbols-outlined detail-icon">{activeModalStretch.icon}</span>
          <div>
            <span class="detail-target">Target: {activeModalStretch.target}</span>
            <span class="detail-time">{activeModalStretch.duration} sec • {activeModalStretch.difficulty}</span>
          </div>
        </div>

        <h4 class="section-heading">Step-by-Step Instructions</h4>
        <ol class="modal-steps">
          {#each activeModalStretch.instructions as step}
            <li>{step}</li>
          {/each}
        </ol>

        {#if activeModalStretch.tips}
          <div class="modal-tip">
            <span class="material-symbols-outlined">lightbulb</span>
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
    padding: 24px 20px 100px;
    max-width: 480px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-sizing: border-box;
  }

  .title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-h, #1f2937);
  }

  .subtitle {
    margin: 4px 0 0;
    font-size: 0.85rem;
    color: var(--text, #6b7280);
  }

  .search-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 14px;
    color: #94a3b8;
    font-size: 20px;
  }

  .search-wrap input {
    width: 100%;
    padding: 10px 38px;
    border-radius: 14px;
    border: 1px solid rgba(226, 232, 240, 0.9);
    font-size: 0.9rem;
    background: #ffffff;
    box-sizing: border-box;
  }

  :global(.dark-mode) .search-wrap input {
    background: #1e293b;
    border-color: #334155;
    color: #f8fafc;
  }

  .clear-btn {
    position: absolute;
    right: 12px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #94a3b8;
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
    background: rgba(241, 245, 249, 0.9);
    border: 1px solid rgba(226, 232, 240, 0.9);
    padding: 8px 14px;
    border-radius: 20px;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-h, #475569);
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s;
  }

  :global(.dark-mode) .cat-pill {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(51, 65, 85, 0.8);
    color: #cbd5e1;
  }

  .cat-pill.active {
    background: #6366f1;
    color: #ffffff;
    border-color: #6366f1;
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

  .item-icon {
    font-size: 26px;
    color: #6366f1;
    background: rgba(99, 102, 241, 0.1);
    padding: 10px;
    border-radius: 14px;
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
    font-size: 0.98rem;
    font-weight: 700;
    color: var(--text-h, #1f2937);
  }

  .badge {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 10px;
  }

  .badge-easy { background: rgba(16, 185, 129, 0.15); color: #059669; }
  .badge-medium { background: rgba(245, 158, 11, 0.15); color: #d97706; }
  .badge-gentle { background: rgba(59, 130, 246, 0.15); color: #2563eb; }

  .item-target {
    font-size: 0.78rem;
    color: var(--text, #6b7280);
  }

  .item-duration {
    font-size: 0.75rem;
    color: #6366f1;
    font-weight: 600;
  }

  .empty-state {
    text-align: center;
    padding: 40px 0;
    color: #94a3b8;
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

  .detail-icon {
    font-size: 32px;
    color: #6366f1;
    background: rgba(99, 102, 241, 0.12);
    padding: 10px;
    border-radius: 16px;
  }

  .detail-target {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: #10b981;
  }

  .detail-time {
    font-size: 0.8rem;
    color: var(--text, #6b7280);
  }

  .section-heading {
    margin: 12px 0 8px;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-h, #1f2937);
  }

  .modal-steps {
    margin: 0;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .modal-steps li {
    font-size: 0.85rem;
    line-height: 1.45;
    color: var(--text-h, #374151);
  }

  .modal-tip {
    background: rgba(245, 158, 11, 0.1);
    border-radius: 12px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 16px;
  }

  .modal-tip p {
    margin: 0;
    font-size: 0.8rem;
    color: #b45309;
    font-weight: 500;
  }

  .modal-footer-btns {
    display: flex;
    gap: 10px;
    width: 100%;
    justify-content: flex-end;
  }
</style>
