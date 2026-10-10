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

Preloaded demo accounts removed in Tier 2. Create a real account via **Sign up** on staging.

Optional admin seed (not linked in UI): `npm run seed:demo` with service role key — see `scripts/seed-demo-users.mjs`.

## Repo

https://github.com/josephboama20-collab/acad-demo

## Next

See [`TIER_2.md`](./TIER_2.md) — Supabase backend, real auth, secure server-side AI.
