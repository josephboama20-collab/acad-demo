# Acad security checklist

## Secrets — where they belong

| Secret | Location | Never put in |
|--------|----------|--------------|
| OpenAI API key | Supabase edge secrets (`OPENAI_API_KEY` or `OPENAI_API_KEY_FOR_ACAD`) | Git, Netlify, `.env` committed |
| Supabase service role | Supabase dashboard only | Client code, Netlify |
| Supabase anon key | Netlify `VITE_SUPABASE_ANON_KEY` | N/A — public by design |
| Supabase access token (`sbp_…`) | Your password manager / local CLI session | Chat, git, screenshots |

## If a secret was shared in chat or committed

1. **OpenAI** — [platform.openai.com/api-keys](https://platform.openai.com/api-keys): revoke old key, create new, update Supabase secret, redeploy edge functions if needed.
2. **Supabase access token** — [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens): revoke compromised tokens, generate a new one for CLI only.
3. **App passwords** — change in Supabase Auth → Users if the account password was exposed.

## Supabase CLI login (safe pattern)

```powershell
npx supabase login
# complete browser flow — do not paste tokens into chat
npx supabase link --project-ref qiovvyvkhmmbpihnonqo
npx supabase secrets list
```

## OpenAI edge secret names

Edge functions accept either:

- `OPENAI_API_KEY` (recommended)
- `OPENAI_API_KEY_FOR_ACAD` (legacy alias)

## Repo hygiene

- `.env` is gitignored — keep it that way.
- Run `git log -p -S "sk-proj-"` before pushing if you ever pasted keys locally.
- Netlify should only have `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_APP_ENV` — not `OPENAI_*` or `DEEPSEEK_*`.

## Spend limits

Set a monthly cap on your OpenAI project while in alpha testing ($5–20 is enough for early users).
