/**
 * Acad comeback plan: scales course limits and tool access by available time.
 * Focused vacation / break training, not open-ended learning.
 */

export const TOOL_KEYS = {
  dashboard: 'dashboard',
  courses: 'courses',
  flashcards: 'flashcards',
  aiBuddy: 'ai-buddy',
  semesterJourney: 'semester-journey',
  wellness: 'habit-tracker',
  reports: 'reports',
  challenges: 'challenges',
  projects: 'projects',
  forge: 'forge',
  studyRoom: 'study-room',
  studyGroups: 'study-groups',
};

/** Tools always reachable before any course is added */
export const PRE_COURSE_TOOLS = [
  TOOL_KEYS.dashboard,
  TOOL_KEYS.courses,
  TOOL_KEYS.semesterJourney,
];

/** Tier definitions, ordered from most to least essential */
export const TOOL_TIERS = {
  essential: [TOOL_KEYS.dashboard, TOOL_KEYS.courses, TOOL_KEYS.flashcards, TOOL_KEYS.aiBuddy, TOOL_KEYS.semesterJourney],
  core: [TOOL_KEYS.wellness, TOOL_KEYS.reports],
  extended: [TOOL_KEYS.projects, TOOL_KEYS.forge, TOOL_KEYS.studyGroups],
  optional: [],
};

export const DURATION_OPTIONS = [
  { value: '2–3 weeks', weeks: 2.5, label: '2–3 weeks', tier: 'minimal' },
  { value: '1 month (4 weeks)', weeks: 4, label: '1 month', tier: 'short' },
  { value: '2 months (8 weeks)', weeks: 8, label: '2 months', tier: 'medium' },
  { value: '3 months (12+ weeks)', weeks: 12, label: '3 months', tier: 'full' },
];

/** Max courses by duration tier; 3 months is the ceiling */
const MAX_COURSES_BY_TIER = {
  minimal: 1,
  short: 2,
  medium: 4,
  full: 6,
};

const LEGACY_BREAK_MAP = {
  '2–4 weeks': '2–3 weeks',
  '4–6 weeks': '1 month (4 weeks)',
  '6–10 weeks': '2 months (8 weeks)',
  'More than 10 weeks': '3 months (12+ weeks)',
};

const LEGACY_DURATION_MAP = {
  '~1 month (4 weeks)': '1 month (4 weeks)',
  '~2 months (8 weeks)': '2 months (8 weeks)',
  '~3 months (12+ weeks)': '3 months (12+ weeks)',
};

/**
 * Normalize duration from profile (supports legacy `break` and tilde-prefixed values).
 */
export function resolveDurationValue(profile) {
  const raw = profile?.duration || profile?.break;
  if (!raw) return DURATION_OPTIONS[1].value;
  if (LEGACY_BREAK_MAP[raw]) return LEGACY_BREAK_MAP[raw];
  if (LEGACY_DURATION_MAP[raw]) return LEGACY_DURATION_MAP[raw];
  const match = DURATION_OPTIONS.find((d) => d.value === raw);
  return match ? match.value : DURATION_OPTIONS[1].value;
}

export function getDurationMeta(profile) {
  const value = resolveDurationValue(profile);
  const option = DURATION_OPTIONS.find((d) => d.value === value) ?? DURATION_OPTIONS[1];
  return { ...option, value };
}

export function getMaxCourses(profile) {
  const { tier } = getDurationMeta(profile);
  return MAX_COURSES_BY_TIER[tier] ?? MAX_COURSES_BY_TIER.short;
}

/**
 * Which tool page keys are enabled for this profile and course count.
 */
export function getEnabledTools(profile, courseCount = 0) {
  const { tier } = getDurationMeta(profile);

  if (courseCount === 0) {
    return [...PRE_COURSE_TOOLS];
  }

  const enabled = new Set(TOOL_TIERS.essential);

  if (tier === 'minimal') {
    return [...enabled];
  }

  if (tier === 'short') {
    TOOL_TIERS.core.forEach((t) => enabled.add(t));
    return [...enabled];
  }

  if (tier === 'medium') {
    [...TOOL_TIERS.core, ...TOOL_TIERS.extended].forEach((t) => enabled.add(t));
    return [...enabled];
  }

  // full (3 months)
  [...TOOL_TIERS.core, ...TOOL_TIERS.extended, ...TOOL_TIERS.optional].forEach((t) => enabled.add(t));
  return [...enabled];
}

export function isToolEnabled(profile, courseCount, toolKey) {
  return getEnabledTools(profile, courseCount).includes(toolKey);
}

export function canAddCourse(profile, currentCount) {
  return currentCount < getMaxCourses(profile);
}

export function getPlanSummary(profile, courseCount = 0) {
  const meta = getDurationMeta(profile);
  const maxCourses = getMaxCourses(profile);
  const enabled = getEnabledTools(profile, courseCount);
  const slotsLeft = Math.max(0, maxCourses - courseCount);

  const tierMessages = {
    minimal:
      'Short window: essentials only. One course, flashcards, and guided recall. Acad is less effective under a month; we keep the stack tight.',
    short:
      'One-month plan: up to two courses plus wellness tracking and progress reports.',
    medium:
      'Two-month plan: up to four courses with portfolio project work unlocked.',
    full:
      'Three-month plan: full toolkit for up to six courses including study groups.',
  };

  return {
    durationLabel: meta.label,
    durationWeeks: meta.weeks,
    tier: meta.tier,
    maxCourses,
    courseCount,
    slotsLeft,
    enabledTools: enabled,
    message: tierMessages[meta.tier],
    atCourseLimit: courseCount >= maxCourses,
    needsCourses: courseCount === 0,
  };
}
