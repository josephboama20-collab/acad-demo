import { getPlanTimeline } from './planTimeline.js';

/**
 * Comeback plan timeline + conditioning section completion for dashboard.
 */
export function getConditioningProgress({
  profile,
  streak,
  metrics,
  courses,
  gradeHistory,
  flashcardStats,
  wellnessLogCount,
  projectsUnlocked,
  enabledTools,
}) {
  const timeline = getPlanTimeline(profile);
  const totalDays = timeline.totalDays;
  const daysElapsed = timeline.daysElapsed;
  const daysRemaining = timeline.daysRemaining;
  const timelinePct = timeline.pct;

  const taskTarget = Math.min(14, totalDays);
  const taskPct = Math.min(100, Math.round((metrics.tasksCompleted / taskTarget) * 100));

  const sections = [
    {
      id: 'profile',
      label: 'Academic profile',
      done: Boolean(profile?.academicProfile),
      detail: profile?.academicProfile ? 'Set up' : 'Incomplete',
      weight: 15,
    },
    {
      id: 'semester',
      label: 'Semester history',
      done: (gradeHistory?.length ?? 0) > 0,
      detail: gradeHistory?.length ? `${gradeHistory.length} term${gradeHistory.length === 1 ? '' : 's'} logged` : 'None yet',
      weight: 15,
    },
    {
      id: 'courses',
      label: 'Focus courses',
      done: courses.length > 0,
      detail: courses.length ? `${courses.length} active` : 'Add courses',
      weight: 15,
    },
    {
      id: 'conditioning',
      label: 'Daily conditioning',
      done: metrics.tasksCompleted >= 3 || streak.current >= 3,
      detail: `${metrics.tasksCompleted} tasks · ${streak.current} day streak`,
      weight: 20,
      progress: taskPct,
    },
    {
      id: 'recall',
      label: 'Flashcard recall',
      done: (flashcardStats?.mastered ?? 0) > 0 || (flashcardStats?.total ?? 0) > 5,
      detail: flashcardStats?.total ? `${flashcardStats.mastered} mastered` : 'Not started',
      weight: 15,
    },
    {
      id: 'wellness',
      label: 'Wellness check-ins',
      done: wellnessLogCount >= 3,
      detail: wellnessLogCount ? `${wellnessLogCount} logged` : 'Optional',
      weight: 10,
      optional: !enabledTools?.includes('habit-tracker'),
    },
    {
      id: 'projects',
      label: 'Portfolio projects',
      done: projectsUnlocked,
      detail: projectsUnlocked ? 'Unlocked' : 'Build consistency to unlock',
      weight: 10,
      optional: !enabledTools?.includes('projects'),
    },
  ];

  const active = sections.filter((s) => !s.optional);
  const doneWeight = active.reduce((sum, s) => sum + (s.done ? s.weight : 0), 0);
  const totalWeight = active.reduce((sum, s) => sum + s.weight, 0);
  const overallPct = totalWeight > 0 ? Math.round((doneWeight / totalWeight) * 100) : 0;

  return {
    timeline: {
      label: timeline.label,
      daysElapsed,
      totalDays,
      daysRemaining,
      pct: timelinePct,
      startedAt: timeline.startedAt.toISOString(),
      endAt: timeline.endAt.toISOString(),
      isEnded: timeline.isEnded,
      remainingMs: timeline.remainingMs,
    },
    sections,
    overallPct,
    taskPct,
    completionRate: Math.round((metrics.completionRate ?? 0) * 100),
  };
}
