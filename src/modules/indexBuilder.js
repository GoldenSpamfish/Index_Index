// Custom Index Builder Studio Module with Live Synchronized Map, Methodology Drawers, Conversion Transforms, and Custom Index Persistence
import { INDICATORS, DOMAINS, BENCHMARK_BUNDLES, INDICATOR_LIST } from '../data/indicators.js';
import { getCountry } from '../data/countries.js';
import { renderChoroplethMap } from './mapEngine.js';

const STORAGE_KEY = 'gio_saved_custom_indices_v1';

export class IndexBuilderStudio {
  constructor(options = {}) {
    this.containerId = options.containerId || 'index-builder-container';
    this.onUpdate = options.onUpdate || (() => {});
    this.onOpenWorldBankDrawer = options.onOpenWorldBankDrawer || (() => {});

    // Active state
    this.customIndexName = 'Human Flourishing & Development';
    this.customIndexDesc = 'Balanced model prioritizing human well-being, longevity, and democratic peace.';
    this.activeIndicators = []; // Array of { id, weight, locked, transform, clipMin, clipMax, polarity, showSettings, showInfo }
    this.aggregationFormula = 'arithmetic'; // 'arithmetic' | 'geometric' | 'harmonic'
    this.normalizationMethod = 'minmax'; // 'minmax' | 'zscore' | 'rank'
    this.activeBundleId = 'human_flourishing';
    this.activeSavedId = null; // ID of loaded saved index, if any
    this.searchQuery = '';
    this.selectedDomainFilter = 'all';
    this.selectedTypeFilter = 'all'; // 'all' | 'composite' | 'primary'

    // Saved indices library in localStorage
    this.savedIndices = this.loadSavedIndices();

    // Live preview cache
    this.liveScores = {};
    this.liveRanks = {};

    // Initialize with default preset
    this.loadBundle(this.activeBundleId);
  }

