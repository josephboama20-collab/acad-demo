import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  applyPlanSeed,
  getPlanAccount,
  isPlanLogin,
  PLAN_ACCOUNTS,
  PLAN_DEMO_PASSWORD,
} from '../data/demoAccount.js';
import Loader from '../components/Loader.jsx';

export default function Auth({ setPage, initialMode = 'signup' }) {
  const { setUser, profile } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  function fillPlan(account) {
    setForm({
      name: account.name,
      email: account.email,
      password: account.password,
    });
    setMode('login');
    setError('');
  }

  function submit() {
    setError('');
    if (!form.email || !form.password) {
      setError('Please complete all fields.');
      return;
    }
    if (mode === 'signup' && !form.name) {
      setError('Please enter your name.');
      return;
    }
    const planAccount = getPlanAccount(form.email);
    if (planAccount && isPlanLogin(form.email, form.password)) {
      applyPlanSeed(planAccount.id);
      return;
    }
    setLoading(true);
  }

  if (loading) {
    return (
      <Loader
        label={mode === 'signup' ? 'Creating account…' : 'Signing in…'}
        onDone={() => {
          setUser({ name: form.name || form.email.split('@')[0], email: form.email });
          if (mode === 'signup') {
            setPage('onboarding');
          } else {
            setPage(profile ? 'dashboard' : 'onboarding');
          }
        }}
      />
    );
  }

  return (
    <main className="page anim-fade-in">
      <div className="auth-wrap">
        <section className="auth-panel">
          <p className="auth-kicker">{mode === 'signup' ? 'New member' : 'Welcome back'}</p>
          <h1 className="auth-title">{mode === 'signup' ? 'Create your account' : 'Sign in to Acad'}</h1>
          <p className="auth-sub">{mode === 'signup' ? 'Your profile setup takes about two minutes.' : 'Continue where you left off.'}</p>
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
                  onClick={() => applyPlanSeed(account.id)}
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
