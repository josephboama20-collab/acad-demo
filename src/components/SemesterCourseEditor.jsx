import { useState } from 'react';
import EditableGradePicker from './EditableGradePicker.jsx';

/**
 * Shared semester course list: AI-mapped (editable) + user-added courses with grades and credits.
 */
export default function SemesterCourseEditor({
  aiCourses,
  customCourses,
  grades,
  gradeLetters,
  courseEdits,
  removedCodes,
  recordedCodes,
  onGradeSelect,
  onGradeSkip,
  onCourseEdit,
  onCourseRemove,
  onAddCustom,
  onRemoveCustom,
}) {
  const removed = removedCodes instanceof Set ? removedCodes : new Set(removedCodes || []);
  const recorded = recordedCodes instanceof Set ? recordedCodes : new Set(recordedCodes || []);
  const edits = courseEdits || {};

  const visibleAi = (aiCourses || [])
    .filter((c) => !removed.has(c.code))
    .map((c) => edits[c.code] || c);

  return (
    <>
      {visibleAi.length > 0 && (
        <div className="grade-picker-list">
          {visibleAi.map((course) => (
            <EditableGradePicker
              key={course.code}
              course={course}
              grade={grades[course.code]}
              gradeLetters={gradeLetters}
              editable
              recorded={recorded.has(course.code)}
              onSelect={(letter) => onGradeSelect(course.code, letter)}
              onSkip={() => onGradeSkip(course.code)}
              onEdit={(updated) => onCourseEdit(course.code, updated)}
              onRemove={(code) => onCourseRemove(code)}
            />
          ))}
        </div>
      )}

      <CustomCourseBlock
        gradeLetters={gradeLetters}
        courses={customCourses}
        grades={grades}
        recordedCodes={recorded}
        existingCodes={[...visibleAi, ...customCourses].map((c) => c.code)}
        onAddCourse={onAddCustom}
        onRemoveCourse={onRemoveCustom}
        onSelectGrade={onGradeSelect}
        onSkipGrade={onGradeSkip}
        onEditCourse={(oldCode, updated) => onCourseEdit(oldCode, updated)}
      />
    </>
  );
}

function CustomCourseBlock({
  gradeLetters,
  courses,
  grades,
  recordedCodes,
  existingCodes,
  onAddCourse,
  onRemoveCourse,
  onSelectGrade,
  onSkipGrade,
  onEditCourse,
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [credits, setCredits] = useState('3');

  function handleAdd(e) {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();
    const cleanCredits = Math.max(1, Math.min(12, Number(credits) || 3));
    if (!cleanCode || !cleanName) return;
    if (existingCodes.includes(cleanCode)) return;
    onAddCourse({ code: cleanCode, name: cleanName, credits: cleanCredits, type: 'custom' });
    setCode('');
    setName('');
    setCredits('3');
  }

  return (
    <div className="custom-course-block">
      <p className="form-label">Add a course AI missed</p>
      <p className="ob-hint" style={{ marginBottom: 8 }}>
        Enter code, title, credit hours, then pick a grade.
      </p>
      <form className="custom-course-form course-add-form" onSubmit={handleAdd}>
        <input className="form-input" placeholder="Course code" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Custom course code" />
        <input className="form-input" placeholder="Course title" value={name} onChange={(e) => setName(e.target.value)} aria-label="Custom course title" />
        <input className="form-input" type="number" min={1} max={12} placeholder="Credits" value={credits} onChange={(e) => setCredits(e.target.value)} aria-label="Credit hours" />
        <button type="submit" className="btn btn-outline btn-sm">Add course</button>
      </form>

      {courses.length > 0 && (
        <div className="grade-picker-list" style={{ marginTop: 12 }}>
          {courses.map((course) => (
            <EditableGradePicker
              key={course.code}
              course={course}
              grade={grades[course.code]}
              gradeLetters={gradeLetters}
              editable
              recorded={recordedCodes.has(course.code)}
              onSelect={(letter) => onSelectGrade(course.code, letter)}
              onSkip={() => onSkipGrade(course.code)}
              onEdit={(updated) => onEditCourse(course.code, updated)}
              onRemove={() => onRemoveCourse(course.code)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
