# 004 — Relaxation window: 5-day rolling past-day backfill

## 1. Goal
Let any enrolled student backfill submissions for the past 4 calendar days
(rolling window — today + previous 4 days, total 5 days). Backfilled
submissions count as `ON_TIME`, turn the heatmap cell green, and heal the
current streak automatically. No opt-in, no admin gating, retroactive for any
existing gaps that fall inside the current window.

## 2. Current behavior
- `getCurrentDayNumber(enrollment, challenge)` ([src/lib/date-utils.ts:86](src/lib/date-utils.ts:86)) returns today's challenge day (1–60) in IST.
- `assertPastDaySubmittable(enrollment, dayNumber, challenge)` ([src/features/submission/submit-day.ts:17](src/features/submission/submit-day.ts:17)) currently allows a past-day submission ONLY if:
  - `dayNumber >= currentDay` (today or future), OR
  - a `Submission` row already exists for that day (edit case), OR
  - an `AdminAction` of type `REJECT_SUBMISSION` exists for that day (reject-resubmit case).
- `submit-day.ts:140-152` enforces a hard `submittedAtIst !== expectedDate` gate (`wrong_day`). Today this gate fails for ALL past-day backfill — including reject-resubmits (latent bug; see §6).
- `challenge/[day]/page.tsx:178-186` ([src/app/challenge/[day]/page.tsx:178](src/app/challenge/%5Bday%5D/page.tsx:178)) redirects to dashboard with `toast=past-missed` whenever `day < currentDayNumber && !existingSubmission && !hasRejectResubmit`. This blocks the UI from ever rendering the submission flow for a missed past day.
- `computeStreakStats` ([src/features/submission/streak-utils.ts](src/features/submission/streak-utils.ts)) treats ANY `Submission` row as a completed day (status-agnostic). So once a backfill row exists, the streak/longestStreak auto-recompute correctly.
- `getHeatmapData` ([src/features/dashboard/get-heatmap-data.ts:195](src/features/dashboard/get-heatmap-data.ts:195)) maps both `ON_TIME` and `LATE` submissions to heatmap status `"on_time"` (green). So a backfilled row with status `ON_TIME` renders green with no UI change.

Conclusion: the schema, streak math, and heatmap already do the right thing for backfilled rows. The change is purely in the **gates** (assert helper + wrong_day check + UI redirect) plus a new helper that defines the window.

## 3. Files to touch

| Path | Status | Note |
|---|---|---|
| `src/features/submission/submit-day.ts` | [edit] | Add `isWithinRelaxationWindow` helper. Extend `assertPastDaySubmittable` to permit days inside the window. Loosen the `wrong_day` gate so backfill within the window is allowed. |
| `src/features/challenge/get-day-data.ts` | [edit] | Add `isRelaxable: boolean` to the returned shape (true when the requested day is a past missed day inside the relaxation window). Reuse the new helper — do NOT duplicate the math. |
| `src/app/challenge/[day]/page.tsx` | [edit] | In the past-missed redirect (`day < currentDayNumber && !existingSubmission && !hasRejectResubmit`), add `&& !data.isRelaxable`. When `isRelaxable`, render the existing `SubmissionFlow` / `DayPage` as if it were today's task. |
| `src/components/challenge/submission-flow.tsx` *(or the file currently rendering the day-1 submit form — confirm exact path before edit)* | [edit] | When `isRelaxable === true`, show a small inline banner above the form: "Catch-up: you're submitting for a past day in your 5-day relaxation window. This will mark Day N green and heal your streak." Pure presentational; no logic change to the submit calls. |
| `src/app/actions/submission-actions.ts` | (no edit) | Already calls `assertPastDaySubmittable`. The helper change covers both `submitGithubStepAction` and the downstream `submitDay`. |
| `src/features/dashboard/get-heatmap-data.ts` | (no edit) | `ON_TIME` rows already render green. |
| `src/features/submission/streak-utils.ts` | (no edit) | Already status-agnostic — auto-heals when a row appears. |
| `prisma/schema.prisma` | (no edit) | **No schema change.** No new enum value, no new column. Reuses `SubmissionStatus.ON_TIME`. |

## 4. Server vs Client
- `submit-day.ts`, `get-day-data.ts`, `submission-actions.ts`, `challenge/[day]/page.tsx` — **Server** (existing). No boundary change.
- `submission-flow.tsx` (Client, existing `"use client"`) — receives a new boolean prop `isRelaxable` from the Server parent. Primitive boolean is safe across the boundary; no functions/icons/class instances passed.
- No new Client components.

