export function readCssVar(name) {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function masteryPctColor(pct) {
  if (pct >= 70) return readCssVar('--mastery-high') || '#10b981';
  if (pct >= 50) return readCssVar('--mastery-mid') || '#f59e0b';
  return readCssVar('--mastery-low') || '#ef4444';
}
