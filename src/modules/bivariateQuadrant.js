// Bivariate Quadrant & Matrix Analysis Module with Multi-Custom Comparison & 2D Spotlight Map
import { INDICATORS, INDICATOR_LIST, DOMAINS, BENCHMARK_BUNDLES } from '../data/indicators.js';
import { getCountry } from '../data/countries.js';
import { normalizeIndicator, calculateCompositeIndex } from '../engine/stats.js';
import { renderBivariateChoroplethMap } from './mapEngine.js';

const STORAGE_KEY = 'gio_saved_custom_indices_v1';

export class BivariateQuadrantModule {
  constructor(options = {}) {
    this.containerId = options.containerId || 'bivariate-quadrant-container';
    this.customIndexData = options.customIndexData || {};
    this.customIndexName = options.customIndexName || 'Custom Index';

    this.selectedX = 'hdi';
    this.selectedY = 'custom';
    this.selectedCell = null; // [row, col] or null

    // Search modal state
    this.modalTargetAxis = null;
    this.modalSearchQuery = '';
    this.modalTypeFilter = 'all';
    this.modalDomainFilter = 'all';
  }

  setCustomIndexData(data, name = 'Custom Index') {
    this.customIndexData = data || {};
    this.customIndexName = name || 'Custom Index';
    this.render();
  }

  loadSavedIndicesFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Could not read saved indices from localStorage', e);
      return [];
    }
  }

  computeSavedIndexScores(savedItem) {
    if (!savedItem || !savedItem.indicators || savedItem.indicators.length === 0) return {};
    const subIndicators = savedItem.indicators.map(item => {
      const ind = INDICATORS[item.id] || { name: item.id, data: {}, polarity: 1 };
      const normOptions = {
        method: savedItem.normalization || 'minmax',
        polarity: item.polarity !== undefined ? item.polarity : (ind.polarity !== undefined ? ind.polarity : 1),
        transform: item.transform || ind.defaultTransform || 'linear',
        clipMin: item.clipMin !== undefined ? item.clipMin : null,
        clipMax: item.clipMax !== undefined ? item.clipMax : null
      };
      const normData = normalizeIndicator(ind.data || {}, normOptions);
      return {
        id: item.id,
        weight: item.weight || 20,
        data: normData
      };
    });
    return calculateCompositeIndex(subIndicators, savedItem.formula || 'arithmetic');
  }

  computeBundleScores(bundle) {
    if (!bundle || !bundle.weights) return {};
    const subIndicators = Object.entries(bundle.weights).map(([id, weight]) => {
      const ind = INDICATORS[id] || { name: id, data: {}, polarity: 1 };
      const normData = normalizeIndicator(ind.data || {}, bundle.norm || 'minmax', ind.polarity || 1);
      return {
        id,
        weight,
        data: normData
      };
    });
    return calculateCompositeIndex(subIndicators, bundle.formula || 'arithmetic');
  }

  getAllDatasets() {
    const list = [];

    // 1. Active Custom Index
    list.push({
      id: 'custom',
      name: this.customIndexName || 'Active Custom Index',
      short: 'Active Custom',
      unit: 'Score (0–100)',
      type: 'custom',
      domain: 'wellbeing',
      polarity: 1,
      desc: 'The currently active customized index model from the Index Builder.',
      data: this.customIndexData
    });

    // 2. Saved Custom Indices
    const saved = this.loadSavedIndicesFromStorage();
    saved.forEach(s => {
      const scores = this.computeSavedIndexScores(s);
      list.push({
        id: `saved_${s.id}`,
        name: `${s.name}`,
        short: s.name,
        unit: 'Score (0–100)',
        type: 'custom',
        domain: 'wellbeing',
        polarity: 1,
        desc: s.desc || `User-saved custom model with ${s.indicators?.length || 0} sub-indicators.`,
        data: scores,
        isSaved: true
      });
    });

    // 3. Preset Benchmark Bundles
    BENCHMARK_BUNDLES.forEach(b => {
      const scores = this.computeBundleScores(b);
      list.push({
        id: `bundle_${b.id}`,
        name: `${b.name}`,
        short: b.name.split(' ')[0],
        unit: 'Score (0–100)',
        type: 'composite',
        domain: b.domain || 'wellbeing',
        polarity: 1,
        desc: b.description || 'Pre-configured international benchmark model.',
        data: scores,
        isBundle: true
      });
    });

    // 4. All Standard Indicators
    INDICATOR_LIST.forEach(ind => {
      list.push({
        id: ind.id,
        name: ind.name,
        short: ind.short,
        unit: ind.unit,
        type: ind.type,
        domain: ind.domain,
        polarity: ind.polarity !== undefined ? ind.polarity : 1,
        desc: ind.desc,
        source: ind.source,
        data: ind.data
      });
    });

    return list;
  }

  getDataset(id) {
    const all = this.getAllDatasets();
    const found = all.find(d => d.id === id);
    if (found) return found;
    if (id === 'custom') {
      return {
        id: 'custom',
        name: this.customIndexName,
        short: 'Custom Index',
        data: this.customIndexData,
        unit: 'Score (0–100)',
        type: 'custom',
        polarity: 1,
        domain: 'wellbeing'
      };
    }
    return INDICATORS[id] || null;
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const dataXObj = this.getDataset(this.selectedX) || this.getDataset('hdi');
    const dataYObj = this.getDataset(this.selectedY) || this.getDataset('custom');

    const normX = normalizeIndicator(dataXObj ? dataXObj.data : {}, 'minmax', dataXObj?.polarity || 1);
    const normY = normalizeIndicator(dataYObj ? dataYObj.data : {}, 'minmax', dataYObj?.polarity || 1);

    const commonIsos = Object.keys(normX).filter(iso => normY[iso] !== undefined);

    // 4x4 Grid Bins: [0-25, 25-50, 50-75, 75-100]
    const tiers = ['Low', 'Medium', 'High', 'Very High'];
    const gridMatrix = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => []));

    commonIsos.forEach(iso => {
      const x = normX[iso];
      const y = normY[iso];
      const col = Math.min(3, Math.floor(x / 25));
      const row = Math.min(3, Math.floor(y / 25));
      gridMatrix[row][col].push({
        iso,
        name: getCountry(iso).name,
        rawX: dataXObj?.data[iso],
        rawY: dataYObj?.data[iso],
        scoreX: x,
        scoreY: y
      });
    });

    // Filtered countries based on selected cell
    let displayedCountries = [];
    if (this.selectedCell) {
      const [r, c] = this.selectedCell;
      displayedCountries = gridMatrix[r][c];
    } else {
      displayedCountries = commonIsos.map(iso => ({
        iso,
        name: getCountry(iso).name,
        rawX: dataXObj?.data[iso],
        rawY: dataYObj?.data[iso],
        scoreX: normX[iso],
        scoreY: normY[iso]
      }));
    }

    displayedCountries.sort((a, b) => b.scoreY - a.scoreY);

    // Render 4x4 interactive matrix
    let matrixHtml = `<div class="grid grid-cols-4 gap-1.5 p-2 bg-paper border border-line rounded-xl aspect-square max-w-[280px] mx-auto">`;

    // Row 3 is top (Very High Y), Row 0 is bottom (Low Y)
    for (let r = 3; r >= 0; r--) {
      for (let c = 0; c < 4; c++) {
        const cellCountries = gridMatrix[r][c];
        const isSelected = this.selectedCell && this.selectedCell[0] === r && this.selectedCell[1] === c;
        const count = cellCountries.length;

        // Bivariate 2D Color blending
        const xIntensity = c / 3; // 0 to 1
        const yIntensity = r / 3; // 0 to 1
        const baseColor = this.getBivariateColor(xIntensity, yIntensity);

        matrixHtml += `
          <button type="button" class="bivariate-cell flex flex-col items-center justify-center rounded-lg border transition relative ${
            isSelected ? 'ring-2 ring-ink ring-offset-2 font-bold scale-105 z-10' : 'hover:opacity-90'
          }" style="background:${baseColor};border-color:rgba(0,0,0,0.08);" data-row="${r}" data-col="${c}" title="Y: ${tiers[r]} | X: ${tiers[c]} (${count} countries)">
            <span class="text-xs font-mono font-bold ${yIntensity > 0.5 || xIntensity > 0.5 ? 'text-white' : 'text-ink'}">${count}</span>
          </button>
        `;
      }
    }
    matrixHtml += `</div>`;

    const getBadge = (d) => {
      if (!d) return '';
      if (d.type === 'custom') {
        return `<span class="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-gold/20 text-gold border border-gold/40 shrink-0">CUSTOM MODEL</span>`;
      }
      if (d.type === 'composite') {
        return `<span class="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-slate text-white tracking-wide shrink-0">COMPOSITE BENCHMARK</span>`;
      }
      return `<span class="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-moss text-white tracking-wide shrink-0">PRIMARY METRIC</span>`;
    };

    const getDomainColor = (d) => {
      if (!d) return '#2E6B57';
      const dom = DOMAINS[d.domain];
      return dom ? dom.color : '#2E6B57';
    };

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Interactive Variable Selector Bar -->
        <div class="p-4 sm:p-5 bg-card border border-line rounded-xl shadow-xs space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-mono text-xs uppercase tracking-wider text-muted font-semibold">Bivariate Cross-Tabulation Variables</span>
            <span class="font-mono text-[10.5px] text-moss font-semibold">2D Quadrant Matrix</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
            
            <!-- X Axis Selector Card -->
            <div class="md:col-span-5 p-3.5 bg-paper border border-line rounded-xl flex flex-col justify-between gap-2.5">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="font-mono text-[10px] uppercase font-bold text-muted bg-card px-1.5 py-0.5 rounded border border-line">Horizontal Axis (X)</span>
                  ${getBadge(dataXObj)}
                </div>
              </div>
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:${getDomainColor(dataXObj)}"></span>
                  <span class="font-serif font-bold text-sm sm:text-base text-ink truncate">${dataXObj?.name || 'Select X'}</span>
                </div>
                <button type="button" id="btn-biv-pick-x" class="py-1.5 px-3 rounded-lg bg-card border border-line hover:bg-moss hover:text-white hover:border-moss font-mono text-xs font-semibold shrink-0 transition shadow-xs">
                  Change
                </button>
              </div>
            </div>

            <!-- Swap X/Y Button -->
            <div class="md:col-span-1 flex justify-center">
              <button type="button" id="btn-biv-swap" class="p-2.5 bg-paper border border-line hover:bg-card hover:border-moss rounded-full text-ink font-mono text-sm transition shadow-xs hover:scale-110" title="Swap X and Y axes">
                ⇄
              </button>
            </div>

            <!-- Y Axis Selector Card -->
            <div class="md:col-span-5 p-3.5 bg-paper border border-line rounded-xl flex flex-col justify-between gap-2.5">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="font-mono text-[10px] uppercase font-bold text-muted bg-card px-1.5 py-0.5 rounded border border-line">Vertical Axis (Y)</span>
                  ${getBadge(dataYObj)}
                </div>
              </div>
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:${getDomainColor(dataYObj)}"></span>
                  <span class="font-serif font-bold text-sm sm:text-base text-ink truncate">${dataYObj?.name || 'Select Y'}</span>
                </div>
                <button type="button" id="btn-biv-pick-y" class="py-1.5 px-3 rounded-lg bg-card border border-line hover:bg-moss hover:text-white hover:border-moss font-mono text-xs font-semibold shrink-0 transition shadow-xs">
                  Change
                </button>
              </div>
            </div>
          </div>

          <!-- Quick Presets -->
          <div class="pt-2 border-t border-line/60 flex flex-wrap items-center gap-1.5">
            <span class="text-[10px] font-mono uppercase text-muted font-bold mr-1">Quick Comparison:</span>
            <button type="button" class="biv-quick-btn px-2.5 py-1 rounded bg-paper border border-line hover:bg-card hover:border-moss font-mono text-[11px] text-ink transition" data-target-id="custom">
              Active Custom Index
            </button>
            <button type="button" class="biv-quick-btn px-2.5 py-1 rounded bg-paper border border-line hover:bg-card hover:border-moss font-mono text-[11px] text-ink transition" data-target-id="gdp_pc">
              GDP per Capita
            </button>
            <button type="button" class="biv-quick-btn px-2.5 py-1 rounded bg-paper border border-line hover:bg-card hover:border-moss font-mono text-[11px] text-ink transition" data-target-id="hdi">
              Human Development (HDI)
            </button>
            <button type="button" class="biv-quick-btn px-2.5 py-1 rounded bg-paper border border-line hover:bg-card hover:border-moss font-mono text-[11px] text-ink transition" data-target-id="happiness">
              Happiness Score
            </button>
            <button type="button" class="biv-quick-btn px-2.5 py-1 rounded bg-paper border border-line hover:bg-card hover:border-moss font-mono text-[11px] text-ink transition" data-target-id="democracy">
              Democracy Index
            </button>
          </div>
        </div>

        <!-- 3-Column Studio Layout: Matrix (4 cols), Map (5 cols), Country List (3 cols) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- Left: 4x4 Matrix -->
          <div class="lg:col-span-4 p-5 bg-card border border-line rounded-xl flex flex-col justify-between h-full space-y-4">
            <div>
              <div class="flex items-center justify-between mb-1">
                <h4 class="font-serif font-semibold text-base text-ink">4×4 Bivariate Matrix</h4>
                ${this.selectedCell ? '<button type="button" id="btn-reset-cell" class="text-xs font-mono text-clay hover:underline">Reset Cell Filter</button>' : ''}
              </div>
              <p class="text-xs text-muted font-sans">
                Click any cell to spotlight matching countries on the map.
              </p>
            </div>

            <div class="space-y-1">
              <div class="text-center font-mono text-[10px] text-muted font-semibold uppercase">▲ ${dataYObj?.name || 'Y'} (High)</div>
              ${matrixHtml}
              <div class="text-center font-mono text-[10px] text-muted font-semibold uppercase">▼ Low</div>
              <div class="flex justify-between font-mono text-[10px] text-muted px-4 font-semibold uppercase">
                <span>◀ Low</span>
                <span>${dataXObj?.name || 'X'} ▶</span>
              </div>
            </div>

            <div class="pt-2 border-t border-line text-xs font-mono text-muted space-y-1">
              <div class="flex justify-between">
                <span>Top-Right (High / High):</span>
                <span class="font-bold text-moss">Synergistic Leaders</span>
              </div>
              <div class="flex justify-between">
                <span>Top-Left (High Y / Low X):</span>
                <span class="font-bold text-slate">Overperforming Outliers</span>
              </div>
            </div>
          </div>

          <!-- Middle: Interactive 2D Map -->
          <div class="lg:col-span-5 p-4 bg-card border border-line rounded-xl space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-mono text-xs uppercase tracking-wider text-muted font-semibold flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-moss"></span>
                2D Bivariate Geographic Spotlight
              </span>
              <span class="font-mono text-[10.5px] text-muted font-semibold">
                ${this.selectedCell ? `Spotlight: ${displayedCountries.length} countries` : 'All Countries'}
              </span>
            </div>
            <div id="bivariate-map-canvas" class="w-full h-auto bg-paper border border-line rounded-lg overflow-hidden"></div>
          </div>

          <!-- Right: Matched Country List -->
          <div class="lg:col-span-3 p-4 bg-card border border-line rounded-xl space-y-3">
            <div class="flex items-center justify-between border-b border-line pb-2">
              <span class="font-serif font-semibold text-sm text-ink">Countries (${displayedCountries.length})</span>
              <span class="font-mono text-[10px] text-muted">${this.selectedCell ? 'In Selected Cell' : 'All'}</span>
            </div>

            <div class="space-y-1.5 max-h-[330px] overflow-y-auto pr-1">
              ${displayedCountries.map(c => `
                <div class="p-2 rounded-lg bg-paper border border-line hover:border-moss transition flex items-center justify-between text-xs">
                  <div class="min-w-0 flex-1">
                    <span class="font-sans font-semibold text-ink truncate block">${c.name}</span>
                    <span class="font-mono text-[10px] text-muted">X: ${c.rawX !== undefined ? c.rawX : '—'} | Y: ${c.rawY !== undefined ? c.rawY : '—'}</span>
                  </div>
                  <span class="font-mono text-[10.5px] font-bold text-moss ml-2 shrink-0">${c.scoreY.toFixed(0)}</span>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- Metric Picker Modal Container -->
        <div id="biv-metric-picker-modal-backdrop" class="fixed inset-0 bg-ink/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 hidden">
          <div class="bg-card border border-line rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-fadeIn">
            
            <!-- Modal Header -->
            <div class="p-4 sm:p-5 border-b border-line flex items-center justify-between bg-paper">
              <div>
                <h3 class="font-serif font-bold text-base sm:text-lg text-ink" id="biv-modal-title">Select Variable</h3>
                <p class="text-xs text-muted font-sans">Choose from your custom models, benchmark bundles, or 124 global indicators.</p>
              </div>
              <button type="button" id="btn-close-biv-modal" class="p-1.5 rounded-lg hover:bg-card text-muted hover:text-ink font-mono text-base transition">
                ✕
              </button>
            </div>

            <!-- Modal Search Bar -->
            <div class="p-4 border-b border-line space-y-3 bg-card">
              <div class="relative">
                <input type="search" id="biv-modal-search-input" placeholder="Search by name, indicator, keyword, or domain..." class="w-full p-2.5 pl-9 bg-paper border border-line rounded-xl font-sans text-sm text-ink focus:border-moss focus:ring-0 focus:outline-none"/>
                <svg class="w-4 h-4 text-muted absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>

              <div class="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div class="flex bg-paper border border-line rounded-lg p-0.5 text-[10.5px]">
                  <button type="button" class="biv-modal-tab-btn px-2.5 py-1 rounded transition" data-type="all">All</button>
                  <button type="button" class="biv-modal-tab-btn px-2.5 py-1 rounded transition" data-type="custom">My Custom Models</button>
                  <button type="button" class="biv-modal-tab-btn px-2.5 py-1 rounded transition" data-type="composite">Composite</button>
                  <button type="button" class="biv-modal-tab-btn px-2.5 py-1 rounded transition" data-type="primary">Primary</button>
                </div>

                <select id="biv-modal-domain-select" class="p-1 px-2 bg-paper border border-line rounded text-xs font-mono">
                  <option value="all">All Domains</option>
                  ${Object.entries(DOMAINS).map(([k, v]) => `<option value="${k}">${v.label.split(' ')[0]}</option>`).join('')}
                </select>
              </div>
            </div>

            <!-- Modal Metric Cards Grid -->
            <div id="biv-modal-metric-list" class="p-4 overflow-y-auto space-y-2 flex-1"></div>
          </div>
        </div>

      </div>
    `;

    this.renderBivariateMap(gridMatrix, dataXObj, dataYObj);
    this.attachEventListeners(container);
  }

  getBivariateColor(xInt, yInt) {
    const r = Math.round(230 - xInt * 120 + yInt * 20);
    const g = Math.round(235 - yInt * 110 - xInt * 30);
    const b = Math.round(240 - xInt * 90 - yInt * 130);
    return `rgb(${Math.max(30, Math.min(240, r))}, ${Math.max(40, Math.min(240, g))}, ${Math.max(50, Math.min(240, b))})`;
  }

  renderBivariateMap(gridMatrix, dataXObj, dataYObj) {
    const highlightIsos = this.selectedCell
      ? gridMatrix[this.selectedCell[0]][this.selectedCell[1]].map(c => c.iso)
      : null;

    const normX = normalizeIndicator(dataXObj ? dataXObj.data : {}, 'minmax', dataXObj?.polarity || 1);
    const normY = normalizeIndicator(dataYObj ? dataYObj.data : {}, 'minmax', dataYObj?.polarity || 1);

    renderBivariateChoroplethMap('bivariate-map-canvas', normX, normY, {
      labelX: dataXObj?.name || 'X',
      labelY: dataYObj?.name || 'Y',
      highlightIsos
    });
  }

  openMetricModal(targetAxis) {
    this.modalTargetAxis = targetAxis;
    this.modalSearchQuery = '';
    this.modalTypeFilter = 'all';
    this.modalDomainFilter = 'all';

    const backdrop = document.getElementById('biv-metric-picker-modal-backdrop');
    const titleEl = document.getElementById('biv-modal-title');
    const searchInput = document.getElementById('biv-modal-search-input');

    if (backdrop) backdrop.classList.remove('hidden');
    if (titleEl) titleEl.textContent = targetAxis === 'x' ? 'Select Horizontal Axis (X Variable)' : 'Select Vertical Axis (Y Variable)';
    if (searchInput) {
      searchInput.value = '';
      setTimeout(() => searchInput.focus(), 100);
    }

    this.renderModalList();
  }

  closeMetricModal() {
    this.modalTargetAxis = null;
    const backdrop = document.getElementById('biv-metric-picker-modal-backdrop');
    if (backdrop) backdrop.classList.add('hidden');
  }

  renderModalList() {
    const listEl = document.getElementById('biv-modal-metric-list');
    if (!listEl) return;

    const all = this.getAllDatasets();
    const filtered = all.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(this.modalSearchQuery.toLowerCase()) || (item.desc || '').toLowerCase().includes(this.modalSearchQuery.toLowerCase()) || (item.short || '').toLowerCase().includes(this.modalSearchQuery.toLowerCase());
      const matchesType = this.modalTypeFilter === 'all' || item.type === this.modalTypeFilter;
      const matchesDomain = this.modalDomainFilter === 'all' || item.domain === this.modalDomainFilter;
      return matchesSearch && matchesType && matchesDomain;
    });

    const isSelected = (id) => (this.modalTargetAxis === 'x' ? this.selectedX === id : this.selectedY === id);

    listEl.innerHTML = filtered.map(item => {
      const domainInfo = DOMAINS[item.domain] || { color: '#2E6B57', label: 'Domain' };
      const selected = isSelected(item.id);

      const typeBadge = item.type === 'custom'
        ? `<span class="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-gold/20 text-gold border border-gold/40">CUSTOM MODEL</span>`
        : item.type === 'composite'
        ? `<span class="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-slate text-white">COMPOSITE BENCHMARK</span>`
        : `<span class="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-moss text-white">PRIMARY METRIC</span>`;

      return `
        <div class="p-3 bg-paper border ${selected ? 'border-moss bg-moss/5' : 'border-line'} hover:border-moss rounded-xl flex items-center justify-between gap-3 cursor-pointer transition biv-modal-item-card" data-id="${item.id}">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:${domainInfo.color}"></span>
              <span class="font-sans font-bold text-xs sm:text-sm text-ink truncate">${item.name}</span>
              ${typeBadge}
              ${item.unit ? `<span class="font-mono text-[10px] text-muted truncate">(${item.unit})</span>` : ''}
            </div>
            <p class="font-sans text-xs text-ink2 line-clamp-1">${item.desc || 'No description provided.'}</p>
          </div>

          <button type="button" class="py-1.5 px-3 rounded-lg ${selected ? 'bg-moss text-white' : 'bg-card border border-line hover:bg-moss hover:text-white'} font-mono text-xs font-semibold shrink-0 transition">
            ${selected ? 'Selected' : 'Select'}
          </button>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.biv-modal-item-card').forEach(card => {
      card.onclick = () => {
        const id = card.dataset.id;
        if (this.modalTargetAxis === 'x') {
          this.selectedX = id;
        } else if (this.modalTargetAxis === 'y') {
          this.selectedY = id;
        }
        this.selectedCell = null;
        this.closeMetricModal();
        this.render();
      };
    });
  }

  attachEventListeners(container) {
    // Pick Buttons
    const pickXBtn = container.querySelector('#btn-biv-pick-x');
    if (pickXBtn) pickXBtn.onclick = () => this.openMetricModal('x');

    const pickYBtn = container.querySelector('#btn-biv-pick-y');
    if (pickYBtn) pickYBtn.onclick = () => this.openMetricModal('y');

    // Swap Axes
    const swapBtn = container.querySelector('#btn-biv-swap');
    if (swapBtn) {
      swapBtn.onclick = () => {
        const temp = this.selectedX;
        this.selectedX = this.selectedY;
        this.selectedY = temp;
        this.selectedCell = null;
        this.render();
      };
    }

    // Quick Presets
    container.querySelectorAll('.biv-quick-btn').forEach(btn => {
      btn.onclick = () => {
        this.selectedX = btn.dataset.targetId;
        this.selectedCell = null;
        this.render();
      };
    });

    // Reset Cell Filter
    const resetBtn = container.querySelector('#btn-reset-cell');
    if (resetBtn) {
      resetBtn.onclick = () => {
        this.selectedCell = null;
        this.render();
      };
    }

    // Matrix Cell Clicks
    container.querySelectorAll('.bivariate-cell').forEach(cell => {
      cell.onclick = () => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (this.selectedCell && this.selectedCell[0] === row && this.selectedCell[1] === col) {
          this.selectedCell = null;
        } else {
          this.selectedCell = [row, col];
        }
        this.render();
      };
    });

    // Modal Close
    const closeBtn = container.querySelector('#btn-close-biv-modal');
    if (closeBtn) closeBtn.onclick = () => this.closeMetricModal();

    const backdrop = container.querySelector('#biv-metric-picker-modal-backdrop');
    if (backdrop) {
      backdrop.onclick = e => {
        if (e.target === backdrop) this.closeMetricModal();
      };
    }

    // Modal Search
    const searchInput = container.querySelector('#biv-modal-search-input');
    if (searchInput) {
      searchInput.oninput = e => {
        this.modalSearchQuery = e.target.value;
        this.renderModalList();
      };
    }

    // Modal Tabs
    container.querySelectorAll('.biv-modal-tab-btn').forEach(btn => {
      btn.onclick = () => {
        this.modalTypeFilter = btn.dataset.type;
        container.querySelectorAll('.biv-modal-tab-btn').forEach(b => b.classList.remove('bg-card', 'font-bold', 'text-ink', 'shadow-xs'));
        btn.classList.add('bg-card', 'font-bold', 'text-ink', 'shadow-xs');
        this.renderModalList();
      };
    });

    // Modal Domain Select
    const domainSel = container.querySelector('#biv-modal-domain-select');
    if (domainSel) {
      domainSel.onchange = e => {
        this.modalDomainFilter = e.target.value;
        this.renderModalList();
      };
    }
  }
}
