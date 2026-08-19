// Interactive SVG Choropleth Map Engine with Natural Earth I Projection & Flower Profile Glyph
import { WORLD_GEO } from '../data/worldGeo.js';
import { getCountryName, getCountry } from '../data/countries.js';
import { DOMAINS } from '../data/indicators.js';

// Natural Earth I Projection formulas
function projectNaturalEarth(lon, lat) {
  const l = (lon * Math.PI) / 180;
  const p = (lat * Math.PI) / 180;
  const p2 = p * p;
  const p4 = p2 * p2;
  return [
    l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4))),
    p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)))
  ];
}

const MW = 940;
const MH = 460;
const MPAD = 6;
const CTY_SW = 0.45;

let SVG_PATHS = null;

export function buildSvgPaths() {
  if (SVG_PATHS) return SVG_PATHS;

  const [x0] = projectNaturalEarth(-180, 0);
  const [x1] = projectNaturalEarth(180, 0);
  const [, y0] = projectNaturalEarth(0, -56);
  const [, y1] = projectNaturalEarth(0, 84);

  const scale = Math.min((MW - 2 * MPAD) / (x1 - x0), (MH - 2 * MPAD) / (y1 - y0));
  const ox = MW / 2 - (scale * (x0 + x1)) / 2;
  const oy = MH / 2 + (scale * (y0 + y1)) / 2;

  const project = (lon, lat) => {
    const [px, py] = projectNaturalEarth(lon, lat);
    return [ox + scale * px, oy - scale * py];
  };

  SVG_PATHS = {};
  WORLD_GEO.features.forEach(feature => {
    let d = '';
    feature.geometry.coordinates.forEach(polygon => {
      polygon.forEach(ring => {
        ring.forEach((coord, idx) => {
          const pt = project(coord[0], coord[1]);
          d += (idx === 0 ? 'M' : 'L') + pt[0].toFixed(1) + ' ' + pt[1].toFixed(1);
        });
        d += 'Z';
      });
    });
    SVG_PATHS[feature.properties.ADM0] = d;
  });

  return SVG_PATHS;
}

// Color palettes
export const COLOR_PALETTES = {
  moss_gold: {
    name: 'Editorial Moss & Gold',
    stops: ['#2E6B57', '#57B98A', '#E3C16F', '#B8873B', '#B04A32'].reverse()
  },
  viridis: {
    name: 'Viridis',
    stops: ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725']
  },
  turbo: {
    name: 'Turbo Spectrum',
    stops: ['#30123b', '#4146e4', '#1ae4b6', '#a2fc3c', '#e1dc36', '#f83c12', '#7a0403'].reverse()
  },
  magma: {
    name: 'Magma',
    stops: ['#000004', '#3b0f70', '#8c2981', '#de4968', '#fe9f6d', '#fcfdbf']
  },
  diverging_rb: {
    name: 'Diverging Blue-Red',
    stops: ['#8C2D19', '#D9654B', '#F7F8F5', '#4FA5C0', '#1B4A73']
  }
};

function hexToRgb(hex) {
  const c = hex.replace('#', '');
  return [parseInt(c.substring(0, 2), 16), parseInt(c.substring(2, 4), 16), parseInt(c.substring(4, 6), 16)];
}

export function interpolatePalette(stops, t) {
  const clampedT = Math.max(0, Math.min(1, t));
  const n = stops.length - 1;
  const i = Math.min(Math.floor(clampedT * n), n - 1);
  const localT = (clampedT - i / n) * n;

  const rgb1 = hexToRgb(stops[i]);
  const rgb2 = hexToRgb(stops[i + 1]);

  const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * localT);
  const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * localT);
  const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * localT);

  return `rgb(${r},${g},${b})`;
}

/**
 * 4x4 2D Bivariate Matrix Color Grid Generator
 */
