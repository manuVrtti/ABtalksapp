# 016 — Admin Referrals section (date-ranged referrer report + drill-down + CSV)

> New admin section. No schema change. Branch:
> `git checkout -b feature/admin-referrals`.
>
> Decisions locked: referral count = **all sign-ups via the code** (every
> `Referral` row) in the date range; clicking a student drills into **whom they
> referred within the same range**; include an **Export CSV** of the filtered
> list. Dates are **IST** calendar days.

## 1. Goal
Add `/admin/referrals` where an admin picks a date range (e.g. 19 Jun 2026 →
20 Jun 2026) and sees each referrer's name + how many people signed up with
their code in that window, sorted high→low, with a click-through to the exact
list of who they referred, plus a CSV export.

## 2. Context / current behavior
- `prisma/schema.prisma` `Referral`: `referrerId`, `referredId` (unique),
  `rewardGiven`, `createdAt`; `@@index([referrerId])`. A row is created at
  registration when the new user used a code (`completeRegistration`);
  `rewardGiven` flips true when the referred user reaches Day 7. So "sign-ups
  via code in range" = `Referral` rows with `createdAt` in the IST window.
- Admin shell: `src/app/admin/layout.tsx` defines `navItems`;
  `src/components/admin/admin-sidebar.tsx` has the `IconName` union + `iconMap`.
  Current items: Overview, Students, Submissions, Jobs, Content, Analytics,
  Campus Ambassadors. No Referrals.
- CSV pattern: `src/lib/csv.ts` (`toCSV`/`downloadCSV`) + a server action
  returning `Record<string, …>[]` + a client `useTransition` button (see
  `students-filters.tsx`). Admin export actions live in
  `src/app/actions/admin-export-actions.ts`.
- IST helpers in `src/lib/date-utils.ts`: `parseCalendarKeyToUtcDate(key)`
  returns **UTC** midnight for the key (NOT IST) — so it is the wrong tool for a
  createdAt range. `date-fns-tz@3` is installed and provides `fromZonedTime`,
  which converts an IST wall-time to the correct UTC instant. Use that.
- `requireAdmin()` gates admin pages/actions; `/admin/*` is already protected by
  middleware via the `AdminLayout`.

## 3. Files to touch

**New files**
- `src/features/admin/get-referrals-report.ts` `[new]` — server reads:
  `getReferrersInRange(range)` (grouped counts) and
  `getReferredByUser(referrerId, range)` (drill-down list).
- `src/app/admin/referrals/page.tsx` `[new]` — Server Component; list or
  drill-down based on searchParams.
- `src/components/admin/referrals-filters.tsx` `[new]` — Client; the date-range
  inputs + Apply/Clear + Export CSV button.

**Edited files**
- `src/lib/date-utils.ts` `[edit]` — add `istDateRangeToUtc(startKey?, endKey?)`
  helper (IST-inclusive → UTC `{ startUtc?, endExclusiveUtc? }`).
- `src/app/actions/admin-export-actions.ts` `[edit]` — add
  `getReferrersForExport(range)`.
- `src/app/admin/layout.tsx` `[edit]` — add the Referrals nav item.
- `src/components/admin/admin-sidebar.tsx` `[edit]` — add `referrals` to
  `IconName` + `iconMap` (icon `Gift`).

**Not touched**
- `prisma/schema.prisma` — no change. `middleware.ts` — `/admin` already gated.

## 4. Server vs Client
- `get-referrals-report.ts`, `admin-export-actions.ts` — **Server-only** /
  Server Action (`requireAdmin`). `select`/`groupBy` only.
- `referrals/page.tsx` — **Server**. Validates the `start`/`end`/`referrer`
  searchParams; renders the table or drill-down.
- `referrals-filters.tsx` — **Client** (`useTransition` for the CSV button,
  controlled date inputs). Receives the current `start`/`end` as **plain
  strings**; no Date/function/icon crosses the boundary.
- Drill-down rows are `<Link>`s (server-rendered); the CSV maps to plain
  string/number records.

## 5. Step-by-step changes

### 5.1 `src/lib/date-utils.ts` (edit) — IST range helper
```ts
import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
// (IST already defined as "Asia/Kolkata")

/** Inclusive IST calendar range [startKey 00:00 IST, endKey 24:00 IST) → UTC
 *  instants for a createdAt filter. Either bound may be omitted (open-ended). */
export function istDateRangeToUtc(
  startKey?: string,
  endKey?: string,
): { startUtc?: Date; endExclusiveUtc?: Date } {
  const startUtc = startKey
    ? fromZonedTime(`${startKey}T00:00:00`, IST)
    : undefined;
  let endExclusiveUtc: Date | undefined;
  if (endKey) {
    // day AFTER endKey at 00:00 IST → makes endKey fully inclusive
    const nextKey = formatInTimeZone(
      addDays(parseCalendarKeyToUtcDate(endKey), 1),
      "UTC",
      "yyyy-MM-dd",
    );
    endExclusiveUtc = fromZonedTime(`${nextKey}T00:00:00`, IST);
  }
  return { startUtc, endExclusiveUtc };
}
```
- This is the correct IST→UTC conversion (avoids the 5:30 offset and month-end
  off-by-one bugs). Centralizing it in `date-utils` follows the IST rule.

