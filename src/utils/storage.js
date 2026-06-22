export const STORAGE_KEYS = {
  scholar: 'acad_scholar_v2',
  flashcards: 'acad_flashcards_v1',
  game: 'acad_game_v1',
  courses: 'acad_courses_v1',
  habits: 'acad_habits_v1',
  forgeWork: 'acad_forge_v1',
  semesters: 'acad_semesters_v1',
};

export function loadJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
