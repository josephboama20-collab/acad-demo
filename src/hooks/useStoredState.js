import { useCallback, useSyncExternalStore } from 'react';
import { loadJSON, saveJSON, subscribeStorage, userStorageKey } from '../utils/storage.js';

const snapshots = new Map();
/** Read the local cache as an external store, including cross-tab updates. */
export function useStoredState(key, initial) {
  const getSnapshot = useCallback(() => {
    const physicalKey = userStorageKey(key);
    const raw = localStorage.getItem(physicalKey);
    const cached = snapshots.get(physicalKey);
    if (cached && cached.raw === raw) return cached.value;
    const value = typeof initial === 'function' ? initial() : loadJSON(key) ?? initial;
    snapshots.set(physicalKey, { raw, value });
    return value;
  }, [key, initial]);
  const value = useSyncExternalStore(subscribeStorage, getSnapshot, getSnapshot);
  const setValue = useCallback((updater) => {
    const next = typeof updater === 'function' ? updater(getSnapshot()) : updater;
    if (!saveJSON(key, next)) throw new Error('This device could not save your changes.');
  }, [getSnapshot, key]);
  return [value, setValue];
}
