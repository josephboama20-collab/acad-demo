/** Apply a fetched snapshot only where the account and local cache are unchanged. */
export async function hydrateBuckets({ owner, getOwner, bucketKeys, readLocal, writeLocal, getPending, fetchBuckets }) {
  if (!owner || owner !== getOwner()) return {};
  const initialPending = getPending(owner);
  const before = new Map(Object.entries(bucketKeys).map(([bucket, key]) => [bucket, readLocal(key)]));
  const buckets = await fetchBuckets(owner);
  if (owner !== getOwner()) return {};
  const pending = getPending(owner);
  for (const [bucket, key] of Object.entries(bucketKeys)) {
    if (initialPending[bucket] || pending[bucket]) continue;
    // Includes edits in another tab even if its queue has already acknowledged.
    if (before.get(bucket) !== readLocal(key)) continue;
    if (buckets[bucket] !== undefined && !writeLocal(key, buckets[bucket])) {
      throw new Error('This device could not save downloaded changes. Free storage space and try again.');
    }
  }
  return buckets;
}
