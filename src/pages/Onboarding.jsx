import { useState } from 'react';
import { ONBOARDING_QUESTIONS } from '../data/constants.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Onboarding({ setPage }) {
  const { setProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [animKey, setAnimKey] = useState(0);

  const q = ONBOARDING_QUESTIONS[step];
  const total = ONBOARDING_QUESTIONS.length;
  const progress = ((step + 1) / total) * 100;

  function next() {
    if (!selected) return;
    const merged = { ...answers, [q.id]: selected };
    setAnswers(merged);
    if (step < total - 1) {
      setStep((s) => s + 1);
      setSelected(merged[ONBOARDING_QUESTIONS[step + 1].id] || null);
      setAnimKey((k) => k + 1);
    } else {
      setProfile({ ...merged, startedAt: new Date().toISOString() });
      setPage('dashboard');
    }
  }

  function back() {
    if (step === 0) return;
    setStep((s) => s - 1);
    setSelected(answers[ONBOARDING_QUESTIONS[step - 1].id] || null);
    setAnimKey((k) => k + 1);
  }

  return (
    <main className="page ob-page">
      <div className="ob-wrap">
        <section className="ob-panel">
          <div className="ob-meta">
            <span className="ob-counter">{step + 1} <span className="ob-counter-sep">/</span> {total}</span>
            <span className="ob-phase">Profile setup</span>
          </div>
          <div className="ob-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="ob-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="ob-question-wrap anim-fade-up" key={animKey}>
            <h2 className="ob-q">{q.q}</h2>
            <p className="ob-hint">{q.hint}</p>
            <div className="ob-options" role="radiogroup">
              {q.opts.map((opt, i) => (
                <button key={opt} id={`btn-ob-option-${i}`} className={`ob-opt${selected === opt ? ' sel' : ''}`} role="radio" aria-checked={selected === opt} onClick={() => setSelected(opt)}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <nav className="ob-nav" aria-label="Question navigation">
            <button id="btn-ob-back" className="btn btn-ghost" onClick={back} disabled={step === 0}>Back</button>
            <button id="btn-ob-continue" className="btn btn-primary" onClick={next} disabled={!selected}>
              {step === total - 1 ? 'Build my profile' : 'Continue'}
            </button>
          </nav>
        </section>
      </div>
    </main>
  );
}
