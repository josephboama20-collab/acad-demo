import { useEffect, useId } from 'react';

export default function Modal({ title, body, confirmLabel = 'Confirm', confirmClass = 'btn-primary', confirmDisabled = false, onConfirm, onCancel }) {
  const titleId = useId();

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="modal anim-fade-up">
        <h2 id={titleId} className="modal-title">{title}</h2>
        <div className="modal-body">{typeof body === 'string' ? <p>{body}</p> : body}</div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="button" className={`btn ${confirmClass}`} onClick={onConfirm} disabled={confirmDisabled}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
