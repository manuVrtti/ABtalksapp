# 009 — Design Enhancement Pass ("Settle & Spark")

> **Type:** Multi-phase polish plan. Hand to Cursor **one phase at a time**; review each
> before starting the next. This is **additive craft only** — no redesign, no new IA,
> no copy/data/functionality changes.

---

## Design principles (read before any phase)

Five rules that govern every task below. If a task can't be done within these, stop and
flag it rather than improvising.

1. **Additive, never replacing.** Existing color vars, fonts, `ui/*` primitives, layout,
   IA, routing, and the card/border/shadow *language* stay exactly as they are. Every
   enhancement is a **new token** or a **new wrapper/component** layered on top. We never
   restyle `src/components/ui/*` — we pass `className` at call sites or wrap.
2. **One curve, one fingerprint.** Everything that moves uses the same signature easing.
   The app should read as *one designed thing*, not a pile of effects.
3. **Restraint over flash.** No glow-everything, no rainbow gradients, no glassmorphism
   for its own sake. If a flourish doesn't earn its place, cut it. Motion is felt, not
   noticed.
4. **Transform/opacity only.** Animate `transform` and `opacity` for anything that runs
   during scroll or in lists (60fps, no layout thrash). The two narrow exceptions
   (logo `max-width`, progress `width`) are single, low-frequency elements and are called
   out explicitly where used.
5. **Accessibility is part of the craft.** Every animation honors
   `prefers-reduced-motion`. Focus is always visible. Contrast is preserved. Keyboard nav
   stays clean. This is non-negotiable, not a final polish step.

---

## The signature — "Settle & Spark"

ONE cohesive signature, defined once in Phase 0 and reused everywhere. It has a calm,
always-on half (**Settle**) and a rare, earned half (**Spark**). Same curve, same indigo
identity, four recurring expressions:

- **Settle** — the spine. A single easing curve (`--ease-spark`,
  `cubic-bezier(0.22, 1, 0.36, 1)` — a quiet decelerate-to-rest, no bounce) governs every
  transition, hover, entrance, and route change in the app. Its most visible expression is
  the **`ABTalks → AB` logo collapse on scroll** in the header: the wordmark settles to its
  monogram as you scroll, on this exact curve.
- **Spark** — the fingerprint + the reward. Two faces, both indigo, both on the curve:
  - **Focus spark** (passive, everywhere): a custom indigo focus-visible treatment —
    crisp ring + a soft indigo halo — that you see constantly as you tab/navigate. This is
    the app's tactile signature.
  - **Streak spark** (active, earned): a single restrained scale-pulse + indigo-violet
    glint on the things that represent momentum — the synergy chip on increment, the
    streak number, the day-completion moment, today's heatmap cell. One gesture, reused.

That's the whole signature: **one curve + one focus halo + one spark gesture + one logo
collapse**, all indigo. Nothing else gets a "special effect." Everything else just moves
*well* on the shared curve.

---

## 1. Goal

Add the considered motion, cared-for states, and small hand-made details a senior product
designer brings — plus the single "Settle & Spark" signature above — to the existing
ABTalks design system, **without** changing its identity, fonts, primitives, layout, or
copy. Make the app feel crafted, not assembled.

## 2. Current behavior (audit)

What exists today in the areas we're touching:

- **Tokens — `src/app/globals.css`:** HSL color vars (`:root` + `.dark`), a radius scale
  (`--radius-sm … --radius-4xl`), domain colors, and exactly **one** keyframe
  (`heatmap-cell` + `--animate-heatmap-cell`) — which is **defined but never applied
  anywhere** (orphan token; confirmed via grep). There are **no** easing tokens, **no**
  duration tokens, and **no** custom shadow tokens. Shadows are Tailwind defaults
  (`shadow-sm`/`shadow-md`) — flat neutral gray. There is **no** `prefers-reduced-motion`
  block.
- **Motion — framer-motion 12 is already a dependency** and used in ~20 files (landing /
  claude slides, modals, registration, day-page, ticker), but **ad-hoc**: every component
  hand-rolls its own transition with no shared easing, no shared variants, and no
  `MotionConfig`/`useReducedMotion`. Motion is inconsistent app-wide. `canvas-confetti` is
  also already a dep.
