export const MILESTONE_TEMPLATE = [
  { title: 'Scope & Research', desc: 'Define the problem space, gather references, and establish success criteria.' },
  { title: 'Framework Design', desc: 'Build the structural backbone: architecture, outline, or methodology.' },
  { title: 'Core Build', desc: 'Execute the primary deliverable. Focus on substance over polish.' },
  { title: 'Iteration & Testing', desc: 'Stress-test your output. Identify weaknesses and refine.' },
  { title: 'Documentation', desc: 'Write the narrative that makes your work legible to others.' },
  { title: 'Portfolio Packaging', desc: 'Format, present, and prepare your output for external review.' },
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

function buildProject(course, topic, templateKey, index) {
  const template = PROJECT_TEMPLATES[templateKey];
  const mastery = topic.masteryLevel ?? 0;
  const weeks = weeksForMastery(mastery);
  const milestones = MILESTONE_TEMPLATE.map((m, i) => ({
    ...m,
    week: i === MILESTONE_TEMPLATE.length - 1 ? `Week ${weeks}` : `Week ${Math.ceil(((i + 1) * weeks) / MILESTONE_TEMPLATE.length)}`,
  }));

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
 * Generate up to 3 course-tailored projects focused on weak topics the user wants to improve.
 */
export function generateCourseProjects(courses, weakTopics) {
  if (!courses.length) return [];

  const focusTopics = (weakTopics.length > 0 ? weakTopics : courses.flatMap((c) => c.topics.map((t) => ({ ...t, courseId: c.courseId, courseCode: c.code, courseName: c.name }))))
    .sort((a, b) => (a.masteryLevel ?? 0) - (b.masteryLevel ?? 0))
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
  }));
}

export function resolveProjectMilestones(project) {
  if (Array.isArray(project?.milestones) && project.milestones.length > 0) {
    return project.milestones;
  }
  return defaultMilestones(project?.timeline);
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
