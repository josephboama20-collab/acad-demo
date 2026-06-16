# Supabase setup for Acad Phase 2

## 1. Create project

1. Go to [supabase.com](https://supabase.com) → New project.
2. Note **Project URL** and **anon public key**.

## 2. Run migration

In Supabase SQL Editor, paste and run:

`supabase/migrations/001_initial_schema.sql`

Or with CLI:

```bash
npx supabase link --project-ref YOUR_REF
npx supabase db push
```

## 3. Auth settings (alpha)

- Authentication → Providers → Email: enabled
- For faster alpha testing: disable **Confirm email** under Email auth settings
- Set site URL to your staging domain (e.g. `https://acad-staging.vercel.app`)

## 4. Edge functions

Install Supabase CLI, then:

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy buddy-chat --no-verify-jwt
supabase functions deploy delete-account --no-verify-jwt
```

Functions receive `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` automatically when deployed.

## 5. App environment

Copy to `.env` (local) and hosting dashboard (staging/production):

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_APP_ENV=staging
```

Do **not** set `VITE_ANTHROPIC_API_KEY` when cloud mode is on — AI runs through `buddy-chat`.

## 6. Seed demo users

```bash
SUPABASE_URL=https://xxxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJ... \
node scripts/seed-demo-users.mjs
```

Creates all plan demo accounts with password `demo`.

## 7. Verify

1. Sign up with a new email → onboarding → add course → refresh → data persists after sign-out/sign-in
2. AI Buddy sends a message (requires deployed `buddy-chat` + Anthropic secret)
3. Settings → Delete account removes user

## Local dev without Supabase

Omit `VITE_SUPABASE_*` vars. App runs in **local-only mode** (original demo behaviour).
