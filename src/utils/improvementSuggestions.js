/**
 * Derive improvement-focus courses from semester grade history.
 */

function gradeScore(letter, gradePoints) {
  if (gradePoints[letter] !== undefined) return gradePoints[letter];
  return 2;
}

function buildReason(letter, points, avgPoints) {
  if (points <= 1) return `Grade ${letter} — foundational recovery recommended`;
  if (points < avgPoints - 0.5) return `Grade ${letter} — below your recent average; high improvement potential`;
  if (points < avgPoints) return `Grade ${letter} — room to strengthen before the next term`;
  return `Grade ${letter} — keep building consistency`;
}

/**
 * Analyze graded courses across semester history and rank by improvement need.
 */
export function deriveImprovementSuggestions(semesterHistory, gradePoints = {}, maxCourses = 2) {
  const graded = [];

  (semesterHistory || []).forEach((sem) => {
    (sem.courses || []).forEach((c) => {
      if (!c.grade) return;
      graded.push({
        code: c.code,
        name: c.name,
        grade: c.grade,
        credits: c.credits,
        semesterLabel: sem.label,
        points: gradeScore(c.grade, gradePoints),
      });
    });
  });

  if (graded.length === 0) return { pattern: null, suggestions: [] };

  const avgPoints = graded.reduce((s, c) => s + c.points, 0) / graded.length;
  const weakCount = graded.filter((c) => c.points < avgPoints).length;
  const strongCount = graded.length - weakCount;

  let pattern;
  if (avgPoints <= 1.5) {
    pattern = 'Your recent grades show several courses needing foundational recovery — Acad will pace gently and rebuild core understanding.';
  } else if (weakCount > strongCount) {
    pattern = 'More courses fell below your average than above it — targeted improvement on weaker areas will lift your next semester most.';
  } else if (weakCount > 0) {
    pattern = 'You have a solid base with specific courses that can still move up — focusing on those yields the best return before the next term.';
  } else {
    pattern = 'Your grades are consistent — even strong students benefit from sharpening key courses before they compound into the next semester.';
  }

  const ranked = [...graded]
    .sort((a, b) => a.points - b.points || a.code.localeCompare(b.code))
    .map((c, i) => ({
      code: c.code,
      name: c.name,
      grade: c.grade,
      semesterLabel: c.semesterLabel,
      reason: buildReason(c.grade, c.points, avgPoints),
      priority: i + 1,
    }));

  const seen = new Set();
  const suggestions = [];
  for (const item of ranked) {
    if (seen.has(item.code)) continue;
    seen.add(item.code);
    suggestions.push(item);
    if (suggestions.length >= maxCourses) break;
  }

  return { pattern, suggestions, avgPoints: Number(avgPoints.toFixed(2)) };
}

/**
 * Build semester history array from onboarding state (mirrors Onboarding.finish).
 */
export function buildSemesterHistoryFromOnboarding({
  steps,
  semesterGrades,
  customCoursesByStep,
  getStepCourses,
  gradePoints,
  computeGpa,
}) {
  const semesterHistory = [];
  steps
    .filter((s) => s.type === 'semesterGrades')
    .forEach((s) => {
      const grades = semesterGrades[s.id] || {};
      const customs = customCoursesByStep[s.id] || [];
      const allCourseDefs = [...getStepCourses(s), ...customs];
      const courses = allCourseDefs
        .filter((c) => grades[c.code])
        .map((c) => ({ code: c.code, name: c.name, grade: grades[c.code], credits: c.credits }));
      if (courses.length === 0) return;
      semesterHistory.push({
        label: s.label,
        level: s.level,
        semester: s.semester,
        courses,
        gpa: computeGpa(courses, gradePoints),
      });
    });
  return semesterHistory;
}
