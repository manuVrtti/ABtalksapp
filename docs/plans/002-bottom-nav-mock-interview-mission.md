# 002 — Bottom navigation bar + Mock Interview + Our Mission

## 1. Goal
Add a mobile bottom navigation bar (`Home / Mock Interview / Our Mission /
Profile`) shown on authenticated app routes; surface the same destinations
on desktop through the existing top header (Mock Interview as a header link,
Our Mission as a profile-dropdown item); and ship two new authed pages
behind those tabs — `/mock-interview` (gated message until the student has
finished 60 days without missing a day) and `/mission` (the brand mission
copy). All work happens on a new branch `feature/bottom-navigation`.

## 2. Context / current behavior
- Today, navigation lives entirely in `src/components/shared/app-header.tsx`
  — a sticky top bar with the ABTalks logo, an optional challenge switcher,
  an optional Admin pill, the theme toggle, and an avatar dropdown
  containing `Profile`, `Report an Issue`, `Logout`.
- The root layout (`src/app/layout.tsx`) is global chrome: `ThemeProvider`,
  `main`, `AppFooter`, `Toaster`. It does not render the header — every
  page mounts `<AppHeader />` itself (see `app/dashboard/page.tsx`,
  `app/profile/page.tsx`, etc.).
- `middleware.ts` gates routes via a `protectedPaths` array
  (`/dashboard`, `/challenge`, `/profile`, `/quiz`, `/register`, `/admin`).
  It is edge-safe and only imports `next-auth`, `next/server`, and
  `@/auth.config` — preserve that invariant.
- There is **no** `/mock-interview` or `/mission` route today.
- Mobile experience: the top header collapses the user name/email and uses
  smaller avatar but otherwise looks the same on phones. There is no
  bottom-tab pattern in the app yet.

## 3. Files to touch

**New files**
- `src/components/shared/bottom-nav.tsx` `[new]` — Client component. The
  four-tab bottom navigation. Uses `usePathname` to highlight the active
  tab. Lucide icons live inside this client file (not passed as props).
- `src/components/shared/bottom-nav-gate.tsx` `[new]` — Server component.
  Calls `auth()`; renders `<BottomNav />` only when there's a session.
  Hidden on `/login`, `/register`, the public landing, `/claude-signup`,
  and `/students/*` (those are pre-/post-auth public surfaces).
- `src/app/mock-interview/page.tsx` `[new]` — Server Component. Loads the
  user's active enrollment and checks eligibility (see §5.5). Renders the
  locked-state copy (default) or the eligible-state copy.
- `src/app/mission/page.tsx` `[new]` — Server Component. Renders the brand
  mission copy in §5.4 inside the app shell (AppHeader on top, same page
  background pattern as `/profile`).
- `src/features/mock-interview/check-eligibility.ts` `[new]` — Server
  module. Exports `getMockInterviewEligibility(userId, activeEnrollmentId)`
  which returns a discriminated union of states (LOCKED, IN_PROGRESS,
  ELIGIBLE — see §5.5). Lives next to other `features/<domain>/`
  read-side modules.

**Edited files**
- `src/app/layout.tsx` `[edit]` — Render `<BottomNavGate />` as a sibling
  of `<AppFooter />` so it appears on every page that should have it.
  Add bottom padding utility on `<main>` so fixed-position bottom nav
  doesn't cover content on mobile.
- `src/components/shared/app-header.tsx` `[edit]` — On desktop (`md+`),
  add a `Mock Interview` link in the header next to (or replacing) the
  challenge switcher area. Add an `Our Mission` `DropdownMenuItem` inside
  the avatar dropdown. On mobile (`< md`), hide the `Profile` and
  `Our Mission` items from the avatar dropdown (Profile lives in the
  bottom bar; Our Mission lives in the bottom bar too) — keep `Report
  an Issue` and `Logout` visible on mobile.
- `middleware.ts` `[edit]` — Add `"/mock-interview"` and `"/mission"` to
  `protectedPaths`. **Edge-safe — do not import `@/lib/*` here.**

**Not touched**
- `prisma/schema.prisma`, any migrations — no schema work.
- `src/auth.ts`, `src/auth.config.ts` — no auth changes.
- `src/features/admin/*`, `src/app/admin/*` — admin remains as-is; the
  bottom nav simply renders on top per your answer to Q4.

