import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSemesters } from '../contexts/SemestersContext.jsx';
import { usePlanCapacity } from '../hooks/usePlanCapacity.js';
import { useTheme } from '../contexts/ThemeContext.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import PlanBanner from '../components/PlanBanner.jsx';
import DeleteAccountModal from '../components/DeleteAccountModal.jsx';
import AiLearnProgress from '../components/AiLearnProgress.jsx';
import { buildLearnParamsFromProfile, learnAcademicProfile } from '../utils/academicProfileAI.js';

function SettingRow({ label, desc, children }) {
  return (
    <div className="as-row">
      <div className="as-row-text">
        <p className="as-row-label">{label}</p>
        {desc && <p className="as-row-desc">{desc}</p>}
      </div>
      <div className="as-row-control">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, id }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      className={`as-toggle${checked ? ' on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="as-toggle-knob" />
    </button>
  );
}

export default function AccountSettings({ setPage }) {
  const { user, profile, streak, settings, updateUser, updateSettings, setFocusMode, isCloudMode, deleteAccount, deleteAllLocalData, setProfile } = useAuth();
  const { academicProfile, relearnAcademicProfile } = useSemesters();
  const { plan } = usePlanCapacity();
  const { theme } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [saved, setSaved] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [relearnBusy, setRelearnBusy] = useState(false);
  const [relearnElapsed, setRelearnElapsed] = useState(0);
  const [relearnError, setRelearnError] = useState('');
  const [relearnSuccess, setRelearnSuccess] = useState('');

  const ap = academicProfile || profile?.academicProfile;

  async function handleRelearnProgramme() {
    const params = buildLearnParamsFromProfile(ap);
    if (!params?.universityName || !params?.programName) {
      setRelearnError('Add your university and programme during onboarding before re-learning.');
      return;
    }
    setRelearnBusy(true);
    setRelearnError('');
    setRelearnSuccess('');
    setRelearnElapsed(0);
    const timer = setInterval(() => setRelearnElapsed((s) => s + 1), 1000);
    try {
      const { profile: nextProfile, source, error } = await learnAcademicProfile(params);
      relearnAcademicProfile(nextProfile);
      if (profile?.academicProfile) {
        setProfile({
          ...profile,
          academicProfile: {
            ...nextProfile,
            semesterHistory: ap?.semesterHistory ?? [],
          },
        });
      }
      if (source === 'ai') {
        setRelearnSuccess('Programme map updated with AI. Your grade history was kept.');
      } else {
        setRelearnError(error || 'AI was unavailable — only an estimated profile was saved.');
      }
    } catch (err) {
      setRelearnError(err?.message || 'Could not re-learn your programme. Try again later.');
    } finally {
      clearInterval(timer);
      setRelearnBusy(false);
    }
  }

  function saveProfile() {
    if (name.trim()) {
      updateUser({ name: name.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function handleDeleteConfirm() {
    if (isCloudMode) {
      await deleteAccount();
    } else {
      await deleteAllLocalData();
    }
    setDeleteOpen(false);
    setPage('landing');
  }

  return (
    <main className="page fc-page as-page anim-fade-in">
      <div className="fc-wrap">
        <header className="fc-header">
          <div>
            <p className="fc-kicker">Account</p>
            <h1 className="fc-title">Settings</h1>
            <p className="fc-sub">Manage your profile, preferences, and plan details.</p>
          </div>
        </header>

        <PlanBanner compact />

        <div className="as-grid">
          <section className="card as-section">
            <p className="card-label">Profile</p>
            <div className="as-form">
              <div className="form-group">
                <label className="form-label" htmlFor="as-name">Display name</label>
                <input
                  id="as-name"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="as-email">Email</label>
                <input id="as-email" className="form-input" value={user?.email || ''} disabled />
                <p className="as-field-hint">
                  {isCloudMode ? 'Email is managed by your Acad account.' : 'Email is tied to your local account on this device.'}
                </p>
              </div>
              <button type="button" className="btn btn-primary" onClick={saveProfile}>
                {saved ? 'Saved' : 'Save profile'}
              </button>
            </div>
          </section>

          <section className="card as-section">
            <p className="card-label">Your plan</p>
            <div className="as-plan-summary">
              <div className="as-plan-stat">
                <span className="as-plan-val font-mono">{plan.durationLabel}</span>
                <span className="as-plan-lbl">Recovery window</span>
              </div>
              <div className="as-plan-stat">
                <span className="as-plan-val font-mono">{plan.courseCount}/{plan.maxCourses}</span>
                <span className="as-plan-lbl">Courses</span>
              </div>
              <div className="as-plan-stat">
                <span className="as-plan-val font-mono">{streak.current}</span>
                <span className="as-plan-lbl">Day streak</span>
              </div>
            </div>
            {profile && (
              <div className="as-profile-meta">
                {profile.sharpness && <span>State: {profile.sharpness}</span>}
                {profile.effort && <span>Effort: {profile.effort}</span>}
                {(profile.intention || profile.goal) && <span>Intention: {profile.intention || profile.goal}</span>}
              </div>
            )}
            <button type="button" className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => setPage('manage-plan')}>
              Manage plan
            </button>
          </section>

          <section className="card as-section">
            <p className="card-label">Academic programme</p>
            {ap ? (
              <>
                <p className="as-row-desc">
                  <strong>{ap.institutionName}</strong> · {ap.programName}
                  {ap.source === 'catalogue' && (
                    <span className="as-badge-warn" style={{ color: 'var(--success, #2d8a4e)' }}> Official catalogue</span>
                  )}
                  {ap.source === 'fallback' && (
                    <span className="as-badge-warn"> Estimated (offline)</span>
                  )}
                </p>
                <p className="as-row-desc">
                  {ap.gradingScale?.label || 'Grading scale'}
                  {ap.learnedAt && (
                    <span> · Last learned {new Date(ap.learnedAt).toLocaleDateString()}</span>
                  )}
                </p>
                {relearnBusy ? (
                  <AiLearnProgress loading elapsedSeconds={relearnElapsed} />
                ) : (
                  <button type="button" className="btn btn-outline" style={{ marginTop: 12 }} onClick={handleRelearnProgramme}>
                    Re-learn programme with AI
                  </button>
                )}
                <p className="as-field-hint" style={{ marginTop: 8 }}>
                  Re-runs AI curriculum mapping from your university and programme. Grade history and semester records are kept.
                </p>
                {relearnSuccess && <p className="as-success" role="status">{relearnSuccess}</p>}
                {(relearnError || (!relearnBusy && ap.source === 'fallback')) && (
                  <div className="ai-learn-error" style={{ marginTop: 8 }}>
                    {relearnError && <p className="form-error" role="alert">{relearnError}</p>}
                    {!relearnBusy && ap.source === 'fallback' && !relearnSuccess && (
                      <p className="form-error" role="alert">
                        Your profile was created offline. Use re-learn above once AI is connected for real course codes.
                      </p>
                    )}
                    {relearnError && !relearnBusy && (
                      <button type="button" className="btn btn-outline btn-sm" onClick={handleRelearnProgramme}>
                        Retry
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="as-row-desc">Complete onboarding to set your university and programme.</p>
            )}
          </section>

          <section className="card as-section">
            <p className="card-label">Appearance</p>
            <SettingRow label="Color theme" desc={`Currently ${theme}`}>
              <ThemeToggle variant="top" />
            </SettingRow>
          </section>

          <section className="card as-section">
            <p className="card-label">Preferences</p>
            <SettingRow label="Focus mode" desc="Hide navigation for distraction-free study sessions.">
              <Toggle checked={settings.focusMode} onChange={setFocusMode} id="as-focus" />
            </SettingRow>
            <SettingRow label="Email notifications" desc="Receive study reminders and progress updates.">
              <Toggle
                checked={settings.emailNotifications !== false}
                onChange={(v) => updateSettings({ emailNotifications: v })}
                id="as-email-notif"
              />
            </SettingRow>
            <SettingRow label="Daily reminders" desc="Prompt to complete your daily task and wellness check-in.">
              <Toggle
                checked={settings.dailyReminders !== false}
                onChange={(v) => updateSettings({ dailyReminders: v })}
                id="as-daily"
              />
            </SettingRow>
            <SettingRow label="Show streak in navigation" desc="Display your streak badge in the sidebar.">
              <Toggle
                checked={settings.showStreak !== false}
                onChange={(v) => updateSettings({ showStreak: v })}
                id="as-streak"
              />
            </SettingRow>
          </section>

          <section className="card as-section as-danger">
            <p className="card-label">Account actions</p>
            <p className="as-row-desc" style={{ marginBottom: 16 }}>
              {isCloudMode
                ? 'Your study data syncs to your cloud account. You can delete your account and all associated data permanently.'
                : 'Your data is stored locally on this device. You can erase all local data or sign out to keep progress for later.'}
            </p>
            {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
            <div className="as-actions">
              <button type="button" className="btn btn-outline" onClick={() => setPage('dashboard')}>
                Back to dashboard
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setPage('signout-confirm')}>
                Sign out
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  setDeleteError('');
                  setDeleteOpen(true);
                }}
              >
                {isCloudMode ? 'Delete account' : 'Erase all local data'}
              </button>
            </div>
          </section>
        </div>
      </div>

      {deleteOpen && (
        <DeleteAccountModal
          isCloudMode={isCloudMode}
          userEmail={user?.email}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </main>
  );
}
