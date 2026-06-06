# 005 — Mobile UI polish: tight profile, Flame synergy icon, floating-pill bottom nav

## 1. Goal
Three independent mobile-shell tweaks bundled into one plan because they all
touch the mobile chrome and ship together as a polish pass:

1. **Profile page on mobile** — full tightening pass: reduce vertical gaps,
   card padding, form field spacing, and shrink the avatar hero card so the
   page fits more on a 390px viewport.
2. **Synergy icon → Flame** — replace `Sparkles` with `Flame` (lucide-react) in
   `SynergyChip` only. Colors and gradients stay exactly as-is.
3. **Bottom nav → floating pill** — detach the mobile bottom nav from the
   screen edges, render it as a rounded-full pill with frosted backdrop blur
   and a tinted active-tab pill behind the current route's icon+label.

## 2. Current behavior

### Profile (`src/app/profile/page.tsx`)
- `<main>` uses `space-y-8 px-4 py-8` regardless of viewport — feels generous on mobile.
- Two-column grid (`gap-8 lg:grid-cols-2`) but on mobile this collapses to a stack with `gap-8` separating the hero card from the right-column stack, and the right column itself uses `space-y-6` between three cards.
- Hero card (line 155-197): `size-20` avatar, column-on-mobile layout (`flex-col sm:flex-row`), `gap-4 pt-6`. Multiple text rows with `space-y-2`. Total card height on mobile ≈ 280–320px.
- `ProfileForm` (`src/app/profile/profile-form.tsx` line 108): `<form className="space-y-5">` with each field group `space-y-2`. ~10 field groups → ~10 × 5 = 50px of pure vertical gap.

### Synergy icon (`src/components/shared/synergy-chip.tsx`)
- Line 41: `<Sparkles className="size-3.5 transition-transform group-hover:scale-110" aria-hidden />` inside the chip button.
- Line 56: `<Sparkles className="size-6" aria-hidden />` inside the dialog hero circle.
- Both inherit color from parent classes: button uses `text-primary`, hero circle is `bg-white/20` inside a `bg-gradient-to-br from-primary to-violet-500` container. **No `text-*` class on the icons themselves** — color comes from the parent. Swapping the icon component leaves color untouched.
- The other 11 `Sparkles` usages in the codebase ([landing welcome slide, quiz unlock banner, registration form, Claude welcome slide, pre-start dashboard, mission page, Claude challenge modal, campus ambassador modal, Claude enrollment banner]) are **not** synergy-related and must not be changed.

### Bottom nav (`src/components/shared/bottom-nav.tsx`)
- `<nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">` — full-width, hugs the edges, top border separates it from content.
- 4 tabs in a `grid grid-cols-4`, each a `<Link>` with stacked icon + label, `text-primary` when active else `text-muted-foreground`.
- Gated to logged-in users via `BottomNavGate` (Suspense + auth check). Hidden on `/`, `/login`, `/register`, `/claude-signup`, `/students/...`.
- No reserved bottom padding on page main containers — content scrolls under the solid `bg-card/95` strip. Pre-existing behavior; not regressed by this plan but flagged in §8.

## 3. Files to touch

| Path | Status | Note |
|---|---|---|
| `src/app/profile/page.tsx` | [edit] | Tighten `<main>` spacing (`space-y-5 sm:space-y-8`, `py-5 sm:py-8`), tighten the right-column stack (`space-y-4 sm:space-y-6`), tighten the responsive grid gap (`gap-5 sm:gap-8`). Shrink avatar (`size-14 sm:size-20`) and switch the hero card layout to horizontal-on-mobile (`flex-row items-center text-left` — drop the `sm:flex-row` toggle). Tighten badge row spacing and text rhythm. |
| `src/app/profile/profile-form.tsx` | [edit] | Tighten the outer form gap (`space-y-3 sm:space-y-5`) and per-field group gap (`space-y-1.5 sm:space-y-2`). No layout or behaviour change. |
| `src/components/shared/synergy-chip.tsx` | [edit] | Two-line change: in the import on line 8 replace `Sparkles` with `Flame`. The two render sites (line 41 chip button, line 56 dialog hero) become `<Flame ... />`. **No className changes, no color overrides, no gradient changes.** |
| `src/components/shared/bottom-nav.tsx` | [edit] | Rewrite the `<nav>` shell to a floating pill: drop `inset-x-0 border-t`, add horizontal margin + bottom offset (with safe-area), apply `rounded-full`, frosted background (`bg-card/70 backdrop-blur-xl`), soft shadow (`shadow-lg shadow-black/10 dark:shadow-black/40`). Restructure tabs to render a tinted active-pill (`bg-primary/15`) behind the icon+label of the active route. Keep `md:hidden`, keep all routing logic. |
| All page-level `<main>` containers used by routes that show the bottom nav | (verify, edit only if regression observed) | The floating nav reduces the visual cover on the last bit of content versus the current solid strip. If any page's last interactive element ends up obscured, add `pb-24 md:pb-0` (or the equivalent nav-clearance) to that page's main. Do NOT prophylactically add padding to every page — only where verification surfaces a real issue. |
| `src/components/shared/bottom-nav-gate.tsx` | (no edit) | Gate logic unchanged. |
| Card primitive `src/components/ui/card.tsx` | (no edit) | **Do NOT** modify shadcn primitives. Tighten by adjusting className on consumers if needed (e.g., apply `pt-4 sm:pt-6` directly to a `CardContent`). |
| `prisma/schema.prisma`, server actions, lib | (no edit) | Pure UI change. |

