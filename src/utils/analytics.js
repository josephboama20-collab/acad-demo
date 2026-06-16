export function pearsonCorrelation(xs, ys) {
  const n = xs.length;
  if (n < 2) return { r: 0, interpretation: 'insufficient data', pct: 'n/a' };

  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    denX += (xs[i] - meanX) ** 2;
    denY += (ys[i] - meanY) ** 2;
  }

  if (denX === 0 || denY === 0) return { r: 0, interpretation: 'no variance', pct: 'n/a' };

  const r = num / Math.sqrt(denX * denY);
  const pct = `${Math.abs(Math.round(r * 100))}%`;

  let interpretation;
  const abs = Math.abs(r);
  if (abs < 0.15) interpretation = 'no clear link';
  else if (abs < 0.35) interpretation = 'weak link';
  else if (abs < 0.55) interpretation = 'moderate link';
  else if (abs < 0.75) interpretation = 'strong link';
  else interpretation = 'very strong link';

  return { r: Math.round(r * 1000) / 1000, interpretation, pct };
}

export function correlationInsight(corr, xLabel, yLabel) {
  if (Math.abs(corr.r) < 0.15) return null;
  return `${xLabel} correlates with ${corr.r > 0 ? 'higher' : 'lower'} ${yLabel} (${corr.pct} correlation).`;
}