## 4. Server vs Client
- `BottomNav` — **Client** (`"use client"`). Needs `usePathname` to mark
  the active tab and Lucide icons.
- `BottomNavGate` — **Server**. Reads `auth()` and the current pathname
  via `headers()` (read `x-invoke-path` or use a different mechanism — see
  §5.2). Passes only **plain props** (boolean `show`, string `pathname`)
  to `BottomNav`. No icons, functions, or Date objects across the boundary.
- `MockInterviewPage`, `MissionPage` — **Server**. Standard Server
  Components, same shape as `app/profile/page.tsx`.
- `check-eligibility.ts` — **Server-only** module (Prisma).
- `AppHeader` — already `"use client"`; changes stay inside it. The new
  Mock Interview link and Our Mission dropdown item are inline `<Link>`
  + `<DropdownMenuItem>` calls; no new props from the server.

**Server → Client prop discipline:** `BottomNavGate` (server) → `BottomNav`
(client) passes `{ pathname: string }`. Nothing else. No icons, no session
object, no functions.

## 5. Step-by-step changes

### 5.0 Create the branch (Cursor — run first)
```bash
git checkout -b feature/bottom-navigation
git status   # confirm clean tree before starting
```

### 5.1 `src/components/shared/bottom-nav.tsx` (new, client)
- `"use client"` at top.
- Imports: `Link` from `next/link`, `usePathname` from `next/navigation`,
  `cn` from `@/lib/utils`, four Lucide icons: `Home`, `Mic`, `Compass`,
  `User`.
- Define tab list (string array of `{ href, label, icon }`). Keep icon
  references INSIDE this file — do not accept icons as props.
  - `{ href: "/dashboard", label: "Home", Icon: Home }`
  - `{ href: "/mock-interview", label: "Mock Interview", Icon: Mic }`
  - `{ href: "/mission", label: "Our Mission", Icon: Compass }`
  - `{ href: "/profile", label: "Profile", Icon: User }`
- Active-tab logic: a tab is active when `pathname === tab.href` OR
  `pathname.startsWith(tab.href + "/")` — so `/challenge/12` keeps **Home**
  active (challenge belongs to the home/dashboard flow). Mock Interview,
  Mission, Profile match their own subtree only.
- Styling:
  - Outer: `fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/95 backdrop-blur md:hidden`.
  - Inner: `mx-auto grid max-w-6xl grid-cols-4`.
  - Each tab: `flex flex-col items-center justify-center gap-1 py-2 text-xs`,
    `text-muted-foreground` by default, `text-primary` when active.
  - Icon size `size-5`. Label `text-[11px] font-medium`.
  - Add `aria-current="page"` on the active tab's `<Link>`.
- Safe-area: include `pb-[env(safe-area-inset-bottom)]` on the outer
  container for iOS notch / home-bar.

### 5.2 `src/components/shared/bottom-nav-gate.tsx` (new, server)
- Plain server module — no `"use client"`.
- Imports: `auth` from `@/auth`, `headers` from `next/headers`,
  `BottomNav` from `./bottom-nav`.
- Pseudocode:
  ```ts
  export async function BottomNavGate() {
    const session = await auth();
    if (!session?.user?.id) return null;
    const h = await headers();
    const pathname = h.get("x-pathname") ?? "/";
    // Pages where the bottom nav must NOT appear even if logged in:
    const hidden = ["/login", "/register", "/claude-signup", "/students"];
    if (pathname === "/" || hidden.some((p) => pathname.startsWith(p))) {
      return null;
    }
    return <BottomNav pathname={pathname} />;
  }
  ```
- For `x-pathname`: Next.js 15/16 does not surface pathname via
  `headers()` by default. Two acceptable approaches; pick (b):
  - (a) Set it from middleware: in `middleware.ts`, copy the request
    pathname into a response header `x-pathname`. Edge-safe; no `@/lib/*`
    needed.
  - **(b) Preferred:** make `BottomNav` itself the gatekeeper for "which
    page" by using `usePathname` client-side, and let `BottomNavGate` only
    decide "is there a session at all." That keeps the server component
    trivial and avoids any header plumbing. Update §5.1 accordingly:
    inside `BottomNav` add an early-return when `pathname === "/" ||
    /^\/(login|register|claude-signup|students)/.test(pathname)`. The
    component will still mount but render nothing in those routes.
  - **Go with (b).** The server gate then becomes a one-liner:
    ```ts
    export async function BottomNavGate() {
      const session = await auth();
      if (!session?.user?.id) return null;
      return <BottomNav />;
    }
    ```
    No props passed across the boundary. ✅

