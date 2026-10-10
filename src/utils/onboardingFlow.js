import { ONBOARDING_QUESTIONS } from '../data/constants.js';
import { getCompletedSemesterSlots, getSemesterCoursesFromProfile } from './academicProfileUtils.js';

const CALMING_HABIT_OVERRIDES = {
  duration: {
    q: 'How much time do you have for your comeback?',
    hint: 'There is no wrong answer here. We will shape your plan around what is realistic for you.',
  },
  effort: {
    q: 'What pace feels right for you right now?',
    hint: 'Be honest with yourself — steady progress beats burnout every time.',
  },
  time: {
    q: 'How much quiet study time can you give each day?',
    hint: 'Even twenty focused minutes can move you forward. We will meet you where you are.',
  },
  position: {
    q: 'Where are you emotionally, academically?',
    hint: 'No judgment. This simply helps us pace things kindly.',
  },
  sharpness: {
    q: 'How clear does your mind feel today?',
    hint: 'Some days are sharper than others. That is completely normal.',
  },
  focus: {
    q: 'Which area matters most to you right now?',
    hint: 'Your courses and goals will shape everything Acad shows you.',
  },
  intention: {
    q: 'What would feel like a win for you this season?',
    hint: 'A small, honest intention is often the most powerful one.',
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
 * Mixed onboarding: key parameters → AI learns programme → grade buttons from learned profile.
 */
export function buildOnboardingFlow(ctx) {
  const {
    universityName,
    programName,
    country,
    trackType,
    secondaryProgram,
    studentPath,
    currentLevel,
    currentSemester,
    learnedProfile,
    aiLearnDone,
  } = ctx;

  const steps = [];

  steps.push({
    type: 'welcome',
    id: 'welcome',
    q: 'Welcome — let us set up your academic home',
    hint: 'A few calm minutes. Tell us your university and programme accurately — Acad\'s AI maps your curriculum from what you enter. You can correct anything the AI gets wrong.',
  });

  steps.push({
    type: 'text',
    id: 'universityName',
    field: 'universityName',
    q: 'Which university are you at?',
    hint: 'Type the official name with proper capitalization (e.g. University of Ghana). Inaccurate or lowercase names may prevent AI from mapping your programme.',
    placeholder: 'e.g. University of Ghana',
  });

  if (universityName?.trim()) {
    steps.push({
      type: 'text',
      id: 'programName',
      field: 'programName',
      q: 'Which programme are you studying?',
      hint: 'Your full degree title, properly capitalized (e.g. BSc Information Technology). AI uses this to find your courses — edit or add courses later if it misses any.',
      placeholder: 'e.g. BSc Information Technology',
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
      hint: 'Single major or combined — Acad adapts to your department\'s rules.',
      opts: ['Single major', 'Combined major'],
    });
  }

  if (trackType === 'Combined major') {
    steps.push({
      type: 'text',
      id: 'secondaryProgram',
      field: 'secondaryProgram',
      q: 'What is your second programme?',
      hint: 'For combined majors — Acad will account for both.',
      placeholder: 'e.g. BSc Economics',
    });
  }

  if (trackType && (trackType !== 'Combined major' || secondaryProgram?.trim())) {
    steps.push({
      type: 'studentPath',
      id: 'studentPath',
      q: 'Where are you on your academic journey?',
      hint: 'Whether you are just starting or almost done, we adapt to you.',
      opts: ['Just starting (Level 100, Semester 1)', 'I am already in my programme'],
    });
  }

  steps.push(habitStep(ONBOARDING_QUESTIONS[0])); // duration

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
      hint: 'This tells us what you have already completed.',
      opts: ['Semester 1', 'Semester 2'],
    });
  }

  steps.push(habitStep(ONBOARDING_QUESTIONS[1])); // effort

  if (universityName?.trim() && programName?.trim() && studentPath) {
    steps.push({
      type: 'aiLearn',
      id: 'aiLearn',
      q: aiLearnDone ? 'Acad has learned your programme' : 'Acad is learning your programme…',
      hint: aiLearnDone
        ? 'Review the summary on the next step — AI can make mistakes, and you can edit everything.'
        : 'Our AI is mapping your grading scale and course structure from the names you entered. Accurate spelling and capitalization help.',
    });
  }

  if (aiLearnDone && learnedProfile) {
    steps.push({
      type: 'profileReview',
      id: 'profileReview',
      q: 'Review your academic profile',
      hint: 'Confirm or edit what AI inferred. You cannot enter Acad until this profile is accurate.',
    });
  }

  if (aiLearnDone && learnedProfile && studentPath === 'continuing' && currentLevel && currentSemester) {
    const completed = getCompletedSemesterSlots(currentLevel, currentSemester);
    completed.forEach((slot, i) => {
      if (i === Math.floor(completed.length / 2)) {
        steps.push(habitStep(ONBOARDING_QUESTIONS[2])); // time
      }
      const courses = getSemesterCoursesFromProfile(learnedProfile, slot.level, slot.semester);
      steps.push({
        type: 'semesterGrades',
        id: `grades-${slot.level}-${slot.semester}`,
        level: slot.level,
        semester: slot.semester,
        label: slot.label,
        q: `Grades for ${slot.label}`,
        hint: 'Most semesters have 5–7 courses; AI may show fewer — add missing courses below. Enter at least one full term (3+ courses) before continuing.',
        courses,
      });
    });
  }

  if (studentPath === 'new' && aiLearnDone && learnedProfile) {
    steps.push({
      type: 'semesterGrades',
      id: 'grades-prior-term',
      level: 100,
      semester: 0,
      label: 'Most recent completed term',
      q: 'Your most recent completed semester',
      hint: 'Acad works between semesters — after one term ends, before the next begins. Enter at least 3 courses from your most recent completed term (add any AI missed).',
      courses: [],
    });
  }

  const hasSemesterSteps = steps.some((s) => s.type === 'semesterGrades');
  if (aiLearnDone && learnedProfile && hasSemesterSteps) {
    steps.push({
      type: 'courseFocus',
      id: 'courseFocus',
      q: 'Where should Acad focus your improvement?',
      hint: 'From your grade history, we suggest courses to strengthen before the next term. Your plan timeline limits how many you can work on now.',
    });
  }

  steps.push(habitStep(ONBOARDING_QUESTIONS[3])); // position
  steps.push(habitStep(ONBOARDING_QUESTIONS[4])); // sharpness
  steps.push(habitStep(ONBOARDING_QUESTIONS[5])); // focus
  steps.push(habitStep(ONBOARDING_QUESTIONS[6])); // intention

  steps.push({
    type: 'complete',
    id: 'complete',
    q: 'You are all set',
    hint: 'Your academic profile is confirmed. Acad will adapt each semester — you can always update courses and grades on the Semester page.',
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
