/**
 * Helpers for user-specific AI-generated academic profiles (not hardcoded institutions).
 */

export function getCompletedSemesterSlots(currentLevel, currentSemester) {
  const slots = [];
  const levels = [100, 200, 300, 400];
  for (const level of levels) {
    for (let sem = 1; sem <= 2; sem++) {
      if (level < currentLevel || (level === currentLevel && sem < currentSemester)) {
        slots.push({ level, semester: sem, label: `Level ${level} · Semester ${sem}` });
      }
      if (level === currentLevel && sem === currentSemester) break;
    }
    if (level === currentLevel) break;
  }
  return slots;
}

export function getSemesterCoursesFromProfile(academicProfile, level, semester) {
  const curriculum = academicProfile?.curriculum;
  if (!curriculum) return [];
  const levelKey = String(level);
  const semKey = String(semester);
  return curriculum[levelKey]?.[semKey] ?? curriculum[level]?.[semester] ?? [];
}

export function getGradeLettersFromProfile(academicProfile) {
  return (academicProfile?.gradingScale?.grades ?? []).map((g) => g.letter);
}

export function getGradePointsMap(academicProfile) {
  const grades = academicProfile?.gradingScale?.grades ?? [];
  return Object.fromEntries(grades.map((g) => [g.letter, g.points]));
}

export function getAdaptationMode({ studentPath, progressionStatus, currentLevel }) {
  if (studentPath === 'new') return 'foundation';
  if (progressionStatus === 'improved') return 'accelerate';
  if (progressionStatus === 'regressed') return 'recovery';
  if (progressionStatus === 'stable') return 'steady';
  if (currentLevel >= 400) return 'finishing';
  return 'building';
}

export function getAdaptationMessage(mode) {
  const messages = {
    foundation: 'You are at the start of your journey. Acad will keep things gentle and build strong habits first.',
    building: 'You are building momentum. Acad balances consistency with steady academic challenge.',
    accelerate: 'You improved last term. Acad will raise the bar thoughtfully — you are ready for more.',
    recovery: 'Last term was tougher. Acad will slow the pace and focus on foundations until you regain ground.',
    steady: 'You held steady. Acad keeps a calm, balanced rhythm so progress feels sustainable.',
    finishing: 'You are nearing the finish line. Acad shifts toward revision, projects, and exam readiness.',
  };
  return messages[mode] ?? messages.building;
}

export function normalizeAcademicProfile(raw, params) {
  if (!raw || typeof raw !== 'object') return null;

  const curriculum = raw.curriculum ?? {};
  const normalizedCurriculum = {};
  Object.keys(curriculum).forEach((level) => {
    normalizedCurriculum[level] = {};
    const sems = curriculum[level];
    Object.keys(sems || {}).forEach((sem) => {
      normalizedCurriculum[level][sem] = (sems[sem] || []).map((c) => ({
        code: String(c.code || '').trim(),
        name: String(c.name || '').trim(),
        credits: Number(c.credits) || 3,
        type: c.type || 'core',
      })).filter((c) => c.code && c.name);
    });
  });

  const grades = (raw.gradingScale?.grades ?? []).map((g) => ({
    letter: g.letter,
    points: Number(g.points),
    min: g.min ?? null,
    max: g.max ?? null,
    label: g.label ?? g.letter,
  })).filter((g) => g.letter && !Number.isNaN(g.points));

  return {
    source: raw.source || 'ai',
    learnedAt: new Date().toISOString(),
    institutionName: raw.institutionName || params.universityName,
    programName: raw.programName || params.programName,
    departmentName: raw.departmentName || params.departmentName || null,
    country: params.country,
    trackType: params.trackType === 'Combined major' ? 'combined' : 'single',
    secondaryProgram: params.secondaryProgram || null,
    studentPath: params.studentPath,
    currentLevel: params.studentPath === 'new' ? 100 : params.currentLevel,
    currentSemester: params.studentPath === 'new' ? 1 : params.currentSemester,
    gradingScale: {
      label: raw.gradingScale?.label || `${params.country || 'Local'} grading`,
      grades,
    },
    programStructure: raw.programStructure ?? {
      durationYears: 4,
      levels: [100, 200, 300, 400],
      semestersPerYear: 2,
    },
    curriculum: normalizedCurriculum,
    adaptationNotes: raw.adaptationNotes || '',
    semesterHistory: [],
  };
}
