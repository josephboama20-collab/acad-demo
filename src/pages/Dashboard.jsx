import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCourses } from '../contexts/CoursesContext.jsx';
import { useFlashcards } from '../contexts/FlashcardsContext.jsx';
import { fetchDailyTask } from '../utils/tasks.js';
import { usePlanCapacity } from '../hooks/usePlanCapacity.js';
import { canAccessProjects } from '../utils/projectEligibility.js';
import Kpi from '../components/Kpi.jsx';
import TaskSkeleton from '../components/TaskSkeleton.jsx';

function ConsistencyMap({ history }) {
  const cells = useMemo(() => {
    const out = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (41 - i));
      out.push({
        active: Boolean(history[i]),
        date,
        label: date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
      });
    }
    return out;
  }, [history]);

  const weeks = [];
  for (let w = 0; w < 6; w++) {
    weeks.push(cells.slice(w * 7, w * 7 + 7));
  }

  const activeCount = history.filter(Boolean).length;
  const headerDays = weeks[5]?.map((c) => c.date.toLocaleDateString('en-GB', { weekday: 'narrow' })) || [];

  return (
    <div className="consistency-map">
      <div className="consistency-map-head">
        <span className="consistency-map-stat font-mono">{activeCount}<span className="consistency-map-stat-of">/42</span></span>
        <span className="consistency-map-stat-lbl">active days over 6 weeks</span>
      </div>
      <div className="consistency-map-table">
        <div className="consistency-map-header-row">
          <span className="consistency-map-corner" aria-hidden="true" />
          {headerDays.map((d, i) => (
            <span key={i} className="consistency-map-col-hd">{d}</span>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="consistency-map-row">
            <span className="consistency-map-row-hd">Wk {wi + 1}</span>
            {week.map((cell, di) => (
              <div
                key={di}
                className={`consistency-map-cell${cell.active ? ' active' : ''}`}
                title={`${cell.label}: ${cell.active ? 'Studied' : 'No activity'}`}
                aria-label={`${cell.label}, ${cell.active ? 'active' : 'inactive'}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="consistency-map-legend">
        <span className="consistency-map-legend-item"><span className="consistency-map-cell sample" /> No activity</span>
        <span className="consistency-map-legend-item"><span className="consistency-map-cell active sample" /> Studied</span>
      </div>
    </div>
  );
}

export default function Dashboard({ setPage }) {
  const { user, profile, streak, metrics, completeTask } = useAuth();
  const { courses, weakTopics, allTopics } = useCourses();
  const { dueCards, masteryMap } = useFlashcards();
  const { plan, isToolEnabled } = usePlanCapacity();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seconds, setSeconds] = useState(600);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  function loadTask() {
    setLoading(true);
    setTask(null);
    setDone(false);
    setSeconds(600);
    setRunning(false);
    fetchDailyTask(profile).then((res) => {
      setTask(res.data);
      setLoading(false);
    });
  }

  useEffect(() => { loadTask(); }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          setDone(true);
          completeTask();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, completeTask]);

  const hours = new Date().getHours();
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const loadLabel = profile?.sharpness?.startsWith('Very sharp') ? 'High' : profile?.sharpness?.startsWith('Somewhat') ? 'Moderate' : 'Low';
  const avgMastery = allTopics.length > 0 ? Math.round(allTopics.reduce((a, t) => a + t.masteryLevel, 0) / allTopics.length) : null;
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const projectsUnlocked = canAccessProjects(streak, metrics, profile);

  return (
    <main className="page dash-page anim-fade-in">
      <header className="dash-header">
        <div className="dash-header-inner container">
          <div>
            <p className="dash-greeting">{greeting}</p>
            <h1 className="dash-name">{user?.name || 'Member'}</h1>
            <p className="dash-sub">
              {dateStr}<span className="dash-sub-sep">·</span>
              {courses.length > 0 ? `${courses.length} courses · ${avgMastery}% avg mastery` : plan.durationLabel}
              <span className="dash-sub-sep">·</span>
              Cognitive Load: <span className="dash-load">{loadLabel}</span>
            </p>
          </div>
          <div className="dash-streak-badge" title="Current streak">
            <span className="dash-streak-n font-mono">{streak.current}</span>
            <span className="dash-streak-lbl">day streak</span>
          </div>
        </div>
      </header>
      <div className="dash-body container">
        <div className="dash-top-row">
          <div className="kpi-row" role="list" aria-label="Performance metrics">
            <Kpi id="kpi-streak" value={streak.current} label="Day Streak" gold />
            <Kpi id="kpi-completion" value={`${Math.round(metrics.completionRate * 100)}%`} label="Completion Rate" />
            <Kpi id="kpi-tasks" value={metrics.tasksCompleted} label="Tasks Completed" />
            <Kpi id="kpi-projects" value={metrics.activeProjects} label="Active Projects" />
          </div>
        </div>
        <div className="dash-grid dash-grid-redesign">
          <div className="dash-col-main">
            <article className="task-card" aria-label="Daily conditioning task">
              {loading ? (
                <TaskSkeleton />
              ) : task ? (
                <>
                  <header className="task-head">
                    <div>
                      <p className="task-kicker">Today&apos;s task</p>
                      <h2 className="task-title">{task.title}</h2>
                    </div>
                    <span className="tag">{task.type}</span>
                  </header>
                  <div className="task-body">
                    <p className="task-desc">{task.desc}</p>
                    <div className="timer-disp" aria-live="polite">
                      <span className="font-mono timer-plain">{mm}:{ss}</span>
                      <span className="timer-unit">remaining</span>
                    </div>
                    <div className="prog-bar" role="progressbar" aria-valuenow={((600 - seconds) / 600) * 100} aria-valuemin={0} aria-valuemax={100}>
                      <div className="prog-fill" style={{ width: `${((600 - seconds) / 600) * 100}%` }} />
                    </div>
                    <div className="task-actions">
                      {done ? (
                        <span className="task-done-msg">
                          Task complete. <button id="btn-task-new" className="task-done-link" onClick={loadTask}>Load new task</button>
                        </span>
                      ) : (
                        <>
                          <button id="btn-task-begin" className="btn btn-primary" onClick={() => setRunning((r) => !r)}>{running ? 'Pause' : 'Begin Task'}</button>
                          <button id="btn-task-complete" className="btn btn-outline" onClick={() => { setDone(true); setRunning(false); completeTask(); }}>Mark Complete</button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="task-body">
                  <p className="task-desc">Could not load task. <button id="btn-task-retry" className="task-done-link" onClick={loadTask}>Try again</button></p>
                </div>
              )}
            </article>
          </div>
          <aside className="dash-col-side">
            <section className="card dash-consistency-card" aria-label="Consistency map">
              <p className="card-label">Consistency map</p>
              <p className="card-sublabel">Each cell is one day. Darker = you completed a task that day.</p>
              <ConsistencyMap history={streak.history} />
            </section>
            {isToolEnabled('projects') && (
            <button id="btn-dash-projects" className="card card-cta" onClick={() => setPage('projects')}>
              <p className="card-cta-label">{projectsUnlocked ? 'Portfolio projects' : 'Projects (locked)'}</p>
              <p className="card-cta-desc">
                {projectsUnlocked
                  ? 'Course-tailored projects focused on your weakest topics.'
                  : 'Unlock by building consistency: streak, active days, and task completion.'}
              </p>
            </button>
            )}
          </aside>
        </div>
        {courses.length > 0 ? (
          <section className="dash-insights" aria-label="Course insights">
            <p className="card-label">Course velocity</p>
            <div className="dash-insights-grid">
              <div className="card dash-insight-card">
                <p className="dash-insight-title">Course mastery</p>
                {courses.map((c) => {
                  const pct = c.topics.length ? Math.round(c.topics.reduce((a, t) => a + t.masteryLevel, 0) / c.topics.length) : 0;
                  return (
                    <div key={c.courseId} className="dash-mastery-row">
                      <span className="dash-mastery-code">{c.code}</span>
                      <div className="dash-mastery-bar"><div className="dash-mastery-fill" style={{ width: `${pct}%`, background: pct >= 70 ? 'var(--verdigris)' : pct >= 50 ? 'var(--gold)' : 'var(--crimson)' }} /></div>
                      <span className="dash-mastery-pct">{pct}%</span>
                    </div>
                  );
                })}
                <button className="dash-insight-link" onClick={() => setPage('courses')}>View radar</button>
              </div>
              <div className="card dash-insight-card">
                <p className="dash-insight-title">Focus Areas</p>
                {weakTopics.length === 0 ? (
                  <p className="dash-insight-empty">All topics above 60%. Strong performance.</p>
                ) : (
                  weakTopics.slice(0, 4).map((t) => (
                    <div key={t.topicId} className="dash-weak-row">
                      <span className="dash-weak-name">{t.name}</span>
                      <span className="dash-weak-course">{t.courseCode}</span>
                      <span className="dash-weak-score" style={{ color: t.masteryLevel < 40 ? 'var(--crimson)' : 'var(--gold)' }}>{t.masteryLevel}%</span>
                    </div>
                  ))
                )}
                {weakTopics.length > 0 && <button className="dash-insight-link" onClick={() => setPage('flashcards')}>Study weak areas</button>}
              </div>
              <div className="card dash-insight-card">
                <p className="dash-insight-title">Today&apos;s Summary</p>
                <div className="dash-today-stats">
                  <div className="dash-today-stat"><span className="dash-today-val font-mono">{dueCards.length}</span><span className="dash-today-lbl">Cards due</span></div>
                  <div className="dash-today-stat"><span className="dash-today-val font-mono">{masteryMap.mastered}</span><span className="dash-today-lbl">Mastered</span></div>
                  <div className="dash-today-stat"><span className="dash-today-val font-mono">{courses.length}</span><span className="dash-today-lbl">Courses</span></div>
                </div>
                {dueCards.length > 0 && <button className="dash-insight-link" onClick={() => setPage('flashcards')}>Review cards</button>}
              </div>
            </div>
          </section>
        ) : (
          <section className="dash-insights" aria-label="Get started">
            <p className="card-label">Get started</p>
            <div className="empty-state" style={{ marginTop: 8 }}>
              <p className="empty-state-title">Add your first course</p>
              <p className="empty-state-desc">Everything on Acad orbits the courses you add. Start there. Tools unlock once you define what you are recovering.</p>
              <button className="btn btn-primary" onClick={() => setPage('courses')}>Add courses</button>
            </div>
          </section>
        )}
        <section className="card dash-plan-card dash-plan-below" aria-label="Your plan">
          <div className="dash-plan-head">
            <p className="card-label">Your plan</p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPage('manage-plan')}>
              Manage plan
            </button>
          </div>
          <div className="dash-plan-grid">
            {[['Window', plan.durationLabel], ['State', profile?.sharpness], ['Effort', (profile?.effort || '').split(' ')[0]], ['Intention', profile?.intention || profile?.goal]]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="dash-plan-item">
                  <span className="dash-plan-key">{k}</span>
                  <span className="dash-plan-val">{v}</span>
                </div>
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}
