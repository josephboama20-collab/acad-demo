const WEEK_LABELS = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6'];

export function weeksFromStreak(history = []) {
  const padded = [...history];
  while (padded.length < 42) padded.unshift(false);
  const slice = padded.slice(-42);
  return Array.from({ length: 6 }, (_, w) => {
    const week = slice.slice(w * 7, w * 7 + 7);
    const active = week.filter(Boolean).length;
    return Math.round((active / 7) * 100);
  });
}

export function engagementFromWeeks(weeklyCompletion, engagementScore = 0) {
  const base = engagementScore > 0 ? engagementScore : 50;
  return weeklyCompletion.map((w, i) =>
    Math.min(100, Math.round(base * 0.35 + w * 0.65 + i * 2)),
  );
}

export function hasReportData(metrics, streak) {
  return (
    (metrics?.tasksCompleted ?? 0) > 0 ||
    (streak?.current ?? 0) > 0 ||
    streak?.history?.some(Boolean)
  );
}

export function buildSummaryBullets(weeklyCompletion, metrics, streak) {
  const bullets = [];
  const first = weeklyCompletion[0] ?? 0;
  const last = weeklyCompletion[weeklyCompletion.length - 1] ?? 0;
  const delta = last - first;

  if (delta > 0) {
    bullets.push(`Weekly activity rose from ${first}% to ${last}% across the period.`);
  } else if (delta < 0) {
    bullets.push(`Activity dipped from ${first}% to ${last}%. Consider shorter daily sessions to rebuild rhythm.`);
  } else {
    bullets.push(`Weekly activity held steady around ${last}%.`);
  }

  bullets.push(`${metrics.tasksCompleted} conditioning task${metrics.tasksCompleted === 1 ? '' : 's'} completed so far.`);

  if (streak.current > 0) {
    bullets.push(`Current streak: ${streak.current} day${streak.current === 1 ? '' : 's'} (best ${streak.best}).`);
  }

  const gaps = weeklyCompletion
    .map((v, i) => (v < 40 ? WEEK_LABELS[i] : null))
    .filter(Boolean);
  if (gaps.length > 0 && gaps.length < 6) {
    bullets.push(`Lighter weeks: ${gaps.join(', ')}. Gaps did not erase earlier progress.`);
  }

  return bullets.slice(0, 4);
}

export { WEEK_LABELS };
