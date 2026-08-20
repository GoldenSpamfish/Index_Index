// Global Index Observatory - Main Application Bootstrap
import { INDICATORS } from './data/indicators.js';
import { COUNTRIES, getCountry } from './data/countries.js';
import {
  normalizeIndicator,
  calculateCompositeIndex,
  calculateRankings
} from './engine/stats.js';
import {
  renderChoroplethMap,
  renderCountryProfileFlower
} from './modules/mapEngine.js';
import { IndexBuilderStudio } from './modules/indexBuilder.js';
import { CorrelationStudio } from './modules/correlationStudio.js';
import { PerformanceAnatomyModule } from './modules/performanceAnatomy.js';
import { BivariateQuadrantModule } from './modules/bivariateQuadrant.js';
import { SensitivityAnalyzerModule } from './modules/sensitivityAnalyzer.js';
import { ImporterExporterModule } from './modules/importerExporter.js';
import { WorldBankDrawerModule } from './modules/worldBankDrawer.js';

class App {
  constructor() {
    this.currentCompositeScores = {};
    this.currentRanks = {};
    this.currentSubIndicators = []; // Normalized with weights
    this.currentFormula = 'arithmetic';
    this.currentNormalization = 'minmax';
    this.currentPalette = 'moss_gold';
    this.activeCountryHover = 'NOR'; // Default flower preview country
    this.activeCountryPin = null;
    this.rankSearchQuery = '';

    // Initialize modules
    this.builderStudio = null;
    this.corrStudio = null;
    this.anatomyModule = null;
    this.bivariateModule = null;
    this.sensitivityModule = null;
    this.importerExporter = null;
    this.wbDrawer = null;
  }

  init() {
    // 1. Initialize Sub-modules
    this.wbDrawer = new WorldBankDrawerModule({
      containerId: 'world-bank-drawer-container',
      onIndicatorImported: importedData => this.onWorldBankIndicatorImported(importedData)
    });
    this.wbDrawer.init();

    this.builderStudio = new IndexBuilderStudio({
      containerId: 'index-builder-container',
      onUpdate: state => this.onIndexConfigUpdate(state),
      onOpenWorldBankDrawer: (q) => this.wbDrawer.open(q)
    });

    this.corrStudio = new CorrelationStudio({
      containerId: 'correlation-studio-container',
      customIndexData: this.currentCompositeScores,
      customIndexName: 'Custom Index'
    });

    this.anatomyModule = new PerformanceAnatomyModule({
      containerId: 'performance-anatomy-container'
    });

    this.bivariateModule = new BivariateQuadrantModule({
      containerId: 'bivariate-quadrant-container',
      customIndexData: this.currentCompositeScores,
      customIndexName: 'Custom Index'
    });

    this.sensitivityModule = new SensitivityAnalyzerModule({
      containerId: 'sensitivity-analyzer-container',
      subIndicators: this.currentSubIndicators,
      compositeScores: this.currentCompositeScores,
      formula: this.currentFormula
    });

    this.importerExporter = new ImporterExporterModule({
      containerId: 'data-studio-container',
      onImport: customData => this.onCustomDataImported(customData),
      onOpenWorldBankDrawer: (q) => this.wbDrawer.open(q),
      getCurrentIndexState: () => ({
        name: this.builderStudio.customIndexName,
        desc: this.builderStudio.customIndexDesc,
        indicators: this.builderStudio.activeIndicators,
        formula: this.currentFormula,
        normalization: this.currentNormalization,
        bundleId: this.builderStudio.activeBundleId
      })
    });

    // Check if URL has a shared state config
    const sharedState = this.importerExporter.decodeStateFromUrl();
    if (sharedState && sharedState.indicators && sharedState.indicators.length > 0) {
      this.builderStudio.customIndexName = sharedState.name || 'Shared Custom Index';
      this.builderStudio.customIndexDesc = sharedState.desc || '';
      this.builderStudio.activeIndicators = sharedState.indicators;
      this.builderStudio.aggregationFormula = sharedState.formula || 'arithmetic';
      this.builderStudio.normalizationMethod = sharedState.normalization || 'minmax';
      this.builderStudio.activeBundleId = sharedState.bundleId || null;
      this.builderStudio.render();
      this.builderStudio.notifyUpdate();
    }

    // 2. Setup Top-level Controls
    this.setupHeaderAndNav();
    this.setupMapControls();
    this.setupRankSearch();

    // Trigger full state synchronization across all modules
    this.builderStudio.notifyUpdate();

    // Initial render for secondary modules
    this.anatomyModule.render();
    this.importerExporter.render();
  }

