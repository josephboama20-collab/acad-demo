import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSyncOutbox } from '../src/utils/syncOutbox.js';

function memoryStorage() {
  const values = new Map();
  return { getItem: (k) => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), removeItem: (k) => values.delete(k) };
}

test('reload before debounce retains an edit until a cloud acknowledgement', async () => {
  const storage = memoryStorage();
  const writes = [];
  const config = { storage, getOwner: () => 'A', write: async (...args) => writes.push(args) };
  createSyncOutbox(config).enqueue('A', 'flashcards', [{ repetitions: 7 }]);
  const reloaded = createSyncOutbox(config);
  assert.equal(reloaded.pending('A').flashcards.payload[0].repetitions, 7);
  await reloaded.flush('A');
  assert.deepEqual(writes, [['A', 'flashcards', [{ repetitions: 7 }]]]);
  assert.deepEqual(reloaded.pending('A'), {});
});

test('network failure retains the write and recovery retries it', async () => {
  const storage = memoryStorage();
  let offline = true;
  const queue = createSyncOutbox({ storage, getOwner: () => 'A', write: async () => {
    if (offline) throw new Error('offline');
  } });
  queue.enqueue('A', 'courses', ['latest']);
  await assert.rejects(queue.flush('A'), /offline/);
  assert.deepEqual(queue.pending('A').courses.payload, ['latest']);
  offline = false;
  await queue.flush('A');
  assert.deepEqual(queue.pending('A'), {});
});

test('an edit during an in-flight save survives the older acknowledgement', async () => {
  const writes = [];
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const queue = createSyncOutbox({ storage: memoryStorage(), getOwner: () => 'A', write: async (_owner, _bucket, payload) => {
    writes.push(payload);
    if (writes.length === 1) await gate;
  } });
  queue.enqueue('A', 'flashcards', 'first');
  const saving = queue.flush('A');
  queue.enqueue('A', 'flashcards', 'second');
  release();
  await saving;
  assert.deepEqual(writes, ['first', 'second']);
  assert.deepEqual(queue.pending('A'), {});
});

test('account switching cannot flush or append another owner’s queue', async () => {
  let owner = 'A';
  const writes = [];
  const queue = createSyncOutbox({ storage: memoryStorage(), getOwner: () => owner, write: async (...args) => writes.push(args) });
  queue.enqueue('A', 'scholar', 'A-private');
  owner = 'B';
  await queue.flush('A');
  assert.deepEqual(writes, []);
  assert.throws(() => queue.enqueue('A', 'scholar', 'wrong'), /account changed/);
  queue.enqueue('B', 'scholar', 'B-private');
  await queue.flush('B');
  assert.deepEqual(writes, [['B', 'scholar', 'B-private']]);
  assert.equal(queue.pending('A').scholar.payload, 'A-private');
});

test('concurrent flush calls do not upload the same snapshot twice', async () => {
  let count = 0;
  const queue = createSyncOutbox({ storage: memoryStorage(), getOwner: () => 'A', write: async () => { count += 1; } });
  queue.enqueue('A', 'courses', []);
  await Promise.all([queue.flush('A'), queue.flush('A')]);
  assert.equal(count, 1);
});

test('storage failure is visible and cannot be mistaken for a durable save', () => {
  const queue = createSyncOutbox({ storage: { getItem: () => null, setItem: () => { throw new Error('quota'); } }, getOwner: () => 'A', write: async () => {} });
  assert.throws(() => queue.enqueue('A', 'courses', []), /quota/);
});

test('separate tabs retain independently edited buckets', async () => {
  const storage = memoryStorage();
  const config = { storage, getOwner: () => 'A', write: async () => {} };
  const a = createSyncOutbox(config);
  const b = createSyncOutbox(config);
  a.enqueue('A', 'courses', ['course-edit']);
  b.enqueue('A', 'flashcards', ['card-edit']);
  assert.deepEqual(Object.keys(a.pending('A')), ['courses', 'flashcards']);
  await b.flush('A');
  assert.deepEqual(a.pending('A'), {});
});

test('a shared browser lock serializes two tabs and preserves a newer edit', async () => {
  const storage = memoryStorage();
  let tail = Promise.resolve();
  const withLock = (_name, fn) => {
    const current = tail.then(fn);
    tail = current.catch(() => {});
    return current;
  };
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const writes = [];
  const config = { storage, getOwner: () => 'A', withLock, write: async (_owner, _bucket, payload) => {
    writes.push(payload);
    if (writes.length === 1) await gate;
  } };
  const a = createSyncOutbox(config);
  const b = createSyncOutbox(config);
  a.enqueue('A', 'flashcards', 'old');
  const first = a.flush('A');
  await Promise.resolve();
  b.enqueue('A', 'flashcards', 'new');
  const second = b.flush('A');
  release();
  await Promise.all([first, second]);
  assert.deepEqual(writes, ['old', 'new']);
  assert.deepEqual(a.pending('A'), {});
});

test('sign-out during an in-flight write stops subsequent writes for that account', async () => {
  let owner = 'A';
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const writes = [];
  const queue = createSyncOutbox({ storage: memoryStorage(), getOwner: () => owner, write: async (_owner, bucket) => {
    writes.push(bucket);
    await gate;
  } });
  queue.enqueue('A', 'courses', []);
  queue.enqueue('A', 'flashcards', []);
  const saving = queue.flush('A');
  owner = 'B';
  release();
  await saving;
  assert.deepEqual(writes, ['courses']);
  assert.ok(queue.pending('A').flashcards);
});
