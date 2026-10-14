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

  $: isFiltered = searchQuery !== '' || selectedCategory !== 'all' || filterDifficulty !== 'all' || filterDuration !== 'all';

  $: filteredStretches = STRETCHES.filter((s) => {
    const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.searchKeywords && s.searchKeywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())));
      
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

  function resetFilters() {
    searchQuery = '';
    selectedCategory = 'all';
    filterDifficulty = 'all';
    filterDuration = 'all';
  }
</script>

<div class="library-screen animate-fade-in">
  <!-- Page Header -->
  <div class="header">
    <h1 class="title">Stretch Library</h1>
    <p class="subtitle">Targeted desk routines for posture reset, fatigue release, and joint mobility.</p>
  </div>

  <!-- ── QUICK START HERO BANNER ── -->
  <div class="quick-start-hero">
    <Card variant="hero" padding="md">
      <div class="qs-inner">
        <div class="qs-content">
          <div class="qs-badge">⚡ Quick Start</div>
          <h2 class="qs-title">2-Min Office Stretch Routine</h2>
          <p class="qs-desc">3 guided equipment-free poses (Neck, Shoulders, Back) to quickly reset your spine and posture.</p>
        </div>
        <div class="qs-btn-wrap">
          <Button variant="secondary" size="md" icon="play_arrow" onclick={() => navigateTo('break')}>
            Start Now
          </Button>
        </div>
      </div>
    </Card>
  </div>

  <!-- ── UNIFIED SEARCH & FILTERS TOOLBAR ── -->
  <div class="toolbar-section">
    <div class="toolbar-inputs">
      <!-- Search Input -->
      <div class="search-wrap">
        <span class="material-symbols-outlined search-icon">search</span>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search neck, back, wrists, eyes..."
          aria-label="Search stretches"
        />
        {#if searchQuery}
          <button type="button" class="clear-btn" on:click={() => (searchQuery = '')} aria-label="Clear search">
            <span class="material-symbols-outlined">close</span>
          </button>
        {/if}
      </div>

      <!-- Difficulty Filter -->
      <div class="filter-select-wrap">
        <span class="material-symbols-outlined filter-select-icon">fitness_center</span>
        <select bind:value={filterDifficulty} aria-label="Filter by difficulty">
          <option value="all">Any Difficulty</option>
          <option value="easy">Easy Level</option>
          <option value="medium">Medium Level</option>
          <option value="gentle">Gentle Level</option>
        </select>
      </div>

      <!-- Duration Filter -->
      <div class="filter-select-wrap">
        <span class="material-symbols-outlined filter-select-icon">timer</span>
        <select bind:value={filterDuration} aria-label="Filter by duration">
          <option value="all">Any Duration</option>
          <option value="short">Short (&lt; 35s)</option>
          <option value="long">Long (&ge; 35s)</option>
        </select>
      </div>

      {#if isFiltered}
        <button type="button" class="btn-reset-filters" on:click={resetFilters} title="Reset all filters">
          <span class="material-symbols-outlined">restart_alt</span>
          <span>Reset</span>
        </button>
      {/if}
    </div>

    <!-- Category Pills & Count -->
    <div class="categories-bar">
      <div class="categories-scroll">
        {#each STRETCH_CATEGORIES as cat}
          <button
            type="button"
            class="cat-pill {selectedCategory === cat.id ? 'active' : ''}"
            on:click={() => (selectedCategory = cat.id)}
          >
            <span class="material-symbols-outlined pill-icon">{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        {/each}
      </div>
      <div class="results-count">
        <span>{filteredStretches.length} of {STRETCHES.length} routines</span>
      </div>
    </div>
  </div>

  <!-- ── STRETCH CARDS GRID ── -->
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
            <!-- Visual Thumbnail Preview -->
            <div class="anim-preview">
              <img
                src="/images/stretches/{stretch.id}.png"
                alt="{stretch.title} posture guide"
                class="stretch-thumb-img"
                loading="lazy"
              />
              <div class="play-overlay">
                <span class="material-symbols-outlined play-icon">play_circle</span>
              </div>
            </div>

            <!-- Card Metadata -->
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
        <p class="empty-desc">No routines match your current search and filter settings.</p>
        <Button variant="outline" size="sm" onclick={resetFilters}>
          Reset All Filters
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
          <StretchAnimation
            id={activeModalStretch.id}
            videoUrl={activeModalStretch.videoUrl}
            poseName={activeModalStretch.title}
            duration={5}
          />
        </div>

        <div class="modal-tags">
          <span class="cat-tag">{activeModalStretch.category}</span>
          <span class="diff-tag diff-{activeModalStretch.difficulty.toLowerCase()}">{activeModalStretch.difficulty}</span>
          <span class="duration-badge">⏱️ {activeModalStretch.duration}s per side</span>
        </div>

        <p class="modal-target"><strong>Target Muscles:</strong> {activeModalStretch.targetMuscles || activeModalStretch.target}</p>

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
            Start Guided Break Routine
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

  /* Header */
  .header {
    margin-bottom: 2px;
  }

  .title {
    font-family: var(--font-heading);
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-heading);
    margin: 0;
    letter-spacing: -0.02em;
  }

  .subtitle {
    font-size: 0.88rem;
    color: var(--text-muted);
    margin: 4px 0 0;
    line-height: 1.4;
  }

  /* Quick Start Hero */
  .quick-start-hero {
    margin-bottom: 2px;
  }
  .qs-inner {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .qs-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .qs-badge {
    align-self: flex-start;
    background: rgba(255, 255, 255, 0.25);
    padding: 2px 10px;
    border-radius: 99px;
    font-size: 0.75rem;
    font-weight: 800;
    color: #ffffff;
  }
  .qs-title {
    font-family: var(--font-heading);
    font-size: 1.15rem;
    font-weight: 800;
    margin: 0;
    color: #ffffff;
  }
  .qs-desc {
    font-size: 0.84rem;
    margin: 0;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.4;
  }
  .qs-btn-wrap {
    align-self: flex-start;
  }

  /* Toolbar Section */
  .toolbar-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .toolbar-inputs {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .search-wrap {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
  }
  .search-icon {
    position: absolute;
    left: 14px;
    color: var(--text-muted);
    font-size: 20px;
    pointer-events: none;
  }
  .search-wrap input {
    width: 100%;
    padding: 11px 38px 11px 42px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-card);
    background: var(--surface-1);
    color: var(--text-heading);
    font-size: 0.88rem;
    box-sizing: border-box;
    transition: all var(--anim-card);
  }
  .search-wrap input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  }
  .clear-btn {
    position: absolute;
    right: 10px;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 4px;
    border-radius: 50%;
  }
  .clear-btn:hover {
    color: var(--text-heading);
    background: var(--surface-2);
  }

  .filter-select-wrap {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
  }
  .filter-select-icon {
    position: absolute;
    left: 12px;
    font-size: 18px;
    color: var(--text-muted);
    pointer-events: none;
  }
  .filter-select-wrap select {
    width: 100%;
    padding: 10px 12px 10px 36px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-card);
    background: var(--surface-1);
    color: var(--text-heading);
    font-size: 0.84rem;
    font-weight: 600;
    cursor: pointer;
    box-sizing: border-box;
    transition: all var(--anim-card);
  }
  .filter-select-wrap select:focus {
    border-color: var(--primary);
  }

  .btn-reset-filters {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: var(--radius-md);
    border: 1px dashed var(--border-card);
    background: var(--surface-2);
    color: var(--text-muted);
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all var(--anim-card);
  }
  .btn-reset-filters:hover {
    background: var(--surface-1);
    color: var(--color-rose);
    border-color: var(--color-rose);
  }

  .categories-bar {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .categories-scroll {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none;
  }
  .categories-scroll::-webkit-scrollbar {
    display: none;
  }

  .cat-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 99px;
    border: 1px solid var(--border-card);
    background: var(--surface-1);
    color: var(--text-muted);
    font-size: 0.82rem;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
    transition: all var(--anim-card);
  }
  .cat-pill:hover {
    color: var(--text-heading);
    border-color: rgba(99, 102, 241, 0.35);
  }
  .cat-pill.active {
    background: var(--primary);
    color: #ffffff;
    border-color: var(--primary);
    box-shadow: 0 4px 12px var(--primary-glow);
  }
  .pill-icon {
    font-size: 17px;
  }

  .results-count {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-muted);
    padding: 0 4px;
  }

  /* Grid & Cards */
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
    display: flex;
  }
  .stretch-card-btn :global(.card) {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: transform var(--anim-card), box-shadow var(--anim-card), border-color var(--anim-card);
  }
  .stretch-card-btn:hover :global(.card) {
    border-color: rgba(99, 102, 241, 0.4);
    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.08);
  }

  .stretch-item {
    display: flex;
    gap: 14px;
    align-items: center;
    width: 100%;
  }

  .anim-preview {
    position: relative;
    width: 78px;
    height: 78px;
    border-radius: var(--radius-md);
    background: var(--surface-2);
    border: 1px solid var(--border-card);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
  }

  .stretch-thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: calc(var(--radius-md) - 2px);
    transition: transform 0.25s ease;
  }

  .stretch-card-btn:hover .stretch-thumb-img {
    transform: scale(1.08);
  }

  .play-overlay {
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: calc(var(--radius-md) - 2px);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .stretch-card-btn:hover .play-overlay {
    opacity: 1;
  }

  .play-icon {
    font-size: 30px;
    color: #ffffff;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
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
    padding: 2px 8px;
    border-radius: 4px;
    text-transform: capitalize;
  }
  .diff-tag {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
  }
  .diff-easy { background: var(--color-success-light); color: var(--color-success); }
  .diff-medium { background: var(--color-reminder-light); color: var(--color-reminder); }
  .diff-gentle { background: var(--color-calm-light); color: var(--color-calm); }

  .stretch-title {
    font-family: var(--font-heading);
    font-size: 0.98rem;
    font-weight: 800;
    margin: 0;
    color: var(--text-heading);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .stretch-target {
    font-size: 0.78rem;
    color: var(--text-muted);
    margin: 2px 0 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .bottom-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 600;
  }
  .xp-gain {
    color: var(--color-success);
    font-weight: 800;
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 48px 16px;
    background: var(--surface-1);
    border-radius: var(--radius-lg);
    border: 1px dashed var(--border-card);
  }
  .empty-icon {
    font-size: 48px;
    color: var(--text-muted);
    opacity: 0.5;
  }
  .empty-title {
    font-size: 1.1rem;
    margin: 8px 0 4px;
    color: var(--text-heading);
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
    width: 100%;
    min-height: 240px;
    background: var(--surface-2);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .modal-tags {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .duration-badge {
    font-size: 0.75rem;
    font-weight: 700;
    background: var(--surface-2);
    color: var(--text-heading);
    padding: 3px 8px;
    border-radius: 4px;
  }
  .modal-target {
    font-size: 0.85rem;
    color: var(--text-heading);
    margin: 0;
  }
  .steps-section h4, .benefits-box h4 {
    font-size: 0.9rem;
    margin: 0 0 6px;
    color: var(--text-heading);
  }
  .steps-list {
    margin: 0;
    padding-left: 20px;
    font-size: 0.85rem;
    line-height: 1.5;
    color: var(--text-main);
  }
  .benefits-box {
    background: var(--surface-2);
    padding: 12px 14px;
    border-radius: var(--radius-md);
    font-size: 0.82rem;
    line-height: 1.4;
    color: var(--text-main);
  }

  /* ── TABLET & DESKTOP RESPONSIVE LAYOUT ── */
  @media (min-width: 768px) {
    .library-screen {
      max-width: 1400px;
      padding: 24px 32px 100px;
      gap: 20px;
    }

    .header {
      margin-bottom: 0;
    }

    .qs-inner {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
    }
    .qs-content {
      flex: 1;
    }
    .qs-btn-wrap {
      width: auto;
      flex-shrink: 0;
    }

    .toolbar-inputs {
      flex-direction: row;
      align-items: center;
      gap: 12px;
    }
    .search-wrap {
      flex: 2;
    }
    .filter-select-wrap {
      flex: 1;
    }
    .btn-reset-filters {
      flex-shrink: 0;
      height: 42px;
    }

    .categories-bar {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }

    .stretches-grid {
      display: grid !important;
      grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)) !important;
      gap: 16px !important;
    }
  }
</style>
