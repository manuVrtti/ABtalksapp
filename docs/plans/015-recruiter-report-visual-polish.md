# 015 — Recruiter report visual polish (navy + gold template match)

> **Supersedes the visual direction of `014-recruiter-public-page-assessment-format.md`.**
> 014 built the two-section structure on the app's indigo/violet gradient and
> *excluded* contact / logistics / compensation. The user has since (a) added the
> data + admin capture for logistics, compensation, and contact, and (b) supplied a
> finished **navy + gold** report template (4-page PDF + page images) that this plan
> matches exactly. Where 014's guardrails forbid contact/logistics/compensation,
> **this plan overrides them** (private notes still stay off — see §6).
>
> Branch: `git checkout -b feature/recruiter-report-polish`. No schema/data change.

## 1. Goal
Make `/r/<token>` (and its print-to-PDF) look like the supplied template: a navy +
gold professional candidate report. Page 1 = branded resume (navy hero header,
light-gray skills sidebar, white main column). Pages 2+ = assessment report (navy
band, synergy score callout, three colored score cards with progress bars, detailed
feedback, coding-challenge table with a navy header, strengths, areas for growth,
Candidate Logistics + Compensation rail, navy Recommendation box). It currently
looks "bad" because the colors/layout are wrong (see §2); this plan corrects them to
the template.

## 2. Current behavior (what exists, and what's wrong)
`src/app/r/[token]/page.tsx` was already rebuilt into the two-section structure and
the getter (`getRecruiterProfileByToken`) already returns everything needed —
`logistics`, `compensation`, `email`, `phone`, `linkedinUrl`, `githubUsername`,
scores, `assessmentComposite`/`assessmentMax` — and deliberately **omits**
`adminNote`. **No getter/schema work remains.** But the page's visual design does
not match the template:

- **Header is inverted.** The template's page 1 has a **navy hero block** (name in
  white, target role in gold, contact line below) with a thin brand bar above it,
  and a **light-gray** skills sidebar. The current page does the opposite — a navy
  *sidebar* and a plain light header.
- **Wrong accent color.** Current uses maroon `#9a3324` for the target role/company.
  The template's accent is **gold** (`~#d99c2c`), used for the wordmark, target role,
  dates, company names, sidebar headings, the synergy number, the Passed badge, and
  the recommendation label.
- **Score cards are flat.** Template cards are **per-discipline colored** (blue /
  purple / teal) with a **progress bar** under each number. Current cards have only a
  top-accent line, no bars.
- **Table header is plain.** Template's Coding Challenge table has a **navy header
  row** (white text). Current uses the default table header.
- **Labels off.** Template heading is **"Candidate Logistics"** (current says
  "Candidate Expectations"); the compensation row is **"Negotiated Offer"** (current
  says "Negotiable Offer").
- **Footer** is a single confidential line; the template repeats a footer with
  "Page X of 4" on every page (a print limitation — see §5.7).

