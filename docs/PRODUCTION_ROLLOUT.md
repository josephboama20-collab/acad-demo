# Acad — Production Rollout Procedure

> Step-by-step path from the current local-first demo to staging tests, closed alpha, beta, and production.

**Current state:** React 19 + Vite SPA, `localStorage` persistence, cosmetic auth, optional client-side Anthropic API.

**Recommended backend for Phases 2–4:** Supabase (Auth + Postgres + RLS) **or** Firebase (already referenced in `.env.example`). Pick one before Phase 2; steps below assume Supabase terminology but map 1:1 to Firebase.

---

## Phase 0 — Baseline (Day 0)

**Goal:** Freeze what “done” means and protect the current demo.

### Steps

- [ ] **0.1** Tag current commit as `v0-demo` (local-first baseline).
- [ ] **0.2** Run `npm run lint`, `npm run test:plan`, `npm run build` — all must pass.
- [ ] **0.3** Record four demo accounts and passwords in internal docs only (never commit secrets).
- [ ] **0.4** Decide rollout audience:
  - **Staging only** → Phase 1, stop before Phase 2.
  - **Real users** → commit to Phase 2+ and backend choice.

### Acceptance

- Clean build on CI.
- Team agrees demo accounts are the canonical staging entry.

---

## Phase 1 — Staging deploy & controlled tests (Week 1–2)

**Goal:** Private URL for structured use-case tests. **No real user onboarding claims.**

### 1.1 Repository hygiene

- [ ] Add CI workflow (`.github/workflows/ci.yml`): `lint` → `test:plan` → `build`.
- [ ] Replace boilerplate `README.md` with Acad quick-start.
- [ ] Add `docs/STAGING_TEST_PLAN.md` and run through it once.

### 1.2 Hosting (static SPA)

Choose one host:

| Host | Steps |
|------|--------|
| **Vercel** | Import repo → Framework: Vite → Build: `npm run build` → Output: `dist` |
| **Netlify** | Build command `npm run build`, publish `dist` |
| **Cloudflare Pages** | Same as Netlify |

- [ ] Create **staging** project (e.g. `acad-staging.yourdomain.com`).
- [ ] Enable **password protection** or IP allowlist on staging.
- [ ] Set env var `VITE_ANTHROPIC_API_KEY` in host dashboard (staging only).
- [ ] Add `robots.txt` disallow or `noindex` meta for staging.

### 1.3 Staging environment file

```bash
cp .env.example .env
# Staging only — key will be visible in built JS until Phase 2 proxy
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

- [ ] Document in README: **AI key is exposed in browser until Phase 2.1**.

### 1.4 UI honesty pass (staging)

Label or gate features that are not real yet:

| Feature | Current | Staging action |
|---------|---------|----------------|
| Flashcard AI generation | Mock (`ai.js`) | Badge: “Preview — sample cards” |
| Study rooms “friends” | Bots (`StudyRoom.jsx`) | Copy: “Solo mode — multiplayer coming” |
| Study groups invites | Local only | Copy: “Device-local demo” |
| Signup password | Not validated | Banner on auth: “Staging: data stays on this device” |

- [ ] Add staging banner component (env: `VITE_APP_ENV=staging`).
- [ ] Run `docs/STAGING_TEST_PLAN.md` on all four plan demos.

### 1.5 Phase 1 exit criteria

- [ ] Staging URL live, password-protected.
- [ ] CI green on every push to `main`.
- [ ] 3+ testers complete staging checklist without blockers.
- [ ] Known limitations documented and visible in UI.

**Readiness after Phase 1:** ~85% for staged tests, still ~20% for production users.

---

## Phase 2 — Backend, real auth, secure AI (Weeks 3–8)

**Goal:** Real accounts, per-user data, server-side AI. **Closed alpha (~20–50 users).**

### 2.1 Choose and provision backend

**Supabase (recommended)**

- [ ] Create project: Auth (email/password), Postgres, Row Level Security.
- [ ] Tables (minimum):

```sql
-- profiles (extends auth.users)
profiles (id uuid PK → auth.users, name, email, plan_duration, started_at, settings jsonb)

-- scholar state (or normalize further in Phase 3)
user_scholar (user_id, streak jsonb, metrics jsonb, projects jsonb, updated_at)

