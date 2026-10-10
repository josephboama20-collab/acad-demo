import { getPlanTimeline } from './planTimeline.js';
import { countDeferredHabitsRemaining, needsMoreSemesterHistory } from './deferredSetup.js';

const CHECKLIST_DISMISS_KEY = 'acad_setup_checklist_dismissed';

export function isSetupChecklistDismissed() {
  try {
    return localStorage.getItem(CHECKLIST_DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissSetupChecklist() {
  try {
    localStorage.setItem(CHECKLIST_DISMISS_KEY, '1');
  } catch {
    /* ignore */
  }
}

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

  const setupItems = [
    {
      id: 'programme',
      label: 'Programme profile',
      done: Boolean(profile?.academicProfile),
      detail: profile?.academicProfile ? 'Confirmed' : 'Incomplete',
      page: 'settings',
      weight: 10,
      group: 'setup',
    },
    {
      id: 'semester-min',
      label: 'One semester logged',
      done: (gradeHistory?.length ?? 0) >= 1,
      detail: gradeHistory?.length ? `${gradeHistory.length} term${gradeHistory.length === 1 ? '' : 's'}` : 'Add grades',
      page: 'semester-journey',
      weight: 10,
      group: 'setup',
    },
    {
      id: 'semester-full',
      label: 'Full semester history',
      done: !needsMoreSemesterHistory(profile, gradeHistory?.length ?? 0),
      detail: needsMoreSemesterHistory(profile, gradeHistory?.length ?? 0) ? 'Add past terms' : 'Complete',
      page: 'semester-journey',
      weight: 5,
      group: 'setup',
      optional: true,
    },
    {
      id: 'focus-course',
      label: 'Focus course',
      done: courses.length > 0,
      detail: courses.length ? `${courses.length} active` : 'Choose a course',
      page: 'courses',
      weight: 10,
      group: 'setup',
    },
    {
      id: 'first-task',
      label: 'First daily task',
      done: metrics.tasksCompleted >= 1,
      detail: metrics.tasksCompleted ? 'Done' : 'Start today\'s task',
      page: 'dashboard',
      weight: 10,
      group: 'setup',
    },
    {
      id: 'habits',
      label: 'Personalise your plan',
      done: countDeferredHabitsRemaining(profile) === 0,
      detail: countDeferredHabitsRemaining(profile) > 0
        ? `${countDeferredHabitsRemaining(profile)} quick questions left`
        : 'Complete',
      page: 'dashboard',
      weight: 10,
      group: 'setup',
    },
    {
      id: 'flashcards-start',
      label: 'Start flashcard recall',
      done: (flashcardStats?.total ?? 0) > 0,
      detail: flashcardStats?.total ? `${flashcardStats.total} cards` : 'Review or add cards',
      page: 'flashcards',
      weight: 10,
      group: 'setup',
    },
  ];

  const setupActive = setupItems.filter((s) => !s.optional);
  const setupDoneWeight = setupActive.reduce((sum, s) => sum + (s.done ? s.weight : 0), 0);
  const setupTotalWeight = setupActive.reduce((sum, s) => sum + s.weight, 0);
  const setupPct = setupTotalWeight > 0 ? Math.round((setupDoneWeight / setupTotalWeight) * 100) : 0;

  const sections = [
    ...setupItems,
    {
      id: 'conditioning',
      label: 'Daily conditioning',
      done: metrics.tasksCompleted >= 3 || streak.current >= 3,
      detail: `${metrics.tasksCompleted} tasks · ${streak.current} day streak`,
      weight: 20,
      progress: taskPct,
      group: 'conditioning',
    },
    {
      id: 'recall',
      label: 'Flashcard mastery',
      done: (flashcardStats?.mastered ?? 0) > 0 || (flashcardStats?.total ?? 0) > 5,
      detail: flashcardStats?.total ? `${flashcardStats.mastered} mastered` : 'Not started',
      weight: 15,
      group: 'conditioning',
    },
    {
      id: 'wellness',
      label: 'Wellness check-ins',
      done: wellnessLogCount >= 3,
      detail: wellnessLogCount ? `${wellnessLogCount} logged` : 'Optional',
      weight: 10,
      optional: !enabledTools?.includes('habit-tracker'),
      group: 'conditioning',
    },
    {
      id: 'projects',
      label: 'Portfolio projects',
      done: projectsUnlocked,
      detail: projectsUnlocked ? 'Unlocked' : 'Build consistency to unlock',
      weight: 10,
      optional: !enabledTools?.includes('projects'),
      group: 'conditioning',
    },
  ];

  const conditioningSections = sections.filter((s) => s.group === 'conditioning' && !s.optional);
  const doneWeight = conditioningSections.reduce((sum, s) => sum + (s.done ? s.weight : 0), 0);
  const totalWeight = conditioningSections.reduce((sum, s) => sum + s.weight, 0);
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
    setupItems,
    setupPct,
    overallPct,
    taskPct,
    completionRate: Math.round((metrics.completionRate ?? 0) * 100),
  };
}