- **`ui/*` primitives (DO NOT TOUCH):** `button.tsx` already has decent state work
  (`hover:scale-[1.02] hover:shadow-md active:scale-[0.99]`, indigo focus ring).
  `card.tsx` is `rounded-xl border-border/50 shadow-sm hover:shadow-md transition-shadow`.
  `skeleton.tsx` is a plain `animate-pulse bg-muted` block. `sonner.tsx` toasts have
  richColors + custom icons.
- **Header — `app-header.tsx` (already `"use client"`):** sticky, `backdrop-blur-sm`.
  Logo is a **static** `<span class="text-primary">A</span>BTalks` — no scroll behavior.
  Contains `SynergyChip`, `ThemeToggle`, avatar dropdown.
- **Heatmap — `submission-heatmap.tsx` (client):** 60 cells, flat status colors, **native
  `title=` tooltips** (not custom), hover ring, a detail `Dialog`. **No mount animation**
  (the orphan `heatmap-cell` keyframe is begging to be used here).
- **Synergy — `synergy-chip.tsx` (client):** indigo→violet gradient pill with a `Flame`
  icon (`group-hover:scale-110`). Good "spark" anchor. No animation on point change.
- **Dashboard — `dashboard/page.tsx` (Server Component):** heatmap card → today's-task
  card → four stat cards (`font-display` numbers, `tabular-nums`) → quiz/activity cards.
  Server-rendered, **no entrance motion**. Stat numbers already use `tabular-nums`.
- **Completion — `challenge/[day]/submission-flow.tsx` (client):** already fires
  `canvas-confetti` (with `disableForReducedMotion: true`) and shows a success screen with
  stat cards + a `width`-animated progress bar. The moment exists but the entrance is
  static (no orchestration); confetti palette is generic, not the brand indigo/violet.
- **Bottom nav — `bottom-nav.tsx` (client):** blurred pill, `transition-colors` only, no
  active-tab indicator motion.
- **States:** only `dashboard/loading.tsx` exists (and its skeleton is **stale** — it
  mirrors an old 3-column leaderboard layout, not the current heatmap-first layout). No
  `loading.tsx` for `challenge`, `profile`, `quiz`, `jobs`, `mission`. Empty states are
  plain text lines. Leaderboard is currently commented out of the dashboard.

## 3. Files to touch (by phase)

Legend: `[new]` / `[edit]`. **None** of these are `src/components/ui/*` (those are never
restyled — we only pass `className`/wrap).

**Phase 0 — Foundation**
- `src/app/globals.css` `[edit]` — add easing/duration/shadow/focus tokens, reduced-motion
  block, `.focus-spark` + `.spark-pulse` utilities. Existing color/font/radius vars
  untouched.
- `src/lib/motion.ts` `[new]` — shared easing constants, durations, framer variants
  (dependency-free; consumers are client-only).
- `src/components/shared/motion-provider.tsx` `[new]` — `"use client"` `MotionConfig`
  wrapper (global reduced-motion + default curve).
- `src/app/layout.tsx` `[edit]` — mount `MotionProvider` around `children`.

**Phase 1 — Signature (logo collapse + focus spark)**
- `src/components/shared/app-header.tsx` `[edit]` — scroll-driven `ABTalks → AB` collapse;
  apply `.focus-spark` to its bespoke interactive elements.
- `src/app/globals.css` `[edit]` — `.logo-tail` collapse rule (uses Phase 0 tokens).
- `src/components/shared/bottom-nav.tsx` `[edit]` — `.focus-spark` on tab links; animated
  active indicator (transform-only).

**Phase 2 — Dashboard polish**
- `src/components/shared/stagger.tsx` `[new]` — `"use client"` entrance/stagger wrappers
  (children-only; no function/icon props across boundary).
- `src/app/dashboard/page.tsx` `[edit]` — wrap the stat-card grid in the stagger wrapper;
  apply `shadow-primary`/`shadow-card` to the hero cards; heading `text-wrap: balance` +
  tracking; optional count-up on the four stat numbers.
