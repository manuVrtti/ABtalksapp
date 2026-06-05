# 004 — Relaxation window: 5-day rolling past-day backfill

## 1. Goal
Let any enrolled student backfill submissions for the past 4 calendar days
(rolling window — today + previous 4 days, total 5 days). Backfilled
submissions count as `ON_TIME`, turn the heatmap cell green, and heal the
current streak automatically. No opt-in, no admin gating, retroactive for any
existing gaps that fall inside the current window.

**Entry point:** the heatmap is the canonical way to reach a past day. Clicking
a missed cell:
- **Inside the window** → opens the existing dialog with the problem statement
  AND a primary "Submit now" CTA that navigates to `/challenge/[day]` (which
  renders the submission flow with the catch-up banner).
- **Outside the window** → opens the same dialog with the problem statement
  read-only (current behavior — no submit CTA).

In-window missed cells also get a distinct visual cue on the grid (a ring/dot
over the existing red fill) so users discover the affordance without clicking
every cell.

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
- `SubmissionHeatmap` ([src/components/dashboard/submission-heatmap.tsx](src/components/dashboard/submission-heatmap.tsx)) is a Client component that renders a 60-cell grid of `<button>`s. `isClickable` (line 51) makes everything except `future` cells clickable. Clicking opens a `Dialog` (line 230) that already shows the problem statement for missed days with the message *"You missed this day. Submissions are no longer accepted, but you can review the problem statement to help with later tasks."* (line 288-293). The dialog footer has a `Resubmit` CTA for rejected cells (line 371-383) but no equivalent for missed cells — so today there is no UI path from a missed cell into the submission flow.

Conclusion: the schema, streak math, and heatmap colour logic already do the right thing for backfilled rows. The change is in the **gates** (assert helper + wrong_day check + URL redirect) plus a new helper that defines the window, plus the heatmap entry-point (new `isRelaxable` field + dialog CTA + distinct visual on the grid).

## 3. Files to touch

| Path | Status | Note |
|---|---|---|
| `src/features/submission/submit-day.ts` | [edit] | Add `isWithinRelaxationWindow` helper. Extend `assertPastDaySubmittable` to permit days inside the window. Loosen the `wrong_day` gate so backfill within the window is allowed. |
| `src/features/challenge/get-day-data.ts` | [edit] | Add `isRelaxable: boolean` to the returned shape (true when the requested day is a past missed day inside the relaxation window). Reuse the new helper — do NOT duplicate the math. |
| `src/app/challenge/[day]/page.tsx` | [edit] | In the past-missed redirect (`day < currentDayNumber && !existingSubmission && !hasRejectResubmit`), add `&& !data.isRelaxable`. When `isRelaxable`, render the existing `SubmissionFlow` / `DayPage` as if it were today's task. |
| `src/components/challenge/submission-flow.tsx` *(or the file currently rendering the day-1 submit form — confirm exact path before edit)* | [edit] | When `isRelaxable === true`, show a small inline banner above the form: "Catch-up: you're submitting for a past day in your 5-day relaxation window. This will mark Day N green and heal your streak." Pure presentational; no logic change to the submit calls. |
| `src/features/dashboard/get-heatmap-data.ts` | [edit] | Add `isRelaxable: boolean` to the `HeatmapCell` type and populate it for each cell (true iff `status === "missed"` and `isWithinRelaxationWindow(currentDay, dayNumber)`). `currentDay` is already computed at line 180 — reuse it. **Do NOT add a new `HeatmapCellStatus` value.** |
| `src/components/dashboard/submission-heatmap.tsx` | [edit] | Two changes: (a) when a cell has `status === "missed"` and `isRelaxable === true`, add a yellow/amber ring to the red cell button so it's distinguishable in the grid; (b) in the dialog body and footer for missed cells, branch on `active.isRelaxable` — when true, show updated copy ("Catch-up window: you can still submit this day…") and a primary "Submit now" CTA `<Link>` to `/challenge/[dayNumber]?challenge=…` (mirror the existing `Resubmit` Link pattern at line 371-383). When false, keep the current message and no CTA. |
| `src/app/actions/submission-actions.ts` | (no edit) | Already calls `assertPastDaySubmittable`. The helper change covers both `submitGithubStepAction` and the downstream `submitDay`. |
| `src/features/submission/streak-utils.ts` | (no edit) | Already status-agnostic — auto-heals when a row appears. |
| `prisma/schema.prisma` | (no edit) | **No schema change.** No new enum value, no new column. Reuses `SubmissionStatus.ON_TIME`. |

