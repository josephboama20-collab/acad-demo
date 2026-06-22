import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSemesters } from '../contexts/SemestersContext.jsx';
import SemesterCourseEditor from '../components/SemesterCourseEditor.jsx';
import { useSemesterEditor } from '../hooks/useSemesterEditor.js';
import {
  canSelectSemester,
  defaultSemesterSelection,
  findHistoryEntry,
  getSelectableSemesters,
  shouldOpenSemesterAddFlow,
  canLogNewSemesterNow,
} from '../utils/semesterAccess.js';
import { getPlanTimeline } from '../utils/planTimeline.js';
import PlanCountdown from '../components/PlanCountdown.jsx';
import { getGradeLettersFromProfile } from '../utils/academicProfileUtils.js';
import { computeGpaFromGrades } from '../utils/semesterUtils.js';

function statusText(status) {
  if (status === 'improved') return 'Improved';
  if (status === 'regressed') return 'Regressed';
  if (status === 'stable') return 'Stable';
  if (status === 'baseline') return 'Baseline';
  return 'Unknown';
}

const LEVEL_OPTS = ['Level 100', 'Level 200', 'Level 300', 'Level 400'];
const SEM_OPTS = ['Semester 1', 'Semester 2'];

export default function SemesterJourney({ setPage }) {
  const { profile } = useAuth();
  const { academicProfile, gradeHistory, recordSemesterOutcome } = useSemesters();
  const ap = academicProfile || profile?.academicProfile;

  const currentLevel = ap?.currentLevel ?? 100;
  const currentSemester = ap?.currentSemester ?? 1;
  const planTimeline = getPlanTimeline(profile);
  const defaultSel = useMemo(
    () => defaultSemesterSelection(currentLevel, currentSemester, gradeHistory),
    [currentLevel, currentSemester, gradeHistory],
  );

  const [level, setLevel] = useState(defaultSel.level);
  const [semester, setSemester] = useState(defaultSel.semester);
  const [msg, setMsg] = useState('');

  const selectable = useMemo(
    () => getSelectableSemesters(currentLevel, currentSemester, gradeHistory),
    [currentLevel, currentSemester, gradeHistory],
  );

  const historyEntry = findHistoryEntry(gradeHistory, level, semester);
  const isLogged = Boolean(historyEntry);
  const pendingUpdate = shouldOpenSemesterAddFlow(currentLevel, currentSemester, gradeHistory, profile);
  const canLogNow = canLogNewSemesterNow(currentLevel, currentSemester, gradeHistory, profile);
  const timelineBlocked = pendingUpdate && !canLogNow;

  const gradeLetters = getGradeLettersFromProfile(ap);
  const editor = useSemesterEditor({ academicProfile: ap, level, semester, historyEntry });
  const validCourses = editor.buildValidCourses();

  const recordedCodes = useMemo(
    () => new Set((historyEntry?.courses || []).map((c) => c.code)),
    [historyEntry],
  );

  useEffect(() => {
    if (!canSelectSemester(level, semester, currentLevel, currentSemester, gradeHistory)) {
      setLevel(defaultSel.level);
      setSemester(defaultSel.semester);
    }
  }, [level, semester, currentLevel, currentSemester, gradeHistory, defaultSel]);

  function pickLevel(lv) {
    if (!canSelectSemester(lv, semester, currentLevel, currentSemester, gradeHistory)) return;
    setLevel(lv);
    setMsg('');
  }

  function pickSemester(sm) {
    if (!canSelectSemester(level, sm, currentLevel, currentSemester, gradeHistory)) return;
    setSemester(sm);
    setMsg('');
  }

  function submitOutcome() {
    if (validCourses.length === 0) {
      setMsg('Tap at least one course grade to save this semester.');
      return;
    }
    if (!isLogged && !planTimeline.isEnded) {
      setMsg(`Your ${planTimeline.label} plan must end before logging a new semester.`);
      return;
    }
    const result = recordSemesterOutcome({
      label: `Level ${level} · Semester ${semester}`,
      level,
      semester,
      courses: validCourses,
    });
    if (!result?.ok) {
      setMsg('Could not save semester outcome.');
      return;
    }
    setMsg(isLogged ? 'Semester updated.' : 'Semester saved. Your journey is updated.');
  }

  if (!ap) {
    return (
      <main className="page rep-page anim-fade-in">
        <div className="rep-wrap container">
          <h1 className="rep-title">Semester journey</h1>
          <p className="pb-sub">Complete onboarding to set your university and programme.</p>
          <button className="btn btn-primary" onClick={() => setPage('manage-plan')}>Manage plan</button>
        </div>
      </main>
    );
  }

  return (
    <main className="page rep-page anim-fade-in">
      <div className="rep-wrap container">
        <p className="pb-ey">Semester journey</p>
        <h1 className="rep-title">Your academic progression</h1>
        <p className="pb-sub">
          {ap.institutionName} · {ap.programName}
          {ap.trackType === 'combined' ? ' (combined)' : ''}
        </p>

        {(!planTimeline.isEnded || timelineBlocked || (pendingUpdate && canLogNow)) && (
          <section className="card semester-timeline-card" style={{ marginTop: 16 }}>
            <PlanCountdown profile={profile} variant="compact" endedLabel="Unlocked" />
            {!planTimeline.isEnded && (
              <p className="semester-timeline-lock">Semester logging at zero</p>
            )}
            {pendingUpdate && canLogNow && (
              <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setPage('semester-update')}>
                Add new semester
              </button>
            )}
          </section>
        )}

        <section className="card dash-semester-card" style={{ marginTop: 16 }}>
          <p className="card-label">Where you are now</p>
          <div className="dash-semester-stats">
            <div className="dash-semester-stat active">
              <span className="dash-semester-stat-val font-mono">L{currentLevel} · S{currentSemester}</span>
              <span className="dash-semester-stat-lbl">Entering</span>
            </div>
            <div className={`dash-semester-stat${gradeHistory.length > 0 ? ' active' : ''}`}>
              <span className="dash-semester-stat-val font-mono">{gradeHistory.length}</span>
              <span className="dash-semester-stat-lbl">Terms logged</span>
            </div>
            <div className={`dash-semester-stat${gradeHistory.at(-1)?.gpa != null ? ' active' : ''}`}>
              <span className="dash-semester-stat-val font-mono">{gradeHistory.at(-1)?.gpa ?? '—'}</span>
              <span className="dash-semester-stat-lbl">Latest GPA</span>
            </div>
          </div>
          <p className="dash-semester-program">{ap.programName}{ap.trackType === 'combined' ? ' · combined' : ''}</p>
        </section>

        <section className="card" style={{ marginTop: 16 }}>
          <p className="card-label">{isLogged ? 'Edit semester results' : 'Log semester results'}</p>
          <p className="ob-hint">Only your most recent completed term (or terms already logged) can be opened. Future semesters are locked.</p>
          <p className="ob-accuracy-note">Edit AI courses, credit hours, and grades. Courses already saved show a Recorded badge.</p>

          <p className="form-label" style={{ marginTop: 12 }}>Year level</p>
          <div className="ob-options" style={{ marginBottom: 12 }}>
            {LEVEL_OPTS.map((opt) => {
              const lv = Number(opt.match(/\d+/)[0]);
              const enabled = selectable.some((s) => s.level === lv && s.selectable);
              return (
                <button
                  key={opt}
                  type="button"
                  className={`ob-opt${level === lv ? ' sel' : ''}${!enabled ? ' locked' : ''}`}
                  disabled={!enabled && level !== lv}
                  onClick={() => pickLevel(lv)}
                  title={!enabled ? 'Complete prior terms first or select a logged term' : undefined}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          <p className="form-label">Semester</p>
          <div className="ob-options" style={{ marginBottom: 12 }}>
            {SEM_OPTS.map((opt) => {
              const sm = opt.includes('2') ? 2 : 1;
              const slot = selectable.find((s) => s.level === level && s.semester === sm);
              const enabled = slot?.selectable;
              return (
                <button
                  key={opt}
                  type="button"
                  className={`ob-opt${semester === sm ? ' sel' : ''}${!enabled ? ' locked' : ''}`}
                  disabled={!enabled}
                  onClick={() => pickSemester(sm)}
                >
                  {opt}{slot?.logged ? ' · recorded' : slot?.status === 'available' ? ' · log now' : ''}
                </button>
              );
            })}
          </div>

          {isLogged && (
            <p className="course-recorded-banner">Editing saved results for Level {level} · Semester {semester}</p>
          )}

          <SemesterCourseEditor
            aiCourses={editor.aiCourses}
            customCourses={editor.customCourses}
            grades={editor.grades}
            gradeLetters={gradeLetters}
            courseEdits={editor.courseEdits}
            removedCodes={editor.removedCodes}
            recordedCodes={recordedCodes}
            onGradeSelect={editor.setGrade}
            onGradeSkip={editor.skipGrade}
            onCourseEdit={editor.handleCourseEdit}
            onCourseRemove={editor.removeAiCourse}
            onAddCustom={editor.addCustom}
            onRemoveCustom={editor.removeCustom}
          />

          {validCourses.length > 0 && (
            <p className="ob-hint" style={{ marginTop: 8 }}>
              Term GPA preview: {computeGpaFromGrades(validCourses) ?? '—'}
            </p>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={submitOutcome}
              disabled={!isLogged && !planTimeline.isEnded}
            >
              {isLogged ? 'Update semester' : 'Save semester'}
            </button>
            {canLogNow && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setPage('semester-update')}>
                Add new semester
              </button>
            )}
          </div>
          {!isLogged && !planTimeline.isEnded && (
            <p className="ob-accuracy-note" style={{ marginTop: 8 }}>Saving a new semester is locked until your plan countdown ends.</p>
          )}
          {msg && <p className="ob-hint" style={{ marginTop: 10 }}>{msg}</p>}
        </section>

        {gradeHistory.length > 0 && (
          <section className="card" style={{ marginTop: 16 }}>
            <p className="card-label">Semester history</p>
            <div style={{ display: 'grid', gap: 8 }}>
              {gradeHistory.map((entry) => (
                <div key={entry.id} className="card semester-history-row" style={{ padding: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'start' }}>
                    <div>
                      <p className="task-title">{entry.label}</p>
                      <p className="ob-hint">
                        {statusText(entry.status)} · GPA {entry.gpa ?? '—'}
                        {entry.delta ? ` · ${entry.delta > 0 ? '+' : ''}${entry.delta}` : ''}
                      </p>
                      <p className="ob-hint">{entry.courses.map((c) => `${c.code} (${c.grade})`).join(' · ')}</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setLevel(entry.level);
                        setSemester(entry.semester);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => setPage('courses')}>Study with adapted plan</button>
          <button className="btn btn-outline" onClick={() => setPage('dashboard')}>Back to dashboard</button>
        </div>
      </div>
    </main>
  );
}
