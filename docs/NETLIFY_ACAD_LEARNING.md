# Netlify — acad-learning

| Field | Value |
|-------|--------|
| **URL** | https://acad-learning.netlify.app |
| **Site ID** | `8d4cdfb1-dec2-411b-a35b-7f7781ecb370` |
| **Repo** | https://github.com/josephboama20-collab/acad-demo |
| **Account** | josephboama20@gmail.com |

## Current env vars

- `NODE_VERSION=22`
- `VITE_APP_ENV=staging`

**Still needed for Tier 2:**

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## One-command setup (after you have Supabase keys)

```powershell
cd acad-demo
$env:VITE_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
$env:VITE_SUPABASE_ANON_KEY="eyJ...anon-public-key..."
.\scripts\configure-netlify-tier2.ps1
```

## Supabase Auth URLs

In Supabase → Authentication → URL configuration:

- **Site URL:** `https://acad-learning.netlify.app`
- **Redirect URLs:** `https://acad-learning.netlify.app/**`

## Edge functions (AI Buddy)

```powershell
npx supabase login
npx supabase link --project-ref YOUR_REF
npx supabase secrets set DEEPSEEK_API_KEY=sk-...
npx supabase functions deploy buddy-chat
npx supabase functions deploy academic-profile
npx supabase functions deploy delete-account
```