- `src/components/dashboard/stat-number.tsx` `[new, optional]` — `"use client"`
  reduced-motion-aware count-up for a single number.

**Phase 3 — Heatmap comes alive**
- `src/components/dashboard/submission-heatmap.tsx` `[edit]` — staggered mount fill-in
  (wire the orphan `heatmap-cell` keyframe), custom hover tooltip replacing native
  `title`, subtle spark on today's cell, `.focus-spark` on cells.

**Phase 4 — Streak & synergy spark**
- `src/components/shared/synergy-chip.tsx` `[edit]` — `.spark-pulse` on point increase.
- `src/components/shared/spark.tsx` `[new, optional]` — `"use client"` shared spark gesture
  used by chip / streak / completion.
- `src/app/dashboard/page.tsx` `[edit]` — spark the streak stat card's flame/number.

**Phase 5 — Day-completion moment**
- `src/app/challenge/[day]/submission-flow.tsx` `[edit]` — orchestrated success entrance
  (icon pop → stat stagger → progress fill, all on the curve), brand-indigo/violet confetti
  palette, keep `disableForReducedMotion`.

**Phase 6 — State design**
- `src/app/dashboard/loading.tsx` `[edit]` — rebuild as a content-shaped skeleton matching
  the *current* layout.
- `src/app/{challenge/[day],profile,quiz/[quizId],jobs,mission}/loading.tsx` `[new]` —
  content-shaped skeletons mirroring each page (add only where missing).
- `src/components/shared/empty-state.tsx` `[new, optional]` — visual-only empty-state shell
  (icon + layout + fade-in) wrapping **existing copy verbatim**.
- Empty-state call sites in `dashboard/page.tsx` (recent activity) and
  `community-leaderboard.tsx` `[edit]` — visual polish only, **copy unchanged**.

**Phase 7 — Transitions & a11y sweep**
- `src/components/dashboard/community-leaderboard.tsx`, `dashboard/page.tsx` recent
  activity `[edit]` — list stagger on enter via the shared wrapper.
- Cross-cutting `[edit]` — modal/sheet/route transition consistency through `motion.ts`
  variants; final focus-visible + keyboard + reduced-motion + contrast audit of everything
  touched.

## 4. Server vs Client (boundary map)

- `globals.css` — not a component.
- `src/lib/motion.ts` — **plain constants/variants, framer-free**, so technically
  importable anywhere; **convention: import only from client components.** Never import it
  (or framer-motion) into `middleware.ts`, `auth.config.ts`, or any Server Component in the
  edge path.
- `motion-provider.tsx`, `stagger.tsx`, `stat-number.tsx`, `spark.tsx` — **`"use client"`**
  (they import framer-motion). Each must declare it.
- `layout.tsx` — **Server Component, stays server.** It renders `MotionProvider` and passes
  `children` (already-rendered `ReactNode`) through it. ✅ Passing `children` across the
  boundary is fine. **Do NOT** pass functions, Lucide icon *components*, or class instances
  as props to any motion wrapper.
- `app-header.tsx`, `bottom-nav.tsx`, `submission-heatmap.tsx`, `synergy-chip.tsx`,
  `submission-flow.tsx` — **already `"use client"`.** Edits stay client.
- `dashboard/page.tsx` — **Server Component, stays server.** It wraps server-rendered card
  JSX in the client `<Stagger>`/`<StatNumber>` wrappers **as `children`**. ✅ children-only.
  **Server→Client flag:** pass only serializable primitives (e.g. the numeric value to
  `StatNumber`) — never the `Calendar`/`Flame`/`Users` icon components as props; keep icons
  rendered inline in the server JSX (`children`) as they are today.
- `loading.tsx` / `empty-state.tsx` skeletons — static markup; keep them Server Components
  (no `"use client"` needed unless they use framer — prefer the CSS `animate-pulse` /
  Phase-0 keyframes so they stay server).

## 5. Steps (phased, file-by-file)

### Phase 0 — Foundation (tokens + motion infra + reduced-motion)

