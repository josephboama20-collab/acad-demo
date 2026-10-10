# Evening test run — all plans

**Site:** your Netlify staging URL  
**Password (all demos):** `demo`  
**Time budget:** ~45–60 min (10–15 min per plan)

Hard-refresh after deploy (`Ctrl+Shift+R`) so sidebar toggle + theme icons load.

---

## Before you start (5 min)

- [ ] Staging banner visible at top
- [ ] No red errors in browser console (F12)
- [ ] Desktop width ≥1024px for sidebar collapse test (panel icon under Acad logo)
- [ ] Sign out between plan tests (Settings → Sign out, or use demo cards on landing)

---

## Plan 1 — 2–3 weeks (`weeks@acad.app`)

**Expect:** 1 course · Dashboard, Courses, Flashcards, AI Buddy, Semester in nav  
**Not in nav:** Wellness, Reports, Projects, Groups

| Step | Check | Pass |
|------|-------|------|
| Landing → **Try 2–3 weeks demo** | Dashboard loads, name shows | |
| Nav items | Only tier tools (no Reports/Projects) | |
| **Courses** | 1 course with topics | |
| **Flashcards** | Cards exist, Study due works | |
| **AI Buddy** | Send one message, get reply | |
| **Semester** | Hub opens (even at 0 extra courses) | |
| Sidebar | Panel icon collapses/expands nav | |
| Theme | Sun/moon icon cycles, no text box | |

---

## Plan 2 — 1 month (`1month@acad.app`)

**Expect:** 2 courses · + Wellness, Reports

| Step | Check | Pass |
|------|-------|------|
| Demo login | 2 courses in nav count | |
| **Wellness** | Submit check-in | |
| **Reports** | Summary renders, PDF export | |
| Dashboard | Task timer + streak update | |
| Manage Plan | Shows "1 month" | |

---

## Plan 3 — 2 months (`2months@acad.app`)

**Expect:** 4 courses · + Projects, Study groups

| Step | Check | Pass |
|------|-------|------|
| Demo login | 4 courses seeded | |
| **Projects** | Project list + timeline bar | |
| Open workspace | Forge loads without crash | |
| **Groups** | Challenges tab, no padlock | |
| Mobile (optional) | Bottom nav, More drawer | |

---

## Plan 4 — 3 months (`3months@acad.app`)

**Expect:** 6 courses · full toolkit

| Step | Check | Pass |
|------|-------|------|
| Demo login | 6 courses, all nav tools | |
| Flashcards | 11+ due, mastery bars | |
| AI Buddy | Quick action works | |
| Projects | Suggested + in-progress cards | |
| Semester hub | Log outcome / view GPA | |
| Full pass | No blocked nav, no blank pages | |

---

## Log blockers here

| Plan | Page | What happened |
|------|------|---------------|
| | | |

---

## Sign-off

| Field | Value |
|-------|-------|
| Date | |
| Netlify URL | |
| Build commit | `git log -1 --oneline` on deployed branch |
| Overall | Pass / Fail / Partial |
| Ready for Tier 2? | Yes / No |

Full checklist: [`STAGING_TEST_PLAN.md`](./STAGING_TEST_PLAN.md)
