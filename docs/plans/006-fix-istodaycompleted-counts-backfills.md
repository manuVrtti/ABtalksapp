# 006 — Fix: `isTodayCompleted` falsely true after relaxation-window backfill

## 1. Goal
Dashboard hides today's task card after a user backfills any past day inside
the 5-day relaxation window (plan 004). Heatmap is correct; only the
"today's task" surface is wrong. Make `isTodayCompleted` true iff a
`Submission` row exists for `dayNumber === currentDay` — not "any row was
submitted at on today's IST date."

## 2. Current behavior

### Symptom (reported)
- User is on Day 6 (IST today). Days 1–3 submitted earlier; Days 4 and 5 missed.
- User backfills Day 4 and Day 5 today via the heatmap relaxation flow.
- Heatmap: Day 4 and 5 turn green (correct), Day 6 stays unsubmitted (correct).
- Dashboard: today's-task card disappears / shows a "done for today" state.
  Bug.

### Root cause
`src/features/dashboard/get-dashboard-data.ts` lines 194-206:

```ts
const now = new Date();
const submissionsLast2d = await prisma.submission.findMany({
  where: {
    userId,
    enrollmentId: enrollment.id,
    submittedAt: { gte: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
  },
  select: { submittedAt: true },
});

const isTodayCompleted = submissionsLast2d.some((s) =>
  sameIstCalendarDay(s.submittedAt, now),
);
```

