import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { usePlanCapacity } from '../hooks/usePlanCapacity.js';
import { useTheme } from '../contexts/ThemeContext.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import PlanBanner from '../components/PlanBanner.jsx';

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
  const { user, profile, streak, settings, updateUser, updateSettings, setFocusMode, isCloudMode, deleteAccount } = useAuth();
  const { plan } = usePlanCapacity();
  const { theme } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  function saveProfile() {
    if (name.trim()) {
      updateUser({ name: name.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
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
            <p className="card-label">Appearance</p>
            <SettingRow label="Color theme" desc={`Currently ${theme}`}>
              <ThemeToggle variant="dock" />
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
                : 'Your data is stored locally on this device. Signing out keeps your progress saved for when you return.'}
            </p>
            {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
            <div className="as-actions">
              <button type="button" className="btn btn-outline" onClick={() => setPage('dashboard')}>
                Back to dashboard
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setPage('signout-confirm')}>
                Sign out
              </button>
              {isCloudMode && (
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={deleting}
                  onClick={async () => {
                    if (!window.confirm('Delete your account and all cloud data? This cannot be undone.')) return;
                    setDeleting(true);
                    setDeleteError('');
                    try {
                      await deleteAccount();
                      setPage('landing');
                    } catch (err) {
                      setDeleteError(err.message || 'Could not delete account.');
                    } finally {
                      setDeleting(false);
                    }
                  }}
                >
                  {deleting ? 'Deleting…' : 'Delete account'}
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
