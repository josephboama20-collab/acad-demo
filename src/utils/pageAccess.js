const PUBLIC_PAGES = new Set(['landing', 'auth', 'privacy', 'terms']);
const ACCOUNT_PAGES = new Set(['settings', 'manage-plan', 'semester-update', 'onboarding']);
export function resolvePageAccess({ user, profile, enabledTools, requestedPage }) {
  if (!user) return PUBLIC_PAGES.has(requestedPage) ? requestedPage : 'landing';
  if (requestedPage === 'privacy' || requestedPage === 'terms') return requestedPage;
  if (!profile) return 'onboarding';
  if (requestedPage === 'auth' || requestedPage === 'landing') return 'dashboard';
  if (ACCOUNT_PAGES.has(requestedPage)) return requestedPage;
  if (requestedPage === 'study-room') return enabledTools.includes('study-groups') ? requestedPage : 'dashboard';
  return enabledTools.includes(requestedPage) ? requestedPage : 'dashboard';
}
