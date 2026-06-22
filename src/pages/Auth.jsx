import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { isCloudEnabled } from '../lib/supabase.js';
import Loader from '../components/Loader.jsx';

const STAGING_CLOUD_REQUIRED = import.meta.env.VITE_APP_ENV === 'staging' && !isCloudEnabled();

export default function Auth({ setPage, initialMode = 'signup' }) {
  const { profile, signUp, signIn, setUser } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', email: '', password: '', acceptTerms: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  async function submit() {
    setError('');
    if (!form.email || !form.password) {
      setError('Please complete all fields.');
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
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
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
                ? 'Staging requires Supabase — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your host.'
                : 'Local mode — data stays on this device until cloud is configured.'}
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
                After creating your account, you will complete a thorough academic setup — university, programme, and grades.
                Accurate, properly capitalized names help AI map your curriculum. You can correct anything AI gets wrong.
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
            <input id="input-auth-password" className="form-input" type="password" placeholder="Enter password" value={form.password} onChange={(e) => update('password', e.target.value)} />
          </div>
          {mode === 'signup' && isCloudEnabled() && (
            <label className="auth-terms">
              <input type="checkbox" checked={form.acceptTerms} onChange={(e) => update('acceptTerms', e.target.checked)} />
              <span>
                I agree to the{' '}
                <button type="button" className="auth-terms-link" onClick={() => setPage('privacy')}>Privacy Policy</button>
                {' '}and{' '}
                <button type="button" className="auth-terms-link" onClick={() => setPage('terms')}>Terms of Use</button>.
              </span>
            </label>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
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
