import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { persistWithCloud } from '../utils/cloudSync.js';
import { loadJSON, STORAGE_KEYS } from '../utils/storage.js';
import {
  avgMasteryFromSnapshot,
  buildSnapshot,
  compareSemesterGrades,
  computeDeltas,
  computeGpaFromGrades,
  latestClosedSnapshot,
  semesterIdFromLabel,
} from '../utils/semesterUtils.js';
import { getGradePointsMap } from '../utils/academicProfileUtils.js';

function gradePointsFromProfile(academicProfile) {
  return getGradePointsMap(academicProfile);
}

const DEFAULT_SEMESTERS = {
  currentSemesterId: null,
  semesters: [],
  snapshots: {},
  gradeHistory: [],
  academicProfile: null,
  continuingStudent: false,
  progressionStatus: 'new',
};

const SemestersContext = createContext(null);

export function SemestersProvider({ children }) {
  const { userId, dataEpoch } = useAuth();

  const [state, setState] = useState(() => {
    return loadJSON(STORAGE_KEYS.semesters) ?? DEFAULT_SEMESTERS;
  });

  useEffect(() => {
    const loaded = loadJSON(STORAGE_KEYS.semesters);
    if (loaded) {
      setState(loaded);
      return;
    }
    setState(DEFAULT_SEMESTERS);
  }, [dataEpoch]);

  const persist = useCallback(
    (updater) => {
      setState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
        persistWithCloud(userId, 'semesters', next);
        return next;
      });
    },
    [userId],
  );

  /** Create and activate a new semester. */
  const startSemester = useCallback(
    (label, startedAt = null) => {
      const cleanLabel = (label || '').trim();
      if (!cleanLabel) return { ok: false, reason: 'label_required' };

      if (state.currentSemesterId) return { ok: false, reason: 'already_active' };

      const id = semesterIdFromLabel(cleanLabel) + '-' + Date.now().toString(36);
      const semester = {
        id,
        label: cleanLabel,
        startedAt: startedAt || new Date().toISOString(),
        endedAt: null,
      };
      persist((s) => ({
        ...s,
        currentSemesterId: id,
        semesters: [...s.semesters, semester],
      }));
      return { ok: true, semester };
    },
    [persist, state.currentSemesterId],
  );

  /** Close the current semester and capture mastery snapshot from live courses. */
  const closeSemester = useCallback(
    (courses) => {
      persist((s) => {
        if (!s.currentSemesterId || !Array.isArray(courses) || courses.length === 0) return s;
        const id = s.currentSemesterId;
        const snapshots = buildSnapshot(id, courses);
        return {
          ...s,
          currentSemesterId: null,
          semesters: s.semesters.map((sem) =>
            sem.id === id ? { ...sem, endedAt: new Date().toISOString() } : sem,
          ),
          snapshots: { ...s.snapshots, [id]: snapshots },
        };
      });
    },
    [persist],
  );

  const initializeAcademicProfile = useCallback(
    (academicProfile) => {
      if (!academicProfile) return;
      const gradePoints = gradePointsFromProfile(academicProfile);
      const history = (academicProfile.semesterHistory || []).map((sem, i, arr) => {
        const prev = arr[i - 1];
        const comparison = prev
          ? compareSemesterGrades(prev.courses, sem.courses, gradePoints)
          : { status: i === 0 ? 'baseline' : 'unknown', delta: 0 };
        return {
          id: `onboard-${sem.level}-${sem.semester}`,
          label: sem.label,
          level: sem.level,
          semester: sem.semester,
          capturedAt: new Date().toISOString(),
          courses: sem.courses,
          gpa: sem.gpa ?? computeGpaFromGrades(sem.courses, gradePoints),
          status: comparison.status,
          delta: comparison.delta ?? 0,
        };
      });
      const lastStatus = history.at(-1)?.status ?? 'new';
      persist({
        academicProfile: {
          ...academicProfile,
          semesterHistory: (academicProfile.semesterHistory || history.map((h) => ({
            label: h.label,
            level: h.level,
            semester: h.semester,
            courses: h.courses,
            gpa: h.gpa,
          }))),
        },
        gradeHistory: history,
        continuingStudent: academicProfile.studentPath === 'continuing' || history.length > 0,
        progressionStatus: lastStatus === 'baseline' ? 'new' : lastStatus,
      });
    },
    [persist],
  );

  const initializeBaseline = useCallback(
    (baseline) => {
      if (!baseline || !Array.isArray(baseline.courses) || baseline.courses.length === 0) return;
      const gpa = computeGpaFromGrades(baseline.courses);
      persist((s) => {
        if ((s.gradeHistory || []).length > 0) return s;
        const entry = {
          id: `baseline-${Date.now().toString(36)}`,
          label: baseline.label || 'Baseline semester',
          capturedAt: new Date().toISOString(),
          courses: baseline.courses,
          gpa,
          status: 'baseline',
          delta: 0,
        };
        return {
          ...s,
          gradeHistory: [entry],
          continuingStudent: true,
          progressionStatus: 'new',
        };
      });
    },
    [persist],
  );

  const advanceAcademicPosition = useCallback(
    ({ level, semester }) => {
      if (!level || !semester) return { ok: false, reason: 'invalid_position' };
      persist((s) => {
        if (!s.academicProfile) return s;
        return {
          ...s,
          academicProfile: {
            ...s.academicProfile,
            currentLevel: level,
            currentSemester: semester,
          },
        };
      });
      return { ok: true, level, semester };
    },
    [persist],
  );

  /** Re-run AI programme learning; keeps grade history and semester records. */
  const relearnAcademicProfile = useCallback(
    (nextProfile) => {
      if (!nextProfile) return;
      persist((s) => {
        const prev = s.academicProfile || {};
        return {
          ...s,
          academicProfile: {
            ...nextProfile,
            semesterHistory: prev.semesterHistory ?? nextProfile.semesterHistory ?? [],
            currentLevel: prev.currentLevel ?? nextProfile.currentLevel,
            currentSemester: prev.currentSemester ?? nextProfile.currentSemester,
            learnedAt: new Date().toISOString(),
          },
        };
      });
    },
    [persist],
  );

  const recordSemesterOutcome = useCallback(
    ({ label, level, semester, courses }) => {
      if (!Array.isArray(courses) || courses.length === 0) {
        return { ok: false, reason: 'courses_required' };
      }
      const gradePoints = gradePointsFromProfile(state.academicProfile);
      const gpa = computeGpaFromGrades(courses, gradePoints);
      let comparison = { status: 'unknown', delta: 0, prevGpa: null, nextGpa: gpa };
      persist((s) => {
        const history = [...(s.gradeHistory || [])];
        const chron = [...history].sort((a, b) => a.level - b.level || a.semester - b.semester);
        const existingIdx = chron.findIndex((h) => h.level === level && h.semester === semester);
        const previous = existingIdx > 0 ? chron[existingIdx - 1] : existingIdx === -1 ? chron.at(-1) : null;
        comparison = compareSemesterGrades(previous?.courses || [], courses, gradePoints);

        const entry = {
          id: existingIdx >= 0 ? chron[existingIdx].id : `outcome-${Date.now().toString(36)}`,
          label: (label || '').trim() || `Level ${level} · Semester ${semester}`,
          level,
          semester,
          capturedAt: new Date().toISOString(),
          courses,
          gpa,
          status: comparison.status,
          delta: comparison.delta,
          comparedTo: previous?.label || null,
        };

        let nextHistory;
        if (existingIdx >= 0) {
          nextHistory = chron.map((h, i) => (i === existingIdx ? { ...h, ...entry } : h));
        } else {
          nextHistory = [...chron, entry];
        }

        const curriculum = s.academicProfile?.curriculum ?? {};
        const levelKey = String(level);
        const semKey = String(semester);
        const updatedCurriculum = {
          ...curriculum,
          [levelKey]: {
            ...(curriculum[levelKey] || {}),
            [semKey]: courses.map((c) => ({
              code: c.code,
              name: c.name,
              credits: c.credits ?? 3,
              type: 'core',
            })),
          },
        };

        const semesterHistory = nextHistory.map((h) => ({
          label: h.label,
          level: h.level,
          semester: h.semester,
          courses: h.courses,
          gpa: h.gpa,
        }));

        const academicProfile = s.academicProfile
          ? {
              ...s.academicProfile,
              curriculum: updatedCurriculum,
              semesterHistory,
            }
          : null;

        return {
          ...s,
          academicProfile,
          gradeHistory: nextHistory,
          continuingStudent: true,
          progressionStatus: comparison.status,
        };
      });
      return { ok: true, comparison };
    },
    [persist, state.academicProfile],
  );

  const currentSemester = useMemo(
    () => state.semesters.find((s) => s.id === state.currentSemesterId) ?? null,
    [state],
  );

  const closedSemesters = useMemo(
    () => [...state.semesters].filter((s) => s.endedAt).sort((a, b) => (b.endedAt > a.endedAt ? 1 : -1)),
    [state],
  );

  /** Latest closed semester's snapshots (for delta computation). */
  const latestClosed = useMemo(
    () => latestClosedSnapshot(state.semesters, state.snapshots),
    [state],
  );

  /** Compute deltas between last semester and current courses. */
  const getDeltas = useCallback(
    (courses) => {
      if (!latestClosed) return [];
      return computeDeltas(latestClosed.snapshots, courses);
    },
    [latestClosed],
  );

  /** Average mastery for a given semester snapshot (all courses or one). */
  const snapshotAvg = useCallback(
    (semesterId, courseId = null) => {
      const snaps = state.snapshots[semesterId] || [];
      return avgMasteryFromSnapshot(snaps, courseId);
    },
    [state.snapshots],
  );

  const value = useMemo(
    () => ({
      semesters: state.semesters,
      snapshots: state.snapshots,
      gradeHistory: state.gradeHistory || [],
      academicProfile: state.academicProfile || null,
      continuingStudent: Boolean(state.continuingStudent),
      progressionStatus: state.progressionStatus || 'new',
      currentSemesterId: state.currentSemesterId,
      currentSemester,
      closedSemesters,
      latestClosed,
      startSemester,
      closeSemester,
      initializeBaseline,
      initializeAcademicProfile,
      relearnAcademicProfile,
      advanceAcademicPosition,
      recordSemesterOutcome,
      getDeltas,
      snapshotAvg,
      hasActiveSemester: Boolean(state.currentSemesterId),
    }),
    [state, currentSemester, closedSemesters, latestClosed, startSemester, closeSemester, initializeBaseline, initializeAcademicProfile, relearnAcademicProfile, advanceAcademicPosition, recordSemesterOutcome, getDeltas, snapshotAvg],
  );

  return <SemestersContext.Provider value={value}>{children}</SemestersContext.Provider>;
}

export function useSemesters() {
  const ctx = useContext(SemestersContext);
  if (!ctx) throw new Error('useSemesters must be inside SemestersProvider');
  return ctx;
}
