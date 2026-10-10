function updateCourse(curriculum, level, sem, idx, patch) {
  const next = structuredClone(curriculum || {});
  next[level] ??= {};
  next[level][sem] ??= [];
  next[level][sem][idx] = { ...next[level][sem][idx], ...patch };
  return next;
}

function removeCourse(curriculum, level, sem, idx) {
  const next = structuredClone(curriculum || {});
  next[level][sem] = (next[level][sem] || []).filter((_, i) => i !== idx);
  return next;
}

function addCourse(curriculum, level, sem) {
  const next = structuredClone(curriculum || {});
  next[level] ??= {};
  next[level][sem] ??= [];
  next[level][sem].push({ code: '', name: '', credits: 3, type: 'core' });
  return next;
}

/**
 * Semester-by-semester course map for profile review. Editable when requested.
 */
export default function CurriculumPreview({ profile, editable = false, value, onChange }) {
  const curriculum = value || profile?.curriculum;
  if (!curriculum || !Object.keys(curriculum).length) {
    return <p className="ob-hint">No courses mapped yet.</p>;
  }

  const levels = Object.keys(curriculum).sort((a, b) => Number(a) - Number(b));
  let total = 0;

  return (
    <div className="curriculum-preview">
      <p className="curriculum-preview-label">
        Course map
        {profile?.source === 'catalogue' && (
          <span className="curriculum-badge"> Official UG catalogue</span>
        )}
      </p>
      {levels.map((level) => (
        <div key={level} className="curriculum-level">
          <p className="curriculum-level-title">Level {level}</p>
          {['1', '2'].map((sem) => {
            const courses = curriculum[level]?.[sem] || [];
            if (!courses.length) return null;
            total += courses.length;
            return (
              <div key={`${level}-${sem}`} className="curriculum-semester">
                <p className="curriculum-sem-title">Semester {sem} · {courses.length} courses</p>
                {!editable ? (
                  <ul className="curriculum-course-list">
                    {courses.map((c) => (
                      <li key={`${level}-${sem}-${c.code}`}>
                        <span className="font-mono curriculum-code">{c.code}</span>
                        <span className="curriculum-name">{c.name}</span>
                        <span className="curriculum-meta">{c.credits} cr · {c.type}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="curriculum-edit-list">
                    {courses.map((c, idx) => (
                      <div key={`${level}-${sem}-${idx}`} className="curriculum-edit-row">
                        <input
                          className="form-input curriculum-edit-code"
                          value={c.code || ''}
                          placeholder="Code"
                          onChange={(e) => onChange(updateCourse(curriculum, level, sem, idx, { code: e.target.value }))}
                        />
                        <input
                          className="form-input"
                          value={c.name || ''}
                          placeholder="Course title"
                          onChange={(e) => onChange(updateCourse(curriculum, level, sem, idx, { name: e.target.value }))}
                        />
                        <input
                          className="form-input curriculum-edit-credits"
                          type="number"
                          min={1}
                          max={12}
                          value={Number(c.credits || 3)}
                          onChange={(e) => onChange(updateCourse(curriculum, level, sem, idx, { credits: Number(e.target.value) || 3 }))}
                        />
                        <button
                          type="button"
                          className="btn btn-ghost curriculum-edit-remove"
                          onClick={() => onChange(removeCourse(curriculum, level, sem, idx))}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => onChange(addCourse(curriculum, level, sem))}>
                      Add course
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      <p className="ob-hint">{total} courses listed. {editable ? 'You can edit every course here before confirming.' : 'Add or correct missing courses on the grade steps.'}</p>
    </div>
  );
}
