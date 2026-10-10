import { useStoredState } from '../hooks/useStoredState.js';
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext.jsx';
import { syncFlashcardsFromLoggedCourses } from '../utils/flashcardsFromCourses.js';
import { applySM2, createCard, isDue } from '../utils/sm2.js';
import { persistWithCloud } from '../utils/cloudSync.js';
import { loadJSON, STORAGE_KEYS } from '../utils/storage.js';

const FlashcardsContext = createContext(null);

export function FlashcardsProvider({ children, onCardReviewed }) {
  const { userId, dataEpoch } = useAuth();
  const [cards, setCards] = useStoredState(STORAGE_KEYS.flashcards, () => loadJSON(STORAGE_KEYS.flashcards) ?? []);

  useEffect(() => {
    const semesters = loadJSON(STORAGE_KEYS.semesters);
    const gradeHistory = semesters?.gradeHistory ?? [];
    const existing = loadJSON(STORAGE_KEYS.flashcards) ?? [];
    const synced = syncFlashcardsFromLoggedCourses(gradeHistory, existing);
    const changed = synced.length !== existing.length
      || synced.some((c, i) => c.cardId !== existing[i]?.cardId);
    if (changed) {
      persistWithCloud(userId, 'flashcards', synced);
      setCards(synced);
      return;
    }
  }, [dataEpoch, userId, setCards]);

  const persist = useCallback(
    (updater) => {
      setCards((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        persistWithCloud(userId, 'flashcards', next);
        return next;
      });
    },
    [userId, setCards],
  );

  const addCard = useCallback(
    (front, back, subject) => persist((list) => [createCard(front, back, subject), ...list]),
    [persist],
  );

  const addCards = useCallback(
    (items, subject) => {
      const batch = items.map((c) => createCard(c.front, c.back, subject));
      persist((list) => [...batch, ...list]);
    },
    [persist],
  );

  const reviewCard = useCallback(
    (cardId, rating) => {
      const card = cards.find((item) => item.cardId === cardId);
      if (!card) return;
      const reviewed = applySM2(card, rating);
      persist((list) => list.map((item) => item.cardId === cardId ? reviewed : item));
      onCardReviewed?.(reviewed, rating);
    },
    [persist, onCardReviewed, cards],
  );

  const deleteCard = useCallback((cardId) => persist((list) => list.filter((c) => c.cardId !== cardId)), [persist]);

  const dueCards = useMemo(() => cards.filter(isDue), [cards]);
  const subjects = useMemo(() => [...new Set(cards.map((c) => c.subject))].sort(), [cards]);
  const masteryMap = useMemo(() => {
    const map = { learning: 0, reviewing: 0, mastered: 0, total: cards.length };
    cards.forEach((c) => {
      if (map[c.masteryLevel] !== undefined) map[c.masteryLevel] += 1;
    });
    return map;
  }, [cards]);

  const value = useMemo(
    () => ({ cards, dueCards, subjects, masteryMap, addCard, addCards, reviewCard, deleteCard }),
    [cards, dueCards, subjects, masteryMap, addCard, addCards, reviewCard, deleteCard],
  );

  return <FlashcardsContext.Provider value={value}>{children}</FlashcardsContext.Provider>;
}

export function useFlashcards() {
  const ctx = useContext(FlashcardsContext);
  if (!ctx) throw new Error('useFlashcards must be used inside FlashcardsProvider');
  return ctx;
}
