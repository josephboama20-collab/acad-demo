import { ONBOARDING_QUESTIONS } from '../data/constants.js';
import { getCompletedSemesterSlots } from './academicProfileUtils.js';

/** Habit questions collected in-product after the fast onboarding path. */
export const DEFERRED_HABIT_IDS = ['effort', 'time', 'position', 'sharpness', 'focus'];

const DEFERRED_META = {
  effort: { label: 'Set your study pace', context: 'Helps calibrate daily task difficulty.' },
  time: { label: 'Daily study time', context: 'We will match tasks to the time you have.' },
  position: { label: 'Where you are starting from', context: 'No judgment — this shapes pacing.' },
  sharpness: { label: 'How sharp you feel today', context: 'Updates your cognitive load indicator.' },
  focus: { label: 'Your interest area', context: 'Guides AI Buddy and report emphasis.' },
};

export function getDeferredHabitQuestion(id) {
  const q = ONBOARDING_QUESTIONS.find((item) => item.id === id);
  const meta = DEFERRED_META[id];
  if (!q) return null;
  return { ...q, ...meta };
}

export function getNextDeferredHabit(profile) {
  if (!profile) return null;
  return DEFERRED_HABIT_IDS.find((id) => !profile[id]) ?? null;
}

export function countDeferredHabitsRemaining(profile) {
  if (!profile) return DEFERRED_HABIT_IDS.length;
  return DEFERRED_HABIT_IDS.filter((id) => !profile[id]).length;
}

export function getExpectedSemesterCount(profile) {
  const ap = profile?.academicProfile;
  if (!ap) return 1;
  if (profile?.studentPath === 'new') return 1;
  const level = ap.currentLevel ?? 100;
  const sem = ap.currentSemester ?? 1;
  return Math.max(1, getCompletedSemesterSlots(level, sem).length);
}

export function needsMoreSemesterHistory(profile, gradeHistoryLength) {
  const expected = getExpectedSemesterCount(profile);
  return gradeHistoryLength < expected;
}
