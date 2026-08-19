// Bivariate Quadrant & Matrix Analysis Module with Interactive 2D Map
import { INDICATORS, INDICATOR_LIST } from '../data/indicators.js';
import { getCountry } from '../data/countries.js';
import { normalizeIndicator } from '../engine/stats.js';
import { renderBivariateChoroplethMap } from './mapEngine.js';

export class BivariateQuadrantModule {
  constructor(options = {}) {
    this.containerId = options.containerId || 'bivariate-quadrant-container';
    this.customIndexData = options.customIndexData || {};
    this.customIndexName = options.customIndexName || 'Custom Index';

    this.selectedX = 'hdi';
    this.selectedY = 'custom';
    this.selectedCell = null; // [row, col] or null
  }

  setCustomIndexData(data, name = 'Custom Index') {
    this.customIndexData = data;
    this.customIndexName = name;
    this.render();
  }

  getDataset(id) {
    if (id === 'custom') {
      return {
        id: 'custom',
        name: this.customIndexName,
        short: 'Custom Index',
        data: this.customIndexData,
        polarity: 1
      };
    }
    return INDICATORS[id] || null;
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const allMetrics = [
      { id: 'custom', name: `★ ${this.customIndexName}`, short: 'Custom' },
      ...INDICATOR_LIST.map(ind => ({ id: ind.id, name: ind.name, short: ind.short }))
    ];

    const dataXObj = this.getDataset(this.selectedX);
    const dataYObj = this.getDataset(this.selectedY);

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

        // Color coding for matrix cells
        let tint = 'rgba(46, 107, 87, 0.1)';
        if (r === 3 && c === 3) tint = 'rgba(184, 135, 59, 0.4)'; // Aspirational top-right
        else if (r >= 2 && c >= 2) tint = 'rgba(46, 107, 87, 0.35)';
        else if (r <= 1 && c >= 2) tint = 'rgba(53, 97, 127, 0.35)';
        else if (r >= 2 && c <= 1) tint = 'rgba(87, 185, 138, 0.35)';
        else tint = 'rgba(176, 74, 50, 0.25)';

        matrixHtml += `
          <button type="button" class="matrix-cell flex flex-col items-center justify-center rounded-lg border transition-all cursor-pointer p-1 ${
            isSelected ? 'ring-2 ring-ink border-ink font-bold scale-105 z-10' : 'border-line/60 hover:scale-102'
          }" style="background:${tint}" data-row="${r}" data-col="${c}" title="${tiers[r]} Y × ${tiers[c]} X: ${count} countries">
            <span class="font-mono text-sm font-bold text-ink">${count}</span>
            <span class="text-[8.5px] font-mono text-muted uppercase">${tiers[r][0]}×${tiers[c][0]}</span>
          </button>
        `;
      }
    }
    matrixHtml += `</div>`;

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Controls -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-card border border-line rounded-xl text-xs font-mono">
          <div>
            <label class="block text-muted uppercase tracking-wider mb-1 font-semibold">Vertical Axis Index (Y)</label>
            <select id="biv-sel-y" class="w-full p-2 bg-paper border border-line rounded-lg text-ink font-mono text-xs">
              ${allMetrics.map(m => `<option value="${m.id}" ${this.selectedY === m.id ? 'selected' : ''}>${m.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-muted uppercase tracking-wider mb-1 font-semibold">Horizontal Axis Index (X)</label>
            <select id="biv-sel-x" class="w-full p-2 bg-paper border border-line rounded-lg text-ink font-mono text-xs">
              ${allMetrics.map(m => `<option value="${m.id}" ${this.selectedX === m.id ? 'selected' : ''}>${m.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- 3-Way Integrated Layout: 4x4 Grid (3 cols) + Bivariate Map (6 cols) + Country Roster (3 cols) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          <!-- 4x4 Grid Matrix (3 Cols) -->
          <div class="lg:col-span-3 p-4 bg-card border border-line rounded-xl flex flex-col justify-between h-full">
            <div class="text-center mb-2">
              <span class="font-mono text-xs font-semibold text-ink">${dataYObj?.short || 'Y'} ↑</span>
              <span class="text-[11px] text-muted block">vs. ${dataXObj?.short || 'X'} →</span>
            </div>

            ${matrixHtml}

            <div class="mt-3 flex items-center justify-between text-[10.5px] font-mono text-muted">
              <span>Click cell to spotlight</span>
              ${this.selectedCell ? '<button type="button" id="btn-clear-quad" class="px-2 py-0.5 bg-paper border border-line rounded hover:bg-card text-ink text-[10px]">Clear</button>' : ''}
            </div>
          </div>

          <!-- Bivariate Choropleth Map (6 Cols) -->
          <div class="lg:col-span-6 p-4 bg-card border border-line rounded-xl shadow-xs">
            <div class="flex items-center justify-between mb-2">
              <span class="font-mono text-xs font-semibold text-ink flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-slate"></span>
                Bivariate Global Map Spotlight
              </span>
              <span class="font-mono text-[10.5px] text-muted">
                ${this.selectedCell ? `<b class="text-moss">${displayedCountries.length}</b> countries in batch` : 'Showing all 16 tier batches'}
              </span>
            </div>
            <div id="bivariate-map-container" class="w-full h-auto bg-paper border border-line rounded-lg overflow-hidden"></div>
          </div>

          <!-- Country List (3 Cols) -->
          <div class="lg:col-span-3 p-4 bg-card border border-line rounded-xl h-full">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-serif font-semibold text-xs text-ink truncate">
                ${this.selectedCell ? `${tiers[this.selectedCell[0]]} Y × ${tiers[this.selectedCell[1]]} X` : 'All Countries'}
              </h4>
              <span class="text-[10px] font-mono text-muted shrink-0">${displayedCountries.length} cties</span>
            </div>

            <div class="max-h-[320px] overflow-y-auto border border-line rounded-lg divide-y divide-line/60 text-xs">
              ${displayedCountries.map(c => `
                <div class="p-1.5 px-2 flex items-center justify-between hover:bg-paper">
                  <span class="font-semibold text-ink font-sans truncate">${c.name}</span>
                  <div class="font-mono text-[10px] text-right shrink-0">
                    <span class="text-moss font-bold">${c.scoreY.toFixed(0)}</span>
                    <span class="text-muted">/</span>
                    <span class="text-slate font-bold">${c.scoreX.toFixed(0)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    // Render Bivariate Map
    renderBivariateChoroplethMap('bivariate-map-container', normX, normY, this.selectedCell, {
      nameX: dataXObj?.name,
      nameY: dataYObj?.name
    });

    this.attachEventListeners(container);
  }

  attachEventListeners(container) {
    const selX = container.querySelector('#biv-sel-x');
    if (selX) {
      selX.onchange = e => {
        this.selectedX = e.target.value;
        this.selectedCell = null;
        this.render();
      };
    }

    const selY = container.querySelector('#biv-sel-y');
    if (selY) {
      selY.onchange = e => {
        this.selectedY = e.target.value;
        this.selectedCell = null;
        this.render();
      };
    }

    const clearBtn = container.querySelector('#btn-clear-quad');
    if (clearBtn) {
      clearBtn.onclick = () => {
        this.selectedCell = null;
        this.render();
      };
    }

    container.querySelectorAll('.matrix-cell').forEach(cell => {
      cell.onclick = () => {
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        if (this.selectedCell && this.selectedCell[0] === r && this.selectedCell[1] === c) {
          this.selectedCell = null;
        } else {
          this.selectedCell = [r, c];
        }
        this.render();
      };
    });
  }
}
