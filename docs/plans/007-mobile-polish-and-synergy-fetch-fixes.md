# 007 — Mobile polish batch + synergy fetch fix

> Four shipped-code fixes from one feedback round. All independent; can be one
> commit or four. No schema. Branch: `git checkout -b fix/mobile-polish-batch`.
>
> Items: (1) profile page horizontal overflow on mobile, (2) synergy refetched
> on every page load, (3) "Our Mission" duplicated in the mobile profile
> dropdown, (4) heatmap catch-up amber ring clipped on the first row.

---

## FIX 1 — Profile page horizontal overflow on mobile

### Goal
Stop `/profile` from overflowing horizontally (the whole page shifts) on small
screens.

### Root cause
`src/app/profile/page.tsx` (~line 244–248), the referral link row:
```tsx
<div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
  <code className="flex-1 truncate font-mono text-xs md:text-sm">
    {referralLink}
  </code>
  <CopyReferralLinkButton link={referralLink} />
</div>
```
The `<code>` is `flex-1 truncate` but has **no `min-w-0`**. Flex items default
to `min-width: auto`, so an unbreakable URL (e.g.
`https://abtalks.in/?ref=ABC123`) sets a large min-content width; the item
refuses to shrink, forcing the row — and the whole page — wider than a 390px
viewport. `truncate`'s `overflow:hidden` never kicks in because the box never
shrinks. This is the classic flexbox truncation gotcha.

### Files to touch
- `src/app/profile/page.tsx` `[edit]` — Server Component. One class change
  (plus one defensive change).

### Steps
1. Add `min-w-0` to the referral `<code>`:
   `className="min-w-0 flex-1 truncate font-mono text-xs md:text-sm"`.
2. Defensive: in the avatar card (~line 167), the email line
   `<p className="text-sm text-muted-foreground">{user.email}</p>` can also
   overflow with a long unbroken address — add `break-words` (or `break-all`)
   to it so it wraps inside its `min-w-0 flex-1` parent.
3. No other changes. Do NOT restructure the cards or the grid — the grid
   already collapses to one column on mobile; the overflow is purely the
   un-shrinkable referral code.

### Guardrails
- DO NOT add fixed widths or `overflow-x-auto` to the card to "contain" it —
  fix the flex child with `min-w-0`, which is the correct mechanism.
- This file is a Server Component — do NOT add `"use client"`.

---

## FIX 2 — Synergy refetched on every page load

### Goal
Stop hitting the database for the synergy total on every navigation/reload.
Fetch it once and reuse it across client-side navigations; update it locally
when the user earns points.

### Root cause
`src/components/shared/synergy-chip.tsx` fetches in `useEffect([])`:
```tsx
useEffect(() => {
  void getMySynergyAction().then((res) => setPoints(res.points));
}, []);
```
`AppHeader` (which renders `<SynergyChip />`) is mounted by **every page**, so
the chip remounts on each navigation and refetches. That's a DB read per page
view.

### Chosen approach (recommended)
Move the data into a **client context provider mounted once in the root
layout**. In the App Router the root layout persists across client-side
navigations, so the provider mounts a single time per full page load and holds
the value for the whole session of navigations. Seed instantly from
`sessionStorage` to avoid the "…" flash and to skip the DB read on a reload
when a fresh value exists; revalidate at most once per full load (and after the
user earns synergy). Net effect:
- Client-side navigations (dashboard → profile → challenge …): **zero** extra
  fetches.
- Hard reload: **one** read at most, and only if the cached value is missing or
  older than the TTL.
- After a submission: the value updates locally (no refetch needed).

> Alternatives considered and rejected: putting synergy in the JWT (goes stale,
> and we deliberately keep it out of the edge auth config); threading
> `synergyPoints` as a prop through every page's `AppHeader` (touches dozens of
> pages); a cookie written on every change (more moving parts, cross-session
> staleness). The provider + sessionStorage is the least invasive.

### Files to touch
- `src/components/shared/synergy-provider.tsx` `[new]` — Client context:
  fetch-once + cache + `refresh()` + `setPoints()`.
- `src/app/layout.tsx` `[edit]` — wrap `children` with `<SynergyProvider>`
  (inside the existing `ThemeProvider`).
- `src/components/shared/synergy-chip.tsx` `[edit]` — read from the context
  instead of fetching in its own `useEffect`.
- `src/components/challenge/day-page.tsx` `[edit]` — after a successful submit,
  push the new total into the context so the chip updates without a refetch.

### Server vs Client
- `SynergyProvider`, `SynergyChip`, `DayPage` — **Client**.
- `app/layout.tsx` is a **Server Component** that renders the client provider
  (same pattern as the existing `ThemeProvider`). No props besides `children`
  cross the boundary.

