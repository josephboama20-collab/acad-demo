import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSemesters } from '../contexts/SemestersContext.jsx';
import SemesterCourseEditor from '../components/SemesterCourseEditor.jsx';
import AcademicProfileReview from '../components/AcademicProfileReview.jsx';
import CourseFocusPicker from '../components/CourseFocusPicker.jsx';
import { learnAcademicProfile, buildFallbackAcademicProfile } from '../utils/academicProfileAI.js';
import { getGradeLettersFromProfile, getGradePointsMap } from '../utils/academicProfileUtils.js';
import {
  hasMinimumAcademicSetup,
  minimumSemesterHistoryRequirement,
  validateInstitutionName,
  validateProgramName,
} from '../utils/onboardingValidation.js';
import {
  buildSemesterHistoryFromOnboarding,
  deriveImprovementSuggestions,
} from '../utils/improvementSuggestions.js';
import { getMaxCourses } from '../utils/planCapacity.js';
import { persistWithCloud } from '../utils/cloudSync.js';
import { saveJSON, STORAGE_KEYS, uid } from '../utils/storage.js';
import {
  buildLearnParams,
  buildOnboardingFlow,
  parseLevel,
  parseSemester,
} from '../utils/onboardingFlow.js';
import { computeGpaFromGrades } from '../utils/semesterUtils.js';

