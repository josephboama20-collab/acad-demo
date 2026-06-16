import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useAppNotifications } from '../utils/notifications.js';

const TYPE_LABEL = { reminder: 'Reminder', alert: 'Alert', suggestion: 'Suggestion' };

function NotificationsPanel({ items, open, onClose, onClearAll }) {
  if (!open) return null;
  return (
    <aside className="acad-notif-panel" aria-label="Notifications">
      <div className="acad-notif-head">
        <h2>Notifications</h2>
        <div className="acad-notif-head-actions">
          {items.length > 0 && (
            <button type="button" className="acad-notif-clear" onClick={onClearAll}>
              Clear all
            </button>
          )}
          <button type="button" className="acad-notif-close" onClick={onClose} aria-label="Close panel">
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="acad-notif-list">
        {items.length === 0 ? (
          <p className="acad-notif-empty">You are all caught up.</p>
        ) : (
          items.map((n) => (
            <div key={n.id} className="acad-notif-item">
              <span className="acad-notif-type">{TYPE_LABEL[n.type] || 'Update'}</span>
              <p className="acad-notif-title">{n.title}</p>
              <p className="acad-notif-body">{n.body}</p>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="acad-toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="acad-toast">
          <div>
            <p className="acad-toast-title">{t.title}</p>
            <p className="acad-toast-body">{t.body}</p>
          </div>
          <button type="button" className="acad-toast-close" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function AppNotifications() {
  const notifications = useAppNotifications();
  const [panelOpen, setPanelOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('acad_notif_dismissed') || '[]');
    } catch {
      return [];
    }
  });

  const visible = notifications.filter((n) => !dismissed.includes(n.id));

  useEffect(() => {
    if (!visible.length) return;
    setToasts(visible.slice(0, 1));
    const timer = setTimeout(() => setToasts([]), 7000);
    return () => clearTimeout(timer);
  }, [visible.length]);

  function dismissToast(id) {
    setToasts((t) => t.filter((x) => x.id !== id));
    setDismissed((d) => {
      const next = [...new Set([...d, id])];
      localStorage.setItem('acad_notif_dismissed', JSON.stringify(next));
      return next;
    });
  }

  function clearAllNotifications() {
    const allIds = notifications.map((n) => n.id);
    setToasts([]);
    setDismissed((d) => {
      const next = [...new Set([...d, ...allIds])];
      localStorage.setItem('acad_notif_dismissed', JSON.stringify(next));
      return next;
    });
  }

  return (
    <>
      <button
        type="button"
        className="acad-notif-fab"
        onClick={() => setPanelOpen(true)}
        aria-label="Open notifications"
      >
        <Bell size={18} strokeWidth={2} />
        {visible.length > 0 && <span className="acad-notif-badge">{visible.length}</span>}
      </button>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <NotificationsPanel items={visible} open={panelOpen} onClose={() => setPanelOpen(false)} onClearAll={clearAllNotifications} />
      {panelOpen && <div className="acad-notif-backdrop" onClick={() => setPanelOpen(false)} aria-hidden="true" />}
    </>
  );
}