  onIndexConfigUpdate(state) {
    this.currentFormula = state.formula;
    this.currentNormalization = state.normalization;

    // Prepare normalized sub-indicators with custom per-indicator transforms
    this.currentSubIndicators = state.indicators.map(item => {
      const ind = INDICATORS[item.id] || { name: item.id, short: item.id, polarity: 1, domain: 'wellbeing', data: {} };
      const normOptions = {
        method: this.currentNormalization,
        polarity: item.polarity !== undefined ? item.polarity : (ind.polarity !== undefined ? ind.polarity : 1),
        transform: item.transform || ind.defaultTransform || 'linear',
        clipMin: item.clipMin !== undefined ? item.clipMin : null,
        clipMax: item.clipMax !== undefined ? item.clipMax : null
      };
      const normData = normalizeIndicator(ind.data, normOptions);
      return {
        id: item.id,
        name: ind.name,
        short: ind.short || item.id,
        domain: ind.domain,
        weight: item.weight,
        data: normData,
        raw: ind.data,
        normOptions
      };
    });

    // Compute composite index
    this.currentCompositeScores = calculateCompositeIndex(this.currentSubIndicators, this.currentFormula);
    this.currentRanks = calculateRankings(this.currentCompositeScores);

    // Global references for instant exporter access
    window.APP_SCORES = this.currentCompositeScores;
    window.APP_SUB_INDICATORS = this.currentSubIndicators;

    const indexTitle = state.name || (state.bundleId ? this.getBundleTitle(state.bundleId) : 'Custom Composite Index');

    // Refresh UI components
    this.updateStatsRibbon(indexTitle);
    this.renderMap();
    this.renderHistogram();
    this.renderRankingList();
    this.renderFlower();

    // Update subordinate modules
    if (this.builderStudio) this.builderStudio.setLiveScores(this.currentCompositeScores, this.currentRanks);
    if (this.corrStudio) this.corrStudio.setCustomIndexData(this.currentCompositeScores, indexTitle);
    if (this.bivariateModule) this.bivariateModule.setCustomIndexData(this.currentCompositeScores, indexTitle);
    if (this.sensitivityModule) this.sensitivityModule.setData(this.currentSubIndicators, this.currentCompositeScores, this.currentFormula);
    if (this.importerExporter) this.importerExporter.render();
  }

  getBundleTitle(bundleId) {
    const map = {
      human_flourishing: 'Human Flourishing',
      sustainable_progress: 'Sustainable Progress',
      institutional_integrity: 'Institutional Integrity',
      economic_innovation: 'Economic Power',
      inclusive_equality: 'Inclusive Equality'
    };
    return map[bundleId] || 'Custom Composite Index';
  }

  updateStatsRibbon(indexTitle) {
    const scores = Object.values(this.currentCompositeScores);
    const sorted = Object.entries(this.currentCompositeScores).sort((a, b) => b[1] - a[1]);

    const topIso = sorted.length > 0 ? sorted[0][0] : '—';
    const topCountry = getCountry(topIso).name;
    const topScore = sorted.length > 0 ? sorted[0][1] : 0;

    const mean = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—';

    const titleEl = document.getElementById('stat-active-name');
    if (titleEl) titleEl.textContent = indexTitle;

    const countEl = document.getElementById('stat-countries-count');
    if (countEl) countEl.textContent = scores.length;

    const topEl = document.getElementById('stat-top-country');
    if (topEl) topEl.textContent = `${topCountry} (${topScore})`;

    const meanEl = document.getElementById('stat-global-mean');
    if (meanEl) meanEl.textContent = `${mean} / 100`;

    const indCountEl = document.getElementById('stat-ind-count');
    if (indCountEl) indCountEl.textContent = this.currentSubIndicators.length;
  }