**No visible change to existing surfaces.** This phase only *adds* tokens and infra.

**0.1 — `globals.css`: new tokens.** Inside the existing `@theme inline { … }` block,
**append** (do not modify existing lines) the easing + duration tokens and the Tailwind
shadow-utility mappings:

```css
/* Signature easing */
--ease-spark: cubic-bezier(0.22, 1, 0.36, 1);   /* primary "settle" — no overshoot */
--ease-spark-soft: cubic-bezier(0.33, 1, 0.68, 1); /* gentler, route/sheet */
--ease-spark-out: cubic-bezier(0.34, 1.4, 0.64, 1); /* restrained overshoot — SPARK only */

/* Durations */
--dur-1: 120ms;  /* taps / micro */
--dur-2: 200ms;  /* hover / state */
--dur-3: 320ms;  /* entrances / logo collapse */
--dur-4: 480ms;  /* celebration / orchestration */

/* Elevation utilities (theme-switched via the raw vars below) */
--shadow-card: var(--elevation-card);
--shadow-card-hover: var(--elevation-card-hover);
--shadow-primary: var(--elevation-primary);
--shadow-pop: var(--elevation-pop);
```

Then add the **raw, theme-switched** elevation values. In `:root { … }` append (light,
indigo-tinted, two-layer ambient+key):

```css
--elevation-card: 0 1px 2px -1px hsl(239 30% 20% / 0.08), 0 2px 8px -2px hsl(239 40% 40% / 0.08);
--elevation-card-hover: 0 2px 4px -1px hsl(239 30% 20% / 0.10), 0 8px 24px -4px hsl(239 50% 45% / 0.14);
--elevation-primary: 0 1px 2px -1px hsl(var(--primary) / 0.20), 0 8px 24px -6px hsl(var(--primary) / 0.25);
--elevation-pop: 0 8px 40px -8px hsl(239 40% 20% / 0.22);
```

In `.dark { … }` append (deeper, black-ambient + subtle indigo key):

```css
--elevation-card: 0 1px 2px -1px hsl(224 71% 2% / 0.50), 0 2px 8px -2px hsl(224 71% 2% / 0.45);
--elevation-card-hover: 0 2px 6px -1px hsl(224 71% 2% / 0.60), 0 10px 28px -6px hsl(239 60% 30% / 0.35);
--elevation-primary: 0 1px 2px -1px hsl(var(--primary) / 0.35), 0 10px 28px -8px hsl(var(--primary) / 0.40);
--elevation-pop: 0 10px 48px -10px hsl(224 71% 2% / 0.70);
```

This yields theme-aware `shadow-card`, `shadow-card-hover`, `shadow-primary`, `shadow-pop`
utilities. **Do not** touch `--background`, `--primary`, radius, or color vars.

**0.2 — `globals.css`: focus + spark utilities + reduced-motion.** Add a new
`@layer components { … }` (or `@utility`) block:

```css
/* Custom indigo focus halo — the passive "spark" fingerprint.
   Applied ONLY to our bespoke interactive elements, never to ui/* primitives. */
.focus-spark:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
  box-shadow: 0 0 0 4px hsl(var(--primary) / 0.18);
  transition: box-shadow var(--dur-2) var(--ease-spark);
}

/* Active "spark" gesture — a single restrained pulse. */
@keyframes spark-pulse {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.14); }
  100% { transform: scale(1); }
}
.spark-pulse { animation: spark-pulse var(--dur-3) var(--ease-spark-out); }
```

And the global reduced-motion safety net (defense-in-depth alongside framer + confetti):

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**0.3 — `src/lib/motion.ts` `[new]`** (dependency-free; objects/arrays only):

```ts
// Client-only consumers. Do NOT import in Server Components, middleware, or auth.config.
export const EASE_SPARK = [0.22, 1, 0.36, 1] as const;
export const EASE_SPARK_SOFT = [0.33, 1, 0.68, 1] as const;
export const EASE_SPARK_OUT = [0.34, 1.4, 0.64, 1] as const; // spark/celebration only
export const DUR = { fast: 0.12, base: 0.2, slow: 0.32, celebrate: 0.48 } as const;

export const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE_SPARK } },
};
export const staggerContainer = (stagger = 0.06, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});
```

