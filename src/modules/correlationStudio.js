// Correlation Matrix & Scatter Fit Studio Module
import { INDICATORS, INDICATOR_LIST } from '../data/indicators.js';
import { getCountry } from '../data/countries.js';
import {
  pearsonCorrelation,
  spearmanCorrelation,
  computeRegressionFits,
  explainCorrelation
} from '../engine/stats.js';
import { showGlobalTooltip, moveGlobalTooltip, hideGlobalTooltip } from './mapEngine.js';

export class CorrelationStudio {
  constructor(options = {}) {
    this.containerId = options.containerId || 'correlation-studio-container';
    this.customIndexData = options.customIndexData || {};
    this.customIndexName = options.customIndexName || 'Custom Index';

    this.selectedX = 'gdp_pc';
    this.selectedY = 'custom';
    this.fitType = 'quadratic'; // 'none' | 'linear' | 'quadratic'
    this.searchQuery = '';
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
        unit: 'Score (0–100)'
      };
    }
    return INDICATORS[id] || null;
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Available metrics for X and Y dropdowns
    const allMetrics = [
      { id: 'custom', name: `★ ${this.customIndexName}`, short: 'Custom' },
      ...INDICATOR_LIST.map(ind => ({ id: ind.id, name: ind.name, short: ind.short }))
    ];

    const dataXObj = this.getDataset(this.selectedX);
    const dataYObj = this.getDataset(this.selectedY);

    const xData = dataXObj ? dataXObj.data : {};
    const yData = dataYObj ? dataYObj.data : {};

    const pearson = pearsonCorrelation(xData, yData);
    const spearman = spearmanCorrelation(xData, yData);
    const explanation = explainCorrelation(pearson.r, dataXObj?.name || 'X', dataYObj?.name || 'Y');

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

        <!-- Controls for Scatter Plot -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-card border border-line rounded-xl text-xs font-mono">
          <div>
            <label class="block text-muted uppercase tracking-wider mb-1 font-semibold">Vertical Axis (Y)</label>
            <select id="corr-sel-y" class="w-full p-2 bg-paper border border-line rounded-lg text-ink font-mono text-xs">
              ${allMetrics.map(m => `<option value="${m.id}" ${this.selectedY === m.id ? 'selected' : ''}>${m.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-muted uppercase tracking-wider mb-1 font-semibold">Horizontal Axis (X)</label>
            <select id="corr-sel-x" class="w-full p-2 bg-paper border border-line rounded-lg text-ink font-mono text-xs">
              ${allMetrics.map(m => `<option value="${m.id}" ${this.selectedX === m.id ? 'selected' : ''}>${m.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-muted uppercase tracking-wider mb-1 font-semibold">Regression Curve Fit</label>
            <select id="corr-sel-fit" class="w-full p-2 bg-paper border border-line rounded-lg text-ink font-mono text-xs">
              <option value="none" ${this.fitType === 'none' ? 'selected' : ''}>None (Scatter Only)</option>
              <option value="linear" ${this.fitType === 'linear' ? 'selected' : ''}>Linear Trend (y = mx + b)</option>
              <option value="quadratic" ${this.fitType === 'quadratic' ? 'selected' : ''}>Quadratic Curve (y = ax² + bx + c)</option>
            </select>
          </div>
        </div>

        <!-- Pairwise Scatter Plot Container -->
        <div class="p-4 bg-card border border-line rounded-xl">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-serif font-semibold text-base text-ink">
              ${dataYObj?.name} vs. ${dataXObj?.name}
            </h3>
            <span class="font-mono text-xs text-muted" id="fit-formula-badge"></span>
          </div>
          <div id="scatter-plot-canvas" class="w-full h-80 sm:h-96"></div>
        </div>

        <!-- Dynamic Multi-Metric Correlation Matrix Heatmap -->
        <div class="p-4 bg-card border border-line rounded-xl">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="font-serif font-semibold text-base text-ink">Global Benchmark Correlation Heatmap</h3>
              <p class="text-xs text-muted font-sans">Pearson correlation coefficients across major indices. High positive values indicate strong collinearity.</p>
            </div>
            <span class="font-mono text-xs text-muted">Range: -1.0 to +1.0</span>
          </div>
          <div id="correlation-matrix-canvas" class="overflow-x-auto"></div>
        </div>
      </div>
    `;

    this.renderScatterPlot(dataXObj, dataYObj);
    this.renderCorrelationMatrix();
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

  renderCorrelationMatrix() {
    const el = document.getElementById('correlation-matrix-canvas');
    if (!el) return;

    // Build list of items to include in matrix: Custom index + top 8 diverse indicators
    const matrixList = [
      { id: 'custom', short: 'Custom', data: this.customIndexData },
      ...INDICATOR_LIST.slice(0, 8).map(i => ({ id: i.id, short: i.short, data: i.data }))
    ];

    const n = matrixList.length;
    let tableHtml = `<table class="w-full border-collapse text-xs font-mono"><thead><tr><th class="p-2 text-left text-muted font-normal">Metric</th>`;

    matrixList.forEach(item => {
      tableHtml += `<th class="p-2 text-center text-muted font-normal uppercase tracking-wider">${item.short}</th>`;
    });
    tableHtml += `</tr></thead><tbody>`;

    matrixList.forEach((rowItem, i) => {
      tableHtml += `<tr><td class="p-2 font-semibold text-ink border-b border-line whitespace-nowrap">${rowItem.short}</td>`;

      matrixList.forEach((colItem, j) => {
        let val = 1.0;
        if (i !== j) {
          const res = pearsonCorrelation(rowItem.data, colItem.data);
          val = res.r;
        }

        // Color coding from red (-1) to white (0) to green (+1)
        let bgColor = '#F7F8F5';
        let textColor = '#16262A';
        if (val > 0.1) {
          const alpha = (val * 0.75).toFixed(2);
          bgColor = `rgba(46, 107, 87, ${alpha})`;
          if (val > 0.5) textColor = '#FFFFFF';
        } else if (val < -0.1) {
          const alpha = (Math.abs(val) * 0.75).toFixed(2);
          bgColor = `rgba(176, 74, 50, ${alpha})`;
          if (val < -0.5) textColor = '#FFFFFF';
        }

        tableHtml += `<td class="p-2 text-center border-b border-line cursor-pointer transition hover:opacity-80" style="background:${bgColor};color:${textColor}" title="${rowItem.short} vs ${colItem.short}: r = ${val.toFixed(3)}">${val >= 0 ? '+' : ''}${val.toFixed(2)}</td>`;
      });
      tableHtml += `</tr>`;
    });

    tableHtml += `</tbody></table>`;
    el.innerHTML = tableHtml;
  }

  attachEventListeners(container) {
    const selX = container.querySelector('#corr-sel-x');
    if (selX) {
      selX.onchange = e => {
        this.selectedX = e.target.value;
        this.render();
      };
    }

    const selY = container.querySelector('#corr-sel-y');
    if (selY) {
      selY.onchange = e => {
        this.selectedY = e.target.value;
        this.render();
      };
    }

    const selFit = container.querySelector('#corr-sel-fit');
    if (selFit) {
      selFit.onchange = e => {
        this.fitType = e.target.value;
        this.render();
      };
    }
  }
}
