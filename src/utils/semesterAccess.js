import { getCompletedSemesterSlots } from './academicProfileUtils.js';
import { getPlanTimeline } from './planTimeline.js';

export function isSemesterLocked(level, semester, currentLevel, currentSemester) {
  if (level > currentLevel) return true;
  if (level === currentLevel && semester >= currentSemester) return true;
  return false;
}

export function getMostRecentCompletedSlot(currentLevel, currentSemester) {
  const slots = getCompletedSemesterSlots(currentLevel, currentSemester);
  return slots.at(-1) ?? null;
}

export function findHistoryEntry(gradeHistory, level, semester) {
  return (gradeHistory || []).find((h) => h.level === level && h.semester === semester) ?? null;
}

/** Next term the student would enter after finishing the current one. */
export function getNextEnteringPosition(currentLevel, currentSemester) {
  if (currentSemester === 1) {
    return { level: currentLevel, semester: 2, label: `Level ${currentLevel} · Semester 2` };
  }
  if (currentLevel >= 400) return null;
  const nextLevel = currentLevel + 100;
  return { level: nextLevel, semester: 1, label: `Level ${nextLevel} · Semester 1` };
}

export function getNewSemesterTarget(currentLevel, currentSemester, gradeHistory) {
  const mostRecent = getMostRecentCompletedSlot(currentLevel, currentSemester);
  if (!mostRecent) return null;
  if (findHistoryEntry(gradeHistory, mostRecent.level, mostRecent.semester)) return null;
  return mostRecent;
}

function getAcademicSemesterAddStatus(currentLevel, currentSemester, gradeHistory) {
  const target = getNewSemesterTarget(currentLevel, currentSemester, gradeHistory);
  if (target) {
    return {
      canAdd: true,
      target,
      needsPositionAdvance: false,
      blockedReason: null,
      nextEnteringPosition: null,
    };
  }

  const completed = getCompletedSemesterSlots(currentLevel, currentSemester);
  const mostRecent = completed.at(-1);
  const nextEntering = getNextEnteringPosition(currentLevel, currentSemester);

  if (!mostRecent) {
    return {
      canAdd: false,
      target: null,
      needsPositionAdvance: false,
      blockedReason: 'No completed term exists before your current entering position. Set your level and semester in Semester hub.',
      nextEnteringPosition: nextEntering,
    };
  }

  if (nextEntering) {
    const afterAdvanceTarget = getNewSemesterTarget(nextEntering.level, nextEntering.semester, gradeHistory);
    return {
      canAdd: false,
      target: afterAdvanceTarget,
      needsPositionAdvance: true,
      blockedReason: `You've logged all terms before Level ${currentLevel} Semester ${currentSemester}. Advance your entering term to unlock the next semester to add.`,
      nextEnteringPosition: nextEntering,
      lastLoggedLabel: mostRecent.label,
    };
  }

  return {
    canAdd: false,
    target: null,
    needsPositionAdvance: false,
    blockedReason: 'All available terms are logged at your current programme level.',
    nextEnteringPosition: null,
  };
}

/**
 * Semester add status — new semesters require the comeback plan timeline to end first.
 */
export function getSemesterAddStatus(currentLevel, currentSemester, gradeHistory, profile = null) {
  const academic = getAcademicSemesterAddStatus(currentLevel, currentSemester, gradeHistory);
  const timeline = profile ? getPlanTimeline(profile) : { isEnded: true, label: 'plan' };
  const wouldAddIfTimelineEnded = academic.canAdd || academic.needsPositionAdvance;

  if (!timeline.isEnded && wouldAddIfTimelineEnded) {
    return {
      ...academic,
      canAdd: false,
      needsPositionAdvance: false,
      blockedByTimeline: true,
      wouldAddIfTimelineEnded: true,
      blockedReason: `Your ${timeline.label} comeback plan must finish before you can log a new semester.`,
      timeline,
    };
  }

  return {
    ...academic,
    blockedByTimeline: false,
    wouldAddIfTimelineEnded,
    timeline,
  };
}

export function needsLatestSemesterUpdate(currentLevel, currentSemester, gradeHistory, profile = null) {
  const status = getSemesterAddStatus(currentLevel, currentSemester, gradeHistory, profile);
  return status.canAdd && !status.blockedByTimeline;
}

/** Show semester-add UI when there is academic work pending (may be timeline-gated). */
export function shouldOpenSemesterAddFlow(currentLevel, currentSemester, gradeHistory, profile = null) {
  return getSemesterAddStatus(currentLevel, currentSemester, gradeHistory, profile).wouldAddIfTimelineEnded;
}

/** True when user can actually start the add-semester pipeline now. */
export function canLogNewSemesterNow(currentLevel, currentSemester, gradeHistory, profile = null) {
  const status = getSemesterAddStatus(currentLevel, currentSemester, gradeHistory, profile);
  return (status.canAdd || status.needsPositionAdvance) && !status.blockedByTimeline;
}

export function getSelectableSemesters(currentLevel, currentSemester, gradeHistory) {
  const completed = getCompletedSemesterSlots(currentLevel, currentSemester);
  const loggedKeys = new Set((gradeHistory || []).map((h) => `${h.level}-${h.semester}`));
  const mostRecent = completed.at(-1);
  const mostRecentKey = mostRecent ? `${mostRecent.level}-${mostRecent.semester}` : null;

  return completed.map((slot) => {
    const key = `${slot.level}-${slot.semester}`;
    const logged = loggedKeys.has(key);
    const isNextToLog = !logged && key === mostRecentKey;
    const selectable = logged || isNextToLog;
    return {
      ...slot,
      logged,
      selectable,
      locked: !selectable,
      status: logged ? 'logged' : isNextToLog ? 'available' : 'locked',
    };
  });
}

export function canSelectSemester(level, semester, currentLevel, currentSemester, gradeHistory) {
  if (isSemesterLocked(level, semester, currentLevel, currentSemester)) return false;
  return getSelectableSemesters(currentLevel, currentSemester, gradeHistory).some(
    (s) => s.level === level && s.semester === semester && s.selectable,
  );
}

export function defaultSemesterSelection(currentLevel, currentSemester, gradeHistory) {
  const slots = getSelectableSemesters(currentLevel, currentSemester, gradeHistory);
  const available = slots.find((s) => s.status === 'available');
  if (available) return { level: available.level, semester: available.semester };
  const logged = slots.filter((s) => s.logged);
  const latest = logged.at(-1);
  if (latest) return { level: latest.level, semester: latest.semester };
  const mostRecent = getMostRecentCompletedSlot(currentLevel, currentSemester);
  if (mostRecent) return { level: mostRecent.level, semester: mostRecent.semester };
  return { level: currentLevel, semester: Math.max(1, currentSemester - 1) };
}
