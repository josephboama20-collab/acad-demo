# Tier 1 — Complete

Staging-ready local-first Acad demo. Netlify deploy connected to GitHub.

## Delivered

| Item | Status |
|------|--------|
| Demo account seeds (profile, courses, flashcards, wellness) | Done |
| Semester journey before courses (`PRE_COURSE_TOOLS`) | Done |
| Staging banner + `noindex` + `robots.txt` | Done |
| `netlify.toml` + GitHub Actions deploy workflow | Done |
| CI: lint → `test:plan` → build | Done |
| Demo walkthrough smoke path | Done |
| Netlify live deploy | Done (user-connected) |
| Mobile UI polish pass (spacing, FAB, padding) | Done |

## Demo entry

Password for all: **`demo`**

| Plan | Email |
|------|-------|
| 2–3 weeks | `weeks@acad.app` |
| 1 month | `1month@acad.app` |
| 2 months | `2months@acad.app` |
| 3 months | `3months@acad.app` |

## Netlify env vars (recommended)

```
VITE_APP_ENV=staging
VITE_DEEPSEEK_API_KEY=<your-key>   # local-mode AI on staging builds
```

Omit `VITE_DEEPSEEK_API_KEY` once Tier 2 Supabase + edge functions are live.

## Repo

https://github.com/josephboama20-collab/acad-demo

## Next

See [`TIER_2.md`](./TIER_2.md) — Supabase backend, real auth, secure server-side AI.
