/**
 * Validation for honest, accurate academic setup during onboarding.
 */

export function validateInstitutionName(value) {
  const v = (value || '').trim();
  if (v.length < 4) {
    return { ok: false, message: 'Enter your full university name (at least 4 characters).' };
  }
  if (v === v.toLowerCase()) {
    return {
      ok: false,
      message: 'Use proper capitalization — e.g. "University of Ghana", not "university of ghana".',
    };
  }
  if (!/[A-Z]/.test(v)) {
    return { ok: false, message: 'Capitalize your university name so AI can identify it accurately.' };
  }
  return { ok: true };
}

export function validateProgramName(value) {
  const v = (value || '').trim();
  if (v.length < 5) {
    return { ok: false, message: 'Enter your full programme or degree name (at least 5 characters).' };
  }
  if (v === v.toLowerCase()) {
    return {
      ok: false,
      message: 'Use proper capitalization — e.g. "BSc Information Technology", not "bsc information technology".',
    };
  }
  if (!/[A-Z]/.test(v)) {
    return { ok: false, message: 'Capitalize your programme name so AI can map your curriculum.' };
  }
  return { ok: true };
}

export function countGradedCoursesInStep(semesterGrades, stepId) {
  return Object.keys(semesterGrades?.[stepId] || {}).length;
}

/**
 * Acad conditions you between semesters — at least one completed semester of graded work is required.
 * A "semester of work" means at least 3 courses graded in a single term.
 */
export function minimumSemesterHistoryRequirement(semesterGrades, steps) {
  const gradeSteps = (steps || []).filter((s) => s.type === 'semesterGrades');
  if (gradeSteps.length === 0) {
    return {
      ok: false,
      message: 'Enter grades for at least one completed semester before continuing. Acad needs your academic history to condition what comes next.',
    };
  }

  const hasSemester = gradeSteps.some((step) => countGradedCoursesInStep(semesterGrades, step.id) >= 3);

  if (!hasSemester) {
    return {
      ok: false,
      message: 'Enter grades for at least one full semester (minimum 3 courses in a single term). University courses compound — history is how Acad knows where to start.',
    };
  }

  return { ok: true };
}

export function hasMinimumAcademicSetup(answers, learnedProfile, aiLearnDone, profileReviewConfirmed) {
  if (!aiLearnDone || !learnedProfile) return false;
  if (!profileReviewConfirmed) return false;
  if (!answers.country || !answers.trackType || !answers.studentPath) return false;

  const uni = validateInstitutionName(answers.universityName);
  const prog = validateProgramName(answers.programName);
  if (!uni.ok || !prog.ok) return false;

  if (answers.trackType === 'Combined major' && !(answers.secondaryProgram || '').trim()) {
    return false;
  }

  return true;
}

/** @deprecated use minimumSemesterHistoryRequirement */
export function continuingStudentGradeRequirement(semesterGrades, _studentPath, steps) {
  return minimumSemesterHistoryRequirement(semesterGrades, steps);
}
