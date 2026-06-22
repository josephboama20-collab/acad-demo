# Acad

Plan your academic comeback — a React study platform that scales tools to your recovery window (2–3 weeks through 3 months).

## Modes

| Mode | When | Behaviour |
|------|------|-----------|
| **Local** | No `VITE_SUPABASE_*` in `.env` | Data in `localStorage`; demo auth |
| **Cloud** | Supabase URL + anon key set | Real auth, cross-device sync, secure AI proxy |

## Quick start (cloud / alpha)

1. Follow [`docs/TIER_2.md`](docs/TIER_2.md) — Supabase project + Netlify env vars
2. Deploy edge functions for secure AI
3. `npm run dev` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`

## Local-only mode (no Supabase)

Omit `VITE_SUPABASE_*` — cosmetic auth, data stays in the browser. Not used for staging tests.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production bundle → `dist/` |
| `npm run preview` | Serve production build locally |
| `npm run lint` | ESLint |
| `npm run test:plan` | Plan tier capacity tests |
| `npm run seed:demo` | Create Supabase demo users (requires service role) |

## Deploy (Phase 1)

- Build: `npm run build`, publish `dist/`
- `vercel.json` included for SPA routing + security headers
- Set env vars on host (see `.env.example`)
- Run [`docs/STAGING_TEST_PLAN.md`](docs/STAGING_TEST_PLAN.md)

## Documentation

- [`docs/TIER_1_COMPLETE.md`](docs/TIER_1_COMPLETE.md) — staging sign-off
- [`docs/TIER_2.md`](docs/TIER_2.md) — Supabase + secure AI (current focus)
- [`docs/PRODUCTION_ROLLOUT.md`](docs/PRODUCTION_ROLLOUT.md) — full path to production
- [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) — Phase 2 backend setup
- [`docs/STAGING_TEST_PLAN.md`](docs/STAGING_TEST_PLAN.md) — QA checklist

## Stack

React 19 · Vite 8 · Supabase (optional) · Chart.js · marked · lucide-react
