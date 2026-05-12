// On-device trend projection for tree-health series.
// Linear regression + EMA smoothing — no server ML needed for short series (≤30 points).

export type TimeSeriesPoint = { t: number; v: number };

export type ProjectionResult = {
  slope: number;
  intercept: number;
  emaLast: number;
  trend: 'improving' | 'stable' | 'declining';
  projected: TimeSeriesPoint[];
};

export function linearRegression(series: TimeSeriesPoint[]): { slope: number; intercept: number } {
  const n = series.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  if (n === 1) return { slope: 0, intercept: series[0]!.v };
  let sumT = 0;
  let sumV = 0;
  let sumTT = 0;
  let sumTV = 0;
  for (const p of series) {
    sumT += p.t;
    sumV += p.v;
    sumTT += p.t * p.t;
    sumTV += p.t * p.v;
  }
  const denom = n * sumTT - sumT * sumT;
  if (denom === 0) return { slope: 0, intercept: sumV / n };
  const slope = (n * sumTV - sumT * sumV) / denom;
  const intercept = (sumV - slope * sumT) / n;
  return { slope, intercept };
}

export function ema(series: TimeSeriesPoint[], alpha = 0.4): number {
  if (series.length === 0) return 0;
  let s = series[0]!.v;
  for (let i = 1; i < series.length; i++) {
    s = alpha * series[i]!.v + (1 - alpha) * s;
  }
  return s;
}

export function project(series: TimeSeriesPoint[], stepsAhead = 4, stepMs = 7 * 24 * 60 * 60 * 1000): ProjectionResult {
  const sorted = [...series].sort((a, b) => a.t - b.t);
  const { slope, intercept } = linearRegression(sorted);
  const emaLast = ema(sorted, 0.45);

  const projected: TimeSeriesPoint[] = [];
  const lastT = sorted[sorted.length - 1]?.t ?? Date.now();
  for (let i = 1; i <= stepsAhead; i++) {
    const t = lastT + i * stepMs;
    const v = Math.max(0, Math.min(1, slope * t + intercept));
    projected.push({ t, v });
  }

  const slopeMs = slope * (1000 * 60 * 60 * 24 * 30);
  const trend: ProjectionResult['trend'] =
    slopeMs > 0.04 ? 'improving' : slopeMs < -0.04 ? 'declining' : 'stable';

  return { slope, intercept, emaLast, trend, projected };
}