**0.4 — `motion-provider.tsx` `[new]`** (`"use client"`):

```tsx
"use client";
import { MotionConfig } from "framer-motion";
import { EASE_SPARK, DUR } from "@/lib/motion";
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ ease: EASE_SPARK, duration: DUR.base }}>
      {children}
    </MotionConfig>
  );
}
```

`reducedMotion="user"` makes **every** framer animation app-wide honor the OS setting
without per-component work; the default `transition` quietly unifies any framer animation
that doesn't set its own curve onto the signature.

**0.5 — `layout.tsx` `[edit]`** Wrap `children` with `MotionProvider` (inside
`SynergyProvider`, around `<main>` content). Keep layout a Server Component.

**Phase 0 verify:** `npx tsc --noEmit` clean; `next dev` — app looks identical, no console
errors; toggle OS "reduce motion" and confirm existing slide/modal animations now snap.
**Commit:** `feat(design): add signature motion/shadow/focus tokens + reduced-motion infra`

---

### Phase 1 — Signature: logo collapse + focus spark

**1.1 — `app-header.tsx`: `ABTalks → AB` collapse on scroll.** The header is already a
client component. Add a rAF-throttled, **passive** scroll listener with hysteresis
(collapse when `scrollY > 24`, expand when `scrollY < 8`) setting a `collapsed` boolean;
clean up on unmount. Restructure the wordmark so the tail can collapse:

```tsx
<Link href="/dashboard" data-collapsed={collapsed} className="logo-link …">
  <span className="text-primary">A</span>B<span className="logo-tail">Talks</span>
</Link>
```

**1.2 — `globals.css`: `.logo-tail` rule.** Collapse the **tail only** (`AB` always
visible). `max-width` is the one allowed non-transform here — it's a single, low-frequency,
tiny element; the global reduced-motion block snaps it:

```css
.logo-tail {
  display: inline-block; overflow: hidden; white-space: nowrap;
  max-width: 6ch; opacity: 1; vertical-align: bottom;
  transition: max-width var(--dur-3) var(--ease-spark), opacity var(--dur-2) var(--ease-spark);
}
.logo-link[data-collapsed="true"] .logo-tail { max-width: 0; opacity: 0; }
```

**1.3 — focus spark.** Add `focus-spark` to the header's **bespoke** interactive elements
(logo `Link`, Jobs/Admin `Link`s, the dropdown trigger `button`, the logout `button`) and
**remove their ad-hoc `focus-visible:ring-*` classes** so the halo is the single focus
language. **Do NOT** touch `ui/*` primitives — `Button`, `DropdownMenuItem`, etc. keep
their own built-in focus ring.

**1.4 — `bottom-nav.tsx`.** Add `focus-spark` to each tab `Link`. Add an animated active
indicator using framer `layoutId` (transform-only, shared-element slide between tabs);
respects reduced-motion automatically via the Phase-0 `MotionConfig`. Keep existing colors
and the blurred-pill language.

**Phase 1 verify:** scroll the dashboard on mobile (390px) and desktop — wordmark settles
to `AB` and back smoothly on the signature curve, no layout jump in surrounding header
items; Tab through the header and bottom nav — every focusable bespoke control shows the
indigo halo; reduce-motion → logo snaps, indicator doesn't slide.
**Commit:** `feat(design): signature logo collapse on scroll + indigo focus spark`

---

### Phase 2 — Dashboard polish

**2.1 — `stagger.tsx` `[new]`** (`"use client"`): a `<Stagger>` container + `<StaggerItem>`
using `staggerContainer`/`fadeInUp` from `motion.ts`, with `whileInView`/`initial="hidden"
animate="show"` and `viewport={{ once: true }}`. **Children-only API** — no function/icon
props.

**2.2 — `dashboard/page.tsx` `[edit]`:**
- Wrap the four-up stat-card grid (`dashboard/page.tsx:456`) in `<Stagger>` so the cards
  settle in on first paint. Cards remain server-rendered JSX passed as children.
