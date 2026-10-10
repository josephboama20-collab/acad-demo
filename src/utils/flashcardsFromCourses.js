import { createCard } from './sm2.js';

function templatesForCourse(course) {
  const name = course.name || course.code;
  const code = course.code || name;
  return [
    { front: `What is the core idea in ${name}?`, back: `[Summarise from your ${name} notes]` },
    { front: `Key term in ${code}`, back: `[Define from your notes]` },
    { front: `Important concept in ${name}`, back: `[Explain in your own words]` },
    { front: `Application of ${name}`, back: `[Give one real example from your course]` },
    { front: `How does ${name} connect to other material?`, back: `[Link to related topics you study]` },
  ];
}

/** Unique courses from all logged semester terms. */
export function collectLoggedCourses(gradeHistory) {
  const seen = new Map();
  for (const term of gradeHistory || []) {
    for (const course of term.courses || []) {
      if (!course?.code) continue;
      if (!seen.has(course.code)) seen.set(course.code, course);
    }
  }
  return [...seen.values()];
}

/** Strip legacy sample / placeholder decks. */
export function stripPlaceholderFlashcards(existing = []) {
  return existing.filter((c) => !(c.subject === 'General' && String(c.back || '').startsWith('[')));
}

/** Add flashcards for logged courses without duplicating existing front+subject pairs. */
export function syncFlashcardsFromLoggedCourses(gradeHistory, existing = []) {
  const cleaned = stripPlaceholderFlashcards(existing);
  const logged = collectLoggedCourses(gradeHistory);
  const existingKeys = new Set(cleaned.map((c) => `${c.subject}|${c.front}`));
  const additions = [];

  for (const course of logged) {
    const subject = course.code;
    for (const tpl of templatesForCourse(course)) {
      const key = `${subject}|${tpl.front}`;
      if (existingKeys.has(key)) continue;
      additions.push(createCard(tpl.front, tpl.back, subject));
      existingKeys.add(key);
    }
  }

  if (additions.length === 0) return cleaned;
  return [...additions, ...cleaned];
}