export const BIVARIATE_4X4_COLORS = [
  // Row 0 (Low Y): Low X -> High X
  ['#E8E8E8', '#CBB8D7', '#9988B3', '#5D4978'],
  // Row 1 (Med Y)
  ['#B8D6BE', '#A5B5BA', '#7F8498', '#4E4960'],
  // Row 2 (High Y)
  ['#73B690', '#6BA092', '#52757B', '#344550'],
  // Row 3 (Very High Y - Top row)
  ['#2E6B57', '#347963', '#2F676B', '#1B4A73']
];

/**
 * Renders the interactive Choropleth Map SVG into container.
 */
export function renderChoroplethMap(containerId, scoreMap, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const paths = buildSvgPaths();
  const paletteKey = options.palette || 'moss_gold';
  const palette = COLOR_PALETTES[paletteKey] || COLOR_PALETTES.moss_gold;
  const stops = options.customStops || palette.stops;

  const values = Object.values(scoreMap).filter(v => v !== null && !isNaN(v));
  const minVal = options.minVal !== undefined ? options.minVal : (values.length ? Math.min(...values) : 0);
  const maxVal = options.maxVal !== undefined ? options.maxVal : (values.length ? Math.max(...values) : 100);
  const range = maxVal - minVal || 1;

  let countrySvgPaths = '';
  Object.keys(paths).forEach(iso => {
    const score = scoreMap[iso];
    const hasData = score !== undefined && score !== null && !isNaN(score);
    const country = getCountry(iso);

    let fillColor = '#E4E8E1';
    if (hasData) {
      const t = (score - minVal) / range;
      fillColor = interpolatePalette(stops, t);
    }

    const tip = `<b>${country.name} (${iso})</b><br>${hasData ? `Score: <b>${score}</b>` : 'No data'}<br><span style="color:#8FBFA8;font-size:10px">${country.region} · ${country.income}</span>`;

    countrySvgPaths += `<path d="${paths[iso]}" fill="${fillColor}" stroke="#FFFFFF" class="cty ${hasData ? '' : 'nod'}" data-iso="${iso}" data-score="${hasData ? score : ''}" data-tip="${encodeURIComponent(tip)}"/>`;
  });

  // Legend bar
  const lw = 220;
  const lh = 10;
  const lx = (MW - lw) / 2;
  const ly = MH - 24;

  const gradientId = `mapGrad_${Math.random().toString(36).substring(2, 9)}`;
  let gradStops = '';
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    gradStops += `<stop offset="${i * 10}%" stop-color="${interpolatePalette(stops, t)}"/>`;
  }

  const showLegend = options.showLegend !== false;
  const legendSvg = showLegend ? `
    <defs>
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
        ${gradStops}
      </linearGradient>
    </defs>
    <rect x="${lx}" y="${ly}" width="${lw}" height="${lh}" fill="url(#${gradientId})" stroke="#D6DAD1" rx="2"/>
    <text x="${lx}" y="${ly + lh + 11}" class="ax" font-size="9" fill="#6E7E7E">${minVal.toFixed(1)}</text>
    <text x="${lx + lw}" y="${ly + lh + 11}" class="ax" font-size="9" fill="#6E7E7E" text-anchor="end">${maxVal.toFixed(1)}</text>
    <text x="${lx + lw / 2}" y="${ly - 6}" class="ax" font-size="9.5" fill="#3C4F52" font-weight="600" text-anchor="middle">${options.label || 'Index Score (0–100)'}</text>
  ` : '';

  const zoomHint = `<text x="${MW - MPAD - 6}" y="${MH - 10}" text-anchor="end" class="ax" font-size="8.5" fill="#9AA4A0">drag box to zoom · double-click to reset</text>`;

  container.innerHTML = `
    <svg viewBox="0 0 ${MW} ${MH}" preserveAspectRatio="xMidYMid meet" class="w-full h-auto block select-none map-svg">
      <g class="map-transform" stroke-width="${CTY_SW}">
        ${countrySvgPaths}
      </g>
      <g class="map-overlay">
        ${legendSvg}
        ${zoomHint}
      </g>
    </svg>
  `;

  // Attach interactive zoom and events
  const svgEl = container.querySelector('.map-svg');
  const groupEl = container.querySelector('.map-transform');
  enableMapZoom(svgEl, groupEl);

  // Attach tooltips and hover callbacks
  container.querySelectorAll('.cty').forEach(pathEl => {
    const iso = pathEl.dataset.iso;
    pathEl.addEventListener('mouseenter', e => {
      if (options.onCountryHover) options.onCountryHover(iso);
      showGlobalTooltip(decodeURIComponent(pathEl.dataset.tip), e);
    });
    pathEl.addEventListener('mousemove', moveGlobalTooltip);
    pathEl.addEventListener('mouseleave', () => {
      hideGlobalTooltip();
    });
    pathEl.addEventListener('click', () => {
      if (options.onCountryClick) options.onCountryClick(iso);
    });
  });
}