  renderMap() {
    renderChoroplethMap('main-map-container', this.currentCompositeScores, {
      palette: this.currentPalette,
      label: 'Composite Index Score (0 to 100)',
      onCountryHover: iso => {
        if (!this.activeCountryPin) {
          this.activeCountryHover = iso;
          this.renderFlower();
        }
      },
      onCountryClick: iso => {
        this.activeCountryPin = this.activeCountryPin === iso ? null : iso;
        this.activeCountryHover = iso;
        this.renderFlower();
      }
    });
  }

  renderFlower() {
    const targetIso = this.activeCountryPin || this.activeCountryHover || 'NOR';

    // Calculate global means for sub-indicators
    const globalMeans = {};
    this.currentSubIndicators.forEach(ind => {
      const vals = Object.values(ind.data);
      globalMeans[ind.id] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 50;
    });

    renderCountryProfileFlower('country-flower-container', targetIso, this.currentSubIndicators, globalMeans);
  }

  renderHistogram() {
    const container = document.getElementById('hist-canvas');
    if (!container) return;

    const scores = Object.values(this.currentCompositeScores).filter(v => !isNaN(v));
    if (scores.length === 0) return;

    const numBins = 14;
    const minVal = 0;
    const maxVal = 100;
    const binWidth = (maxVal - minVal) / numBins;

    const bins = new Array(numBins).fill(0);
    scores.forEach(v => {
      let b = Math.floor((v - minVal) / binWidth);
      if (b >= numBins) b = numBins - 1;
      if (b < 0) b = 0;
      bins[b]++;
    });

    const maxCount = Math.max(...bins, 1);

    const W = 500;
    const H = 220;
    const M = { l: 40, r: 15, t: 15, b: 35 };
    const iw = W - M.l - M.r;
    const ih = H - M.t - M.b;

    let bars = '';
    bins.forEach((count, i) => {
      const x = M.l + (i / numBins) * iw;
      const bw = iw / numBins - 2;
      const barH = (count / maxCount) * ih;
      const y = M.t + ih - barH;

      bars += `
        <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${barH.toFixed(1)}" fill="#2E6B57" fill-opacity="0.8" rx="2" class="transition-all hover:fill-moss hover:fill-opacity-100 cursor-pointer">
          <title>Score range: ${(i * binWidth).toFixed(0)}–${((i + 1) * binWidth).toFixed(0)} (${count} countries)</title>
        </rect>
        <text x="${(x + bw / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" font-family="var(--mono)" font-size="8.5" fill="#6E7E7E" text-anchor="middle">${count > 0 ? count : ''}</text>
      `;
    });

    // Axis
    const axisSvg = `
      <line x1="${M.l}" y1="${M.t + ih}" x2="${M.l + iw}" y2="${M.t + ih}" stroke="#D6DAD1"/>
      <text x="${M.l}" y="${M.t + ih + 15}" font-family="var(--mono)" font-size="9" fill="#6E7E7E">0</text>
      <text x="${M.l + iw / 2}" y="${M.t + ih + 15}" font-family="var(--mono)" font-size="9" fill="#6E7E7E" text-anchor="middle">50</text>
      <text x="${M.l + iw}" y="${M.t + ih + 15}" font-family="var(--mono)" font-size="9" fill="#6E7E7E" text-anchor="end">100</text>
      <text x="${M.l - 8}" y="${M.t + 10}" font-family="var(--mono)" font-size="9" fill="#6E7E7E" text-anchor="end">${maxCount}</text>
    `;

    container.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" class="w-full h-full block select-none">
        ${bars}
        ${axisSvg}
      </svg>
    `;
  }

  renderRankingList() {
    const container = document.getElementById('main-ranklist');
    if (!container) return;

    const sorted = Object.entries(this.currentCompositeScores)
      .sort((a, b) => b[1] - a[1])
      .filter(([iso, _]) => {
        if (!this.rankSearchQuery) return true;
        const country = getCountry(iso);
        return country.name.toLowerCase().includes(this.rankSearchQuery.toLowerCase()) || iso.toLowerCase().includes(this.rankSearchQuery.toLowerCase());
      });

    if (sorted.length === 0) {
      container.innerHTML = `<div class="p-4 text-xs font-mono text-muted text-center">No countries match "${this.rankSearchQuery}".</div>`;
      return;
    }

    container.innerHTML = `
      <div class="rrow hd">
        <span>Rank</span>
        <span>Country</span>
        <span style="text-align:right">Score</span>
      </div>
      ${sorted.map(([iso, score], idx) => {
        const country = getCountry(iso);
        const isPinned = this.activeCountryPin === iso;
        const rankNum = this.currentRanks[iso] || (idx + 1);

        return `
          <div class="rrow ${isPinned ? 'on' : ''}" data-iso="${iso}">
            <span class="rk">#${rankNum}</span>
            <span class="font-sans font-semibold text-ink">${country.name} <span class="font-mono text-[10px] text-muted font-normal">(${iso})</span></span>
            <span class="v font-bold text-moss">${score.toFixed(1)}</span>
          </div>
        `;
      }).join('')}
    `;

    container.querySelectorAll('.rrow[data-iso]').forEach(row => {
      const iso = row.dataset.iso;
      row.onclick = () => {
        this.activeCountryPin = this.activeCountryPin === iso ? null : iso;
        this.activeCountryHover = iso;
        this.renderMap();
        this.renderFlower();
        this.renderRankingList();
      };
      row.onmouseenter = () => {
        if (!this.activeCountryPin) {
          this.activeCountryHover = iso;
          this.renderFlower();
        }
      };
    });
  }

  setupHeaderAndNav() {
    // Scroll spy
    const navLinks = document.querySelectorAll('nav a');
    const sections = ['explore', 'builder', 'correlation', 'anatomy', 'bivariate', 'sensitivity', 'datastudio'];

    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY + 140;
      let currentSection = sections[0];

      sections.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPos) {
          currentSection = id;
        }
      });

      navLinks.forEach(link => {
        const target = link.getAttribute('href').replace('#', '');
        link.classList.toggle('on', target === currentSection);
      });
    }, { passive: true });
  }

  setupMapControls() {
    const paletteSel = document.getElementById('map-palette-select');
    if (paletteSel) {
      paletteSel.onchange = e => {
        this.currentPalette = e.target.value;
        this.renderMap();
      };
    }
  }

  setupRankSearch() {
    const searchInput = document.getElementById('rank-search-input');
    if (searchInput) {
      searchInput.oninput = e => {
        this.rankSearchQuery = e.target.value;
        this.renderRankingList();
      };
    }
  }

  onCustomDataImported(customData) {
    const newId = `custom_${Date.now()}`;
    INDICATORS[newId] = {
      id: newId,
      name: customData.name,
      short: customData.name.substring(0, 10),
      domain: 'wellbeing',
      polarity: 1,
      source: 'User Uploaded File',
      year: new Date().getFullYear(),
      desc: `User imported dataset with ${customData.count} matched countries.`,
      data: customData.data
    };

    // Add directly to builder
    if (this.builderStudio) {
      this.builderStudio.addIndicator(newId);
    }
  }

  onWorldBankIndicatorImported(importedData) {
    // Add directly into active indicators in builder
    if (this.builderStudio) {
      this.builderStudio.addIndicator(importedData.id);
    }
    // Refresh modules
    if (this.corrStudio) {
      this.corrStudio.render();
    }
    if (this.bivariateModule) {
      this.bivariateModule.render();
    }
  }
}

// Bootstrap when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
