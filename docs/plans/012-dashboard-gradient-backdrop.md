# 012 — Attractive gradient backdrop on the dashboard

> Pure styling. No schema, no deps, one file. Branch:
> `git checkout -b feature/dashboard-backdrop` (or fold into current work).
>
> Decisions locked: **brand indigo→violet** gradient (not GfG blue), and a
> **soft gradient backdrop behind the existing cards** (header stays as-is; the
> gradient begins just below it and fades down). Theme-safe (light + dark).

## 1. Goal
Give `/dashboard` a polished, GfG-style gradient backdrop — a brand-colored
glow at the top that fades into the page background, with the existing cards
floating over it — so the dashboard looks intentional instead of flat grey.

## 2. Context / current behavior
- `src/app/dashboard/page.tsx` (Server Component) renders the working dashboard
  inside `<div className="flex min-h-svh flex-col bg-muted/30">` → `<AppHeader>`
  (sticky, `z-50`, `bg-card/95 backdrop-blur`) → banners → `<main className="mx-auto
  w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6">` holding the cards
  (heatmap "Your 60-Day Journey", Today's Task, the 4 stat cards, quizzes,
  recent activity).
- Background is a flat `bg-muted/30`. There is no decorative gradient.
- The same `bg-muted/30` outer shell is reused by two edge-state returns in the
  same file: the ABANDONED screen (~line 209) and the pre-start screen
  (~line 243). The primary "working dashboard" return is ~line 297.
- Tokens available (no new ones needed): `--primary` indigo `239 84% 67%` →
  `from-primary/…`; `violet-500` (Tailwind) for the second stop; `bg-muted/30`
  base. The app already uses `bg-gradient-to-br from-primary to-violet-500` for
  the synergy popup and recruiter hero, so this stays consistent.
- The page scrolls; the header is `sticky`. **Do not** put `overflow-hidden` on
  the scroll/flex container — it would break the sticky header.

## 3. Files to touch
- `src/app/dashboard/page.tsx` `[edit]` — add a decorative gradient layer to the
  primary dashboard return (and, optionally, the two edge-state returns for
  consistency). ClassName-only change; no logic.

No new files, no component (trivial inline markup), no schema, no dependencies.

## 4. Server vs Client
- `dashboard/page.tsx` stays a **Server Component**. Pure markup/className
  change. No Server→Client prop changes, no new imports.

## 5. Step-by-step changes (primary dashboard return, ~line 297)
1. Make the outer wrapper a positioning context and keep the muted base:
   - From: `<div className="flex min-h-svh flex-col bg-muted/30">`
   - To:   `<div className="relative flex min-h-svh flex-col bg-muted/30">`
   - **Do not** add `overflow-hidden` here (sticky header). The gradient layer
     is `inset-x-0` so it can't cause horizontal overflow.
2. As the **first child** of that wrapper (before `<AppHeader>`), add a
   decorative, non-interactive gradient layer:
   ```tsx
   <div
     aria-hidden
     className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[360px] bg-gradient-to-b from-primary/20 via-violet-500/10 to-transparent sm:h-[440px]"
   />
   ```
   - It sits at `z-0`; the sticky `AppHeader` (`z-50`, opaque card) renders above
     it, so the visible gradient starts just under the header bar and fades into
     `bg-muted/30` by ~the second card — the GfG effect.
   - `from-primary/20 via-violet-500/10 to-transparent` works in **both**
     themes: in dark mode the indigo/violet tints glow over the dark background
     and fade to transparent. (If a tester finds it too strong in dark mode,
     drop to `from-primary/15`.)
   - Optional richness (only if you want a touch more depth — keep subtle): add
     a second `aria-hidden` blurred radial accent, e.g.
     `<div aria-hidden className="pointer-events-none absolute -top-24 right-0 z-0 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />`.
     Skip if it looks busy.
3. Lift the content above the gradient: add `relative z-10` to the primary
   `<main>`:
   - From: `<main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6">`
   - To:   `<main className="relative z-10 mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6">`
4. (Optional, for the "floating cards" feel) bump the top card's elevation so it
   reads as lifted over the gradient: add `shadow-md` to the first `<Card>`
   ("Your 60-Day Journey", ~line 336): `<Card className="shadow-md">`. Leave the
   other cards on their default shadow. Skip if it looks heavy.
5. **Optional consistency** — apply the same two changes (wrapper `relative` +
   the gradient layer as the first child; `<main>`/content `relative z-10`) to
   the ABANDONED return (~line 209) and the pre-start return (~line 243) so
   those screens match. Not required; the primary dashboard is the ask. If you
   do, duplicate the same gradient `<div>` inline (do NOT extract a component
   for one line of markup).

That's the whole change — a backdrop layer + a `z-10` on the content. No data,
no restructuring of the cards.

## 6. Guardrails for Cursor (DO NOT)
- DO NOT modify `AppHeader` or make it transparent — it's a shared component;
  the gradient deliberately begins below it. This plan touches only
  `dashboard/page.tsx`.
- DO NOT add `overflow-hidden` to the `min-h-svh flex` wrapper (breaks the
  sticky header). The gradient is `inset-x-0` + `pointer-events-none` and cannot
  cause horizontal scroll.
- DO NOT use a fixed-position (`fixed`) gradient — it must be `absolute` so it
  scrolls with the page and fades away (GfG behavior), not pinned to the
  viewport.
- DO NOT introduce new CSS variables or edit `globals.css`. Use existing tokens
  (`from-primary/…`) and Tailwind's `violet-500`. No GfG blue.
- DO NOT add a new component/file for the backdrop — inline the `<div>` (trivial
  markup). New files only if this plan listed them (it doesn't).
- DO NOT change the dashboard's data fetching, props, or convert it to a client
  component. ClassName/markup only.
- DO NOT apply this to other routes/pages — scope is the dashboard.
- DO NOT pass anything new across a Server→Client boundary (no changes there).

## 7. DB safety
Not applicable — no schema or data change.

## 8. Verification
Manual (local, `ENABLE_DEV_AUTH=true`):
1. `npm run dev`. Log in (e.g. `arjun@abtalks.dev` / `test`) and open
   `/dashboard`.
2. A soft indigo→violet glow appears at the top, fading into the page by the
   second card; the cards visibly "float" over it. The header bar is unchanged.
3. Scroll down — the gradient scrolls away with the page (not pinned) and the
   lower content is on the normal `bg-muted/30`.
4. **Dark mode:** toggle the theme — the gradient still looks good (a subtle
   glow over the dark background), not a harsh band. No washed-out or
   illegible areas.
5. **Mobile 390px:** no horizontal scroll/overflow; the gradient spans full
   width and looks clean; the bottom nav is unaffected.
6. The sticky header still sticks correctly while scrolling (confirms no
   `overflow-hidden` regression).
7. **Build/typecheck:** `npm run lint`, `npm run build`, `tsc --noEmit` clean.

Files that should change (and only this one): `src/app/dashboard/page.tsx`.

## 9. Commit message
```
feat(dashboard): add brand gradient backdrop behind the cards

Adds a soft indigo→violet gradient layer at the top of the dashboard that fades
into the page background, with the content lifted above it (z-10), so the cards
float over a polished backdrop instead of flat grey. Header unchanged; theme-
safe (light + dark); styling only, no data or schema changes.
```
