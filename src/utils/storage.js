export const STORAGE_KEYS = {
  scholar: 'acad_scholar_v2',
  flashcards: 'acad_flashcards_v1',
  game: 'acad_game_v1',
  courses: 'acad_courses_v1',
  habits: 'acad_habits_v1',
  forgeWork: 'acad_forge_v1',
  semesters: 'acad_semesters_v1',
};

let activeUserId = null;
const storageListeners = new Set();
export function subscribeStorage(listener) {
  storageListeners.add(listener);
  return () => storageListeners.delete(listener);
}
function notifyStorage() { storageListeners.forEach((listener) => listener()); }
if (typeof window !== 'undefined') window.addEventListener('storage', notifyStorage);
const studyKeys = new Set([...Object.values(STORAGE_KEYS), 'acad_study_groups_v1']);
export const getStorageUser = () => activeUserId;
export function userStorageKey(key, userId = activeUserId) {
  return userId && studyKeys.has(key) ? `${key}:user:${userId}` : key;
}

export function activateStorageUser(userId, email) {
  // Migrate the old single-account cache only when its recorded email matches.
  // A different account always starts with its own namespace.
  if (userId && email) {
    const legacy = loadUnscoped(STORAGE_KEYS.scholar);
    if (legacy?.user?.email?.toLowerCase() === email.toLowerCase()) {
      for (const key of studyKeys) {
        const target = userStorageKey(key, userId);
        if (localStorage.getItem(target) === null) {
          const raw = localStorage.getItem(key);
          if (raw !== null) localStorage.setItem(target, raw);
        }
      }
      for (const key of studyKeys) localStorage.removeItem(key);
    }
  }
  activeUserId = userId ?? null;
  notifyStorage();
}

function loadUnscoped(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

export function clearStudyData(userId = activeUserId) {
  for (const key of studyKeys) localStorage.removeItem(userStorageKey(key, userId));
  if (userId) {
    localStorage.removeItem(`acad_pending_v1:${userId}`);
    for (const bucket of Object.keys(STORAGE_KEYS)) {
      localStorage.removeItem(`acad_pending_v1:${userId}:${bucket === 'forgeWork' ? 'forge' : bucket}`);
    }
  }
  notifyStorage();
}

export function loadJSON(key) {
  try {
    const raw = localStorage.getItem(userStorageKey(key));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(userStorageKey(key), JSON.stringify(value));
    notifyStorage();
    return true;
  } catch {
    return false;
  }
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
