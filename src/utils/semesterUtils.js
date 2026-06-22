/**
 * Semester progression utilities.
 *
 * A "semester" is a named study window with a start/end date.
 * When a semester is closed, mastery snapshots are captured per topic.
 * Deltas are computed by comparing current mastery to the most recent snapshot.
 */

/** Generate a semester id like "2026-S1" from a label. */
export function semesterIdFromLabel(label) {
  return label.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 24);
}

/** Build the full snapshot array from live courses. */
export function buildSnapshot(semesterId, courses) {
  return courses.flatMap((course) =>
    (course.topics || []).map((topic) => ({
      semesterId,
      courseId: course.courseId,
      courseCode: course.code,
      courseName: course.name,
      topicId: topic.topicId,
      topicName: topic.name,
      masteryLevel: topic.masteryLevel ?? 0,
      lastStudied: topic.lastStudied ?? null,
      capturedAt: new Date().toISOString(),
    })),
  );
}

/**
 * Given a list of snapshots from the previous semester and current courses,
 * return an array of delta objects sorted by biggest regression first.
 *
 * delta < 0  → regression
 * delta ≈ 0  → stagnation
 * delta > 0  → improvement
 */
export function computeDeltas(previousSnapshots, currentCourses) {
  if (!previousSnapshots || previousSnapshots.length === 0) return [];

  const snapshotMap = new Map();
  previousSnapshots.forEach((s) => {
    snapshotMap.set(`${s.courseId}:${s.topicId}`, s);
  });

  const deltas = [];
  currentCourses.forEach((course) => {
    (course.topics || []).forEach((topic) => {
      const key = `${course.courseId}:${topic.topicId}`;
      const prev = snapshotMap.get(key);
      if (!prev) return;
      deltas.push({
        courseId: course.courseId,
        courseCode: course.code,
        courseName: course.name,
        topicId: topic.topicId,
        topicName: topic.name,
        prevMastery: prev.masteryLevel,
        currMastery: topic.masteryLevel ?? 0,
        delta: (topic.masteryLevel ?? 0) - prev.masteryLevel,
        importance: topic.importance || 'medium',
      });
    });
  });

  // Most regressed first
  return deltas.sort((a, b) => a.delta - b.delta);
}

/**
 * Classify a delta into a trend label.
 */
export function trendLabel(delta) {
  if (delta >= 10) return { label: 'Trending up', cls: 'trend-up', sign: '+' };
  if (delta >= 3) return { label: 'Improving', cls: 'trend-up', sign: '+' };
  if (delta >= -3) return { label: 'Stable', cls: 'trend-flat', sign: '' };
  if (delta >= -10) return { label: 'Declining', cls: 'trend-down', sign: '' };
  return { label: 'Regressed', cls: 'trend-down', sign: '' };
}

/**
 * Average mastery for a snapshot array (all topics, or filtered to a courseId).
 */
export function avgMasteryFromSnapshot(snapshots, courseId = null) {
  const filtered = courseId ? snapshots.filter((s) => s.courseId === courseId) : snapshots;
  if (filtered.length === 0) return null;
  return Math.round(filtered.reduce((sum, s) => sum + s.masteryLevel, 0) / filtered.length);
}

/**
 * Get the most recent closed semester's snapshots given the semesters array
 * and snapshotMap.
 */
export function latestClosedSnapshot(semesters, snapshotMap) {
  const closed = [...(semesters || [])].filter((s) => s.endedAt).sort((a, b) => (b.endedAt > a.endedAt ? 1 : -1));
  if (closed.length === 0) return null;
  return { semester: closed[0], snapshots: snapshotMap[closed[0].id] || [] };
}

export const GRADE_POINTS = {
  A: 4.0,
  'B+': 3.5,
  B: 3.0,
  'C+': 2.5,
  C: 2.0,
  'D+': 1.5,
  D: 1.0,
  E: 0.5,
  F: 0,
};

export const GRADE_OPTIONS = Object.keys(GRADE_POINTS);

export function computeGpaFromGrades(courses, gradePoints = GRADE_POINTS) {
  const valid = (courses || []).filter((c) => gradePoints[c.grade] !== undefined);
  if (valid.length === 0) return null;
  const total = valid.reduce((sum, c) => sum + gradePoints[c.grade], 0);
  return Number((total / valid.length).toFixed(2));
}

export function compareSemesterGrades(previousCourses, nextCourses, gradePoints = GRADE_POINTS) {
  const prevGpa = computeGpaFromGrades(previousCourses, gradePoints);
  const nextGpa = computeGpaFromGrades(nextCourses, gradePoints);
  if (prevGpa === null || nextGpa === null) return { status: 'unknown', delta: 0, prevGpa, nextGpa };
  const delta = Number((nextGpa - prevGpa).toFixed(2));
  if (delta > 0.09) return { status: 'improved', delta, prevGpa, nextGpa };
  if (delta < -0.09) return { status: 'regressed', delta, prevGpa, nextGpa };
  return { status: 'stable', delta, prevGpa, nextGpa };
}
