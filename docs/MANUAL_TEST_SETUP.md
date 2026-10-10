# Acad Manual Test Setup Guide

Use this document to manually test the semester journey from a fresh account.

**How it works now:** You enter key parameters (university, programme, country). Acad's **AI learns** your grading scale and course structure at onboarding — nothing is hardcoded per school.

---

## Before you start

1. Run the app: `npm run dev` from the `acad-demo` folder.
2. Use a **fresh account** or clear browser storage.
3. Ensure AI is available:
   - **Cloud:** deploy `supabase/functions/academic-profile` with `ANTHROPIC_API_KEY`
   - **Local:** set `VITE_ANTHROPIC_API_KEY` in `.env`
4. If AI is offline, Acad falls back to an estimated profile (still personalised to your entered names).

---

## Phase 1 — First account (local)

### 1. Sign up and start onboarding

- [ ] Create a new account.
- [ ] Onboarding opens with welcome message (no transcript upload).

### 2. Key parameters (you type / tap — not a fixed database)

- [ ] Enter university: `University of Ghana`
- [ ] Enter programme: `BSc Information Technology`
- [ ] Tap country: `Ghana`
- [ ] Tap structure: `Single major`
- [ ] Tap journey: `I am already in my programme` (or `Just starting` for new-student path)

### 3. Habit + position questions

- [ ] Answer mixed habit questions (duration, effort, etc.) — calm tone.
- [ ] If continuing: tap **Level 200** and **Semester 1** (or your real position).

### 4. AI learn step

- [ ] Reach **"Acad is learning your programme…"** screen.
- [ ] Wait for spinner to finish.
- [ ] Confirm summary shows your university, programme, grading label, and year levels mapped.
- [ ] Tap **Continue**.

### 5. Grade capture (continuing students only)

- [ ] Grade screens show **AI-mapped courses** (not a hardcoded list).
- [ ] Tap grades per course (`A`, `B+`, `B`, etc.) or **Skip**.
- [ ] Complete remaining habit questions and tap **Enter Acad**.

### 6. Dashboard and Semester hub

- [ ] Dashboard header shows university and level/semester.
- [ ] Semester journey card shows programme and adaptation message.
- [ ] Open **Semester** nav → courses load from your learned profile.
- [ ] Log a new semester outcome with button grades.

### 7. Smoke test

- [ ] Add a course, review a flashcard, sign out/in on same browser.

---

## Phase 2 — Cloud sync (if Supabase configured)

- [ ] Complete onboarding on device A with AI learn step.
- [ ] Sign in on device B — academic profile and grade history match.
- [ ] Log new semester on A; verify on B.

---

## Phase 3 — Adaptation

- [ ] Submit improved grades → dashboard shows improved mode.
- [ ] Submit lower grades → recovery mode.
- [ ] Daily task copy adapts to progression status.

---

## Example test profile

| Field | Value |
|-------|-------|
| University | University of Ghana |
| Programme | BSc Information Technology |
| Country | Ghana |
| Structure | Single major |
| Path | Continuing · Level 200 · Semester 1 |

---

## Where the data lives

| What | Where |
|------|-------|
| AI learn logic | `src/utils/academicProfileAI.js` |
| Profile helpers | `src/utils/academicProfileUtils.js` |
| Edge function | `supabase/functions/academic-profile/` |
| Stored per user | `academicProfile` in scholar profile + semesters bucket |

---

## Sign-off

| Field | Value |
|-------|-------|
| Tester | |
| Date | |
| AI source | Edge / Local key / Fallback |
| Phase 1 | Pass / Fail |
| Phase 2 | Pass / Fail / N/A |
| Phase 3 | Pass / Fail |

---

## Related docs

- `docs/STAGING_TEST_PLAN.md`
- `docs/PRODUCTION_ROLLOUT.md`
