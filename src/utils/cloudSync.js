import { supabase, isCloudEnabled } from '../lib/supabase.js';
import { saveJSON, STORAGE_KEYS } from './storage.js';

/** Logical data buckets synced per user. */
export const DATA_BUCKETS = {
  scholar: STORAGE_KEYS.scholar,
  courses: STORAGE_KEYS.courses,
  flashcards: STORAGE_KEYS.flashcards,
  game: STORAGE_KEYS.game,
  habits: STORAGE_KEYS.habits,
  forge: STORAGE_KEYS.forgeWork,
};

const debounceTimers = new Map();

export function persistWithCloud(userId, bucket, value) {
  const storageKey = DATA_BUCKETS[bucket];
  if (!storageKey) return;
  saveJSON(storageKey, value);
  if (userId && isCloudEnabled()) {
    scheduleCloudSave(userId, bucket, value);
  }
}

export function scheduleCloudSave(userId, bucket, value) {
  const key = `${userId}:${bucket}`;
  if (debounceTimers.has(key)) clearTimeout(debounceTimers.get(key));
  debounceTimers.set(
    key,
    setTimeout(() => {
      debounceTimers.delete(key);
      upsertBucket(userId, bucket, value).catch(() => {
        /* network errors — local cache remains */
      });
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
  const buckets = await fetchAllBuckets(userId);
  Object.entries(DATA_BUCKETS).forEach(([bucket, storageKey]) => {
    if (buckets[bucket] !== undefined) {
      saveJSON(storageKey, buckets[bucket]);
    }
  });
  return buckets;
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
  };
  await pushAllBucketsToCloud(userId, empty);
}
