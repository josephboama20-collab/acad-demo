/**
 * Button-based grade picker — no typing, no transcript upload.
 */
export default function GradeButtonPicker({ course, grade, gradeLetters, onSelect, onSkip }) {
  return (
    <div className="grade-picker-row">
      <div className="grade-picker-course">
        <span className="grade-picker-code font-mono">{course.code}</span>
        <span className="grade-picker-name">{course.name}</span>
        {course.credits && <span className="grade-picker-credits">{course.credits} cr</span>}
      </div>
      <div className="grade-picker-btns" role="radiogroup" aria-label={`Grade for ${course.code}`}>
        {gradeLetters.map((letter) => (
          <button
            key={letter}
            type="button"
            className={`grade-btn${grade === letter ? ' sel' : ''}`}
            role="radio"
            aria-checked={grade === letter}
            onClick={() => onSelect(letter)}
          >
            {letter}
          </button>
        ))}
        {onSkip && (
          <button type="button" className="grade-btn grade-btn-skip" onClick={onSkip}>
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
