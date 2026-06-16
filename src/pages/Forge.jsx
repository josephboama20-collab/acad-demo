import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getMilestoneProgress, loadForgeWorkspace, saveForgeWorkspace } from '../utils/forgeStorage.js';
import { resolveProjectMilestones } from '../utils/projects.js';
import ContextNote from '../components/ContextNote.jsx';

export default function Forge({ setPage, project }) {
  const { setFocusMode, settings, saveProject, userId } = useAuth();
  const [milestones, setMilestones] = useState({});
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState(false);

  const milestoneDefs = useMemo(
    () => (project ? resolveProjectMilestones(project) : []),
    [project],
  );

  useEffect(() => {
    if (!project?.title) return;
    const ws = loadForgeWorkspace(project.title);
    setDraft(ws.draft);
    setMilestones(getMilestoneProgress(project));
  }, [project]);

  if (!project) {
    return (
      <main className="page forge-empty">
        <div className="container">
          <p className="pb-ey">Project workspace</p>
          <div className="empty-state" style={{ marginTop: 24 }}>
            <p className="empty-state-title">No project open</p>
            <p className="empty-state-desc">Generate a project or open one from your saved list.</p>
            <button className="btn btn-primary" onClick={() => setPage('projects')}>Go to projects</button>
          </div>
        </div>
      </main>
    );
  }

  function toggleMilestone(i) {
    setMilestones((prev) => {
      const next = { ...prev, [i]: !prev[i] };
      saveForgeWorkspace(project.title, { draft, milestones: next }, userId);
      return next;
    });
  }

  const total = milestoneDefs.length;
  const done = Object.values(milestones).filter(Boolean).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  function saveDraft() {
    saveForgeWorkspace(project.title, { draft, milestones }, userId);
    saveProject({ ...project, draftPreview: draft.slice(0, 120) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function onDraftChange(value) {
    setDraft(value);
    saveForgeWorkspace(project.title, { draft: value, milestones }, userId);
  }

  return (
    <main className={`page forge-page${settings.focusMode ? ' focus-mode' : ''}`}>
      <div className="forge-topbar">
        <div className="forge-topbar-inner container">
          <div className="forge-topbar-left">
            <button
              id="btn-forge-back"
              className="btn btn-ghost"
              onClick={() => {
                setFocusMode(false);
                setPage('projects');
              }}
            >
              Back to projects
            </button>
            <div>
              <p className="forge-kicker">Project workspace</p>
              <h1 className="forge-title">{project.title}</h1>
            </div>
          </div>
          <div className="forge-topbar-right">
            <span className="forge-progress-pct font-mono">{pct}%</span>
            <button
              id="btn-forge-focus"
              className={`btn ${settings.focusMode ? 'btn-outline' : 'btn-ghost'}`}
              onClick={() => setFocusMode(!settings.focusMode)}
            >
              {settings.focusMode ? 'Exit focus' : 'Focus mode'}
            </button>
          </div>
        </div>
      </div>

      <div className="forge-body container">
        <aside className="forge-sidebar" aria-label="Project milestones">
          <p className="forge-sidebar-label">Milestones</p>
          <div className="forge-progress-bar">
            <div className="forge-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="forge-progress-meta font-mono">
            {done} / {total} complete
          </p>
          <div className="forge-miles">
            {milestoneDefs.map((m, i) => (
              <button
                key={i}
                id={`btn-forge-mile-${i}`}
                className={`forge-mile${milestones[i] ? ' done' : ''}`}
                onClick={() => toggleMilestone(i)}
                aria-pressed={!!milestones[i]}
              >
                <span className="forge-mile-n font-mono">{String(i + 1).padStart(2, '0')}</span>
                <div className="forge-mile-body">
                  <p className="forge-mile-t">{m.title}</p>
                  <p className="forge-mile-w">{m.week}</p>
                </div>
                <span className={`forge-mile-chk${milestones[i] ? ' done' : ''}`} aria-hidden="true" />
              </button>
            ))}
          </div>
          {project.principle && (
            <div className="forge-sidebar-ctx">
              <ContextNote principle={project.principle} body={project.why || ''} />
            </div>
          )}
        </aside>

        <section className="forge-canvas" aria-label="Drafting canvas">
          <div className="forge-canvas-head">
            <div>
              <p className="forge-canvas-label">Output draft</p>
              <p className="forge-canvas-sub">{project.outcome}</p>
            </div>
            <button id="btn-forge-save" className="btn btn-outline" onClick={saveDraft}>
              {saved ? 'Saved' : 'Save draft'}
            </button>
          </div>
          <textarea
            id="input-forge-draft"
            className="forge-textarea"
            placeholder={`Begin drafting your output here.\n\nObjective: ${project.objective}`}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            aria-label="Project draft"
          />
          <div className="forge-canvas-foot">
            <span className="forge-char-count font-mono">{draft.length} characters</span>
            {project.portfolio && (
              <p className="port-body" style={{ marginTop: 8, fontSize: 11, color: 'var(--slate)' }}>{project.portfolio}</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
