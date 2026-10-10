import { SAMPLE_COURSES } from './constants.js';
import { STORAGE_KEYS, uid } from '../utils/storage.js';

/** Shared password for every plan demo account. */
export const PLAN_DEMO_PASSWORD = 'demo';

const DEMO_INSTITUTION = 'University of Ghana';
const DEMO_PROGRAM = 'BSc Information Technology';

const BASE_PROFILE = {
  effort: 'Moderate: steady and structured',
  time: '1–2 hours / day',
  position: 'Maintaining what I have',
  sharpness: 'Somewhat sharp, manageable',
  focus: 'Technology & systems',
  intention: 'Stay sharp during a break',
  startedAt: new Date().toISOString(),
};

const EXTRA_COURSE_TEMPLATES = [
  {
    code: 'PHYS',
    name: 'Physics Core',
    topics: [
      { name: 'Kinematics', importance: 'high', masteryLevel: 58 },
      { name: 'Forces', importance: 'high', masteryLevel: 51 },
      { name: 'Energy', importance: 'medium', masteryLevel: 64 },
    ],
  },
  {
    code: 'CHEM',
    name: 'Chemistry Basics',
    topics: [
      { name: 'Atomic Structure', importance: 'high', masteryLevel: 49 },
      { name: 'Bonding', importance: 'medium', masteryLevel: 55 },
    ],
  },
  {
    code: 'WRIT',
    name: 'Writing & Argument',
    topics: [
      { name: 'Thesis & Structure', importance: 'high', masteryLevel: 72 },
      { name: 'Evidence & Citation', importance: 'medium', masteryLevel: 66 },
    ],
  },
  {
    code: 'DATA',
    name: 'Data Analysis',
    topics: [
      { name: 'Descriptive Stats', importance: 'high', masteryLevel: 61 },
      { name: 'Visualization', importance: 'medium', masteryLevel: 54 },
      { name: 'Inference', importance: 'high', masteryLevel: 47 },
    ],
  },
  {
    code: 'CS101',
    name: 'Programming Fundamentals',
    topics: [
      { name: 'Variables & Types', importance: 'high', masteryLevel: 68 },
      { name: 'Control Flow', importance: 'high', masteryLevel: 55 },
      { name: 'Functions', importance: 'medium', masteryLevel: 62 },
    ],
  },
  {
    code: 'STAT',
    name: 'Statistics for Sciences',
    topics: [
      { name: 'Probability', importance: 'high', masteryLevel: 44 },
      { name: 'Hypothesis Testing', importance: 'high', masteryLevel: 38 },
    ],
  },
];

export const PLAN_ACCOUNTS = [
  {
    id: 'weeks',
    label: '2–3 weeks',
    tagline: '1 course · essentials',
    email: 'weeks@acad.app',
    password: PLAN_DEMO_PASSWORD,
    name: 'Alex Weeks',
    profile: { ...BASE_PROFILE, duration: '2–3 weeks', intention: 'Recover lost momentum' },
    courseCount: 1,
    includeProject: false,
    xp: 420,
  },
  {
    id: '1month',
    label: '1 month',
    tagline: '2 courses · reports & wellness',
    email: '1month@acad.app',
    password: PLAN_DEMO_PASSWORD,
    name: 'Jordan Asante',
    profile: { ...BASE_PROFILE, duration: '1 month (4 weeks)' },
    courseCount: 2,
    includeProject: false,
    xp: 1240,
  },
  {
    id: '2months',
    label: '2 months',
    tagline: '4 courses · projects & challenges',
    email: '2months@acad.app',
    password: PLAN_DEMO_PASSWORD,
    name: 'Sam Okafor',
    profile: { ...BASE_PROFILE, duration: '2 months (8 weeks)', intention: 'Build a portfolio piece' },
    courseCount: 4,
    includeProject: true,
    xp: 2180,
  },
  {
    id: '3months',
    label: '3 months',
    tagline: '6 courses · full toolkit',
    email: '3months@acad.app',
    password: PLAN_DEMO_PASSWORD,
    name: 'Riley Chen',
    profile: { ...BASE_PROFILE, duration: '3 months (12+ weeks)', intention: 'Prepare for what comes next' },
    courseCount: 6,
    includeProject: true,
    xp: 3420,
  },
];

/** @deprecated Use PLAN_ACCOUNTS[1] or 1month@acad.app */
export const DEMO_CREDENTIALS = {
  email: '1month@acad.app',
  password: PLAN_DEMO_PASSWORD,
  name: PLAN_ACCOUNTS[1].name,
};

const ALL_COURSE_TEMPLATES = [...SAMPLE_COURSES, ...EXTRA_COURSE_TEMPLATES];

function demoAcademicProfile() {
  return {
    institutionName: DEMO_INSTITUTION,
    programName: DEMO_PROGRAM,
    trackType: 'single',
    country: 'Ghana',
    currentLevel: 200,
    currentSemester: 1,
    gradingScale: {
      label: 'Letter grades (A–F)',
      letters: ['A', 'B', 'C', 'D', 'F'],
      gradePoints: { A: 4, B: 3, C: 2, D: 1, F: 0 },
    },
    adaptationNotes: 'Demo account with sample courses for staging walkthroughs.',
    semesterHistory: [],
    curriculum: {},
  };
}

function cloneCourseForDemo(template, index) {
  const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
  return {
    courseId: uid(),
    code: template.code,
    name: template.name,
    topics: template.topics.map((t, topicIdx) => ({
      topicId: uid(),
      name: t.name,
      importance: t.importance || 'medium',
      masteryLevel: t.masteryLevel ?? Math.max(35, 70 - index * 6 - topicIdx * 4),
      lastStudied: daysAgo(2 + index + topicIdx),
    })),
  };
}

