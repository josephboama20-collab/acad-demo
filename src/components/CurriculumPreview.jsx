/**
 * Read-only semester-by-semester course list for profile review.
 */
export default function CurriculumPreview({ profile }) {
  const curriculum = profile?.curriculum;
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
                <ul className="curriculum-course-list">
                  {courses.map((c) => (
                    <li key={`${level}-${sem}-${c.code}`}>
                      <span className="font-mono curriculum-code">{c.code}</span>
                      <span className="curriculum-name">{c.name}</span>
                      <span className="curriculum-meta">{c.credits} cr · {c.type}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ))}
      <p className="ob-hint">{total} courses listed. Add or correct any missing courses on the grade steps.</p>
    </div>
  );
}
