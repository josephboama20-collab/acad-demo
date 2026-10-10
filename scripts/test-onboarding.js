import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildOnboardingFlow } from '../src/utils/onboardingFlow.js';
import { requiresSemesterHistory, hasMinimumAcademicSetup } from '../src/utils/onboardingValidation.js';
import { buildOnboardingFocus } from '../src/utils/onboardingFocus.js';
const profile = { curriculum: { 100: { 1: [{ code: 'DCIT101', name: 'Introduction to computing' }, { code: 'MATH101', name: 'Mathematics' }] } } };
const context = { universityName: 'University of Ghana', programName: 'BSc Information Technology', studentPath: 'new', learnedProfile: profile, aiLearnDone: true, profileReviewConfirmed: true };
test('new students reach focus selection without a fictitious completed semester', () => {
  const steps = buildOnboardingFlow(context);
  assert.equal(steps.some((s) => s.type === 'semesterGrades'), false);
  assert.equal(steps.some((s) => s.type === 'courseFocus'), true);
  assert.equal(requiresSemesterHistory('new', steps), false);
});
test('continuing students with completed terms retain history requirements', () => {
  const steps = buildOnboardingFlow({ ...context, studentPath: 'continuing', currentLevel: 200, currentSemester: 1 });
  assert.equal(steps.some((s) => s.type === 'semesterGrades'), true);
  assert.equal(requiresSemesterHistory('continuing', steps), true);
});
test('a continuing student at the first term can still choose preparation courses', () => {
  const steps = buildOnboardingFlow({ ...context, studentPath: 'continuing', currentLevel: 100, currentSemester: 1 });
  assert.equal(steps.some((s) => s.type === 'courseFocus'), true);
  assert.equal(requiresSemesterHistory('continuing', steps), false);
});
test('no-history suggestions use the reviewed curriculum, respect the cap and invent no grade', () => {
  const result = buildOnboardingFocus({ history: [], gradePoints: {}, limit: 1, academicProfile: profile });
  assert.equal(result.suggestions.length, 1);
  assert.equal(result.suggestions[0].code, 'DCIT101');
  assert.equal(result.suggestions[0].grade, undefined);
  assert.match(result.pattern, /not inferred weaknesses/);
});
test('a missing curriculum offers manual entry without inventing courses', () => {
  assert.deepEqual(buildOnboardingFocus({ history: [], gradePoints: {}, limit: 2, academicProfile: {} }).suggestions, []);
});
test('both student paths retain the mandatory academic-profile review gate', () => {
  for (const studentPath of ['new', 'continuing']) {
    const answers = { universityName: 'University of Ghana', programName: 'BSc Information Technology', country: 'Ghana', trackType: 'Single major', studentPath };
    assert.equal(hasMinimumAcademicSetup(answers, profile, true, false), false);
    assert.equal(hasMinimumAcademicSetup(answers, profile, true, true), true);
  }
});