### 5.3 `src/app/layout.tsx` — wire it in
- Import: `import { BottomNavGate } from "@/components/shared/bottom-nav-gate";`.
- Add bottom padding to `<main>` so content isn't covered by the fixed bar
  on mobile: `<main className="flex-1 pb-16 md:pb-0">{children}</main>`.
- Render `<BottomNavGate />` AFTER `<AppFooter />` (so it sits above the
  footer in the DOM, but the footer doesn't render on the same fold as
  the bar in practice). Keep ordering: `main` → `AppFooter` →
  `BottomNavGate` → `Toaster`.
- The component is `async` (Server Component). Wrap it in
  `<Suspense fallback={null}>` so its `auth()` call doesn't block the
  initial render of the rest of the layout.

### 5.4 `src/app/mission/page.tsx` (new, server)
- Mirror the shell shape of `app/profile/page.tsx`: `redirect("/login")`
  if no session, fetch the session user, render `<AppHeader user={...} />`
  on top, then a centered `<main>` with the mission content.
- Use Server Component (no `"use client"`).
- **Exact copy** (`react-markdown` is already a dep — use it if you want,
  but plain JSX is simpler and equivalent here). Headings use
  `font-display`, body uses default sans:
  ```
  Why ABTalks exists

  Talent isn't the problem. Proof is.

  Too many students pour months into internships that pay nothing — or
  worse, ones they have to pay to join — and still come out without a
  real path to a first job. On the other side, recruiters are hiring
  half-blind: a resume can't tell them who genuinely knows their craft.
  Two real problems, one missing bridge.

  ABTalks is that bridge — a community run by students, for students,
  founded by Anil Bajpai after watching capable people get overlooked
  and undervalued.

  How it works

  Pick your track — AI, Data Science, or Software Engineering — and
  commit to 60 days. Every day you build, push your work to GitHub, and
  share your progress in public, tagging us so the community can follow
  along and verify it's real. Working in the open is the whole point:
  it forces you to actually grow, and it leaves behind a track record
  anyone can check.

  What you're working toward

  Complete the 60 days and you move into mock interviews to get you
  sharp and confident. From there you become visible to the HRs and
  leaders in our network — and they reach out to you. No applications
  shouted into the void.

  You're not doing it alone

  ABTalks is students lifting each other up. Our Discord runs weekly
  communication practice and plenty more — with a lot still on the way.
  Show up, do the work in public, and let it speak for you.
  ```
- Layout: `mx-auto max-w-3xl px-4 py-8 sm:py-12 space-y-8`. Each section
  is a `<section>` with `<h2 className="font-display text-2xl font-semibold tracking-tight">`
  and one or two `<p className="text-base leading-relaxed text-muted-foreground">`
  paragraphs.
- Above the first heading, add a small kicker:
  `<p className="text-sm font-medium uppercase tracking-wider text-primary">Our Mission</p>`.
- Wrap the whole thing in a `<Card>` (existing shadcn primitive) or keep
  the `bg-muted/30` page background like `/profile`. **Choose: bare
  sections inside `mx-auto max-w-3xl`**, no Card — reads more like
  editorial copy.
- The page has **no** action items, no CTAs, no images. Just the copy.
- Standard footer rendering inherited from the root layout.

### 5.5 `src/features/mock-interview/check-eligibility.ts` (new, server)
- Discriminated-union return type:
  ```ts
  export type MockInterviewEligibility =
    | { status: "NO_ENROLLMENT" }
    | { status: "IN_PROGRESS"; daysCompleted: number; totalDays: number }
    | { status: "MISSED_DAYS"; daysCompleted: number; missed: number }
    | { status: "ELIGIBLE"; completedAt: Date };
  ```
