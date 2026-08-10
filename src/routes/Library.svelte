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

  // Filters
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

  <!-- ── QUICK START HERO BANNER ── -->
  <div class="quick-start-hero">
    <Card variant="hero" padding="md">
      <div class="qs-inner">
        <div class="qs-badge">⚡ Quick Start</div>
        <h2 class="qs-title">2-Min Office Stretch Routine</h2>
        <p class="qs-desc">3 guided equipment-free poses (Neck, Shoulders, Back) to reset posture.</p>
        <div class="qs-btn-wrap">
          <Button variant="secondary" size="md" icon="play_arrow" onclick={() => navigateTo('break')}>
            Start Now
          </Button>
        </div>
      </div>
    </Card>
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
      <button type="button" class="clear-btn" on:click={() => searchQuery = ''} aria-label="Clear search">
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
        type="button"
        class="cat-pill {selectedCategory === cat.id ? 'active' : ''}"
        on:click={() => selectedCategory = cat.id}
      >
        <span class="material-symbols-outlined pill-icon">{cat.icon}</span>
        <span>{cat.label}</span>
      </button>
    {/each}
  </div>

  <!-- Stretch Cards Grid -->
  <div class="stretches-grid">
    {#each filteredStretches as stretch (stretch.id)}
      <button
        type="button"
        class="stretch-card-btn"
        on:click={() => openStretchModal(stretch)}
        aria-label="View {stretch.title} details"
      >
        <Card hover={true} padding="sm">
          <div class="stretch-item">
            <div class="anim-preview">
              <StretchAnimation poseName={stretch.title} duration={3} />
            </div>

            <div class="stretch-info">
              <div class="tag-row">
                <span class="cat-tag">{stretch.category}</span>
                <span class="diff-tag diff-{stretch.difficulty.toLowerCase()}">{stretch.difficulty}</span>
              </div>
              <h3 class="stretch-title">{stretch.title}</h3>
              <p class="stretch-target">🎯 {stretch.target}</p>
              
              <div class="bottom-row">
                <span class="duration">⏱️ {stretch.duration}s per side</span>
                <span class="xp-gain">+50 XP</span>
              </div>
            </div>
          </div>
        </Card>
      </button>
    {:else}
      <div class="empty-state">
        <span class="material-symbols-outlined empty-icon">search_off</span>
        <h3 class="empty-title">No Stretches Found</h3>
        <p class="empty-desc">Try clearing your search query or filters.</p>
        <Button variant="outline" size="sm" onclick={() => { searchQuery = ''; selectedCategory = 'all'; filterDifficulty = 'all'; filterDuration = 'all'; }}>
          Reset Filters
        </Button>
      </div>
    {/each}
  </div>

  <!-- Detail Modal -->
  {#if activeModalStretch}
    <Modal
      isOpen={!!activeModalStretch}
      title={activeModalStretch.title}
      icon="fitness_center"
      onclose={closeModal}
    >
      <div class="modal-stretch-content">
        <div class="modal-anim-container">
          <StretchAnimation poseName={activeModalStretch.title} duration={5} />
        </div>

        <div class="modal-tags">
          <span class="cat-tag">{activeModalStretch.category}</span>
          <span class="diff-tag diff-{activeModalStretch.difficulty.toLowerCase()}">{activeModalStretch.difficulty}</span>
          <span class="duration-badge">⏱️ {activeModalStretch.duration}s</span>
        </div>

        <p class="modal-target"><strong>Target Muscle:</strong> {activeModalStretch.target}</p>

        <div class="steps-section">
          <h4>Execution Steps</h4>
          <ol class="steps-list">
            {#each activeModalStretch.instructions as step}
              <li>{step}</li>
            {/each}
          </ol>
        </div>

        {#if activeModalStretch.benefits}
          <div class="benefits-box">
            <h4>💡 Why This Helps</h4>
            <p>{activeModalStretch.benefits}</p>
          </div>
        {/if}

        <div class="modal-actions">
          <Button variant="primary" fullWidth icon="play_arrow" onclick={() => { closeModal(); navigateTo('break'); }}>
            Start Break Routine Now
          </Button>
        </div>
      </div>
    </Modal>
  {/if}
</div>

<style>
  .library-screen {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px 16px 100px;
    max-width: 480px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
    min-width: 0;
  }

  /* Tablet & Desktop Layouts */
  @media (min-width: 768px) {
    .library-screen {
      max-width: 1440px;
      padding: 24px 32px 100px;
      gap: 20px;
    }

    .stretches-grid {
      display: grid !important;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) !important;
      gap: 16px !important;
    }

    .qs-inner {
      flex-direction: row !important;
      justify-content: space-between !important;
      align-items: center !important;
    }

    .qs-btn-wrap {
      width: auto !important;
    }
  }

  .header {
    margin-bottom: 4px;
  }

  .title {
    font-size: 1.5rem;
    font-weight: 800;
    margin: 0;
  }

  .subtitle {
    font-size: 0.88rem;
    color: var(--text-muted);
    margin: 4px 0 0;
  }

  /* Quick Start Hero */
  .quick-start-hero {
    margin-bottom: 4px;
  }
  .qs-inner {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .qs-badge {
    align-self: flex-start;
    background: rgba(255, 255, 255, 0.25);
    padding: 2px 10px;
    border-radius: 99px;
    font-size: 0.75rem;
    font-weight: 800;
  }
  .qs-title {
    font-size: 1.15rem;
    font-weight: 900;
    margin: 0;
    color: #ffffff;
  }
  .qs-desc {
    font-size: 0.82rem;
    margin: 0 0 6px;
    opacity: 0.9;
  }
  .qs-btn-wrap {
    align-self: flex-start;
  }

  /* Search & Filters */
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
    padding: 12px 38px 12px 42px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-card);
    background: var(--surface-1);
    color: var(--text-heading);
    font-size: 0.9rem;
  }
  .clear-btn {
    position: absolute;
    right: 10px;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
  }

  .filters-row {
    display: flex;
    gap: 10px;
  }
  .filter-select-wrap {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
  }
  .filter-select-icon {
    position: absolute;
    left: 10px;
    font-size: 18px;
    color: var(--text-muted);
    pointer-events: none;
  }
  .filter-select-wrap select {
    width: 100%;
    padding: 8px 10px 8px 34px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-card);
    background: var(--surface-1);
    color: var(--text-heading);
    font-size: 0.8rem;
    font-weight: 600;
  }

  .categories-scroll {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
  }
  .cat-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 99px;
    border: 1px solid var(--border-card);
    background: var(--surface-1);
    color: var(--text-muted);
    font-size: 0.8rem;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
  }
  .cat-pill.active {
    background: var(--primary);
    color: #ffffff;
    border-color: var(--primary);
  }

  /* Grid */
  .stretches-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .stretch-card-btn {
    background: none;
    border: none;
    padding: 0;
    text-align: left;
    cursor: pointer;
    width: 100%;
  }

  .stretch-item {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .anim-preview {
    width: 72px;
    height: 72px;
    background: var(--surface-2);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
  }
  .stretch-info {
    flex: 1;
    min-width: 0;
  }
  .tag-row {
    display: flex;
    gap: 6px;
    margin-bottom: 4px;
  }
  .cat-tag {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--primary);
    background: var(--primary-light);
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: capitalize;
  }
  .diff-tag {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
  }
  .diff-easy { background: var(--color-success-light); color: var(--color-success); }
  .diff-medium { background: var(--color-reminder-light); color: var(--color-reminder); }
  .diff-gentle { background: var(--color-calm-light); color: var(--color-calm); }

  .stretch-title {
    font-size: 0.95rem;
    font-weight: 800;
    margin: 0;
    color: var(--text-heading);
  }
  .stretch-target {
    font-size: 0.78rem;
    color: var(--text-muted);
    margin: 2px 0 6px;
  }
  .bottom-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 600;
  }

  .empty-state {
    text-align: center;
    padding: 40px 16px;
  }
  .empty-icon {
    font-size: 48px;
    color: var(--text-muted);
    opacity: 0.5;
  }
  .empty-title {
    font-size: 1.1rem;
    margin: 8px 0 4px;
  }
  .empty-desc {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin: 0 0 16px;
  }

  /* Modal */
  .modal-stretch-content {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .modal-anim-container {
    height: 140px;
    background: var(--surface-2);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .modal-tags {
    display: flex;
    gap: 8px;
  }
  .duration-badge {
    font-size: 0.75rem;
    font-weight: 700;
    background: var(--surface-2);
    padding: 2px 8px;
    border-radius: 4px;
  }
  .modal-target {
    font-size: 0.85rem;
    margin: 0;
  }
  .steps-section h4, .benefits-box h4 {
    font-size: 0.9rem;
    margin: 0 0 6px;
  }
  .steps-list {
    margin: 0;
    padding-left: 20px;
    font-size: 0.85rem;
    line-height: 1.4;
  }
  .benefits-box {
    background: var(--surface-2);
    padding: 10px 14px;
    border-radius: var(--radius-md);
    font-size: 0.82rem;
  }
</style>