## 4. Server vs Client
- `src/app/profile/page.tsx` — **Server Component** (existing). Only className edits; no boundary change.
- `src/app/profile/profile-form.tsx` — **Client** (`"use client"`). Only className edits.
- `src/components/shared/synergy-chip.tsx` — **Client** (`"use client"`). Icon component swap. `Flame` is a Lucide React component (icon = function component), safe to render in Client.
- `src/components/shared/bottom-nav.tsx` — **Client** (`"use client"`, uses `usePathname`). Only className/structure edits.
- No Server → Client prop passing changes. No functions/icons/class instances newly crossing the boundary.

## 5. Steps

### Feature 1 — Profile mobile tightening

**Step 1 — Outer page rhythm (`src/app/profile/page.tsx`)**
- Line 149: change `<main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8">` → `<main className="mx-auto w-full max-w-6xl flex-1 space-y-5 px-4 py-5 sm:space-y-8 sm:py-8">`.
- Line 150: change `<h1 className="font-display text-2xl font-semibold tracking-tight">` → `<h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">`.
- Line 154: change `<div className="grid gap-8 lg:grid-cols-2 lg:items-start">` → `<div className="grid gap-5 sm:gap-8 lg:grid-cols-2 lg:items-start">`.
- Line 199: change `<div className="space-y-6">` → `<div className="space-y-4 sm:space-y-6">`.

**Step 2 — Hero card hero (`src/app/profile/page.tsx` lines 155-197)**
- Line 156: change `<CardContent className="flex flex-col items-center gap-4 pt-6 text-center sm:flex-row sm:items-start sm:text-left">` → `<CardContent className="flex flex-row items-center gap-3 p-4 text-left sm:items-start sm:gap-4 sm:p-6">`.
- Line 157: change `<Avatar size="lg" className="size-20 text-lg">` → `<Avatar size="lg" className="size-14 text-base sm:size-20 sm:text-lg">`.
- Line 163: change `<div className="min-w-0 flex-1 space-y-2">` → `<div className="min-w-0 flex-1 space-y-1 sm:space-y-2">`.
- Line 164: change `<p className="text-2xl font-semibold tracking-tight">` → `<p className="text-lg font-semibold tracking-tight sm:text-2xl">`.
- Line 167: change `<p className="text-sm text-muted-foreground">{user.email}</p>` → `<p className="text-xs text-muted-foreground sm:text-sm">{user.email}</p>` (mobile only — email is long).
- Line 168: change `<div className="flex flex-wrap justify-center gap-2 sm:justify-start">` → `<div className="flex flex-wrap gap-1.5 sm:gap-2">` (drop the centering branch since the whole card is now left-aligned at all breakpoints).
- Lines 180-194 (the meta line for college / role): wrap text class change to `text-xs sm:text-sm`.

**Step 3 — Cards inside the right column (`src/app/profile/page.tsx`)**
- Each `<CardContent>` in the right column (lines 207, 217, 243): tighten padding by adding `p-4 sm:p-6` override class (shadcn default is roughly p-6). Same for `<CardHeader>` if visually loose — apply `pb-3 sm:pb-4` on `<CardHeader>` only if a visual gap remains.
- Do NOT remove the cards or merge them.

**Step 4 — Form rhythm (`src/app/profile/profile-form.tsx`)**
- Line 108: change `<form ... className="space-y-5">` → `<form ... className="space-y-3 sm:space-y-5">`.
- All inner field groups currently `<div className="space-y-2">` (lines 109, 117, 127, 135, 153, 163, 171, 189, 233, 248, 265, 280): change to `<div className="space-y-1.5 sm:space-y-2">`.
- Use `replace_all` on the exact string `className="space-y-2"` ONLY within this file. Verify no unintended matches before applying.
- Skill input row (line 206): keep `flex-col gap-2 sm:flex-row` — no change.

### Feature 2 — Synergy icon → Flame

