import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolvePageAccess } from '../src/utils/pageAccess.js';
test('sign-out hides protected screens immediately even with stale page state', () => {
  for (const requestedPage of ['dashboard', 'courses', 'reports', 'study-room', 'settings', 'onboarding']) {
    assert.equal(resolvePageAccess({ user: null, profile: {}, enabledTools: [requestedPage], requestedPage }), 'landing');
  }
});
test('public policy pages remain reachable after sign-out', () => {
  assert.equal(resolvePageAccess({ user: null, requestedPage: 'privacy' }), 'privacy');
});
test('account setup must precede dashboard and tool access', () => {
  assert.equal(resolvePageAccess({ user: {}, profile: null, enabledTools: ['dashboard'], requestedPage: 'dashboard' }), 'onboarding');
});
test('a short plan cannot display a gated tool through stale page state', () => {
  assert.equal(resolvePageAccess({ user: {}, profile: {}, enabledTools: ['dashboard'], requestedPage: 'flashcards' }), 'dashboard');
});
test('enabled tools and account settings remain reachable', () => {
  assert.equal(resolvePageAccess({ user: {}, profile: {}, enabledTools: ['flashcards'], requestedPage: 'flashcards' }), 'flashcards');
  assert.equal(resolvePageAccess({ user: {}, profile: {}, enabledTools: [], requestedPage: 'settings' }), 'settings');
});
