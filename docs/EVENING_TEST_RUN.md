# Evening test run — Tier 2 (real accounts)

**No preloaded demo accounts.** Create a fresh account for each plan you test.

**Prerequisites (Netlify env vars):**
```
VITE_APP_ENV=staging
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
Deploy edge functions with `DEEPSEEK_API_KEY` (see `docs/TIER_2.md`).

Hard-refresh after deploy.

---

## Setup once (15 min)

1. [ ] Supabase project created + `001_initial_schema.sql` run
2. [ ] Netlify env vars set (above)
3. [ ] Edge functions deployed (`buddy-chat`, `academic-profile`, `delete-account`)
4. [ ] Staging banner shows **Cloud alpha**
5. [ ] Auth page does **not** show “Cloud auth is not configured”

---

## Per-plan test (~15 min each)

Use a **new email** each time (e.g. `you+weeks@gmail.com`, `you+1mo@gmail.com`).

| Plan to test | Pick in onboarding | Max courses | Tools to verify in nav |
|--------------|------------------|-------------|------------------------|
| 2–3 weeks | 2–3 weeks | 1 | Dashboard, Courses, Flashcards, AI Buddy, Semester |
| 1 month | 1 month | 2 | + Wellness, Reports |
| 2 months | 2 months | 4 | + Projects, Groups |
| 3 months | 3 months | 6 | Full toolkit |

### Steps (repeat per plan)

| # | Action | Pass |
|---|--------|------|
| 1 | **Create account** → complete onboarding (university, programme, baseline grades) | |
| 2 | Dashboard loads, sidebar shows **icon + label** for Theme and Streak rows | |
| 3 | Panel icon collapses/expands sidebar | |
| 4 | Add courses up to plan max | |
| 5 | Flashcards: add or generate, study 1 card | |
| 6 | AI Buddy: send one message | |
| 7 | Plan-specific tools (see table) | |
| 8 | Sign out → sign in → data still there | |
| 9 | **Delete account** in Settings (or use new email next run) | |

---

## Sidebar UI checks (desktop)

- [ ] Theme row: moon/sun icon + **Light / Twilight / Dark** label when expanded
- [ ] Streak row: flame icon + **N day streak** label when expanded
- [ ] Collapsed: icons only, tooltips on hover
- [ ] No boxed theme toggle, no centered “3 / DAYS” stack

---

## Log blockers

| Plan | Step | Issue |
|------|------|-------|
| | | |

---

## Sign-off

| Field | Value |
|-------|-------|
| Date | |
| Netlify URL | |
| Commit | |
| Tier 2 ready? | Yes / No |

Full checklist: [`STAGING_TEST_PLAN.md`](./STAGING_TEST_PLAN.md)
