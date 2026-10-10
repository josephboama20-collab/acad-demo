import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { isCloudEnabled } from '../lib/supabase.js';
import Loader from '../components/Loader.jsx';

const STAGING_CLOUD_REQUIRED = import.meta.env.VITE_APP_ENV === 'staging' && !isCloudEnabled();

/** Turn a Supabase/auth error into a readable message (never a bare "{}"). */
function readAuthError(err, fallback) {
  const raw = typeof err === 'string' ? err : err?.message;
  const msg = raw && String(raw).trim() !== '{}' ? String(raw).trim() : '';

  if (!msg || /failed to fetch|networkerror|network request failed|load failed|503/i.test(msg)) {
    return 'Can’t reach the server right now - it may be waking up or offline. Check your connection and try again in a moment.';
  }
  if (/user already registered/i.test(msg)) {
    return 'An account with this email already exists - try signing in instead.';
  }
  if (/invalid login credentials/i.test(msg)) {
    return 'Incorrect email or password.';
  }
  if (/email not confirmed/i.test(msg)) {
    return 'Please confirm your email address before signing in.';
  }
  return msg || fallback;
}

export default function Auth({ setPage, initialMode = 'signup' }) {
  const { profile, signUp, signIn, setUser, resetPassword } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', email: '', password: '', acceptTerms: false });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  async function submit() {
    setError('');
    setInfo('');
    if (!form.email || !form.password) {
      setError('Please complete all fields.');
      return;
    }
    if (mode === 'signup' && form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (mode === 'signup' && !form.name) {
      setError('Please enter your name.');
      return;
    }
    if (mode === 'signup' && isCloudEnabled() && !form.acceptTerms) {
      setError('Please accept the privacy policy and terms to create an account.');
      return;
    }

    if (!isCloudEnabled()) {
      setLoading(true);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUp({ email: form.email, password: form.password, name: form.name });
        setPage('onboarding');
      } else {
        await signIn({ email: form.email, password: form.password });
        setPage(profile ? 'dashboard' : 'onboarding');
      }
    } catch (err) {
      setError(readAuthError(err, 'Authentication failed.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError('');
    setInfo('');
    if (!form.email) {
      setError('Enter your email address first, then tap forgot password.');
      return;
    }
    if (!isCloudEnabled()) {
      setError('Password reset requires cloud mode.');
      return;
    }
    try {
      await resetPassword(form.email);
      setInfo('If an account exists for that email, a reset link has been sent.');
    } catch (err) {
      setError(readAuthError(err, 'Could not send reset email.'));
    }
  }

  if (loading && !isCloudEnabled()) {
    return (
      <Loader
        label={mode === 'signup' ? 'Creating account…' : 'Signing in…'}
        onDone={() => {
          setUser({ name: form.name || form.email.split('@')[0], email: form.email });
          setPage(mode === 'signup' ? 'onboarding' : profile ? 'dashboard' : 'onboarding');
        }}
      />
    );
  }

  if (loading && isCloudEnabled()) {
    return (
      <div className="page" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <p className="fc-sub">Signing in and syncing your data…</p>
      </div>
    );
  }

  return (
    <main className="page anim-fade-in">
      <div className="auth-wrap">
        <section className="auth-panel">
          <p className="auth-kicker">{mode === 'signup' ? 'New member' : 'Welcome back'}</p>
          <h1 className="auth-title">{mode === 'signup' ? 'Create your account' : 'Sign in to Acad'}</h1>
          <p className="auth-sub">
            {isCloudEnabled()
              ? 'Your progress syncs across devices when you sign in.'
              : STAGING_CLOUD_REQUIRED
                ? 'Staging requires Supabase - add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your host.'
                : 'Local mode - data stays on this device until cloud is configured.'}
          </p>
          {STAGING_CLOUD_REQUIRED && (
            <p className="form-error" role="alert" style={{ marginTop: 12 }}>
              Cloud auth is not configured on this build. See docs/TIER_2.md.
            </p>
          )}
          <div className="auth-tabs" role="tablist">
            <button id="btn-auth-tab-signup" className={`auth-tab${mode === 'signup' ? ' on' : ''}`} role="tab" aria-selected={mode === 'signup'} onClick={() => setMode('signup')}>New account</button>
            <button id="btn-auth-tab-login" className={`auth-tab${mode === 'login' ? ' on' : ''}`} role="tab" aria-selected={mode === 'login'} onClick={() => setMode('login')}>Sign in</button>
          </div>
          {mode === 'signup' && (
            <>
              <p className="auth-setup-note">
                About five minutes after signup - university, one semester of grades, and your first focus course.
                Everything else unfolds on your dashboard.
              </p>
              <div className="form-group">
                <label className="form-label" htmlFor="input-auth-name">Full Name</label>
                <input id="input-auth-name" className="form-input" placeholder="Your name" value={form.name} onChange={(e) => update('name', e.target.value)} />
              </div>
            </>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="input-auth-email">Email Address</label>
            <input id="input-auth-email" className="form-input" type="email" placeholder="you@email.com" value={form.email} onChange={(e) => update('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="input-auth-password">Password</label>
            <div className="auth-password-row">
              <input
                id="input-auth-password"
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter password'}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm auth-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          {mode === 'login' && isCloudEnabled() && (
            <button type="button" className="auth-forgot-link" onClick={handleForgotPassword}>
              Forgot password?
            </button>
          )}
          {mode === 'signup' && isCloudEnabled() && (
            <label className="auth-terms">
              <input
                type="checkbox"
                checked={form.acceptTerms}
                onChange={(e) => update('acceptTerms', e.target.checked)}
                aria-required="true"
              />
              <span>
                I agree to the{' '}
                <button
                  type="button"
                  className="auth-terms-link"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPage('privacy');
                  }}
                >
                  Privacy Policy
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  className="auth-terms-link"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPage('terms');
                  }}
                >
                  Terms of Use
                </button>
                .
              </span>
            </label>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          {info && <p className="auth-info" role="status">{info}</p>}
          <button
            id="btn-auth-submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 16 }}
            onClick={submit}
            disabled={STAGING_CLOUD_REQUIRED}
          >
            {mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </section>
      </div>
    </main>
  );
}
