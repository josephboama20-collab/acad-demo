import { supabase, isCloudEnabled } from '../lib/supabase.js';
import { saveJSON, STORAGE_KEYS, getStorageUser, userStorageKey } from './storage.js';
import { createSyncOutbox } from './syncOutbox.js';
import { hydrateBuckets } from './cloudHydration.js';

/** Logical data buckets synced per user. */
export const DATA_BUCKETS = {
  scholar: STORAGE_KEYS.scholar,
  courses: STORAGE_KEYS.courses,
  flashcards: STORAGE_KEYS.flashcards,
  game: STORAGE_KEYS.game,
  habits: STORAGE_KEYS.habits,
  forge: STORAGE_KEYS.forgeWork,
  semesters: STORAGE_KEYS.semesters,
};

const debounceTimers = new Map();
const outbox = createSyncOutbox({
  storage: {
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value),
    removeItem: (key) => localStorage.removeItem(key),
  },
  getOwner: getStorageUser,
  write: upsertBucket,
  withLock: (name, run) => typeof navigator !== 'undefined' && navigator.locks
    ? navigator.locks.request(name, run) : run(),
});
let syncError = null;
const syncListeners = new Set();
export function subscribeSyncStatus(listener) {
  syncListeners.add(listener);
  return () => syncListeners.delete(listener);
}
export function getSyncStatus() { return syncError; }
function notifySync(error) {
  syncError = error ? 'Changes remain on this device. Cloud sync will retry when the connection returns.' : null;
  syncListeners.forEach((listener) => listener());
}
export async function flushCloudSaves(userId = getStorageUser()) {
  try {
    await outbox.flush(userId);
    notifySync(null);
  } catch (error) {
    notifySync(error);
    throw error;
  }
}

export function persistWithCloud(userId, bucket, value) {
  const storageKey = DATA_BUCKETS[bucket];
  if (!storageKey) return;
  if (isCloudEnabled() && (!userId || userId !== getStorageUser())) return;
  if (!saveJSON(storageKey, value)) {
    throw new Error('This device could not save your changes. Free storage space and try again.');
  }
  if (userId && isCloudEnabled()) {
    scheduleCloudSave(userId, bucket, value);
  }
}

export function scheduleCloudSave(userId, bucket, value) {
  outbox.enqueue(userId, bucket, value);
  const key = `${userId}:${bucket}`;
  if (debounceTimers.has(key)) clearTimeout(debounceTimers.get(key));
  debounceTimers.set(
    key,
    setTimeout(() => {
      debounceTimers.delete(key);
      flushCloudSaves(userId).catch(() => {});
    }, 700),
  );
}

export async function upsertBucket(userId, bucket, payload) {
  if (!supabase) return;
  const { error } = await supabase.from('user_data').upsert(
    {
      user_id: userId,
      bucket,
      payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,bucket' },
  );
  if (error) throw error;
}

export async function fetchAllBuckets(userId) {
  if (!supabase) return {};
  const { data, error } = await supabase.from('user_data').select('bucket, payload').eq('user_id', userId);
  if (error) throw error;
  const out = {};
  (data || []).forEach((row) => {
    out[row.bucket] = row.payload;
  });
  return out;
}

export async function hydrateLocalFromCloud(userId) {
  const buckets = await hydrateBuckets({
    owner: userId,
    getOwner: getStorageUser,
    bucketKeys: DATA_BUCKETS,
    readLocal: (key) => localStorage.getItem(userStorageKey(key)),
    writeLocal: saveJSON,
    getPending: outbox.pending,
    fetchBuckets: fetchAllBuckets,
  });
  await flushCloudSaves(userId).catch(() => {});
  return buckets;
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => flushCloudSaves().catch(() => {}));
  window.addEventListener('pagehide', () => flushCloudSaves().catch(() => {}));
  window.addEventListener('focus', () => flushCloudSaves().catch(() => {}));
}

export async function pushAllBucketsToCloud(userId, snapshot) {
  const entries = Object.entries(snapshot);
  await Promise.all(entries.map(([bucket, payload]) => upsertBucket(userId, bucket, payload)));
}

export async function deleteAllUserData(userId) {
  if (!supabase) return;
  const { error } = await supabase.from('user_data').delete().eq('user_id', userId);
  if (error) throw error;
}

export async function initializeEmptyUserData(userId) {
  const empty = {
    scholar: null,
    courses: [],
    flashcards: null,
    game: { xp: 0, achievements: [], challengeProgress: {} },
    habits: [],
    forge: {},
    semesters: { currentSemesterId: null, semesters: [], snapshots: {} },
  };
  await pushAllBucketsToCloud(userId, empty);
}
