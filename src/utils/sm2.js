export function applySM2(card, rating) {
  let { easeFactor = 2.5, interval = 1, repetitions = 0 } = card;

  if (rating < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    interval = repetitions === 0 ? 1 : repetitions === 1 ? 6 : Math.round(interval * easeFactor);
    repetitions += 1;
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02),
  );

  const next = new Date();
  next.setDate(next.getDate() + interval);

  const masteryLevel = repetitions <= 1 ? 'learning' : repetitions <= 4 ? 'reviewing' : 'mastered';

  return {
    ...card,
    easeFactor: Math.round(easeFactor * 1000) / 1000,
    interval,
    repetitions,
    nextReview: next.toISOString().split('T')[0],
    lastReviewed: new Date().toISOString().split('T')[0],
    masteryLevel,
  };
}

export function isDue(card) {
  if (!card.nextReview) return true;
  return card.nextReview <= new Date().toISOString().split('T')[0];
}

export function createCard(front, back, subject = 'General') {
  return {
    cardId: crypto.randomUUID(),
    front,
    back,
    subject,
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReview: new Date().toISOString().split('T')[0],
    lastReviewed: null,
    masteryLevel: 'learning',
    createdAt: new Date().toISOString(),
  };
}
