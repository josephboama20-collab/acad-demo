import { SAMPLE_COURSES, SAMPLE_FLASHCARDS } from './constants.js';
import { STORAGE_KEYS, uid } from '../utils/storage.js';
import { saveForgeWorkspace } from '../utils/forgeStorage.js';

/** Shared password for every plan demo account. */
export const PLAN_DEMO_PASSWORD = 'demo';

const BASE_PROFILE = {
  effort: 'Moderate: steady and structured',
  time: '1–2 hours / day',
  position: 'Maintaining what I have',
  sharpness: 'Somewhat sharp, manageable',
  focus: 'Technology & systems',
  intention: 'Stay sharp during a break',
  startedAt: new Date(Date.now() - 45 * 86400000).toISOString(),
};

const EXTRA_COURSE_TEMPLATES = [
  {
    code: 'PHYS',
    name: 'Physics Core',
    topics: [
      { name: 'Kinematics', importance: 'high', masteryLevel: 58, lastStudied: null },
      { name: 'Forces', importance: 'high', masteryLevel: 51, lastStudied: null },
      { name: 'Energy', importance: 'medium', masteryLevel: 64, lastStudied: null },
    ],
  },
  {
    code: 'CHEM',
    name: 'Chemistry Basics',
    topics: [
      { name: 'Atomic Structure', importance: 'high', masteryLevel: 49, lastStudied: null },
      { name: 'Bonding', importance: 'medium', masteryLevel: 55, lastStudied: null },
    ],
  },
  {
    code: 'WRIT',
    name: 'Writing & Argument',
    topics: [
      { name: 'Thesis & Structure', importance: 'high', masteryLevel: 72, lastStudied: null },
      { name: 'Evidence & Citation', importance: 'medium', masteryLevel: 66, lastStudied: null },
    ],
  },
  {
    code: 'DATA',
    name: 'Data Analysis',
    topics: [
      { name: 'Descriptive Stats', importance: 'high', masteryLevel: 61, lastStudied: null },
      { name: 'Visualization', importance: 'medium', masteryLevel: 54, lastStudied: null },
      { name: 'Inference', importance: 'high', masteryLevel: 47, lastStudied: null },
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

const DEMO_STREAK_HISTORY = [
  1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1,
].map(Boolean);

const ALL_COURSE_TEMPLATES = [...SAMPLE_COURSES, ...EXTRA_COURSE_TEMPLATES];

function cloneCourse(template) {
  return {
    courseId: uid(),
    code: template.code,
    name: template.name,
    topics: template.topics.map((t) => ({
      topicId: uid(),
      name: t.name,
      importance: t.importance || 'medium',
      masteryLevel: t.masteryLevel ?? 0,
      lastStudied: t.lastStudied ?? null,
    })),
  };
}

function coursesForPlan(count) {
  return ALL_COURSE_TEMPLATES.slice(0, count).map(cloneCourse);
}

function demoHabitLogs() {
  const moods = ['sad', 'neutral', 'neutral', 'happy', 'happy', 'great', 'neutral'];
  const logs = [];
  for (let n = 20; n >= 0; n--) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    const energyLevel = Math.max(1, Math.min(5, Math.round(3 + Math.sin(n * 0.6) * 1.5)));
    const studyHours = Math.round((1.8 + (n % 5) * 0.35) * 10) / 10;
    const focusRating = Math.max(1, Math.min(5, Math.round(3 + Math.sin(n * 0.4))));
    const stressLevel = Math.max(1, Math.min(5, Math.round(3 - Math.sin(n * 0.5))));
    logs.push({
      date: d.toISOString().split('T')[0],
      energyLevel,
      stressLevel,
      focusRating,
      mood: moods[n % 7],
      studyHours,
      notes: n === 0 ? 'Reviewed course notes before session.' : '',
      productivityScore: Math.min(100, Math.round(40 + energyLevel * 6 + focusRating * 6 + studyHours * 4 - stressLevel * 3)),
    });
  }
  return logs;
}

function demoProject() {
  return {
    title: 'Systems Analysis Portfolio Piece',
    objective: 'Produce a rigorous analysis of a real-world system using structured frameworks.',
    outcome: 'A documented systems analysis with diagrams, trade-off matrix, and recommendations.',
    portfolio: 'Shows analytical work applicable to engineering and product roles.',
    principle: 'Systems Thinking',
    why: 'Breaking complex systems into components transfers across technical domains.',
    difficulty: 'Intermediate',
    domain: 'Technology',
    skillFocus: 'Analytical',
    timeline: '4 weeks',
    milestones: [
      { title: 'Scope & Research', desc: 'Define the problem space and success criteria.', week: 'Week 1', done: true },
      { title: 'Framework Design', desc: 'Build the structural backbone and methodology.', week: 'Week 2', done: true },
      { title: 'Core Build', desc: 'Execute the primary deliverable.', week: 'Week 3', done: false },
      { title: 'Iteration & Testing', desc: 'Stress-test output and refine.', week: 'Week 3', done: false },
      { title: 'Documentation', desc: 'Write the narrative for external review.', week: 'Week 4', done: false },
      { title: 'Portfolio Packaging', desc: 'Format and present the final piece.', week: 'Week 4', done: false },
    ],
    draftPreview: 'Scope: analyze a local transit routing system',
  };
}

function demoScholar(account) {
  const projects = account.includeProject ? [demoProject()] : [];
  return {
    user: { name: account.name, email: account.email },
    profile: account.profile,
    streak: {
      current: account.id === 'weeks' ? 2 : account.id === '3months' ? 12 : account.id === '2months' ? 8 : 4,
      best: account.id === '3months' ? 12 : 7,
      lastActiveDate: new Date().toDateString(),
      history: DEMO_STREAK_HISTORY,
    },
    metrics: {
      tasksCompleted: account.courseCount * 4,
      completionRate: 0.55 + account.courseCount * 0.04,
      activeProjects: projects.length,
      engagementScore: 60 + account.courseCount * 3,
    },
    projects,
    settings: { focusMode: false },
  };
}

function demoGame(account) {
  const base = {
    achievements: ['first_card', 'streak_3', 'habit_first'],
    challengeProgress: {
      fc_review: { progress: 12 + account.courseCount * 2, completed: false },
      streak_5: { progress: account.id === 'weeks' ? 2 : 4, completed: false },
      chat_10: { progress: 4 + account.courseCount, completed: false },
      habit_7: { progress: account.id === 'weeks' ? 3 : 5, completed: false },
      mastered: { progress: account.courseCount, completed: false },
    },
  };
  return { ...base, xp: account.xp };
}

function demoFlashcards() {
  return SAMPLE_FLASHCARDS.map((card, i) => ({
    ...card,
    repetitions: i < 3 ? 6 : i < 5 ? 2 : 0,
    masteryLevel: i < 3 ? 'mastered' : i < 5 ? 'reviewing' : 'learning',
    interval: i < 3 ? 14 : 1,
    nextReview: i < 3 ? new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  }));
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

export function applyPlanSeed(planIdOrEmail) {
  const account = getPlanAccount(planIdOrEmail);
  if (!account) return false;

  const scholar = demoScholar(account);
  localStorage.setItem(STORAGE_KEYS.scholar, JSON.stringify(scholar));
  localStorage.setItem(STORAGE_KEYS.game, JSON.stringify(demoGame(account)));
  localStorage.setItem(STORAGE_KEYS.courses, JSON.stringify(coursesForPlan(account.courseCount)));
  localStorage.setItem(STORAGE_KEYS.flashcards, JSON.stringify(demoFlashcards()));
  localStorage.setItem(STORAGE_KEYS.habits, JSON.stringify(demoHabitLogs()));

  const project = scholar.projects[0];
  if (project) {
    saveForgeWorkspace(project.title, {
      draft: 'Scope: analyze a local transit routing system.\n\nWeek 1 notes: mapped peak-hour demand between key stops and the central hub.',
      milestones: { 0: true, 1: true },
    });
  }

  window.location.reload();
  return true;
}

/** Opens the default 1-month plan demo. */
export function applyDemoSeed() {
  applyPlanSeed('1month');
}
