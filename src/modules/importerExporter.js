// Custom Dataset Importer, Exporter, and URL Shareability Module with Full Custom Naming
import { COUNTRIES, COUNTRY_MAP } from '../data/countries.js';
import { calculateRankings } from '../engine/stats.js';

export class ImporterExporterModule {
  constructor(options = {}) {
    this.containerId = options.containerId || 'data-studio-container';
    this.onImport = options.onImport || (() => {});
    this.onOpenWorldBankDrawer = options.onOpenWorldBankDrawer || (() => {});
    this.getCurrentIndexState = options.getCurrentIndexState || (() => ({}));
  }

  /**
   * Serializes current state to a compact shareable URL hash.
   */
  encodeStateToUrl(state) {
    try {
      const payload = {
        name: state.name || 'Custom Index',
        desc: state.desc || '',
        ind: (state.indicators || []).map(i => ({
          i: i.id,
          w: i.weight,
          t: i.transform !== 'linear' ? i.transform : undefined,
          p: i.polarity !== 1 ? i.polarity : undefined,
          cmin: i.clipMin !== null && i.clipMin !== undefined ? i.clipMin : undefined,
          cmax: i.clipMax !== null && i.clipMax !== undefined ? i.clipMax : undefined
        })),
        f: state.formula,
        n: state.normalization,
        b: state.bundleId
      };
      const jsonStr = JSON.stringify(payload);
      const encoded = btoa(encodeURIComponent(jsonStr));
      return `${window.location.origin}${window.location.pathname}#config=${encoded}`;
    } catch (e) {
      console.error('Failed to encode URL state', e);
      return window.location.href;
    }
  }

  /**
   * Decodes state from URL hash.
   */
  decodeStateFromUrl() {
    try {
      const hash = window.location.hash;
      if (!hash.includes('config=')) return null;

      const encoded = hash.split('config=')[1];
      const jsonStr = decodeURIComponent(atob(encoded));
      const parsed = JSON.parse(jsonStr);

      return {
        name: parsed.name || 'Custom Index',
        desc: parsed.desc || '',
        indicators: (parsed.ind || []).map(item => ({
          id: item.i,
          weight: item.w,
          transform: item.t || 'linear',
          polarity: item.p !== undefined ? item.p : 1,
          clipMin: item.cmin !== undefined ? item.cmin : null,
          clipMax: item.cmax !== undefined ? item.cmax : null,
          locked: false
        })),
        formula: parsed.f || 'arithmetic',
        normalization: parsed.n || 'minmax',
        bundleId: parsed.b || null
      };
    } catch (e) {
      console.error('Failed to decode URL state', e);
      return null;
    }
  }

  /**
   * Exports data as CSV.
   */
  exportToCsv(compositeScores, subIndicators, customName = 'Custom_Index') {
    const ranks = calculateRankings(compositeScores);
    const isos = Object.keys(compositeScores).sort((a, b) => (ranks[a] || 999) - (ranks[b] || 999));

    let csvContent = `Rank,ISO3,Country,"${customName.replace(/"/g, '""')} Score"`;
    subIndicators.forEach(ind => {
      csvContent += `,"${ind.name.replace(/"/g, '""')} (${ind.weight}%)"`;
    });
    csvContent += '\n';

    isos.forEach(iso => {
      const country = COUNTRY_MAP[iso] || { name: iso };
      const rank = ranks[iso] || '';
      const score = compositeScores[iso] || '';

      csvContent += `${rank},${iso},"${country.name.replace(/"/g, '""')}",${score}`;
      subIndicators.forEach(ind => {
        const val = ind.data[iso] !== undefined ? ind.data[iso] : '';
        csvContent += `,${val}`;
      });
      csvContent += '\n';
    });

    const safeFilename = `${customName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_scores.csv`;
    this.downloadFile(safeFilename, csvContent, 'text/csv;charset=utf-8;');
  }

  /**
   * Exports data as JSON.
   */
  exportToJson(compositeScores, subIndicators, metadata) {
    const ranks = calculateRankings(compositeScores);
    const exportData = {
      meta: {
        indexName: metadata.name || 'Custom Index',
        description: metadata.desc || '',
        exportedAt: new Date().toISOString(),
        formula: metadata.formula,
        normalization: metadata.normalization,
        subIndicators: subIndicators.map(i => ({
          id: i.id,
          name: i.name,
          weight: i.weight,
          transform: i.normOptions?.transform || 'linear',
          polarity: i.normOptions?.polarity || 1
        }))
      },
      scores: Object.entries(compositeScores).map(([iso, score]) => ({
        iso,
        country: COUNTRY_MAP[iso]?.name || iso,
        rank: ranks[iso],
        score
      }))
    };

    const safeFilename = `${(metadata.name || 'custom_index').toLowerCase().replace(/[^a-z0-9]+/g, '_')}_data.json`;
    this.downloadFile(safeFilename, JSON.stringify(exportData, null, 2), 'application/json');
  }

  downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Parses user-uploaded CSV file.
   */
  parseUserCsv(csvText) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) throw new Error('CSV must contain a header row and data rows.');

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    if (headers.length < 2) throw new Error('CSV must contain at least 2 columns (e.g. Country, Value).');

    // Find country column index (ISO3 or name)
    let countryColIdx = headers.findIndex(h => /iso|country|nation|code/i.test(h));
    if (countryColIdx === -1) countryColIdx = 0; // Default first column

    const valueColIdx = countryColIdx === 0 ? 1 : 0;
    const indicatorName = headers[valueColIdx] || 'Custom Dataset';

    const dataMap = {};

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (row.length <= Math.max(countryColIdx, valueColIdx)) continue;

      const rawCountry = row[countryColIdx];
      const rawVal = parseFloat(row[valueColIdx]);

      if (isNaN(rawVal)) continue;

      let matchedIso = null;
      if (COUNTRY_MAP[rawCountry.toUpperCase()]) {
        matchedIso = rawCountry.toUpperCase();
      } else {
        const found = COUNTRIES.find(c => c.name.toLowerCase() === rawCountry.toLowerCase());
        if (found) matchedIso = found.iso3;
      }

      if (matchedIso) {
        dataMap[matchedIso] = rawVal;
      }
    }

    if (Object.keys(dataMap).length === 0) {
      throw new Error('Could not match any valid country names or ISO3 codes in the CSV.');
    }

    return {
      name: indicatorName,
      data: dataMap,
      count: Object.keys(dataMap).length
    };
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const state = this.getCurrentIndexState();
    const activeName = state.name || 'Custom Composite Index';

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Live World Bank Open Data Explorer Card -->
        <div class="p-6 bg-card border border-line rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-moss/15 text-moss border border-moss/30">DIRECT API INGESTION</span>
              <span class="text-xs font-mono text-muted">29,500+ Development Datasets</span>
            </div>
            <h3 class="font-serif font-semibold text-lg text-ink">Explore World Bank & Global Open Data</h3>
            <p class="text-xs text-muted font-sans max-w-xl">
              Search and stream live indicators across health, energy, trade, demographics, and technology without uploading files.
            </p>
          </div>
          <button type="button" id="btn-open-wb-drawer-studio" class="px-5 py-3 rounded-xl bg-ink text-white hover:bg-moss font-mono text-xs font-semibold shadow-xs transition shrink-0">
            Open World Bank Catalog →
          </button>
        </div>

        <!-- Import Custom Data -->
        <div class="p-6 bg-card border border-line rounded-xl shadow-xs">
          <div class="mb-4">
            <h3 class="font-serif font-semibold text-lg text-ink">Import Custom Indicator Data from File</h3>
            <p class="text-xs text-muted font-sans">
              Drag and drop any CSV or JSON file containing country-level data (with ISO3 codes or country names). It will be immediately added to the catalog.
            </p>
          </div>

          <div id="drop-zone" class="border-2 border-dashed border-line hover:border-moss rounded-xl p-8 text-center cursor-pointer transition-all bg-paper/60 hover:bg-paper">
            <div class="mx-auto w-12 h-12 rounded-full bg-moss/10 flex items-center justify-center text-moss mb-3">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
            </div>
            <p class="font-sans text-sm font-semibold text-ink mb-1">Click to browse or drop CSV / JSON file here</p>
            <p class="font-mono text-xs text-muted">Format: <span class="bg-card px-1.5 py-0.5 rounded border border-line">ISO3, Value</span> or <span class="bg-card px-1.5 py-0.5 rounded border border-line">CountryName, Score</span></p>
            <input type="file" id="file-input" accept=".csv,.json,.txt" class="hidden"/>
          </div>

          <div id="import-status" class="mt-3 text-xs font-mono hidden"></div>
        </div>

        <!-- Export & 1-Click Sharing -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Export Data -->
          <div class="p-6 bg-card border border-line rounded-xl shadow-xs flex flex-col justify-between">
            <div>
              <h3 class="font-serif font-semibold text-lg text-ink mb-1">Export "${activeName}"</h3>
              <p class="text-xs text-muted font-sans mb-4">
                Download your composite rankings, calculated scores, and underlying sub-indicators.
              </p>
            </div>
            <div class="flex gap-3">
              <button type="button" id="btn-export-csv" class="flex-1 py-2.5 px-4 rounded-lg bg-paper border border-line hover:bg-card hover:border-moss text-xs font-mono font-semibold text-ink transition">
                Export CSV
              </button>
              <button type="button" id="btn-export-json" class="flex-1 py-2.5 px-4 rounded-lg bg-paper border border-line hover:bg-card hover:border-moss text-xs font-mono font-semibold text-ink transition">
                Export JSON
              </button>
            </div>
          </div>

          <!-- 1-Click URL Share -->
          <div class="p-6 bg-card border border-line rounded-xl shadow-xs flex flex-col justify-between">
            <div>
              <h3 class="font-serif font-semibold text-lg text-ink mb-1">Shareable Index URL</h3>
              <p class="text-xs text-muted font-sans mb-4">
                Your entire index configuration (name, weights, math, and clipping) is serialized into a permanent link.
              </p>
            </div>
            <div>
              <div class="flex gap-2">
                <input type="text" id="share-url-input" readonly class="flex-1 p-2 bg-paper border border-line rounded-lg font-mono text-xs text-muted"/>
                <button type="button" id="btn-copy-url" class="py-2 px-4 rounded-lg bg-ink text-white hover:bg-moss text-xs font-mono font-semibold transition shrink-0">
                  Copy Link
                </button>
              </div>
              <span id="copy-status" class="text-[11px] font-mono text-moss mt-1.5 block h-4"></span>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners(container);
  }

  attachEventListeners(container) {
    const btnWb = container.querySelector('#btn-open-wb-drawer-studio');
    if (btnWb) {
      btnWb.onclick = () => this.onOpenWorldBankDrawer();
    }

    const dropZone = container.querySelector('#drop-zone');
    const fileInput = container.querySelector('#file-input');
    const statusEl = container.querySelector('#import-status');

    if (dropZone && fileInput) {
      dropZone.onclick = () => fileInput.click();

      dropZone.ondragover = e => {
        e.preventDefault();
        dropZone.classList.add('border-moss', 'bg-moss/5');
      };

      dropZone.ondragleave = () => {
        dropZone.classList.remove('border-moss', 'bg-moss/5');
      };

      dropZone.ondrop = e => {
        e.preventDefault();
        dropZone.classList.remove('border-moss', 'bg-moss/5');
        if (e.dataTransfer.files.length) {
          this.handleFile(e.dataTransfer.files[0], statusEl);
        }
      };

      fileInput.onchange = e => {
        if (e.target.files.length) {
          this.handleFile(e.target.files[0], statusEl);
        }
      };
    }

    // Export buttons
    const exportCsvBtn = container.querySelector('#btn-export-csv');
    const exportJsonBtn = container.querySelector('#btn-export-json');

    if (exportCsvBtn) {
      exportCsvBtn.onclick = () => {
        const state = this.getCurrentIndexState();
        if (window.APP_SCORES && window.APP_SUB_INDICATORS) {
          this.exportToCsv(window.APP_SCORES, window.APP_SUB_INDICATORS, state.name || 'Custom_Index');
        }
      };
    }

    if (exportJsonBtn) {
      exportJsonBtn.onclick = () => {
        const state = this.getCurrentIndexState();
        if (window.APP_SCORES && window.APP_SUB_INDICATORS) {
          this.exportToJson(window.APP_SCORES, window.APP_SUB_INDICATORS, state);
        }
      };
    }

    // Share link
    const shareInput = container.querySelector('#share-url-input');
    const copyBtn = container.querySelector('#btn-copy-url');
    const copyStatus = container.querySelector('#copy-status');

    if (shareInput) {
      const state = this.getCurrentIndexState();
      shareInput.value = this.encodeStateToUrl(state);
    }

    if (copyBtn && shareInput) {
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(shareInput.value).then(() => {
          if (copyStatus) copyStatus.textContent = '✓ Link copied to clipboard!';
          setTimeout(() => {
            if (copyStatus) copyStatus.textContent = '';
          }, 3000);
        });
      };
    }
  }

  handleFile(file, statusEl) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const text = e.target.result;
        let parsed = null;

        if (file.name.endsWith('.json')) {
          const json = JSON.parse(text);
          parsed = {
            name: json.name || file.name.replace('.json', ''),
            data: json.data || json,
            count: Object.keys(json.data || json).length
          };
        } else {
          parsed = this.parseUserCsv(text);
        }

        if (statusEl) {
          statusEl.className = 'mt-3 text-xs font-mono text-moss p-2.5 bg-moss/10 rounded-lg border border-moss/30 block';
          statusEl.textContent = `✓ Successfully imported "${parsed.name}" with ${parsed.count} matched countries.`;
        }

        this.onImport(parsed);
      } catch (err) {
        if (statusEl) {
          statusEl.className = 'mt-3 text-xs font-mono text-clay p-2.5 bg-clay/10 rounded-lg border border-clay/30 block';
          statusEl.textContent = `✗ Error: ${err.message}`;
        }
      }
    };
    reader.readAsText(file);
  }
}
