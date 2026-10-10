# Tier 2 — Backend, real auth, secure AI

**Goal:** Closed alpha with per-user cloud data and API keys kept off the client.

Maps to Phase 2 in [`PRODUCTION_ROLLOUT.md`](./PRODUCTION_ROLLOUT.md).

## Checklist

### 2.1 Supabase project

- [ ] Create project at [supabase.com](https://supabase.com)
- [ ] Run `supabase/migrations/001_initial_schema.sql` in SQL Editor
- [ ] Auth → Email provider on; disable email confirm for alpha if desired
- [ ] Set site URL to your Netlify staging domain

### 2.2 App environment

Add to Netlify (and local `.env`):

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_APP_ENV=staging
```

Do **not** set `VITE_OPENAI_API_KEY` or other `VITE_*` AI keys on Netlify — use edge functions only.

Preloaded demo UI removed; testers create accounts via Sign up.

### 2.3 Edge functions (secure AI)

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase functions deploy buddy-chat
supabase functions deploy academic-profile
supabase functions deploy delete-account
```

Edge functions use OpenAI (`gpt-4.1-nano` for Buddy, `gpt-4.1-mini` for programme learning).

### 2.4 Seed demo users

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed:demo
```

### 2.5 Verify

- [ ] New signup → onboarding → add course → sign out/in → data persists
- [ ] AI Buddy responds via `buddy-chat` (no client API key)
- [ ] Settings → Delete account works
- [ ] Run [`STAGING_TEST_PLAN.md`](./STAGING_TEST_PLAN.md) on cloud mode

## Already in codebase

- `src/lib/supabase.js` — cloud detection
- `src/contexts/AuthContext.jsx` — Supabase auth + hydrate
- `src/utils/cloudSync.js` — per-bucket sync
- `supabase/migrations/001_initial_schema.sql` — profiles + `user_data` RLS
- Edge functions: `buddy-chat`, `academic-profile`, `delete-account`

## Exit criteria

- Staging runs in cloud mode with no `VITE_*` AI keys in the build
- 3+ testers complete staging checklist on Netlify URL without blockers
