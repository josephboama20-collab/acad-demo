export default function Kpi({ id, value, label, gold }) {
  return (
    <div id={id} className="kpi" role="listitem">
      <div className={`kpi-val font-mono${gold ? ' gold' : ''}`}>{value}</div>
      <div className="kpi-lbl">{label}</div>
    </div>
  );
}