- Apply elevation: `shadow-primary` on the hero "Your 60-Day Journey" card
  (`dashboard/page.tsx:336`) and the "Today's Task" card; `shadow-card`/`hover:shadow-card-hover`
  on the four stat cards (added via `className` on the `<Card>` call sites — **not** in
  `card.tsx`). Keep it sparing — primary surfaces only.
- Typographic craft on the big headings: add `text-balance` and tighten tracking
  (`tracking-tight`) on `CardTitle`s like "Your 60-Day Journey". Stat numbers already use
  `tabular-nums`; leave font sizes/identity alone.

**2.3 — `stat-number.tsx` `[new, optional]`** (`"use client"`): a reduced-motion-aware
count-up for a single integer (uses `useReducedMotion` → renders the final value instantly
when reduced). Pass only the numeric `value` (serializable) from the server page. If this
adds risk/jank on mobile, **skip it** — the stagger alone already elevates the cards.

**Phase 2 verify:** dashboard cards settle in once on load (not on every re-render),
stagger reads calm not flashy; tinted shadow visible on hero cards in both themes; numbers
align (tabular); reduce-motion → cards appear instantly, no count-up.
**Commit:** `feat(design): dashboard entrance stagger, tinted elevation, heading craft`

---

### Phase 3 — Heatmap comes alive

**3.1 — `submission-heatmap.tsx`: mount fill-in.** Wire the **already-defined orphan**
`--animate-heatmap-cell` keyframe: give each cell `animation: var(--animate-heatmap-cell)`
with a per-cell `animation-delay` (e.g. `index * 12ms`, capped) so the grid fills in
left-to-right on mount. Transform/opacity only (the keyframe already is). Guard so it runs
once (e.g. only animate on first mount, not on dialog open/close re-renders).

**3.2 — custom hover tooltip.** Replace the native `title=` attribute
(`submission-heatmap.tsx:184`) with a lightweight custom tooltip (a positioned `role="tooltip"`
element or a `ui/*`-free popover) showing `tooltipLabel(cell)`, fading in on the signature
curve. Keep it keyboard-accessible (show on focus too) and dismiss on blur/escape.

**3.3 — today's cell spark.** Give the cell for the current day a subtle, looping-free
resting accent (e.g. a soft indigo ring that breathes once via `spark-pulse` on mount) so
the eye lands on "today." Restraint — one cell, no infinite loop.

**3.4 — focus.** Add `focus-spark` to the cell `<button>`s and drop their ad-hoc
`focus-visible:ring-*`.

**Phase 3 verify:** heatmap fills in once on load; hovering/focusing a cell shows the
custom tooltip with the right label; today's cell is visually findable; reduce-motion →
no fill-in, tooltip still works; still scrolls horizontally at 390px.
**Commit:** `feat(design): heatmap mount fill-in, custom tooltip, today-cell spark`

---

### Phase 4 — Streak & synergy spark

**4.1 — `spark.tsx` `[new, optional]`** (`"use client"`): a tiny reusable component/hook
that applies the `spark-pulse` (or framer equivalent with `EASE_SPARK_OUT`) to its child
when a `trigger` value increases. Reduced-motion → no-op.

**4.2 — `synergy-chip.tsx` `[edit]`:** when `points` increases from its previous value,
pulse the chip / flame once (`spark-pulse`). The chip already has the indigo→violet
gradient — this makes earning synergy *felt*. No layout change.

**4.3 — `dashboard/page.tsx` `[edit]`:** apply the same spark to the streak stat card's
`Flame`/number on mount when `currentStreak > 0` (single pulse, not looping), tying the
"momentum" surfaces together with one gesture.

**Phase 4 verify:** completing a day (or any synergy gain that re-renders the chip) pulses
it once; streak flame sparks on dashboard load when streak > 0; nothing loops forever;
reduce-motion → static.
**Commit:** `feat(design): streak/synergy spark micro-gesture`

---

### Phase 5 — Day-completion moment

