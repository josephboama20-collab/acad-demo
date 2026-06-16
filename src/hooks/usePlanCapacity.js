import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCourses } from '../contexts/CoursesContext.jsx';
import {
  canAddCourse,
  getEnabledTools,
  getPlanSummary,
  isToolEnabled,
} from '../utils/planCapacity.js';

export function usePlanCapacity() {
  const { profile } = useAuth();
  const { courses } = useCourses();
  const courseCount = courses.length;

  const plan = useMemo(() => getPlanSummary(profile, courseCount), [profile, courseCount]);
  const enabledTools = useMemo(() => getEnabledTools(profile, courseCount), [profile, courseCount]);

  return {
    plan,
    enabledTools,
    canAddCourse: canAddCourse(profile, courseCount),
    isToolEnabled: (toolKey) => isToolEnabled(profile, courseCount, toolKey),
  };
}
