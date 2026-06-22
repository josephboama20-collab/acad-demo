import { Fragment, useEffect, useState } from 'react';
import { getPlanTimeline, splitCountdown } from '../utils/planTimeline.js';

const COUNTDOWN_UNITS = [
  { key: 'months', label: 'Mo', pad: 2 },
  { key: 'weeks', label: 'Wk', pad: 2 },
  { key: 'days', label: 'Day', pad: 2 },
  { key: 'hours', label: 'Hr', pad: 2 },
  { key: 'minutes', label: 'Min', pad: 2 },
  { key: 'seconds', label: 'Sec', pad: 2 },
];

export default function PlanCountdown({
  profile,
  endedLabel = 'Complete',
  variant = 'default',
  showEndDate = false,
}) {
  const [now, setNow] = useState(Date.now());
  const compact = variant === 'compact';

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeline = getPlanTimeline(profile);
  const remainingMs = Math.max(0, timeline.endAt.getTime() - now);
  const parts = splitCountdown(remainingMs);

  if (timeline.isEnded || remainingMs <= 0) {
    return (
      <div className={`plan-countdown plan-countdown-ended${compact ? ' compact' : ''}`} role="timer" aria-live="polite">
        <p className="plan-countdown-complete">{endedLabel}</p>
      </div>
    );
  }

  return (
    <div className={`plan-countdown${compact ? ' compact' : ''}`} role="timer" aria-live="polite" aria-label="Time until plan ends">
      <div className="plan-countdown-units">
        {COUNTDOWN_UNITS.map((unit, index) => (
          <Fragment key={unit.key}>
            {index > 0 && <span className="plan-countdown-sep" aria-hidden="true">:</span>}
            <div className="plan-countdown-unit">
              <span className="plan-countdown-val">{String(parts[unit.key]).padStart(unit.pad, '0')}</span>
              <span className="plan-countdown-lbl">{unit.label}</span>
            </div>
          </Fragment>
        ))}
      </div>
      {showEndDate && (
        <p className="plan-countdown-hint">
          {timeline.endAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}
    </div>
  );
}
