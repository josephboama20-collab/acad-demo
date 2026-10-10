import { getDurationMeta } from './planCapacity.js';

const MS_DAY = 86400000;
const SEC_DAY = 86400;
const SEC_WEEK = 7 * SEC_DAY;
const SEC_MONTH = 30 * SEC_DAY;

export function getPlanTimeline(profile) {
  const duration = getDurationMeta(profile);
  const startedAt = profile?.startedAt ? new Date(profile.startedAt) : new Date();
  const totalMs = Math.max(1, Math.round(duration.weeks * 7 * MS_DAY));
  const endAt = new Date(startedAt.getTime() + totalMs);
  const now = Date.now();
  const elapsedMs = Math.max(0, Math.min(totalMs, now - startedAt.getTime()));
  const remainingMs = Math.max(0, endAt.getTime() - now);

  return {
    label: duration.label,
    startedAt,
    endAt,
    totalDays: Math.round(duration.weeks * 7),
    daysElapsed: Math.floor(elapsedMs / MS_DAY),
    daysRemaining: Math.ceil(remainingMs / MS_DAY),
    pct: Math.min(100, Math.round((elapsedMs / totalMs) * 100)),
    remainingMs,
    isEnded: remainingMs <= 0,
  };
}

/** Break remaining time into months, weeks, days, hours, minutes, seconds. */
export function splitCountdown(remainingMs) {
  let totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  const months = Math.floor(totalSec / SEC_MONTH);
  totalSec %= SEC_MONTH;
  const weeks = Math.floor(totalSec / SEC_WEEK);
  totalSec %= SEC_WEEK;
  const days = Math.floor(totalSec / SEC_DAY);
  totalSec %= SEC_DAY;
  const hours = Math.floor(totalSec / 3600);
  totalSec %= 3600;
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return { months, weeks, days, hours, minutes, seconds };
}

export function isPlanTimelineEnded(profile) {
  return getPlanTimeline(profile).isEnded;
}