**Step 5 — Swap `Sparkles` for `Flame` in `SynergyChip`**
In `src/components/shared/synergy-chip.tsx`:
- Line 8 import block: replace `Sparkles,` with `Flame,`. Keep alphabetical order (`Clock, Flame, GitCommit, Share2, TrendingUp, Users`).
- Line 41: change `<Sparkles` → `<Flame`. Leave the `className`, `aria-hidden`, and surrounding markup untouched.
- Line 56: change `<Sparkles` → `<Flame`. Same — only the component name changes.

**Sanity check after the edit:**
- `grep -n "Sparkles" src/components/shared/synergy-chip.tsx` must return zero matches.
- `grep -rn "Sparkles" src/` must still show the other 9 files (landing welcome, quiz unlock, registration, Claude welcome, pre-start dashboard, mission, Claude challenge modal, campus ambassador modal, Claude enrollment banner). Counts unchanged elsewhere.

### Feature 3 — Bottom nav → floating pill

**Step 6 — Rewrite the nav shell (`src/components/shared/bottom-nav.tsx`)**
Replace the `<nav>` block (lines 35-58) with the floating pill structure. The full replacement (preserve imports and the `tabs` array and `isTabActive` and the route-gate at lines 27-32 verbatim):

```tsx
return (
  <div
    className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] md:hidden"
    aria-hidden={false}
  >
    <nav
      aria-label="Main navigation"
      className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-1 rounded-full border border-border/40 bg-card/70 px-2 py-1.5 shadow-lg shadow-black/10 backdrop-blur-xl dark:bg-card/60 dark:shadow-black/40"
    >
      {tabs.map(({ href, label, Icon }) => {
        const active = isTabActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-2 py-1.5 text-xs transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-5" aria-hidden />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </Link>
        );
      })}
    </nav>
  </div>
);
```

Notes for the executor:
- **Outer wrapper is `pointer-events-none`** so taps in the side gutters fall through to underlying content; the inner `<nav>` re-enables pointer events. This is the standard floating-bar pattern.
- `max-w-md` (28rem ≈ 448px) keeps the pill from stretching across larger phones / foldables — looks more "nav bar" than "stretched strip".
- Border + shadow + backdrop-blur combine to mimic the iOS liquid-glass effect. **Keep the border** — without it the pill loses definition on the lightest light-theme backgrounds.
- Active state is `bg-primary/15 text-primary` on the inner `<Link>` itself (which is `rounded-full`), creating a pill-inside-pill. Do NOT use a separately rendered highlight element.
- Label text drops from `text-[11px]` to `text-[10px]` and gets `leading-none` so the active pill stays visually balanced.

**Step 7 — Verify no page content is occluded**
The new pill sits with `~12px` of gutter from the bottom plus safe-area. The previous solid strip overlaid roughly the bottom 56–64px of viewport too — so net occlusion is roughly equivalent. Spot-check the routes that use the bottom nav on a 390px viewport in Chrome devtools / iOS Simulator:
- `/dashboard` — heatmap is the most likely victim.
- `/profile` — the last "Refer & Earn" card.
- `/challenge/[day]` — the SubmissionFlow's submit buttons.
- `/mission`, `/jobs` (if present).

If any final button or interactive element is partially covered by the floating pill, add `pb-24 md:pb-0` to that page's `<main>` (or equivalent main container). **Do not** add this padding pre-emptively to every page; only where verification surfaces a real issue.

## 6. Guardrails for Cursor (DO NOT)
- **DO NOT** change any synergy-related color, gradient, or text. The icon swap is the ONLY change in `synergy-chip.tsx`. Reviewer must see exactly two character-level changes (`Sparkles` → `Flame` twice) plus the import line.
- **DO NOT** touch the other 9 `Sparkles` usages in the codebase. They are unrelated to synergy. Specifically: `landing/slides/welcome-slide.tsx`, `dashboard/quiz-unlock-banner.tsx`, `register/registration-form.tsx`, `claude/slides/claude-welcome-slide.tsx`, `dashboard/pre-start-dashboard.tsx`, `mission/page.tsx`, `dashboard/claude-challenge-modal.tsx`, `dashboard/campus-ambassador-modal.tsx`, `shared/claude-enrollment-banner.tsx`.
- **DO NOT** modify `src/components/ui/*` (shadcn primitives). Tighten by adding override classes on consumers.
- **DO NOT** convert `ProfileForm` from React Hook Form to anything else, or restructure validation. Pure className changes.
- **DO NOT** change the bottom nav's `tabs` array, `isTabActive` function, or the route-exclusion regex at line 27-32. Visual rewrite only.
- **DO NOT** remove `md:hidden` from the bottom nav — desktop must continue to use the header for navigation.
- **DO NOT** drop `pb-[env(safe-area-inset-bottom)]` / safe-area handling. The new version uses `pb-[max(env(safe-area-inset-bottom),0.5rem)]` — the `max(...)` keeps a minimum offset on Android / non-notch devices.
- **DO NOT** add a `text-primary` or any color class to the new `<Flame>` icons. They inherit color from their containers exactly like `<Sparkles>` did. Adding an explicit color is the most common way to silently change the look.
- **DO NOT** modify `BottomNavGate` or its Suspense boundary.
- **DO NOT** add bottom padding (`pb-24`) to page main containers unless verification (Step 7) shows a real occlusion bug on that specific page. Prophylactic padding will leave visible empty space below content on pages whose content was already short.
- **DO NOT** convert any of these three features into a "feature flag" rollout. They ship together as a polish pass.

