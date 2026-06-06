# 006 — "Our Mission" page visual redesign

> Standalone, no schema. Branch: `git checkout -b feature/mission-redesign`
> (or fold into whatever branch carries the synergy/nav work — it touches a
> different file, so no conflicts).

## 1. Goal
The shipped `/mission` page (built in plan 002) is correct but visually flat —
four headings over grey paragraphs. Redesign it into an engaging, mobile-first
marketing-style page using the existing design tokens, **keeping the exact
copy**. No content changes, no new routes, no schema.

## 2. Context / current behavior
- `src/app/mission/page.tsx` is a Server Component: `auth()` guard →
  `<AppHeader>` → a `max-w-3xl` column of four `<section>`s, each a
  `font-display` h2 over `text-muted-foreground` paragraphs. Plain text.
- The page is authed-only (middleware gates `/mission`); the bottom nav's
  "Our Mission" tab and the desktop avatar-dropdown link both point here.
- Design tokens already available (from `globals.css`, do NOT add new ones):
  - `--primary` indigo `239 84% 67%` → `text-primary` / `bg-primary` /
    `text-primary-foreground`.
  - Domain utilities: `text-domains-ai` (#8b5cf6 violet) + `bg-domains-ai-bg`;
    `text-domains-ds` (#0891b2 cyan) + `bg-domains-ds-bg`; `text-domains-se`
    (#10b981 emerald) + `bg-domains-se-bg`. (These are used in admin badges
    already, e.g. `bg-domains-ai-bg text-domains-ai`.)
  - `font-display` = Plus Jakarta Sans.
  - Card conventions: `rounded-xl` / `rounded-2xl`, soft border, subtle shadow,
    `hover:shadow-md`.
- `framer-motion` is a dependency (used in `day-page.tsx`) — but to keep this a
  **Server Component**, prefer CSS-only motion (`tw-animate-css` is installed)
  or skip animation. Do NOT convert the page to a client component just for
  entrance animations. (If a subtle entrance is wanted, a tiny client
  `MissionReveal` wrapper is acceptable — see §4.)

## 3. Files to touch
- `src/app/mission/page.tsx` `[edit]` — replace the four flat sections with the
  designed layout below. Keep the `auth()` guard, `AppHeader`, and the page
  background.
- `src/components/mission/` `[new, only if needed]` — if any piece needs client
  interactivity (e.g. an entrance-animation wrapper), put it here as a tiny
  client component. Otherwise add **no** new files (inline the JSX).

No other files. No `globals.css` edits (use existing tokens). No new deps.

## 4. Server vs Client
- `mission/page.tsx` stays a **Server Component**. All sections are static
  markup + Lucide icons rendered server-side (icons render fine in RSC).
- If you add an entrance animation, the ONLY client piece is an optional
  `MissionReveal` wrapper (`"use client"`, framer-motion) that wraps children;
  it takes `children` only — no functions/Dates/icon props across the boundary.
  Prefer pure CSS (`animate-in fade-in` from `tw-animate-css`) and add nothing.

## 5. Step-by-step changes — the redesigned page

Keep the outer shell: `auth()` guard, `headerUser`, `<AppHeader user={...} />`,
and a page wrapper. Replace the inner content. Target layout (top to bottom):

### 5.1 Background + container
- Page wrapper: `flex min-h-svh flex-col bg-muted/30`.
- Content container: `mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:py-14
  space-y-12 sm:space-y-16`.

### 5.2 Hero
- A centered hero block:
  - Kicker pill: `inline-flex items-center gap-1.5 rounded-full border
    border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase
    tracking-wider text-primary` with a small `Sparkles`/`Compass` icon and
    the text "Our Mission".
  - H1 (`font-display text-3xl sm:text-5xl font-bold tracking-tight`):
    **"Talent isn't the problem. Proof is."** (promote this line — it's the
    thesis).
  - Sub-paragraph (`mt-4 max-w-2xl mx-auto text-base sm:text-lg
    text-muted-foreground`): the "ABTalks is that bridge — a community run by
    students, for students, founded by Anil Bajpai…" sentence.
  - Optional gradient flourish behind the hero: a `bg-gradient-to-b
    from-primary/5 to-transparent` rounded panel — keep it subtle.

### 5.3 "Why ABTalks exists" — the problem, as two cards
- Section heading (`font-display text-2xl font-semibold`) "Why ABTalks exists",
  with a one-line lead: the "Too many students… Two real problems, one missing
  bridge." paragraph, split into a short intro line + two cards:
  - `grid gap-4 sm:grid-cols-2`:
    - Card 1 — icon chip (`AlertTriangle`, amber: `bg-amber-500/10
      text-amber-600`), title "Students pay the price", body: the
      internships-that-pay-nothing / pay-to-join idea (from the existing copy,
      reworded ONLY by sentence-splitting — keep wording).
    - Card 2 — icon chip (`SearchX` or `EyeOff`, slate), title "Recruiters
      hire half-blind", body: the "a resume can't tell them who genuinely knows
      their craft" idea.
  - Cards: `rounded-2xl border bg-card p-5 shadow-sm`.

### 5.4 "How it works" — numbered stepper with domain accents
- Heading "How it works".
- A 3-step row (`grid gap-4 sm:grid-cols-3`), each a card with a big numbered
  badge and a domain-colored top accent, reflecting the "pick your track →
  build daily in public → leave a track record" flow from the existing
  paragraph. Keep the source sentence as the section's lead paragraph above the
  cards so no copy is lost.
  - Step 1 — accent `domains-se` (emerald): "Pick your track" — "AI, Data
    Science, or Software Engineering. Commit to 60 days."
  - Step 2 — accent `domains-ds` (cyan): "Build in public" — "Every day you
    build, push to GitHub, and share your progress — tagging us so the
    community can verify it's real."
  - Step 3 — accent `domains-ai` (violet): "Leave a track record" — "Working in
    the open forces real growth and leaves proof anyone can check."
  - Each card: `relative overflow-hidden rounded-2xl border bg-card p-5`; a top
    accent bar `absolute inset-x-0 top-0 h-1 bg-domains-se` (etc.); a numbered
    circle `flex size-9 items-center justify-center rounded-full
    bg-domains-se-bg text-domains-se font-display font-bold`.

### 5.5 "What you're working toward" — highlight band
- A full-width emphasis panel: `rounded-2xl bg-gradient-to-br from-primary to-
  violet-500 p-6 sm:p-8 text-primary-foreground`.
  - Icon (`Trophy` or `Target`) + h2 "What you're working toward".
  - Body: the existing "Complete the 60 days… they reach out to you. No
    applications shouted into the void." paragraph, in
    `text-primary-foreground/90`.
  - Keep contrast accessible (white text on the indigo→violet gradient).

### 5.6 "You're not doing it alone" — community card + Discord CTA
- A `rounded-2xl border bg-card p-6` card:
  - Icon chip (`Users`, primary), h2 "You're not doing it alone".
  - Body: the existing "ABTalks is students lifting each other up… let it speak
    for you." paragraph.
  - A CTA: since the platform has a Discord (referenced in the copy and in the
    dashboard FAQ), render a Discord link **as a styled `<Link>`** using
    `buttonVariants({ variant: "default" })` (NOT `<Button asChild>`).
    - Use the existing Discord URL if one is already defined in the codebase
      (grep `discord` — the dashboard FAQ likely has it). If none exists, use a
      `#` placeholder and add a `TODO` comment so it's obvious to wire up — do
      NOT invent a URL.

### 5.7 Copy fidelity
- **Do not rewrite the marketing copy.** You may only: split a paragraph into
  shorter sentences to fit cards, and promote "Talent isn't the problem. Proof
  is." into the hero headline. Every idea in the current page must still be
  present. Preserve the apostrophe escaping pattern already used
  (`isn&apos;t`, etc.).

## 6. Guardrails for Cursor (DO NOT)
- DO NOT change the copy's meaning or drop any sentence. This is a visual pass.
- DO NOT convert `mission/page.tsx` to a client component. Keep it a Server
  Component; icons render server-side. Only an optional tiny `MissionReveal`
  wrapper may be client, and only if you add entrance animation.
- DO NOT add new CSS variables or edit `globals.css`. Use existing tokens:
  `primary`, `domains-ai/ds/se` (+ their `-bg` variants), `muted`, `card`,
  `border`, and standard Tailwind color utilities (amber/slate/violet) already
  used elsewhere.
- DO NOT use `<Button asChild>` or `<Button render={<Link>}>`. The Discord CTA
  is a `<Link>` styled with `buttonVariants`.
- DO NOT invent a Discord URL. Reuse an existing one from the codebase or leave
  a clearly-commented placeholder.
- DO NOT add new dependencies. `framer-motion` and `tw-animate-css` are already
  installed if you want subtle motion.
- DO NOT add `requireRole`/`requireAdmin` — `/mission` is authed-any-role; the
  existing `auth()` guard + middleware are sufficient. Keep the guard as-is.
- DO NOT touch the bottom nav, header, or middleware — this plan is one file
  (plus an optional tiny wrapper).
- DO NOT pass icons/functions across a Server→Client boundary (only relevant if
  you add `MissionReveal`, which takes `children` only).

## 7. DB safety
Not applicable — no schema or data changes.

## 8. Verification
Manual (local, `ENABLE_DEV_AUTH=true`):
1. `npm run dev`. Log in as any test user (e.g. `arjun@abtalks.dev` / `test`).
2. Open `/mission` (bottom-nav "Our Mission" on mobile, or avatar-dropdown
   "Our Mission" on desktop).
3. Confirm:
   - Hero shows "Talent isn't the problem. Proof is." as the headline.
   - The problem section shows two distinct cards (students / recruiters).
   - "How it works" shows three numbered steps with emerald/cyan/violet
     accents.
   - "What you're working toward" is the indigo→violet highlight band with
     readable white text.
   - "You're not doing it alone" card has a Discord CTA button (real URL or a
     commented placeholder).
   - Every sentence from the old page is still present somewhere.
4. **Responsive**: at 390px width, cards stack to one column, the hero scales
   down, nothing overflows horizontally, and the bottom nav doesn't cover the
   last card (root layout's `pb-16 md:pb-0` handles this).
5. **Light + dark**: toggle the theme — gradients, domain-bg chips, and the
   highlight band all stay legible in both.
6. **Build/typecheck**: `npm run lint`, `npm run build`, `tsc --noEmit` clean.
   The page must remain a Server Component (no accidental `"use client"` at the
   top of `mission/page.tsx`).

Files that should change (and only these): `src/app/mission/page.tsx`
(plus, optionally, one tiny client wrapper under `src/components/mission/`).

## 9. Commit message
```
feat(mission): visual redesign of the Our Mission page

Replaces the flat text layout with a designed, mobile-first page using the
existing tokens: a hero leading with "Talent isn't the problem. Proof is.",
a two-card problem section, a three-step "how it works" stepper with domain
color accents, an indigo→violet "what you're working toward" highlight band,
and a community card with a Discord CTA. Copy unchanged; page stays a Server
Component.
```
