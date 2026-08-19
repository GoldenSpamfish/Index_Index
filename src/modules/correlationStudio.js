// Correlation Matrix & Scatter Fit Studio Module with Multi-Custom Index Comparison & Enhanced Search
import { INDICATORS, INDICATOR_LIST, DOMAINS, BENCHMARK_BUNDLES } from '../data/indicators.js';
import { getCountry } from '../data/countries.js';
import {
  pearsonCorrelation,
  spearmanCorrelation,
  computeRegressionFits,
  explainCorrelation,
  normalizeIndicator,
  calculateCompositeIndex
} from '../engine/stats.js';
import { showGlobalTooltip, moveGlobalTooltip, hideGlobalTooltip } from './mapEngine.js';

const STORAGE_KEY = 'gio_saved_custom_indices_v1';

export class CorrelationStudio {
  constructor(options = {}) {
    this.containerId = options.containerId || 'correlation-studio-container';
    this.customIndexData = options.customIndexData || {};
    this.customIndexName = options.customIndexName || 'Custom Index';

    this.selectedX = 'gdp_pc';
    this.selectedY = 'custom';
    this.fitType = 'quadratic'; // 'none' | 'linear' | 'quadratic'
    this.searchQuery = '';

    // Search modal state
    this.modalTargetAxis = null; // 'x' | 'y' | null
    this.modalSearchQuery = '';
    this.modalTypeFilter = 'all'; // 'all' | 'custom' | 'composite' | 'primary'
    this.modalDomainFilter = 'all';

    // Table filter state
    this.tableSearchQuery = '';
    this.tableTypeFilter = 'all';
    this.tableDomainFilter = 'all';
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

    // 1. Active Custom Index (currently in builder)
    list.push({
      id: 'custom',
      name: this.customIndexName || 'Active Custom Index',
      short: 'Active Custom',
      unit: 'Score (0–100)',
      type: 'custom',
      domain: 'wellbeing',
      desc: 'The currently active customized index model configured in the Index Builder.',
      data: this.customIndexData
    });

    // 2. Saved Custom Indices from localStorage
    const saved = this.loadSavedIndicesFromStorage();
    saved.forEach(s => {
      const scores = this.computeSavedIndexScores(s);
      list.push({
        id: `saved_${s.id}`,
        name: `★ ${s.name}`,
        short: s.name,
        unit: 'Score (0–100)',
        type: 'custom',
        domain: 'wellbeing',
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
        name: `⚡ ${b.name}`,
        short: b.name.split(' ')[0],
        unit: 'Score (0–100)',
        type: 'composite',
        domain: b.domain || 'wellbeing',
        desc: b.description || 'Pre-configured international benchmark model.',
        data: scores,
        isBundle: true
      });
    });

    // 4. All 124 Standard Indicators (24 Composites + 100 Primary)
    INDICATOR_LIST.forEach(ind => {
      list.push({
        id: ind.id,
        name: ind.name,
        short: ind.short,
        unit: ind.unit,
        type: ind.type,
        domain: ind.domain,
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
        domain: 'wellbeing'
      };
    }
    return INDICATORS[id] || null;
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const dataXObj = this.getDataset(this.selectedX) || this.getDataset('gdp_pc');
    const dataYObj = this.getDataset(this.selectedY) || this.getDataset('custom');

    const xData = dataXObj ? dataXObj.data : {};
    const yData = dataYObj ? dataYObj.data : {};

    const pearson = pearsonCorrelation(xData, yData);
    const spearman = spearmanCorrelation(xData, yData);
    const explanation = explainCorrelation(pearson.r, dataXObj?.name || 'X', dataYObj?.name || 'Y');

    const getBadge = (d) => {
      if (!d) return '';
      if (d.type === 'custom') {
        return `<span class="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-gold/20 text-gold border border-gold/40 shrink-0">★ CUSTOM MODEL</span>`;
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
        
        <!-- Top Stats Row -->
        <div class="statline">
          <div class="stat-title">Statistical Relationship Overview</div>
          <div class="stat">
            <span class="k">Pearson Correlation (r)</span>
            <span class="v ${pearson.r > 0.6 ? 'text-moss' : pearson.r < -0.4 ? 'text-clay' : 'text-slate'} font-bold">
              ${pearson.r > 0 ? '+' : ''}${pearson.r.toFixed(3)}
            </span>
          </div>
          <div class="stat">
            <span class="k">Spearman Rank (ρ)</span>
            <span class="v font-bold text-ink">${spearman.rho > 0 ? '+' : ''}${spearman.rho.toFixed(3)}</span>
          </div>
          <div class="stat">
            <span class="k">Explained Variance (R²)</span>
            <span class="v font-bold text-ink">${(pearson.r2 * 100).toFixed(1)}%</span>
          </div>
          <div class="stat">
            <span class="k">Countries Compared</span>
            <span class="v font-bold text-ink">${pearson.n}</span>
          </div>
        </div>

        <!-- Plain English Interpretation Card -->
        <div class="p-4 bg-paper border-l-4 border-moss rounded-r-xl border border-line">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-mono text-xs font-semibold uppercase tracking-wider text-moss">${explanation.strength}</span>
          </div>
          <p class="font-sans text-sm text-ink2 leading-relaxed">${explanation.desc}</p>
        </div>

        <!-- Interactive Comparison Studio Selector Bar -->
        <div class="p-4 sm:p-5 bg-card border border-line rounded-xl shadow-xs space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-mono text-xs uppercase tracking-wider text-muted font-semibold">Active Comparison Variables</span>
            <div class="flex items-center gap-2">
              <label class="text-xs font-mono text-muted">Fit Line:</label>
              <select id="corr-sel-fit" class="p-1 px-2 bg-paper border border-line rounded text-xs font-mono text-ink">
                <option value="none" ${this.fitType === 'none' ? 'selected' : ''}>None (Scatter Only)</option>
                <option value="linear" ${this.fitType === 'linear' ? 'selected' : ''}>Linear Trend (y = mx + b)</option>
                <option value="quadratic" ${this.fitType === 'quadratic' ? 'selected' : ''}>Quadratic Curve (y = ax² + bx + c)</option>
              </select>
            </div>
          </div>

          <!-- 2 Variable Cards + Swap Button in Middle -->
          <div class="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
            
            <!-- X Axis Selector Card -->
            <div class="md:col-span-5 p-3.5 bg-paper border border-line rounded-xl flex flex-col justify-between gap-2.5">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="font-mono text-[10px] uppercase font-bold text-muted bg-card px-1.5 py-0.5 rounded border border-line">X Axis (Horizontal)</span>
                  ${getBadge(dataXObj)}
                </div>
              </div>
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:${getDomainColor(dataXObj)}"></span>
                  <span class="font-serif font-bold text-sm sm:text-base text-ink truncate">${dataXObj?.name || 'Select X'}</span>
                </div>
                <button type="button" id="btn-pick-x" class="py-1.5 px-3 rounded-lg bg-card border border-line hover:bg-moss hover:text-white hover:border-moss font-mono text-xs font-semibold shrink-0 transition flex items-center gap-1.5 shadow-xs">
                  <span>🔍</span> Change
                </button>
              </div>
              <span class="font-mono text-[10.5px] text-muted truncate">${dataXObj?.unit ? `Unit: ${dataXObj.unit}` : ''}</span>
            </div>

            <!-- Swap X/Y Button -->
            <div class="md:col-span-1 flex justify-center">
              <button type="button" id="btn-swap-axes" class="p-2.5 bg-paper border border-line hover:bg-card hover:border-moss rounded-full text-ink font-mono text-sm transition shadow-xs hover:scale-110" title="Swap X and Y axes">
                ⇄
              </button>
            </div>

            <!-- Y Axis Selector Card -->
            <div class="md:col-span-5 p-3.5 bg-paper border border-line rounded-xl flex flex-col justify-between gap-2.5">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="font-mono text-[10px] uppercase font-bold text-muted bg-card px-1.5 py-0.5 rounded border border-line">Y Axis (Vertical)</span>
                  ${getBadge(dataYObj)}
                </div>
              </div>
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:${getDomainColor(dataYObj)}"></span>
                  <span class="font-serif font-bold text-sm sm:text-base text-ink truncate">${dataYObj?.name || 'Select Y'}</span>
                </div>
                <button type="button" id="btn-pick-y" class="py-1.5 px-3 rounded-lg bg-card border border-line hover:bg-moss hover:text-white hover:border-moss font-mono text-xs font-semibold shrink-0 transition flex items-center gap-1.5 shadow-xs">
                  <span>🔍</span> Change
                </button>
              </div>
              <span class="font-mono text-[10.5px] text-muted truncate">${dataYObj?.unit ? `Unit: ${dataYObj.unit}` : ''}</span>
            </div>
          </div>

          <!-- Quick Comparison Preset Chips -->
          <div class="pt-2 border-t border-line/60 flex flex-wrap items-center gap-1.5">
            <span class="text-[10px] font-mono uppercase text-muted font-bold mr-1">Quick Benchmarks:</span>
            <button type="button" class="quick-compare-btn px-2.5 py-1 rounded bg-paper border border-line hover:bg-card hover:border-moss font-mono text-[11px] text-ink transition" data-target-id="custom">
              ★ Active Custom Index
            </button>
            <button type="button" class="quick-compare-btn px-2.5 py-1 rounded bg-paper border border-line hover:bg-card hover:border-moss font-mono text-[11px] text-ink transition" data-target-id="gdp_pc">
              ⚡ GDP per Capita
            </button>
            <button type="button" class="quick-compare-btn px-2.5 py-1 rounded bg-paper border border-line hover:bg-card hover:border-moss font-mono text-[11px] text-ink transition" data-target-id="happiness">
              ⚡ Happiness Score
            </button>
            <button type="button" class="quick-compare-btn px-2.5 py-1 rounded bg-paper border border-line hover:bg-card hover:border-moss font-mono text-[11px] text-ink transition" data-target-id="rule_of_law">
              ⚡ Rule of Law
            </button>
            <button type="button" class="quick-compare-btn px-2.5 py-1 rounded bg-paper border border-line hover:bg-card hover:border-moss font-mono text-[11px] text-ink transition" data-target-id="co2_pc">
              ⚡ CO2 Emissions
            </button>
            <button type="button" class="quick-compare-btn px-2.5 py-1 rounded bg-paper border border-line hover:bg-card hover:border-moss font-mono text-[11px] text-ink transition" data-target-id="gini_index">
              ⚡ Gini Inequality
            </button>
            <button type="button" class="quick-compare-btn px-2.5 py-1 rounded bg-paper border border-line hover:bg-card hover:border-moss font-mono text-[11px] text-ink transition" data-target-id="homicide_rate">
              ⚡ Homicide Rate
            </button>
          </div>
        </div>

        <!-- Pairwise Scatter Plot Container -->
        <div class="p-4 sm:p-5 bg-card border border-line rounded-xl shadow-xs">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h3 class="font-serif font-semibold text-base sm:text-lg text-ink truncate">
              ${dataYObj?.name} <span class="text-muted font-normal">vs.</span> ${dataXObj?.name}
            </h3>
            <span class="font-mono text-xs text-moss font-semibold" id="fit-formula-badge"></span>
          </div>
          <div id="scatter-plot-canvas" class="w-full h-80 sm:h-96"></div>
        </div>

        <!-- Full Multi-Benchmark Correlation Ranking Table -->
        <div class="p-4 sm:p-5 bg-card border border-line rounded-xl shadow-xs space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-line pb-3">
            <div>
              <h3 class="font-serif font-semibold text-base text-ink">Comprehensive Benchmark Correlation Rankings</h3>
              <p class="text-xs text-muted font-sans">
                Rank of all 124 indicators and custom models by correlation with <b>"${dataYObj?.name}"</b>. Click any row to compare directly.
              </p>
            </div>

            <!-- Table Filters -->
            <div class="flex flex-wrap items-center gap-2">
              <div class="flex bg-paper border border-line rounded-lg p-0.5 text-[10px] font-mono">
                <button type="button" class="tbl-type-btn px-2 py-0.5 rounded transition ${this.tableTypeFilter === 'all' ? 'bg-card font-bold text-ink shadow-xs' : 'text-muted'}" data-type="all">All</button>
                <button type="button" class="tbl-type-btn px-2 py-0.5 rounded transition ${this.tableTypeFilter === 'custom' ? 'bg-card font-bold text-gold shadow-xs' : 'text-muted'}" data-type="custom">★ Custom</button>
                <button type="button" class="tbl-type-btn px-2 py-0.5 rounded transition ${this.tableTypeFilter === 'composite' ? 'bg-card font-bold text-slate shadow-xs' : 'text-muted'}" data-type="composite">Composite</button>
                <button type="button" class="tbl-type-btn px-2 py-0.5 rounded transition ${this.tableTypeFilter === 'primary' ? 'bg-card font-bold text-moss shadow-xs' : 'text-muted'}" data-type="primary">Primary</button>
              </div>

              <input type="search" id="corr-tbl-search" placeholder="Filter table..." value="${this.tableSearchQuery}" class="p-1 px-2 bg-paper border border-line rounded text-xs font-mono w-28 sm:w-36"/>
            </div>
          </div>

          <div id="full-correlation-table-container" class="max-h-72 overflow-y-auto"></div>
        </div>

        <!-- Metric Picker Modal Container -->
        <div id="metric-picker-modal-backdrop" class="fixed inset-0 bg-ink/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 hidden">
          <div class="bg-card border border-line rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-fadeIn">
            
            <!-- Modal Header -->
            <div class="p-4 sm:p-5 border-b border-line flex items-center justify-between bg-paper">
              <div>
                <h3 class="font-serif font-bold text-base sm:text-lg text-ink" id="modal-title">Select Variable</h3>
                <p class="text-xs text-muted font-sans" id="modal-subtitle">Choose from your custom models, composite benchmarks, or empirical metrics.</p>
              </div>
              <button type="button" id="btn-close-modal" class="p-1.5 rounded-lg hover:bg-card text-muted hover:text-ink font-mono text-base transition">
                ✕
              </button>
            </div>

            <!-- Modal Search & Category Filter Bar -->
            <div class="p-4 border-b border-line space-y-3 bg-card">
              <div class="relative">
                <input type="search" id="modal-search-input" placeholder="Search by name, indicator, keyword, or domain..." class="w-full p-2.5 pl-9 bg-paper border border-line rounded-xl font-sans text-sm text-ink focus:border-moss focus:ring-0 focus:outline-none"/>
                <svg class="w-4 h-4 text-muted absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>

              <div class="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div class="flex bg-paper border border-line rounded-lg p-0.5 text-[10.5px]">
                  <button type="button" class="modal-tab-btn px-2.5 py-1 rounded transition" data-type="all">All</button>
                  <button type="button" class="modal-tab-btn px-2.5 py-1 rounded transition" data-type="custom">★ My Custom Models</button>
                  <button type="button" class="modal-tab-btn px-2.5 py-1 rounded transition" data-type="composite">Composite</button>
                  <button type="button" class="modal-tab-btn px-2.5 py-1 rounded transition" data-type="primary">Primary</button>
                </div>

                <select id="modal-domain-select" class="p-1 px-2 bg-paper border border-line rounded text-xs font-mono">
                  <option value="all">All Domains</option>
                  ${Object.entries(DOMAINS).map(([k, v]) => `<option value="${k}">${v.label.split(' ')[0]}</option>`).join('')}
                </select>
              </div>
            </div>

            <!-- Modal Metric Cards Grid -->
            <div id="modal-metric-list" class="p-4 overflow-y-auto space-y-2 flex-1"></div>
          </div>
        </div>

      </div>
    `;

    this.renderScatterPlot(dataXObj, dataYObj);
    this.renderFullCorrelationTable(dataYObj);
    this.attachEventListeners(container);
  }

  renderScatterPlot(dataXObj, dataYObj) {
    const el = document.getElementById('scatter-plot-canvas');
    if (!el) return;

    const xData = dataXObj ? dataXObj.data : {};
    const yData = dataYObj ? dataYObj.data : {};

    const commonIsos = Object.keys(xData).filter(
      iso => yData[iso] !== undefined && xData[iso] !== null && yData[iso] !== null && !isNaN(xData[iso]) && !isNaN(yData[iso])
    );

    if (commonIsos.length < 3) {
      el.innerHTML = `<div class="flex items-center justify-center h-full text-xs text-muted font-mono">Not enough overlapping country data to draw scatter plot.</div>`;
      return;
    }

    const xVals = commonIsos.map(iso => xData[iso]);
    const yVals = commonIsos.map(iso => yData[iso]);

    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const minY = Math.min(...yVals);
    const maxY = Math.max(...yVals);

    const padX = (maxX - minX) * 0.08 || 1;
    const padY = (maxY - minY) * 0.08 || 1;

    const domainX = [minX - padX, maxX + padX];
    const domainY = [minY - padY, maxY + padY];

    const W = 700;
    const H = 360;
    const M = { l: 55, r: 25, t: 20, b: 45 };

    const iw = W - M.l - M.r;
    const ih = H - M.t - M.b;

    const sx = v => M.l + ((v - domainX[0]) / (domainX[1] - domainX[0])) * iw;
    const sy = v => M.t + ih - ((v - domainY[0]) / (domainY[1] - domainY[0])) * ih;

    // Grid lines
    let gridLines = '';
    const numTicks = 5;
    for (let i = 0; i <= numTicks; i++) {
      const vx = domainX[0] + (i / numTicks) * (domainX[1] - domainX[0]);
      const vy = domainY[0] + (i / numTicks) * (domainY[1] - domainY[0]);
      const xPos = sx(vx);
      const yPos = sy(vy);

      gridLines += `
        <line x1="${xPos.toFixed(1)}" y1="${M.t}" x2="${xPos.toFixed(1)}" y2="${M.t + ih}" stroke="#EDEFEA" stroke-width="1"/>
        <text x="${xPos.toFixed(1)}" y="${M.t + ih + 15}" text-anchor="middle" font-family="var(--mono)" font-size="9" fill="#8A8F98">${vx.toFixed(vx > 100 ? 0 : 1)}</text>
        <line x1="${M.l}" y1="${yPos.toFixed(1)}" x2="${M.l + iw}" y2="${yPos.toFixed(1)}" stroke="#EDEFEA" stroke-width="1"/>
        <text x="${M.l - 8}" y="${(yPos + 3.5).toFixed(1)}" text-anchor="end" font-family="var(--mono)" font-size="9" fill="#8A8F98">${vy.toFixed(vy > 100 ? 0 : 1)}</text>
      `;
    }

    // Regression Curve Fit Line
    let curvePath = '';
    const fits = computeRegressionFits(xData, yData);
    const badgeEl = document.getElementById('fit-formula-badge');

    if (fits && this.fitType !== 'none') {
      const predictFn = this.fitType === 'linear' ? fits.linear.predict : fits.quadratic.predict;
      if (badgeEl) {
        badgeEl.textContent = this.fitType === 'linear' ? fits.linear.formula : fits.quadratic.formula;
      }

      let d = '';
      const steps = 60;
      for (let i = 0; i <= steps; i++) {
        const vx = domainX[0] + (i / steps) * (domainX[1] - domainX[0]);
        const vy = predictFn(vx);
        const px = sx(vx);
        const py = sy(vy);
        d += (i === 0 ? 'M' : 'L') + `${px.toFixed(1)} ${py.toFixed(1)}`;
      }
      curvePath = `<path d="${d}" fill="none" stroke="#2E6B57" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="${this.fitType === 'quadratic' ? 'none' : '4 3'}"/>`;
    } else if (badgeEl) {
      badgeEl.textContent = '';
    }

    // Plot Points
    let pointsSvg = '';
    commonIsos.forEach(iso => {
      const country = getCountry(iso);
      const x = xData[iso];
      const y = yData[iso];
      const px = sx(x);
      const py = sy(y);

      const isNordic = country.blocs.includes('nordic');
      const dotColor = isNordic ? '#B8873B' : '#35617F';
      const dotRadius = isNordic ? 5.5 : 4.0;

      const tip = `<b>${country.name} (${iso})</b><br>${dataXObj.name}: <b>${x}</b><br>${dataYObj.name}: <b>${y}</b><br><span style="color:#8FBFA8;font-size:10px">${country.region}</span>`;

      pointsSvg += `
        <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${dotRadius}" fill="${dotColor}" fill-opacity="0.8" stroke="#FFFFFF" stroke-width="1" class="scatter-point cursor-pointer transition-all hover:r-6 hover:fill-moss" data-iso="${iso}" data-tip="${encodeURIComponent(tip)}"/>
      `;
    });

    // Axis Labels
    const axisLabels = `
      <text x="${M.l + iw / 2}" y="${H - 6}" text-anchor="middle" font-family="var(--body)" font-size="11" font-weight="600" fill="#16262A">${dataXObj.name} (${dataXObj.unit || ''})</text>
      <text transform="translate(14, ${M.t + ih / 2}) rotate(-90)" text-anchor="middle" font-family="var(--body)" font-size="11" font-weight="600" fill="#16262A">${dataYObj.name} (${dataYObj.unit || ''})</text>
    `;

    el.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" class="w-full h-full block select-none">
        ${gridLines}
        ${curvePath}
        ${pointsSvg}
        ${axisLabels}
      </svg>
    `;

    el.querySelectorAll('.scatter-point').forEach(pt => {
      pt.addEventListener('mouseenter', e => showGlobalTooltip(decodeURIComponent(pt.dataset.tip), e));
      pt.addEventListener('mousemove', moveGlobalTooltip);
      pt.addEventListener('mouseleave', hideGlobalTooltip);
    });
  }

  renderFullCorrelationTable(targetDataset) {
    const el = document.getElementById('full-correlation-table-container');
    if (!el || !targetDataset) return;

    const all = this.getAllDatasets();
    const targetData = targetDataset.data || {};

    const computed = all
      .filter(d => d.id !== targetDataset.id)
      .map(d => {
        const res = pearsonCorrelation(targetData, d.data || {});
        const rhoRes = spearmanCorrelation(targetData, d.data || {});
        return {
          id: d.id,
          name: d.name,
          short: d.short,
          type: d.type,
          domain: d.domain,
          r: res.r,
          r2: res.r2,
          rho: rhoRes.rho,
          n: res.n
        };
      })
      .sort((a, b) => Math.abs(b.r) - Math.abs(a.r));

    const filtered = computed.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(this.tableSearchQuery.toLowerCase()) || item.short.toLowerCase().includes(this.tableSearchQuery.toLowerCase());
      const matchesType = this.tableTypeFilter === 'all' || item.type === this.tableTypeFilter;
      const matchesDomain = this.tableDomainFilter === 'all' || item.domain === this.tableDomainFilter;
      return matchesSearch && matchesType && matchesDomain;
    });

    let tableHtml = `
      <table class="w-full border-collapse text-xs font-mono">
        <thead class="bg-paper sticky top-0 border-b border-line text-muted font-semibold">
          <tr>
            <th class="p-2 text-left">Benchmark / Indicator</th>
            <th class="p-2 text-center">Type</th>
            <th class="p-2 text-right">Pearson (r)</th>
            <th class="p-2 text-right">Spearman (ρ)</th>
            <th class="p-2 text-right">R²</th>
            <th class="p-2 text-center">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line/60">
    `;

    filtered.forEach(row => {
      let rClass = row.r > 0.6 ? 'text-moss font-bold' : row.r < -0.4 ? 'text-clay font-bold' : 'text-slate';
      let typeBadge = row.type === 'custom'
        ? `<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-gold/20 text-gold border border-gold/40">★ CUSTOM</span>`
        : row.type === 'composite'
        ? `<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate/15 text-slate border border-slate/30">COMPOSITE</span>`
        : `<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-moss/15 text-moss border border-moss/30">PRIMARY</span>`;

      tableHtml += `
        <tr class="hover:bg-paper/80 transition">
          <td class="p-2 font-sans font-semibold text-ink">${row.name}</td>
          <td class="p-2 text-center">${typeBadge}</td>
          <td class="p-2 text-right ${rClass}">${row.r > 0 ? '+' : ''}${row.r.toFixed(3)}</td>
          <td class="p-2 text-right font-semibold text-ink">${row.rho > 0 ? '+' : ''}${row.rho.toFixed(3)}</td>
          <td class="p-2 text-right text-muted">${(row.r2 * 100).toFixed(1)}%</td>
          <td class="p-2 text-center">
            <button type="button" class="tbl-compare-btn px-2 py-0.5 rounded bg-paper border border-line hover:bg-moss hover:text-white text-[10px] transition" data-id="${row.id}">
              Compare in Plot ↗
            </button>
          </td>
        </tr>
      `;
    });

    tableHtml += `</tbody></table>`;
    el.innerHTML = filtered.length ? tableHtml : `<div class="p-4 text-center text-xs text-muted font-mono">No matching metrics found.</div>`;

    el.querySelectorAll('.tbl-compare-btn').forEach(btn => {
      btn.onclick = () => {
        this.selectedX = btn.dataset.id;
        this.render();
      };
    });
  }

  openMetricModal(targetAxis) {
    this.modalTargetAxis = targetAxis;
    this.modalSearchQuery = '';
    this.modalTypeFilter = 'all';
    this.modalDomainFilter = 'all';

    const backdrop = document.getElementById('metric-picker-modal-backdrop');
    const titleEl = document.getElementById('modal-title');
    const subtitleEl = document.getElementById('modal-subtitle');
    const searchInput = document.getElementById('modal-search-input');

    if (backdrop) backdrop.classList.remove('hidden');
    if (titleEl) titleEl.textContent = targetAxis === 'x' ? 'Select Horizontal Axis (X Variable)' : 'Select Vertical Axis (Y Variable)';
    if (subtitleEl) subtitleEl.textContent = 'Choose from your saved custom models, benchmark bundles, or 124 global indicators.';
    if (searchInput) {
      searchInput.value = '';
      setTimeout(() => searchInput.focus(), 100);
    }

    this.renderModalList();
  }

  closeMetricModal() {
    this.modalTargetAxis = null;
    const backdrop = document.getElementById('metric-picker-modal-backdrop');
    if (backdrop) backdrop.classList.add('hidden');
  }

  renderModalList() {
    const listEl = document.getElementById('modal-metric-list');
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
        ? `<span class="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-gold/20 text-gold border border-gold/40">★ CUSTOM MODEL</span>`
        : item.type === 'composite'
        ? `<span class="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-slate text-white">COMPOSITE BENCHMARK</span>`
        : `<span class="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-moss text-white">PRIMARY METRIC</span>`;

      return `
        <div class="p-3 bg-paper border ${selected ? 'border-moss bg-moss/5' : 'border-line'} hover:border-moss rounded-xl flex items-center justify-between gap-3 cursor-pointer transition modal-item-card" data-id="${item.id}">
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
            ${selected ? '✓ Selected' : 'Select'}
          </button>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.modal-item-card').forEach(card => {
      card.onclick = () => {
        const id = card.dataset.id;
        if (this.modalTargetAxis === 'x') {
          this.selectedX = id;
        } else if (this.modalTargetAxis === 'y') {
          this.selectedY = id;
        }
        this.closeMetricModal();
        this.render();
      };
    });
  }

  attachEventListeners(container) {
    // Pick X and Y Buttons
    const pickXBtn = container.querySelector('#btn-pick-x');
    if (pickXBtn) pickXBtn.onclick = () => this.openMetricModal('x');

    const pickYBtn = container.querySelector('#btn-pick-y');
    if (pickYBtn) pickYBtn.onclick = () => this.openMetricModal('y');

    // Swap Axes
    const swapBtn = container.querySelector('#btn-swap-axes');
    if (swapBtn) {
      swapBtn.onclick = () => {
        const temp = this.selectedX;
        this.selectedX = this.selectedY;
        this.selectedY = temp;
        this.render();
      };
    }

    // Quick Compare Buttons
    container.querySelectorAll('.quick-compare-btn').forEach(btn => {
      btn.onclick = () => {
        this.selectedX = btn.dataset.targetId;
        this.render();
      };
    });

    // Fit Line Select
    const fitSel = container.querySelector('#corr-sel-fit');
    if (fitSel) {
      fitSel.onchange = e => {
        this.fitType = e.target.value;
        this.render();
      };
    }

    // Modal Close
    const closeBtn = container.querySelector('#btn-close-modal');
    if (closeBtn) closeBtn.onclick = () => this.closeMetricModal();

    const backdrop = container.querySelector('#metric-picker-modal-backdrop');
    if (backdrop) {
      backdrop.onclick = e => {
        if (e.target === backdrop) this.closeMetricModal();
      };
    }

    // Modal Search
    const searchInput = container.querySelector('#modal-search-input');
    if (searchInput) {
      searchInput.oninput = e => {
        this.modalSearchQuery = e.target.value;
        this.renderModalList();
      };
    }

    // Modal Tabs
    container.querySelectorAll('.modal-tab-btn').forEach(btn => {
      btn.onclick = () => {
        this.modalTypeFilter = btn.dataset.type;
        container.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('bg-card', 'font-bold', 'text-ink', 'shadow-xs'));
        btn.classList.add('bg-card', 'font-bold', 'text-ink', 'shadow-xs');
        this.renderModalList();
      };
    });

    // Modal Domain Select
    const modalDomainSel = container.querySelector('#modal-domain-select');
    if (modalDomainSel) {
      modalDomainSel.onchange = e => {
        this.modalDomainFilter = e.target.value;
        this.renderModalList();
      };
    }

    // Table Search and Tabs
    const tblSearch = container.querySelector('#corr-tbl-search');
    if (tblSearch) {
      tblSearch.oninput = e => {
        this.tableSearchQuery = e.target.value;
        const dataYObj = this.getDataset(this.selectedY);
        this.renderFullCorrelationTable(dataYObj);
      };
    }

    container.querySelectorAll('.tbl-type-btn').forEach(btn => {
      btn.onclick = () => {
        this.tableTypeFilter = btn.dataset.type;
        this.render();
      };
    });
  }
}
