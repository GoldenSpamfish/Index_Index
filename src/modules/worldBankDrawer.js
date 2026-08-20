// World Bank & Global Open Data Explorer Modal Drawer Module
import {
  CURATED_WB_INDICATORS,
  searchCuratedWorldBankCatalog,
  searchLiveWorldBankApi,
  fetchWorldBankIndicatorData
} from '../engine/worldBankApi.js';
import { DOMAINS, INDICATORS } from '../data/indicators.js';

export class WorldBankDrawerModule {
  constructor(options = {}) {
    this.containerId = options.containerId || 'world-bank-drawer-container';
    this.onIndicatorImported = options.onIndicatorImported || (() => {});

    this.isOpen = false;
    this.searchQuery = '';
    this.selectedDomain = 'all';
    this.loadingIndicatorId = null;
    this.importSuccessId = null;
    this.errorMessage = null;

    this.isLiveSearching = false;
    this.liveSearchResults = [];
    this.debounceTimer = null;
  }

  init() {
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.containerId;
      document.body.appendChild(container);
    }
    this.render();
  }

  open(initialQuery = '') {
    this.isOpen = true;
    this.searchQuery = initialQuery;
    this.errorMessage = null;
    this.importSuccessId = null;
    this.render();

    setTimeout(() => {
      const searchInput = document.getElementById('wb-drawer-search-input');
      if (searchInput) {
        searchInput.focus();
        if (initialQuery) {
          this.handleSearchInput(initialQuery);
        }
      }
    }, 100);
  }

  close() {
    this.isOpen = false;
    this.render();
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    if (!this.isOpen) {
      container.innerHTML = '';
      return;
    }

    const curatedMatches = searchCuratedWorldBankCatalog(this.searchQuery, this.selectedDomain);
    const combinedResults = [...curatedMatches, ...this.liveSearchResults.filter(l => !curatedMatches.some(c => c.id === l.id))];

    const quickPresets = [
      { id: 'SH.MED.BEDS.ZS', label: 'Hospital Beds / 1k' },
      { id: 'EG.ELC.RNEW.ZS', label: 'Renewable Electricity %' },
      { id: 'TX.VAL.TECH.MF.ZS', label: 'High-Tech Exports %' },
      { id: 'SL.TLF.CACT.FE.ZS', label: 'Female Labor Force %' },
      { id: 'IT.NET.USER.ZS', label: 'Internet Adoption %' },
      { id: 'GB.XPD.RSDV.GD.ZS', label: 'R&D % of GDP' },
      { id: 'GC.DOD.TOTL.GD.ZS', label: 'Gov Debt % GDP' },
      { id: 'SE.ADT.LITR.ZS', label: 'Adult Literacy Rate' }
    ];

    container.innerHTML = `
      <div id="wb-drawer-backdrop" class="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 transition-all duration-200">
        <div class="bg-card border border-line rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          <!-- Modal Header -->
          <div class="p-5 border-b border-line bg-paper/60 flex items-start justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-moss/15 text-moss border border-moss/30">WORLD BANK & UN OPEN DATA</span>
                <span class="text-[11px] font-mono text-muted">29,500+ Development Indicators</span>
              </div>
              <h3 class="font-serif font-bold text-xl sm:text-2xl text-ink">Global Indicator Catalog & Live Search</h3>
              <p class="text-xs text-muted font-sans mt-0.5">Explore, search, and import real-world development datasets directly into your custom composite index.</p>
            </div>
            <button id="wb-drawer-close-btn" class="p-2 text-muted hover:text-ink rounded-lg hover:bg-card transition font-mono text-xs border border-transparent hover:border-line">
              ? Close
            </button>
          </div>

          <!-- Quick Presets Ribbon -->
          <div class="px-5 py-2.5 bg-paper/40 border-b border-line flex items-center gap-2 overflow-x-auto text-xs font-mono">
            <span class="text-[10px] text-muted font-bold uppercase tracking-wider shrink-0">Popular:</span>
            ${quickPresets.map(qp => `
              <button type="button" class="wb-preset-chip px-2.5 py-1 rounded-lg border border-line bg-card hover:border-moss hover:text-moss text-[11px] text-ink2 transition whitespace-nowrap" data-id="${qp.id}">
                ${qp.label}
              </button>
            `).join('')}
          </div>

          <!-- Search & Filter Controls -->
          <div class="p-4 border-b border-line space-y-3 bg-card">
            <div class="flex flex-col sm:flex-row gap-3">
              <div class="relative flex-1">
                <input
                  type="text"
                  id="wb-drawer-search-input"
                  placeholder="Search 29,000+ indicators (e.g. 'hospital beds', 'solar', 'tariff', 'female employment')..."
                  value="${this.searchQuery}"
                  class="w-full pl-3 pr-8 py-2.5 bg-paper border border-line rounded-xl text-xs font-mono text-ink focus:outline-none focus:border-moss focus:ring-1 focus:ring-moss"
                />
                ${this.searchQuery ? `
                  <button id="wb-search-clear-btn" class="absolute right-2.5 top-2.5 text-xs text-muted hover:text-ink">?</button>
                ` : ''}
              </div>

              <!-- Domain Selector Tabs -->
              <select id="wb-drawer-domain-select" class="p-2.5 bg-paper border border-line rounded-xl text-xs font-mono text-ink shrink-0">
                <option value="all" ${this.selectedDomain === 'all' ? 'selected' : ''}>All Domains (${CURATED_WB_INDICATORS.length}+ Curated)</option>
                <option value="economy" ${this.selectedDomain === 'economy' ? 'selected' : ''}>Economy & Trade</option>
                <option value="environment" ${this.selectedDomain === 'environment' ? 'selected' : ''}>Climate & Environment</option>
                <option value="health" ${this.selectedDomain === 'health' ? 'selected' : ''}>Health & Wellbeing</option>
                <option value="education" ${this.selectedDomain === 'education' ? 'selected' : ''}>Education & Human Capital</option>
                <option value="technology" ${this.selectedDomain === 'technology' ? 'selected' : ''}>Technology & Innovation</option>
                <option value="governance" ${this.selectedDomain === 'governance' ? 'selected' : ''}>Governance & Society</option>
                <option value="demographics" ${this.selectedDomain === 'demographics' ? 'selected' : ''}>Demographics</option>
                <option value="food" ${this.selectedDomain === 'food' ? 'selected' : ''}>Agriculture & Food</option>
              </select>
            </div>

            <!-- Custom Code Quick-Fetch Bar -->
            <div class="flex items-center gap-2 pt-1 text-[11px] font-mono text-muted">
              <span>Direct WB Code:</span>
              <input
                type="text"
                id="wb-direct-code-input"
                placeholder="e.g. SP.DYN.LE00.IN"
                class="px-2 py-1 bg-paper border border-line rounded text-xs text-ink w-40 uppercase"
              />
              <button id="wb-direct-fetch-btn" class="px-3 py-1 bg-ink text-white hover:bg-moss rounded font-semibold text-xs transition">
                Fetch & Add ?
              </button>
              ${this.isLiveSearching ? '<span class="text-moss animate-pulse">Searching World Bank API?</span>' : ''}
            </div>

            ${this.errorMessage ? `
              <div class="p-2.5 bg-clay/10 border border-clay/30 rounded-lg text-xs font-mono text-clay">
                ${this.errorMessage}
              </div>
            ` : ''}
          </div>

          <!-- Search Results List -->
          <div class="p-4 overflow-y-auto flex-1 space-y-2.5 bg-paper/30">
            <div class="flex justify-between items-center text-[11px] font-mono text-muted mb-1 px-1">
              <span>Found <b>${combinedResults.length}</b> indicators matching query</span>
              <span>100% Client-Side Direct World Bank Ingestion</span>
            </div>

            ${combinedResults.length === 0 ? `
              <div class="text-center py-12 text-muted font-mono text-xs">
                ${this.isLiveSearching ? 'Searching live World Bank API repository...' : `No matching indicators found for "${this.searchQuery}". Try searching general terms or enter an indicator ID.`}
              </div>
            ` : ''}

            ${combinedResults.map(item => {
              const dom = DOMAINS[item.domain] || { label: 'General', color: '#2E6B57' };
              const isLoading = this.loadingIndicatorId === item.id;
              const isImported = this.importSuccessId === item.id || (INDICATORS[item.id] && INDICATORS[item.id].isExternal);

              return `
                <div class="p-4 bg-card border border-line rounded-xl shadow-xs hover:border-moss/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2 mb-1">
                      <span class="w-2.5 h-2.5 rounded-full" style="background:${dom.color}"></span>
                      <span class="font-mono text-[10.5px] font-bold text-ink2 bg-paper px-1.5 py-0.5 rounded border border-line">${item.id}</span>
                      <span class="text-[10px] font-mono text-muted uppercase tracking-wider">${dom.label}</span>
                      ${item.isLiveApiResult ? '<span class="text-[9.5px] font-mono text-moss bg-moss/10 px-1.5 py-0.2 rounded border border-moss/20">LIVE API RESULT</span>' : ''}
                    </div>

                    <h4 class="font-serif font-bold text-base text-ink mb-1">${item.name}</h4>
                    <p class="text-xs text-muted font-sans line-clamp-2">${item.desc || item.name}</p>
                    
                    <div class="flex items-center gap-4 mt-2 text-[10.5px] font-mono text-muted">
                      <span>Source: <b class="text-ink">${item.source}</b></span>
                      <span>Unit: <b class="text-ink">${item.unit}</b></span>
                      <span>Polarity: <b class="text-ink">${item.polarity === -1 ? 'Lower is Better' : 'Higher is Better'}</b></span>
                    </div>
                  </div>

                  <!-- Import Action Button -->
                  <div class="shrink-0 pt-2 sm:pt-0">
                    <button
                      type="button"
                      class="wb-import-btn w-full sm:w-auto px-4 py-2.5 rounded-xl font-mono text-xs font-semibold shadow-xs transition flex items-center justify-center gap-2 ${
                        isLoading
                          ? 'bg-paper border border-line text-muted cursor-wait'
                          : isImported
                          ? 'bg-moss/10 border border-moss text-moss hover:bg-moss hover:text-white'
                          : 'bg-ink text-white hover:bg-moss'
                      }"
                      data-id="${item.id}"
                      data-name="${encodeURIComponent(item.name)}"
                      data-domain="${item.domain}"
                      data-unit="${item.unit}"
                      data-polarity="${item.polarity}"
                      ${isLoading ? 'disabled' : ''}
                    >
                      ${isLoading ? `
                        <span class="inline-block w-3 h-3 border-2 border-muted border-t-transparent rounded-full animate-spin"></span>
                        Fetching 180+ Countries...
                      ` : isImported ? `
                        ? Imported (Add Again)
                      ` : `
                        + Import & Add to Model
                      `}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Modal Footer -->
          <div class="p-4 border-t border-line bg-paper/60 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs font-mono text-muted">
            <div>Harmonizes 5-year observation windows (`mrv=5`) across 183 sovereign nations.</div>
            <div class="text-ink font-semibold">Ready to test in Index Builder</div>
          </div>

        </div>
      </div>
    `;

    this.attachEventListeners(container);
  }

  attachEventListeners(container) {
    const closeBtn = container.querySelector('#wb-drawer-close-btn');
    if (closeBtn) closeBtn.onclick = () => this.close();

    const backdrop = container.querySelector('#wb-drawer-backdrop');
    if (backdrop) {
      backdrop.onclick = e => {
        if (e.target === backdrop) this.close();
      };
    }

    const searchInput = container.querySelector('#wb-drawer-search-input');
    if (searchInput) {
      searchInput.oninput = e => this.handleSearchInput(e.target.value);
    }

    const clearBtn = container.querySelector('#wb-search-clear-btn');
    if (clearBtn) {
      clearBtn.onclick = () => {
        this.searchQuery = '';
        this.liveSearchResults = [];
        this.render();
      };
    }

    const domainSelect = container.querySelector('#wb-drawer-domain-select');
    if (domainSelect) {
      domainSelect.onchange = e => {
        this.selectedDomain = e.target.value;
        this.render();
      };
    }

    // Preset chips
    container.querySelectorAll('.wb-preset-chip').forEach(btn => {
      btn.onclick = () => {
        const indId = btn.dataset.id;
        const indDef = CURATED_WB_INDICATORS.find(i => i.id === indId);
        if (indDef) {
          this.executeImport(indId, {
            name: indDef.name,
            domain: indDef.domain,
            unit: indDef.unit,
            polarity: indDef.polarity
          });
        }
      };
    });

    // Direct code input
    const directFetchBtn = container.querySelector('#wb-direct-fetch-btn');
    const directCodeInput = container.querySelector('#wb-direct-code-input');
    if (directFetchBtn && directCodeInput) {
      directFetchBtn.onclick = () => {
        const code = directCodeInput.value.trim().toUpperCase();
        if (code) {
          this.executeImport(code, { name: code });
        }
      };
      directCodeInput.onkeydown = e => {
        if (e.key === 'Enter') directFetchBtn.click();
      };
    }

    // Import buttons
    container.querySelectorAll('.wb-import-btn').forEach(btn => {
      btn.onclick = () => {
        const indId = btn.dataset.id;
        const name = decodeURIComponent(btn.dataset.name);
        const domain = btn.dataset.domain;
        const unit = btn.dataset.unit;
        const polarity = parseInt(btn.dataset.polarity, 10) || 1;

        this.executeImport(indId, { name, domain, unit, polarity });
      };
    });
  }

  handleSearchInput(query) {
    this.searchQuery = query;
    clearTimeout(this.debounceTimer);

    // Live search debouncing (350ms)
    this.debounceTimer = setTimeout(async () => {
      if (this.searchQuery.trim().length >= 3) {
        this.isLiveSearching = true;
        this.render();
        const liveResults = await searchLiveWorldBankApi(this.searchQuery);
        this.liveSearchResults = liveResults;
        this.isLiveSearching = false;
        this.render();
      } else {
        this.liveSearchResults = [];
        this.render();
      }
    }, 350);
  }

  async executeImport(indicatorId, metaOverride = {}) {
    this.loadingIndicatorId = indicatorId;
    this.errorMessage = null;
    this.render();

    try {
      const importedData = await fetchWorldBankIndicatorData(indicatorId, metaOverride);

      // Register into global INDICATORS dictionary
      INDICATORS[importedData.id] = importedData;

      this.loadingIndicatorId = null;
      this.importSuccessId = indicatorId;
      this.render();

      // Trigger app callback
      if (this.onIndicatorImported) {
        this.onIndicatorImported(importedData);
      }

      // Auto-close after 600ms on success so user sees immediate results in the builder
      setTimeout(() => {
        this.close();
      }, 500);

    } catch (err) {
      console.error('[WorldBankDrawer] Failed to import indicator:', err);
      this.loadingIndicatorId = null;
      this.errorMessage = `Failed to fetch "${indicatorId}" from World Bank API: ${err.message}`;
      this.render();
    }
  }
}