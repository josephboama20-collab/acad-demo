import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCourses } from '../contexts/CoursesContext.jsx';
import { generateCourseProjects } from '../utils/projects.js';
import { canAccessProjects, projectUnlockProgress } from '../utils/projectEligibility.js';
import ContextNote from '../components/ContextNote.jsx';

function ProjectOutCard({ project, onOpen, onSave, saveLabel = 'Save to portfolio' }) {
  const courseCode = project.courseCode || project.domain || 'Course';
  const topicName = project.topicName || project.skillFocus || 'Focus area';
  const mastery = project.focusMastery ?? '—';

  return (
    <div className="proj-out anim-fade-up">
      <header className="proj-head">
        <div className="proj-tags">
          <span className="tag">{courseCode}</span>
          <span className="tag tag-mist">{topicName}</span>
          {project.difficulty && <span className="tag tag-green">{project.difficulty}</span>}
        </div>
        <h2 className="proj-title">{project.title}</h2>
        <p className="proj-obj">{project.objective}</p>
        {project.portfolio && <p className="proj-portfolio-note">{project.portfolio}</p>}
      </header>
      <div className="proj-meta">
        {[['Timeline', project.timeline], ['Focus topic', topicName], ['Current mastery', typeof mastery === 'number' ? `${mastery}%` : mastery]].map(([k, v]) => (
          <div key={k}>
            <p className="meta-lbl">{k}</p>
            <p className="meta-val">{v}</p>
          </div>
        ))}
      </div>
      {project.principle && (
        <div style={{ padding: '0 28px 12px' }}>
          <ContextNote principle={project.principle} body={project.why || ''} />
        </div>
      )}
      <div className="proj-acts">
        <button className="btn btn-primary" onClick={onOpen}>
          Open workspace
        </button>
        {onSave && (
          <button className="btn btn-outline" onClick={onSave}>
            {saveLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function LockedState({ progress, setPage }) {
  return (
    <section className="proj-locked card" aria-label="Projects locked">
      <p className="card-label">Unlock portfolio projects</p>
      <p className="proj-locked-desc">
        Projects are generated from the courses and topics you are actively improving. They unlock once you show consistent effort, not before.
      </p>
      <div className="proj-unlock-checks">
        {progress.checks.map((c) => (
          <div key={c.label} className={`proj-unlock-row${c.done ? ' done' : ''}`}>
            <span className="proj-unlock-icon">{c.done ? '✓' : '○'}</span>
            <span>{c.label}</span>
            <span className="proj-unlock-val font-mono">{c.current}/{c.target}</span>
          </div>
        ))}
      </div>
      <div className="prog-bar" style={{ marginTop: 16 }}>
        <div className="prog-fill" style={{ width: `${progress.pct}%` }} />
      </div>
      <p className="proj-locked-hint">{progress.pct}% toward unlock · Keep your daily streak and complete tasks</p>
      <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => setPage('dashboard')}>Back to dashboard</button>
    </section>
  );
}

export default function Projects({ setPage }) {
  const { projects, saveProject, streak, metrics, profile } = useAuth();
  const { courses, weakTopics } = useCourses();
  const unlocked = canAccessProjects(streak, metrics, profile);
  const progress = projectUnlockProgress(streak, metrics, profile);

  const suggestions = useMemo(
    () => (unlocked && courses.length > 0 ? generateCourseProjects(courses, weakTopics) : []),
    [unlocked, courses, weakTopics],
  );

  const savedTitles = new Set(projects.map((p) => p.title));
  const filteredSuggestions = suggestions.filter((p) => !savedTitles.has(p.title));

  if (!unlocked) {
    return (
      <main className="page pb-page anim-fade-in">
        <div className="pb-wrap container">
          <p className="pb-ey">Projects</p>
          <h1 className="pb-title">Portfolio projects</h1>
          <p className="pb-sub">Proof-of-understanding work tailored to the courses and topics you are actively improving.</p>
          <LockedState progress={progress} setPage={setPage} />
        </div>
      </main>
    );
  }

  if (courses.length === 0) {
    return (
      <main className="page pb-page anim-fade-in">
        <div className="pb-wrap container">
          <p className="pb-ey">Projects</p>
          <h1 className="pb-title">Portfolio projects</h1>
          <div className="empty-state" style={{ marginTop: 24 }}>
            <p className="empty-state-title">Add courses first</p>
            <p className="empty-state-desc">Acad generates projects from the courses and weak topics you have logged. Add courses to get focused suggestions.</p>
            <button className="btn btn-primary" onClick={() => setPage('courses')}>Add courses</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page pb-page anim-fade-in">
      <div className="pb-wrap container">
        <p className="pb-ey">Projects</p>
        <h1 className="pb-title">Your focus projects</h1>
        <p className="pb-sub">
          Up to three portfolio pieces generated from your courses and weakest topics. Each is designed to demonstrate understanding where you need it most.
        </p>

        {projects.length > 0 && (
          <section className="proj-in-progress-section" aria-label="In progress projects">
            <p className="chart-title proj-section-label">In progress</p>
            <div className="proj-out-stack">
              {projects.map((project) => (
                <ProjectOutCard
                  key={project.title}
                  project={project}
                  onOpen={() => setPage('forge', project)}
                />
              ))}
            </div>
          </section>
        )}

        <section className="proj-suggested-section" aria-label="Suggested projects">
          <p className="chart-title proj-section-label">Suggested for your improvement areas</p>

          {filteredSuggestions.length === 0 && suggestions.length === 0 && weakTopics.length === 0 && (
            <p className="proj-locked-hint">No weak topics detected yet. Study your courses to surface focused project ideas.</p>
          )}

          {filteredSuggestions.length === 0 && suggestions.length > 0 && (
            <p className="proj-locked-hint">All suggested projects are already in your portfolio. Keep working on in-progress pieces or improve more topics for new ideas.</p>
          )}

          {filteredSuggestions.length > 0 && (
            <div className="proj-out-stack">
              {filteredSuggestions.map((project) => (
                <ProjectOutCard
                  key={project.id}
                  project={project}
                  onOpen={() => {
                    saveProject(project);
                    setPage('forge', project);
                  }}
                  onSave={() => saveProject(project)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
