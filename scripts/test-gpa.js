import assert from 'node:assert/strict';
import { computeGpaFromGrades, compareSemesterGrades } from '../src/utils/semesterUtils.js';

const cases = [
  ['unequal credits', [{ grade: 'A', credits: 3 }, { grade: 'C', credits: 1 }], 3.5],
  ['equal credits', [{ grade: 'A', credits: 3 }, { grade: 'C', credits: 3 }], 3],
  ['legacy missing credits', [{ grade: 'A' }, { grade: 'C' }], 3],
  ['empty history', [], null],
  ['unknown grade', [{ grade: 'X', credits: 3 }], null],
  ['zero credits excluded', [{ grade: 'A', credits: 0 }, { grade: 'C', credits: 1 }], 2],
  ['negative credits excluded', [{ grade: 'A', credits: -2 }], null],
  ['invalid credits excluded', [{ grade: 'A', credits: 'invalid' }], null],
  ['numeric string credits', [{ grade: 'A', credits: '3' }, { grade: 'C', credits: '1' }], 3.5],
  ['failed course counts credits', [{ grade: 'A', credits: 1 }, { grade: 'F', credits: 3 }], 1],
  ['fractional credits', [{ grade: 'A', credits: 1.5 }, { grade: 'C', credits: 0.5 }], 3.5],
];
for (const [name, courses, expected] of cases) {
  assert.equal(computeGpaFromGrades(courses), expected, name);
}
assert.equal(computeGpaFromGrades([{ grade: 'P', credits: 2 }], { P: 5 }), 5);
assert.equal(compareSemesterGrades([{ grade: 'C', credits: 3 }], [{ grade: 'A', credits: 3 }]).status, 'improved');
console.log('GPA tests: 13 passed, 0 failed');
