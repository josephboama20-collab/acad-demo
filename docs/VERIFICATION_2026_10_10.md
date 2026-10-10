# ACAD reliability verification 10 October 2026

## Reproduce the controlled checks

Use Node 22 or newer and the locked dependency set:

```sh
npm ci
npm test
npm run lint
npm run build
```

The verified release runs 21 plan assertions, 13 GPA assertions, 45 functional fixtures and 29 regression test cases. Coverage overlaps; this is not a requirement pass percentage. All passed locally and in hosted CI for source commit 06880b5213288c0893f8e091db8b0b92092f8836. Lint passed without errors or warnings. The production build passed with a bundle-size warning.

The functional harness fixes its reference clock at 10 October 2026 12:00 UTC. It covers SM-2 intervals, ease-factor floor, due dates, seeding and deduplication, plan limits, grade weighting, onboarding gates, semester restrictions and report aggregation. The unequal-credit GPA expectation is 3.50.

## Changes and evidence

- Account-owned local namespaces prevent one authenticated account from loading another account's study cache. Legacy data migrates only when its stored email matches the signing-in account.
- A durable owner-scoped outbox retains pending edits across reloads and failed requests. Hydration skips pending or newer local buckets. Revision checks and browser locks protect queued edits during acknowledgements and concurrent tab flushes. This is last-write-wins storage within each bucket; it is not a collaborative merge engine.
- Render-time page access checks hide protected pages when the user signs out, and enforce required setup and plan gates.
- New students select first-term courses from a reviewed curriculum without supplying invented completed-semester grades. Continuing students retain history checks when completed terms exist.
- The report exporter downloads actual PDF bytes, wraps long course names, embeds a Unicode font and displays export errors.
- GPA uses course credits; missing legacy credits retain equal weighting until corrected by the learner.
- Hook cleanup and explicit state initialization resolve lint failures without disabling the core hooks rules. CI runs the regression checks as well as lint and build.

## PDF fixtures

`npm run test:regression` generates files in ignored `test-output/`. The empty fixture has one page. The populated fixture has four pages, all 60 courses TEST000 to TEST059, the Unicode name José Aidoo-Gyamfi, 40% average mastery, 2.5 study hours and a 3-day streak. Text extraction confirmed those fields. Render inspection found readable wrapping and page footers. Markup is literal text, rather than executable HTML. These are generated software fixtures, not a captured download from an authenticated production account.

## Live verification boundaries

Source commit `06880b5213288c0893f8e091db8b0b92092f8836` is published on master. [CI run 38056251710](https://github.com/josephboama20-collab/acad-demo/actions/runs/38056251710) and [Deploy Staging run 38056251711](https://github.com/josephboama20-collab/acad-demo/actions/runs/38056251711) succeeded. These public workflow records verify automated release checks. They do not establish authenticated database isolation, independent-device restoration, complete onboarding journeys, multi-tab session termination or download delivery through the live interface. Controlled fixtures establish only their explicit inputs and test environments.

## Learner evaluation

No student usability or learning-outcome study has been conducted. Software fixtures are not student participants. Recruit consenting students from the stated target context, set representative tasks, and record task completion, errors, assistance and usability responses. Report observed data and limitations; do not insert hypothetical scores into the thesis as results.