/**
 * Renders the dedicated Bivariate 2D Choropleth Map.
 * When selectedCell is set [r, c], it spotlights those countries and dims others.
 */
export function renderBivariateChoroplethMap(containerId, normX, normY, selectedCell = null, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const paths = buildSvgPaths();
  const tiers = ['Low', 'Medium', 'High', 'Very High'];

  let countrySvgPaths = '';
  let matchCount = 0;

  Object.keys(paths).forEach(iso => {
    const x = normX[iso];
    const y = normY[iso];
    const hasData = x !== undefined && y !== undefined && x !== null && y !== null && !isNaN(x) && !isNaN(y);
    const country = getCountry(iso);

    let fillColor = '#E8ECE6';
    let opacity = '1';
    let strokeColor = '#FFFFFF';
    let strokeWidth = '0.5';

    if (hasData) {
      const col = Math.min(3, Math.floor(x / 25));
      const row = Math.min(3, Math.floor(y / 25));
      const cellColor = BIVARIATE_4X4_COLORS[row][col];

      if (selectedCell) {
        const isMatch = selectedCell[0] === row && selectedCell[1] === col;
        if (isMatch) {
          matchCount++;
          fillColor = cellColor;
          strokeColor = '#16262A';
          strokeWidth = '1.2';
          opacity = '1';
        } else {
          fillColor = '#E8ECE6';
          opacity = '0.35';
          strokeColor = '#FFFFFF';
          strokeWidth = '0.3';
        }
      } else {
        fillColor = cellColor;
      }

      const tip = `<b>${country.name} (${iso})</b><br>${options.nameY || 'Y'}: <b>${y.toFixed(1)}</b> (${tiers[row]})<br>${options.nameX || 'X'}: <b>${x.toFixed(1)}</b> (${tiers[col]})<br><span style="color:#8FBFA8;font-size:10px">${country.region}</span>`;

      countrySvgPaths += `<path d="${paths[iso]}" fill="${fillColor}" fill-opacity="${opacity}" stroke="${strokeColor}" stroke-width="${strokeWidth}" class="cty" data-iso="${iso}" data-tip="${encodeURIComponent(tip)}"/>`;
    } else {
      countrySvgPaths += `<path d="${paths[iso]}" fill="#ECEEEA" fill-opacity="0.4" stroke="#FFFFFF" stroke-width="0.3" class="cty nod" data-iso="${iso}" data-tip="${encodeURIComponent(`<b>${country.name}</b><br>No matching data`)}"/>`;
    }
  });

  const bannerText = selectedCell
    ? `Spotlight: ${tiers[selectedCell[0]]} Y × ${tiers[selectedCell[1]]} X (${matchCount} countries)`
    : `Bivariate 2D Distribution (Click matrix cells to isolate)`;

  const zoomHint = `<text x="${MW - MPAD - 6}" y="${MH - 10}" text-anchor="end" class="ax" font-size="8.5" fill="#9AA4A0">drag box to zoom · double-click to reset</text>`;
  const titleText = `<text x="${MW / 2}" y="${MH - 16}" text-anchor="middle" font-family="var(--mono)" font-size="10.5" font-weight="600" fill="#2E6B57">${bannerText}</text>`;

  container.innerHTML = `
    <svg viewBox="0 0 ${MW} ${MH}" preserveAspectRatio="xMidYMid meet" class="w-full h-auto block select-none map-svg">
      <g class="map-transform" stroke-width="${CTY_SW}">
        ${countrySvgPaths}
      </g>
      <g class="map-overlay">
        ${titleText}
        ${zoomHint}
      </g>
    </svg>
  `;

  // Attach interactive zoom and events
  const svgEl = container.querySelector('.map-svg');
  const groupEl = container.querySelector('.map-transform');
  enableMapZoom(svgEl, groupEl);

  container.querySelectorAll('.cty').forEach(pathEl => {
    const iso = pathEl.dataset.iso;
    pathEl.addEventListener('mouseenter', e => {
      showGlobalTooltip(decodeURIComponent(pathEl.dataset.tip), e);
    });
    pathEl.addEventListener('mousemove', moveGlobalTooltip);
    pathEl.addEventListener('mouseleave', hideGlobalTooltip);
  });
}