### 5.2 `src/features/admin/get-referrals-report.ts` (new)
```ts
import { prisma } from "@/lib/db";
import { istDateRangeToUtc } from "@/lib/date-utils";

type Range = { startKey?: string; endKey?: string };

export type ReferrerRow = {
  userId: string;
  fullName: string;
  email: string;
  referralCount: number;
};

export async function getReferrersInRange(range: Range): Promise<ReferrerRow[]> {
  const { startUtc, endExclusiveUtc } = istDateRangeToUtc(range.startKey, range.endKey);
  const createdAt =
    startUtc || endExclusiveUtc
      ? { ...(startUtc ? { gte: startUtc } : {}), ...(endExclusiveUtc ? { lt: endExclusiveUtc } : {}) }
      : undefined;

  const grouped = await prisma.referral.groupBy({
    by: ["referrerId"],
    where: createdAt ? { createdAt } : {},
    _count: { _all: true },
    orderBy: { _count: { referrerId: "desc" } },
    take: 500,
  });
  if (grouped.length === 0) return [];

  const ids = grouped.map((g) => g.referrerId);
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, email: true, studentProfile: { select: { fullName: true } } },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  return grouped.map((g) => {
    const u = byId.get(g.referrerId);
    return {
      userId: g.referrerId,
      fullName: u?.studentProfile?.fullName?.trim() || u?.email || "Unknown",
      email: u?.email ?? "",
      referralCount: g._count._all,
    };
  });
}

export type ReferredRow = {
  userId: string;
  fullName: string;
  email: string;
  domain: string | null;
  signedUpAt: Date;
  rewardGiven: boolean;
  daysCompleted: number;
};

export async function getReferredByUser(
  referrerId: string,
  range: Range,
): Promise<{ referrer: { fullName: string; email: string } | null; rows: ReferredRow[] }> {
  const { startUtc, endExclusiveUtc } = istDateRangeToUtc(range.startKey, range.endKey);
  const createdAt =
    startUtc || endExclusiveUtc
      ? { ...(startUtc ? { gte: startUtc } : {}), ...(endExclusiveUtc ? { lt: endExclusiveUtc } : {}) }
      : undefined;

  const [referrerUser, referrals] = await Promise.all([
    prisma.user.findUnique({
      where: { id: referrerId },
      select: { email: true, studentProfile: { select: { fullName: true } } },
    }),
    prisma.referral.findMany({
      where: { referrerId, ...(createdAt ? { createdAt } : {}) },
      orderBy: { createdAt: "desc" },
      select: {
        rewardGiven: true,
        createdAt: true,
        referred: {
          select: {
            id: true,
            email: true,
            studentProfile: { select: { fullName: true, domain: true } },
            enrollments: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { daysCompleted: true },
            },
          },
        },
      },
    }),
  ]);

  const rows: ReferredRow[] = referrals.map((r) => ({
    userId: r.referred.id,
    fullName: r.referred.studentProfile?.fullName?.trim() || r.referred.email || "Unknown",
    email: r.referred.email,
    domain: r.referred.studentProfile?.domain ?? null,
    signedUpAt: r.createdAt,
    rewardGiven: r.rewardGiven,
    daysCompleted: r.referred.enrollments[0]?.daysCompleted ?? 0,
  }));

  return {
    referrer: referrerUser
      ? { fullName: referrerUser.studentProfile?.fullName?.trim() || referrerUser.email || "Unknown", email: referrerUser.email }
      : null,
    rows,
  };
}
```
- `select`/`groupBy` only (no `include`). The `referred` relation name comes
  from the schema (`Referral.referred`).

