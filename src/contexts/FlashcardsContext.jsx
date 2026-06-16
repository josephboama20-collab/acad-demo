import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { SAMPLE_FLASHCARDS } from '../data/constants.js';
import { applySM2, createCard, isDue } from '../utils/sm2.js';
import { loadJSON, saveJSON, STORAGE_KEYS } from '../utils/storage.js';

const FlashcardsContext = createContext(null);

export function FlashcardsProvider({ children, onCardReviewed }) {
  const [cards, setCards] = useState(() => loadJSON(STORAGE_KEYS.flashcards) ?? SAMPLE_FLASHCARDS);

  const persist = useCallback((updater) => {
    setCards((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveJSON(STORAGE_KEYS.flashcards, next);
      return next;
    });
  }, []);

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
    (cardId, rating, onReviewed) => {
      let reviewed = null;
      persist((list) =>
        list.map((card) => {
          if (card.cardId !== cardId) return card;
          reviewed = applySM2(card, rating);
          return reviewed;
        }),
      );
      if (reviewed) onCardReviewed?.(reviewed, rating);
    },
    [persist, onCardReviewed],
  );

  const deleteCard = useCallback((cardId) => persist((list) => list.filter((c) => c.cardId !== cardId)), [persist]);

  const dueCards = useMemo(() => cards.filter(isDue), [cards]);
  const subjects = useMemo(() => [...new Set(cards.map((c) => c.subject))].sort(), [cards]);
  const masteryMap = useMemo(() => {
    const map = { learning: 0, reviewing: 0, mastered: 0 };
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
