import { useState } from 'react';

/**
 * Pick focus courses for the comeback plan — AI suggestions + manual entry, capped by plan timeline.
 */
export default function CourseFocusPicker({
  pattern,
  suggestions,
  maxCourses,
  selected,
  customCourses,
  onToggle,
  onAddCustom,
  onRemoveCustom,
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();
    if (!cleanCode || !cleanName) return;
    onAddCustom({ code: cleanCode, name: cleanName });
    setCode('');
    setName('');
  }

  const selectedCount = selected.length;

  return (
    <div className="course-focus">
      {pattern && <p className="course-focus-pattern">{pattern}</p>}
      <p className="ob-hint">
        Select up to <strong>{maxCourses}</strong> course{maxCourses === 1 ? '' : 's'} for this plan window.
        {' '}Everyone has room to improve — you can always change these later on the Courses page.
      </p>

      {suggestions.length > 0 && (
        <div className="course-focus-list" role="group" aria-label="Suggested courses">
          <p className="form-label">Suggested from your grade pattern</p>
          {suggestions.map((s) => {
            const isOn = selected.some((c) => c.code === s.code);
            const disabled = !isOn && selectedCount >= maxCourses;
            return (
              <button
                key={s.code}
                type="button"
                className={`course-focus-card${isOn ? ' sel' : ''}`}
                disabled={disabled}
                onClick={() => onToggle(s)}
                aria-pressed={isOn}
              >
                <span className="course-focus-code font-mono">{s.code}</span>
                <span className="course-focus-name">{s.name}</span>
                <span className="course-focus-meta">Grade {s.grade} · {s.semesterLabel}</span>
                <span className="course-focus-reason">{s.reason}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="custom-course-block">
        <p className="form-label">Add a course directly</p>
        <form className="custom-course-form" onSubmit={handleAdd}>
          <input
            className="form-input"
            placeholder="Course code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-label="Course code"
          />
          <input
            className="form-input"
            placeholder="Course title"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Course title"
          />
          <button type="submit" className="btn btn-outline btn-sm" disabled={selectedCount >= maxCourses}>
            Add
          </button>
        </form>
      </div>

      {customCourses.length > 0 && (
        <div className="course-focus-custom-list">
          {customCourses.map((c) => {
            const isOn = selected.some((s) => s.code === c.code);
            return (
              <div key={c.code} className="course-focus-custom-row">
                <button
                  type="button"
                  className={`course-focus-card compact${isOn ? ' sel' : ''}`}
                  disabled={!isOn && selectedCount >= maxCourses}
                  onClick={() => onToggle(c)}
                >
                  <span className="course-focus-code font-mono">{c.code}</span>
                  <span className="course-focus-name">{c.name}</span>
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => onRemoveCustom(c.code)}>
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}

      <p className="ob-hint" style={{ marginTop: 12 }}>
        {selectedCount}/{maxCourses} selected for your comeback plan
      </p>
    </div>
  );
}
