import { ONBOARDING_QUESTIONS } from '../data/constants.js';
import { COMMON_PROGRAMMES, KNOWN_UNIVERSITIES } from '../data/institutions.js';
import { getCompletedSemesterSlots, getSemesterCoursesFromProfile } from './academicProfileUtils.js';

const CALMING_HABIT_OVERRIDES = {
  duration: {
    q: 'How much time do you have for your comeback?',
    hint: 'This sets your course limit and which tools unlock. You can log past semesters anytime; advancing to a new term unlocks when this window ends.',
  },
};

const COUNTRY_OPTS = ['Ghana', 'Nigeria', 'United Kingdom', 'United States', 'Other'];

function habitStep(question) {
  const override = CALMING_HABIT_OVERRIDES[question.id] ?? {};
  return {
    type: 'habit',
    id: question.id,
    q: override.q ?? question.q,
    hint: override.hint ?? question.hint,
    opts: question.opts,
  };
}

/**
 * Single semester slot for the fast onboarding path (most recent completed term only).
 */
export function getFastPathSemesterSlot(studentPath, currentLevel, currentSemester) {
  if (studentPath === 'new') {
    return {
      level: 100,
      semester: 0,
      label: 'Most recent completed term',
    };
  }
  if (!currentLevel || !currentSemester) {
    return {
      level: 100,
      semester: 0,
      label: 'Most recent completed term',
    };
  }
  const completed = getCompletedSemesterSlots(currentLevel, currentSemester);
  if (completed.length === 0) {
    return {
      level: 100,
      semester: 0,
      label: 'Most recent completed term',
    };
  }
  return completed[completed.length - 1];
}

/**
 * Fast onboarding: programme setup → AI profile → one semester → focus course.
 * Habit questions and full semester history are deferred to in-product setup.
 */
export function buildOnboardingFlow(ctx) {
  const {
    universityName,
    programName,
    country,
    trackType,
    studentPath,
    currentLevel,
    currentSemester,
    learnedProfile,
    aiLearnDone,
    prefillDuration,
  } = ctx;

  const steps = [];

  steps.push({
    type: 'welcome',
    id: 'welcome',
    q: 'Let us get you started',
    hint: 'About five minutes — your university, one semester of grades, and your first focus course. Everything else unfolds inside Acad as you use it.',
  });

  steps.push({
    type: 'text',
    id: 'universityName',
    field: 'universityName',
    q: 'Which university are you at?',
    hint: 'Start typing and pick from the list, or enter your own. Official name helps AI map your programme.',
    placeholder: 'e.g. University of Ghana',
    suggestions: KNOWN_UNIVERSITIES,
  });

  if (universityName?.trim()) {
    steps.push({
      type: 'text',
      id: 'programName',
      field: 'programName',
      q: 'Which programme are you studying?',
      hint: 'Start typing and pick from the list, or enter your own. Edit or add courses later if AI misses any.',
      placeholder: 'e.g. BSc Information Technology',
      suggestions: COMMON_PROGRAMMES,
    });
  }

  if (programName?.trim()) {
    steps.push({
      type: 'country',
      id: 'country',
      q: 'Where is your university?',
      hint: 'This helps Acad infer the right grading scale.',
      opts: COUNTRY_OPTS,
    });
  }

  if (country) {
    steps.push({
      type: 'trackType',
      id: 'trackType',
      q: 'How is your programme structured?',
      hint: 'Single major or combined — you can add a second programme later in Settings.',
      opts: ['Single major', 'Combined major'],
    });
  }

  if (trackType) {
    steps.push({
      type: 'studentPath',
      id: 'studentPath',
      q: 'Where are you on your academic journey?',
      hint: 'Whether you are just starting or almost done, we adapt to you.',
      opts: ['Just starting (Level 100, Semester 1)', 'I am already in my programme'],
    });
  }

  if (studentPath === 'continuing' && universityName && programName) {
    steps.push({
      type: 'yearLevel',
      id: 'currentLevel',
      q: 'Which year level are you in now?',
      hint: 'Tap your current level.',
      opts: ['Level 100', 'Level 200', 'Level 300', 'Level 400'],
    });
  }

  if (studentPath === 'continuing' && currentLevel) {
    steps.push({
      type: 'semesterPick',
      id: 'currentSemester',
      q: `Which semester of Level ${currentLevel} are you in?`,
      hint: 'We will ask for your most recent completed term only — add older terms later from Semester journey.',
      opts: ['Semester 1', 'Semester 2'],
    });
  }

  if (!prefillDuration) {
    steps.push(habitStep(ONBOARDING_QUESTIONS[0]));
  }

  if (universityName?.trim() && programName?.trim() && studentPath) {
    steps.push({
      type: 'aiLearn',
      id: 'aiLearn',
      q: aiLearnDone ? 'Acad has learned your programme' : 'Acad is learning your programme…',
      hint: aiLearnDone
        ? 'Review the summary on the next step — you can edit everything.'
        : 'Mapping your grading scale and course structure. This runs in the background while you continue.',
    });
  }

  if (aiLearnDone && learnedProfile) {
    steps.push({
      type: 'profileReview',
      id: 'profileReview',
      q: 'Review your academic profile',
      hint: 'Confirm or edit what AI inferred.',
    });
  }

  if (aiLearnDone && learnedProfile && studentPath) {
    const slot = getFastPathSemesterSlot(studentPath, currentLevel, currentSemester);
    const courses =
      studentPath === 'new'
        ? []
        : getSemesterCoursesFromProfile(learnedProfile, slot.level, slot.semester);
    steps.push({
      type: 'semesterGrades',
      id: `grades-${slot.level}-${slot.semester}`,
      level: slot.level,
      semester: slot.semester,
      label: slot.label,
      q: studentPath === 'new' ? 'Your most recent completed semester' : `Grades for ${slot.label}`,
      hint: 'Enter at least 3 courses from one completed term. Add older semesters anytime from your dashboard.',
      courses,
      deferrable: true,
    });
  }

  const hasSemesterStep = steps.some((s) => s.type === 'semesterGrades');
  if (aiLearnDone && learnedProfile && hasSemesterStep) {
    steps.push({
      type: 'courseFocus',
      id: 'courseFocus',
      q: 'Where should Acad focus your improvement?',
      hint: 'Pick at least one course for your comeback plan. You can add more when your window allows.',
    });
  }

  steps.push({
    type: 'complete',
    id: 'complete',
    q: 'You are ready for your dashboard',
    hint: 'Your first daily task, flashcards, and AI buddy are waiting. We will help you fill in the rest as you go.',
  });

  return steps;
}

export function parseLevel(opt) {
  const m = String(opt).match(/(\d{3})/);
  return m ? Number(m[1]) : null;
}

export function parseSemester(opt) {
  return String(opt).includes('2') ? 2 : 1;
}

export function buildLearnParams(answers) {
  const studentPath = answers.studentPath?.startsWith('Just') ? 'new' : answers.studentPath ? 'continuing' : null;
  return {
    universityName: (answers.universityName || '').trim(),
    programName: (answers.programName || '').trim(),
    departmentName: (answers.departmentName || '').trim() || null,
    country: answers.country || '',
    trackType: answers.trackType || 'Single major',
    secondaryProgram: (answers.secondaryProgram || '').trim() || null,
    studentPath,
    currentLevel: studentPath === 'new' ? 100 : parseLevel(answers.currentLevel),
    currentSemester: studentPath === 'new' ? 1 : answers.currentSemester ? parseSemester(answers.currentSemester) : null,
  };
}