## 4. Server vs Client
- `submit-day.ts`, `get-day-data.ts`, `submission-actions.ts`, `challenge/[day]/page.tsx`, `get-heatmap-data.ts` — **Server** (existing). No boundary change.
- `submission-flow.tsx` (Client, existing `"use client"`) — receives a new boolean prop `isRelaxable` from the Server parent. Primitive boolean is safe across the boundary; no functions/icons/class instances passed.
- `submission-heatmap.tsx` (Client, existing `"use client"`) — already receives `HeatmapCell[]` (plain data) from the Server dashboard page. The new `isRelaxable: boolean` on each cell is a primitive — safe to serialize across the boundary.
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

### Step 7 — Expose `isRelaxable` from the heatmap data source
In `src/features/dashboard/get-heatmap-data.ts`:
- Import `isWithinRelaxationWindow` from `@/features/submission/submit-day`.
- Add `isRelaxable: boolean` to the `HeatmapCell` type (alongside `status`, before the task metadata fields).
- In the cell-builder loop (line 183-234), compute `const isRelaxable = status === "missed" && isWithinRelaxationWindow(currentDay, dayNumber);` and include it in the pushed object.
- **Do NOT** add a new `HeatmapCellStatus` value (e.g. `"missed_relaxable"`). Adding a status forces every consumer — legend, color map, dialog branches, admin views if any — to handle it. A separate boolean is additive and ignored by code that doesn't need it.

### Step 8 — Heatmap grid: distinct visual for in-window missed cells
In `src/components/dashboard/submission-heatmap.tsx`:
- In the cell `<button>` className (around line 185-192), append a conditional ring class when `cell.status === "missed" && cell.isRelaxable`. Suggested: `"ring-2 ring-amber-400 ring-offset-1 ring-offset-background dark:ring-amber-500"`. Keep the existing `bg-red-500` fill — do NOT change the background. The ring is the cue; the cell is still missed.
- Update `tooltipLabel` (line 34) to return a different string for relaxable missed cells, e.g. `"Day N — Missed, but still in catch-up window (submit by [date])"`. The expiry date is the IST calendar date for `dayNumber + 4` — compute via the existing `getIstDateKeyForChallengeDay` helper if needed, or simplify to just "still catchable" if the date math is awkward.
- Add an entry to the legend `<ul>` (line 199-228) for the new visual: a small red square with the amber ring + label "Missed — catch up".

### Step 9 — Heatmap dialog: branch missed-cell content on `isRelaxable`
In the same file, inside the dialog body (around line 288-293):
- When `active.status === "missed" && active.isRelaxable`: replace the current "Submissions are no longer accepted" banner with something like *"You're inside the 5-day catch-up window. Submit GitHub + LinkedIn now to mark this day green and heal your streak."* Use the same `rounded-lg border border-amber-400/60 bg-amber-50 dark:bg-amber-950/40` styling pattern.
- When `active.status === "missed" && !active.isRelaxable`: keep the existing message unchanged.

In the dialog footer (around line 370-387), add a "Submit now" CTA `<Link>` that mirrors the existing "Resubmit" pattern:

```tsx
{active.status === "missed" && active.isRelaxable ? (
  <Link
    href={
      challengeEnrollmentId
        ? `/challenge/${active.dayNumber}?challenge=${encodeURIComponent(challengeEnrollmentId)}`
        : `/challenge/${active.dayNumber}`
    }
    className={cn(buttonVariants({ variant: "default" }))}
    onClick={() => setOpen(false)}
  >
    Submit now
  </Link>
) : null}
```

