export default function RadarChart({ scores, labels, className = 'radar-svg' }) {
  const n = scores.length;
  const step = (2 * Math.PI) / n;

  const point = (i, radius) => {
    const angle = (i * step) - Math.PI / 2;
    return { x: 100 + radius * Math.cos(angle), y: 100 + radius * Math.sin(angle) };
  };

  const rings = [0.25, 0.5, 0.75, 1];
  const dataPts = scores.map((s, i) => point(i, (s / 100) * 80));
  const path = dataPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={`Skill balance: ${labels.map((l, i) => `${l} ${scores[i]}%`).join(', ')}`}>
      {rings.map((r) => (
        <path
          key={r}
          d={Array.from({ length: n }, (_, i) => point(i, 80 * r))
            .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
            .join(' ') + 'Z'}
          className="radar-grid"
        />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const p = point(i, 80);
        return <line key={i} x1={100} y1={100} x2={p.x} y2={p.y} className="radar-spoke" />;
      })}
      <path d={path} className="radar-data" />
      {dataPts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} className="radar-dot" />
      ))}
      {labels.map((label, i) => {
        const p = point(i, 98);
        return (
          <text key={label} x={p.x} y={p.y} className="radar-label" textAnchor="middle" dominantBaseline="middle">
            {label}
          </text>
        );
      })}
    </svg>
  );
}
