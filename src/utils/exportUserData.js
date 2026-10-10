import { loadJSON, STORAGE_KEYS } from './storage.js';

export function exportAllUserData() {
  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    data: {},
  };
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    payload.data[name] = loadJSON(key);
  });
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `acad-export-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