function coursesForPlan(count) {
  return ALL_COURSE_TEMPLATES.slice(0, count).map(cloneCourseForDemo);
}

function demoFlashcardsForCourses(courses) {
  const today = new Date().toISOString().split('T')[0];
  const cards = [];
  courses.forEach((course, courseIdx) => {
    course.topics.slice(0, 2).forEach((topic, topicIdx) => {
      const dueToday = courseIdx === 0 && topicIdx === 0;
      cards.push({
        cardId: uid(),
        front: `Explain ${topic.name} in your own words.`,
        back: `Key ideas from ${course.name} (${course.code}). Review your notes and examples.`,
        subject: course.code,
        easeFactor: 2.5,
        interval: dueToday ? 1 : 3,
        repetitions: dueToday ? 0 : 1,
        nextReview: dueToday ? today : new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        lastReviewed: dueToday ? null : new Date(Date.now() - 86400000).toISOString().split('T')[0],
        masteryLevel: dueToday ? 'learning' : 'reviewing',
        createdAt: new Date().toISOString(),
      });
    });
  });
  return cards;
}

function demoBaselineHistory(courses) {
  const baselineCourses = courses.slice(0, Math.min(2, courses.length)).map((c, i) => ({
    code: c.code,
    name: c.name,
    credits: 3,
    grade: i === 0 ? 'B' : 'C',
  }));
  if (baselineCourses.length === 0) return [];
  return [
    {
      id: 'demo-l100-s2',
      label: 'Level 100 · Semester 2',
      level: 100,
      semester: 2,
      capturedAt: new Date(Date.now() - 120 * 86400000).toISOString(),
      courses: baselineCourses,
      gpa: 2.5,
      status: 'baseline',
      delta: 0,
      comparedTo: null,
    },
  ];
}

function demoHabitLogs() {
  const day = (offset) => new Date(Date.now() - offset * 86400000).toISOString().split('T')[0];
  return [
    { date: day(1), energyLevel: 3, stressLevel: 2, focusRating: 4, mood: 'happy', studyHours: 2, notes: 'Reviewed flashcards', productivityScore: 72 },
    { date: day(3), energyLevel: 4, stressLevel: 2, focusRating: 3, mood: 'neutral', studyHours: 1.5, notes: 'Course reading', productivityScore: 65 },
  ];
}

function streakHistory(activeDays = 3) {
  const hist = Array.from({ length: 42 }, () => false);
  for (let i = 0; i < activeDays; i += 1) {
    hist[41 - i] = true;
  }
  return hist;
}

function demoScholar(account, academicProfile) {
  const today = new Date().toDateString();
  return {
    user: { name: account.name, email: account.email },
    profile: {
      ...account.profile,
      startedAt: new Date().toISOString(),
      academicProfile,
    },
    streak: {
      current: 3,
      best: 5,
      lastActiveDate: today,
      history: streakHistory(3),
    },
    metrics: {
      tasksCompleted: 4,
      completionRate: 0.16,
      activeProjects: 0,
      engagementScore: 32,
    },
    projects: [],
    settings: { focusMode: false },
  };
}

function demoGame(account) {
  return {
    achievements: [],
    challengeProgress: {},
    xp: account.xp ?? 0,
  };
}

export function getPlanAccount(emailOrId) {
  const key = (emailOrId || '').trim().toLowerCase();
  return (
    PLAN_ACCOUNTS.find((a) => a.id === key) ||
    PLAN_ACCOUNTS.find((a) => a.email === key) ||
    (key === 'demo@acad.app' ? PLAN_ACCOUNTS.find((a) => a.id === '1month') : null)
  );
}

export function isPlanLogin(email, password) {
  const account = getPlanAccount(email);
  return Boolean(account && password === account.password);
}

/** @deprecated Use isPlanLogin */
export function isDemoLogin(email, password) {
  return isPlanLogin(email, password);
}

export function buildPlanSeed(planIdOrEmail) {
  const account = getPlanAccount(planIdOrEmail);
  if (!account) return null;

  const academicProfile = demoAcademicProfile();
  const courses = coursesForPlan(account.courseCount);
  const flashcards = demoFlashcardsForCourses(courses);
  const gradeHistory = demoBaselineHistory(courses);
  const scholar = demoScholar(account, academicProfile);
  const game = demoGame(account);
  const habits = demoHabitLogs();
  const forge = {};
  const semesters = {
    currentSemesterId: null,
    semesters: [],
    snapshots: {},
    gradeHistory,
    academicProfile,
    continuingStudent: true,
    progressionStatus: 'continuing',
  };

  return { scholar, game, courses, flashcards, habits, forge, semesters, account };
}

export function writePlanSeedToLocal(seed) {
  localStorage.setItem(STORAGE_KEYS.scholar, JSON.stringify(seed.scholar));
  localStorage.setItem(STORAGE_KEYS.game, JSON.stringify(seed.game));
  localStorage.setItem(STORAGE_KEYS.courses, JSON.stringify(seed.courses));
  localStorage.setItem(STORAGE_KEYS.flashcards, JSON.stringify(seed.flashcards));
  localStorage.setItem(STORAGE_KEYS.habits, JSON.stringify(seed.habits));
  localStorage.setItem(STORAGE_KEYS.forgeWork, JSON.stringify(seed.forge));
  if (seed.semesters) {
    localStorage.setItem(STORAGE_KEYS.semesters, JSON.stringify(seed.semesters));
  }
}

export function applyPlanSeed(planIdOrEmail) {
  const seed = buildPlanSeed(planIdOrEmail);
  if (!seed) return false;
  writePlanSeedToLocal(seed);
  window.location.reload();
  return true;
}

/** Opens the default 1-month plan demo. */
export function applyDemoSeed() {
  applyPlanSeed('1month');
}
