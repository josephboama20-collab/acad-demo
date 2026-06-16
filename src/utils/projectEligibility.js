/**
 * Projects unlock with 2+ month plans. Shorter plans never surface the tool in nav.
 */
import { getDurationMeta } from './planCapacity.js';

export const PROJECT_THRESHOLDS = {
  minStreak: 5,
  minActiveDays: 10,
  minCompletionRate: 0.45,
};

export function isProjectsIncludedInPlan(profile) {
  const { tier } = getDurationMeta(profile || {});
  return tier === 'medium' || tier === 'full';
}

export function getConsistencyStats(streak, metrics) {
  const activeDays = (streak?.history || []).filter(Boolean).length;
  return {
    activeDays,
    currentStreak: streak?.current ?? 0,
    completionRate: metrics?.completionRate ?? 0,
  };
}

export function canAccessProjects(streak, metrics, profile) {
  if (isProjectsIncludedInPlan(profile)) return true;
  const { activeDays, currentStreak, completionRate } = getConsistencyStats(streak, metrics);
  return (
    currentStreak >= PROJECT_THRESHOLDS.minStreak &&
    activeDays >= PROJECT_THRESHOLDS.minActiveDays &&
    completionRate >= PROJECT_THRESHOLDS.minCompletionRate
  );
}

export function projectUnlockProgress(streak, metrics, profile) {
  if (isProjectsIncludedInPlan(profile)) {
    return {
      checks: [{ label: 'Included in your plan', done: true, current: 1, target: 1 }],
      pct: 100,
      unlocked: true,
    };
  }
  const { activeDays, currentStreak, completionRate } = getConsistencyStats(streak, metrics);
  const checks = [
    { label: `${PROJECT_THRESHOLDS.minStreak}-day streak`, done: currentStreak >= PROJECT_THRESHOLDS.minStreak, current: currentStreak, target: PROJECT_THRESHOLDS.minStreak },
    { label: `${PROJECT_THRESHOLDS.minActiveDays} active days`, done: activeDays >= PROJECT_THRESHOLDS.minActiveDays, current: activeDays, target: PROJECT_THRESHOLDS.minActiveDays },
    { label: `${Math.round(PROJECT_THRESHOLDS.minCompletionRate * 100)}% completion`, done: completionRate >= PROJECT_THRESHOLDS.minCompletionRate, current: Math.round(completionRate * 100), target: Math.round(PROJECT_THRESHOLDS.minCompletionRate * 100) },
  ];
  const done = checks.filter((c) => c.done).length;
  return { checks, pct: Math.round((done / checks.length) * 100), unlocked: done === checks.length };
}
