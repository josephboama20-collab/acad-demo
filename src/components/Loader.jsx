import { useEffect } from 'react';

export default function Loader({ label = 'Loading', onDone }) {
  useEffect(() => {
    if (!onDone) return;
    const done = setTimeout(onDone, 500);
    return () => clearTimeout(done);
  }, [onDone]);

  return (
    <div className="lo" role="status" aria-label="Loading">
      <div className="lo-spinner" aria-hidden="true" />
      <span className="lo-sub">{label}</span>
    </div>
  );
}
