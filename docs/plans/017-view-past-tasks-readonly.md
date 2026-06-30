# 017 — View any past task read-only from the heatmap

> UI/behavior change. No schema, no change to submission rules. Branch:
> `git checkout -b feature/view-past-tasks`.
>
> Decision locked: clicking a past unlocked day in the heatmap opens the **full
> task page** (`/challenge/[day]`) in **read-only** mode showing the complete
> content; the 5-day submission window is unchanged (submit still works only
> for the current day, the 5-day catch-up window, rejected/resubmit days, and
> editing an existing submission). Future days stay locked.

## 1. Goal
Let students review the complete content of any past day they've unlocked
(missed or completed) by clicking it in the dashboard heatmap — without
loosening who can *submit*.

## 2. Context / current behavior
- `src/app/challenge/[day]/page.tsx` loads `getDayData(userId, day, enrollment)`
  and renders the task. **The blocker:** lines ~178–187 redirect the student to
  the dashboard (`?toast=past-missed`) whenever a day is past, unsubmitted, not
  a reject-resubmit, and not relaxable:
  ```ts
  if (!data.existingSubmission && day < data.currentDayNumber
      && !data.hasRejectResubmit && !data.isRelaxable) {
    redirect(`/dashboard?toast=past-missed&challenge=…`);
  }
  ```
  So past missed days outside the 5-day window can't be viewed on the full page.
- `getDayData` (`src/features/challenge/get-day-data.ts`) already returns the
  **full task** (incl. rich `dayContent`) plus the flags
  `isUnlocked`, `isRelaxable`, `hasRejectResubmit`, `existingSubmission`,
  `currentDayNumber` — for any day. Only the page-level redirect blocks viewing.
- The page renders one of: the rich `DayPage`
  (`src/components/challenge/day-page.tsx`) when `dayContent` exists; a
  "completed" summary card when there's a submission but no `dayContent`; or the
  legacy `SubmissionFlow` (`src/app/challenge/[day]/submission-flow.tsx`)
  otherwise. **Both `DayPage` and `SubmissionFlow` always render a submit box.**
- The heatmap (`src/components/dashboard/submission-heatmap.tsx`) already makes
  `on_time/late/rejected/missed` cells clickable and opens a dialog with the
  problem statement + meta. Dialog footer links exist only for
  `missed && isRelaxable` ("Submit now") and `rejected` ("Resubmit"); there is
  **no link** for missed-outside-window or completed cells to open the full
  task page.
- Submission rules are enforced server-side in
  `assertPastDaySubmittable`/`submitDay` (5-day relaxation window). **Those stay
  the source of truth and must not change.**

## 3. Files to touch
- `src/app/challenge/[day]/page.tsx` `[edit]` — remove the past-missed redirect;
  compute a `canSubmit` flag; render read-only when false; pass `canSubmit` to
  `DayPage`/`SubmissionFlow`.
- `src/components/challenge/day-page.tsx` `[edit]` — add a `canSubmit?: boolean`
  prop; when false, replace the submission card with a "window closed" notice
  (keep all content sections visible).
- `src/app/challenge/[day]/submission-flow.tsx` `[edit]` — add a
  `canSubmit?: boolean` prop; when false, show the problem + the same notice
  instead of the submit form.
- `src/components/dashboard/submission-heatmap.tsx` `[edit]` — add a "View task"
  link in the dialog for past clickable cells that currently lack a navigation
  link (missed-outside-window, on_time, late).

**Not touched**
- `src/features/submission/submit-day.ts`, the relaxation window, `getDayData`,
  schema, `middleware.ts`. The submit rule is unchanged.
- `src/components/dashboard/past-missed-challenge-toast.tsx` — leave it (just no
  longer triggered from this route).

## 4. Server vs Client
- `challenge/[day]/page.tsx` — **Server**. Computes `canSubmit` (a boolean) and
  passes it to the client components. Only primitives cross the boundary.
- `day-page.tsx`, `submission-flow.tsx`, `submission-heatmap.tsx` — already
  **Client**. New `canSubmit` is a boolean prop; the heatmap "View task" link is
  a server-rendered `<Link>` inside the client dialog (string href). No
  Date/function/icon crosses the boundary.

## 5. Step-by-step changes

### 5.1 `src/app/challenge/[day]/page.tsx`
1. **Delete the redirect block** (lines ~178–187). Past unlocked days now render
   instead of bouncing to the dashboard.
2. Keep the existing **"not yet unlocked"** branch (lines ~143–176) exactly —
   future/locked days must still be blocked. (`isUnlocked = day <= currentDay`.)
3. Compute submittability (UI gate; the server still enforces the real rule):
   ```ts
   const canSubmit =
     bypassEnabled ||
     (data.isUnlocked &&
       (day >= data.currentDayNumber ||      // today
        data.isRelaxable ||                  // within the 5-day catch-up window
        data.hasRejectResubmit ||            // admin rejected → resubmit
        data.existingSubmission != null));   // already submitted → may edit
   ```
   (`bypassEnabled` = existing `isDayLockBypassEnabled()` dev flag — preserves
   current dev behavior.)
