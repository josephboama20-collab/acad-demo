import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hydrateBuckets } from '../src/utils/cloudHydration.js';

function fixture(fetchBuckets) {
  const local = new Map([['courses', 'old']]);
  const state = { owner: 'A', pending: {} };
  const config = { owner: 'A', getOwner: () => state.owner, bucketKeys: { courses: 'courses', flashcards: 'cards' },
    readLocal: (key) => local.get(key) ?? null,
    writeLocal: (key, value) => { local.set(key, JSON.stringify(value)); return true; },
    getPending: () => ({ ...state.pending }), fetchBuckets };
  return { local, state, config };
}
test('unchanged buckets accept a fetched snapshot', async () => {
  const f = fixture(async () => ({ courses: ['cloud'] }));
  await hydrateBuckets(f.config);
  assert.equal(f.local.get('courses'), '["cloud"]');
});
test('an acknowledged edit in another tab survives a delayed cloud response', async () => {
  let release;
  const f = fixture(() => new Promise(resolve => { release = resolve; }));
  const loading = hydrateBuckets(f.config);
  f.local.set('courses', 'newer-tab-edit');
  // The other tab already removed its pending entry after successful upload.
  release({ courses: ['stale-cloud'] });
  await loading;
  assert.equal(f.local.get('courses'), 'newer-tab-edit');
});
test('pending data at fetch start remains protected after acknowledgement', async () => {
  const f = fixture(async () => { f.state.pending = {}; return { courses: ['stale'] }; });
  f.state.pending = { courses: { revision: 'pending' } };
  await hydrateBuckets(f.config);
  assert.equal(f.local.get('courses'), 'old');
});
test('a newly queued edit is protected while untouched buckets hydrate', async () => {
  const f = fixture(async () => { f.state.pending = { courses: {} }; return { courses: ['stale'], flashcards: ['safe'] }; });
  await hydrateBuckets(f.config);
  assert.equal(f.local.get('courses'), 'old');
  assert.equal(f.local.get('cards'), '["safe"]');
});
test('account change discards the entire fetched snapshot', async () => {
  const f = fixture(async () => { f.state.owner = 'B'; return { courses: ['A-private'] }; });
  assert.deepEqual(await hydrateBuckets(f.config), {});
  assert.equal(f.local.get('courses'), 'old');
});
test('signed-out or stale callers cannot fetch another account', async () => {
  const f = fixture(async () => { throw new Error('must not fetch'); });
  f.state.owner = null;
  assert.deepEqual(await hydrateBuckets(f.config), {});
});
test('quota failure cannot be reported as successful hydration', async () => {
  const f = fixture(async () => ({ courses: ['cloud'] }));
  f.config.writeLocal = () => false;
  await assert.rejects(hydrateBuckets(f.config), /could not save downloaded/);
});
test('fetch failures preserve the local cache', async () => {
  const f = fixture(async () => { throw new Error('offline'); });
  await assert.rejects(hydrateBuckets(f.config), /offline/);
  assert.equal(f.local.get('courses'), 'old');
});
