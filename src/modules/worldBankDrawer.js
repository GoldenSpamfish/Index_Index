// World Bank Indicator Catalog Modal Drawer Module
import {
  CURATED_WB_INDICATORS,
  searchCuratedWorldBankCatalog,
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
  }

  init() {
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.containerId;
      document.body.appendChild(container);
    }
  }

  open(initialQuery = '') {
    this.isOpen = true;
    this.searchQuery = initialQuery;
    this.errorMessage = null;
    this.importSuccessId = null;
    this.renderModal();

    setTimeout(() => {
      const searchInput = document.getElementById('wb-drawer-search-input');
      if (searchInput) {
        searchInput.focus();
        if (initialQuery) {
          searchInput.value = initialQuery;
          this.handleSearchInput(initialQuery);
        }
      }
    }, 50);
  }

  close() {
    this.isOpen = false;
    const container = document.getElementById(this.containerId);
    if (container) container.innerHTML = '';
  }

  renderModal() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = `
      <div id="wb-drawer-backdrop" class="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 transition-all duration-200">
        <div class="bg-card border border-line rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          <!-- Modal Header -->
          <div class="px-5 py-4 border-b border-line bg-paper/60 flex items-center justify-between gap-4">
            <div>
              <h3 class="font-serif font-bold text-xl text-ink">World Bank Indicator Catalog</h3>
              <p class="text-xs text-muted font-sans mt-0.5">Search and import indicators into the active composite index.</p>
            </div>
            <button id="wb-drawer-close-btn" class="p-2 text-muted hover:text-ink rounded-lg hover:bg-card transition font-mono text-xs border border-transparent hover:border-line flex items-center gap-1">
              <span>?</span> Close
            </button>
          </div>

          <!-- Search & Filter Controls -->
          <div class="p-4 border-b border-line space-y-3 bg-card">
            <div class="flex flex-col sm:flex-row gap-3">
              <div class="relative flex-1">
                <input
                  type="text"
                  id="wb-drawer-search-input"
                  placeholder="Search indicators (e.g., hospital beds, solar, life expectancy, tariff, literacy, CO2)..."
                  value="${this.searchQuery}"
                  class="w-full pl-3 pr-8 py-2 bg-paper border border-line rounded-xl text-xs font-mono text-ink focus:outline-none focus:border-moss focus:ring-1 focus:ring-moss"
                />
                <button id="wb-search-clear-btn" class="absolute right-2.5 top-2.5 text-xs text-muted hover:text-ink ${this.searchQuery ? '' : 'hidden'}">?</button>
              </div>

              <!-- Domain Selector Tabs -->
              <select id="wb-drawer-domain-select" class="p-2 bg-paper border border-line rounded-xl text-xs font-mono text-ink shrink-0">
                <option value="all" ${this.selectedDomain === 'all' ? 'selected' : ''}>All Domains (${CURATED_WB_INDICATORS.length} Indicators)</option>
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
            <div class="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-[11px] font-mono text-muted">
              <div class="flex items-center gap-2">
                <span>Indicator Code:</span>
                <input
                  type="text"
                  id="wb-direct-code-input"
                  placeholder="e.g. SP.DYN.LE00.IN"
                  class="px-2 py-1 bg-paper border border-line rounded text-xs text-ink w-40 uppercase font-mono"
                />
                <button id="wb-direct-fetch-btn" class="px-3 py-1 bg-ink text-white hover:bg-moss rounded font-semibold text-xs transition">
                  Fetch Code ?
                </button>
              </div>

              <div id="wb-search-status-text" class="text-[11px] font-mono text-muted"></div>
            </div>

            <div id="wb-drawer-error-container"></div>
          </div>

          <!-- Search Results List Container -->
          <div id="wb-drawer-results-list" class="p-4 overflow-y-auto flex-1 space-y-2.5 bg-paper/30 min-h-[260px] max-h-[55vh]">
            <!-- Results items populated dynamically without replacing the input -->
          </div>

          <!-- Modal Footer -->
          <div class="px-5 py-3 border-t border-line bg-paper/60 flex justify-between items-center text-xs font-mono text-muted">
            <span id="wb-footer-count">Showing indicators</span>
            <button id="wb-footer-close-btn" class="px-3 py-1 bg-card border border-line hover:border-ink rounded text-ink text-xs font-mono transition">
              Close
            </button>
          </div>

        </div>
      </div>
    `;

    this.attachEventListeners(container);
    this.updateResultsList();
  }

  attachEventListeners(container) {
    const closeBtn = container.querySelector('#wb-drawer-close-btn');
    if (closeBtn) closeBtn.onclick = () => this.close();

    const footerCloseBtn = container.querySelector('#wb-footer-close-btn');
    if (footerCloseBtn) footerCloseBtn.onclick = () => this.close();

    const backdrop = container.querySelector('#wb-drawer-backdrop');
    if (backdrop) {
      backdrop.onclick = e => {
        if (e.target === backdrop) this.close();
      };
    }

    const searchInput = container.querySelector('#wb-drawer-search-input');
    const clearBtn = container.querySelector('#wb-search-clear-btn');

    if (searchInput) {
      searchInput.oninput = e => {
        const val = e.target.value;
        if (clearBtn) {
          if (val) clearBtn.classList.remove('hidden');
          else clearBtn.classList.add('hidden');
        }
        this.handleSearchInput(val);
      };
    }

    if (clearBtn) {
      clearBtn.onclick = () => {
        this.searchQuery = '';
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        clearBtn.classList.add('hidden');
        this.updateResultsList();
      };
    }

    const domainSelect = container.querySelector('#wb-drawer-domain-select');
    if (domainSelect) {
      domainSelect.onchange = e => {
        this.selectedDomain = e.target.value;
        this.updateResultsList();
      };
    }

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
  }

  handleSearchInput(query) {
    this.searchQuery = query;
    this.updateResultsList();
  }

  updateResultsList() {
    const resultsContainer = document.getElementById('wb-drawer-results-list');
    const footerCount = document.getElementById('wb-footer-count');
    const errorContainer = document.getElementById('wb-drawer-error-container');

    if (!resultsContainer) return;

    if (errorContainer) {
      if (this.errorMessage) {
        errorContainer.innerHTML = `
          <div class="p-2.5 bg-clay/10 border border-clay/30 rounded-lg text-xs font-mono text-clay">
            ${this.errorMessage}
          </div>
        `;
      } else {
        errorContainer.innerHTML = '';
      }
    }

    const matchedResults = searchCuratedWorldBankCatalog(this.searchQuery, this.selectedDomain);

    if (footerCount) {
      footerCount.textContent = `Found ${matchedResults.length} indicators`;
    }

    if (matchedResults.length === 0) {
      resultsContainer.innerHTML = `
        <div class="text-center py-12 text-muted font-mono text-xs">
          No matching indicators found for "${this.searchQuery}". Try a different keyword or paste an indicator code above.
        </div>
      `;
      return;
    }

    // Render top 100 results for high performance
    const displayed = matchedResults.slice(0, 100);

    resultsContainer.innerHTML = displayed.map(item => {
      const dom = DOMAINS[item.domain] || { label: 'General', color: '#2E6B57' };
      const isLoading = this.loadingIndicatorId === item.id;
      const isImported = this.importSuccessId === item.id || (INDICATORS[item.id] && INDICATORS[item.id].isExternal);

      return `
        <div class="p-3.5 bg-card border border-line rounded-xl shadow-xs hover:border-moss/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <span class="w-2.5 h-2.5 rounded-full" style="background:${dom.color}"></span>
              <span class="font-mono text-[10.5px] font-bold text-ink2 bg-paper px-1.5 py-0.5 rounded border border-line">${item.id}</span>
              <span class="text-[10px] font-mono text-muted uppercase tracking-wider">${dom.label}</span>
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
              class="wb-import-btn w-full sm:w-auto px-4 py-2 rounded-xl font-mono text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5 ${
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
                Fetching data...
              ` : isImported ? `
                ? Imported
              ` : `
                + Add to Model
              `}
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach click handlers to newly generated import buttons
    resultsContainer.querySelectorAll('.wb-import-btn').forEach(btn => {
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

  async executeImport(indicatorId, metaOverride = {}) {
    this.loadingIndicatorId = indicatorId;
    this.errorMessage = null;
    this.updateResultsList();

    try {
      const importedData = await fetchWorldBankIndicatorData(indicatorId, metaOverride);

      // Register into global INDICATORS dictionary
      INDICATORS[importedData.id] = importedData;

      this.loadingIndicatorId = null;
      this.importSuccessId = indicatorId;
      this.updateResultsList();

      // Trigger app callback
      if (this.onIndicatorImported) {
        this.onIndicatorImported(importedData);
      }

      // Close modal after brief confirmation
      setTimeout(() => {
        this.close();
      }, 400);

    } catch (err) {
      console.error('[WorldBankDrawer] Failed to import indicator:', err);
      this.loadingIndicatorId = null;
      this.errorMessage = `Failed to load "${indicatorId}": ${err.message}`;
      this.updateResultsList();
    }
  }
}