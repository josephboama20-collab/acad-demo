# Acad Staging Test Plan

Use this checklist on the **password-protected staging URL** before each release candidate.

**Tester briefing (read first):**

- Data stays in your browser unless Phase 2 backend is live.
- Demo accounts reload seeded progress; fresh signup starts empty after onboarding.
- AI Buddy needs an API key on staging (key is visible in browser until Phase 2 proxy).

---

## Setup

- [ ] Staging URL loads without console errors
- [ ] Staging banner visible (if `VITE_APP_ENV=staging`)
- [ ] `npm run build` artifact matches deployed commit (check git SHA in footer if added)

---

## Demo accounts (password: `demo`)

Run each row end-to-end.

| Plan | Email | Courses | Tools to verify |
|------|-------|---------|-----------------|
| 2–3 weeks | `weeks@acad.app` | 1 | Dashboard, courses, flashcards, AI buddy |
| 1 month | `1month@acad.app` | 2 | + wellness, reports |
| 2 months | `2months@acad.app` | 4 | + projects, forge, study groups |
| 3 months | `3months@acad.app` | 6 | Full toolkit |

Per account:

- [ ] Landing → demo card → dashboard loads with correct name
- [ ] Nav shows only tools allowed for plan tier
- [ ] Manage Plan reflects correct duration

---

## Core flows (3-month account recommended)

### Dashboard

- [ ] Begin Task starts/pauses timer (mobile: button not hidden behind tab bar)
- [ ] Mark Complete updates streak/metrics
- [ ] Course insights and radar render
- [ ] Semester journey card appears (not hidden in Reports) and links to Semester hub

### Semester hub (new fully fledged flow)

- [ ] Open **Semester** from nav (or dashboard card)
- [ ] Confirm status shows **Continuing student on Acad** for seeded/demo users
- [ ] Enter a new semester outcome (course-by-course grades) and save
- [ ] Confirm adaptation message updates to Improved / Regressed / Stable
- [ ] Confirm semester history entry appears with GPA and grade breakdown

### Courses

- [ ] Open course → topic → study materials load
- [ ] Quiz: Start → answer reveal after timer → confidence rating
- [ ] Mastery ring and topic progress bars render

### Flashcards

- [ ] Overview shows card counts and due cards
- [ ] Study session: flip card → rate 1–5 → session completes or advances
- [ ] Manage: add/edit card works

### AI Buddy

- [ ] Subject list matches courses
- [ ] Quick action “Quiz me” returns questions (no duplicate user messages)
- [ ] Custom message sends and receives reply (with API key)

### Wellness

- [ ] Check-in submits; KPIs show lifetime totals (not “this week” only)
- [ ] Insights appear when enough logs exist
- [ ] No “Previous logs” section (removed)

### Reports

- [ ] Lifetime performance summary renders
- [ ] Export PDF downloads
- [ ] Semester section points users to Semester hub (not primary workflow anymore)

### Projects & Forge

- [ ] In-progress project card visible (2mo+)
- [ ] ≥1 suggested project from weak topics (3mo with weak topics)
- [ ] Open workspace → Forge loads without crash
- [ ] Milestones show correct progress (e.g. 2/6 for demo project)
- [ ] Draft autosaves

### Study groups

- [ ] Challenges tab has no padlock
- [ ] Leaderboard reflects group roster (not fake global list)

---

## Fresh signup path

- [ ] Sign up with new email + password → onboarding → dashboard
- [ ] Onboarding includes **Previous semester baseline** step with course-by-course grades
- [ ] Save at least 2 baseline course grades and complete onboarding
- [ ] Dashboard shows semester adaptation card immediately after onboarding
- [ ] Add one course manually
- [ ] Complete one flashcard review
- [ ] Open Semester hub and log current semester outcome after "return from school" scenario
- [ ] Confirm system marks Improved/Regressed and adapts messaging
- [ ] Sign out → sign in same browser → data still present
- [ ] **Document:** new browser/device does **not** restore data (expected until Phase 2)

---

## Mobile (viewport ≤768px)

- [ ] Bottom tab bar does not block primary actions (dashboard task, flashcard study, project open)
- [ ] More navigation drawer opens/closes
- [ ] AI Buddy chat input reachable above tab bar

---

## Regression watchlist

- [ ] No external URLs in daily tasks or flashcard content
- [ ] Projects page does not show “No weak topics” when weak topics exist
- [ ] Forge does not crash when opening saved project

---

## Sign-off

| Field | Value |
|-------|-------|
| Build / commit | |
| Tester | |
| Date | |
| Pass / Fail | |
| Blockers | |
