const KEY = 'acad_pre_account_v1';

export function getPreAccountPrefs() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setPreAccountPrefs(prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

export function clearPreAccountPrefs() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