## 5. Steps (file-by-file, ordered)

### Step 1 — Add the window helper
In `src/features/submission/submit-day.ts`, near the top (export it):

```ts
/**
 * Relaxation window: today + previous 4 days = 5 calendar days total.
 * Returns true if `dayNumber` is a PAST day inside the window (i.e. a
 * legitimate backfill target). Today itself is handled by the normal path.
 *
 * Example: currentDay=12 → returns true for dayNumber in {8, 9, 10, 11}.
 * Pre-start (currentDay=0) and Day 1 with no prior days return false.
 */
export function isWithinRelaxationWindow(
  currentDay: number,
  dayNumber: number,
): boolean {
  if (currentDay < 2) return false;
  if (dayNumber < 1 || dayNumber >= currentDay) return false;
  return dayNumber >= currentDay - 4;
}
```

### Step 2 — Extend `assertPastDaySubmittable`
In the same file, add a relaxation branch BEFORE the final `return { ok: false, ... }`:

```ts
if (isWithinRelaxationWindow(currentDay, dayNumber)) return { ok: true };
```

Place it after the reject-resubmit check (so reject-resubmit still wins if both apply — same outcome, but keeps existing branch order intact).

### Step 3 — Loosen the `wrong_day` gate
In `submit-day.ts:140-152`, replace the unconditional `wrong_day` failure with one that exempts backfills already cleared by `assertPastDaySubmittable`. Concretely:

```ts
const submittedAtIst = formatInTimeZone(new Date(), IST, "yyyy-MM-dd");
const expectedDate = getIstDateKeyForChallengeDay(
  enrollment,
  dayNumber,
  challengeAnchor,
);
const isBackfill = dayNumber < currentDay; // past-day catch-up
if (!isBackfill && submittedAtIst !== expectedDate) {
  return {
    ok: false,
    reason: "wrong_day",
    message: `Day ${dayNumber} can only be submitted on its scheduled IST date (${expectedDate}).`,
  };
}
```

Rationale: `assertPastDaySubmittable` already gates *which* past days are permitted (existing row, reject-resubmit, or relaxation window). The `wrong_day` check is only meaningful for present/future-day submissions where the user is trying to fast-forward. For any past day that survived `assertPastDaySubmittable`, the calendar mismatch is expected and correct.

### Step 4 — Surface `isRelaxable` from `getDayData`
In `src/features/challenge/get-day-data.ts`:
- Import `isWithinRelaxationWindow` from `@/features/submission/submit-day`.
- Compute `const isRelaxable = !existingSubmission && isWithinRelaxationWindow(currentDayNumber, day);`
- Add `isRelaxable` to the returned object's type and value.

### Step 5 — Update the day-page redirect and pass the flag
In `src/app/challenge/[day]/page.tsx:178-186`:

```ts
if (
  !data.existingSubmission &&
  day < data.currentDayNumber &&
  !data.hasRejectResubmit &&
  !data.isRelaxable
) {
  redirect(
    `/dashboard?toast=past-missed&challenge=${encodeURIComponent(data.enrollment.id)}`,
  );
}
```

