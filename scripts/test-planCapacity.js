/**
 * Unit tests for planCapacity. Run with: node scripts/test-planCapacity.js
 */
import {
  canAddCourse,
  getEnabledTools,
  getMaxCourses,
  getPlanSummary,
  resolveDurationValue,
} from '../src/utils/planCapacity.js';

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed += 1;
  } else {
    failed += 1;
    console.error('FAIL:', msg);
  }
}

const profile3mo = { duration: '3 months (12+ weeks)' };
const profile2mo = { duration: '2 months (8 weeks)' };
const profile1mo = { duration: '1 month (4 weeks)' };
const profileWeeks = { duration: '2–3 weeks' };
const legacyProfile = { break: '4–6 weeks' };
const legacyTildeProfile = { duration: '~1 month (4 weeks)' };

assert(getMaxCourses(profile3mo) === 6, '3 months allows 6 courses');
assert(getMaxCourses(profile2mo) === 4, '2 months allows 4 courses');
assert(getMaxCourses(profile1mo) === 2, '1 month allows 2 courses');
assert(getMaxCourses(profileWeeks) === 1, 'weeks-only allows 1 course');

assert(resolveDurationValue(legacyProfile) === '1 month (4 weeks)', 'legacy break maps to new duration');
assert(resolveDurationValue(legacyTildeProfile) === '1 month (4 weeks)', 'legacy tilde duration maps forward');

const toolsWeeksWithCourse = getEnabledTools(profileWeeks, 1);
assert(toolsWeeksWithCourse.includes('flashcards'), 'weeks tier includes flashcards with a course');
assert(!toolsWeeksWithCourse.includes('projects'), 'weeks tier excludes projects');
assert(!toolsWeeksWithCourse.includes('reports'), 'weeks tier excludes reports');

const tools1mo = getEnabledTools(profile1mo, 2);
assert(tools1mo.includes('reports'), '1 month tier includes reports');
assert(!tools1mo.includes('projects'), '1 month tier excludes projects');

const tools2mo = getEnabledTools(profile2mo, 1);
assert(tools2mo.includes('projects'), '2 month tier includes projects');
assert(!tools2mo.includes('study-room'), '2 month tier excludes study rooms');

const tools3mo = getEnabledTools(profile3mo, 1);
assert(tools3mo.includes('study-room'), '3 month tier includes study rooms');

const preCourse = getEnabledTools(profile3mo, 0);
assert(preCourse.length === 2 && preCourse.includes('dashboard') && preCourse.includes('courses'), 'no courses: dashboard + courses only');

assert(canAddCourse(profile1mo, 1), 'can add when under limit');
assert(!canAddCourse(profile1mo, 2), 'cannot add at limit');

const summary = getPlanSummary(profileWeeks, 0);
assert(summary.needsCourses === true, 'summary flags missing courses');
assert(summary.tier === 'minimal', 'weeks profile is minimal tier');
assert(!summary.message.includes('—'), 'plan message has no em dashes');
assert(!summary.message.includes('~'), 'plan message has no tilde');

console.log(`\nplanCapacity tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