**5.1 — `submission-flow.tsx`: orchestrate the success entrance.** The success screen
already exists; make it *arrive*. Wrap the success block in framer and sequence:
icon/trophy **pop** (scale+fade on `EASE_SPARK_OUT`) → headline fade-up → the three stat
cards **stagger** in → the journey progress bar **fills** to `journeyPct` on the curve.
Keep the existing layout, copy, and the `width`-animated bar (the second allowed
non-transform — single element, one-shot).

**5.2 — confetti palette.** Change the confetti `colors` array to the brand identity —
indigo/violet primary with restrained accents, e.g.
`["#4F46E5", "#6366f1", "#818cf8", "#8B5CF6", "#a78bfa"]` (drop the pink/amber/green
rainbow). **Keep `disableForReducedMotion: true`** on every `confetti(...)` call.

**5.3 — reduced-motion.** Use `useReducedMotion()`; when true, render the success screen in
its final state with no entrance sequence (confetti already self-disables).

**Phase 5 verify:** submit a day on a test account — the success screen orchestrates in
cleanly, confetti reads indigo/violet (on-brand), progress fills smoothly; the Day-60
trophy variant still works; reduce-motion → instant final state, no confetti.
**Commit:** `feat(design): orchestrated day-completion moment + on-brand confetti`

---

### Phase 6 — State design (skeletons + empty states)

