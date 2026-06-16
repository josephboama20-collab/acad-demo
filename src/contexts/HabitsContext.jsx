import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Frown, Smile, Meh, Sun, TrendingUp, Target, Zap } from 'lucide-react';
import { useAuth } from './AuthContext.jsx';
import { correlationInsight, pearsonCorrelation } from '../utils/analytics.js';
import { persistWithCloud } from '../utils/cloudSync.js';
import { loadJSON, STORAGE_KEYS } from '../utils/storage.js';

const HabitsContext = createContext(null);

export function HabitsProvider({ children }) {
  const { userId, dataEpoch } = useAuth();
  const [logs, setLogs] = useState(() => loadJSON(STORAGE_KEYS.habits) ?? []);

  useEffect(() => {
    setLogs(loadJSON(STORAGE_KEYS.habits) ?? []);
  }, [dataEpoch]);

  const persist = useCallback(
    (updater) => {
      setLogs((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        persistWithCloud(userId, 'habits', next);
        return next;
      });
    },
    [userId],
  );

  const addLog = useCallback(
    (entry) => {
      const withMeta = {
        ...entry,
        loggedAt: entry.loggedAt || new Date().toISOString(),
      };
      persist((list) =>
        [...list.filter((l) => l.date !== entry.date), withMeta].sort((a, b) => a.date.localeCompare(b.date)),
      );
    },
    [persist],
  );

  const clearLogsBefore = useCallback(
    (cutoffDate) => {
      persist((list) => list.filter((l) => l.date >= cutoffDate));
    },
    [persist],
  );

  const clearAllLogs = useCallback(() => {
    persist([]);
  }, [persist]);

  const todayLog = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return logs.find((l) => l.date === today) ?? null;
  }, [logs]);

  const insights = useMemo(() => {
    if (logs.length < 14) return [];
    const slice = logs.slice(-30);
    const productivity = slice.map((l) => l.productivityScore);
    const items = [];

    const energy = pearsonCorrelation(slice.map((l) => l.energyLevel), productivity);
    const stress = pearsonCorrelation(slice.map((l) => l.stressLevel), productivity);
    const focus = pearsonCorrelation(slice.map((l) => l.focusRating), productivity);
    const hours = pearsonCorrelation(slice.map((l) => l.studyHours), productivity);

    const eText = correlationInsight(energy, 'Higher energy levels', 'productivity');
    const sText = correlationInsight(stress, 'Lower stress', 'productivity');
    const fText = correlationInsight(focus, 'Higher focus ratings', 'productivity');
    const hText = correlationInsight(hours, 'More study hours', 'productivity');

    if (eText) items.push({ icon: <Zap size={14} />, text: eText, r: energy.r });
    if (sText) items.push({ icon: <Frown size={14} />, text: sText, r: stress.r });
    if (fText) items.push({ icon: <Target size={14} />, text: fText, r: focus.r });
    if (hText) items.push({ icon: <TrendingUp size={14} />, text: hText, r: hours.r });

    const totalHours = slice.reduce((a, l) => a + l.studyHours, 0);
    if (slice.length >= 7) {
      items.push({
        icon: <TrendingUp size={14} />,
        text: `Lifetime total: ${totalHours.toFixed(1)}h logged across ${slice.length} check-ins. ${totalHours >= 40 ? 'Strong long-term consistency.' : totalHours >= 20 ? 'Solid foundation — keep building the habit.' : 'Every check-in helps Acad learn your patterns.'}`,
        r: 0.8,
      });
    }
    return items;
  }, [logs]);

  const value = useMemo(
    () => ({ logs, todayLog, insights, addLog, clearLogsBefore, clearAllLogs }),
    [logs, todayLog, insights, addLog, clearLogsBefore, clearAllLogs],
  );

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
}

export function useHabits() {
  const ctx = useContext(HabitsContext);
  if (!ctx) throw new Error('useHabits must be used inside HabitsProvider');
  return ctx;
}

export const MOOD_OPTIONS = [
  { key: 'sad', emoji: <Frown size={24} />, score: 1 },
  { key: 'neutral', emoji: <Meh size={24} />, score: 2 },
  { key: 'happy', emoji: <Smile size={24} />, score: 3 },
  { key: 'great', emoji: <Sun size={24} />, score: 4 },
];