  loadSavedIndices() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Could not read saved indices from localStorage', e);
      return [];
    }
  }

  saveSavedIndices() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.savedIndices));
    } catch (e) {
      console.error('Could not save indices to localStorage', e);
    }
  }

  saveCurrentIndex(customTitle, customDesc) {
    const title = (customTitle || this.customIndexName || 'My Custom Index').trim();
    const desc = (customDesc || this.customIndexDesc || '').trim();

    const newSaved = {
      id: `custom_${Date.now()}`,
      name: title,
      desc: desc,
      createdAt: new Date().toLocaleDateString(),
      indicators: JSON.parse(JSON.stringify(this.activeIndicators)),
      formula: this.aggregationFormula,
      normalization: this.normalizationMethod
    };

    // If already saved with same ID, update it; otherwise prepend
    if (this.activeSavedId) {
      const idx = this.savedIndices.findIndex(s => s.id === this.activeSavedId);
      if (idx !== -1) {
        newSaved.id = this.activeSavedId;
        this.savedIndices[idx] = newSaved;
      } else {
        this.savedIndices.unshift(newSaved);
      }
    } else {
      this.savedIndices.unshift(newSaved);
    }

    this.activeSavedId = newSaved.id;
    this.customIndexName = title;
    this.customIndexDesc = desc;
    this.activeBundleId = null;
    this.saveSavedIndices();
    this.render();
    this.notifyUpdate();

    // Return saved object
    return newSaved;
  }

  deleteSavedIndex(id) {
    this.savedIndices = this.savedIndices.filter(s => s.id !== id);
    if (this.activeSavedId === id) this.activeSavedId = null;
    this.saveSavedIndices();
    this.render();
  }

  loadSavedIndex(id) {
    const saved = this.savedIndices.find(s => s.id === id);
    if (!saved) return;

    this.activeSavedId = saved.id;
    this.activeBundleId = null;
    this.customIndexName = saved.name;
    this.customIndexDesc = saved.desc || '';
    this.aggregationFormula = saved.formula || 'arithmetic';
    this.normalizationMethod = saved.normalization || 'minmax';
    this.activeIndicators = JSON.parse(JSON.stringify(saved.indicators));

    this.render();
    this.notifyUpdate();
  }

  setLiveScores(scores, ranks) {
    this.liveScores = scores || {};
    this.liveRanks = ranks || {};
    this.renderLiveMapAndLeaderboard();
  }

  loadBundle(bundleId) {
    const bundle = BENCHMARK_BUNDLES.find(b => b.id === bundleId);
    if (!bundle) return;

    this.activeBundleId = bundleId;
    this.activeSavedId = null;
    this.customIndexName = bundle.name;
    this.customIndexDesc = bundle.description || '';
    this.aggregationFormula = bundle.formula || 'arithmetic';
    this.normalizationMethod = bundle.norm || 'minmax';

    this.activeIndicators = Object.entries(bundle.weights).map(([id, weight]) => {
      const ind = INDICATORS[id] || {};
      return {
        id,
        weight,
        locked: false,
        transform: ind.defaultTransform || 'linear',
        clipMin: null,
        clipMax: null,
        polarity: ind.polarity !== undefined ? ind.polarity : 1,
        showSettings: false,
        showInfo: false
      };
    });

    this.render();
    this.notifyUpdate();
  }

  addIndicator(indicatorId) {
    if (this.activeIndicators.some(i => i.id === indicatorId)) return;
    const ind = INDICATORS[indicatorId];
    if (!ind) return;

    this.activeIndicators.push({
      id: indicatorId,
      weight: 20,
      locked: false,
      transform: ind.defaultTransform || 'linear',
      clipMin: null,
      clipMax: null,
      polarity: ind.polarity !== undefined ? ind.polarity : 1,
      showSettings: false,
      showInfo: false
    });
    this.activeBundleId = null; // Custom configuration
    this.render();
    this.notifyUpdate();
  }

  removeIndicator(indicatorId) {
    if (this.activeIndicators.length <= 1) {
      alert('An index requires at least 1 indicator.');
      return;
    }
    this.activeIndicators = this.activeIndicators.filter(i => i.id !== indicatorId);
    this.activeBundleId = null;
    this.render();
    this.notifyUpdate();
  }

  setWeight(indicatorId, newWeight) {
    const item = this.activeIndicators.find(i => i.id === indicatorId);
    if (!item) return;
    item.weight = Math.max(1, Math.min(100, Math.round(newWeight)));
    this.activeBundleId = null;

    const cardEl = document.querySelector(`.ind-weight-card[data-id="${indicatorId}"]`);
    if (cardEl) {
      const totalWeight = this.activeIndicators.reduce((s, i) => s + i.weight, 0);
      const pctShare = totalWeight > 0 ? ((item.weight / totalWeight) * 100).toFixed(1) : 0;
      const weightDisplay = cardEl.querySelector('.weight-val-text');
      if (weightDisplay) {
        weightDisplay.innerHTML = `${item.weight} <span class="text-[10px] text-muted font-normal">(${pctShare}%)</span>`;
      }
    }

    this.notifyUpdate();
  }

  toggleLock(indicatorId) {
    const item = this.activeIndicators.find(i => i.id === indicatorId);
    if (!item) return;
    item.locked = !item.locked;
    this.render();
  }

  toggleSettings(indicatorId) {
    const item = this.activeIndicators.find(i => i.id === indicatorId);
    if (!item) return;
    item.showSettings = !item.showSettings;
    if (item.showSettings) item.showInfo = false;
    this.render();
  }

  toggleInfo(indicatorId) {
    const item = this.activeIndicators.find(i => i.id === indicatorId);
    if (!item) return;
    item.showInfo = !item.showInfo;
    if (item.showInfo) item.showSettings = false;
    this.render();
  }

  updateIndicatorConfig(indicatorId, updates) {
    const item = this.activeIndicators.find(i => i.id === indicatorId);
    if (!item) return;
    Object.assign(item, updates);
    this.render();
    this.notifyUpdate();
  }

  equalizeWeights() {
    const equalVal = Math.round(100 / this.activeIndicators.length);
    this.activeIndicators.forEach(i => {
      i.weight = equalVal;
    });
    this.render();
    this.notifyUpdate();
  }

  normalizeWeightsTo100() {
    const total = this.activeIndicators.reduce((s, i) => s + i.weight, 0) || 1;
    this.activeIndicators.forEach(i => {
      i.weight = Math.max(1, Math.round((i.weight / total) * 100));
    });
    this.render();
    this.notifyUpdate();
  }

  setAggregation(formula) {
    this.aggregationFormula = formula;
    this.render();
    this.notifyUpdate();
  }

  setNormalization(norm) {
    this.normalizationMethod = norm;
    this.render();
    this.notifyUpdate();
  }

  notifyUpdate() {
    this.onUpdate({
      name: this.customIndexName,
      desc: this.customIndexDesc,
      indicators: this.activeIndicators,
      formula: this.aggregationFormula,
      normalization: this.normalizationMethod,
      bundleId: this.activeBundleId,
      savedId: this.activeSavedId
    });
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const totalWeight = this.activeIndicators.reduce((s, i) => s + i.weight, 0);

    // Preset chips
    const bundleButtons = BENCHMARK_BUNDLES.map(b => {
      const isSelected = this.activeBundleId === b.id;
      return `<button type="button" class="preset-btn px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
        isSelected
          ? 'bg-ink text-white border-ink font-semibold shadow-sm'
          : 'bg-card text-ink2 border-line hover:bg-paper hover:text-ink'
      }" data-bundle="${b.id}">
        ${b.name}
      </button>`;
    }).join('');

    // Saved custom indices chips
    const savedButtons = this.savedIndices.map(s => {
      const isSelected = this.activeSavedId === s.id;
      return `
        <div class="inline-flex items-center rounded-lg border text-xs font-mono transition-all ${
          isSelected ? 'bg-gold/20 border-gold text-ink font-bold shadow-xs' : 'bg-card border-line text-ink2 hover:bg-paper'
        }">
          <button type="button" class="load-saved-btn px-2.5 py-1.5 flex items-center gap-1.5" data-saved-id="${s.id}">
            <span class="w-1.5 h-1.5 rounded-full bg-gold shrink-0"></span>
            <span class="truncate max-w-[130px]">${s.name}</span>
          </button>
          <button type="button" class="del-saved-btn p-1.5 text-muted hover:text-clay hover:bg-clay/10 rounded-r-lg border-l border-line/60" data-saved-id="${s.id}" title="Delete saved index">
            ✕
          </button>
        </div>
      `;
    }).join('');

    // Active sub-indicators
    const indicatorRows = this.activeIndicators.map(item => {
      const ind = INDICATORS[item.id] || { name: item.id, domain: 'wellbeing', unit: '', short: item.id, type: 'primary', desc: '', methodology: '', wikiUrl: '' };
      const domainInfo = DOMAINS[ind.domain] || { color: '#2E6B57', label: 'Domain' };
      const pctShare = totalWeight > 0 ? ((item.weight / totalWeight) * 100).toFixed(1) : 0;
      const isComposite = ind.type === 'composite';

      const typeBadge = isComposite
        ? `<span class="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-slate text-white tracking-wide shrink-0">COMPOSITE BENCHMARK</span>`
        : `<span class="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-moss text-white tracking-wide shrink-0">PRIMARY METRIC</span>`;

      // Methodology Drawer
      let infoDrawer = '';
      if (item.showInfo) {
        infoDrawer = `
          <div class="mt-2.5 p-3.5 bg-paper/80 border border-line rounded-lg text-xs space-y-2 text-ink2 animate-fadeIn">
            <div>
              <span class="font-mono text-[10px] text-muted uppercase font-semibold block">Overview & Concept</span>
              <p class="font-sans text-xs text-ink leading-relaxed">${ind.desc || 'No description provided.'}</p>
            </div>

            <div>
              <span class="font-mono text-[10px] text-muted uppercase font-semibold block">Measurement & Calculation Methodology</span>
              <p class="font-sans text-xs text-ink2 leading-relaxed">${ind.methodology || 'Calculated using standard international reporting frameworks.'}</p>
            </div>

            <div class="pt-2 border-t border-line/60 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <span class="text-muted">Source: <b class="text-ink">${ind.source || 'Official Database'}</b> (${ind.year || 2024})</span>
              ${ind.wikiUrl ? `
                <a href="${ind.wikiUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-moss hover:underline font-semibold">
                  Read on Wikipedia
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </a>
              ` : ''}
            </div>
          </div>
        `;
      }

      // Advanced Conversion Settings Drawer
      let settingsDrawer = '';
      if (item.showSettings) {
        settingsDrawer = `
          <div class="mt-2.5 p-3.5 bg-paper/80 border border-line rounded-lg text-xs space-y-3 font-mono animate-fadeIn">
            <div class="flex items-center justify-between border-b border-line/60 pb-1.5">
              <span class="font-mono text-[10px] text-muted uppercase font-semibold">Advanced Mathematical Conversion</span>
              <span class="text-[10px] text-moss">Fine-Grained Controls</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <!-- Transform -->
              <div>
                <label class="block text-muted text-[10px] uppercase font-semibold mb-1">Mathematical Transform</label>
                <select class="transform-sel w-full p-1.5 bg-card border border-line rounded text-xs font-mono text-ink" data-id="${item.id}">
                  <option value="linear" ${item.transform === 'linear' ? 'selected' : ''}>Linear (Standard)</option>
                  <option value="log" ${item.transform === 'log' ? 'selected' : ''}>Logarithmic ln(x+1)</option>
                  <option value="sqrt" ${item.transform === 'sqrt' ? 'selected' : ''}>Square Root √x</option>
                </select>
              </div>

              <!-- Polarity -->
              <div>
                <label class="block text-muted text-[10px] uppercase font-semibold mb-1">Polarity Direction</label>
                <select class="polarity-sel w-full p-1.5 bg-card border border-line rounded text-xs font-mono text-ink" data-id="${item.id}">
                  <option value="1" ${item.polarity === 1 ? 'selected' : ''}>Higher is Better (+)</option>
                  <option value="-1" ${item.polarity === -1 ? 'selected' : ''}>Lower is Better (Inverted)</option>
                </select>
              </div>

              <!-- Outlier Cap / Floor -->
              <div class="flex gap-1.5">
                <div class="flex-1">
                  <label class="block text-muted text-[10px] uppercase font-semibold mb-1">Floor Cap</label>
                  <input type="number" placeholder="Min" value="${item.clipMin !== null ? item.clipMin : ''}" class="clip-min-input w-full p-1 bg-card border border-line rounded text-xs font-mono" data-id="${item.id}"/>
                </div>
                <div class="flex-1">
                  <label class="block text-muted text-[10px] uppercase font-semibold mb-1">Ceil Cap</label>
                  <input type="number" placeholder="Max" value="${item.clipMax !== null ? item.clipMax : ''}" class="clip-max-input w-full p-1 bg-card border border-line rounded text-xs font-mono" data-id="${item.id}"/>
                </div>
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div class="ind-weight-card flex flex-col p-3 bg-card border border-line rounded-xl gap-2 shadow-xs transition-all" data-id="${item.id}">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:${domainInfo.color}"></span>
              <h4 class="font-sans font-semibold text-xs text-ink truncate">${ind.name}</h4>
              ${typeBadge}
              <span class="font-mono text-[9px] text-muted uppercase tracking-wider px-1 py-0.2 bg-paper rounded border border-line shrink-0">${ind.short || item.id}</span>
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <!-- Info / Learn More Toggle -->
              <button type="button" class="info-btn p-1 px-1.5 rounded hover:bg-paper text-muted hover:text-ink text-[11px] font-mono transition ${item.showInfo ? 'bg-paper text-moss font-bold' : ''}" data-id="${item.id}" title="View methodology and source">
                Learn More
              </button>

              <!-- Advanced Settings Toggle -->
              <button type="button" class="settings-btn p-1 px-1.5 rounded hover:bg-paper text-muted hover:text-ink text-[11px] font-mono transition ${item.showSettings ? 'bg-paper text-slate font-bold' : ''}" data-id="${item.id}" title="Advanced conversion transforms">
                Transform
              </button>

              <!-- Lock Weight -->
              <button type="button" class="lock-btn p-1 rounded hover:bg-paper text-muted transition ${item.locked ? 'text-gold' : ''}" data-id="${item.id}" title="${item.locked ? 'Unlock weight' : 'Lock weight'}">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  ${item.locked ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>' : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>'}
                </svg>
              </button>

              <!-- Remove -->
              <button type="button" class="remove-btn p-1 rounded hover:bg-clay/10 text-muted hover:text-clay transition" data-id="${item.id}" title="Remove indicator">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <input type="range" min="1" max="100" value="${item.weight}" class="weight-slider flex-1 accent-moss cursor-pointer h-1.5 bg-paper rounded-lg" data-id="${item.id}"/>
            <span class="weight-val-text font-mono text-xs font-semibold text-ink w-16 text-right shrink-0">${item.weight} <span class="text-[10px] text-muted font-normal">(${pctShare}%)</span></span>
          </div>

          ${infoDrawer}
          ${settingsDrawer}
        </div>
      `;
    }).join('');

    // Catalog filtering
    const unselected = INDICATOR_LIST.filter(ind => !this.activeIndicators.some(i => i.id === ind.id));
    const allCount = unselected.length;
    const compCount = unselected.filter(i => i.type === 'composite').length;
    const primCount = unselected.filter(i => i.type === 'primary').length;

    const filteredCatalog = unselected.filter(ind => {
      const matchesSearch = ind.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || ind.short.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesDomain = this.selectedDomainFilter === 'all' || ind.domain === this.selectedDomainFilter;
      const matchesType = this.selectedTypeFilter === 'all' || ind.type === this.selectedTypeFilter;
      return matchesSearch && matchesDomain && matchesType;
    });

    const catalogItems = filteredCatalog.map(ind => {
      const domainInfo = DOMAINS[ind.domain] || { color: '#2E6B57', label: 'Domain' };
      const isComposite = ind.type === 'composite';

      return `
        <div class="p-2.5 bg-paper border border-line rounded-lg flex items-center justify-between hover:border-moss transition gap-2">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full shrink-0" style="background:${domainInfo.color}"></span>
              <span class="font-sans font-semibold text-[11px] text-ink truncate">${ind.name}</span>
            </div>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${isComposite ? 'bg-slate/15 text-slate border border-slate/30' : 'bg-moss/15 text-moss border border-moss/30'}">${isComposite ? 'COMPOSITE BENCHMARK' : 'PRIMARY METRIC'}</span>
              <span class="text-[9.5px] text-muted font-mono truncate">· ${domainInfo.label.split(' ')[0]}</span>
            </div>
          </div>
          <button type="button" class="add-ind-btn px-2 py-1 rounded bg-card border border-line hover:bg-moss hover:text-white hover:border-moss font-mono text-[10.5px] shrink-0 transition font-semibold" data-id="${ind.id}">
            + Add
          </button>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Custom Index Title & Naming Header Card -->
        <div class="p-4 sm:p-5 bg-card border border-line rounded-xl shadow-xs space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="eyebrow">Active Custom Model</span>
                ${this.activeSavedId ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-gold/20 text-gold border border-gold/40">SAVED IN MY LIBRARY</span>' : ''}
              </div>
              <input type="text" id="custom-index-name-input" value="${this.customIndexName}" placeholder="Name your index..." class="w-full text-lg sm:text-2xl font-serif font-bold text-ink bg-transparent border-0 border-b border-transparent hover:border-line focus:border-moss p-0 pb-1 focus:ring-0 focus:outline-none transition"/>
            </div>

            <!-- Save & Action Buttons -->
            <div class="flex items-center gap-2 shrink-0">
              <button type="button" id="btn-save-index" class="py-2 px-3.5 bg-ink text-white hover:bg-moss rounded-lg font-mono text-xs font-semibold shadow-xs flex items-center gap-1.5 transition">
                Save Index
              </button>
              <button type="button" id="btn-save-as-new" class="py-2 px-3 bg-paper border border-line hover:bg-card rounded-lg font-mono text-xs text-ink transition" title="Save as a new index copy">
                + Save As New
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <input type="text" id="custom-index-desc-input" value="${this.customIndexDesc}" placeholder="Add short research notes or description..." class="w-full text-xs font-sans text-ink2 bg-transparent border-0 border-b border-transparent hover:border-line focus:border-moss p-0 pb-0.5 focus:ring-0 focus:outline-none"/>
            <span id="save-status-msg" class="text-xs font-mono text-moss font-semibold shrink-0 h-4"></span>
          </div>
        </div>

        <!-- Presets & Saved Indices Carousel / Bar -->
        <div class="space-y-2">
          <!-- Curated Benchmarks -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-mono uppercase tracking-wider text-muted font-semibold">1-Click Benchmark Bundles</span>
            </div>
            <div class="flex flex-wrap gap-2">
              ${bundleButtons}
            </div>
          </div>

          <!-- My Saved Indices (if any) -->
          ${savedButtons ? `
            <div class="pt-2 border-t border-line/60">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-mono uppercase tracking-wider text-gold font-semibold flex items-center gap-1">
                  My Saved Custom Indices (${this.savedIndices.length})
                </span>
              </div>
              <div class="flex flex-wrap gap-2">
                ${savedButtons}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- 2-Column Split: Left = Sliders & Controls; Right = Live Updating Map & Leaderboard -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- Left Column: Sliders, Math, & Catalog (7 Cols) -->
          <div class="lg:col-span-7 space-y-4">
            
            <!-- Mathematical Options -->
            <div class="p-3.5 bg-paper border border-line rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <label class="block text-muted uppercase tracking-wider mb-1 font-semibold text-[10px]">Aggregation Formula</label>
                <select id="sel-aggregation" class="w-full p-1.5 bg-card border border-line rounded-lg text-ink font-mono text-xs">
                  <option value="arithmetic" ${this.aggregationFormula === 'arithmetic' ? 'selected' : ''}>Arithmetic Mean (Equal Trade-off)</option>
                  <option value="geometric" ${this.aggregationFormula === 'geometric' ? 'selected' : ''}>Geometric Mean (Penalizes Deficits)</option>
                  <option value="harmonic" ${this.aggregationFormula === 'harmonic' ? 'selected' : ''}>Harmonic Mean (Strict Balance)</option>
                </select>
              </div>

              <div>
                <label class="block text-muted uppercase tracking-wider mb-1 font-semibold text-[10px]">Global Normalization Baseline</label>
                <select id="sel-normalization" class="w-full p-1.5 bg-card border border-line rounded-lg text-ink font-mono text-xs">
                  <option value="minmax" ${this.normalizationMethod === 'minmax' ? 'selected' : ''}>Min-Max Scale (0 to 100)</option>
                  <option value="zscore" ${this.normalizationMethod === 'zscore' ? 'selected' : ''}>Z-Score (Standardized)</option>
                  <option value="rank" ${this.normalizationMethod === 'rank' ? 'selected' : ''}>Rank Percentile (0 to 100%)</option>
                </select>
              </div>
            </div>

            <!-- Active Sub-Indicators -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-mono uppercase tracking-wider text-muted font-semibold">Active Sub-Indicators (${this.activeIndicators.length})</span>
                <div class="flex gap-2">
                  <button type="button" id="btn-equalize" class="py-1 px-2 bg-card border border-line rounded text-ink2 hover:bg-paper font-mono text-[10px] transition">
                    Equalize
                  </button>
                  <button type="button" id="btn-norm100" class="py-1 px-2 bg-card border border-line rounded text-ink2 hover:bg-paper font-mono text-[10px] transition">
                    Scale 100%
                  </button>
                </div>
              </div>
              <div class="space-y-2">
                ${indicatorRows}
              </div>
            </div>

            <!-- Add More Indicators from Library with Categorization Filter -->
            <div class="p-4 bg-card border border-line rounded-xl shadow-xs">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                <div class="flex items-center gap-2">
                  <span class="font-serif font-semibold text-sm text-ink">Add from Library</span>
                  <button type="button" id="btn-open-wb-drawer" class="px-2.5 py-1 bg-moss/10 border border-moss/40 text-moss hover:bg-moss hover:text-white rounded-lg font-mono text-[11px] font-semibold shadow-xs flex items-center gap-1 transition">
                    + World Bank Library (30k+) →
                  </button>
                </div>
                
                <div class="flex flex-wrap items-center gap-2">
                  <!-- Type Filter Tabs -->
                  <div class="flex bg-paper border border-line rounded-lg p-0.5 text-[10px] font-mono">
                    <button type="button" class="catalog-type-btn px-2 py-0.5 rounded transition ${this.selectedTypeFilter === 'all' ? 'bg-card font-bold text-ink shadow-xs' : 'text-muted'}" data-type="all">All (${allCount})</button>
                    <button type="button" class="catalog-type-btn px-2 py-0.5 rounded transition ${this.selectedTypeFilter === 'composite' ? 'bg-card font-bold text-slate shadow-xs' : 'text-muted'}" data-type="composite">Composite (${compCount})</button>
                    <button type="button" class="catalog-type-btn px-2 py-0.5 rounded transition ${this.selectedTypeFilter === 'primary' ? 'bg-card font-bold text-moss shadow-xs' : 'text-muted'}" data-type="primary">Primary (${primCount})</button>
                  </div>

                  <!-- Domain Filter -->
                  <select id="catalog-domain-filter" class="p-1 bg-paper border border-line rounded text-xs font-mono">
                    <option value="all">All Domains</option>
                    ${Object.entries(DOMAINS).map(([k, v]) => `<option value="${k}" ${this.selectedDomainFilter === k ? 'selected' : ''}>${v.label.split(' ')[0]}</option>`).join('')}
                  </select>

                  <!-- Search -->
                  <input type="search" id="catalog-search" placeholder="Search 124 indicators..." value="${this.searchQuery}" class="p-1 px-2 bg-paper border border-line rounded text-xs font-mono w-28 sm:w-36"/>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                ${catalogItems.length ? catalogItems : '<div class="col-span-full py-4 text-center text-xs text-muted font-mono">No matching unselected indicators found.</div>'}
              </div>
            </div>
          </div>

          <!-- Right Column: Live Synchronized Map & Top Leaderboard (5 Cols) -->
          <div class="lg:col-span-5 space-y-4 sticky top-16">
            <!-- Live Map Preview Card -->
            <div class="p-4 bg-card border border-line rounded-xl shadow-sm">
              <div class="flex items-center justify-between mb-2">
                <span class="font-mono text-xs uppercase tracking-wider text-muted font-semibold flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-moss animate-pulse"></span>
                  Live Choropleth Update
                </span>
                <span class="font-mono text-[10px] text-muted font-semibold">Drag sliders to watch shift</span>
              </div>
              <div id="builder-live-map-container" class="w-full h-auto bg-paper border border-line rounded-lg overflow-hidden"></div>
            </div>

            <!-- Live Top 8 Leaderboard Preview -->
            <div class="p-4 bg-card border border-line rounded-xl shadow-sm">
              <div class="flex items-center justify-between mb-2">
                <span class="font-mono text-xs uppercase tracking-wider text-muted font-semibold">Live Top Leaderboard</span>
                <span class="font-mono text-[10px] text-moss font-semibold">Instant Recalculation</span>
              </div>
              <div id="builder-live-leaderboard" class="divide-y divide-line/60 border border-line rounded-lg overflow-hidden text-xs"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderLiveMapAndLeaderboard();
    this.attachEventListeners(container);
  }

  renderLiveMapAndLeaderboard() {
    if (Object.keys(this.liveScores).length > 0) {
      renderChoroplethMap('builder-live-map-container', this.liveScores, {
        palette: 'moss_gold',
        showLegend: true,
        label: 'Live Composite Score'
      });

      const leadEl = document.getElementById('builder-live-leaderboard');
      if (leadEl) {
        const sorted = Object.entries(this.liveScores)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8);

        leadEl.innerHTML = sorted.map(([iso, score], idx) => {
          const c = getCountry(iso);
          return `
            <div class="p-2 flex items-center justify-between bg-card hover:bg-paper transition">
              <div class="flex items-center gap-2 min-w-0">
                <span class="font-mono text-[11px] font-bold text-muted w-5">#${idx + 1}</span>
                <span class="font-sans font-semibold text-xs text-ink truncate">${c.name}</span>
                <span class="font-mono text-[9.5px] text-muted">(${iso})</span>
              </div>
              <span class="font-mono font-bold text-xs text-moss shrink-0">${score.toFixed(1)}</span>
            </div>
          `;
        }).join('');
      }
    }
  }

  attachEventListeners(container) {
    // Custom Name & Description input
    const nameInput = container.querySelector('#custom-index-name-input');
    if (nameInput) {
      nameInput.oninput = e => {
        this.customIndexName = e.target.value;
        this.notifyUpdate();
      };
    }

    const descInput = container.querySelector('#custom-index-desc-input');
    if (descInput) {
      descInput.oninput = e => {
        this.customIndexDesc = e.target.value;
        this.notifyUpdate();
      };
    }

    // Save Buttons
    const saveBtn = container.querySelector('#btn-save-index');
    const saveAsBtn = container.querySelector('#btn-save-as-new');
    const statusMsg = container.querySelector('#save-status-msg');

    if (saveBtn) {
      saveBtn.onclick = () => {
        this.saveCurrentIndex(this.customIndexName, this.customIndexDesc);
        if (statusMsg) {
          statusMsg.textContent = '✓ Saved to your library!';
          setTimeout(() => { if (statusMsg) statusMsg.textContent = ''; }, 3000);
        }
      };
    }

    if (saveAsBtn) {
      saveAsBtn.onclick = () => {
        this.activeSavedId = null; // Forces new save
        const copyName = `${this.customIndexName} (Copy)`;
        this.saveCurrentIndex(copyName, this.customIndexDesc);
        if (statusMsg) {
          statusMsg.textContent = '✓ Saved as new copy!';
          setTimeout(() => { if (statusMsg) statusMsg.textContent = ''; }, 3000);
        }
      };
    }

    // Saved Indices load & delete buttons
    container.querySelectorAll('.load-saved-btn').forEach(btn => {
      btn.onclick = () => this.loadSavedIndex(btn.dataset.savedId);
    });

    container.querySelectorAll('.del-saved-btn').forEach(btn => {
      btn.onclick = e => {
        e.stopPropagation();
        if (confirm('Delete this saved custom index?')) {
          this.deleteSavedIndex(btn.dataset.savedId);
        }
      };
    });

    // Presets
    container.querySelectorAll('.preset-btn').forEach(btn => {
      btn.onclick = () => this.loadBundle(btn.dataset.bundle);
    });

    // Sliders
    container.querySelectorAll('.weight-slider').forEach(slider => {
      slider.oninput = e => this.setWeight(slider.dataset.id, parseFloat(e.target.value));
    });

    // Locks
    container.querySelectorAll('.lock-btn').forEach(btn => {
      btn.onclick = () => this.toggleLock(btn.dataset.id);
    });

    // Info & Settings Drawer Toggles
    container.querySelectorAll('.info-btn').forEach(btn => {
      btn.onclick = () => this.toggleInfo(btn.dataset.id);
    });

    container.querySelectorAll('.settings-btn').forEach(btn => {
      btn.onclick = () => this.toggleSettings(btn.dataset.id);
    });

    // Transform and Polarity selects
    container.querySelectorAll('.transform-sel').forEach(sel => {
      sel.onchange = e => this.updateIndicatorConfig(sel.dataset.id, { transform: e.target.value });
    });

    container.querySelectorAll('.polarity-sel').forEach(sel => {
      sel.onchange = e => this.updateIndicatorConfig(sel.dataset.id, { polarity: parseInt(e.target.value) });
    });

    // Min / Max cap inputs
    container.querySelectorAll('.clip-min-input').forEach(input => {
      input.onchange = e => {
        const val = e.target.value.trim() === '' ? null : parseFloat(e.target.value);
        this.updateIndicatorConfig(input.dataset.id, { clipMin: isNaN(val) ? null : val });
      };
    });

    container.querySelectorAll('.clip-max-input').forEach(input => {
      input.onchange = e => {
        const val = e.target.value.trim() === '' ? null : parseFloat(e.target.value);
        this.updateIndicatorConfig(input.dataset.id, { clipMax: isNaN(val) ? null : val });
      };
    });

    // Remove
    container.querySelectorAll('.remove-btn').forEach(btn => {
      btn.onclick = () => this.removeIndicator(btn.dataset.id);
    });

    // Add
    container.querySelectorAll('.add-ind-btn').forEach(btn => {
      btn.onclick = () => this.addIndicator(btn.dataset.id);
    });

    // Dropdowns
    const aggSel = container.querySelector('#sel-aggregation');
    if (aggSel) aggSel.onchange = e => this.setAggregation(e.target.value);

    const normSel = container.querySelector('#sel-normalization');
    if (normSel) normSel.onchange = e => this.setNormalization(e.target.value);

    // Helpers
    const eqBtn = container.querySelector('#btn-equalize');
    if (eqBtn) eqBtn.onclick = () => this.equalizeWeights();

    const n100Btn = container.querySelector('#btn-norm100');
    if (n100Btn) n100Btn.onclick = () => this.normalizeWeightsTo100();

    // Type filter tabs
    container.querySelectorAll('.catalog-type-btn').forEach(btn => {
      btn.onclick = () => {
        this.selectedTypeFilter = btn.dataset.type;
        this.render();
      };
    });

    // Search and filter
    const searchInput = container.querySelector('#catalog-search');
    if (searchInput) {
      searchInput.oninput = e => {
        this.searchQuery = e.target.value;
        this.render();
      };
    }

    const domainFilter = container.querySelector('#catalog-domain-filter');
    if (domainFilter) {
      domainFilter.onchange = e => {
        this.selectedDomainFilter = e.target.value;
        this.render();
      };
    }

    // World Bank Drawer Open
    const wbBtn = container.querySelector('#btn-open-wb-drawer');
    if (wbBtn) {
      wbBtn.onclick = () => this.onOpenWorldBankDrawer();
    }
  }
}
