import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSemesterCoursesFromProfile } from '../utils/academicProfileUtils.js';

/**
 * Shared state for editing a single semester's courses and grades.
 */
export function useSemesterEditor({ academicProfile, level, semester, historyEntry }) {
  const aiCourses = useMemo(
    () => (academicProfile ? getSemesterCoursesFromProfile(academicProfile, level, semester) : []),
    [academicProfile, level, semester],
  );

  const [grades, setGrades] = useState({});
  const [customCourses, setCustomCourses] = useState([]);
  const [courseEdits, setCourseEdits] = useState({});
  const [removedCodes, setRemovedCodes] = useState(new Set());

  useEffect(() => {
    if (historyEntry) return;
    setGrades({});
    setCustomCourses([]);
    setCourseEdits({});
    setRemovedCodes(new Set());
  }, [level, semester, historyEntry]);

  useEffect(() => {
    if (!historyEntry) return;
    const g = {};
    const customs = [];
    const aiCodes = new Set(aiCourses.map((c) => c.code));

    historyEntry.courses.forEach((c) => {
      g[c.code] = c.grade;
      if (!aiCodes.has(c.code)) {
        customs.push({ code: c.code, name: c.name, credits: c.credits ?? 3, type: 'custom' });
      }
    });

    setGrades(g);
    setCustomCourses(customs);
    setCourseEdits({});
    setRemovedCodes(new Set());
  }, [historyEntry, level, semester, aiCourses]);

  const getVisibleAiCourses = useCallback(() => {
    const removed = removedCodes;
    return aiCourses.filter((c) => !removed.has(c.code)).map((c) => courseEdits[c.code] || c);
  }, [aiCourses, removedCodes, courseEdits]);

  const buildValidCourses = useCallback(() => {
    const all = [...getVisibleAiCourses(), ...customCourses];
    return all
      .filter((c) => grades[c.code])
      .map((c) => ({
        code: c.code,
        name: c.name,
        grade: grades[c.code],
        credits: c.credits ?? 3,
      }));
  }, [getVisibleAiCourses, customCourses, grades]);

  const handleCourseEdit = useCallback((originalCode, updated) => {
    const isCustom = customCourses.some((c) => c.code === originalCode);
    if (isCustom) {
      setCustomCourses((prev) => prev.map((c) => (c.code === originalCode ? updated : c)));
    } else {
      setCourseEdits((prev) => ({ ...prev, [originalCode]: updated }));
    }
    if (updated.code !== originalCode && grades[originalCode]) {
      setGrades((prev) => {
        const next = { ...prev };
        next[updated.code] = next[originalCode];
        delete next[originalCode];
        return next;
      });
    }
  }, [customCourses, grades]);

  return {
    grades,
    setGrades,
    customCourses,
    courseEdits,
    removedCodes,
    aiCourses,
    getVisibleAiCourses,
    buildValidCourses,
    setGrade: (code, letter) => setGrades((g) => ({ ...g, [code]: letter })),
    skipGrade: (code) => setGrades((g) => {
      const next = { ...g };
      delete next[code];
      return next;
    }),
    addCustom: (course) => {
      const existing = [...getVisibleAiCourses(), ...customCourses].map((c) => c.code);
      if (existing.includes(course.code)) return;
      setCustomCourses((prev) => [...prev, course]);
    },
    removeCustom: (code) => {
      setCustomCourses((prev) => prev.filter((c) => c.code !== code));
      setGrades((g) => {
        const next = { ...g };
        delete next[code];
        return next;
      });
    },
    handleCourseEdit,
    removeAiCourse: (code) => {
      setRemovedCodes((prev) => new Set([...prev, code]));
      setGrades((g) => {
        const next = { ...g };
        delete next[code];
        return next;
      });
    },
  };
}

export function applyCoursesToCurriculum(curriculum, level, semester, courses) {
  const levelKey = String(level);
  const semKey = String(semester);
  const mapped = (courses || []).map((c) => ({
    code: c.code,
    name: c.name,
    credits: c.credits ?? 3,
    type: c.type || 'core',
  }));
  return {
    ...curriculum,
    [levelKey]: {
      ...(curriculum?.[levelKey] || {}),
      [semKey]: mapped,
    },
  };
}