### Steps
1. **`synergy-provider.tsx`** (new):
   ```tsx
   "use client";
   import { createContext, useContext, useEffect, useState, useCallback } from "react";
   import { getMySynergyAction } from "@/app/actions/synergy-actions";

   type Ctx = {
     points: number | null;
     setPoints: (n: number) => void;
     refresh: () => void;
   };
   const SynergyContext = createContext<Ctx | null>(null);
   const KEY = "abtalks_synergy";
   const TTL_MS = 60_000;

   export function SynergyProvider({ children }: { children: React.ReactNode }) {
     const [points, setPointsState] = useState<number | null>(null);

     const writeCache = useCallback((n: number) => {
       try { sessionStorage.setItem(KEY, JSON.stringify({ n, t: Date.now() })); } catch {}
     }, []);

     const setPoints = useCallback((n: number) => {
       setPointsState(n); writeCache(n);
     }, [writeCache]);

     const refresh = useCallback(() => {
       void getMySynergyAction().then((res) => setPoints(res.points));
     }, [setPoints]);

     useEffect(() => {
       // Seed instantly from sessionStorage; only hit the action if stale/missing.
       let cached: { n: number; t: number } | null = null;
       try {
         const raw = sessionStorage.getItem(KEY);
         cached = raw ? (JSON.parse(raw) as { n: number; t: number }) : null;
       } catch {}
       if (cached) setPointsState(cached.n);
       if (!cached || Date.now() - cached.t > TTL_MS) refresh();
     }, [refresh]);

     return (
       <SynergyContext.Provider value={{ points, setPoints, refresh }}>
         {children}
       </SynergyContext.Provider>
     );
   }

   export function useSynergy(): Ctx {
     const ctx = useContext(SynergyContext);
     if (!ctx) return { points: null, setPoints: () => {}, refresh: () => {} };
     return ctx;
   }
   ```
   - The `useSynergy` no-op fallback means the chip still renders even if (by
     mistake) it's mounted outside the provider — no crash.
2. **`app/layout.tsx`**: import `SynergyProvider`; wrap `{children}` with it,
   nested inside `ThemeProvider` (so it sits above all pages but below theme).
   Do not move `AppFooter`, `BottomNavGate`, or `Toaster` out of their current
   positions — just wrap the `children`/main subtree. The provider must be an
   ancestor of every `AppHeader` (so wrap broadly).
3. **`synergy-chip.tsx`**: remove the local `useState<number|null>` +
   `useEffect` fetch. Replace with `const { points } = useSynergy();`. Keep all
   the chip + dialog markup exactly as-is (it already renders `points ?? "…"`).
4. **`day-page.tsx`**: import `useSynergy`. After a successful submit where the
   action returns `synergyAwarded` (and ideally the new total), update the
   context. Simplest correct option: call `refresh()` after a successful submit
   so the chip reflects the new total. If `submitDayAction` returns the new
   total, prefer `setPoints(newTotal)` to avoid the round-trip. (If it only
   returns `synergyAwarded`, you may optimistically
   `setPoints((current ?? 0) + synergyAwarded)` — but `current` isn't in scope
   there, so `refresh()` is the safe choice.)

### Guardrails
- DO NOT put synergy in the JWT / `auth.config.ts` / `auth.ts`.
- DO NOT fetch synergy inside `SynergyChip` anymore — the provider owns it.
- DO NOT wrap only part of the tree — the provider must be an ancestor of every
  `AppHeader` instance (admin layout included; it renders `AppHeader` too).
- DO NOT crash on missing `sessionStorage` (private mode / SSR) — the
  try/catch blocks above handle it; keep them.
- DO NOT use `any`. The context type is concrete.
- `getMySynergyAction` already short-circuits to `{ points: 0 }` when
  unauthenticated, so mounting the provider on `/login` / `/` is harmless (one
  `auth()` call, no DB). Do NOT add route gating logic.

---

## FIX 3 — "Our Mission" duplicated in the mobile profile dropdown

### Goal
On mobile, the avatar dropdown should NOT show "Our Mission" (it's already in
the bottom nav). Keep it on desktop (no bottom nav there).

### Root cause
`src/components/shared/app-header.tsx` (~line 151): the "Our Mission"
`DropdownMenuItem` has no responsive class, unlike the "Profile" item above it
which uses `className="hidden md:flex"`.

### Files to touch
- `src/components/shared/app-header.tsx` `[edit]` — Client Component. One class
  addition.

### Steps
1. Add `className="hidden md:flex"` to the "Our Mission" `DropdownMenuItem`
   (mirror the "Profile" item directly above it):
   ```tsx
   <DropdownMenuItem className="hidden md:flex" onClick={() => router.push("/mission")}>
     Our Mission
   </DropdownMenuItem>
   ```