export default function Onboarding({ setPage }) {
  const { setProfile, userId, bumpDataEpoch } = useAuth();
  const { initializeAcademicProfile } = useSemesters();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const [semesterGrades, setSemesterGrades] = useState({});
  const [customCoursesByStep, setCustomCoursesByStep] = useState({});
  const [removedCoursesByStep, setRemovedCoursesByStep] = useState({});
  const [courseEditsByStep, setCourseEditsByStep] = useState({});
  const [profileEdits, setProfileEdits] = useState({});
  const [profileReviewConfirmed, setProfileReviewConfirmed] = useState(false);
  const [selectedFocus, setSelectedFocus] = useState([]);
  const [focusCustomPool, setFocusCustomPool] = useState([]);
  const [focusInitialized, setFocusInitialized] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [progressFloor, setProgressFloor] = useState(0);
  const [learnedProfile, setLearnedProfile] = useState(null);
  const [aiLearnDone, setAiLearnDone] = useState(false);
  const [aiLearning, setAiLearning] = useState(false);
  const [aiError, setAiError] = useState('');
  const stepIdRef = useRef(null);
  const prevTotalRef = useRef(0);

  const ctx = useMemo(() => {
    const studentPath = answers.studentPath?.startsWith('Just') ? 'new' : answers.studentPath ? 'continuing' : null;
    return {
      universityName: answers.universityName,
      programName: answers.programName,
      country: answers.country,
      trackType: answers.trackType,
      secondaryProgram: answers.secondaryProgram,
      studentPath,
      currentLevel: parseLevel(answers.currentLevel),
      currentSemester: answers.currentSemester ? parseSemester(answers.currentSemester) : null,
      learnedProfile,
      aiLearnDone,
    };
  }, [answers, learnedProfile, aiLearnDone]);

  const steps = useMemo(() => buildOnboardingFlow(ctx), [ctx]);
  const total = steps.length;
  const current = steps[step] ?? steps[0];
  const rawProgress = total > 0 ? ((step + 1) / total) * 100 : 0;
  const gradeLetters = getGradeLettersFromProfile(learnedProfile);
  const gradePoints = getGradePointsMap(learnedProfile);
  const maxFocusCourses = getMaxCourses({ duration: answers.duration });

  const learnParams = useMemo(() => buildLearnParams(answers), [answers]);

  function getStepCourses(step) {
    const removed = new Set(removedCoursesByStep[step.id] || []);
    const edits = courseEditsByStep[step.id] || {};
    return (step.courses || [])
      .filter((c) => !removed.has(c.code))
      .map((c) => edits[c.code] || c);
  }

  const draftSemesterHistory = useMemo(
    () =>
      buildSemesterHistoryFromOnboarding({
        steps,
        semesterGrades,
        customCoursesByStep,
        getStepCourses,
        gradePoints,
        computeGpa: computeGpaFromGrades,
      }),
    [steps, semesterGrades, customCoursesByStep, removedCoursesByStep, courseEditsByStep, gradePoints],
  );

  const focusAnalysis = useMemo(
    () => deriveImprovementSuggestions(draftSemesterHistory, gradePoints, maxFocusCourses),
    [draftSemesterHistory, gradePoints, maxFocusCourses],
  );

  useEffect(() => {
    if (!current?.id) return;
    stepIdRef.current = current.id;
  }, [current?.id]);

  useEffect(() => {
    const id = stepIdRef.current;
    if (!id) return;
    const idx = steps.findIndex((s) => s.id === id);
    if (idx >= 0 && idx !== step) setStep(idx);
    else if (step >= steps.length) setStep(Math.max(0, steps.length - 1));
  }, [steps, step]);

  useEffect(() => {
    setProgressFloor((floor) => {
      if (total > prevTotalRef.current) return Math.max(floor, rawProgress);
      return rawProgress;
    });
    prevTotalRef.current = total;
  }, [rawProgress, total]);

  useEffect(() => {
    if (current?.type !== 'courseFocus' || focusInitialized) return;
    const defaults = focusAnalysis.suggestions.slice(0, maxFocusCourses).map((s) => ({
      code: s.code,
      name: s.name,
      reason: s.reason,
      grade: s.grade,
    }));
    setSelectedFocus(defaults);
    setFocusInitialized(true);
  }, [current?.type, focusAnalysis, maxFocusCourses, focusInitialized]);

  useEffect(() => {
    if (current?.type !== 'aiLearn' || aiLearnDone) return;
    let cancelled = false;
    setAiLearning(true);
    setAiError('');
    learnAcademicProfile(learnParams)
      .then((profile) => {
        if (cancelled) return;
        setLearnedProfile(profile);
        setAiLearnDone(true);
      })
      .catch(() => {
        if (cancelled) return;
        const fallback = buildFallbackAcademicProfile(learnParams);
        setLearnedProfile(fallback);
        setAiLearnDone(true);
        setAiError('Could not reach AI. A basic profile was created — review and edit it on the next step.');
      })
      .finally(() => {
        setAiLearning(false);
      });
    return () => {
      cancelled = true;
    };
  }, [current?.type, current?.id, aiLearnDone, learnParams]);

  function toggleFocusCourse(course) {
    setSelectedFocus((prev) => {
      const exists = prev.some((c) => c.code === course.code);
      if (exists) return prev.filter((c) => c.code !== course.code);
      if (prev.length >= maxFocusCourses) return prev;
      return [...prev, { code: course.code, name: course.name, reason: course.reason, grade: course.grade }];
    });
  }

  function canContinue() {
    if (!current) return false;
    if (current.type === 'aiLearn') return aiLearnDone && !aiLearning;
    if (current.type === 'profileReview') return profileReviewConfirmed;
    if (current.type === 'courseFocus') return selectedFocus.length >= 1 && selectedFocus.length <= maxFocusCourses;
    if (current.type === 'welcome' || current.type === 'info') return true;
    if (current.type === 'complete') {
      if (!hasMinimumAcademicSetup(answers, learnedProfile, aiLearnDone, profileReviewConfirmed)) return false;
      const semCheck = minimumSemesterHistoryRequirement(semesterGrades, steps);
      if (!semCheck.ok) return false;
      return selectedFocus.length >= 1;
    }
    if (current.type === 'semesterGrades') {
      const gradeSteps = steps.filter((s) => s.type === 'semesterGrades');
      const isLastSemesterStep = gradeSteps[gradeSteps.length - 1]?.id === current.id;
      if (isLastSemesterStep) {
        return minimumSemesterHistoryRequirement(semesterGrades, steps).ok;
      }
      return true;
    }
    if (current.type === 'text') {
      const val = (answers[current.field] || '').trim();
      if (!val) return false;
      if (current.field === 'universityName') return validateInstitutionName(val).ok;
      if (current.field === 'programName') return validateProgramName(val).ok;
      return true;
    }
    if (current.type === 'country') return Boolean(answers.country);
    if (current.type === 'trackType') return Boolean(answers.trackType);
    if (current.type === 'studentPath') return Boolean(answers.studentPath);
    if (current.type === 'yearLevel') return Boolean(answers.currentLevel);
    if (current.type === 'semesterPick') return Boolean(answers.currentSemester);
    if (current.type === 'habit') return Boolean(selected ?? answers[current.id]);
    return Boolean(selected);
  }

  function getContinueBlockReason() {
    if (current?.type === 'courseFocus') {
      if (selectedFocus.length === 0) {
        return `Select at least one course to focus on (up to ${maxFocusCourses} for your plan window).`;
      }
    }
    if (current?.type === 'complete') {
      if (!hasMinimumAcademicSetup(answers, learnedProfile, aiLearnDone, profileReviewConfirmed)) {
        return 'Confirm your academic profile and complete all programme steps before entering Acad.';
      }
      const semCheck = minimumSemesterHistoryRequirement(semesterGrades, steps);
      if (!semCheck.ok) return semCheck.message;
      if (selectedFocus.length === 0) return 'Choose at least one focus course for your comeback plan.';
    }
    if (current?.type === 'semesterGrades') {
      const semCheck = minimumSemesterHistoryRequirement(semesterGrades, steps);
      const onLastSemesterStep = steps.filter((s) => s.type === 'semesterGrades').slice(-1)[0]?.id === current.id;
      if (onLastSemesterStep && !semCheck.ok) return semCheck.message;
    }
    if (current?.type === 'text' && current.field === 'universityName') {
      const check = validateInstitutionName(answers.universityName);
      if (!check.ok) return check.message;
    }
    if (current?.type === 'text' && current.field === 'programName') {
      const check = validateProgramName(answers.programName);
      if (!check.ok) return check.message;
    }
    if (current?.type === 'profileReview' && !profileReviewConfirmed) {
      return 'Review and confirm your academic profile before continuing.';
    }
    return '';
  }

  function setGradeForCourse(stepId, courseCode, grade) {
    setSemesterGrades((prev) => ({
      ...prev,
      [stepId]: { ...(prev[stepId] || {}), [courseCode]: grade },
    }));
  }

  function finish() {
    const semesterHistory = draftSemesterHistory;

    const academicProfile = {
      ...learnedProfile,
      institutionName: profileEdits.institutionName?.trim() || learnedProfile?.institutionName,
      programName: profileEdits.programName?.trim() || learnedProfile?.programName,
      gradingScale: {
        ...learnedProfile?.gradingScale,
        label: profileEdits.gradingLabel?.trim() || learnedProfile?.gradingScale?.label,
      },
      adaptationNotes: profileEdits.adaptationNotes?.trim() || learnedProfile?.adaptationNotes,
      semesterHistory,
    };

    const habitAnswers = {};
    steps.filter((s) => s.type === 'habit').forEach((s) => {
      habitAnswers[s.id] = answers[s.id];
    });

    const profile = {
      ...habitAnswers,
      startedAt: new Date().toISOString(),
      academicProfile,
      focusCourses: selectedFocus,
      improvementPattern: focusAnalysis.pattern,
    };

    const courseRecords = selectedFocus.map((c) => ({
      courseId: uid(),
      code: c.code,
      name: c.name,
      topics: [
        {
          topicId: uid(),
          name: c.name,
          importance: 'high',
          masteryLevel: 0,
          lastStudied: null,
        },
      ],
      assignments: [],
      exams: [],
    }));

    saveJSON(STORAGE_KEYS.courses, courseRecords);
    if (userId) persistWithCloud(userId, 'courses', courseRecords);

    setProfile(profile);
    initializeAcademicProfile(academicProfile);
    bumpDataEpoch();
    setPage('dashboard');
  }

  function next() {
    const blockReason = getContinueBlockReason();
    if (!canContinue()) {
      setValidationError(blockReason || 'Complete this step before continuing.');
      return;
    }
    setValidationError('');
    if (current.type === 'habit' && selected) {
      setAnswers((a) => ({ ...a, [current.id]: selected }));
    }
    if (step < total - 1) {
      const nextStep = step + 1;
      stepIdRef.current = steps[nextStep]?.id ?? stepIdRef.current;
      setStep(nextStep);
      const nextQ = steps[nextStep];
      setSelected(nextQ?.type === 'habit' ? answers[nextQ.id] || null : null);
      setAnimKey((k) => k + 1);
    } else {
      finish();
    }
  }

  function back() {
    if (step === 0) return;
    const prevStep = step - 1;
    stepIdRef.current = steps[prevStep]?.id ?? stepIdRef.current;
    setStep(prevStep);
    setProgressFloor(total > 0 ? ((prevStep + 1) / total) * 100 : 0);
    const prevQ = steps[prevStep];
    setSelected(prevQ?.type === 'habit' ? answers[prevQ.id] || null : null);
    setAnimKey((k) => k + 1);
  }

  function renderStep() {
    if (!current) return null;

    if (current.type === 'text') {
      const fieldHint =
        current.field === 'universityName' || current.field === 'programName'
          ? 'ob-accuracy-note'
          : '';
      return (
        <>
          {(current.field === 'universityName' || current.field === 'programName') && (
            <p className="ob-accuracy-note">
              Use the official, properly capitalized name. AI cannot map your programme from vague or lowercase entries.
            </p>
          )}
          <input
            className="form-input"
            placeholder={current.placeholder}
            value={answers[current.field] || ''}
            onChange={(e) => {
              setAnswers((a) => ({ ...a, [current.field]: e.target.value }));
              setValidationError('');
            }}
            autoFocus
          />
        </>
      );
    }

    if (current.type === 'country') {
      return (
        <div className="ob-options" role="radiogroup">
          {current.opts.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`ob-opt${answers.country === opt ? ' sel' : ''}`}
              onClick={() => setAnswers((a) => ({ ...a, country: opt }))}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }

    if (current.type === 'trackType' || current.type === 'studentPath' || current.type === 'yearLevel' || current.type === 'semesterPick') {
      const field =
        current.type === 'trackType'
          ? 'trackType'
          : current.type === 'studentPath'
            ? 'studentPath'
            : current.type === 'yearLevel'
              ? 'currentLevel'
              : 'currentSemester';
      return (
        <div className="ob-options" role="radiogroup">
          {current.opts.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`ob-opt${answers[field] === opt ? ' sel' : ''}`}
              onClick={() => setAnswers((a) => ({ ...a, [field]: opt }))}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }

    if (current.type === 'aiLearn') {
      return (
        <div className="ai-learn-panel">
          {aiLearning && <div className="lo-spinner" aria-hidden="true" />}
          {aiLearnDone && learnedProfile && (
            <div className="ai-learn-summary">
              <p><strong>{learnedProfile.institutionName}</strong> · {learnedProfile.programName}</p>
              <p className="ob-hint">{learnedProfile.gradingScale?.label}</p>
              <p className="ob-hint">{Object.keys(learnedProfile.curriculum || {}).length} year levels mapped</p>
              <p className="ob-accuracy-note">AI can make mistakes — you will review and edit everything on the next step.</p>
            </div>
          )}
          {aiError && <p className="form-error">{aiError}</p>}
        </div>
      );
    }

    if (current.type === 'profileReview') {
      return (
        <AcademicProfileReview
          profile={learnedProfile}
          edits={profileEdits}
          onChange={(edits) => {
            setProfileEdits(edits);
            setProfileReviewConfirmed(false);
          }}
          onConfirm={() => {
            setProfileReviewConfirmed(true);
            setAnswers((a) => ({
              ...a,
              universityName: profileEdits.institutionName?.trim() || learnedProfile?.institutionName || a.universityName,
              programName: profileEdits.programName?.trim() || learnedProfile?.programName || a.programName,
            }));
          }}
          confirmed={profileReviewConfirmed}
        />
      );
    }

    if (current.type === 'semesterGrades') {
      const stepGrades = semesterGrades[current.id] || {};
      const stepCustom = customCoursesByStep[current.id] || [];
      const stepCourses = getStepCourses(current);
      const stepEdits = courseEditsByStep[current.id] || {};
      const stepRemoved = new Set(removedCoursesByStep[current.id] || []);

      return (
        <>
          <p className="ob-accuracy-note">AI may miss courses or get titles wrong — edit code, title, credit hours, then pick grades.</p>
          <SemesterCourseEditor
            aiCourses={current.courses || []}
            customCourses={stepCustom}
            grades={stepGrades}
            gradeLetters={gradeLetters}
            courseEdits={stepEdits}
            removedCodes={stepRemoved}
            recordedCodes={new Set()}
            onGradeSelect={(code, letter) => setGradeForCourse(current.id, code, letter)}
            onGradeSkip={(code) => {
              setSemesterGrades((prev) => {
                const stepData = { ...(prev[current.id] || {}) };
                delete stepData[code];
                return { ...prev, [current.id]: stepData };
              });
            }}
            onCourseEdit={(originalCode, updated) => {
              const isCustom = stepCustom.some((c) => c.code === originalCode);
              if (isCustom) {
                setCustomCoursesByStep((prev) => ({
                  ...prev,
                  [current.id]: (prev[current.id] || []).map((c) => (c.code === originalCode ? updated : c)),
                }));
              } else {
                setCourseEditsByStep((prev) => ({
                  ...prev,
                  [current.id]: { ...(prev[current.id] || {}), [originalCode]: updated },
                }));
              }
              if (updated.code !== originalCode && stepGrades[originalCode]) {
                setSemesterGrades((prev) => {
                  const stepData = { ...(prev[current.id] || {}) };
                  stepData[updated.code] = stepData[originalCode];
                  delete stepData[originalCode];
                  return { ...prev, [current.id]: stepData };
                });
              }
            }}
            onCourseRemove={(code) => {
              setRemovedCoursesByStep((prev) => ({
                ...prev,
                [current.id]: [...(prev[current.id] || []), code],
              }));
              setSemesterGrades((prev) => {
                const stepData = { ...(prev[current.id] || {}) };
                delete stepData[code];
                return { ...prev, [current.id]: stepData };
              });
            }}
            onAddCustom={(course) => {
              const existing = [...getStepCourses(current), ...(customCoursesByStep[current.id] || [])];
              if (existing.some((c) => c.code === course.code)) return;
              setCustomCoursesByStep((prev) => ({
                ...prev,
                [current.id]: [...(prev[current.id] || []), course],
              }));
            }}
            onRemoveCustom={(code) => {
              setCustomCoursesByStep((prev) => ({
                ...prev,
                [current.id]: (prev[current.id] || []).filter((c) => c.code !== code),
              }));
              setSemesterGrades((prev) => {
                const stepData = { ...(prev[current.id] || {}) };
                delete stepData[code];
                return { ...prev, [current.id]: stepData };
              });
            }}
          />
          {!(current.courses?.length) && stepCustom.length === 0 && (
            <p className="ob-hint">No AI-mapped courses yet — add your own below with code, title, credits, and grade.</p>
          )}
        </>
      );
    }

    if (current.type === 'courseFocus') {
      return (
        <CourseFocusPicker
          pattern={focusAnalysis.pattern}
          suggestions={focusAnalysis.suggestions}
          maxCourses={maxFocusCourses}
          selected={selectedFocus}
          customCourses={focusCustomPool}
          onToggle={toggleFocusCourse}
          onAddCustom={(course) => {
            if (focusCustomPool.some((c) => c.code === course.code)) return;
            setFocusCustomPool((prev) => [...prev, course]);
            if (selectedFocus.length < maxFocusCourses) toggleFocusCourse(course);
          }}
          onRemoveCustom={(code) => {
            setFocusCustomPool((prev) => prev.filter((c) => c.code !== code));
            setSelectedFocus((prev) => prev.filter((c) => c.code !== code));
          }}
        />
      );
    }

    if (current.type === 'habit') {
      return (
        <div className="ob-options" role="radiogroup">
          {current.opts.map((opt, i) => (
            <button
              key={opt}
              id={`btn-ob-option-${i}`}
              className={`ob-opt${(selected ?? answers[current.id]) === opt ? ' sel' : ''}`}
              role="radio"
              aria-checked={(selected ?? answers[current.id]) === opt}
              onClick={() => setSelected(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }

    return null;
  }

  const phaseLabel =
    current.type === 'semesterGrades'
      ? 'Academic record'
      : current.type === 'courseFocus'
        ? 'Focus courses'
        : current.type === 'aiLearn'
        ? 'AI learning'
        : current.type === 'profileReview'
          ? 'Profile review'
          : current.type === 'habit'
          ? 'Your rhythm'
          : current.type === 'welcome' || current.type === 'complete'
            ? 'Welcome'
            : 'Your programme';

  return (
    <main className="page ob-page">
      <div className="ob-wrap">
        <section className="ob-panel">
          <div className="ob-meta">
            <span className="ob-counter">
              {step + 1} <span className="ob-counter-sep">/</span> {total}
            </span>
            <span className="ob-phase">{phaseLabel}</span>
          </div>
          <div className="ob-progress" role="progressbar" aria-valuenow={progressFloor} aria-valuemin={0} aria-valuemax={100}>
            <div className="ob-progress-fill" style={{ width: `${progressFloor}%` }} />
          </div>
          <div className="ob-question-wrap anim-fade-up" key={animKey}>
            <h2 className="ob-q">{current.q}</h2>
            <p className="ob-hint">{current.hint}</p>
            {renderStep()}
            {(validationError || getContinueBlockReason()) && !canContinue() && (
              <p className="form-error" role="alert" style={{ marginTop: 12 }}>
                {validationError || getContinueBlockReason()}
              </p>
            )}
          </div>
          <nav className="ob-nav" aria-label="Question navigation">
            <button id="btn-ob-back" className="btn btn-ghost" onClick={back} disabled={step === 0}>
              Back
            </button>
            <button id="btn-ob-continue" className="btn btn-primary" onClick={next} disabled={!canContinue()}>
              {current.type === 'complete' ? 'Enter Acad' : aiLearning ? 'Learning…' : 'Continue'}
            </button>
          </nav>
        </section>
      </div>
    </main>
  );
}