### 5.3 `src/app/actions/admin-export-actions.ts` (edit)
```ts
export async function getReferrersForExport(range: { startKey?: string; endKey?: string }) {
  await requireAdmin();
  const rows = await getReferrersInRange(range);
  return rows.map((r) => ({
    Name: r.fullName,
    Email: r.email,
    "Referral Count": r.referralCount,
  }));
}
```
- `requireAdmin()` first (it redirects/throws — don't wrap it).

### 5.4 `src/components/admin/referrals-filters.tsx` (new, client)
- Two `<input type="date">` (start, end) seeded from the current `start`/`end`
  props; an **Apply** button → `router.push("/admin/referrals?start=…&end=…")`
  (omit empty params; resets to the list view, dropping any `referrer`); a
  **Clear** button → `/admin/referrals`.
- An **Export CSV** button: `useTransition` →
  `getReferrersForExport({ startKey, endKey })` → `toCSV` + `downloadCSV`
  (filename `abtalks-referrals-${startKey || "all"}_${endKey || "all"}-${today}.csv`).
  Toast on empty/success/failure (mirror `students-filters.tsx`). Warn nothing
  needed re cap.
- Validate the date strings are `yyyy-MM-dd` before pushing (native date input
  already yields that). No `<Button asChild>`.

### 5.5 `src/app/admin/referrals/page.tsx` (new, server)
- `searchParams`: `{ start?: string; end?: string; referrer?: string }`.
  Validate `start`/`end` against `^\d{4}-\d{2}-\d{2}$` (ignore if malformed).
- Heading "Referrals" (`text-2xl md:text-3xl font-display font-bold`) + a
  one-line description ("Sign-ups via referral code" + the active range, or
  "all time").
- Render `<ReferralsFilters start={start} end={end} />`.
- **List view** (no valid `referrer`): call
  `getReferrersInRange({ startKey, endKey })`. Render a responsive table
  (cards `< md`, `<Table>` `md+`, per the plan-003 pattern): columns
  **Student** (a `<Link href="/admin/referrals?referrer=<id>&start=&end=">`),
  **Email**, **Referral count**. Empty state: "No referrals in this range."
- **Drill-down view** (valid `referrer`): call
  `getReferredByUser(referrer, { startKey, endKey })`. Show a header
  "{referrer.fullName} — referred {rows.length}" + a "← Back to referrers"
  link (preserving `start`/`end`), then a table of the referred users:
  **Student** (link to `/admin/students/<userId>`), **Email**, **Domain**,
  **Signed up** (`formatDateTimeIST(signedUpAt)`), **Reached Day 7?**
  (`rewardGiven` → Yes/No badge), **Days completed**. Empty state:
  "No referrals from this student in this range."

### 5.6 Sidebar wiring
- `admin/layout.tsx`: add `{ href: "/admin/referrals", label: "Referrals", icon: "referrals" as const }` to `navItems` (place after "Campus Ambassadors" or near "Students").
- `admin-sidebar.tsx`: add `"referrals"` to the `IconName` union and
  `referrals: Gift` to `iconMap` (import `Gift` from `lucide-react`).

## 6. Guardrails for Cursor (DO NOT)
- DO NOT use `parseCalendarKeyToUtcDate` for the createdAt range — it's UTC
  midnight, not IST. Use the new `istDateRangeToUtc` (built on
  `fromZonedTime`). The range must be **IST-inclusive on both ends**
  (endKey fully included via the exclusive next-day bound).
- DO NOT count `rewardGiven` for the headline count — the count is **all**
  `Referral` rows in range (sign-ups). `rewardGiven` only appears as a
  Yes/No column in the drill-down.
- DO NOT use `include` — `select`/`groupBy` only. No `any` (the row types are
  concrete).
- DO NOT add `requireRole`/`requireAdmin` anywhere new beyond the existing
  admin gating; `requireAdmin()` already guards the export action and the
  `AdminLayout` guards the page. Do not touch `middleware.ts`.
- DO NOT pass Dates/functions/icons across the Server→Client boundary —
  `ReferralsFilters` gets `start`/`end` strings only; format dates server-side.
- DO NOT use `<Button asChild>` / `<Button render={<Link>}>` — `buttonVariants`
  on `<Link>`.
- DO NOT create a new CSV helper — reuse `lib/csv.ts`.
- DO NOT log via `console.*` — `lib/logger.ts` for any caught errors.
- DO NOT add pagination/heavy infra — at v1 scale (≤1,500 students) the grouped
  query + `take: 500` is sufficient.

## 7. DB safety
Not applicable — no schema or data change. The grouped query is index-friendly
(`Referral` has `@@index([referrerId])`; `createdAt` filter is a range scan at
small scale).

## 8. Verification
Manual (local, `ENABLE_DEV_AUTH=true`). The seed has **Dhruv** with 3 referrals
to Arjun/Priya/Rohan.
1. `npm run dev`. As `admin@abtalks.dev`, the sidebar shows **Referrals** →
   `/admin/referrals`.
2. **All-time (no dates):** the list shows Dhruv with referral count 3 (and any
   other referrers), sorted by count desc.
3. Click **Dhruv** → drill-down lists Arjun, Priya, Rohan with their email,
   domain, signed-up time (IST), Day-7 reward status, and days completed.
   "Back to referrers" returns to the list with the range preserved.
4. **Date range:** set start/end around the seed sign-up date (the day you
   seeded) → Dhruv still appears; set a range that excludes it → the list is
   empty ("No referrals in this range"). Confirm an end date of the sign-up day
   is **inclusive** (IST), and a range entirely before/after excludes correctly
   (verifies the IST boundary math, not off by 5:30/one day).
5. **Export CSV** → downloads the current filtered list (Name, Email, Referral
   Count). Empty range → toast "nothing to export".
6. **Responsive:** at 390px the tables render as cards; sidebar reachable via
   the mobile drawer.
7. **Build/typecheck:** `npm run lint`, `npm run build`, `tsc --noEmit` clean.

Files that should change (and only these): the 3 new files + the 4 edited files
in §3.

## 9. Commit message
```
feat(admin): referrals report with IST date range, drill-down, CSV

Adds /admin/referrals: per-referrer sign-up counts (all Referral rows) within an
IST-inclusive date range, sorted high→low, with a click-through to exactly who
each student referred in that range (name, domain, signed-up time, Day-7 reward
status, days completed) and a CSV export of the filtered list. New
istDateRangeToUtc helper (fromZonedTime) for correct IST→UTC range bounds. No
schema change.
```
