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

  // New Filters
  let filterDifficulty = 'all';
  let filterDuration = 'all';

  $: filteredStretches = STRETCHES.filter((s) => {
    const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.searchKeywords && s.searchKeywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())));
      
    const matchesDifficulty = filterDifficulty === 'all' || s.difficulty.toLowerCase() === filterDifficulty;
    
    let matchesDuration = true;
    if (filterDuration === 'short') {
      matchesDuration = s.duration < 35;
    } else if (filterDuration === 'long') {
      matchesDuration = s.duration >= 35;
    }
    
    return matchesCat && matchesSearch && matchesDifficulty && matchesDuration;
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
    <h1 class="title">Stretch Library</h1>
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

  <!-- Dropdown Filter Selects -->
  <div class="filters-row">
    <div class="filter-select-wrap">
      <span class="material-symbols-outlined filter-select-icon">fitness_center</span>
      <select bind:value={filterDifficulty}>
        <option value="all">Any Difficulty</option>
        <option value="easy">Easy Level</option>
        <option value="medium">Medium Level</option>
        <option value="gentle">Gentle Level</option>
      </select>
    </div>

    <div class="filter-select-wrap">
      <span class="material-symbols-outlined filter-select-icon">timer</span>
      <select bind:value={filterDuration}>
        <option value="all">Any Duration</option>
        <option value="short">Short (&lt; 35s)</option>
        <option value="long">Long (&ge; 35s)</option>
      </select>
    </div>
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
      <div class="empty-state animate-fade-in">
        <span class="material-symbols-outlined empty-icon">search_off</span>
        <p>No routines match your search filter.</p>
      </div>
    {:else}
      {#each filteredStretches as s}
        <button class="card-item" on:click={() => openStretchModal(s)}>
          <Card hover padding="md">
            <div class="item-inner">
              <div class="item-poster-wrap">
                <img src="/images/stretches/{s.id}.png" alt={s.title} class="item-poster-thumb" />
              </div>
              <div class="item-info">
                <div class="item-top">
                  <h4 class="item-title">{s.title}</h4>
                  <span class="badge badge-{s.difficulty.toLowerCase()}">{s.difficulty}</span>
                </div>
                <span class="item-target">🎯 {s.target}</span>
                <span class="item-duration">⏱️ {s.duration} seconds • {s.estimatedCalories} kcal</span>
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

        <!-- Routine Specifications Grid -->
        <div class="meta-details-grid">
          <div class="meta-detail-pill">
            <span class="material-symbols-outlined m-ico">directions_walk</span>
            <span>{activeModalStretch.sittingStanding || 'Sitting'}</span>
          </div>
          <div class="meta-detail-pill">
            <span class="material-symbols-outlined m-ico">check_circle</span>
            <span>{activeModalStretch.officeFriendly ? 'Office Friendly' : 'Floor Workout'}</span>
          </div>
          <div class="meta-detail-pill">
            <span class="material-symbols-outlined m-ico">local_fire_department</span>
            <span>{activeModalStretch.estimatedCalories || 1.5} kcal</span>
          </div>
        </div>

        <h4 class="section-heading">Alignment & Benefits</h4>
        <div class="alignment-box">
          <p class="alignment-text"><strong>Target Muscles:</strong> {activeModalStretch.targetMuscles || activeModalStretch.target}</p>
          <p class="alignment-text"><strong>Benefits:</strong> {activeModalStretch.benefits}</p>
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

        <h4 class="section-heading">Safety & Precision</h4>
        <div class="safety-box">
          <p class="mistake-text">⚠️ <strong>Mistakes:</strong> {activeModalStretch.commonMistakes}</p>
          <p class="safe-text">🛡️ <strong>Safety:</strong> {activeModalStretch.safetyPrecautions}</p>
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

  .item-poster-wrap {
    width: 68px;
    height: 68px;
    border-radius: 14px;
    overflow: hidden;
    flex-shrink: 0;
    border: 1px solid var(--border-card);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
    background: #0f172a;
  }

  .item-poster-thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 20%;
    transition: transform 0.3s ease;
  }

  .card-item:hover .item-poster-thumb {
    transform: scale(1.1);
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

  /* Filters Row */
  .filters-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: -4px;
    margin-bottom: 4px;
  }
  .filter-select-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }
  .filter-select-icon {
    position: absolute;
    left: 10px;
    font-size: 16px;
    color: var(--text-muted);
    pointer-events: none;
  }
  .filter-select-wrap select {
    width: 100%;
    padding: 8px 8px 8px 30px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-card);
    background: var(--bg-card);
    color: var(--text-heading);
    font-size: 0.8rem;
    font-weight: 700;
    font-family: inherit;
    outline: none;
    cursor: pointer;
    box-sizing: border-box;
    appearance: none;
    -webkit-appearance: none;
  }
  .filter-select-wrap select:focus {
    border-color: var(--primary);
  }

  /* Routine specifications grid */
  .meta-details-grid {
    display: grid;
    grid-template-columns: 1fr 1.2fr 1fr;
    gap: 8px;
    margin: 12px 0;
  }
  .meta-detail-pill {
    background: var(--bg-app);
    border: 1px solid var(--border-card);
    border-radius: var(--radius-sm);
    padding: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 0.76rem;
    font-weight: 700;
    color: var(--text-muted);
  }
  .m-ico {
    font-size: 16px;
    color: var(--primary);
  }

  /* Alignment and safety boxes */
  .alignment-box {
    background: rgba(16, 185, 129, 0.06);
    border: 1px solid rgba(16, 185, 129, 0.15);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .alignment-text {
    margin: 0;
    font-size: 0.84rem;
    color: var(--text-main);
    line-height: 1.45;
  }
  .safety-box {
    background: rgba(239, 68, 68, 0.05);
    border: 1px solid rgba(239, 68, 68, 0.12);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .mistake-text {
    margin: 0;
    font-size: 0.82rem;
    color: #b91c1c;
    line-height: 1.4;
  }
  :global(.dark-mode) .mistake-text {
    color: #f87171;
  }
  .safe-text {
    margin: 0;
    font-size: 0.82rem;
    color: var(--text-main);
    line-height: 1.4;
  }
</style>

