// Country & Regional Archetype Performance Anatomy Tool
import { COUNTRIES, BLOC_LABELS, getCountry } from '../data/countries.js';
import { INDICATORS, INDICATOR_LIST, DOMAINS } from '../data/indicators.js';
import { calculateRankings, normalizeIndicator } from '../engine/stats.js';

export class PerformanceAnatomyModule {
  constructor(options = {}) {
    this.containerId = options.containerId || 'performance-anatomy-container';
    this.selectedCountry = 'NOR'; // Default Norway (or can pick any country)
    this.selectedBloc = 'nordic'; // Default Nordic or 'all'
    this.viewMode = 'country'; // 'country' | 'bloc'
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Build rankings for all indicators to find relative percentiles
    const rankingsCache = {};
    const normScoresCache = {};

    INDICATOR_LIST.forEach(ind => {
      rankingsCache[ind.id] = calculateRankings(ind.data);
      normScoresCache[ind.id] = normalizeIndicator(ind.data, 'minmax', ind.polarity);
    });

    const countryObj = getCountry(this.selectedCountry);

    // Evaluate Country Strengths vs Bottlenecks
    const indPerformance = INDICATOR_LIST.map(ind => {
      const rank = rankingsCache[ind.id][this.selectedCountry] || 999;
      const score = normScoresCache[ind.id][this.selectedCountry] || 0;
      const rawVal = ind.data[this.selectedCountry];
      const totalCountries = Object.keys(rankingsCache[ind.id]).length || 180;
      const percentile = ((totalCountries - rank) / totalCountries) * 100;

      return {
        id: ind.id,
        name: ind.name,
        short: ind.short,
        domain: ind.domain,
        rank,
        score,
        rawVal,
        unit: ind.unit,
        percentile,
        totalCountries
      };
    });

    indPerformance.sort((a, b) => a.rank - b.rank);

    const signatureDrivers = indPerformance.slice(0, 5); // Top 5
    const structuralBottlenecks = [...indPerformance].reverse().slice(0, 5); // Bottom 5

    // Regional Bloc Analysis
    const blocCountries = COUNTRIES.filter(c => c.blocs.includes(this.selectedBloc));

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Header Controls -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-card border border-line rounded-xl">
          <div>
            <h3 class="font-serif font-semibold text-lg text-ink">Performance Anatomy & Archetype Diagnostic</h3>
            <p class="text-xs text-muted font-sans">Investigate why specific nations or regional blocs consistently sweep or lag across index categories.</p>
          </div>

          <div class="flex items-center gap-2">
            <select id="anatomy-sel-country" class="p-2 bg-paper border border-line rounded-lg text-xs font-mono text-ink">
              <optgroup label="Top Benchmark Regulars">
                <option value="NOR" ${this.selectedCountry === 'NOR' ? 'selected' : ''}>Norway (Nordic Model)</option>
                <option value="CHE" ${this.selectedCountry === 'CHE' ? 'selected' : ''}>Switzerland (Wealth & Innovation)</option>
                <option value="DNK" ${this.selectedCountry === 'DNK' ? 'selected' : ''}>Denmark (Governance & Trust)</option>
                <option value="FIN" ${this.selectedCountry === 'FIN' ? 'selected' : ''}>Finland (Happiness & Education)</option>
                <option value="SGP" ${this.selectedCountry === 'SGP' ? 'selected' : ''}>Singapore (State Capacity & Trade)</option>
                <option value="CRI" ${this.selectedCountry === 'CRI' ? 'selected' : ''}>Costa Rica (Eco-Pioneer / High Well-being)</option>
                <option value="JPN" ${this.selectedCountry === 'JPN' ? 'selected' : ''}>Japan (Longevity & Tech)</option>
                <option value="USA" ${this.selectedCountry === 'USA' ? 'selected' : ''}>United States (GDP & Innovation Lead)</option>
              </optgroup>
              <optgroup label="All Countries">
                ${COUNTRIES.map(c => `<option value="${c.iso3}" ${this.selectedCountry === c.iso3 ? 'selected' : ''}>${c.name} (${c.iso3})</option>`).join('')}
              </optgroup>
            </select>

            <select id="anatomy-sel-bloc" class="p-2 bg-paper border border-line rounded-lg text-xs font-mono text-ink">
              ${Object.entries(BLOC_LABELS).map(([k, v]) => `<option value="${k}" ${this.selectedBloc === k ? 'selected' : ''}>${v}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Diagnostic Summary Card -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Signature Drivers -->
          <div class="p-4 bg-card border border-line rounded-xl shadow-xs">
            <div class="flex items-center gap-2 mb-3">
              <span class="w-3 h-3 rounded-full bg-moss"></span>
              <h4 class="font-serif font-semibold text-sm text-ink">Signature Drivers for ${countryObj.name}</h4>
              <span class="text-[10px] font-mono text-muted bg-paper px-1.5 py-0.5 rounded border border-line">Top Global Percentiles</span>
            </div>
            <div class="space-y-2.5">
              ${signatureDrivers.map(item => {
                const dom = DOMAINS[item.domain] || { color: '#2E6B57' };
                return `
                  <div class="p-2.5 bg-paper border border-line rounded-lg flex items-center justify-between text-xs">
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full shrink-0" style="background:${dom.color}"></span>
                        <span class="font-semibold text-ink truncate">${item.name}</span>
                      </div>
                      <div class="text-[10.5px] text-muted font-mono">Raw: <b>${item.rawVal}</b> ${item.unit}</div>
                    </div>
                    <div class="text-right shrink-0">
                      <span class="font-mono font-bold text-moss">#${item.rank}</span>
                      <span class="text-[10px] text-muted block font-mono">Top ${(100 - item.percentile).toFixed(0)}%</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Structural Bottlenecks -->
          <div class="p-4 bg-card border border-line rounded-xl shadow-xs">
            <div class="flex items-center gap-2 mb-3">
              <span class="w-3 h-3 rounded-full bg-clay"></span>
              <h4 class="font-serif font-semibold text-sm text-ink">Structural Bottlenecks for ${countryObj.name}</h4>
              <span class="text-[10px] font-mono text-muted bg-paper px-1.5 py-0.5 rounded border border-line">Relative Lag Areas</span>
            </div>
            <div class="space-y-2.5">
              ${structuralBottlenecks.map(item => {
                const dom = DOMAINS[item.domain] || { color: '#B04A32' };
                return `
                  <div class="p-2.5 bg-paper border border-line rounded-lg flex items-center justify-between text-xs">
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full shrink-0" style="background:${dom.color}"></span>
                        <span class="font-semibold text-ink truncate">${item.name}</span>
                      </div>
                      <div class="text-[10.5px] text-muted font-mono">Raw: <b>${item.rawVal}</b> ${item.unit}</div>
                    </div>
                    <div class="text-right shrink-0">
                      <span class="font-mono font-bold text-clay">#${item.rank}</span>
                      <span class="text-[10px] text-muted block font-mono">Rank of ${item.totalCountries}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Compound Advantage & Collinearity Explainer -->
        <div class="p-5 bg-paper border border-line rounded-xl">
          <div class="sec-h mb-2">
            <span class="num">★</span>
            <h4 class="font-serif font-semibold text-base text-ink">The Anatomy of Compound Advantage</h4>
          </div>
          <p class="text-sm text-ink2 font-sans leading-relaxed mb-4">
            Why do high-performing archetypes (like Scandinavia, Switzerland, or Singapore) win across such divergent benchmarks?
            Because in international development, <b>high wealth, strong legal institutions, and universal public goods create mutually reinforcing collinearity</b>.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-sans">
            <div class="p-3 bg-card border border-line rounded-lg">
              <div class="font-bold text-ink mb-1">1. High Fiscal Capacity (GDP)</div>
              <p class="text-muted text-[12px] leading-relaxed">
                Affords universal healthcare, top-tier research universities, robust environmental safeguards, and renewable infrastructure.
              </p>
            </div>
            <div class="p-3 bg-card border border-line rounded-lg">
              <div class="font-bold text-ink mb-1">2. Low Corruption & Rule of Law</div>
              <p class="text-muted text-[12px] leading-relaxed">
                Translates public revenue efficiently into safety, public health, press freedom, and civic trust without leakage.
              </p>
            </div>
            <div class="p-3 bg-card border border-line rounded-lg">
              <div class="font-bold text-ink mb-1">3. High Subjective Well-being</div>
              <p class="text-muted text-[12px] leading-relaxed">
                A natural byproduct of institutional security, low inequality, and health, generating top scores in happiness and social progress.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners(container);
  }

  attachEventListeners(container) {
    const countrySel = container.querySelector('#anatomy-sel-country');
    if (countrySel) {
      countrySel.onchange = e => {
        this.selectedCountry = e.target.value;
        this.render();
      };
    }

    const blocSel = container.querySelector('#anatomy-sel-bloc');
    if (blocSel) {
      blocSel.onchange = e => {
        this.selectedBloc = e.target.value;
        this.render();
      };
    }
  }
}
