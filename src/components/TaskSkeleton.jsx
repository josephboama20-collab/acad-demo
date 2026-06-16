export default function TaskSkeleton() {
  return (
    <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="skeleton" style={{ height: 8, width: '28%' }} />
      <div className="skeleton" style={{ height: 20, width: '52%' }} />
      <div style={{ height: 4 }} />
      <div className="ai-bar">
        <div className="ai-dot pulse" />
        <span style={{ fontSize: 10, color: 'var(--slate)' }}>Generating your task…</span>
      </div>
      <div className="skeleton" style={{ height: 9, width: '100%' }} />
      <div className="skeleton" style={{ height: 9, width: '84%' }} />
      <div className="skeleton" style={{ height: 9, width: '66%' }} />
      <div style={{ height: 8 }} />
      <div className="skeleton" style={{ height: 36, width: '30%' }} />
    </div>
  );
}
