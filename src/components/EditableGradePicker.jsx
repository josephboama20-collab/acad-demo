import { useState } from 'react';
import GradeButtonPicker from './GradeButtonPicker.jsx';

/**
 * Grade picker with inline edit/remove and editable credit hours.
 */
export default function EditableGradePicker({
  course,
  grade,
  gradeLetters,
  onSelect,
  onSkip,
  onEdit,
  onRemove,
  editable = false,
  recorded = false,
}) {
  const [editing, setEditing] = useState(false);
  const [code, setCode] = useState(course.code);
  const [name, setName] = useState(course.name);
  const [credits, setCredits] = useState(course.credits ?? 3);

  if (editing && editable) {
    return (
      <div className="editable-grade-row">
        <form
          className="custom-course-form course-edit-form"
          onSubmit={(e) => {
            e.preventDefault();
            const cleanCode = code.trim().toUpperCase();
            const cleanName = name.trim();
            const cleanCredits = Math.max(1, Math.min(12, Number(credits) || 3));
            if (!cleanCode || !cleanName) return;
            onEdit({ ...course, code: cleanCode, name: cleanName, credits: cleanCredits });
            setEditing(false);
          }}
        >
          <input className="form-input" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Course code" placeholder="Code" />
          <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} aria-label="Course title" placeholder="Title" />
          <input
            className="form-input"
            type="number"
            min={1}
            max={12}
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            aria-label="Credit hours"
            placeholder="Cr"
          />
          <button type="submit" className="btn btn-outline btn-sm">Save</button>
        </form>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
      </div>
    );
  }

  return (
    <div className={`editable-grade-row${recorded ? ' is-recorded' : ''}`}>
      {recorded && <span className="course-recorded-badge">Recorded</span>}
      <GradeButtonPicker
        course={course}
        grade={grade}
        gradeLetters={gradeLetters}
        onSelect={onSelect}
        onSkip={onSkip}
      />
      {editable && (
        <div className="editable-grade-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
            {recorded ? 'Edit course' : 'Edit'}
          </button>
          {!recorded && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onRemove(course.code)}>Remove</button>
          )}
        </div>
      )}
    </div>
  );
}