Design system context: app tokens are indigo `--primary` + violet; fonts are Plus
Jakarta (`font-display`) + Inter. This report uses a **local** navy/gold palette
(literal Tailwind arbitrary values, scoped to this page) — it must **not** change any
global token. App fonts are kept (no need to match the Word template's font).

## 3. Files to touch
- `src/app/r/[token]/page.tsx` `[edit]` — restyle to the template. Structure mostly
  stays; this is a palette + layout + per-section styling pass.
- `src/app/globals.css` `[edit]` — add a `.report-light` utility that re-declares the
  light CSS variables (so the document never follows the app's dark theme — see §5.0),
  and **optionally** an `@page { margin }` print rule (§5.7). **No existing token/color
  changes** — `.report-light` only re-states the light values already in `:root`.
- `src/app/r/[token]/print-button.tsx` — unchanged (reused).

**Not touched:** `getRecruiterProfileByToken` / schema / actions (already done),
`middleware.ts` (`/r` stays public), `src/components/ui/*` (style via `className` /
wrap only), the gamification synergy.

## 4. Server vs Client
- `page.tsx` — **Server Component** (public, no auth). Renders the view-model;
  mounts the client `PrintButton` (no props). No function/icon/Date crosses the
  boundary (`assessmentDate` is already a string; all content is plain JSON).
- `PrintButton` — the only client island (`"use client"`, `window.print()`,
  `print:hidden`). Unchanged.

## 5. Steps — restyle to the template

### 5.0 Force light theme (fixes invisible text + mixed light/dark pages) — DO THIS FIRST
**Symptom:** in the app's dark mode, the Professional Summary / Experience headings and
titles (fixed navy `#1e3a5f`) become invisible on the now-dark `bg-card`, and the report
reads as part-light / part-dark because some surfaces are fixed-light (`#f3f4f6` sidebar,
`#fbf6e9` synergy panel) while others are theme-reactive (`bg-card`, `bg-muted/30`,
`text-foreground`, `text-muted-foreground`, `border`).

**Cause:** the report mixes fixed colors with theme-reactive tokens. It's a shareable
document/PDF and must render **light for every visitor regardless of their theme.**

**Fix — make the report theme-independent:**
- Add a `.report-light` utility in `globals.css` that re-declares the **light** values of
  the theme variables (copy them verbatim from `:root` — do not invent new values):
  `--background, --foreground, --card, --card-foreground, --popover, --popover-foreground,
  --muted, --muted-foreground, --secondary, --secondary-foreground, --accent,
  --accent-foreground, --border, --input`. Because this class sits on the report root and
  re-states the light values, every themed Tailwind utility inside it (`bg-card`,
  `text-foreground`, `text-muted-foreground`, `bg-muted`, `border`) resolves to light even
  when `<html>` has `.dark`. This is additive — it does not change any existing token.
- Put `report-light` on the outermost report wrapper (the `min-h-svh …` root in
  `page.tsx`). Keep `[print-color-adjust:exact]`.
- For the few `ui/*` primitives used (`Table`, `Badge`), don't rely on their `dark:`
  variants (those still see `.dark` on an ancestor): give them the **fixed** colors this
  plan already specifies — navy table header `bg-[#1e3a5f] text-white`, gold "Passed"
  badge `border-[#d99c2c]/50 bg-[#fbf6e9] text-[#8a6310]`. That keeps them light too.
- Net effect: the card is always white, body text always dark, headings/navy always
  legible — both reported bugs disappear. (Alternative if `.report-light` feels too
  implicit: replace every themed token in `page.tsx` with fixed colors — `bg-white`,
  `text-slate-900`, `text-slate-600`, `border-slate-200`. The `.report-light` wrapper is
  preferred — far less churn.)

### 5.0.1 Local palette (document once at the top of the file)
Use these literal hex values via Tailwind arbitrary classes (e.g. `bg-[#1e3a5f]`,
`text-[#b9831f]`) — Tailwind needs literal strings, so don't interpolate a JS const
into class names. For inline `style` (score-card accent/bar colors) a small const map
is fine. Palette:

- **Navy** (hero header, assessment band, table header row, recommendation box,
  main-column section headings): `#1e3a5f`. Optional darker brand bar: `#16293f`.
- **Gold accent** (wordmark "AB TALKS", target role, sidebar headings, experience
  dates, company names, synergy number, Passed badge, recommendation label):
  display/large/bold text → `#d99c2c`; **small body-size gold text** (company names,
  dates, row values) → darker `#b9831f` for contrast on white (see §5.8).
- **Sidebar background**: `#f3f4f6` with a right border `#e5e7eb`.
- **Score colors** (number + progress-bar fill + matching feedback sub-heading):
  Communication `#2f6fb0` (blue), Programming `#8e3b8e` (purple), Behavior `#1a9e8f`
  (teal).
- Body copy keeps `text-foreground` / `text-muted-foreground`.

Keep the root print-color classes already present:
`[print-color-adjust:exact] [-webkit-print-color-adjust:exact]` and
`print:bg-white`. Document card: `mx-auto max-w-4xl … print:max-w-none
print:rounded-none print:border-0 print:shadow-none`.

### 5.1 Page 1 — brand bar + navy hero header
- **Brand bar** (full width, above the hero): `bg-[#16293f] px-6 py-2 text-right
  text-[11px]` — `AB TALKS` in `font-display font-bold text-[#d99c2c]`, then a muted
  `| AI Conversations That Matter` in `text-white/70`.
- **Hero header** (`bg-[#1e3a5f] px-6 py-7 text-white print:bg-[#1e3a5f]`):
  - Name — `font-display text-3xl font-bold text-white`.
  - Target role — `text-base font-semibold text-[#d99c2c]` (gold).
  - Contact line — `text-xs text-white/80`, parts joined by `  |  `:
    `email | phone | linkedin.com/in/… | github.com/<username> | <currentLocation>`.
    (Per the user's decision, this **includes email + phone**.) Strip the
    `https://(www.)?` prefix from the LinkedIn URL for display.
- **No** "Verified by ABTalks" / domain / ready badges in the hero (the template
  doesn't show them here). Keep the hero clean: name, role, contact only.

### 5.2 Page 1 — two columns (light sidebar + white main)
Grid: `grid grid-cols-1 md:grid-cols-[32%_1fr] print:grid-cols-[32%_1fr]`.

**Left sidebar** — `bg-[#f3f4f6] border-r border-[#e5e7eb] px-5 py-6 space-y-6`:
- **Photo** — square `Avatar` (`size-full rounded-lg` inside an `aspect-square
  max-w-[200px]`), `user.image` or initials fallback. (Photo lives in the sidebar,
  not the hero.)
- Sidebar section headings: gold, `font-display text-xs font-bold uppercase
  tracking-[0.12em] text-[#b9831f]` with a `border-b border-[#d99c2c]/40 pb-1`.
- **Technical Skills** — for each `skillGroups[]`: `category` as navy bold
  (`text-[#1e3a5f] text-xs font-semibold`), `skills.join(", ")` below in
  `text-xs text-muted-foreground`.
- **Education** — degree navy bold; institution muted; `year · score` smaller muted.
- **Languages Spoken** — list each `languagesSpoken[]` line.
- **Achievements** — small bulleted list.
- (Certifications belong here too, same pattern, if present.)

**Main column** — `px-6 py-7 space-y-6`, white:
- Main section headings (Professional Summary / Professional Experience / Key
  Projects): `font-display text-sm font-bold uppercase tracking-wide text-[#1e3a5f]`
  with a `border-b border-[#1e3a5f]/15 pb-1` rule.
- **Professional Summary** — `whitespace-pre-wrap text-sm leading-relaxed`.
- **Professional Experience** — per entry: title navy bold (`text-[#1e3a5f]`), period
  right-aligned gold (`text-[#b9831f] text-xs`); `company · location` in gold
  (`text-[#b9831f] text-sm`, optionally `font-medium`); bullets `list-disc text-sm`.
- **Key Projects** — title navy bold; `tech` as small gold/mono
  (`font-mono text-xs text-[#b9831f]`); description muted.

### 5.3 Page 2 — assessment band + synergy callout
- New printed page: section wrapper `border-t print:break-before-page`.
- **Assessment band** (`bg-[#1e3a5f] px-6 py-6 text-white print:bg-[#1e3a5f]`):
  small gold label `AB TALKS` + white `CANDIDATE ASSESSMENT REPORT`
  (`text-[11px] font-bold uppercase tracking-[0.18em]`, "AB TALKS" in `#d99c2c`);
  candidate name `font-display text-2xl font-bold`; meta line `text-xs text-white/70`:
  `Assessment Date: … · Interviewer: … · Challenge Round: … · ABTalks ID: …` (only
  items present).
- **Synergy score callout** (only if all three scores present): a pale-gold panel —
  `rounded-lg border-l-4 border-[#d99c2c] bg-[#fbf6e9] px-5 py-4 print:bg-[#fbf6e9]`.
  Line: `ABTalks Synergy Score:` in navy bold + the number in gold
  (`text-[#b9831f] font-bold`) + ` / 300 Points`. Subtitle (muted): "Composite
  across Communication, Programming, and Behavior. A score above 240 indicates
  strong readiness." (No "(Replace with actual score)" — that's template
  placeholder text.)

### 5.4 Page 2 — three colored score cards (with progress bars)
Render only when all three scores exist. `grid grid-cols-1 sm:grid-cols-3 gap-3`.
Each card (`rounded-xl border bg-card p-4 shadow-sm break-inside-avoid`):
- Label uppercase muted (`text-xs font-bold uppercase tracking-wide
  text-muted-foreground`).
- Number big in the card color + `/100` muted: `font-display text-3xl font-bold`
  with `style={{ color }}` for the number, `/100` in `text-muted-foreground`.
- **Progress bar**: a track `h-1.5 rounded-full bg-muted` with a fill
  `style={{ width: `${score}%`, backgroundColor: color }}`.
- Caption italic muted.
- Colors: Communication `#2f6fb0`, Programming `#8e3b8e`, Behavior `#1a9e8f`.

### 5.5 Page 2 — body grid (feedback + rail)
Grid: `grid grid-cols-1 md:grid-cols-[1fr_300px] print:grid-cols-[1fr_300px] gap-6`.

**Left (feedback):**
- **Detailed Assessment Feedback** (navy main heading). Three sub-blocks (each if
  present): "Communication" (sub-heading in `text-[#2f6fb0]`), "Programming &
  Technical Skills" (`text-[#8e3b8e]`), "Behavior & Culture Fit" (`text-[#1a9e8f]`)
  — colored sub-headings to echo the cards; prose muted.
- **Coding Challenge Results** (if any): responsive — cards `< md` / `print:hidden`
  mobile cards, `<Table>` at `md+`/print. **Navy header row**: style
  `TableHeader`/`TableRow`/`TableHead` with `bg-[#1e3a5f] text-white` (via
  `className`, not by editing the ui primitive). "Passed" status → a gold badge
  (`border-[#d99c2c]/50 bg-[#fbf6e9] text-[#8a6310]`). Score column as-is.
- **Key Strengths** / **Areas for Growth** — navy headings + `list-disc` lists.

**Right rail** (`space-y-6`):
- **Candidate Logistics** (navy heading — note the label is "Candidate **Logistics**",
  not "Expectations"): a label⟷value list with row separators
  (`flex justify-between border-b border-border/40 pb-2`, label muted, value
  `font-medium text-right`). Rows (only non-empty), in this order: Open to
  Relocation, Preferred Locations, Current Location, Available From, Notice Period,
  Work Authorization, Preferred Work Mode.
- **Compensation Details** (navy heading): same list style. Rows: Current CTC,
  Expected CTC, **Negotiated Offer** (not "Negotiable"), Equity / ESOPs, Benefits
  Required, Currency Preference.
- **Recommendation** — navy box (`rounded-xl bg-[#1e3a5f] p-4 text-white
  print:bg-[#1e3a5f]`): gold label `ABTalks Recommendation` (`text-[11px] font-bold
  uppercase tracking-[0.14em] text-[#d99c2c]`), then the mapped level white & bold
  (`font-display text-lg font-bold`): Strongly Recommend / Recommend / Neutral / Do
  Not Recommend. Render only if set.

### 5.6 Footer
`border-t px-6 py-5`, centered `text-[11px] tracking-wide text-muted-foreground`:
`ABTalks Coding Challenge · AI Conversations That Matter · CONFIDENTIAL — For Hiring
Organizations Only`. (Live "Page X of 4" — see §5.7.) Keep a screen-only `PrintButton`
toolbar (`print:hidden`) at the top.

### 5.7 Print / PDF — two pages, no right-side clipping (REWORKED after testing the real PDF)
Observed in the actual printed PDF (a 4-page export): (1) the resume spills a **near-empty
page 2** containing only the sidebar tail (e.g. "Hindi — Native", Achievements) in the left
track while the right track is blank; (2) the **right edge is clipped** — Candidate
Logistics / Compensation values ("Bangalore, Pune, R…", "Current Location: New…") and the
Recommendation box are cut off; (3) total is **4 pages, not 2**.

**Targets: resume = page 1, assessment = page 2 — two pages total, nothing clipped.**

**A. Define the page box.** Add to `globals.css` (print-only, additive — does not touch any
existing token): `@page { size: A4; margin: 12mm; }`. This sets the printable area so
content stops running to the physical edge.

**B. Fix the right-side clipping (root cause = non-shrinkable grid tracks).** CSS grid
tracks default to `min-width: auto`, so a column refuses to shrink below its content's
intrinsic width and the whole grid grows wider than the page → the right side is clipped.
Make every track shrinkable and let content wrap:
- Resume columns: `print:grid-cols-[30%_minmax(0,1fr)]` (was `[32%_1fr]`).
- Assessment columns: `print:grid-cols-[minmax(0,1fr)_34%]` (was `[1fr_300px]` — **drop the
  fixed `300px`**; a fixed-px rail is exactly what pushes past the page edge).
- `MetaList` value cell: add `min-w-0 break-words` (keep the label `shrink-0`) so long
  logistics/compensation values wrap instead of overflowing.
- Hero contact line + any URL/email: `break-words` (`break-all` for URLs) so the long
  contact string can't widen the page.
- **Replace `print:max-w-none`** on the document card with `print:w-full` + `box-border`.
  `max-w-none` let the card exceed the page width; inside the `@page` margin box, `w-full`
  is correct.

**C. Fit two pages (kill the empty page).** The empty page 2 is the sidebar being slightly
taller than one page, so its tail flows over while the main column track is already done.
Reduce print density so the resume fits one page and the assessment fits one page:
- Smaller photo in print: `print:max-w-[140px]` on the avatar wrapper.
- Tighter print rhythm: e.g. `print:py-4` and `print:space-y-4` on the columns/sections
  (vs looser screen spacing); trim large section gaps. Keep screen spacing unchanged.
- Keep `print:break-before-page` between the two sections so each is its own page.
- Keep `break-inside-avoid` on score cards, each experience entry, and each
  logistics / compensation / recommendation block so nothing splits mid-block.
- Note: an unusually content-heavy profile may still flow to a 3rd page — that's
  acceptable/graceful; this targets the typical case (the example resume fits one page once
  `minmax(0,…)` + tighter density are applied).

**D. Colors & footer (unchanged).** Keep `print-color-adjust:exact` and explicit
`print:bg-[…]` on every colored band so they print. Live "Page X of N" still isn't possible
without a paged-print library (do **not** add one) — keep the static confidential footer,
and tell the user to turn **off** Chrome's own header/footer in the print dialog (that's
what prints the `localhost:3000/…` URL + date seen on the pages).

### 5.7.1 Round 2 — still 4 pages (after testing `example2.pdf`)
Width-clipping is fixed, but the PDF is still 4 pages: (1) the **resume** spills ~3 bullets
of the sidebar onto a near-empty page 2; (2) the **assessment** is ~1.5 pages, so it flows
onto page 4; (3) the **coding-challenge table** renders a horizontal **scrollbar** in print
and clips the "Score" header (its mobile `overflow-x-auto` wrapper leaks into print).

**Fix 1 — coding table (clear bug).** The `md:block` table wrapper uses `overflow-x-auto`
for mobile; in print that draws a scrollbar and clips a column. Add `print:overflow-visible`
to the wrapper, and make the table `print:table-fixed w-full` with `break-words` cells so
columns wrap to fit the (now narrower) left grid column instead of scrolling. Wrap the whole
table block in `break-inside-avoid` so it doesn't split across a page.

**Fix 2 — resume onto one page (small overflow).** It's only ~3 bullets over. Tighten print
density (these are *print-only* — leave screen spacing as is):
- Hero: `print:py-4` (from `py-7`); name may stay large.
- Photo: `print:max-w-[120px]`.
- Columns/sections: `print:space-y-3`; `SectionHeading`/`SidebarHeading` `print:mb-1.5`.
- Body copy: `print:text-[11px] print:leading-snug` on the resume columns.
This reclaims the few lines needed so the sidebar fits page 1.

**Fix 3 — assessment onto one page (real density trade-off, see note).** The assessment has
~1.5 pages of genuine content. To force it onto one page, compress in print:
- Band `print:py-3`; synergy callout `print:py-2`; score cards `print:p-2` with the number
  `print:text-2xl`; body grid `print:gap-4`; sections `print:space-y-3`; base
  `print:text-[11px] print:leading-snug`.
- If density alone doesn't land it on one page, apply a tuned **print zoom** to the
  *assessment section wrapper only*: `print:[zoom:0.85]` (tune 0.8–0.9 against real data).
  `zoom` is honored by Chrome's print engine and uniformly shrinks the section to fit. Keep
  it on the assessment section so the resume's sizing is unaffected.
- Keep `print:break-before-page` between the two sections so the result is exactly resume =
  page 1, assessment = page 2.

> **DECISION (user, locked): force exactly 2 pages total.** Implement Fix 3 — compress the
> assessment to one page via print density + the tuned `print:[zoom:…]` on the assessment
> section. Accept the denser assessment text. (The rejected alternative was ~3 pages at
> full size; do not implement that. A guaranteed-2-pages-at-full-size result for *any*
> content volume would need a server-side PDF renderer — out of scope.) Tune the zoom
> against `example2.pdf`'s data so both the resume and the assessment each land on exactly
> one page.

### 5.8 Accessibility
- Gold `#d99c2c` on white fails WCAG AA at body size — use the darker `#b9831f` (or
  `#8a6310`) for **small** gold text (company names, dates, row values, badge text);
  reserve `#d99c2c` for large/bold display text and for gold-on-navy (which passes).
- White text on `#1e3a5f` and the three score colors on white all pass — verify.
- Score is conveyed by number + caption, not color alone (color-blind safe).
- Keep print legible: don't rely on hover; ensure focus-visible on the `PrintButton`.

### 5.9 Empty states
Every section stays conditional on its data (already the pattern). If essentially
nothing is filled, show the existing minimal "Profile coming soon" note rather than
empty headings/rails.

## 6. Guardrails for Cursor (DO NOT)
- **DO NOT** change any global token in `globals.css` (indigo `--primary`, violet,
  domain colors, fonts, radius). The navy/gold palette is **local** to this page via
  arbitrary Tailwind values. Allowed `globals.css` touches: the `.report-light` utility
  (§5.0, re-states existing light values only) and an optional `@page` margin rule (§5.7).
- **DO NOT** let the report follow the app's dark theme. It is a theme-independent
  document — it must look identical (light) whether the visitor is in light or dark mode.
  Either keep it under `.report-light` (§5.0) or use fixed colors; never leave themed
  tokens (`bg-card`, `text-foreground`, `text-muted-foreground`, `bg-muted`, `border`)
  free to flip in dark mode.
- **DO NOT** edit `src/components/ui/*` (Avatar, Badge, Table, …). Restyle by passing
  `className` at the call site or wrapping — never modify the primitive.
- **DO NOT** add `auth()`/`requireAdmin`/`requireRole` to `/r/[token]` or add `/r` to
  `middleware.ts`. It stays public (`metadata.robots: { index: false }` stays).
- **DO NOT** render the private note (`adminNote`). It is intentionally not in the
  view-model and must not be fetched or shown. (This is the one part of the template
  we omit — by the user's explicit decision.)
- **NOTE — this overrides 014:** contact (email/phone/LinkedIn/GitHub), Candidate
  Logistics, and Compensation **are** shown here (014 forbade them; that guardrail is
  superseded). Do not strip them back out.
- **DO NOT** show the gamification **Synergy points** here — the "/300" shown is the
  **assessment composite** (`assessmentComposite`), a different concept.
- **DO NOT** add dependencies — no PDF/paged-print library. PDF is `window.print()` +
  Tailwind `print:` utilities only.
- **DO NOT** add a photo upload / Blob — photo is `user.image` + initials fallback.
- **DO NOT** pass functions/icons/Dates across the Server→Client boundary;
  `PrintButton` is the only client island (no props).
- **DO NOT** use `<Button asChild>` / `<Button render={<Link>}>` — use
  `buttonVariants`.
- **DO NOT** change the getter/actions/schema — already done; this plan is page-only.

## 7. DB safety
Not applicable — no schema or data change. (The data + admin capture shipped earlier;
the getter already exposes everything this page renders.)

## 8. Verification
1. `npm run dev`. Use a published student review with all fields filled (resume +
   scores + feedback + coding challenges + strengths + growth + recommendation +
   logistics + compensation + contact).
2. Open `/r/<token>` logged-out and compare to the template images:
   - **Page 1:** dark brand bar ("AB TALKS" gold) → navy hero (white name, **gold**
     target role, contact line incl. email/phone) → **light-gray** sidebar (gold
     headings: Technical Skills / Education / Languages / Achievements) + white main
     (navy headings; gold dates/company; bullets).
   - **Page 2:** navy assessment band → pale-gold synergy callout (`/300`) → three
     **colored** score cards with **progress bars** (blue/purple/teal) → feedback with
     colored sub-headings → coding table with a **navy header** + gold "Passed"
     badges → strengths / growth → right rail "**Candidate Logistics**" +
     "Compensation Details" (incl. "**Negotiated Offer**") → navy Recommendation box.
   - **No** private note anywhere; view the RSC payload to confirm `adminNote` absent.
3. **PDF**: Print → Save as PDF (turn **off** Chrome's headers/footers). It is **two
   pages** — resume = page 1, assessment = page 2 — with **no near-empty page**. **Nothing
   is clipped on the right**: the full Candidate Logistics / Compensation values and the
   Recommendation box are visible, and the hero contact line wraps within the page. Colors
   print; `PrintButton` hidden.
4. **Theme independence (the reported bug):** toggle the app to **dark** mode, then open
   `/r/<token>` — the whole report must stay **light** (white card, dark body text), and
   the Professional Summary / Experience headings + titles + body must all be legible.
   No part of the document should appear dark or wash out. Repeat in light mode (identical).
5. **Mobile 390px**: columns stack, no horizontal overflow, table falls back to cards
   `< md`.
6. **Partial data**: a sparsely-filled review shows only populated sections/rows — no
   empty headings or rails.
7. **Build/typecheck/lint:** `npx tsc --noEmit`, `npm run lint` clean.
   (Use `next build` only if needed — note `npm run build` runs `prisma migrate
   deploy` against the shared Neon DB; prefer `tsc`/`lint`/`dev` for a CSS-only change.)

Files that should change: `src/app/r/[token]/page.tsx` and `src/app/globals.css`
(the `.report-light` utility, plus an optional `@page` rule).

## 9. Commit message
```
feat(recruiter): match report to navy + gold candidate template

Restyles /r/<token> to the supplied template: navy brand bar + hero header
(white name, gold target role, contact line), light-gray skills sidebar with gold
section headings, and a white main column. Assessment page gets a navy band, a
pale-gold synergy /300 callout, three discipline-colored score cards with progress
bars (blue/purple/teal), color-matched feedback sub-headings, a coding-challenge
table with a navy header and gold "Passed" badges, and a right rail with Candidate
Logistics + Compensation and a navy Recommendation box. Local navy/gold palette only
(no global token/font changes); private notes remain hidden; print-to-PDF hardened
with page breaks, break-inside-avoid, and color-exact bands.
```