2. Leave "Report an Issue" and "Logout" visible on all breakpoints (they have
   no bottom-nav equivalent).

### Guardrails
- DO NOT remove the item entirely — desktop has no bottom nav and still needs
  it.
- DO NOT touch the bottom nav or `/mission` route.

---

## FIX 4 — Heatmap catch-up amber ring clipped on the first row

### Goal
The amber "Missed - catch up" ring around a heatmap cell should be fully
visible, including on the top row (and edge columns).

### Root cause
`src/components/dashboard/submission-heatmap.tsx` (~line 170):
```tsx
<div className="overflow-x-auto pb-1">
  <div className="grid w-max max-w-full grid-cols-10 gap-1.5 sm:mx-auto sm:gap-2" ...>
```
Catch-up cells use `ring-2 ring-amber-400 ring-offset-1 ring-offset-background`
(~3px drawn OUTSIDE the cell box). The scroll wrapper is `overflow-x-auto`,
which makes the computed `overflow-y` non-visible (CSS: when one axis is `auto`
and the other `visible`, the `visible` becomes `auto`). With only `pb-1` (and
no top/side padding), the ring on the **first row** is clipped at the top, and
edge-column rings can clip left/right.

### Files to touch
- `src/components/dashboard/submission-heatmap.tsx` `[edit]` — Client
  Component. One class change on the scroll wrapper.

### Steps
1. Give the scroll wrapper padding on all sides large enough to clear the ring
   (ring 2px + offset 1px ≈ 3px → use ~6px):
   `className="overflow-x-auto px-1 py-1.5"` (replaces `overflow-x-auto pb-1`).
   - `py-1.5` (6px) clears the top/bottom ring; `px-1` (4px) clears the
     left/right ring on edge columns. Horizontal scrolling still works (padding
     is inside the scroll box).
2. No change to the grid, the cells, or the legend. The legend swatch (~line
   228) already sits in normal flow with room for its ring — leave it.

### Guardrails
- DO NOT remove `overflow-x-auto` — the 10-column grid must still scroll on
  very narrow screens.
- DO NOT shrink the ring or the cells. The fix is padding on the scroll box.
- DO NOT add `overflow-visible` (it would break horizontal scroll on small
  screens).

---

## DB safety
Not applicable — no schema or data changes in any of the four fixes.

## Verification (all four)
Manual (local, `ENABLE_DEV_AUTH=true`, mobile viewport ~390px):
1. **Fix 1:** Open `/profile` on a phone width. The page no longer shifts /
   scrolls horizontally; the referral URL truncates with an ellipsis and the
   Copy button stays on-screen. A long email wraps instead of overflowing.
2. **Fix 2:** Open the network tab / add a temporary log in
   `getMySynergyAction`. Navigate dashboard → profile → challenge → dashboard:
   **no new synergy fetch per navigation** (provider already has it). Reload
   the page: at most one fetch, and none within the 60s TTL if a cached value
   exists. Submit a day → the header chip's number increases without a manual
   refresh. The chip never flashes "…" after the first paint of a session
   (seeded from sessionStorage).
3. **Fix 3:** On mobile, open the avatar dropdown — "Our Mission" is absent;
   "Report an Issue" and "Logout" remain. On desktop (≥768px), "Our Mission"
   and "Profile" both appear in the dropdown.
4. **Fix 4:** On the dashboard heatmap, a Day-in-catch-up cell on the **first
   row** shows its full amber ring (not clipped at the top). Edge-column cells
   show full rings on the sides. Horizontal scroll still works on a narrow
   screen.
5. **Build/typecheck:** `npm run lint`, `npm run build`, `tsc --noEmit` clean.

### Files that should change (and only these)
- `src/app/profile/page.tsx`
- `src/components/shared/synergy-provider.tsx` (new)
- `src/app/layout.tsx`
- `src/components/shared/synergy-chip.tsx`
- `src/components/challenge/day-page.tsx`
- `src/components/shared/app-header.tsx`
- `src/components/dashboard/submission-heatmap.tsx`

## Commit message
```
fix(mobile): profile overflow, synergy fetch-once, dropdown dupe, heatmap ring

- profile: add min-w-0 to the referral code so the URL truncates instead of
  forcing horizontal page overflow on mobile; wrap long emails.
- synergy: move the total into a SynergyProvider mounted once in the root
  layout (seeded from sessionStorage, 60s TTL). The chip reads from context
  instead of fetching on every page mount; submissions update it locally.
- header: hide "Our Mission" in the avatar dropdown on mobile (already in the
  bottom nav); keep it on desktop.
- heatmap: pad the scroll container so the amber catch-up ring on the first
  row / edge columns isn't clipped.
```
