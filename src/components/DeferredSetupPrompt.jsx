import { useState } from 'react';
import { getDeferredHabitQuestion, getNextDeferredHabit } from '../utils/deferredSetup.js';

export default function DeferredSetupPrompt({ profile, setProfile }) {
  const [selected, setSelected] = useState(null);
  const [dismissedId, setDismissedId] = useState(null);

  const nextId = getNextDeferredHabit(profile);
  if (!nextId || dismissedId === nextId) return null;

  const question = getDeferredHabitQuestion(nextId);
  if (!question) return null;

  function save(choice) {
    setProfile({ ...profile, [nextId]: choice });
    setSelected(null);
    setDismissedId(null);
  }

  return (
    <section className="card dash-deferred-card" aria-label="Quick personalisation">
      <div className="dash-deferred-head">
        <p className="card-label">{question.label}</p>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setDismissedId(nextId)}
        >
          Later
        </button>
      </div>
      <p className="card-sublabel">{question.context || question.hint}</p>
      <div className="ob-options dash-deferred-options" role="radiogroup">
        {question.opts.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`ob-opt${selected === opt ? ' sel' : ''}`}
            onClick={() => {
              setSelected(opt);
              save(opt);
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </section>
  );
}
