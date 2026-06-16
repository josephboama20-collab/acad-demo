import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCourses } from '../contexts/CoursesContext.jsx';
import { useFlashcards } from '../contexts/FlashcardsContext.jsx';
import { useHabits } from '../contexts/HabitsContext.jsx';
import { usePlanCapacity } from '../hooks/usePlanCapacity.js';
import { exportReportPdf } from '../utils/exportReportPdf.js';
import { buildAcademicReport, formatDaysAgo } from '../utils/academicReport.js';
import { hasReportData } from '../utils/reportMetrics.js';

function RepKpi({ val, label, cls, hint }) {
  return (
    <div className="rkpi">
      <div className={`rkpi-val font-mono${cls ? ` ${cls}` : ''}`}>{val}</div>
      <p className="rkpi-lbl">{label}</p>
      {hint && <p className="rkpi-hint">{hint}</p>}
    </div>
  );
}

function ActionRow({ priority, text }) {
  return (
    <div className={`rep-action rep-action--${priority}`}>
      <span className="rep-action-tag">{priority}</span>
      <p>{text}</p>
    </div>
  );
}

export default function Reports({ setPage }) {
  const { user, metrics, streak, profile } = useAuth();
  const { courses, weakTopics, allTopics } = useCourses();
  const { dueCards, cards, masteryMap } = useFlashcards();
  const { logs } = useHabits();
  const { plan } = usePlanCapacity();
  const [exporting, setExporting] = useState(false);

  const report = useMemo(
    () =>
      buildAcademicReport({
        courses,
        weakTopics,
        allTopics,
        dueCards,
        cards,
        masteryMap,
        habitLogs: logs,
        streak,
        metrics,
        plan,
        profile,
      }),
    [courses, weakTopics, allTopics, dueCards, cards, masteryMap, logs, streak, metrics, plan, profile],
  );

  const showData = hasReportData(metrics, streak) || allTopics.length > 0 || logs.length > 0;

  function handleExportPdf() {
    setExporting(true);
    exportReportPdf({ userName: user?.name, report, courses, streak });
    setTimeout(() => setExporting(false), 800);
  }

  if (!showData) {
    return (
      <main className="page rep-page anim-fade-in">
        <div className="rep-wrap container">
          <p className="pb-ey">Academic report</p>
          <h1 className="rep-title">Reports</h1>
          <p className="pb-sub">Add courses, log wellness, or complete tasks to generate your report.</p>
          <div className="empty-state">
            <p className="empty-state-title">No data yet</p>
            <p className="empty-state-desc">Your report pulls from course mastery, flashcard reviews, and study logs.</p>
            <button className="btn btn-primary" onClick={() => setPage('courses')}>Add courses</button>
          </div>
        </div>
      </main>
    );
  }

  const { kpis, summary, priorityTopics, staleTopics, courseRows, recall, actions } = report;
  const sinceLabel = kpis.daysSinceStart
    ? `${kpis.daysSinceStart} day${kpis.daysSinceStart === 1 ? '' : 's'} on Acad`
    : 'Since you started';

  return (
    <main className="page rep-page anim-fade-in">
      <div className="rep-wrap container">
        <p className="pb-ey">Academic report</p>
        <h1 className="rep-title">Your performance</h1>
        <p className="pb-sub">{sinceLabel} · {plan.durationLabel} plan · {courses.length} course{courses.length === 1 ? '' : 's'}</p>

        <div className="rep-export-row">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleExportPdf}
            disabled={exporting}
            id="btn-reports-export-pdf"
          >
            <Download size={14} aria-hidden="true" />
            {exporting ? 'Preparing…' : 'Export PDF'}
          </button>
        </div>

        <section className="rep-ai-summary card" aria-label="AI performance summary">
          <p className="card-label">AI summary</p>
          <p className="rep-summary-text">{summary}</p>
        </section>

        <div className="rkpi-grid rep-kpi-academic">
          <RepKpi val={kpis.dueCards} cls={kpis.dueCards > 0 ? 'warn' : ''} label="Cards due today" hint="Spaced repetition queue" />
          <RepKpi val={kpis.weakTopics} cls={kpis.weakTopics > 0 ? 'warn' : ''} label="Topics below 60%" hint="Need recall work" />
          <RepKpi val={`${kpis.avgMastery}%`} label="Avg topic mastery" hint="Across all courses" />
          <RepKpi val={`${kpis.totalStudyHours.toFixed(1)}h`} label="Total study logged" hint="All wellness logs" />
        </div>

        {actions.length > 0 && (
          <section className="rep-section">
            <h2 className="rep-section-title">Recommended next steps</h2>
            <div className="rep-actions">
              {actions.map((a, i) => (
                <ActionRow key={i} priority={a.priority} text={a.text} />
              ))}
            </div>
          </section>
        )}

        <div className="rep-charts-grid rep-academic-grid">
          {priorityTopics.length > 0 && (
            <div className="chart-box rep-topic-box">
              <p className="chart-title">Priority topics</p>
              <table className="rep-table">
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Course</th>
                    <th>Mastery</th>
                    <th>Last studied</th>
                  </tr>
                </thead>
                <tbody>
                  {priorityTopics.map((t) => (
                    <tr key={t.topicId}>
                      <td>{t.name}</td>
                      <td className="font-mono">{t.courseCode}</td>
                      <td className={`rep-mastery${t.masteryLevel < 40 ? ' low' : ''}`}>{t.masteryLevel}%</td>
                      <td>{formatDaysAgo(t.lastStudied)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="btn btn-ghost btn-sm rep-section-link" type="button" onClick={() => setPage('flashcards')}>
                Review flashcards
              </button>
            </div>
          )}

          <div className="chart-box">
            <p className="chart-title">Recall pipeline</p>
            <div className="rep-recall-grid">
              <div className="rep-recall-stat">
                <span className="rep-recall-val font-mono">{recall.due}</span>
                <span className="rep-recall-lbl">Due now</span>
              </div>
              <div className="rep-recall-stat">
                <span className="rep-recall-val font-mono">{recall.learning}</span>
                <span className="rep-recall-lbl">Learning</span>
              </div>
              <div className="rep-recall-stat">
                <span className="rep-recall-val font-mono">{recall.reviewing}</span>
                <span className="rep-recall-lbl">Reviewing</span>
              </div>
              <div className="rep-recall-stat">
                <span className="rep-recall-val font-mono">{recall.mastered}</span>
                <span className="rep-recall-lbl">Mastered</span>
              </div>
            </div>
            {recall.due > 0 && (
              <p className="rep-recall-note">Finish due reviews before adding new cards — retention drops when the queue backs up.</p>
            )}
          </div>

          {staleTopics.length > 0 && (
            <div className="chart-box">
              <p className="chart-title">Needs revisiting</p>
              <ul className="rep-stale-list">
                {staleTopics.map((t) => (
                  <li key={t.topicId}>
                    <span className="rep-stale-name">{t.name}</span>
                    <span className="rep-stale-meta">{t.courseCode} · {t.masteryLevel}% · {formatDaysAgo(t.lastStudied)}</span>
                  </li>
                ))}
              </ul>
              <button className="btn btn-ghost btn-sm rep-section-link" type="button" onClick={() => setPage('courses')}>
                Open courses
              </button>
            </div>
          )}
        </div>

        {courseRows.length > 0 && (
          <section className="rep-section">
            <h2 className="rep-section-title">By course</h2>
            <div className="rep-pred-grid">
              {courseRows.map((c) => (
                <div key={c.courseId} className="rep-pred-card">
                  <div className="rep-pred-header">
                    <span className="rep-pred-code">{c.code}</span>
                    <span className="rep-pred-avg">{c.avg}%</span>
                  </div>
                  <p className="rep-pred-name">{c.name}</p>
                  <div className="rep-pred-bar-wrap">
                    <div className="rep-pred-bar">
                      <div className="rep-pred-fill" style={{ width: `${c.avg}%` }} />
                    </div>
                  </div>
                  <p className="rep-pred-conf">
                    {c.topicCount} topics
                    {c.below60 > 0 ? ` · ${c.below60} below 60%` : ''}
                    {c.highImportanceWeak > 0 ? ` · ${c.highImportanceWeak} high-priority gap${c.highImportanceWeak === 1 ? '' : 's'}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="rep-footer-actions">
          <button id="btn-reports-courses" className="btn btn-primary" type="button" onClick={() => setPage('courses')}>
            Study weak topics
          </button>
          <button id="btn-reports-dashboard" className="btn btn-outline" type="button" onClick={() => setPage('dashboard')}>
            Back to dashboard
          </button>
        </div>
      </div>
    </main>
  );
}
