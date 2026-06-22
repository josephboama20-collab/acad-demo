import { getLearningResources } from './learningResources.js';

export const MILESTONE_TEMPLATE = [
  {
    title: 'Scope & Research',
    desc: 'Define the problem space, gather references, and establish success criteria.',
    tasks: ['Write a one-paragraph problem statement', 'Collect at least three credible sources', 'List what “done” looks like for this piece'],
  },
  {
    title: 'Framework Design',
    desc: 'Build the structural backbone: architecture, outline, or methodology.',
    tasks: ['Draft a section outline or diagram', 'Identify the core argument or model', 'Note gaps you still need to research'],
  },
  {
    title: 'Core Build',
    desc: 'Execute the primary deliverable. Focus on substance over polish.',
    tasks: ['Complete the main analysis, build, or write-up', 'Work in focused blocks outside Acad', 'Capture screenshots or notes as you go'],
  },
  {
    title: 'Iteration & Testing',
    desc: 'Stress-test your output. Identify weaknesses and refine.',
    tasks: ['Review against your success criteria', 'Fix weak sections or calculations', 'Ask a peer or rubric to stress-test it'],
  },
  {
    title: 'Documentation',
    desc: 'Write the narrative that makes your work legible to others.',
    tasks: ['Write a short process log', 'Explain decisions and trade-offs', 'Link or attach your sources'],
  },
  {
    title: 'Portfolio Packaging',
    desc: 'Format, present, and prepare your output for external review.',
    tasks: ['Export to PDF or slide deck', 'Write a 3-sentence summary', 'Store the final artifact where you keep portfolio work'],
  },
];

const PROJECT_TEMPLATES = {
  analysis: {
    titleSuffix: 'Applied Analysis',
    objective: (topic) => `Produce a rigorous analysis demonstrating your understanding of ${topic}.`,
    outcome: (topic) => `A documented analysis of ${topic} with evidence, diagrams, and clear recommendations.`,
    portfolio: 'Shows you can apply course concepts to a real problem, ideal for portfolios and interviews.',
    principle: 'Evidence-Based Reasoning',
    why: 'Structured analysis proves depth of understanding beyond recall.',
  },
  portfolio: {
    titleSuffix: 'Portfolio Piece',
    objective: (topic) => `Build a portfolio-ready deliverable that showcases mastery of ${topic}.`,
    outcome: (topic) => `A polished artifact centered on ${topic} with process documentation.`,
    portfolio: 'External reviewers can evaluate your thinking without a test environment.',
    principle: 'Demonstrated Competence',
    why: 'Portfolio work signals readiness better than self-reported confidence.',
  },
  synthesis: {
    titleSuffix: 'Concept Synthesis',
    objective: (topic) => `Synthesize key ideas from ${topic} into an original framework or explanation.`,
    outcome: (topic) => `An original synthesis connecting ${topic} to broader themes in your course.`,
    portfolio: 'Demonstrates integrative thinking across topics you are improving.',
    principle: 'Integrative Learning',
    why: 'Synthesis reveals whether knowledge is connected or fragmented.',
  },
};

function weeksForMastery(mastery) {
  if (mastery < 40) return 4;
  if (mastery < 60) return 3;
  return 2;
}

function attachStepResources(milestones, topicName, courseCode) {
  const pool = getLearningResources(topicName, courseCode);
  return milestones.map((m, i) => ({
    ...m,
    resources: [pool[i % pool.length], pool[(i + 1) % pool.length]].filter(Boolean),
  }));
}

function buildProject(course, topic, templateKey, index) {
  const template = PROJECT_TEMPLATES[templateKey];
  const mastery = topic.masteryLevel ?? 0;
  const weeks = weeksForMastery(mastery);
  const milestones = attachStepResources(
    MILESTONE_TEMPLATE.map((m, i) => ({
      ...m,
      week: i === MILESTONE_TEMPLATE.length - 1 ? `Week ${weeks}` : `Week ${Math.ceil(((i + 1) * weeks) / MILESTONE_TEMPLATE.length)}`,
    })),
    topic.name,
    course.code,
  );

  return {
    id: `${course.courseId}-${topic.topicId || topic.name}-${index}`,
    title: `${course.code}: ${topic.name} ${template.titleSuffix}`,
    objective: template.objective(topic.name),
    outcome: template.outcome(topic.name),
    portfolio: template.portfolio,
    principle: template.principle,
    why: template.why,
    domain: course.name,
    skillFocus: topic.name,
    difficulty: mastery < 40 ? 'Foundational' : mastery < 65 ? 'Intermediate' : 'Advanced',
    courseCode: course.code,
    topicName: topic.name,
    focusMastery: mastery,
    timeline: `${weeks} week${weeks === 1 ? '' : 's'}`,
    milestones,
    generatedAt: Date.now(),
  };
}