/**
 * Click-drag bounding box zoom on map.
 */
function enableMapZoom(svg, grp) {
  if (!svg || !grp) return;

  let zoom = 1,
    tx = 0,
    ty = 0;
  const applyTransform = () => {
    grp.setAttribute('transform', `translate(${tx} ${ty}) scale(${zoom})`);
    grp.setAttribute('stroke-width', (CTY_SW / Math.sqrt(zoom)).toFixed(4));
  };

  const getSvgPoint = e => {
    const rect = svg.getBoundingClientRect();
    return [((e.clientX - rect.left) / rect.width) * MW, ((e.clientY - rect.top) / rect.height) * MH];
  };

  const NS = 'http://www.w3.org/2000/svg';
  let box = null,
    start = null,
    moved = false;

  svg.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    start = getSvgPoint(e);
    moved = false;
    box = document.createElementNS(NS, 'rect');
    box.setAttribute('fill', 'rgba(46,107,87,0.12)');
    box.setAttribute('stroke', '#2E6B57');
    box.setAttribute('stroke-width', '1');
    box.setAttribute('stroke-dasharray', '4 3');
    box.setAttribute('pointer-events', 'none');
    svg.appendChild(box);
  });

  window.addEventListener('mousemove', e => {
    if (!start || !box) return;
    const p = getSvgPoint(e);
    const x = Math.min(start[0], p[0]);
    const y = Math.min(start[1], p[1]);
    const w = Math.abs(p[0] - start[0]);
    const h = Math.abs(p[1] - start[1]);

    if (w > 3 || h > 3) moved = true;
    box.setAttribute('x', x);
    box.setAttribute('y', y);
    box.setAttribute('width', w);
    box.setAttribute('height', h);
  });

  window.addEventListener('mouseup', e => {
    if (!start) return;
    const p = getSvgPoint(e);
    const x0 = Math.min(start[0], p[0]);
    const y0 = Math.min(start[1], p[1]);
    const w = Math.abs(p[0] - start[0]);
    const h = Math.abs(p[1] - start[1]);

    if (box && box.parentNode) box.parentNode.removeChild(box);
    const wasMoved = moved;
    start = null;
    box = null;

    if (!wasMoved || w < 8 || h < 8) return;

    const bx = (x0 - tx) / zoom;
    const by = (y0 - ty) / zoom;
    const bw = w / zoom;
    const bh = h / zoom;

    const newZoom = Math.max(1, Math.min(12, Math.min(MW / bw, MH / bh)));
    zoom = newZoom;
    const cx = bx + bw / 2;
    const cy = by + bh / 2;
    tx = MW / 2 - cx * zoom;
    ty = MH / 2 - cy * zoom;
    tx = Math.max(MW - MW * zoom, Math.min(0, tx));
    ty = Math.max(MH - MH * zoom, Math.min(0, ty));
    applyTransform();
  });

  svg.addEventListener('dblclick', e => {
    e.preventDefault();
    zoom = 1;
    tx = 0;
    ty = 0;
    applyTransform();
  });
}

