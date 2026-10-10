import { dismissSetupChecklist } from '../utils/conditioningProgress.js';

export default function SetupChecklist({ items, setupPct, setPage, onDismiss }) {
  const pending = items.filter((item) => !item.optional && !item.done);

  function handleDismiss() {
    dismissSetupChecklist();
    onDismiss?.();
  }

  return (
    <section className="card dash-setup-card" aria-label="Getting started checklist">
      <div className="dash-plan-head">
        <div>
          <p className="card-label">Getting started</p>
          <p className="card-sublabel">Finish these as you explore — no rush.</p>
        </div>
        <span className="dash-conditioning-overall font-mono">{setupPct}%</span>
      </div>
      <div className="dash-setup-list">
        {items.filter((item) => !item.optional).map((item) => (
          <button
            key={item.id}
            type="button"
            className={`dash-setup-row${item.done ? ' done' : ''}`}
            onClick={() => item.page && setPage(item.page)}
            disabled={item.done}
          >
            <span className="dash-setup-check" aria-hidden="true">{item.done ? '✓' : '○'}</span>
            <span className="dash-setup-body">
              <span className="dash-setup-label">{item.label}</span>
              <span className="dash-setup-detail">{item.detail}</span>
            </span>
            {!item.done && item.page && <span className="dash-setup-go">Go →</span>}
          </button>
        ))}
      </div>
      {pending.length === 0 || setupPct >= 80 ? (
        <button type="button" className="btn btn-ghost btn-sm dash-setup-dismiss" onClick={handleDismiss}>
          Dismiss checklist
        </button>
      ) : null}
    </section>
  );
}
