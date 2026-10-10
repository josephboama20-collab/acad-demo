/** Durable, owner-scoped writes. Only the current owner may flush their queue. */
export function createSyncOutbox({ storage, write, getOwner, keyPrefix = 'acad_pending_v1:', withLock = (_key, fn) => fn() }) {
  const running = new Map();
  const buckets = ['scholar', 'courses', 'flashcards', 'game', 'habits', 'forge', 'semesters'];
  const key = (owner, bucket) => `${keyPrefix}${owner}:${bucket}`;
  function read(owner) {
    const entries = {};
    for (const bucket of buckets) {
      const raw = storage.getItem(key(owner, bucket));
      if (!raw) continue;
      const value = JSON.parse(raw);
      if (!value || typeof value !== 'object' || typeof value.revision !== 'string') {
        throw new Error('The saved sync queue is invalid.');
      }
      entries[bucket] = value;
    }
    return entries;
  }
  function enqueue(owner, bucket, payload) {
    if (!owner || owner !== getOwner()) throw new Error('The account changed. Please try again.');
    if (!buckets.includes(bucket)) throw new Error('Unknown data bucket.');
    const entry = { payload, revision: globalThis.crypto.randomUUID() };
    storage.setItem(key(owner, bucket), JSON.stringify(entry));
  }
  async function flush(owner) {
    if (!owner || owner !== getOwner()) return;
    if (running.has(owner)) return running.get(owner);
    const operation = withLock(`acad-cloud-sync:${owner}`, async () => {
      // Read again after each acknowledgement: a newer edit must never be deleted.
      while (owner === getOwner()) {
        const entry = Object.entries(read(owner))[0];
        if (!entry) return;
        const [bucket, pending] = entry;
        await write(owner, bucket, pending.payload);
        const latest = read(owner);
        if (latest[bucket]?.revision === pending.revision) {
          storage.removeItem(key(owner, bucket));
        }
      }
    });
    running.set(owner, operation);
    try { await operation; } finally { running.delete(owner); }
  }
  return { enqueue, flush, pending: read };
}
