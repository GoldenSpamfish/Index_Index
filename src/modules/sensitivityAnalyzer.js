// Sensitivity & Methodological Rigor Suite Module
import {
  computeVarianceDecomposition,
  computeLeaveOneOut,
  computeAddOneInDeltas
} from '../engine/stats.js';
import { renderChoroplethMap } from './mapEngine.js';

export class SensitivityAnalyzerModule {
  constructor(options = {}) {
    this.containerId = options.containerId || 'sensitivity-analyzer-container';
    this.subIndicators = options.subIndicators || []; // [{ id, name, short, weight, data }]
    this.compositeScores = options.compositeScores || {};
    this.formula = options.formula || 'arithmetic';
    this.selectedIndicatorForMap = null;
  }

  setData(subIndicators, compositeScores, formula = 'arithmetic') {
    this.subIndicators = subIndicators;
    this.compositeScores = compositeScores;
    this.formula = formula;
    if (!this.selectedIndicatorForMap && subIndicators.length > 0) {
      this.selectedIndicatorForMap = subIndicators[0].id;
    }
    this.render();
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    if (!this.subIndicators || this.subIndicators.length < 2) {
      container.innerHTML = `
        <div class="p-6 bg-card border border-line rounded-xl text-center text-xs font-mono text-muted">
          Add at least 2 indicators in the Index Builder to perform sensitivity and leave-one-out robustness analysis.
        </div>
      `;
      return;
    }

    const varianceContributions = computeVarianceDecomposition(this.subIndicators, this.compositeScores);
    const looResults = computeLeaveOneOut(this.subIndicators, this.formula);

    // Selected indicator for map
    if (!this.selectedIndicatorForMap && this.subIndicators.length > 0) {
      this.selectedIndicatorForMap = this.subIndicators[0].id;
    }

    const targetInd = this.subIndicators.find(i => i.id === this.selectedIndicatorForMap) || this.subIndicators[0];
    const addOneInDeltas = computeAddOneInDeltas(this.subIndicators, targetInd.id, this.formula);

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Variance Contribution & LOO Overview Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Variance Contribution -->
          <div class="p-4 bg-card border border-line rounded-xl shadow-xs">
            <div class="mb-3">
              <h4 class="font-serif font-semibold text-base text-ink">Variance Contribution</h4>
              <p class="text-xs text-muted font-sans">
                Share of the composite's variance attributable to each indicator. Equal weights do not guarantee equal real-world influence.
              </p>
            </div>

            <div class="space-y-3 mt-4">
              ${varianceContributions.map(vc => `
                <div>
                  <div class="flex justify-between text-xs font-mono mb-1">
                    <span class="font-semibold text-ink">${vc.name}</span>
                    <span class="text-moss font-bold">${vc.variancePct}%</span>
                  </div>
                  <div class="w-full h-2.5 bg-paper rounded-full overflow-hidden border border-line">
                    <div class="h-full bg-moss rounded-full transition-all" style="width:${vc.variancePct}%"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Leave-One-Out (LOO) Summary -->
          <div class="p-4 bg-card border border-line rounded-xl shadow-xs">
            <div class="mb-3">
              <h4 class="font-serif font-semibold text-base text-ink">Leave-One-Out (LOO) Rank Drift</h4>
              <p class="text-xs text-muted font-sans">
                Rank correlation (Spearman ρ) when dropping each indicator. Lower ρ indicates an indispensable, load-bearing metric.
              </p>
            </div>

            <div class="overflow-x-auto mt-4">
              <table class="w-full text-xs font-mono border-collapse">
                <thead>
                  <tr class="border-b border-line text-muted uppercase text-[10px]">
                    <th class="p-2 text-left">Indicator</th>
                    <th class="p-2 text-right">Spearman ρ</th>
                    <th class="p-2 text-right">Mean Rank Shift</th>
                    <th class="p-2 text-right">Max Rank Shift</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-line/60">
                  ${looResults.map(r => `
                    <tr class="hover:bg-paper">
                      <td class="p-2 font-semibold text-ink">${r.name}</td>
                      <td class="p-2 text-right font-bold ${r.rho < 0.85 ? 'text-clay' : 'text-slate'}">${r.rho.toFixed(3)}</td>
                      <td class="p-2 text-right text-ink2">${r.meanRankDelta} places</td>
                      <td class="p-2 text-right text-ink2 font-bold">${r.maxRankDelta}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Add-One-In Spatial Impact Map -->
        <div class="p-4 bg-card border border-line rounded-xl shadow-xs">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h4 class="font-serif font-semibold text-base text-ink">
                Spatial Impact: Which Countries Benefit from "${targetInd.name}"
              </h4>
              <p class="text-xs text-muted font-sans">
                Change in national rank when this indicator is added to the index. <span class="text-slate font-bold">Blue</span> = country gains rank; <span class="text-clay font-bold">Red</span> = country loses rank.
              </p>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <span class="text-xs font-mono text-muted uppercase">Indicator:</span>
              <select id="loo-sel-indicator" class="p-1.5 bg-paper border border-line rounded-lg text-xs font-mono text-ink">
                ${this.subIndicators.map(ind => `<option value="${ind.id}" ${this.selectedIndicatorForMap === ind.id ? 'selected' : ''}>${ind.name}</option>`).join('')}
              </select>
            </div>
          </div>

          <div id="loo-spatial-map" class="w-full h-auto"></div>
        </div>
      </div>
    `;

    this.renderSpatialMap(addOneInDeltas, targetInd);
    this.attachEventListeners(container);
  }

  renderSpatialMap(deltas, targetInd) {
    const mapContainer = document.getElementById('loo-spatial-map');
    if (!mapContainer) return;

    // Symmetric domain for rank deltas, e.g. -40 to +40
    const deltaVals = Object.values(deltas);
    const maxAbs = Math.max(10, Math.min(60, Math.max(...deltaVals.map(Math.abs))));

    renderChoroplethMap('loo-spatial-map', deltas, {
      palette: 'diverging_rb',
      minVal: -maxAbs,
      maxVal: maxAbs,
      label: `Δ Rank with ${targetInd.short} (+ Helps / - Penalizes)`
    });
  }

  attachEventListeners(container) {
    const sel = container.querySelector('#loo-sel-indicator');
    if (sel) {
      sel.onchange = e => {
        this.selectedIndicatorForMap = e.target.value;
        this.render();
      };
    }
  }
}