The flag asks "did the user create *any* submission on today's IST calendar
date?" Before plan 004, the `wrong_day` gate at `submit-day.ts:140-152`
enforced `submittedAtIst === expectedDate` for every submission, so this
proxy was load-bearing-correct (a submission today implied today's day).
Plan 004 deliberately loosened that gate so the user can submit for past
days while sitting on today's IST date. The proxy is now wrong: backfilled
rows from today shadow today's actual task.

Then at line 215:
```ts
if (!isChallengeComplete && !isTodayCompleted) {
  const task = await prisma.dailyTask.findUnique({ ... currentDay ... });
  if (task) todayTask = task;
}
```
If `isTodayCompleted` is falsely true, `todayTask` stays `null`, and whatever
component renders the today-task card hides itself (or renders a "completed
for today" placeholder).

### Why the heatmap is unaffected
`getHeatmapData` ([src/features/dashboard/get-heatmap-data.ts:127](src/features/dashboard/get-heatmap-data.ts:127)) keys its `byDay` map on `dayNumber`, not `submittedAt`, and the cell status comes from whether a row exists for that day. Backfilled rows are stored against their original `dayNumber` (4 or 5), not Day 6, so Day 6 correctly stays in the `future`/`missed` branch.

## 3. Files to touch

| Path | Status | Note |
|---|---|---|
| `src/features/dashboard/get-dashboard-data.ts` | [edit] | Replace the `submissionsLast2d` query + `sameIstCalendarDay`-based predicate with a direct lookup for a submission at `dayNumber === currentDay`. Drop the now-unused `submissionsLast2d` variable. The `sameIstCalendarDay` helper at lines 79-84 becomes unused — remove it too (and the `formatInTimeZone`/`IST` imports if they have no other consumer in this file). |
| `src/features/submission/submit-day.ts` | (no edit) | `submittedAt: new Date()` (line 173, 179) is correct and intentional — it records *when* the submission was actually made, separate from *which day* it covers. The bug is in the dashboard reader, not the writer. |
| `src/features/dashboard/get-heatmap-data.ts` | (no edit) | Heatmap is correct. |
| `prisma/schema.prisma` | (no edit) | No schema change. |

## 4. Server vs Client
- `src/features/dashboard/get-dashboard-data.ts` — Server (existing). Only the read query changes. The exported `DashboardDataWithEnrollment` shape is unchanged (`isTodayCompleted: boolean` stays). Downstream Server/Client components consume the same field with the same semantics — no boundary change.

## 5. Steps

### Step 1 — Replace the proxy with a direct day-keyed lookup
In `src/features/dashboard/get-dashboard-data.ts`, around lines 194-208, replace:

```ts
const now = new Date();
const submissionsLast2d = await prisma.submission.findMany({
  where: {
    userId,
    enrollmentId: enrollment.id,
    submittedAt: { gte: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
  },
  select: { submittedAt: true },
});

const isTodayCompleted = submissionsLast2d.some((s) =>
  sameIstCalendarDay(s.submittedAt, now),
);

const currentDay = getCurrentDayNumber(enrollment, enrollment.challenge);
```

with:

```ts
const currentDay = getCurrentDayNumber(enrollment, enrollment.challenge);

const todaySubmission =
  currentDay >= 1
    ? await prisma.submission.findUnique({
        where: {
          enrollmentId_dayNumber: {
            enrollmentId: enrollment.id,
            dayNumber: currentDay,
          },
        },
        select: { id: true },
      })
    : null;

const isTodayCompleted = todaySubmission !== null;
```

Notes:
- `currentDay >= 1` guard: `getCurrentDayNumber` returns `0` for pre-start synchronized cohorts (CLAUDE before `Challenge.startsAt` in IST). There is no Day 0 task — skip the lookup to avoid a guaranteed-null query.
- The `enrollmentId_dayNumber` compound unique is already used by `submit-day.ts`, `assertPastDaySubmittable`, and others — reuse it.
- Order matters: `currentDay` must be computed BEFORE the `todaySubmission` query. The original code computed it after. The replacement reorders correctly.

### Step 2 — Remove dead code introduced by Step 1
Same file:
- Delete the `sameIstCalendarDay` helper (lines 79-84). It has no other caller in this file. Confirm with `grep -n "sameIstCalendarDay" src/features/dashboard/get-dashboard-data.ts` → zero matches after removal.
- Prune unused imports at the top:
  - `formatInTimeZone` from `date-fns-tz` (was only used by `sameIstCalendarDay`).
  - `IST` from `@/lib/date-utils` (was only used by `sameIstCalendarDay`).
  - **Keep** `getCurrentDayNumber` — still used.
- Do NOT delete `sameIstCalendarDay` or the `IST` constant from anywhere else; they are local-only here.

### Step 3 — Sanity-check `isTodayCompleted` consumers
Grep to confirm what reads the field, and that the semantics are unchanged:
- `grep -rn "isTodayCompleted" src/` — expected callers: the dashboard page and any component receiving the data bundle. Verify each consumer treats the boolean as "today's `dayNumber` has a submission row" (which is now strictly true). The old semantics were "user made any submission today" — for the on-time happy path these were identical, so no consumer needs adjusting. Just confirm none of them combine the flag with `currentDay`/`daysCompleted` in a way that would break with the corrected value.

No other file changes expected.

## 6. Guardrails for Cursor (DO NOT)
- **DO NOT** change `submit-day.ts`. `submittedAt: new Date()` is the intentional, correct value (it records when the submission happened, which can legitimately differ from the day's scheduled date in the backfill / reject-resubmit cases). Anyone tempted to "fix" the bug by stamping `submittedAt` with the scheduled date will silently break the `recentSubmissions` ordering on the dashboard and any future audit reporting that relies on submission timestamps.
- **DO NOT** widen the fix to also recompute `daysCompleted` or `currentStreak` here. Those are stored on `Enrollment` and updated transactionally in `submit-day.ts` — already correct for backfills.
- **DO NOT** introduce a new field on the dashboard data bundle. Reuse `isTodayCompleted` with corrected semantics. The boolean's name accurately describes the new check.
- **DO NOT** call `prisma.submission.count({ ..., dayNumber: currentDay })` instead of `findUnique`. `findUnique` on the compound unique is index-perfect; `count` would do a wider scan with no benefit.
- **DO NOT** remove the `currentDay >= 1` guard. Pre-start cohorts will hit this path and would otherwise execute a guaranteed-null query (and, depending on Prisma version, log a noisy warning).
- **DO NOT** modify `getHeatmapData` or `get-heatmap-data.ts`. Heatmap is the reference truth here — the dashboard was the liar.
- **DO NOT** add a new index to the schema. `Submission_enrollmentId_dayNumber_key` already exists.
- **DO NOT** delete the `formatInTimeZone` or `IST` imports unless `grep -n "formatInTimeZone\|\\bIST\\b" src/features/dashboard/get-dashboard-data.ts` shows zero remaining matches after Step 2. (After Step 2 they should both be unused, but verify before pruning.)

## 7. DB safety
Not applicable — read-only query change, no schema or data writes.

## 8. Verification

### Pre-flight
- `npx tsc --noEmit` must pass.
- Lint must pass.
- Build must succeed.

### Repro test (the reported bug)
1. Seed: a user on currentDay 6 with submissions for Days 1–3 and no submissions for Days 4, 5, 6. (Easiest to construct: pick a test user, manually set `Enrollment.startedAt` to 5 days ago in IST via Prisma Studio, leave Days 4–5 with no submissions.)
2. Log in as that user, open `/dashboard`. Today's task card for Day 6 SHOULD be visible.
3. From the heatmap, click Day 5 → "Submit now" → complete the GitHub + LinkedIn flow.
4. Repeat for Day 4.
5. Return to `/dashboard`. **Expected: Today's task card for Day 6 is STILL visible.** Before the fix, it was hidden.
6. Heatmap: Days 4 and 5 are green; Day 6 is the same "future/today" state as before backfilling.
7. Complete Day 6 normally. Today's task card now hides (correct on-time happy path — no regression).

### Regression matrix (no behavior change for these)
| Scenario | Expected |
|---|---|
| User completes today's task and reloads `/dashboard` | Today's task card hides (`isTodayCompleted = true` because a row for `currentDay` exists). Unchanged. |
| User has no submissions yet, currentDay = 1 | Today's task card shows. `isTodayCompleted = false`. |
| User on Day 1 of CLAUDE cohort, pre-start (currentDay = 0) | The pre-start dashboard component handles this branch (per existing logic). The new `currentDay >= 1` guard short-circuits the submission lookup; `isTodayCompleted = false`, which the pre-start branch ignores anyway. |
| User completed all 60 days (`enrollment.status = COMPLETED`) | `isChallengeComplete` is true; today's task lookup is skipped regardless. Unchanged. |
| Admin reject-resubmit flow (user resubmits a past day today after admin rejected it) | `isTodayCompleted` no longer flips to true just because the resubmit happened today. Today's task card stays accurate for the current day. (This is also a strict improvement — same root cause, same fix.) |
| `recentSubmissions` ordering on dashboard | Still sorted by `submittedAt desc` — unaffected. |
| Heatmap | Unchanged. |

### Files that should have changed
- `src/features/dashboard/get-dashboard-data.ts`

Nothing else. If `git diff --name-only` shows changes to any other file, STOP and review.

## 9. Commit message

```
fix(dashboard): isTodayCompleted no longer counts past-day backfills as "today done"

isTodayCompleted was checking whether any Submission row was created on
today's IST calendar date. With the relaxation-window backfill (plan 004),
users now legitimately create submissions today for past days (Day 4 / Day 5
backfilled on Day 6), which was making the dashboard hide today's task card
even though no Day 6 submission existed. Heatmap was correct.

Replace the timestamp-based proxy with a direct lookup for a Submission row
keyed by (enrollmentId, currentDay). Pre-start (currentDay = 0) is guarded
to skip the query. No schema change.
```