Place it BEFORE the existing rejected `Resubmit` block (or beside it — they are mutually exclusive states so order doesn't matter for layout). Keep the `Close` button as-is.

### Step 10 — Sanity-check `currentDayNumber` plumbing
The dashboard page that mounts `<SubmissionHeatmap>` already loads `getHeatmapData(enrollmentId, ...)`. The new `isRelaxable` is computed server-side inside that helper, so the dashboard call sites need NO changes. Confirm `src/app/dashboard/page.tsx` (and any other consumer of `getHeatmapData`) still compiles and that no consumer destructures the `HeatmapCell` type in a way that breaks when a new field is added (it shouldn't — additive change).

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
- **DO NOT** add a new `HeatmapCellStatus` enum value for "missed but catchable." Use a separate `isRelaxable: boolean` field on `HeatmapCell`. New enum values cascade into the legend, color map, admin views, public profile rendering, and any future filters.
- **DO NOT** change the heatmap cell's background colour for in-window missed cells. They are still missed (no submission row exists). The amber ring is the affordance; turning the cell green pre-submit would lie to the user.
- **DO NOT** embed the submission flow inside the dialog. Use a `<Link>` CTA to `/challenge/[day]` (the dialog already mirrors this pattern for rejected days via "Resubmit"). Embedding requires extracting `SubmissionFlow` from the page-level layout and replicating Server-side data fetching client-side — out of scope and risky.
- **DO NOT** make `future` cells clickable. The existing `isClickable` check at line 51 already excludes them; leave it.

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

### Heatmap entry-point test cases
| User | Action | Expected |
|---|---|---|
| Vikram (Day 15) | Open dashboard, hover Day 12 cell (assume missed) | Tooltip says "Day 12 — Missed, but still in catch-up window…". Cell shows red fill **with amber ring**. |
| Vikram | Click Day 12 (in-window missed) cell | Dialog opens with amber "catch-up window" banner + problem statement + **"Submit now"** primary CTA in footer. |
| Vikram | Click "Submit now" in the dialog | Navigates to `/challenge/12?challenge=…`; submission flow renders with the catch-up banner from Step 6. |
| Vikram | Click Day 10 cell (out-of-window missed) | Dialog opens with the **existing** "Submissions are no longer accepted" message + problem statement. **No** "Submit now" CTA. **No** amber ring on the grid cell either. |
| Vikram | Click Day 5 cell (on-time, completed) | Dialog opens with existing on-time view (GitHub + LinkedIn links). Unchanged. |
| Vikram | Click a `future` cell | Click is a no-op (button disabled). Unchanged. |
| Karan (Day 45, missed Day 42) | After backfilling Day 42 via the CTA flow above, return to dashboard | Day 42 cell is now solid green (no ring). Day 41 cell (if also missed and in-window) still has amber ring. |
| Heatmap legend | Inspect legend strip | New entry "Missed — catch up" with red square + amber ring is present. |

### Files that should have changed
- `src/features/submission/submit-day.ts`
- `src/features/challenge/get-day-data.ts`
- `src/app/challenge/[day]/page.tsx`
- `src/app/challenge/[day]/submission-flow.tsx`
- `src/features/dashboard/get-heatmap-data.ts`
- `src/components/dashboard/submission-heatmap.tsx`

Nothing else. If `git diff --name-only` shows extra files (schema, migrations, streak-utils, leaderboard, admin), STOP and review.

### Latent-bug note (out-of-scope, mention in PR description)
The pre-existing `wrong_day` gate in `submit-day.ts:140-152` blocks reject-resubmits today (the user always submits on a different IST date than the original scheduled day). Step 3's fix incidentally repairs that path. If reject-resubmits worked in practice, it means either (a) admins reject submissions on the same IST day the resubmit happens, or (b) the path is rarely exercised. Either way, the new gate logic is strictly more permissive for past days and matches the documented business rules in `docs/project-context.md` §5.

## 9. Commit message

```
feat(submission): add 5-day rolling relaxation window with heatmap entry-point

Students can now submit for missed days within the last 5 calendar days
(today + previous 4). Backfilled rows are stored as ON_TIME, render green on
the heatmap, and heal currentStreak via the existing status-agnostic streak
recomputation. No schema change; gated in submit-day.ts and the challenge
day page.

The heatmap now surfaces this affordance: in-window missed cells get an
amber ring, and the cell dialog gains a "Submit now" CTA that deep-links to
/challenge/[day]. Out-of-window missed cells keep the existing read-only
problem-statement view.

Side-effect: also unblocks admin reject-resubmits, which the prior wrong_day
gate was incorrectly rejecting.
```
