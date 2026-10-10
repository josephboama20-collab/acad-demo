import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';
import { STORAGE_KEYS, loadJSON, saveJSON, activateStorageUser, clearStudyData } from '../src/utils/storage.js';
beforeEach(() => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  activateStorageUser(null);
});
test('two accounts cannot read each other’s locally saved study records', () => {
  activateStorageUser('A');saveJSON(STORAGE_KEYS.courses, ['A-private']);
  activateStorageUser('B');assert.equal(loadJSON(STORAGE_KEYS.courses), null);
  saveJSON(STORAGE_KEYS.courses, ['B-private']);
  activateStorageUser('A');assert.deepEqual(loadJSON(STORAGE_KEYS.courses), ['A-private']);
});
test('signed-out mode cannot read an account cache', () => {
  activateStorageUser('A');saveJSON(STORAGE_KEYS.scholar, { user: 'A' });
  activateStorageUser(null);assert.equal(loadJSON(STORAGE_KEYS.scholar), null);
});
test('a matching legacy identity migrates its data exactly once', () => {
  saveJSON(STORAGE_KEYS.scholar, { user: { email: 'a@example.test' } });
  saveJSON(STORAGE_KEYS.flashcards, [{ repetitions: 5 }]);
  activateStorageUser('A', 'A@example.test');
  assert.equal(loadJSON(STORAGE_KEYS.flashcards)[0].repetitions, 5);
  assert.equal(localStorage.getItem(STORAGE_KEYS.flashcards), null);
  saveJSON(STORAGE_KEYS.flashcards, [{ repetitions: 6 }]);
  activateStorageUser('A', 'a@example.test');
  assert.equal(loadJSON(STORAGE_KEYS.flashcards)[0].repetitions, 6);
});
test('a different identity cannot adopt the legacy cache', () => {
  saveJSON(STORAGE_KEYS.scholar, { user: { email: 'a@example.test' } });
  saveJSON(STORAGE_KEYS.courses, ['A-private']);
  activateStorageUser('B', 'b@example.test');
  assert.equal(loadJSON(STORAGE_KEYS.courses), null);
});
test('clearing one account leaves the other account intact', () => {
  activateStorageUser('B');saveJSON(STORAGE_KEYS.courses, ['B-private']);
  activateStorageUser('A');saveJSON(STORAGE_KEYS.courses, ['A-private']);
  localStorage.setItem('acad_pending_v1:A', '{}');clearStudyData();
  assert.equal(loadJSON(STORAGE_KEYS.courses), null);
  assert.equal(localStorage.getItem('acad_pending_v1:A'), null);
  activateStorageUser('B');assert.deepEqual(loadJSON(STORAGE_KEYS.courses), ['B-private']);
});
test('device quota errors are observable', () => {
  localStorage.setItem = () => { throw new Error('quota'); };
  assert.equal(saveJSON(STORAGE_KEYS.courses, []), false);
});