Then pass `isRelaxable={data.isRelaxable}` down to `<SubmissionFlow ... />` (and to `<DayPage ... />` if that's the path used for CLAUDE day content — flag is harmless if unused).

### Step 6 — Banner in the submission flow
In `src/app/challenge/[day]/submission-flow.tsx` (Client component):
- Accept new optional prop: `isRelaxable?: boolean`.
- When `true`, render a small Alert/banner at the top of the form (use the existing `Alert` shadcn primitive if available, else a styled `div` with `bg-amber-50` / `dark:bg-amber-950/40`):

  > **Catch-up day** — You're submitting for Day {dayNumber}, a past day inside your 5-day relaxation window. This will mark Day {dayNumber} green on your heatmap and heal your current streak.

- No new state, no extra action; the existing `submitGithubStepAction` → `submitLinkedinStepAction` flow handles the submission. The server path (Steps 1–3) does the gating.

### Step 7 — (Optional, defer if not asked) Heatmap "catch-up" affordance
Out of scope for this plan. If desired later: make missed-day heatmap cells inside the relaxation window visually distinct (e.g. dashed border) and clickable to deep-link into the day page. Today, missed cells are already clickable in some views — verify before adding.

## 6. Guardrails for Cursor (DO NOT)
- **DO NOT** add a new `Submission` status (e.g. `RELAXED`). Reuse `ON_TIME`. Adding an enum value is a Postgres-level migration and changes streak/heatmap/leaderboard semantics in non-obvious ways.
- **DO NOT** modify `computeStreakStats`. It is intentionally status-agnostic. The streak heals automatically when the backfill row is inserted.
- **DO NOT** modify the heatmap's color logic. `ON_TIME` already renders green.
- **DO NOT** add the relaxation check to the admin reject-resubmit flow as a "replacement" — both branches must remain; reject-resubmit is unbounded in time, relaxation is bounded to 5 days.
- **DO NOT** allow backfill for `EnrollmentStatus.COMPLETED` or `ABANDONED` enrollments. The current `resolveChallengeEnrollment` is the canonical filter — if it returns the enrollment, backfill is allowed; if it doesn't (because status excludes them), nothing changes. **Verify** `resolveChallengeEnrollment`'s status filter before shipping; do not add a second filter.
- **DO NOT** plumb `isRelaxable` through Server→Client as anything other than a primitive boolean.
- **DO NOT** widen the window to "any 5 missed days lifetime" or "first 5 days only." The product decision is **rolling 5-day window, today + 4 past days**. The example is: `currentDay=12 → backfillable past days are 8, 9, 10, 11`.
- **DO NOT** introduce a feature flag, env var, or admin toggle. Always on for all active enrollments.
- **DO NOT** create new files for the helper. It lives inline in `submit-day.ts` next to the other gates.
- **DO NOT** touch `middleware.ts` or `auth.config.ts`. No edge-bundle risk.

## 7. DB safety
Not applicable — no schema changes, no migrations, no seed changes. Skip the Neon-branch step.

## 8. Verification

### Pre-flight
- `npx tsc --noEmit` (or `npm run build` if tsc isn't wired) must pass with no new errors.
- Lint must pass.

### Manual test matrix (use seeded test users from `prisma/seed.ts`)
| User | Day | Action | Expected |
|---|---|---|---|
| Vikram (Day 15, DS) | Visit `/challenge/12` (assume missed) | Page renders submission flow with **Catch-up banner**, NOT a redirect | Pass |
| Vikram | Visit `/challenge/10` (>5 days back) | Redirects to `/dashboard?toast=past-missed` | Pass |
| Vikram | Visit `/challenge/15` (today) | Renders submission flow, **no banner** | Pass |
| Vikram | Visit `/challenge/14` (yesterday, missed) | Renders flow with banner | Pass |
| Vikram | Visit `/challenge/16` (future, locked) | "Day not yet unlocked" card | Pass |
| Karan (Day 45, broken streak) | Backfill Days 42, 43, 44 via UI (3 separate submits) | After each submit: dashboard shows that cell green; after the third, `currentStreak` reflects the unbroken run ending at today | Pass |
| Arjun (Day 1) | Visit `/challenge/1` | Renders flow, no banner (currentDay=1 → no relaxable past days) | Pass |
| Meera (Day 60, COMPLETED) | Attempt backfill | Blocked by `resolveChallengeEnrollment` (if it filters COMPLETED) — verify this is the current behavior; if not, file a follow-up | — |
| Any user | Backfill same day twice via direct action call with different GitHub URLs | Second call upserts (existing behavior, no regression) | Pass |
| Any user | Backfill with a URL already used by another student | Returns `duplicate` error (existing behavior) | Pass |

### Files that should have changed
- `src/features/submission/submit-day.ts`
- `src/features/challenge/get-day-data.ts`
- `src/app/challenge/[day]/page.tsx`
- `src/app/challenge/[day]/submission-flow.tsx`

Nothing else. If `git diff --name-only` shows extra files (schema, migrations, streak-utils, heatmap, leaderboard, admin), STOP and review.

### Latent-bug note (out-of-scope, mention in PR description)
The pre-existing `wrong_day` gate in `submit-day.ts:140-152` blocks reject-resubmits today (the user always submits on a different IST date than the original scheduled day). Step 3's fix incidentally repairs that path. If reject-resubmits worked in practice, it means either (a) admins reject submissions on the same IST day the resubmit happens, or (b) the path is rarely exercised. Either way, the new gate logic is strictly more permissive for past days and matches the documented business rules in `docs/project-context.md` §5.

## 9. Commit message

```
feat(submission): add 5-day rolling relaxation window for past-day backfill

Students can now submit for missed days within the last 5 calendar days
(today + previous 4). Backfilled rows are stored as ON_TIME, render green on
the heatmap, and heal currentStreak via the existing status-agnostic streak
recomputation. No schema change; gated entirely in submit-day.ts and the
challenge day page.

Side-effect: also unblocks admin reject-resubmits, which the prior wrong_day
gate was incorrectly rejecting.
```
