import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCourses } from '../contexts/CoursesContext.jsx';
import { useFlashcards } from '../contexts/FlashcardsContext.jsx';
import { useSemesters } from '../contexts/SemestersContext.jsx';
import { fetchDailyTask } from '../utils/tasks.js';
import { usePlanCapacity } from '../hooks/usePlanCapacity.js';
import { canAccessProjects } from '../utils/projectEligibility.js';
import {
  canLogNewSemesterNow,
  shouldOpenSemesterAddFlow,
} from '../utils/semesterAccess.js';
import { getConditioningProgress } from '../utils/conditioningProgress.js';
import { useHabits } from '../contexts/HabitsContext.jsx';
import PlanCountdown from '../components/PlanCountdown.jsx';
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
  const { plan, isToolEnabled, enabledTools } = usePlanCapacity();
  const { logs } = useHabits();
  const { progressionStatus, gradeHistory, academicProfile } = useSemesters();
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
    fetchDailyTask({ ...profile, progressionStatus }).then((res) => {
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
  const avgMastery = allTopics.length > 0
    ? Math.round(allTopics.reduce((a, t) => a + t.masteryLevel, 0) / allTopics.length)
    : null;
  const hasMastery = avgMastery != null && avgMastery > 0;
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const projectsUnlocked = canAccessProjects(streak, metrics, profile);
  const ap = academicProfile || profile?.academicProfile;
  const latestTerm = gradeHistory.at(-1) || null;

  const level = ap?.currentLevel ?? 100;
  const sem = ap?.currentSemester ?? 1;
  const pendingSemesterUpdate = ap ? shouldOpenSemesterAddFlow(level, sem, gradeHistory, profile) : false;
  const canLogSemesterNow = ap ? canLogNewSemesterNow(level, sem, gradeHistory, profile) : false;
  const timelineBlocked = pendingSemesterUpdate && !canLogSemesterNow;

  const conditioning = useMemo(
    () => getConditioningProgress({
      profile,
      streak,
      metrics,
      courses,
      gradeHistory,
      flashcardStats: masteryMap,
      wellnessLogCount: logs.length,
      projectsUnlocked,
      enabledTools,
    }),
    [profile, streak, metrics, courses, gradeHistory, masteryMap, logs.length, projectsUnlocked, enabledTools],
  );

  const termsLogged = gradeHistory.length;

  return (
    <main className="page dash-page anim-fade-in">
      <header className="dash-header">
        <div className="dash-header-inner container">
          <div>
            <p className="dash-greeting">{greeting}</p>
            <h1 className="dash-name">{user?.name || 'Member'}</h1>
            <div className="dash-meta" aria-label="Profile summary">
              <span className="dash-meta-chip">{dateStr}</span>
              {ap && (
                <>
                  <span className="dash-meta-chip">{ap.institutionName}</span>
                  <span className="dash-meta-chip">Level {ap.currentLevel} · Sem {ap.currentSemester}</span>
                </>
              )}
              <span className="dash-meta-chip">
                {courses.length > 0
                  ? hasMastery
                    ? `${courses.length} courses · ${avgMastery}% avg`
                    : `${courses.length} course${courses.length === 1 ? '' : 's'}`
                  : plan.durationLabel}
              </span>
              <span className={`dash-meta-chip dash-meta-chip-accent load-${loadLabel.toLowerCase()}`}>
                Cognitive load: {loadLabel}
              </span>
            </div>
          </div>
          <div className="dash-streak-badge" title="Current streak">
            <span className="dash-streak-n font-mono">{streak.current}</span>
            <span className="dash-streak-lbl">day streak</span>
          </div>
        </div>
      </header>

      <div className="dash-body container">
        <div className="kpi-row dash-kpi-row" role="list" aria-label="Performance metrics">
          <Kpi id="kpi-streak" value={streak.current} label="Day Streak" gold />
          <Kpi id="kpi-completion" value={`${Math.round(metrics.completionRate * 100)}%`} label="Completion Rate" />
          <Kpi id="kpi-tasks" value={metrics.tasksCompleted} label="Tasks Completed" />
          <Kpi id="kpi-projects" value={metrics.activeProjects} label="Active Projects" />
        </div>

        <section className="dash-hero-grid">
          <article className="card dash-hero-countdown" aria-label="Plan timeline countdown">
            <div className="dash-plan-head dash-timeline-head">
              <p className="card-label">Comeback plan</p>
            </div>
            <PlanCountdown profile={profile} endedLabel="Window complete" />
            <div className="prog-bar dash-conditioning-bar" role="progressbar" aria-valuenow={conditioning.timeline.pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="prog-fill dash-conditioning-fill timeline" style={{ width: `${conditioning.timeline.pct}%` }} />
            </div>
            {timelineBlocked && (
              <p className="dash-timeline-gate">Semester logging unlocks at zero.</p>
            )}
            {canLogSemesterNow && (
              <button type="button" className="btn btn-primary btn-sm dash-hero-cta" onClick={() => setPage('semester-update')}>
                Add new semester
              </button>
            )}
          </article>

          <aside className="dash-hero-side">
            {isToolEnabled('semester-journey') && (
              <section className="card dash-plan-card dash-hero-card dash-semester-card" aria-label="Semester journey">
                <div className="dash-plan-head">
                  <p className="card-label">Semester journey</p>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPage('semester-journey')}>
                    Hub
                  </button>
                </div>
                <div className="dash-semester-stats">
                  <div className={`dash-semester-stat${ap ? ' active' : ''}`}>
                    <span className="dash-semester-stat-val font-mono">
                      {ap ? `L${ap.currentLevel} · S${ap.currentSemester}` : '—'}
                    </span>
                    <span className="dash-semester-stat-lbl">Entering</span>
                  </div>
                  <div className={`dash-semester-stat${termsLogged > 0 ? ' active' : ''}`}>
                    <span className="dash-semester-stat-val font-mono">{termsLogged}</span>
                    <span className="dash-semester-stat-lbl">Terms logged</span>
                  </div>
                  <div className={`dash-semester-stat${latestTerm?.gpa != null ? ' active' : ''}`}>
                    <span className="dash-semester-stat-val font-mono">{latestTerm?.gpa ?? '—'}</span>
                    <span className="dash-semester-stat-lbl">Latest GPA</span>
                  </div>
                </div>
                {ap && (
                  <p className="dash-semester-program">{ap.programName}</p>
                )}
                {pendingSemesterUpdate && !canLogSemesterNow && (
                  <p className="dash-semester-note">Logging opens when plan ends</p>
                )}
              </section>
            )}
            <section className="card dash-plan-card dash-hero-card" aria-label="Your plan">
              <div className="dash-plan-head">
                <p className="card-label">Your plan</p>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPage('manage-plan')}>
                  Manage
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
          </aside>
        </section>

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
                      <span className="timer-disp-time" aria-label={`${mm} minutes ${ss} seconds remaining`}>
                        <span className="timer-segment">{mm}</span>
                        <span className="timer-colon" aria-hidden="true">:</span>
                        <span className="timer-segment">{ss}</span>
                      </span>
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
          </aside>
        </div>

        <section className="card dash-conditioning-card" aria-label="Conditioning program">
          <div className="dash-plan-head">
            <p className="card-label">Conditioning program</p>
            <span className="dash-conditioning-overall font-mono">{conditioning.overallPct}% complete</span>
          </div>
          <div className="dash-conditioning-sections dash-conditioning-grid">
            {conditioning.sections.filter((s) => !s.optional).map((section) => (
              <div key={section.id} className={`dash-conditioning-row${section.done ? ' done' : ' pending'}`}>
                <div className="dash-conditioning-row-body">
                  <span className="dash-conditioning-label">{section.label}</span>
                  <span className="dash-conditioning-detail">{section.detail}</span>
                  {section.progress != null && section.progress > 0 && (
                    <div className="prog-bar dash-conditioning-mini-bar" aria-hidden="true">
                      <div className="prog-fill dash-conditioning-fill" style={{ width: `${section.progress}%` }} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

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
              <div className="card dash-insight-card dash-summary-card">
                <div className="dash-summary-head">
                  <p className="dash-insight-title">Today&apos;s Summary</p>
                  {dueCards.length > 0 ? (
                    <button type="button" className="btn btn-primary btn-sm dash-summary-cta" onClick={() => setPage('flashcards')}>
                      Review cards
                    </button>
                  ) : (
                    <span className="dash-summary-badge">All caught up</span>
                  )}
                </div>
                <div className="dash-summary-grid">
                  <div className={`dash-summary-stat${dueCards.length > 0 ? ' accent' : ''}`}>
                    <span className="dash-summary-val">{dueCards.length}</span>
                    <span className="dash-summary-lbl">Cards due</span>
                  </div>
                  <div className="dash-summary-stat">
                    <span className="dash-summary-val">{masteryMap.mastered}</span>
                    <span className="dash-summary-lbl">Mastered</span>
                  </div>
                  <div className="dash-summary-stat">
                    <span className="dash-summary-val">{courses.length}</span>
                    <span className="dash-summary-lbl">Courses</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="dash-insights" aria-label="Get started">
            <p className="card-label">Get started</p>
            <div className="empty-state" style={{ marginTop: 8 }}>
              <p className="empty-state-title">Add your first course</p>
              <p className="empty-state-desc">
                Focus courses are chosen during onboarding. Open Courses to review your list, or Semester journey to log past terms and your academic profile.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 }}>
                <button type="button" className="btn btn-primary" onClick={() => setPage('courses')}>Open courses</button>
                <button type="button" className="btn btn-outline" onClick={() => setPage('semester-journey')}>Semester journey</button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
