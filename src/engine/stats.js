/**
 * Normalizes an object of country values { ISO3: rawValue } based on method, polarity, transforms, and clipping.
 * @param {Object.<string, number>} dataMap - ISO3 -> raw value
 * @param {string|Object} optionsOrMethod - 'minmax' | 'zscore' | 'rank' OR options object
 * @param {number} polarity - 1 (higher is better) or -1 (lower is better)
 * @returns {Object.<string, number>} ISO3 -> normalized score (0 to 100)
 */
export function normalizeIndicator(dataMap, optionsOrMethod = 'minmax', polarity = 1) {
  let method = 'minmax';
  let transform = 'linear'; // 'linear' | 'log' | 'sqrt'
  let clipMin = null;
  let clipMax = null;

  if (typeof optionsOrMethod === 'object' && optionsOrMethod !== null) {
    method = optionsOrMethod.method || 'minmax';
    polarity = optionsOrMethod.polarity !== undefined ? optionsOrMethod.polarity : polarity;
    transform = optionsOrMethod.transform || 'linear';
    clipMin = optionsOrMethod.clipMin !== undefined ? optionsOrMethod.clipMin : null;
    clipMax = optionsOrMethod.clipMax !== undefined ? optionsOrMethod.clipMax : null;
  } else if (typeof optionsOrMethod === 'string') {
    method = optionsOrMethod;
  }

  const rawEntries = Object.entries(dataMap).filter(([_, v]) => v !== null && !isNaN(v));
  if (rawEntries.length === 0) return {};

  // 1. Apply clipping if configured
  const clippedEntries = rawEntries.map(([iso, v]) => {
    let val = v;
    if (clipMin !== null && !isNaN(clipMin)) val = Math.max(clipMin, val);
    if (clipMax !== null && !isNaN(clipMax)) val = Math.min(clipMax, val);
    return [iso, val];
  });

  // 2. Apply mathematical transformation
  const transformedEntries = clippedEntries.map(([iso, v]) => {
    let val = v;
    if (transform === 'log') {
      // Natural log with positive offset shift if min <= 0
      val = Math.log(Math.max(0.001, val + 1));
    } else if (transform === 'sqrt') {
      val = Math.sqrt(Math.max(0, val));
    }
    return [iso, val];
  });

  const values = transformedEntries.map(([_, v]) => v);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const result = {};

  if (method === 'minmax') {
    transformedEntries.forEach(([iso, val]) => {
      let norm = ((val - minVal) / range) * 100;
      if (polarity === -1) {
        norm = 100 - norm;
      }
      result[iso] = Math.max(0, Math.min(100, Math.round(norm * 100) / 100));
    });
  } else if (method === 'zscore') {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance) || 1;

    transformedEntries.forEach(([iso, val]) => {
      let z = (val - mean) / stdDev;
      if (polarity === -1) {
        z = -z;
      }
      // Map z-score (-2.5 to +2.5) to a 0-100 scale centered at 50 (std=16.6)
      let score = 50 + z * 16.667;
      result[iso] = Math.max(0, Math.min(100, Math.round(score * 100) / 100));
    });
  } else if (method === 'rank') {
    // Sort ascending for polarity = 1, descending for polarity = -1
    const sorted = [...transformedEntries].sort((a, b) => (polarity === 1 ? a[1] - b[1] : b[1] - a[1]));
    const n = sorted.length;
    sorted.forEach(([iso, _], idx) => {
      const percentile = ((idx + 1) / n) * 100;
      result[iso] = Math.round(percentile * 100) / 100;
    });
  }

  return result;
}

/**
 * Builds a composite index from normalized sub-indicator vectors and weights.
 * @param {Array<{ id: string, data: Object.<string, number>, weight: number }>} subIndicators
 * @param {string} formula - 'arithmetic' | 'geometric' | 'harmonic'
 * @returns {Object.<string, number>} ISO3 -> Composite Index Score (0 to 100)
 */
