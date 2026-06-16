import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCourses } from '../contexts/CoursesContext.jsx';
import { usePlanCapacity } from '../hooks/usePlanCapacity.js';
import { ONBOARDING_QUESTIONS } from '../data/constants.js';
import { DURATION_OPTIONS } from '../utils/planCapacity.js';
import PlanBanner from '../components/PlanBanner.jsx';
import Modal from '../components/Modal.jsx';

function FieldSelect({ label, value, options, onChange }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <select className="form-input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>Select…</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

export default function ManagePlan({ setPage }) {
  const { profile, setProfile } = useAuth();
  const { courses } = useCourses();
  const { plan } = usePlanCapacity();
  const [draft, setDraft] = useState(() => ({ ...(profile || {}) }));
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const durationQ = ONBOARDING_QUESTIONS.find((q) => q.id === 'duration');

  function updateField(id, value) {
    setDraft((d) => ({ ...d, [id]: value }));
    setSaved(false);
  }

  function savePlan() {
    const next = { ...draft };
    if (next.duration) next.break = undefined;
    setProfile(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function resetPlan() {
    setProfile(null);
    setConfirmReset(false);
    setPage('onboarding');
  }

  const overCourseLimit = courses.length > plan.maxCourses;

  return (
    <main className="page fc-page mp-page anim-fade-in">
      <div className="fc-wrap">
        <header className="fc-header">
          <div>
            <p className="fc-kicker">Your plan</p>
            <h1 className="fc-title">Manage plan</h1>
            <p className="fc-sub">
              Customize your recovery window, effort level, and intentions. Changes affect tool access and course limits.
            </p>
          </div>
          <button type="button" className="btn btn-outline" onClick={() => setPage('settings')}>
            Back to settings
          </button>
        </header>

        <PlanBanner compact />

        {overCourseLimit && (
          <div className="mp-warning card">
            <p className="mp-warning-title">Course count exceeds new limit</p>
            <p className="mp-warning-desc">
              You have {courses.length} courses but your plan allows {plan.maxCourses}. Remove courses or extend your window.
            </p>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setPage('courses')}>
              Manage courses
            </button>
          </div>
        )}

        <div className="mp-grid">
          <section className="card mp-section">
            <p className="card-label">Recovery window</p>
            <p className="mp-hint">Sets how many courses you can add and which tools unlock.</p>
            <FieldSelect
              label="Duration"
              value={draft.duration || draft.break}
              options={durationQ?.opts || DURATION_OPTIONS.map((d) => d.value)}
              onChange={(v) => updateField('duration', v)}
            />
            <div className="mp-stats">
              <div className="mp-stat">
                <span className="mp-stat-val font-mono">{plan.maxCourses}</span>
                <span className="mp-stat-lbl">Max courses</span>
              </div>
              <div className="mp-stat">
                <span className="mp-stat-val font-mono">{courses.length}</span>
                <span className="mp-stat-lbl">Added</span>
              </div>
              <div className="mp-stat">
                <span className="mp-stat-val font-mono">{plan.slotsLeft}</span>
                <span className="mp-stat-lbl">Slots left</span>
              </div>
            </div>
          </section>

          <section className="card mp-section">
            <p className="card-label">Profile & intentions</p>
            {ONBOARDING_QUESTIONS.filter((q) => q.id !== 'duration').map((q) => (
              <FieldSelect
                key={q.id}
                label={q.q}
                value={draft[q.id]}
                options={q.opts}
                onChange={(v) => updateField(q.id, v)}
              />
            ))}
          </section>

          <section className="card mp-section mp-actions">
            <p className="card-label">Save changes</p>
            <p className="mp-hint">Updates apply immediately across dashboard, courses, and tool gating.</p>
            <div className="mp-btn-row">
              <button type="button" className="btn btn-primary" onClick={savePlan}>
                {saved ? 'Saved' : 'Save plan'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setPage('courses')}>
                Manage courses
              </button>
            </div>
          </section>

          <section className="card mp-section mp-danger">
            <p className="card-label">Reset plan</p>
            <p className="mp-hint">
              Clears your profile answers and restarts onboarding. Your courses, streak, and progress stay on this device.
            </p>
            <button type="button" className="btn btn-outline mp-reset-btn" onClick={() => setConfirmReset(true)}>
              Reset &amp; reconfigure plan
            </button>
          </section>
        </div>
      </div>

      {confirmReset && (
        <Modal
          title="Reset your plan?"
          body="This clears your profile setup and sends you back through onboarding. Courses and streak data are not deleted."
          confirmLabel="Reset plan"
          confirmClass="btn-danger"
          onConfirm={resetPlan}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </main>
  );
}