/**
 * Renders the Country Profile Flower / Radar Chart Glyphs.
 * Updated: Compact footprint, smooth rounded organic lobes, width dynamically scaling with N.
 */
export function renderCountryProfileFlower(containerId, countryIso, subIndicators, globalMeans = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!countryIso || !subIndicators || subIndicators.length === 0) {
    container.innerHTML = `<div class="text-xs text-muted text-center py-4 font-mono">Hover any country on the map to view dimension petals.</div>`;
    return;
  }

  const country = getCountry(countryIso);
  // Compact dimension for space efficiency
  const S = 210;
  const cx = S / 2;
  const cy = S / 2;
  const R = S * 0.36;
  const r0 = S * 0.08;
  const N = subIndicators.length;
  const step = 360 / N;

  // Polar coordinate helper in local rotated frame
  const P = (radDist, angleDeg, lateralOffset = 0) => {
    const t = (angleDeg * Math.PI) / 180;
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    // perp vector for lateral offset
    const px = -sinT * lateralOffset;
    const py = cosT * lateralOffset;
    return [cx + radDist * cosT + px, cy + radDist * sinT + py];
  };

  let guideRings = '';
  [0.5, 1.0].forEach(frac => {
    const r = r0 + (R - r0) * frac;
    guideRings += `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="none" stroke="#D6DAD1" stroke-width="0.8" stroke-dasharray="${frac === 1 ? 'none' : '2 2'}"/>`;
  });

  // Dynamic width scale factor based on number of lobes N
  // For small N (3-4), wider petals; for large N (8-12), proportionally slender petals to prevent overlap
  const kWidth = Math.max(0.12, Math.min(0.38, 0.92 * Math.sin(Math.PI / N)));

  let petals = '';
  let labels = '';
  let meanGuide = '';

  subIndicators.forEach((ind, i) => {
    const angle = -90 + i * step;
    const val = ind.data[countryIso];
    const hasVal = val !== undefined && val !== null && !isNaN(val);
    const scoreNorm = hasVal ? Math.max(0, Math.min(100, val)) / 100 : 0;
    const petalLen = r0 + scoreNorm * (R - r0);

    const domainColor = DOMAINS[ind.domain]?.color || '#2E6B57';

    // Global mean dashed guide
    const meanVal = globalMeans[ind.id] !== undefined ? globalMeans[ind.id] / 100 : 0.5;
    const meanLen = r0 + meanVal * (R - r0);
    const meanPt = P(meanLen, angle);
    meanGuide += `<circle cx="${meanPt[0].toFixed(1)}" cy="${meanPt[1].toFixed(1)}" r="2" fill="#6E7E7E"/>`;

    // Smooth organic cubic bezier petal with rounded lobe geometry
    const w = kWidth * petalLen;
    const b = P(r0, angle);
    const t = P(petalLen, angle);
    const c1 = P(petalLen * 0.34, angle, w);
    const c2 = P(petalLen * 0.82, angle, w * 0.52);
    const c3 = P(petalLen * 0.82, angle, -w * 0.52);
    const c4 = P(petalLen * 0.34, angle, -w);

    const leafPath = `M ${b[0].toFixed(1)} ${b[1].toFixed(1)} C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${t[0].toFixed(1)} ${t[1].toFixed(1)} C ${c3[0].toFixed(1)} ${c3[1].toFixed(1)}, ${c4[0].toFixed(1)} ${c4[1].toFixed(1)}, ${b[0].toFixed(1)} ${b[1].toFixed(1)} Z`;

    const tipText = `<b>${ind.name}</b><br>${country.name}: <b>${hasVal ? val.toFixed(1) : 'No data'}</b> / 100<br><span style="color:#8FBFA8;font-size:10px">Global Mean: ${(meanVal * 100).toFixed(1)}</span>`;

    petals += `<path d="${leafPath}" fill="${domainColor}" fill-opacity="0.65" stroke="${domainColor}" stroke-width="1.2" data-tip="${encodeURIComponent(tipText)}" class="petal-leaf cursor-pointer hover:fill-opacity-90"/>`;

    // Small rounded cap circle at tip
    if (scoreNorm > 0.15) {
      petals += `<circle cx="${t[0].toFixed(1)}" cy="${t[1].toFixed(1)}" r="2.2" fill="${domainColor}"/>`;
    }

    // Label anchor point just outside R
    const rad = (angle * Math.PI) / 180;
    const labPt = P(R + 13, angle);
    const textAnchor = Math.abs(Math.cos(rad)) < 0.2 ? 'middle' : Math.cos(rad) > 0 ? 'start' : 'end';

    labels += `<text x="${labPt[0].toFixed(1)}" y="${(labPt[1] + 3).toFixed(1)}" text-anchor="${textAnchor}" font-family="var(--mono)" font-size="7.5" font-weight="600" fill="${domainColor}">${ind.short || ind.id}</text>`;
  });

  const centerHub = `<circle cx="${cx}" cy="${cy}" r="${r0.toFixed(1)}" fill="#F7F8F5" stroke="#16262A" stroke-width="1.5"/><circle cx="${cx}" cy="${cy}" r="2.5" fill="#16262A"/>`;

  container.innerHTML = `
    <div class="text-center mb-0.5">
      <span class="font-serif font-bold text-xs text-ink">${country.name}</span>
      <span class="font-mono text-[10px] text-muted">(${countryIso})</span>
    </div>
    <svg viewBox="0 0 ${S} ${S}" class="w-full h-auto max-w-[190px] mx-auto block select-none">
      ${guideRings}
      ${petals}
      ${meanGuide}
      ${centerHub}
      ${labels}
    </svg>
    <div class="flex items-center justify-center gap-3 text-[9.5px] text-muted font-mono mt-0.5">
      <span class="inline-flex items-center gap-1"><i class="inline-block w-2 h-2 rounded-full bg-moss opacity-75"></i> Score</span>
      <span class="inline-flex items-center gap-1"><i class="inline-block w-1 h-1 rounded-full bg-mut"></i> Global Mean</span>
    </div>
  `;

  // Attach tip events to petals
  container.querySelectorAll('.petal-leaf').forEach(el => {
    el.addEventListener('mouseenter', e => showGlobalTooltip(decodeURIComponent(el.dataset.tip), e));
    el.addEventListener('mousemove', moveGlobalTooltip);
    el.addEventListener('mouseleave', hideGlobalTooltip);
  });
}

// Global Tooltip Management
let GLOBAL_TIP = null;

function ensureTooltip() {
  if (!GLOBAL_TIP) {
    GLOBAL_TIP = document.createElement('div');
    GLOBAL_TIP.className = 'gtip';
    document.body.appendChild(GLOBAL_TIP);
  }
}

export function showGlobalTooltip(html, event) {
  ensureTooltip();
  GLOBAL_TIP.innerHTML = html;
  GLOBAL_TIP.style.opacity = '1';
  moveGlobalTooltip(event);
}

export function moveGlobalTooltip(event) {
  if (!GLOBAL_TIP) return;
  const x = event.clientX + 14;
  const y = event.clientY + 14;
  GLOBAL_TIP.style.left = `${Math.min(window.innerWidth - 240, x)}px`;
  GLOBAL_TIP.style.top = `${Math.min(window.innerHeight - 80, y)}px`;
}

export function hideGlobalTooltip() {
  if (GLOBAL_TIP) GLOBAL_TIP.style.opacity = '0';
}
