export default function ContextNote({ principle, body }) {
  return (
    <aside className="ctx-note">
      <p className="ctx-lbl">Why this matters</p>
      <p className="ctx-title">{principle}</p>
      <p className="ctx-body">{body}</p>
    </aside>
  );
}
