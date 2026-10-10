import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSemesters } from '../contexts/SemestersContext.jsx';
import { usePlanCapacity } from '../hooks/usePlanCapacity.js';
import CourseFocusPicker from '../components/CourseFocusPicker.jsx';
import SemesterCourseEditor from '../components/SemesterCourseEditor.jsx';
import { useSemesterEditor } from '../hooks/useSemesterEditor.js';
import { getGradeLettersFromProfile, getGradePointsMap } from '../utils/academicProfileUtils.js';
import { getNewSemesterTarget, getSemesterAddStatus } from '../utils/semesterAccess.js';
import PlanCountdown from '../components/PlanCountdown.jsx';
import { deriveImprovementSuggestions } from '../utils/improvementSuggestions.js';
import { getMaxCourses } from '../utils/planCapacity.js';
import { computeGpaFromGrades, GRADE_OPTIONS } from '../utils/semesterUtils.js';
import { persistWithCloud } from '../utils/cloudSync.js';
import { loadJSON, saveJSON, STORAGE_KEYS, uid } from '../utils/storage.js';

const CORE_STEPS = ['intro', 'grades', 'focus', 'done'];

export default function SemesterUpdate({ setPage }) {
  const { profile, setProfile, userId, bumpDataEpoch } = useAuth();
  const { academicProfile, gradeHistory, recordSemesterOutcome, advanceAcademicPosition } = useSemesters();
  const { plan } = usePlanCapacity();
  const ap = academicProfile || profile?.academicProfile;

  const currentLevel = ap?.currentLevel ?? 100;
  const currentSemester = ap?.currentSemester ?? 1;

  const addStatus = useMemo(
    () => getSemesterAddStatus(currentLevel, currentSemester, gradeHistory, profile),
    [currentLevel, currentSemester, gradeHistory, profile],
  );

  const [advanceDone, setAdvanceDone] = useState(false);
  const needsAdvance = addStatus.needsPositionAdvance && !advanceDone;

  const steps = useMemo(
    () => (needsAdvance ? ['advance', ...CORE_STEPS] : CORE_STEPS),
    [needsAdvance],
  );

  const [step, setStep] = useState(0);
  const [selectedFocus, setSelectedFocus] = useState([]);
  const [focusCustomPool, setFocusCustomPool] = useState([]);
  const [focusInitialized, setFocusInitialized] = useState(false);
  const [msg, setMsg] = useState('');

  const target = useMemo(
    () => getNewSemesterTarget(currentLevel, currentSemester, gradeHistory),
    [currentLevel, currentSemester, gradeHistory],
  );

  const level = target?.level ?? currentLevel;
  const semester = target?.semester ?? 1;
  const slotLabel = target?.label ?? `Level ${level} · Semester ${semester}`;

  const gradeLetters = useMemo(() => {
    const fromProfile = getGradeLettersFromProfile(ap);
    return fromProfile.length > 0 ? fromProfile : GRADE_OPTIONS;
  }, [ap]);

  const gradePoints = useMemo(() => getGradePointsMap(ap), [ap]);
  const maxFocusCourses = getMaxCourses(profile);

  const editor = useSemesterEditor({ academicProfile: ap, level, semester, historyEntry: null });

  const validCourses = editor.buildValidCourses();

  const draftHistory = useMemo(() => {
    const chron = [...gradeHistory].sort((a, b) => a.level - b.level || a.semester - b.semester);
    if (validCourses.length === 0) return chron;
    const draft = {
      label: slotLabel,
      level,
      semester,
      courses: validCourses,
      gpa: computeGpaFromGrades(validCourses, gradePoints),
    };
    return [...chron, draft];
  }, [validCourses, gradeHistory, level, semester, slotLabel, gradePoints]);

  const focusAnalysis = useMemo(
    () => deriveImprovementSuggestions(draftHistory, gradePoints, maxFocusCourses),
    [draftHistory, gradePoints, maxFocusCourses],
  );

  const focusStepIndex = steps.indexOf('focus');
  const gradesStepIndex = steps.indexOf('grades');

  useEffect(() => {
    if (step !== focusStepIndex || focusInitialized) return;
    setSelectedFocus(
      focusAnalysis.suggestions.slice(0, maxFocusCourses).map((s) => ({
        code: s.code,
        name: s.name,
        reason: s.reason,
        grade: s.grade,
      })),
    );
    setFocusInitialized(true);
  }, [step, focusStepIndex, focusAnalysis, maxFocusCourses, focusInitialized]);

  if (!ap) {
    return (
      <main className="page rep-page anim-fade-in">
        <div className="rep-wrap container">
          <h1 className="rep-title">Add new semester</h1>
          <p className="pb-sub">Complete onboarding first.</p>
          <button className="btn btn-primary" onClick={() => setPage('dashboard')}>Dashboard</button>
        </div>
      </main>
    );
  }

  if (addStatus.blockedByTimeline) {
    return (
      <main className="page rep-page anim-fade-in">
        <div className="rep-wrap container">
          <h1 className="rep-title">Add new semester</h1>
          <p className="pb-sub">{addStatus.blockedReason}</p>
          <div className="card" style={{ marginTop: 16, padding: 20 }}>
            <p className="card-label">Time until you can log</p>
            <PlanCountdown profile={profile} />
          </div>
          <p className="ob-accuracy-note" style={{ marginTop: 12 }}>
            Finish your {plan.durationLabel} conditioning window first. Daily tasks and study continue until the countdown ends.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={() => setPage('dashboard')}>Dashboard</button>
            <button className="btn btn-outline" onClick={() => setPage('semester-journey')}>Semester hub</button>
          </div>
        </div>
      </main>
    );
  }

  if (!addStatus.canAdd && !addStatus.needsPositionAdvance) {
    return (
      <main className="page rep-page anim-fade-in">
        <div className="rep-wrap container">
          <h1 className="rep-title">Add new semester</h1>
          <p className="pb-sub">{addStatus.blockedReason}</p>
          <p className="ob-accuracy-note" style={{ marginTop: 12 }}>
            Semester logging tracks your academic terms. Advance your entering term if needed.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={() => setPage('semester-journey')}>Semester hub</button>
            <button className="btn btn-outline" onClick={() => setPage('dashboard')}>Dashboard</button>
          </div>
        </div>
      </main>
    );
  }

  function confirmAdvance() {
    const next = addStatus.nextEnteringPosition;
    if (!next) {
      setMsg('No next term available at your programme level.');
      return;
    }
    const result = advanceAcademicPosition({ level: next.level, semester: next.semester });
    if (!result?.ok) {
      setMsg('Could not update your entering term.');
      return;
    }
    setProfile({
      ...profile,
      academicProfile: {
        ...ap,
        currentLevel: next.level,
        currentSemester: next.semester,
      },
    });
    setMsg('');
    setAdvanceDone(true);
    setStep(0);
  }

  function toggleFocus(course) {
    setSelectedFocus((prev) => {
      const exists = prev.some((c) => c.code === course.code);
      if (exists) return prev.filter((c) => c.code !== course.code);
      if (prev.length >= maxFocusCourses) return prev;
      return [...prev, { code: course.code, name: course.name, reason: course.reason, grade: course.grade }];
    });
  }

  function goFocusStep() {
    if (validCourses.length < 3) {
      setMsg('Enter grades for at least 3 courses in this term before continuing.');
      return;
    }
    setMsg('');
    setStep(focusStepIndex);
  }

  function finish() {
    if (selectedFocus.length === 0) {
      setMsg('Select at least one focus course for your plan window.');
      return;
    }

    const result = recordSemesterOutcome({
      label: slotLabel,
      level,
      semester,
      courses: validCourses,
    });

    if (!result?.ok) {
      setMsg('Could not save semester.');
      return;
    }

    const existing = loadJSON(STORAGE_KEYS.courses) ?? [];
    const selectedCodes = new Set(selectedFocus.map((c) => c.code));
    const kept = existing.filter((c) => !selectedCodes.has(c.code));
    const courseRecords = [
      ...kept,
      ...selectedFocus.map((c) => {
        const prev = existing.find((e) => e.code === c.code);
        if (prev) return prev;
        return {
          courseId: uid(),
          code: c.code,
          name: c.name,
          topics: [{ topicId: uid(), name: c.name, importance: 'high', masteryLevel: 0, lastStudied: null }],
          assignments: [],
          exams: [],
        };
      }),
    ].slice(0, maxFocusCourses);

    saveJSON(STORAGE_KEYS.courses, courseRecords);
    if (userId) persistWithCloud(userId, 'courses', courseRecords);

    setProfile({
      ...profile,
      focusCourses: selectedFocus,
      improvementPattern: focusAnalysis.pattern,
      academicProfile: {
        ...ap,
        currentLevel,
        currentSemester,
      },
    });
    bumpDataEpoch();
    setStep(steps.indexOf('done'));
  }

  const currentStep = steps[step];
  const progress = ((step + 1) / steps.length) * 100;
  const nextTerm = addStatus.nextEnteringPosition;

  if (needsAdvance && currentStep === 'advance') {
    return (
      <main className="page ob-page">
        <div className="ob-wrap">
          <section className="ob-panel">
            <div className="ob-meta">
              <span className="ob-counter">Add new semester · 1/{steps.length}</span>
              <span className="ob-phase">New term</span>
            </div>
            <div className="ob-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="ob-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <h2 className="ob-q">Start a new term</h2>
            <p className="ob-hint">
              You are entering Level {currentLevel} Semester {currentSemester}, and every completed term before that is already logged.
            </p>
            <p className="ob-accuracy-note">
              Adding a semester requires your comeback plan to finish. Tell Acad which term you are entering now to unlock logging the term you just finished.
            </p>
            {nextTerm && (
              <div className="card" style={{ marginTop: 16, padding: 16 }}>
                <p className="card-label">Next entering term</p>
                <p className="task-desc" style={{ marginTop: 8 }}>
                  <strong>{nextTerm.label}</strong>
                  {addStatus.target && (
                    <> — then you can log <strong>{addStatus.target.label}</strong></>
                  )}
                </p>
              </div>
            )}
            {msg && <p className="form-error" role="alert">{msg}</p>}
            <nav className="ob-nav">
              <button type="button" className="btn btn-ghost" onClick={() => setPage('semester-journey')}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={confirmAdvance}>
                I&apos;m entering {nextTerm?.label ?? 'next term'}
              </button>
            </nav>
          </section>
        </div>
      </main>
    );
  }

  if (!target) {
    return (
      <main className="page rep-page anim-fade-in">
        <div className="rep-wrap container">
          <h1 className="rep-title">Add new semester</h1>
          <p className="pb-sub">Confirm your entering term to continue.</p>
          <button className="btn btn-primary" onClick={() => setPage('semester-journey')}>Semester hub</button>
        </div>
      </main>
    );
  }

  return (
    <main className="page ob-page">
      <div className="ob-wrap">
        <section className="ob-panel">
          <div className="ob-meta">
            <span className="ob-counter">Add new semester · {step + 1}/{steps.length}</span>
            <span className="ob-phase">
              {currentStep === 'grades' ? 'Your term' : currentStep === 'focus' ? 'Focus plan' : 'New semester'}
            </span>
          </div>
          <div className="ob-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="ob-progress-fill" style={{ width: `${progress}%` }} />
          </div>

          {currentStep === 'intro' && (
            <>
              <h2 className="ob-q">Add new semester</h2>
              <p className="ob-hint">
                Acad works between semesters — after one term ends and before the next begins.
                You are entering Level {currentLevel} Semester {currentSemester}, so we will log <strong>{slotLabel}</strong>.
              </p>
              <p className="ob-accuracy-note">
                Your plan timeline must end before logging a new semester. Step 1: enter grades. Step 2: pick up to <strong>{maxFocusCourses}</strong> focus course{maxFocusCourses === 1 ? '' : 's'}.
              </p>
              <nav className="ob-nav">
                <button type="button" className="btn btn-ghost" onClick={() => setPage('semester-journey')}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={() => setStep(gradesStepIndex)}>Continue</button>
              </nav>
            </>
          )}

          {currentStep === 'grades' && (
            <>
              <h2 className="ob-q">Grades for {slotLabel}</h2>
              <p className="ob-hint">Tap grades, edit course titles or credit hours, and add any courses AI missed.</p>
              <SemesterCourseEditor
                aiCourses={editor.aiCourses}
                customCourses={editor.customCourses}
                grades={editor.grades}
                gradeLetters={gradeLetters}
                courseEdits={editor.courseEdits}
                removedCodes={editor.removedCodes}
                recordedCodes={new Set()}
                onGradeSelect={editor.setGrade}
                onGradeSkip={editor.skipGrade}
                onCourseEdit={editor.handleCourseEdit}
                onCourseRemove={editor.removeAiCourse}
                onAddCustom={editor.addCustom}
                onRemoveCustom={editor.removeCustom}
              />
              {validCourses.length > 0 && (
                <p className="ob-hint" style={{ marginTop: 8 }}>
                  Term GPA preview: {computeGpaFromGrades(validCourses, gradePoints) ?? '—'}
                </p>
              )}
              {msg && <p className="form-error" role="alert">{msg}</p>}
              <nav className="ob-nav">
                <button type="button" className="btn btn-ghost" onClick={() => setStep(steps.indexOf('intro'))}>Back</button>
                <button type="button" className="btn btn-primary" onClick={goFocusStep}>Continue</button>
              </nav>
            </>
          )}

          {currentStep === 'focus' && (
            <>
              <h2 className="ob-q">Where to focus next</h2>
              <p className="ob-hint">
                From your grade pattern — select up to {maxFocusCourses} course{maxFocusCourses === 1 ? '' : 's'} for your {plan.durationLabel} comeback plan.
              </p>
              <CourseFocusPicker
                pattern={focusAnalysis.pattern}
                suggestions={focusAnalysis.suggestions}
                maxCourses={maxFocusCourses}
                selected={selectedFocus}
                customCourses={focusCustomPool}
                onToggle={toggleFocus}
                onAddCustom={(course) => {
                  if (focusCustomPool.some((c) => c.code === course.code)) return;
                  setFocusCustomPool((prev) => [...prev, course]);
                  if (selectedFocus.length < maxFocusCourses) toggleFocus(course);
                }}
                onRemoveCustom={(code) => {
                  setFocusCustomPool((prev) => prev.filter((c) => c.code !== code));
                  setSelectedFocus((prev) => prev.filter((c) => c.code !== code));
                }}
              />
              {msg && <p className="form-error" role="alert">{msg}</p>}
              <nav className="ob-nav">
                <button type="button" className="btn btn-ghost" onClick={() => setStep(gradesStepIndex)}>Back</button>
                <button type="button" className="btn btn-primary" onClick={finish}>Save semester & plan</button>
              </nav>
            </>
          )}

          {currentStep === 'done' && (
            <>
              <h2 className="ob-q">Semester added</h2>
              <p className="ob-hint">
                {slotLabel} is saved. Your focus courses are set for your {plan.durationLabel} window.
              </p>
              <nav className="ob-nav">
                <button type="button" className="btn btn-primary" onClick={() => setPage('dashboard')}>Dashboard</button>
                <button type="button" className="btn btn-outline" onClick={() => setPage('courses')}>Study courses</button>
              </nav>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
