import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { canAddCourse } from '../utils/planCapacity.js';
import { masteryPctColor } from '../utils/themeColors.js';
import { loadJSON, saveJSON, STORAGE_KEYS, uid } from '../utils/storage.js';

const CoursesContext = createContext(null);

export function CoursesProvider({ children }) {
  const { profile } = useAuth();
  const [courses, setCourses] = useState(() => loadJSON(STORAGE_KEYS.courses) ?? []);

  const persist = useCallback((updater) => {
    setCourses((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveJSON(STORAGE_KEYS.courses, next);
      return next;
    });
  }, []);

  const addCourse = useCallback(
    (input) => {
      if (!canAddCourse(profile, courses.length)) return null;
      const course = {
        courseId: uid(),
        ...input,
        topics: (input.topics || []).map((t) => ({
          topicId: uid(),
          name: t.name || t,
          importance: t.importance || 'medium',
          masteryLevel: t.masteryLevel || 0,
          lastStudied: null,
        })),
        assignments: (input.assignments || []).map((a) => ({
          assignmentId: uid(),
          ...a,
          status: a.status || 'pending',
        })),
        exams: (input.exams || []).map((e) => ({ examId: uid(), ...e })),
      };
      persist((list) => [...list, course]);
      return course;
    },
    [persist, profile, courses.length],
  );

  const updateCourse = useCallback(
    (courseId, patch) => persist((list) => list.map((c) => (c.courseId === courseId ? { ...c, ...patch } : c))),
    [persist],
  );

  const deleteCourse = useCallback((courseId) => persist((list) => list.filter((c) => c.courseId !== courseId)), [persist]);

  const updateTopicMastery = useCallback(
    (courseId, topicName, masteryLevel) => {
      persist((list) =>
        list.map((c) =>
          c.courseId === courseId
            ? {
                ...c,
                topics: c.topics.map((t) =>
                  t.name === topicName
                    ? {
                        ...t,
                        masteryLevel: Math.min(100, Math.max(0, masteryLevel)),
                        lastStudied: new Date().toISOString(),
                      }
                    : t,
                ),
              }
            : c,
        ),
      );
    },
    [persist],
  );

  const updateAssignmentStatus = useCallback(
    (courseId, assignmentId, status) => {
      persist((list) =>
        list.map((c) =>
          c.courseId === courseId
            ? {
                ...c,
                assignments: c.assignments.map((a) => (a.assignmentId === assignmentId ? { ...a, status } : a)),
              }
            : c,
        ),
      );
    },
    [persist],
  );

  const allTopics = useMemo(
    () => courses.flatMap((c) => c.topics.map((t) => ({ ...t, courseCode: c.code, courseId: c.courseId }))),
    [courses],
  );

  const weakTopics = useMemo(
    () => allTopics.filter((t) => t.masteryLevel < 60).sort((a, b) => a.masteryLevel - b.masteryLevel),
    [allTopics],
  );

  const radarData = useMemo(
    () =>
      courses.map((c) => ({
        courseId: c.courseId,
        courseName: c.code,
        categories: c.topics.map((t) => ({
          name: t.name,
          score: t.masteryLevel,
          color: masteryPctColor(t.masteryLevel),
        })),
      })),
    [courses],
  );

  const value = useMemo(
    () => ({
      courses,
      addCourse,
      updateCourse,
      deleteCourse,
      updateTopicMastery,
      updateAssignmentStatus,
      allTopics,
      weakTopics,
      radarData,
    }),
    [courses, addCourse, updateCourse, deleteCourse, updateTopicMastery, updateAssignmentStatus, allTopics, weakTopics, radarData],
  );

  return <CoursesContext.Provider value={value}>{children}</CoursesContext.Provider>;
}

export function useCourses() {
  const ctx = useContext(CoursesContext);
  if (!ctx) throw new Error('useCourses must be used inside CoursesProvider');
  return ctx;
}
