import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DEFAULT_SCHOLAR } from '../data/constants.js';
import { loadJSON, saveJSON, STORAGE_KEYS } from '../utils/storage.js';

function mergeScholar(data) {
  if (!data) return { ...DEFAULT_SCHOLAR };
  return {
    ...DEFAULT_SCHOLAR,
    ...data,
    streak: { ...DEFAULT_SCHOLAR.streak, ...data.streak },
    metrics: { ...DEFAULT_SCHOLAR.metrics, ...data.metrics },
    settings: { ...DEFAULT_SCHOLAR.settings, ...data.settings },
  };
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => mergeScholar(loadJSON(STORAGE_KEYS.scholar)));

  const persist = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      saveJSON(STORAGE_KEYS.scholar, next);
      return next;
    });
  }, []);

  const setUser = useCallback((user) => persist((s) => ({ ...s, user })), [persist]);

  const setProfile = useCallback((profile) => {
    persist((s) => ({ ...s, profile }));
  }, [persist]);

  const completeTask = useCallback(() => {
    const today = new Date().toDateString();
    persist((s) => {
      const already = s.streak.lastActiveDate === today;
      const history = [...s.streak.history];
      if (!already) {
        history.shift();
        history.push(true);
      }
      const current = already ? s.streak.current : s.streak.current + 1;
      return {
        ...s,
        metrics: {
          ...s.metrics,
          tasksCompleted: s.metrics.tasksCompleted + 1,
          completionRate: Math.min(1, s.metrics.completionRate + 0.02),
          engagementScore: Math.min(100, s.metrics.engagementScore + 3),
        },
        streak: {
          ...s.streak,
          current,
          best: Math.max(s.streak.best, current),
          lastActiveDate: today,
          history,
        },
      };
    });
  }, [persist]);

  const saveProject = useCallback((project) => {
    persist((s) => {
      const exists = s.projects.some((p) => p.title === project.title);
      const projects = exists
        ? s.projects.map((p) => {
            if (p.title !== project.title) return p;
            const merged = { ...p, ...project };
            if (!Array.isArray(project.milestones) && Array.isArray(p.milestones)) {
              merged.milestones = p.milestones;
            }
            return merged;
          })
        : [project, ...s.projects];
      return {
        ...s,
        projects,
        metrics: { ...s.metrics, activeProjects: projects.length },
      };
    });
  }, [persist]);

  const signOut = useCallback(() => {
    persist((s) => ({ ...s, user: null }));
  }, [persist]);

  const setFocusMode = useCallback((focusMode) => {
    persist((s) => ({ ...s, settings: { ...s.settings, focusMode } }));
  }, [persist]);

  const updateSettings = useCallback((patch) => {
    persist((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, [persist]);

  const updateUser = useCallback((patch) => {
    persist((s) => ({ ...s, user: s.user ? { ...s.user, ...patch } : s.user }));
  }, [persist]);

  const value = useMemo(
    () => ({
      ...state,
      setUser,
      setProfile,
      completeTask,
      saveProject,
      signOut,
      setFocusMode,
      updateSettings,
      updateUser,
    }),
    [state, setUser, setProfile, completeTask, saveProject, signOut, setFocusMode, updateSettings, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