- `getMockInterviewEligibility(userId: string)`:
  1. Fetch the user's most-recent ACTIVE or COMPLETED enrollment (latest
     `startedAt`). If none → `NO_ENROLLMENT`.
  2. If `enrollment.status !== "COMPLETED"` → `IN_PROGRESS` with the
     enrollment's `daysCompleted` and `challenge.totalDays`.
  3. Enrollment is COMPLETED. Check **no missed days** rule. Since
     `daysCompleted` always equals the count of submission rows for the
     enrollment, "no missed days within their 60-day window" is
     equivalent to: the **maximum `dayNumber` across submissions equals
     `challenge.totalDays` (60)**.
     - Query: `prisma.submission.aggregate({ where: { enrollmentId }, _max: { dayNumber: true }, _count: { _all: true } })`.
     - If `maxDay === totalDays && count === totalDays` → `ELIGIBLE`
       (return `completedAt!`).
     - Else compute `missed = (maxDay ?? 0) - count` (number of skipped
       days inside their span) and return `MISSED_DAYS`.
  4. Always use `select` (or the aggregate above) — never full-record.
- **CLAUDE-cohort note:** for CLAUDE enrollments, `Challenge.startsAt`
  anchors Day 1 to a fixed IST date. The "no missed days" check above
  doesn't depend on the anchor (it only cares about submission
  dayNumbers vs. totalDays), so this rule works identically for CLAUDE
  and the rolling tracks. ✅
- Wrap any thrown logic; return the discriminated union, never throw
  across the boundary. Errors log via `lib/logger.ts`.
- **Multiple enrollments edge case** (a student now can have multiple
  via `enrollment-actions.ts`): if **any** of their enrollments meets
  the ELIGIBLE rule, return ELIGIBLE; otherwise pick the most-advanced
  one for the IN_PROGRESS / MISSED_DAYS message. Implement as: fetch
  all enrollments, evaluate each, prefer ELIGIBLE > IN_PROGRESS >
  MISSED_DAYS > NO_ENROLLMENT.

### 5.6 `src/app/mock-interview/page.tsx` (new, server)
- Same shell pattern as `/profile`: session check, redirect to `/login`
  if missing, render `<AppHeader user={...} />`, page main.
- Call `getMockInterviewEligibility(session.user.id)`.
- Render switch on `eligibility.status`:
  - `ELIGIBLE`: green tone card. Headline:
    *"You're eligible for mock interviews."* Body: *"You finished the
    60-day challenge without missing a day. Our team will reach out to
    you to schedule your first mock. Make sure your profile and resume
    link are up to date."* CTA: `Link` to `/profile` styled with
    `buttonVariants({ variant: "outline" })` — **never** use
    `<Button asChild>` or `<Button render={<Link>}>`.
  - `IN_PROGRESS`: neutral card. Headline:
    *"Mock interviews unlock after 60 days."* Body: *"Complete the 60-day
    challenge consistently — every day, without missing — to unlock mock
    interviews. You're on Day {daysCompleted} of {totalDays}."* Add a
    thin progress bar (`<div className="h-1.5 rounded-full bg-muted">` →
    inner `bg-primary` width `${(daysCompleted/totalDays)*100}%`).
  - `MISSED_DAYS`: amber tone. Headline: *"60 days completed — but with
    {missed} missed day{plural}."* Body: *"Mock interviews are reserved
    for students who finish the challenge without missing a single day.
    You can re-enroll in a fresh track to try again."*
  - `NO_ENROLLMENT`: same neutral as IN_PROGRESS. Headline:
    *"Start the challenge to unlock mock interviews."* CTA:
    `Link href="/register"` with `buttonVariants({ variant: "default" })`.
- Layout: `mx-auto max-w-2xl px-4 py-8 sm:py-12`, single centered Card,
  prose-style body. No fancy images.

### 5.7 `src/components/shared/app-header.tsx` — desktop integration
- Add a desktop-only inline link to Mock Interview, placed before the
  Admin pill / Theme toggle group:
  ```tsx
  <Link
    href="/mock-interview"
    className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
  >
    Mock Interview
  </Link>
  ```
- Add **active state**: import `usePathname` (component is already
  `"use client"`), compare against `/mock-interview`, apply
  `text-foreground` when active. Keep the comparison logic inline — do
  not extract a helper file.