**6.1 — `dashboard/loading.tsx` `[edit]`:** rebuild to **mirror the current** dashboard
(heatmap card → today's-task card → four stat cards → activity), not the stale 3-column
leaderboard layout it shows today. Use `Skeleton` (or Phase-0 shimmer) shapes sized to the
real content so the transition into content is seamless.

**6.2 — `loading.tsx` `[new]`** for `challenge/[day]`, `profile`, `quiz/[quizId]`, `jobs`,
`mission` — content-shaped skeletons that match each page's real card/heading rhythm. Add
only where a `loading.tsx` does **not** already exist. Keep them Server Components.

**6.3 — empty states (visual only, COPY UNCHANGED).** `empty-state.tsx` `[new, optional]`:
a centered shell (muted Lucide icon + spacing + one-shot fade-in) that wraps the
**existing** empty-state text verbatim. Apply to dashboard "Recent activity" empty
(`dashboard/page.tsx:637`) and the leaderboard empty (`community-leaderboard.tsx:166`).
**Do not change any wording** — only the surrounding visual. (If the user later *wants* new
empty-state copy, that's a separate, explicit decision — flag it, don't invent it.)

**6.4 — toasts/pressed/disabled.** Quick audit pass: confirm `sonner` toasts enter on the
signature timing (they inherit fine — no restyle needed); verify pressed (`active:`) and
`disabled:` states on bespoke buttons read intentionally. No `ui/*` edits.

**Phase 6 verify:** throttle network in dev and hard-navigate each route — skeletons match
the real layout shape (no jarring reflow when content lands); empty states look cared-for
with **identical copy**; build clean.
**Commit:** `feat(design): content-shaped skeletons + polished empty states`

---

### Phase 7 — Transitions & accessibility sweep

**7.1 — list stagger.** Apply the shared `<Stagger>` to the dashboard "Recent activity"
list and (when re-enabled) the leaderboard rows, so lists settle in rather than snap.
Reuse Phase-2 wrappers — no new motion vocabulary.

**7.2 — transition consistency.** Audit modal/sheet/route transitions that hand-roll
framer values and route them through `motion.ts` variants / the `MotionConfig` default, so
everything shares the curve. Don't rewrite working animations wholesale — only align stray
easings/durations.

**7.3 — final a11y pass over everything touched (Phases 0–6):**
- `focus-spark` (or a primitive's own ring) is present and visible on **every** interactive
  element; nothing relies on color alone.
- Every animation honors reduced-motion (spot-check with OS setting on): logo, stagger,
  heatmap, spark, completion, indicator.
- Keyboard nav: tab order intact, custom heatmap tooltip reachable by focus, no focus
  traps, dialogs still escape-close.
- Contrast: tinted shadows/halos didn't reduce text or border contrast in either theme.

**Phase 7 verify:** full keyboard-only walkthrough of dashboard → challenge → completion →
profile at 390px and desktop, both themes, reduced-motion on and off. No jank, no missing
focus, no contrast regressions.
**Commit:** `feat(design): list stagger, transition unification, a11y sweep`

## 6. Guardrails for Cursor (DO NOT)

- **DO NOT** edit any file in `src/components/ui/*`. Enhance via `className` at call sites
  or by wrapping. (`button.tsx`, `card.tsx`, `skeleton.tsx`, `sonner.tsx`, `dialog.tsx`, …
  are all off-limits.)
- **DO NOT** change existing color vars, the indigo `--primary`, the warm background, the
  domain colors, the radius scale, or the fonts in `globals.css`. **Append** new tokens
  only; never modify existing lines.
- **DO NOT** change any copy, wording, data, business logic, routing, or IA. This is visual
  + motion only. (Empty-state text is **copy** — keep it verbatim.)
- **DO NOT** import `framer-motion` or `src/lib/motion.ts` into `middleware.ts`,
  `auth.config.ts`, or any Server Component on the edge path. Every motion component is
  `"use client"`. Keep the edge bundle clean (the 1 MB Edge limit rule still applies).
- **DO NOT** pass functions, Lucide **icon components**, or class instances from a Server
  Component to a client motion wrapper. Pass `children` (already-rendered JSX) and
  serializable primitives only. (This is the recurring Server→Client failure mode.)
- **DO NOT** add new runtime dependencies — `framer-motion` and `canvas-confetti` are
  already installed. No new motion/animation library.
- **DO NOT** animate `width`/`height`/`top`/`left`/box layout in scroll- or list-driven
  animations. Transform/opacity only. The **only** two exceptions are the logo `max-width`
  and the completion progress `width` — both single, one-shot, low-frequency elements.
- **DO NOT** introduce glow-everything, rainbow gradients, infinite loops, or glassmorphism.
  The signature is the **only** "special" effect; everything else just moves on the curve.
- **DO NOT** create abstraction files beyond those this plan lists. `stat-number.tsx`,
  `spark.tsx`, `empty-state.tsx` are marked optional — inline or skip if they don't earn
  their place.
- **DO NOT** run `npm run build` for verification — its `build` script runs
  `prisma migrate deploy` against the **shared** Neon DB. Use `npx tsc --noEmit`,
  `npm run lint`, and `next dev`. (No schema changes here, so migration is a no-op, but
  don't touch the shared DB to "verify" CSS.)
- Confirm each phase's files were actually written and `npx tsc --noEmit` passes **before**
  reporting the phase done. Report back per phase; the user reviews before the next.

## 7. DB safety

**Not applicable.** This plan changes **no** schema, migrations, seed data, or any
persisted state — it touches only CSS, motion infra, and component presentation. No Neon
branch/snapshot needed. (Still: never run `npm run build` to "verify," per the guardrail
above, since that script hits the shared DB.)

## 8. Verification (per phase + overall)

Each phase lists its own manual check and commit above. For every phase:

- **Typecheck:** `npx tsc --noEmit` is clean (strict TS, no `any`).
- **Lint:** `npm run lint` passes.
- **Run:** `next dev` and manually test the phase's surface at **390px** (mobile-first) and
  desktop, in **both** light and dark themes.
- **Reduced motion:** toggle the OS "reduce motion" setting and confirm the phase's
  animations degrade gracefully (snap/instant, never broken).
- **Files changed:** exactly the files listed for that phase — nothing under
  `src/components/ui/*`, no schema/migration files, no copy changes.
- **Performance:** scroll and interactions stay smooth (no visible jank/layout thrash);
  spot-check with DevTools Performance if a list/scroll animation feels heavy.

Overall acceptance: the app reads as **one designed thing** — a single easing curve, one
indigo focus halo, one spark gesture, one logo collapse — with the existing identity fully
intact.

## 9. Commit messages

Per-phase commits are listed in §5. Suggested branch: `feature/design-enhancement` (off the
current `feature/UI`). Each phase is a self-contained, independently reviewable commit so
the user can hand them to Cursor one at a time.
