import { useEffect, useState } from 'react';

const COMPOUND_TIPS = [
  'Your data compounds with every semester logged.',
  'Earlier you start, richer your insights become.',
  'Semester history powers your analytics and trends.',
  'Every term you log sharpens your grade trends and improvement suggestions.',
  'Students who start at Level 100 unlock the richest analytics over time.',
  'Your course data builds into a personal academic history that travels with you.',
  'Log grades across semesters and Acad surfaces exactly where to focus next.',
];

function randomTip() {
  return COMPOUND_TIPS[Math.floor(Math.random() * COMPOUND_TIPS.length)];
}

export default function Loader({ label = 'Loading', onDone, compoundRotation = false }) {
  const [tip, setTip] = useState(() => (compoundRotation ? randomTip() : null));
  const [counter, setCounter] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!onDone) return;
    const done = setTimeout(onDone, compoundRotation ? 2200 : 500);
    return () => clearTimeout(done);
  }, [onDone, compoundRotation]);

  useEffect(() => {
    if (!compoundRotation) return;
    const id = setInterval(() => {
      setCounter((c) => c + 1);
      setVisible(false);
    }, 2800);
    return () => clearInterval(id);
  }, [compoundRotation]);

  useEffect(() => {
    if (!compoundRotation) return;
    const show = setTimeout(() => {
      setTip(randomTip());
      setVisible(true);
    }, 200);
    return () => clearTimeout(show);
  }, [counter, compoundRotation]);

  return (
    <div className="lo" role="status" aria-label="Loading">
      <div className="lo-spinner" aria-hidden="true" />
      <span className="lo-sub">{label}</span>
      {compoundRotation && tip && (
        <p className={`lo-tip${visible ? ' tip-visible' : ''}`} aria-live="polite">
          {tip}
        </p>
      )}
    </div>
  );
}
