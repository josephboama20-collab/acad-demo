# Staging deploy — Acad

**Owner:** josephboama20@gmail.com  
**Platform:** Netlify (connected to GitHub)

## Quick deploy (Netlify CLI)

```bash
npm ci
npm run build
npx netlify-cli login          # sign in as josephboama20@gmail.com
npx netlify-cli init           # link site (create new site or link existing)
npx netlify-cli deploy --prod --dir=dist
```

`netlify.toml` already sets `VITE_APP_ENV=staging` and SPA redirects.

## GitHub → Netlify (recommended for josephboama20@gmail.com)

### 1. Create GitHub repo

1. Sign in to GitHub as **josephboama20@gmail.com**
2. Create a new repository (e.g. `acad-demo`)
3. Push this project:

```bash
git remote add origin https://github.com/<your-github-username>/acad-demo.git
git add -A
git commit -m "Tier 1 staging: demo seeds, semester access, Netlify deploy"
git push -u origin master
```

### 2. Create Netlify site

1. Sign in to [Netlify](https://app.netlify.com) with **josephboama20@gmail.com**
2. **Add new site → Import an existing project → GitHub**
3. Select the `acad-demo` repo
4. Build settings are read from `netlify.toml` (`npm run build`, publish `dist`, `VITE_APP_ENV=staging`)
5. Deploy — every push to `master`/`main` will rebuild

### 3. Optional: GitHub Actions deploy (alternative to Netlify Git integration)

If you prefer the workflow in `.github/workflows/deploy-staging.yml`:

1. Netlify → **Site configuration → General → Site ID** → copy value
2. Netlify → **User settings → Applications → Personal access tokens** → create token
3. GitHub repo → **Settings → Secrets and variables → Actions** → add:
   - `NETLIFY_AUTH_TOKEN` = your Netlify token
   - `NETLIFY_SITE_ID` = your site ID

Push to `master` triggers deploy via Actions.

### 4. Password protection (optional)

Netlify **Site configuration → Access control → Password protection** (requires Pro plan).  
For free tier, share the staging URL only with testers privately.

## Staging checklist (Tier 1)

- [ ] Staging banner visible at top
- [ ] Demo login (1month@acad.app / demo) shows courses + flashcards in nav
- [ ] Semester journey reachable from nav at 0 courses
- [ ] `robots.txt` disallows crawlers; `noindex` meta on staging builds

## Demo accounts

| Email | Password | Plan |
|-------|----------|------|
| weeks@acad.app | demo | 2–3 weeks |
| 1month@acad.app | demo | 1 month |
| 2months@acad.app | demo | 2 months |
| 3months@acad.app | demo | 3 months |

Data stays in the browser until Supabase is configured.