## 7. DB safety
Not applicable — pure UI changes. No schema, no migrations, no seed touched.

## 8. Verification

### Pre-flight
- `npx tsc --noEmit` must pass with zero new errors.
- Lint must pass.
- Build must succeed (`npm run build` or equivalent — confirm via the standing project script).

### Manual test matrix (Chrome devtools, 390 × 844 iPhone 14 viewport, plus a real Android if available)

**Profile tightening**
| Step | Expected |
|---|---|
| Open `/profile` on mobile | The hero card uses horizontal layout: avatar on the left (≈56px), name + email + badges stacked to the right. No center-alignment. |
| Scroll the page | Vertical gaps between cards feel noticeably tighter than `main` branch. Form field gaps are noticeably tighter. |
| Resize to ≥640px (`sm`) | Spacing reverts to the pre-change values. The hero card switches to its original generous padding. |
| Open `/profile` on desktop (≥1024px) | Two-column layout intact. No visual regression. |

**Synergy → Flame**
| Step | Expected |
|---|---|
| Anywhere the `SynergyChip` is mounted (likely the header) | The icon is now a flame, not sparkles. |
| Inspect the chip in devtools | The button still has `from-primary/15 to-violet-500/15` gradient. The Flame inherits `text-primary` — no explicit color class on the SVG itself. |
| Click the chip to open the dialog | Dialog header: the small circular badge still has `bg-gradient-to-br from-primary to-violet-500`, the inner icon is a Flame, color still inherits white from the gradient backdrop. |
| Grep `src/` for `Sparkles` | Returns 9 files (all non-synergy). Zero matches inside `synergy-chip.tsx`. |
| All non-synergy Sparkles surfaces (landing welcome, Claude banner, mission page badge, etc.) | Unchanged — still Sparkles. |

**Bottom nav floating pill**
| Step | Expected |
|---|---|
| Open `/dashboard` on mobile | Pill is centered horizontally, detached from screen edges (~12px gutter), floats above the dashboard content. Heatmap visible through the blurred background as it scrolls. |
| Tap the active tab | Active tab has a tinted primary pill behind icon + label. Other tabs have muted text. |
| Tap a different tab | Route changes, active pill moves to the new tab. |
| Open `/login` or `/` or `/register` | Bottom nav is hidden (existing gate behaviour preserved). |
| Open on desktop (≥768px) | Bottom nav is hidden (`md:hidden` preserved). |
| Toggle dark mode | Pill background swaps to `bg-card/60` and shadow gets darker. Still legible. |
| iPhone with home indicator (iOS Safari, real device or simulator) | Pill sits above the home-indicator area. No clipping. |
| Tap in the gutter beside the pill (e.g. far-right edge near `/dashboard` content) | Tap passes through to underlying content (`pointer-events-none` on wrapper). |
| Cross-check `/challenge/[day]` submit button visibility | If the submit button at the bottom of the form is obscured by the floating pill, add `pb-24 md:pb-0` to that page's main. Otherwise leave alone. |

### Files that should have changed
- `src/app/profile/page.tsx`
- `src/app/profile/profile-form.tsx`
- `src/components/shared/synergy-chip.tsx`
- `src/components/shared/bottom-nav.tsx`
- (Conditionally) one or more page-level main containers if Step 7 finds occlusion.

Nothing else. If `git diff --name-only` shows changes to `prisma/`, `src/lib/`, `src/components/ui/`, `src/features/`, or unrelated routes, STOP and review.

## 9. Commit message

```
feat(ui): mobile polish — tighter profile, Flame synergy icon, floating-pill bottom nav

Profile page: trims vertical rhythm, card padding, and form field gaps on
mobile; hero card switches to horizontal layout with a smaller avatar. All
changes are className-only with sm:-breakpoint restores so desktop is
visually unchanged.

Synergy chip: swaps the Sparkles icon for Flame (lucide-react) in both the
chip button and the dialog hero. Colors, gradients, and layout untouched.
Other non-synergy Sparkles usages elsewhere in the app are NOT changed.

Bottom nav: rewrites the mobile bottom strip as a floating pill — detached
from screen edges, rounded-full, frosted glass background, soft shadow.
Active tab gets a tinted primary pill behind icon+label. Gate, routes, and
md:hidden behavior all preserved.

No schema or behavior changes.
```