user_courses (user_id, courses jsonb, updated_at)
user_flashcards (user_id, cards jsonb, updated_at)
user_habits (user_id, logs jsonb, updated_at)
user_forge (user_id, workspaces jsonb, updated_at)
```

- [ ] RLS: `user_id = auth.uid()` on all rows.
- [ ] Enable email confirmation + password reset in Auth settings.

**Firebase alternative:** Auth + Firestore collections with same logical schema.

### 2.2 API layer for AI

- [ ] Create `api/` or `supabase/functions/chat` edge function:
  - Accepts: `{ messages, subject, method }`
  - Validates JWT / session
  - Calls Anthropic server-side
  - Rate limit: e.g. 30 requests/user/hour
- [ ] Remove `anthropic-dangerous-direct-browser-access` from client.
- [ ] Client calls `/api/buddy/chat` only; remove `VITE_ANTHROPIC_API_KEY` from frontend env.

**Files to change:**

- `src/utils/ai.js` — point `callAnthropic` to your API route
- New: `api/buddy/chat.ts` (Vercel serverless) or Supabase Edge Function

### 2.3 Replace cosmetic auth

**Files:**

- `src/pages/Auth.jsx` — call `supabase.auth.signUp` / `signInWithPassword`
- `src/contexts/AuthContext.jsx` — hydrate from session + load scholar from DB
- `src/data/demoAccount.js` — keep for staging seeds OR server-side seed script

Steps:

- [ ] **2.3.1** On signup: create `profiles` row + empty scholar/courses rows.
- [ ] **2.3.2** On login: fetch all user blobs; merge into existing context shape (minimize UI rewrites).
- [ ] **2.3.3** On logout: `supabase.auth.signOut()`; clear local cache.
- [ ] **2.3.4** Session listener: refresh state on token refresh.

### 2.4 Persistence migration (localStorage → cloud)

- [ ] Create `src/utils/sync.js`:
  - `loadUserData(userId)` — fetch from API
  - `saveScholarDebounced(state)` — write on change (debounce 500ms)
- [ ] Update each context provider to call sync layer when `user.id` exists.
- [ ] One-time migration: if `localStorage` has data and user just signed up, offer “Import this device’s progress”.

**Contexts to wire:** `AuthContext`, `CoursesContext`, `FlashcardsContext`, `HabitsContext`, `GameContext`, forge via `forgeStorage.js`.

### 2.5 Flashcard generation — real or honest

Pick one:

- [ ] **Option A:** Implement real generation in edge function (Claude + structured JSON output).
- [ ] **Option B:** Remove “AI generate” button until ready; keep manual add only.

### 2.6 Legal minimum (alpha)

- [ ] Privacy policy page (what you collect: email, study logs, wellness).
- [ ] Terms of use (educational tool, not medical advice for wellness).
- [ ] Consent checkbox on signup linking to both.
- [ ] Account Settings: “Delete my account” → cascade delete user rows.

### 2.7 Phase 2 exit criteria

- [ ] New user can sign up on phone A, sign in on phone B, see same courses.
- [ ] AI Buddy works without client API key.
- [ ] Rate limit returns friendly error.
- [ ] Alpha cohort onboarded with written privacy notice.

**Readiness after Phase 2:** ~55% production (functional alpha, not hardened).

---

## Phase 3 — Beta hardening (Weeks 9–12)

**Goal:** Reliability, tests, observability. **100–500 users.**

### 3.1 Automated testing

- [ ] Add Vitest + React Testing Library for utilities (`planCapacity`, `sm2`, `projects`).
- [ ] Add Playwright E2E:
  - Demo seed → dashboard
  - Signup → onboarding → add course
  - Plan tier unlock (2mo → projects visible)
  - Flashcard study session (flip + rate)
- [ ] CI: run unit tests on every PR; E2E on `main` nightly.

### 3.2 Collaborative features — build or hide

| Feature | Recommendation |
|---------|----------------|
| Study groups | Defer OR Firebase Realtime / Supabase Realtime channels |
| Study rooms | WebRTC (Livekit/Daily) OR keep solo + hide “invite friends” |
| DMs | Defer until groups ship |

- [ ] If deferring: remove nav items and show “Coming soon” in beta.
- [ ] If building: separate spec; do not block beta on this.

### 3.3 Observability

- [ ] Sentry (or similar) in `src/main.jsx` error boundary.
- [ ] Product analytics (PostHog / Plausible): page views, task complete, flashcard session.
- [ ] Log AI proxy errors server-side with request id (no PII in logs).

### 3.4 Data operations

- [ ] Export: JSON dump of user data (GDPR portability).
- [ ] Delete: account deletion tested end-to-end.
- [ ] Backups: daily Postgres snapshots (Supabase Pro or manual).

### 3.5 Performance & UX

- [ ] Lighthouse pass: LCP < 2.5s on 4G.
- [ ] Error boundary + offline toast when sync fails.
- [ ] Replace silent `saveJSON` catch with user-visible “Storage full” (still relevant for offline cache).

### 3.6 Phase 3 exit criteria

- [ ] E2E suite green.
- [ ] < 1% error rate in Sentry over 7 days.
- [ ] Beta feedback loop (form or Discord) documented.
- [ ] No P0 bugs open > 7 days.

**Readiness after Phase 3:** ~80% production.

---

## Phase 4 — Production launch (Weeks 13–16+)

**Goal:** Public onboarding with confidence.

### 4.1 Security review

- [ ] Pen-test or self-audit checklist:
  - XSS: sanitize `marked` output in `AIBuddy.jsx` (DOMPurify)
  - CSP headers on host
  - RLS policies verified (attempt cross-user read)
  - API rate limits + abuse alerts
  - Secrets only on server
- [ ] Remove demo password `demo` from production build OR restrict to `VITE_APP_ENV=staging`.

### 4.2 Production infrastructure

- [ ] Production domain (`app.acad.app` or similar).
- [ ] Separate Supabase/Firebase project from staging.
- [ ] Production env vars in host (no staging keys).
- [ ] Status page or health check endpoint.
- [ ] Incident runbook: AI outage, DB outage, auth provider down.

### 4.3 Launch checklist

- [ ] Privacy policy + terms live at stable URLs.
- [ ] Support email monitored.
- [ ] Onboarding email sequence (welcome + day-3 tip) if using email provider.
- [ ] Monitoring dashboards + paging for API spend spikes.
- [ ] Rollback plan: previous static build + DB migration reversibility.

### 4.4 Post-launch (first 30 days)

- [ ] Weekly review: signups, D7 retention, task completion rate.
- [ ] Cost review: Anthropic spend per active user.
- [ ] Prioritize top 3 user-reported friction points.

### 4.5 Phase 4 exit criteria

- [ ] Public signup open.
- [ ] Security checklist signed off.
- [ ] On-call / support process defined.
- [ ] Production readiness: **~95%** (ongoing iteration remains).

---

## Decision log (fill as you go)

| Decision | Choice | Date | Owner |
|----------|--------|------|-------|
| Backend | Supabase / Firebase / Custom | | |
| AI proxy host | Vercel functions / Supabase Edge / Cloudflare Workers | | |
| Staging URL | | | |
| Production URL | | | |
| Collaborative features in v1 | Ship / Hide / Defer | | |

---

## File map — what changes per phase

| Phase | Primary files |
|-------|----------------|
| 1 | `.github/workflows/ci.yml`, `README.md`, `docs/STAGING_TEST_PLAN.md`, staging banner in `App.jsx` |
| 2 | `Auth.jsx`, `AuthContext.jsx`, all `contexts/*`, `utils/ai.js`, `utils/storage.js`, new `api/` or edge functions |
| 3 | `tests/`, `playwright.config.ts`, `src/main.jsx` (Sentry), `AccountSettings.jsx` (export/delete) |
| 4 | `AIBuddy.jsx` (sanitize), host config, legal pages, remove staging-only UI |

---

## Quick reference — commands

```bash
npm run dev          # local development
npm run lint         # ESLint
npm run test:plan    # plan tier unit checks
npm run build        # production bundle → dist/
npm run preview      # serve dist locally
```

---

## What NOT to do before Phase 2

- Do not advertise “create an account” publicly.
- Do not put production Anthropic keys in `VITE_*` env vars.
- Do not promise cross-device sync or real study groups.
- Do not skip privacy policy once collecting email + wellness data server-side.
