import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SCHOLAR } from '../data/constants.js';
import { isCloudEnabled, supabase } from '../lib/supabase.js';
import { deleteAllUserData, hydrateLocalFromCloud, persistWithCloud } from '../utils/cloudSync.js';
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
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!isCloudEnabled());
  const [dataEpoch, setDataEpoch] = useState(0);

  const userId = session?.user?.id ?? null;

  const reloadFromStorage = useCallback(() => {
    setState(mergeScholar(loadJSON(STORAGE_KEYS.scholar)));
    setDataEpoch((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!isCloudEnabled() || !supabase) return undefined;

    let mounted = true;

    async function handleSession(nextSession) {
      if (!mounted) return;
      setSession(nextSession);
      if (nextSession?.user) {
        try {
          await hydrateLocalFromCloud(nextSession.user.id);
        } catch {
          /* use local cache if cloud fetch fails */
        }
        const scholar = loadJSON(STORAGE_KEYS.scholar);
        const merged = mergeScholar({
          ...scholar,
          user: scholar?.user ?? {
            name: nextSession.user.user_metadata?.name || nextSession.user.email?.split('@')[0],
            email: nextSession.user.email,
          },
        });
        saveJSON(STORAGE_KEYS.scholar, merged);
        setState(merged);
        setDataEpoch((n) => n + 1);
      } else if (isCloudEnabled()) {
        setState((prev) => mergeScholar({ ...prev, user: null }));
        setDataEpoch((n) => n + 1);
      }
      setAuthReady(true);
    }

    supabase.auth.getSession().then(({ data }) => handleSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      handleSession(nextSession);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [reloadFromStorage]);

  const persist = useCallback(
    (updater) => {
      setState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
        persistWithCloud(userId, 'scholar', next);
        return next;
      });
    },
    [userId],
  );

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

  const signOut = useCallback(async () => {
    if (isCloudEnabled() && supabase) {
      await supabase.auth.signOut();
      setSession(null);
    }
    persist((s) => ({ ...s, user: null }));
  }, [persist]);

  const signUp = useCallback(async ({ email, password, name }) => {
    if (!supabase) throw new Error('Cloud auth is not configured.');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    if (data.user) {
      const scholar = mergeScholar({
        user: { name, email },
      });
      saveJSON(STORAGE_KEYS.scholar, scholar);
      persistWithCloud(data.user.id, 'scholar', scholar);
    }
    return data;
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    if (!supabase) throw new Error('Cloud auth is not configured.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!supabase || !userId) throw new Error('Not signed in.');
    const { error } = await supabase.functions.invoke('delete-account');
    if (error) throw error;
    await deleteAllUserData(userId);
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    setSession(null);
    setState(mergeScholar(null));
    setDataEpoch((n) => n + 1);
  }, [userId]);

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
      session,
      userId,
      authReady,
      dataEpoch,
      isCloudMode: isCloudEnabled(),
      setUser,
      setProfile,
      completeTask,
      saveProject,
      signOut,
      signUp,
      signIn,
      deleteAccount,
      setFocusMode,
      updateSettings,
      updateUser,
      reloadFromStorage,
    }),
    [
      state,
      session,
      userId,
      authReady,
      dataEpoch,
      setUser,
      setProfile,
      completeTask,
      saveProject,
      signOut,
      signUp,
      signIn,
      deleteAccount,
      setFocusMode,
      updateSettings,
      updateUser,
      reloadFromStorage,
    ],
  );

  if (!authReady) {
    return (
      <div className="page" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <p className="fc-sub">Loading your account…</p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
