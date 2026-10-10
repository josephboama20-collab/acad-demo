import CurriculumPreview from './CurriculumPreview.jsx';

/**
 * Lets users review and correct AI-generated academic profile before continuing.
 */
export default function AcademicProfileReview({ profile, edits, onChange, onConfirm, confirmed }) {
  const institutionName = edits.institutionName ?? profile?.institutionName ?? '';
  const programName = edits.programName ?? profile?.programName ?? '';
  const gradingLabel = edits.gradingLabel ?? profile?.gradingScale?.label ?? '';
  const adaptationNotes = edits.adaptationNotes ?? profile?.adaptationNotes ?? '';

  function update(field, value) {
    onChange({ ...edits, [field]: value });
  }

  return (
    <div className="profile-review">
      <p className="ob-accuracy-note">
        AI can make mistakes. Review everything below — edit anything that looks wrong before you continue.
      </p>
      {profile?.source === 'catalogue' && (
        <p className="ai-learn-success">Matched the official University of Ghana course catalogue for this programme.</p>
      )}
      <div className="profile-review-fields">
        <div className="form-group">
          <label className="form-label" htmlFor="pr-institution">University</label>
          <input
            id="pr-institution"
            className="form-input"
            value={institutionName}
            onChange={(e) => update('institutionName', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="pr-program">Programme</label>
          <input
            id="pr-program"
            className="form-input"
            value={programName}
            onChange={(e) => update('programName', e.target.value)}
          />
        </div>
        {profile?.departmentName && (
          <div className="form-group">
            <label className="form-label">Department / school</label>
            <p className="ob-hint">{profile.departmentName}</p>
          </div>
        )}
        <div className="form-group">
          <label className="form-label" htmlFor="pr-grading">Grading scale</label>
          <input
            id="pr-grading"
            className="form-input"
            value={gradingLabel}
            onChange={(e) => update('gradingLabel', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="pr-notes">Programme notes (optional)</label>
          <textarea
            id="pr-notes"
            className="form-input"
            rows={3}
            value={adaptationNotes}
            onChange={(e) => update('adaptationNotes', e.target.value)}
          />
        </div>
      </div>
      <CurriculumPreview profile={profile} />
      <button
        type="button"
        className={`btn btn-outline${confirmed ? ' btn-confirmed' : ''}`}
        onClick={onConfirm}
        disabled={!institutionName.trim() || !programName.trim()}
      >
        {confirmed ? 'Profile confirmed' : 'Confirm profile looks correct'}
      </button>
    </div>
  );
}
