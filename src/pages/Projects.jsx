import { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCourses } from '../contexts/CoursesContext.jsx';
import { useSemesters } from '../contexts/SemestersContext.jsx';
import { buildProjectGuideSchedule, generateCourseProjects } from '../utils/projects.js';
import { canAccessProjects, projectUnlockProgress } from '../utils/projectEligibility.js';
import { getPlanTimeline } from '../utils/planTimeline.js';
import { getMilestoneProgress, saveForgeWorkspace } from '../utils/forgeStorage.js';
import { getProjectCompletion } from '../utils/projectCompletion.js';

function PageHeader({ kicker, title, sub }) {
  return (
    <header className="page-head">
      <p className="page-kicker">{kicker}</p>
      <h1 className="page-title">{title}</h1>
      {sub && <p className="page-sub">{sub}</p>}
    </header>
  );
}

function PlanTimelineBar({ timeline }) {
  const totalWeeks = Math.max(1, Math.round(timeline.totalDays / 7));
  const currentWeek = Math.min(totalWeeks, Math.max(1, Math.floor(timeline.daysElapsed / 7) + 1));

  return (
    <section className="proj-timeline-bar card" aria-label="Comeback plan progress">
      <div className="proj-timeline-bar-top">
        <span className="proj-timeline-bar-label">Plan window</span>
        <span className="proj-timeline-bar-meta font-mono">
          Week {currentWeek}/{totalWeeks}
          {!timeline.isEnded && ` · ${timeline.daysRemaining}d left`}
        </span>
      </div>
      <div className="prog-bar proj-timeline-bar-track" role="progressbar" aria-valuenow={timeline.pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="prog-fill" style={{ width: `${timeline.pct}%` }} />
      </div>
    </section>
  );
}

function GuideStep({ step, done, onToggle }) {
  const [open, setOpen] = useState(step.phase === 'current' && !done);

  return (
    <li className={`proj-step${step.phase === 'current' ? ' current' : ''}${done ? ' done' : ''}`}>
      <div className="proj-step-top">
        <button
          type="button"
          className={`proj-step-check${done ? ' on' : ''}`}
          aria-pressed={done}
          aria-label={`Mark ${step.title} complete`}
          onClick={onToggle}
        />
        <button type="button" className="proj-step-summary" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <span className="proj-step-week font-mono">{step.planWeekLabel}</span>
          <span className="proj-step-name">{step.title}</span>
          {step.phase === 'current' && <span className="tag">This week</span>}
        </button>
      </div>
      {open && (
        <div className="proj-step-body">
          <p className="proj-step-desc">{step.desc}</p>
          {Array.isArray(step.tasks) && step.tasks.length > 0 && (
            <ul className="proj-step-tasks">
              {step.tasks.map((task) => (
                <li key={task}>{task}</li>
              ))}
            </ul>
          )}
          {Array.isArray(step.resources) && step.resources.length > 0 && (
            <div className="proj-step-links">
              {step.resources.map((res) => (
                <a key={res.url} href={res.url} target="_blank" rel="noopener noreferrer" className="proj-step-link">
                  {res.title}
                  <ExternalLink size={11} aria-hidden="true" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function ProjectGuideCard({ project, planTimeline, onToggleStep }) {
  const schedule = useMemo(() => buildProjectGuideSchedule(project, planTimeline), [project, planTimeline]);
  const progress = getMilestoneProgress(project);
  const completion = getProjectCompletion(project);

  return (
    <article className="card proj-card" aria-label={project.title}>
      <header className="proj-card-head">
        <div className="proj-card-tags">
          <span className="tag">{project.courseCode || project.domain}</span>
          <span className="tag tag-mist">{project.topicName || project.skillFocus}</span>
        </div>
        <h2 className="proj-card-title">{project.title}</h2>
        <p className="proj-card-objective">{project.objective}</p>
        <div className="proj-card-progress">
          <div className="prog-bar" aria-hidden="true">
            <div className="prog-fill" style={{ width: `${completion.pct}%` }} />
          </div>
          <span className="font-mono proj-card-progress-lbl">{completion.done}/{completion.total} steps</span>
        </div>
      </header>
      <ol className="proj-step-list">
        {schedule.map((step) => (
          <GuideStep
            key={`${project.title}-${step.stepIndex}`}
            step={step}
            done={Boolean(progress[step.stepIndex])}
            onToggle={() => onToggleStep(project, step.stepIndex)}
          />
        ))}
      </ol>
    </article>
  );
}

function LockedState({ progress, setPage }) {
  return (
    <section className="card proj-locked" aria-label="Projects locked">
      <p className="card-label">Unlock project guides</p>
      <p className="proj-locked-desc">
        Guides unlock after consistent daily effort on your comeback plan.
      </p>
      <div className="proj-unlock-checks">
        {progress.checks.map((c) => (
          <div key={c.label} className={`proj-unlock-row${c.done ? ' done' : ''}`}>
            <span>{c.label}</span>
            <span className="proj-unlock-val font-mono">{c.current}/{c.target}</span>
          </div>
        ))}
      </div>
      <div className="prog-bar" style={{ marginTop: 14 }}>
        <div className="prog-fill" style={{ width: `${progress.pct}%` }} />
      </div>
      <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: 16 }} onClick={() => setPage('dashboard')}>
        Back to dashboard
      </button>
    </section>
  );
}

export default function Projects({ setPage }) {
  const { projects, saveProject, streak, metrics, profile, user } = useAuth();
  const { courses, weakTopics } = useCourses();
  const { getDeltas } = useSemesters();
  const [progressTick, setProgressTick] = useState(0);
  const unlocked = canAccessProjects(streak, metrics, profile);
  const progress = projectUnlockProgress(streak, metrics, profile);
  const planTimeline = useMemo(() => getPlanTimeline(profile), [profile]);
  const semDeltas = useMemo(() => getDeltas(courses), [getDeltas, courses]);

  const guides = useMemo(
    () => (unlocked && courses.length > 0 ? generateCourseProjects(courses, weakTopics, semDeltas) : []),
    [unlocked, courses, weakTopics, semDeltas],
  );

  const savedTitles = new Set(projects.map((p) => p.title));
  const activeGuides = guides.map((g) => projects.find((p) => p.title === g.title) || g);
  const extraSaved = projects.filter((p) => !guides.some((g) => g.title === p.title));

  function toggleStep(project, stepIndex) {
    const progressMap = getMilestoneProgress(project);
    const next = { ...progressMap, [stepIndex]: !progressMap[stepIndex] };
    saveForgeWorkspace(project.title, { draft: '', milestones: next }, user?.id);
    if (!savedTitles.has(project.title)) saveProject(project);
    setProgressTick((n) => n + 1);
  }

  const shell = (body) => (
    <main className="page page-shell anim-fade-in">
      <div className="page-wrap container">{body}</div>
    </main>
  );

  if (!unlocked) {
    return shell(
      <>
        <PageHeader
          kicker="Projects"
          title="Portfolio guides"
          sub="Step-by-step external work mapped to your comeback plan — not built inside Acad."
        />
        <LockedState progress={progress} setPage={setPage} />
      </>,
    );
  }

  if (courses.length === 0) {
    return shell(
      <>
        <PageHeader
          kicker="Projects"
          title="Portfolio guides"
          sub="Log a semester with courses to generate tailored portfolio guides."
        />
        <div className="empty-state">
          <p className="empty-state-title">No courses yet</p>
          <p className="empty-state-desc">Guides target your weakest logged topics. Add a term first.</p>
          <button type="button" className="btn btn-primary" onClick={() => setPage('semester-journey')}>
            Open semester journey
          </button>
        </div>
      </>,
    );
  }

  return shell(
    <>
      <PageHeader
        kicker="Projects"
        title="Portfolio guides"
        sub="Do the work outside Acad. Each guide spreads steps across your plan timeline with tasks and resources."
      />
      <PlanTimelineBar timeline={planTimeline} />
      <div className="proj-guide-stack">
        {activeGuides.map((project) => (
          <ProjectGuideCard
            key={`${project.id || project.title}-${progressTick}`}
            project={project}
            planTimeline={planTimeline}
            onToggleStep={toggleStep}
          />
        ))}
        {extraSaved.map((project) => (
          <ProjectGuideCard
            key={`${project.title}-${progressTick}`}
            project={project}
            planTimeline={planTimeline}
            onToggleStep={toggleStep}
          />
        ))}
      </div>
      {guides.length === 0 && weakTopics.length === 0 && (
        <p className="page-note">Study your courses to surface weak topics for new guides.</p>
      )}
    </>,
  );
}