export function calculateCompositeIndex(subIndicators, formula = 'arithmetic') {
  if (!subIndicators || subIndicators.length === 0) return {};

  const totalWeight = subIndicators.reduce((sum, ind) => sum + (ind.weight || 1), 0);
  if (totalWeight <= 0) return {};

  // Get all country ISO codes present in at least one indicator
  const allIsos = new Set();
  subIndicators.forEach(ind => {
    Object.keys(ind.data).forEach(iso => allIsos.add(iso));
  });

  const scores = {};

  allIsos.forEach(iso => {
    let validSubCount = 0;
    let countryWeight = 0;

    if (formula === 'arithmetic') {
      let weightedSum = 0;
      subIndicators.forEach(ind => {
        const val = ind.data[iso];
        if (val !== undefined && val !== null && !isNaN(val)) {
          const w = ind.weight || 1;
          weightedSum += val * w;
          countryWeight += w;
          validSubCount++;
        }
      });
      if (validSubCount > 0 && countryWeight > 0) {
        scores[iso] = Math.round((weightedSum / countryWeight) * 100) / 100;
      }
    } else if (formula === 'geometric') {
      // Scale to [0.01, 1.0] to compute geometric mean safely
      let weightedLogSum = 0;
      subIndicators.forEach(ind => {
        const val = ind.data[iso];
        if (val !== undefined && val !== null && !isNaN(val)) {
          const w = ind.weight || 1;
          const safeVal = Math.max(0.001, val / 100);
          weightedLogSum += w * Math.log(safeVal);
          countryWeight += w;
          validSubCount++;
        }
      });
      if (validSubCount > 0 && countryWeight > 0) {
        const geom = Math.exp(weightedLogSum / countryWeight) * 100;
        scores[iso] = Math.max(0, Math.min(100, Math.round(geom * 100) / 100));
      }
    } else if (formula === 'harmonic') {
      let weightedInvSum = 0;
      subIndicators.forEach(ind => {
        const val = ind.data[iso];
        if (val !== undefined && val !== null && !isNaN(val)) {
          const w = ind.weight || 1;
          const safeVal = Math.max(0.1, val);
          weightedInvSum += w / safeVal;
          countryWeight += w;
          validSubCount++;
        }
      });
      if (validSubCount > 0 && weightedInvSum > 0) {
        const harm = countryWeight / weightedInvSum;
        scores[iso] = Math.max(0, Math.min(100, Math.round(harm * 100) / 100));
      }
    }
  });

  return scores;
}

/**
 * Calculates rankings (1 = highest score, or lowest if polarity = -1).
 * @param {Object.<string, number>} scoreMap - ISO3 -> score
 * @param {number} polarity - 1 (higher is better) | -1 (lower is better)
 * @returns {Object.<string, number>} ISO3 -> rank integer
 */
export function calculateRankings(scoreMap, polarity = 1) {
  const sorted = Object.entries(scoreMap)
    .filter(([_, val]) => val !== null && !isNaN(val))
    .sort((a, b) => (polarity === -1 ? a[1] - b[1] : b[1] - a[1]));

  const ranks = {};
  sorted.forEach(([iso, _], idx) => {
    ranks[iso] = idx + 1;
  });
  return ranks;
}

/**
 * Computes Pearson correlation coefficient between two vectors.
 */