4. Pass `canSubmit` to both render paths:
   - `<DayPage … canSubmit={canSubmit} />`
   - `<SubmissionFlow … canSubmit={canSubmit} />`
   The "completed summary card" branch (submission && no `dayContent`) is
   already read-only — leave it.

### 5.2 `src/components/challenge/day-page.tsx`
- Add `canSubmit?: boolean` to `Props` (default `true` to preserve callers).
- When `canSubmit === false`: **do not render** the submission card (the GitHub/
  LinkedIn inputs, the confirmation checkbox, the submit button, and the
  "add proof" hint). Instead render a small notice card in its place:
  > "Submissions for this day are closed. You're viewing it for reference."
  - If `existingSubmission` is present, show the submitted GitHub/LinkedIn links
    read-only above the notice (optional, nice-to-have).
- All the task content sections (learning objectives, tool of the day, task
  steps, prompt template, resources, engagement, deliverable, solution video)
  render unchanged regardless of `canSubmit`.
- Keep the current behavior intact when `canSubmit === true`.

### 5.3 `src/app/challenge/[day]/submission-flow.tsx`
- Add `canSubmit?: boolean` (default `true`).
- When `false`: render the problem statement (as today) but replace the submit
  form/card with the same "Submissions for this day are closed — viewing for
  reference" notice. The "submit early earns more synergy" tip is irrelevant
  here — hide it when `!canSubmit`.

### 5.4 `src/components/dashboard/submission-heatmap.tsx`
- In the dialog footer, add a **"View task"** `<Link>` (styled with
  `buttonVariants({ variant: "outline" })`) to
  `/challenge/${active.dayNumber}${challengeEnrollmentId ? "?challenge=" + encodeURIComponent(challengeEnrollmentId) : ""}`
  for cells that currently have no navigation link:
  - `missed && !isRelaxable` (the key gap),
  - `on_time` and `late` (so completed days can reopen the full task page).
  Keep the existing "Submit now" (missed && isRelaxable) and "Resubmit"
  (rejected) links as-is — those already navigate to the page. Close button
  stays.
- `future` cells remain non-clickable (no change).

## 6. Guardrails for Cursor (DO NOT)
- DO NOT change `submit-day.ts`, `assertPastDaySubmittable`, or the relaxation
  window. The 5-day submission rule is unchanged — `canSubmit` is a UI gate
  only; the server stays the source of truth (it already rejects out-of-window
  submits).
- DO NOT make future/locked days viewable — keep the existing "not yet
  unlocked" branch and the `isUnlocked` gate. Only PAST unlocked days become
  read-only viewable.
- DO NOT delete `past-missed-challenge-toast.tsx` or other components; just
  remove the redirect that fired it from this route.
- DO NOT pass functions, Dates, or icons across the Server→Client boundary —
  `canSubmit` is a boolean; the heatmap link is a string href.
- DO NOT use `<Button asChild>` / `<Button render={<Link>}>` — `buttonVariants`
  on `<Link>`.
- DO NOT change `getDayData` or the schema. No `any`.
- DO NOT log via `console.*`.
- Keep `canSubmit` default `true` in `DayPage`/`SubmissionFlow` so any other
  caller is unaffected.

## 7. DB safety
Not applicable — no schema or data change.

## 8. Verification
Manual (local, `ENABLE_DEV_AUTH=true`). Use a user with past missed days
outside the 5-day window (e.g. `karan@abtalks.dev`, Day 45 with a broken
streak, or `anika@abtalks.dev`, Day 30).
1. `npm run dev`, log in, open `/dashboard`.
2. In the heatmap, click a **missed day from long ago** (outside the 5-day
   window): the dialog now shows a **"View task"** link → it opens the full
   `/challenge/[day]` page (no redirect to dashboard), rendering all content
   sections, with a "Submissions for this day are closed — viewing for
   reference" notice instead of the submit box.
3. Click a **completed (green) day**: "View task" opens its full page read-only
   (or editable if you allow editing existing submissions); content visible.
4. Click a **missed day inside the 5-day window**: "Submit now" still works —
   the submit box is present and a submission succeeds (rule unchanged).
5. Open a **future** day's URL directly (e.g. `/challenge/60`): still shows
   "Day N is not yet unlocked" (future stays locked).
6. Attempt to submit an out-of-window past day via devtools/refresh: the server
   still rejects it (`assertPastDaySubmittable`), confirming the rule is intact.
7. **Build/typecheck:** `npm run lint`, `npm run build`, `tsc --noEmit` clean.

Files that should change (and only these): the 4 files in §3.

## 9. Commit message
```
feat(challenge): view any past task read-only from the heatmap

Removes the past-missed redirect so students can open any past unlocked day's
full task page (rich content) for reference. Adds a canSubmit UI gate: days
outside the 5-day submission window render read-only with a "submissions closed"
notice instead of the submit box, and the heatmap dialog gains a "View task"
link for missed-outside-window and completed days. Submission rules are
unchanged — the server still enforces the 5-day window; future days stay locked.
```
