import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { DEFAULT_SCHOLAR } from '../data/constants.js';
import { isCloudEnabled, supabase } from '../lib/supabase.js';
import { deleteAllUserData, hydrateLocalFromCloud, persistWithCloud, flushCloudSaves, subscribeSyncStatus, getSyncStatus } from '../utils/cloudSync.js';
import { loadJSON, saveJSON, STORAGE_KEYS, activateStorageUser, clearStudyData, getStorageUser } from '../utils/storage.js';

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
  const sessionVersion = useRef(0);
  const syncStatus = useSyncExternalStore(subscribeSyncStatus, getSyncStatus, () => null);

  const userId = session?.user?.id ?? null;

  const reloadFromStorage = useCallback(() => {
    setState(mergeScholar(loadJSON(STORAGE_KEYS.scholar)));
    setDataEpoch((n) => n + 1);
  }, []);

  const bumpDataEpoch = useCallback(() => {
    setDataEpoch((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!isCloudEnabled() || !supabase) return undefined;

    let mounted = true;

    async function handleSession(nextSession) {
      if (!mounted) return;
      const version = ++sessionVersion.current;
      const nextUserId = nextSession?.user?.id ?? null;
      if (nextUserId !== getStorageUser()) setAuthReady(false);
      activateStorageUser(nextUserId, nextSession?.user?.email);
      setSession(nextSession);
      if (nextSession?.user) {
        try {
          await hydrateLocalFromCloud(nextSession.user.id);
        } catch {
          /* Only this account's namespaced cache is available offline. */
        }
        if (!mounted || version !== sessionVersion.current) return;
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
        setState(mergeScholar(null));
        setDataEpoch((n) => n + 1);
      }
      setAuthReady(true);
    }

    // Race against a timeout so a paused/unreachable Supabase project
    // does not block the entire app at "Loading your account…"
    const sessionPromise = supabase.auth.getSession().then(({ data }) => data.session);
    const timeoutMs = 8000;
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs));

    const initialVersion = sessionVersion.current;
    Promise.race([sessionPromise, timeoutPromise])
      .then((session) => {
        if (sessionVersion.current === initialVersion) handleSession(session);
      })
      .catch(() => {
        if (mounted) handleSession(null);
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // Run database work outside Supabase's synchronous auth callback lock.
      setTimeout(() => { if (mounted) handleSession(nextSession); }, 0);
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
      await flushCloudSaves(userId).catch(() => {});
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      activateStorageUser(null);
      setState(mergeScholar(null));
      setDataEpoch((n) => n + 1);
      return;
    }
    persist((s) => ({ ...s, user: null }));
  }, [persist, userId]);

  const signUp = useCallback(async ({ email, password, name }) => {
    if (!supabase) throw new Error('Cloud auth is not configured.');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    // If the project requires email confirmation, signUp returns a user but no session.
    // Do not continue into onboarding in that half-authenticated state.
    if (data.user && !data.session) {
      throw new Error(
        'Account created - check your email to confirm, then sign in. If you did not get a message, try signing in with the same credentials.',
      );
    }
    if (data.user) {
      activateStorageUser(data.user.id, email);
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

  const resetPassword = useCallback(async (email) => {
    if (!supabase) throw new Error('Cloud auth is not configured.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!supabase || !userId) throw new Error('Not signed in.');
    const { error } = await supabase.functions.invoke('delete-account');
    if (error) throw error;
    await deleteAllUserData(userId);
    clearStudyData(userId);
    activateStorageUser(null);
    setSession(null);
    setState(mergeScholar(null));
    setDataEpoch((n) => n + 1);
  }, [userId]);

  const deleteAllLocalData = useCallback(async () => {
    clearStudyData();
    activateStorageUser(null);
    setSession(null);
    setState(mergeScholar(null));
    setDataEpoch((n) => n + 1);
  }, []);

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
      resetPassword,
      deleteAccount,
      deleteAllLocalData,
      setFocusMode,
      updateSettings,
      updateUser,
      reloadFromStorage,
      bumpDataEpoch,
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
      resetPassword,
      deleteAccount,
      deleteAllLocalData,
      setFocusMode,
      updateSettings,
      updateUser,
      reloadFromStorage,
      bumpDataEpoch,
    ],
  );

  if (!authReady) {
    return (
      <div className="page" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <p className="fc-sub">Loading your account…</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {syncStatus && <div role="status" className="sync-status">{syncStatus}</div>}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
