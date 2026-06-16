import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ACHIEVEMENTS, CHALLENGES, LEADERBOARD } from '../data/constants.js';
import { loadJSON, saveJSON, STORAGE_KEYS } from '../utils/storage.js';

const DEFAULT_GAME = { xp: 340, achievements: [], challengeProgress: {} };

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, setState] = useState(() => {
    const saved = loadJSON(STORAGE_KEYS.game);
    return saved
      ? {
          xp: saved.xp ?? DEFAULT_GAME.xp,
          achievements: saved.achievements ?? [],
          challengeProgress: saved.challengeProgress ?? {},
        }
      : DEFAULT_GAME;
  });

  const persist = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      saveJSON(STORAGE_KEYS.game, {
        xp: next.xp,
        achievements: next.achievements,
        challengeProgress: next.challengeProgress,
      });
      return next;
    });
  }, []);

  const level = useMemo(() => Math.floor(state.xp / 1000) + 1, [state.xp]);
  const xpInLevel = useMemo(() => state.xp % 1000, [state.xp]);

  const challenges = useMemo(
    () =>
      CHALLENGES.map((ch) => {
        const prog = state.challengeProgress[ch.id];
        return { ...ch, progress: prog?.progress ?? 0, completed: prog?.completed ?? false };
      }),
    [state.challengeProgress],
  );

  const earnXP = useCallback(
    (amount) => {
      persist((s) => {
        const xp = s.xp + amount;
        return { ...s, xp };
      });
    },
    [persist],
  );

  const advanceChallenge = useCallback(
    (id, amount = 1) => {
      persist((s) => {
        const current = s.challengeProgress[id] || { progress: 0, completed: false };
        if (current.completed) return s;
        const target = CHALLENGES.find((c) => c.id === id)?.target ?? 999;
        const progress = Math.min(target, current.progress + amount);
        return {
          ...s,
          challengeProgress: {
            ...s.challengeProgress,
            [id]: { progress, completed: progress >= target },
          },
        };
      });
    },
    [persist],
  );

  const unlockAchievement = useCallback(
    (id) => {
      persist((s) => {
        if (s.achievements.includes(id)) return s;
        const ach = ACHIEVEMENTS.find((a) => a.id === id);
        return { ...s, achievements: [...s.achievements, id], xp: s.xp + (ach?.xp ?? 0) };
      });
    },
    [persist],
  );

  const leaderboard = useMemo(
    () =>
      LEADERBOARD.map((row) => (row.isUser ? { ...row, xp: state.xp, level } : row))
        .sort((a, b) => b.xp - a.xp)
        .map((row, i) => ({ ...row, rank: i + 1 })),
    [state.xp, level],
  );

  const value = useMemo(
    () => ({
      xp: state.xp,
      level,
      xpInLevel,
      challenges,
      achievements: state.achievements,
      allAchievements: ACHIEVEMENTS,
      leaderboard,
      earnXP,
      advanceChallenge,
      unlockAchievement,
    }),
    [state, level, xpInLevel, challenges, leaderboard, earnXP, advanceChallenge, unlockAchievement],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