/**
 * Generate up to 3 course-tailored projects focused on weak topics.
 * If semesterDeltas are provided (array of delta objects from semesterUtils.computeDeltas),
 * regressed topics are boosted to the front so projects target historical weak points.
 */
export function generateCourseProjects(courses, weakTopics, semesterDeltas = []) {
  if (!courses.length) return [];

  // Build a regression boost map: topicId → absolute regression magnitude
  const regressionBoost = new Map();
  semesterDeltas.forEach((d) => {
    if (d.delta < -3) {
      regressionBoost.set(`${d.courseId}:${d.topicId}`, Math.abs(d.delta));
    }
  });

  const pool = (weakTopics.length > 0
    ? weakTopics
    : courses.flatMap((c) => c.topics.map((t) => ({ ...t, courseId: c.courseId, courseCode: c.code, courseName: c.name })))
  ).map((t) => ({
    ...t,
    _regressionBoost: regressionBoost.get(`${t.courseId}:${t.topicId}`) ?? 0,
  }));

  // Sort: regressed first (by boost desc), then by mastery asc
  const focusTopics = pool
    .sort((a, b) => {
      if (b._regressionBoost !== a._regressionBoost) return b._regressionBoost - a._regressionBoost;
      return (a.masteryLevel ?? 0) - (b.masteryLevel ?? 0);
    })
    .slice(0, 3);

  const templateKeys = ['analysis', 'portfolio', 'synthesis'];

  return focusTopics.map((topic, i) => {
    const course = courses.find((c) => c.courseId === topic.courseId) || courses[0];
    return buildProject(course, topic, templateKeys[i % templateKeys.length], i);
  });
}

export function defaultMilestones(timeline = '4 weeks') {
  const weeks = parseInt(timeline, 10) || 4;
  return MILESTONE_TEMPLATE.map((m, i) => ({
    ...m,
    week: i === MILESTONE_TEMPLATE.length - 1 ? `Week ${weeks}` : `Week ${Math.ceil(((i + 1) * weeks) / MILESTONE_TEMPLATE.length)}`,
    resources: [],
  }));
}

export function resolveProjectMilestones(project) {
  if (Array.isArray(project?.milestones) && project.milestones.length > 0) {
    return project.milestones;
  }
  return defaultMilestones(project?.timeline);
}

/** Map guide steps across the student's comeback plan timeline. */
export function buildProjectGuideSchedule(project, planTimeline) {
  const milestones = resolveProjectMilestones(project);
  const totalWeeks = Math.max(1, Math.round(planTimeline.totalDays / 7));
  const currentWeek = Math.min(totalWeeks, Math.max(1, Math.floor(planTimeline.daysElapsed / 7) + 1));
  const startWeek = planTimeline.isEnded ? 1 : currentWeek;
  const spanWeeks = planTimeline.isEnded ? totalWeeks : Math.max(1, totalWeeks - startWeek + 1);

  return milestones.map((m, i) => {
    const planWeekStart = Math.min(totalWeeks, startWeek + Math.floor((i * spanWeeks) / milestones.length));
    const planWeekEnd = Math.min(
      totalWeeks,
      Math.max(planWeekStart, startWeek + Math.floor(((i + 1) * spanWeeks) / milestones.length) - 1),
    );
    const phase = planWeekEnd < currentWeek ? 'past' : planWeekStart <= currentWeek ? 'current' : 'upcoming';
    const planWeekLabel =
      planWeekStart === planWeekEnd ? `Plan week ${planWeekStart}` : `Plan weeks ${planWeekStart}–${planWeekEnd}`;

    return {
      ...m,
      stepIndex: i,
      planWeekStart,
      planWeekEnd,
      planWeekLabel,
      phase,
    };
  });
}

export function fetchCourseProjects(courses, weakTopics) {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ data: generateCourseProjects(courses, weakTopics), source: 'course-adaptive' }), 1400);
  });
}

// Legacy exports for forge compatibility
export const DOMAINS = [];
export const SKILLS = [];
export const DIFFICULTIES = [];
export const DIFF_HINTS = {};

export function generateProject() {
  return null;
}

export function fetchProject() {
  return Promise.resolve({ data: null, source: 'deprecated' });
}
