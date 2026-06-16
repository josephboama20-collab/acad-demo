import { usePlanCapacity } from '../hooks/usePlanCapacity.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function PlanBanner({ compact = false }) {
  const { plan } = usePlanCapacity();
  const { profile } = useAuth();

  if (compact) {
    return (
      <p className="plan-banner-compact">
        {plan.durationLabel} · {plan.courseCount}/{plan.maxCourses} courses
        {plan.slotsLeft > 0 ? ` · ${plan.slotsLeft} slot${plan.slotsLeft === 1 ? '' : 's'} left` : ' · at limit'}
      </p>
    );
  }

  const slotsPct = plan.maxCourses > 0 ? Math.round((plan.courseCount / plan.maxCourses) * 100) : 0;

  return (
    <aside className="plan-banner plan-banner-redesign" aria-label="Your plan">
      <div className="plan-banner-grid">
        <div className="plan-banner-primary">
          <p className="plan-banner-kicker">Your plan</p>
          <p className="plan-banner-duration">{plan.durationLabel}</p>
          <p className="plan-banner-body">{plan.message}</p>
        </div>
        <div className="plan-banner-stats">
          <div className="plan-stat-card">
            <span className="plan-stat-val font-mono">{plan.courseCount}</span>
            <span className="plan-stat-lbl">Courses added</span>
          </div>
          <div className="plan-stat-card">
            <span className="plan-stat-val font-mono">{plan.maxCourses}</span>
            <span className="plan-stat-lbl">Plan capacity</span>
          </div>
          <div className="plan-stat-card">
            <span className="plan-stat-val font-mono">{plan.slotsLeft}</span>
            <span className="plan-stat-lbl">Slots remaining</span>
          </div>
        </div>
      </div>
      <div className="plan-banner-foot">
        <div className="plan-capacity-bar" role="progressbar" aria-valuenow={slotsPct} aria-valuemin={0} aria-valuemax={100}>
          <div className="plan-capacity-fill" style={{ width: `${slotsPct}%` }} />
        </div>
        <div className="plan-banner-meta">
          <span>{plan.courseCount} / {plan.maxCourses} courses</span>
          {profile?.sharpness && <span>State: {profile.sharpness.split(' ')[0]}</span>}
          {profile?.intention && <span>Goal: {profile.intention}</span>}
          {plan.atCourseLimit && <span className="plan-banner-limit">At your plan limit. Remove a course to swap.</span>}
          {plan.needsCourses && <span className="plan-banner-cta">Add courses to unlock tools</span>}
        </div>
      </div>
    </aside>
  );
}