export function pearsonCorrelation(dataX, dataY) {
  const commonIsos = Object.keys(dataX).filter(
    iso => dataY[iso] !== undefined && dataX[iso] !== null && dataY[iso] !== null && !isNaN(dataX[iso]) && !isNaN(dataY[iso])
  );

  const n = commonIsos.length;
  if (n < 3) return { r: 0, r2: 0, n: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

  commonIsos.forEach(iso => {
    const x = dataX[iso];
    const y = dataY[iso];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  });

  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  const r = den === 0 ? 0 : Math.max(-1, Math.min(1, num / den));
  return {
    r: Math.round(r * 1000) / 1000,
    r2: Math.round(r * r * 1000) / 1000,
    n
  };
}

/**
 * Computes Spearman rank correlation coefficient.
 */
export function spearmanCorrelation(dataX, dataY) {
  const commonIsos = Object.keys(dataX).filter(
    iso => dataY[iso] !== undefined && dataX[iso] !== null && dataY[iso] !== null && !isNaN(dataX[iso]) && !isNaN(dataY[iso])
  );

  const n = commonIsos.length;
  if (n < 3) return { rho: 0, n: 0 };

  const rankX = calculateRankings(dataX);
  const rankY = calculateRankings(dataY);

  let sumD2 = 0;
  commonIsos.forEach(iso => {
    const d = rankX[iso] - rankY[iso];
    sumD2 += d * d;
  });

  const rho = 1 - (6 * sumD2) / (n * (n * n - 1));
  return {
    rho: Math.round(Math.max(-1, Math.min(1, rho)) * 1000) / 1000,
    n
  };
}

/**
 * Calculates Linear and Quadratic polynomial regression curve fits.
 */
export function computeRegressionFits(dataX, dataY) {
  const commonIsos = Object.keys(dataX).filter(
    iso => dataY[iso] !== undefined && dataX[iso] !== null && dataY[iso] !== null && !isNaN(dataX[iso]) && !isNaN(dataY[iso])
  );

  const n = commonIsos.length;
  if (n < 3) return null;

  const points = commonIsos.map(iso => ({ x: dataX[iso], y: dataY[iso], iso }));
  points.sort((a, b) => a.x - b.x);

  // Linear Fit: y = m*x + b
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  points.forEach(p => {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
  });

  const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
  const b = (sumY - m * sumX) / n;

  // Quadratic Fit: y = a*x^2 + b*x + c (3x3 linear system)
  let s0 = n, s1 = 0, s2 = 0, s3 = 0, s4 = 0;
  let t0 = 0, t1 = 0, t2 = 0;

  points.forEach(p => {
    const x = p.x, y = p.y;
    const x2 = x * x;
    s1 += x;
    s2 += x2;
    s3 += x2 * x;
    s4 += x2 * x2;
    t0 += y;
    t1 += x * y;
    t2 += x2 * y;
  });

  // Solve 3x3 with Cramer's rule
  const det =
    s4 * (s2 * s0 - s1 * s1) -
    s3 * (s3 * s0 - s1 * s2) +
    s2 * (s3 * s1 - s2 * s2);

  let qa = 0, qb = m, qc = b;
  if (Math.abs(det) > 1e-9) {
    qa = (t2 * (s2 * s0 - s1 * s1) - s3 * (t1 * s0 - s1 * t0) + s2 * (t1 * s1 - s2 * t0)) / det;
    qb = (s4 * (t1 * s0 - s1 * t0) - t2 * (s3 * s0 - s1 * s2) + s2 * (s3 * t0 - t1 * s2)) / det;
    qc = (s4 * (s2 * t0 - t1 * s1) - s3 * (s3 * t0 - t1 * s2) + t2 * (s3 * s1 - s2 * s2)) / det;
  }

  return {
    linear: {
      m,
      b,
      predict: x => m * x + b,
      formula: `y = ${m.toFixed(3)}x + ${b.toFixed(2)}`
    },
    quadratic: {
      a: qa,
      b: qb,
      c: qc,
      predict: x => qa * x * x + qb * x + qc,
      formula: `y = ${qa.toFixed(4)}x² + ${qb.toFixed(3)}x + ${qc.toFixed(2)}`
    },
    points
  };
}

/**
 * Calculates variance contribution of each sub-indicator to the composite index.
 * Share = w_i * cov(X_i, C) / var(C)
 */
export function computeVarianceDecomposition(subIndicators, compositeScoreMap) {
  const commonIsos = Object.keys(compositeScoreMap);
  const n = commonIsos.length;
  if (n < 4) return [];

  const compValues = commonIsos.map(iso => compositeScoreMap[iso]);
  const compMean = compValues.reduce((a, b) => a + b, 0) / n;
  const compVar = compValues.reduce((s, v) => s + Math.pow(v - compMean, 2), 0) / n || 1;

  const totalWeight = subIndicators.reduce((sum, ind) => sum + (ind.weight || 1), 0) || 1;

  const contributions = subIndicators.map(ind => {
    let cov = 0;
    const subValues = commonIsos.map(iso => ind.data[iso] ?? compMean);
    const subMean = subValues.reduce((a, b) => a + b, 0) / n;

    commonIsos.forEach((iso, i) => {
      cov += (subValues[i] - subMean) * (compValues[i] - compMean);
    });
    cov = cov / n;

    const normWeight = (ind.weight || 1) / totalWeight;
    const rawShare = (normWeight * cov) / compVar;
    const pct = Math.max(0, rawShare * 100);

    return {
      id: ind.id,
      name: ind.name || ind.id,
      short: ind.short || ind.id,
      weight: ind.weight,
      variancePct: Math.round(pct * 10) / 10,
      covariance: cov
    };
  });

  // Normalize variance contributions to sum to 100%
  const sumPct = contributions.reduce((s, c) => s + c.variancePct, 0) || 1;
  contributions.forEach(c => {
    c.variancePct = Math.round((c.variancePct / sumPct) * 1000) / 10;
  });

  contributions.sort((a, b) => b.variancePct - a.variancePct);
  return contributions;
}

/**
 * Leave-One-Out (LOO) Sensitivity Analysis.
 * Computes how much the ranking changes when each sub-indicator is dropped in turn.
 */
export function computeLeaveOneOut(subIndicators, formula = 'arithmetic') {
  if (subIndicators.length <= 1) return [];

  const fullComposite = calculateCompositeIndex(subIndicators, formula);
  const fullRanks = calculateRankings(fullComposite);
  const commonIsos = Object.keys(fullComposite);
  const n = commonIsos.length;

  const results = subIndicators.map(droppedInd => {
    const reducedSubIndicators = subIndicators.filter(ind => ind.id !== droppedInd.id);
    const reducedComposite = calculateCompositeIndex(reducedSubIndicators, formula);
    const reducedRanks = calculateRankings(reducedComposite);

    let sumRankDelta = 0;
    let maxRankDelta = 0;
    let sumScoreDelta = 0;
    let maxScoreDelta = 0;

    commonIsos.forEach(iso => {
      if (reducedRanks[iso]) {
        const dr = Math.abs(fullRanks[iso] - reducedRanks[iso]);
        sumRankDelta += dr;
        if (dr > maxRankDelta) maxRankDelta = dr;

        const ds = Math.abs(fullComposite[iso] - reducedComposite[iso]);
        sumScoreDelta += ds;
        if (ds > maxScoreDelta) maxScoreDelta = ds;
      }
    });

    const spearman = spearmanCorrelation(fullComposite, reducedComposite);

    return {
      id: droppedInd.id,
      name: droppedInd.name || droppedInd.id,
      short: droppedInd.short || droppedInd.id,
      rho: spearman.rho,
      meanRankDelta: Math.round((sumRankDelta / n) * 10) / 10,
      maxRankDelta,
      meanScoreDelta: Math.round((sumScoreDelta / n) * 100) / 100,
      maxScoreDelta: Math.round(maxScoreDelta * 100) / 100
    };
  });

  // Sort by most influential first (lowest rho = removing it causes the biggest ranking change)
  results.sort((a, b) => a.rho - b.rho);
  return results;
}

/**
 * Computes Add-One-In country impact delta:
 * Delta = Rank(with indicator) - Rank(without indicator).
 * Positive = Country ranks better when indicator is included.
 */
export function computeAddOneInDeltas(subIndicators, targetIndicatorId, formula = 'arithmetic') {
  const fullComposite = calculateCompositeIndex(subIndicators, formula);
  const fullRanks = calculateRankings(fullComposite);

  const reducedSubIndicators = subIndicators.filter(ind => ind.id !== targetIndicatorId);
  const reducedComposite = calculateCompositeIndex(reducedSubIndicators, formula);
  const reducedRanks = calculateRankings(reducedComposite);

  const deltas = {};
  Object.keys(fullRanks).forEach(iso => {
    if (reducedRanks[iso] !== undefined) {
      // In ranks, 1 is best, so (reducedRank - fullRank) > 0 means the rank improved (e.g. was 15th, became 8th -> +7)
      deltas[iso] = reducedRanks[iso] - fullRanks[iso];
    }
  });

  return deltas;
}

/**
 * Generates an accessible, plain-English explanation of a correlation coefficient.
 */
export function explainCorrelation(r, nameX, nameY) {
  const absR = Math.abs(r);
  let strength = 'No meaningful relationship';
  let desc = `There is virtually no observed alignment between ${nameX} and ${nameY}.`;

  if (absR >= 0.8) {
    strength = r > 0 ? 'Very Strong Positive Alignment' : 'Very Strong Inverse Alignment';
    desc = r > 0
      ? `Countries scoring high in <b>${nameX}</b> almost always score high in <b>${nameY}</b> (${(r * r * 100).toFixed(0)}% shared variation).`
      : `Countries with high <b>${nameX}</b> consistently have significantly lower <b>${nameY}</b>.`;
  } else if (absR >= 0.6) {
    strength = r > 0 ? 'Substantial Positive Link' : 'Substantial Inverse Link';
    desc = r > 0
      ? `There is a clear positive connection: higher <b>${nameX}</b> typically coincides with higher <b>${nameY}</b>.`
      : `Higher <b>${nameX}</b> tends to coincide with lower <b>${nameY}</b> across most countries.`;
  } else if (absR >= 0.35) {
    strength = r > 0 ? 'Moderate Positive Tendency' : 'Moderate Inverse Tendency';
    desc = `There is a noticeable trend between the two indices, though country-specific factors create significant variation.`;
  } else if (absR >= 0.15) {
    strength = 'Weak Correlation';
    desc = `These two indicators measure largely independent dimensions of national performance.`;
  }

  return { strength, desc, r, r2: (r * r).toFixed(3) };
}