- Inside the avatar dropdown content:
  - Existing items (in order, edited):
    1. `DropdownMenuLabel` (name + email) — unchanged.
    2. `DropdownMenuSeparator` — unchanged.
    3. `Profile` `DropdownMenuItem` — **wrap in `className="md:flex hidden"`**
       so it shows on desktop but hides on mobile (profile reachable via
       bottom bar on mobile).
    4. **NEW** `Our Mission` `DropdownMenuItem` (always visible, both
       breakpoints — copy says it goes in the dropdown on desktop AND it
       won't be reachable from anywhere else; mobile users reach it from
       the bottom bar but the dropdown link is harmless). Use the same
       `onClick={() => router.push("/mission")}` pattern as the existing
       Profile item.
    5. `Report an Issue` — unchanged.
    6. `Logout` (form action) — unchanged.
  - Hidden-on-mobile classNames must be applied via the existing
    `DropdownMenuItem`'s `className` prop. Confirm shadcn's
    `DropdownMenuItem` forwards `className` to the rendered element
    (it does in the project's shadcn setup).
- No new icons in the header. The `AlertCircle` import stays.

### 5.8 `middleware.ts` — gate the new routes
- Add two strings to `protectedPaths`:
  ```ts
  const protectedPaths = [
    "/dashboard",
    "/challenge",
    "/profile",
    "/quiz",
    "/register",
    "/admin",
    "/mock-interview",
    "/mission",
  ];
  ```
- **Do not** import anything from `@/lib/*`. Do not import the new
  `BottomNav*` files (they live under `@/components`, which would pull
  in client-component code into the edge bundle).
- Matcher remains unchanged.

## 6. Guardrails for Cursor (DO NOT)
- DO NOT import `@/lib/*`, `@/components/*`, `@/features/*`, or
  `@/auth` (the full Node config) into `middleware.ts`. Stay with
  `next-auth`, `next/server`, and `@/auth.config` only.
- DO NOT pass Lucide icons, functions, or Date objects from server to
  client. Keep icons inside `BottomNav` (client). `MockInterviewPage`
  (server) computes the eligibility object and renders plain text /
  classnames; the page itself is server — no icon prop crossing.
- DO NOT use `<Button asChild>` or `<Button render={<Link>}>` on the
  Mock Interview / Mission pages. Use `buttonVariants({ ... })` on a
  `<Link>` directly. (Standing rule.)
- DO NOT add `requireRole` / `requireAdmin` to `/mission` or
  `/mock-interview`. They're authed but role-agnostic — only the
  session check matters. (Public surfaces stay public; these two are
  authed-with-any-role.)
- DO NOT add any new abstraction file for trivial logic (e.g. no
  `lib/nav-items.ts`, no `lib/active-tab.ts`). Inline the tab list
  inside `BottomNav`.
- DO NOT throw across the result boundary. The eligibility module
  returns a discriminated union; no `throw new Error()` reaching the
  page. Log with `lib/logger.ts` if Prisma errors.
- DO NOT use `any`. The eligibility return type is the discriminated
  union from §5.5; the page does a `switch (state.status)` so each arm
  narrows.
- DO NOT alter `AppFooter`, the `ThemeProvider`, or the toaster.
- DO NOT introduce `console.log`/`console.error`. `lib/logger.ts` only.
- DO NOT compute IST day math inline. If anything needs day math
  (it shouldn't for this plan), go through `lib/date-utils.ts`.
- DO NOT touch `prisma/schema.prisma`, migrations, seed scripts, or
  `package.json` dependencies. Everything needed (`next/link`,
  `usePathname`, Lucide, shadcn primitives) is already installed.
- DO NOT commit before verifying the build passes. If something fails,
  trust the error and gather data — do not defend a prior choice.
- DO NOT widen the matcher in `middleware.ts`. Only add to
  `protectedPaths`.

## 7. DB safety
**Not applicable** — no schema changes, no migrations, no data writes.
The eligibility module is read-only (Prisma `aggregate` + `findMany`).

If Cursor catches a typecheck error that suggests a new field on
`StudentProfile` or `Enrollment` would simplify the eligibility check
(e.g. caching the result), **stop** — that's a separate plan. Do not
add columns inside this branch.

## 8. Verification

### Manual test plan (local dev, `ENABLE_DEV_AUTH=true`)
1. `git checkout feature/bottom-navigation` (already created in §5.0).
2. `npm run dev`.
3. **Logged-out state.**
   - Visit `/`, `/login`, `/students/abc`, `/claude-signup`. **Bottom
     nav must NOT render.**
   - The new `/mock-interview` and `/mission` must redirect to `/login`
     (middleware).
4. **Logged-in IN_PROGRESS user** — log in as `arjun@abtalks.dev` /
   `test` (Day 1, SE).
   - Bottom nav appears on `/dashboard`, `/challenge/1`, `/profile`,
     `/quiz/...`, `/mock-interview`, `/mission`. Confirm fixed to the
     bottom on mobile widths (DevTools 390 px). Confirm it disappears
     at `md` breakpoint (≥768 px).
   - `Home` tab active on `/dashboard` and `/challenge/1`.
   - Tap `Mock Interview` → IN_PROGRESS card with progress bar at 1/60.
     Text mentions "Complete the 60-day challenge consistently…".
   - Tap `Our Mission` → mission page renders the four sections, no
     CTAs, copy matches §5.4 verbatim.
   - Tap `Profile` → goes to `/profile`. Avatar dropdown's `Profile`
     item is **hidden on mobile** (you should see only `Our Mission`,
     `Report an Issue`, `Logout` inside the dropdown).
   - Resize to desktop. Header now shows the `Mock Interview` link.
     Avatar dropdown now shows `Profile`, `Our Mission`, `Report an
     Issue`, `Logout`. Bottom nav is gone.
5. **Logged-in COMPLETED-without-missing user** — log in as
   `meera@abtalks.dev` / `test` (Day 60, COMPLETED, isReadyForInterview).
   - `/mock-interview` shows ELIGIBLE card with the green tone and
     "You're eligible for mock interviews." copy.
6. **Logged-in COMPLETED-with-misses user** — to simulate, in psql
   `DELETE FROM "Submission" WHERE "enrollmentId" = '<meera's enrollment>' AND "dayNumber" = 30;`
   then `UPDATE "Enrollment" SET "daysCompleted" = 59 WHERE id = '...';`
   …no, this no longer reflects "COMPLETED with misses". Skip the live
   reproduction; instead add the third state to the eligibility unit
   test (see below). Or: temporarily edit a single ON_TIME submission's
   `dayNumber` to 61 in psql so max=61 and count=60 → maps to
   MISSED_DAYS. Revert after.
7. **Admin user** — log in as `admin@abtalks.dev` / `admin`. Go to
   `/admin`. Bottom nav must be visible (per your answer to Q4).
   Confirm tab labels and tap targets are reachable.
8. **iOS Safari safe area** — open in iPhone simulator or Safari with
   "Show responsive design mode" → iPhone 14. Confirm bottom nav clears
   the home-bar (no overlap), thanks to
   `pb-[env(safe-area-inset-bottom)]`.

### Build/typecheck
- `npm run lint` — must pass.
- `npm run build` — must pass. Pay close attention to the **edge bundle
  report** in the build output. The middleware bundle must stay roughly
  the same size (no `@/lib/*` or `@/components/*` symbols listed).
- `tsc --noEmit` (or your IDE's TS server) — no `any`, no implicit
  `any`. The eligibility discriminated union should narrow inside the
  page's `switch` cleanly.

### Files that should change (and only these)
- `src/components/shared/bottom-nav.tsx` (new)
- `src/components/shared/bottom-nav-gate.tsx` (new)
- `src/app/mock-interview/page.tsx` (new)
- `src/app/mission/page.tsx` (new)
- `src/features/mock-interview/check-eligibility.ts` (new)
- `src/app/layout.tsx` (edit)
- `src/components/shared/app-header.tsx` (edit)
- `middleware.ts` (edit)

Any other file changing = something went off plan. Investigate before
commit.

## 9. Commit message
```
feat(nav): add mobile bottom nav + Mock Interview and Our Mission pages

- New /mock-interview page with a gated CTA. Eligibility = enrollment
  status COMPLETED AND no missed days (max submission dayNumber equals
  challenge.totalDays). Locked, in-progress, missed-days, and eligible
  states render distinct copy.
- New /mission page with the brand mission copy (authed only).
- New BottomNav (mobile, < md) shown on all authed app routes including
  admin; hidden on /, /login, /register, /students/*, /claude-signup.
  Safe-area padding for iOS home bar.
- AppHeader: Mock Interview link shown on desktop; Our Mission added to
  the avatar dropdown; Profile item hidden on mobile (now reachable via
  bottom bar).
- middleware: /mock-interview and /mission added to protectedPaths
  (edge-safe — no @/lib/* imports).

No schema changes. No new dependencies.
```
