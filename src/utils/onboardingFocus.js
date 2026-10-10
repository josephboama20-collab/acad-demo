import { deriveImprovementSuggestions } from './improvementSuggestions.js';
import { getSemesterCoursesFromProfile } from './academicProfileUtils.js';

export function buildOnboardingFocus({ history, gradePoints, limit, academicProfile, level = 100, semester = 1 }) {
  const graded = deriveImprovementSuggestions(history, gradePoints, limit);
  if ((history || []).some((entry) => entry.courses?.length)) return graded;
  const courses = getSemesterCoursesFromProfile(academicProfile, level, semester);
  return {
    pattern: 'No completed university grades are available. Choose preparation courses from the reviewed curriculum or enter your own; these are not inferred weaknesses.',
    suggestions: courses.slice(0, limit).map((course) => ({
      code: course.code,
      name: course.name,
      semesterLabel: `Level ${level}, Semester ${semester}`,
      reason: 'Current programme course; no prior grade or assessed mastery is assumed.',
    })),
  };
}
