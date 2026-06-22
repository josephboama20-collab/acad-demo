import { useState } from 'react';
import GradeButtonPicker from './GradeButtonPicker.jsx';

/**
 * Lets users add courses the AI may have missed — code, name, and grade via buttons.
 */
export default function CustomCourseGrades({
  gradeLetters,
  courses,
  grades,
  onAddCourse,
  onRemoveCourse,
  onSelectGrade,
  onSkipGrade,
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();
    if (!cleanCode || !cleanName) return;
    onAddCourse({ code: cleanCode, name: cleanName, credits: 3, type: 'custom' });
    setCode('');
    setName('');
  }

  return (
    <div className="custom-course-block">
      <p className="form-label">Add a course AI missed</p>
      <p className="ob-hint" style={{ marginBottom: 8 }}>
        Optional — for electives, retakes, or courses not in your programme map.
      </p>
      <form className="custom-course-form" onSubmit={handleAdd}>
        <input
          className="form-input"
          placeholder="Course code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          aria-label="Custom course code"
        />
        <input
          className="form-input"
          placeholder="Course title"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Custom course title"
        />
        <button type="submit" className="btn btn-outline btn-sm">
          Add course
        </button>
      </form>

      {courses.length > 0 && (
        <div className="grade-picker-list" style={{ marginTop: 12 }}>
          {courses.map((course) => (
            <div key={course.code} className="custom-course-row">
              <GradeButtonPicker
                course={course}
                grade={grades[course.code]}
                gradeLetters={gradeLetters}
                onSelect={(letter) => onSelectGrade(course.code, letter)}
                onSkip={() => onSkipGrade(course.code)}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm custom-course-remove"
                onClick={() => onRemoveCourse(course.code)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
