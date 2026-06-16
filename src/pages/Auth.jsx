import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  applyPlanSeed,
  buildPlanSeed,
  getPlanAccount,
  isPlanLogin,
  PLAN_ACCOUNTS,
  PLAN_DEMO_PASSWORD,
  writePlanSeedToLocal,
} from '../data/demoAccount.js';
import { isCloudEnabled } from '../lib/supabase.js';
import { pushAllBucketsToCloud } from '../utils/cloudSync.js';
import Loader from '../components/Loader.jsx';

export default function Auth({ setPage, initialMode = 'signup' }) {
  const { profile, signUp, signIn, setUser } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', email: '', password: '', acceptTerms: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  function fillPlan(account) {
    setForm({
      name: account.name,
      email: account.email,
      password: account.password,
      acceptTerms: true,
    });
    setMode('login');
    setError('');
  }

  async function handlePlanDemo(accountId) {
    setError('');
    const account = getPlanAccount(accountId);
    if (!account) return;

    if (!isCloudEnabled()) {
      applyPlanSeed(accountId);
      return;
    }

    setLoading(true);
    try {
      const data = await signIn({ email: account.email, password: account.password });
      const seed = buildPlanSeed(accountId);
      writePlanSeedToLocal(seed);
      await pushAllBucketsToCloud(data.user.id, {
        scholar: seed.scholar,
        game: seed.game,
        courses: seed.courses,
        flashcards: seed.flashcards,
        habits: seed.habits,
        forge: seed.forge,
      });
      window.location.reload();
    } catch (err) {
      setError(
        err.message?.includes('Invalid login')
          ? `Demo user not provisioned. Create ${account.email} via scripts/seed-demo-users.mjs`
          : err.message || 'Demo sign-in failed.',
      );
      setLoading(false);
    }
  }

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

    const planAccount = getPlanAccount(form.email);
    if (planAccount && isPlanLogin(form.email, form.password)) {
      await handlePlanDemo(planAccount.id);
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
              : 'Local mode — data stays on this device until cloud is configured.'}
          </p>
          <div className="auth-tabs" role="tablist">
            <button id="btn-auth-tab-signup" className={`auth-tab${mode === 'signup' ? ' on' : ''}`} role="tab" aria-selected={mode === 'signup'} onClick={() => setMode('signup')}>New account</button>
            <button id="btn-auth-tab-login" className={`auth-tab${mode === 'login' ? ' on' : ''}`} role="tab" aria-selected={mode === 'login'} onClick={() => setMode('login')}>Sign in</button>
          </div>
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label" htmlFor="input-auth-name">Full Name</label>
              <input id="input-auth-name" className="form-input" placeholder="Your name" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
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
          <button id="btn-auth-submit" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={submit}>
            {mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>

          <div className="auth-demo-block">
            <p className="auth-demo-label">Try a plan (one click)</p>
            <p className="auth-demo-hint">
              Every demo uses password <span className="font-mono">{PLAN_DEMO_PASSWORD}</span>
            </p>
            <div className="auth-plan-grid">
              {PLAN_ACCOUNTS.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  id={`btn-auth-plan-${account.id}`}
                  className="auth-plan-card"
                  onClick={() => handlePlanDemo(account.id)}
                >
                  <span className="auth-plan-label">{account.label}</span>
                  <span className="auth-plan-tag">{account.tagline}</span>
                  <span className="auth-plan-email font-mono">{account.email}</span>
                </button>
              ))}
            </div>
            <button type="button" className="auth-demo-fill" onClick={() => fillPlan(PLAN_ACCOUNTS[1])}>
              Fill 1-month credentials into form
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
