# 014 — Public recruiter page redesign (resume + assessment-report format)

> Plan B of two (after `013-recruiter-assessment-data-and-admin.md`, which adds
> the data + admin capture). **013 must ship first.** No schema change. Branch:
> `git checkout -b feature/recruiter-public-page`.
>
> Reference: the user's `Untitled.docx`. The public page reproduces its layout
> as TWO sections — a **Candidate Resume** page and an **ABTalks Candidate
> Assessment Report** — using only the public subset (per 013): no contact,
> no logistics, no compensation, no private notes.

## 1. Goal
Redesign `/r/<token>` to match the document's format: a branded resume one-pager
(skills by category, education, certifications, languages, achievements, summary,
experience, projects, photo) followed by the assessment report (the /100 scores
+ /300 composite, feedback, coding-challenge table, strengths, areas for growth,
recommendation), with a "Connect via ABTalks" CTA instead of contact details,
and clean print-to-PDF (two A4 pages).

## 2. Context / current behavior
- After 013, `getRecruiterProfileByToken` returns the full **public** view-model
  (resume + assessment fields + computed `assessmentComposite`/`assessmentMax`,
  plus identity/proof: fullName, domain, college/grad or org/role/yearsExp,
  `user.image`, days/streak, isReadyForInterview). It excludes contact,
  logistics, compensation, adminNote.
- `src/app/r/[token]/page.tsx` is public (no auth), with `metadata.robots:
  { index: false }`, `[print-color-adjust:exact]`, and the client `PrintButton`
  (`window.print()`, `print:hidden`). After 013 it shows an interim layout.
- Design tokens: `--primary` indigo; `violet-500`; domain utilities; `font-display`
  = Plus Jakarta. App gradient hero pattern: `from-primary to-violet-500`.
- Doc branding line: **"AB TALKS | AI CONVERSATIONS THAT MATTER."**

## 3. Files to touch
- `src/app/r/[token]/page.tsx` `[edit]` — full redesign into the two-section
  layout below. Renders the new view-model; every section conditional on data.
- `src/app/r/[token]/print-button.tsx` — unchanged (reused).

**Not touched:** schema, read/actions (done in 013), middleware (`/r` public),
`src/components/ui/*`, the gamification synergy.

## 4. Server vs Client
- `page.tsx` — **Server** (public). Renders the view-model; Lucide icons render
  server-side. Mounts the client `PrintButton` (no props). No Date/function/icon
  crosses the boundary (the view-model already passes `assessmentDate` as a
  string and all content as plain JSON from 013).

## 5. Step-by-step changes — the redesigned page

Keep: the `getRecruiterProfileByToken(token)` call + `notFound()` on null/
unpublished; `metadata` (incl. `robots: { index: false }`); the print-color
root. **No `auth`/`requireAdmin`.** Rebuild the body as two sections inside an
A4-friendly centered card.

### 5.0 Shared shell
- Root: `min-h-svh bg-muted/30 text-foreground print:bg-white print:min-h-0
  [print-color-adjust:exact] [-webkit-print-color-adjust:exact]`.
- Document card: `mx-auto max-w-3xl my-6 overflow-hidden rounded-2xl border
  bg-card shadow-sm print:my-0 print:rounded-none print:border-0 print:shadow-none`.
- A small reusable inline `SectionHeading` pattern: `h2 font-display text-lg
  font-semibold` with a `bg-primary` accent bar (or a primary-tinted Lucide icon
  chip). Use icons: `Wrench` Skills, `GraduationCap` Education, `BadgeCheck`
  Certifications, `Languages` Languages, `Trophy` Achievements, `FileText`
  Summary, `Briefcase` Experience, `FolderGit2` Projects, `ClipboardCheck`
  Assessment, `ListChecks` Coding challenges, `Sparkles` Strengths, `TrendingUp`
  Areas for growth, `Award` Recommendation, `Activity` Consistency.

### 5.1 SECTION ONE — Candidate Resume
**Branded hero band** (`bg-gradient-to-br from-primary to-violet-500 px-6 py-7
text-primary-foreground`):
- Top row: the **AB TALKS wordmark** (inline: an "AB" monogram chip in
  `bg-white/20` + `AB TALKS` in `font-display`) and a small tagline
  `AI CONVERSATIONS THAT MATTER` in `text-primary-foreground/80 uppercase
  tracking-wide text-[11px]`. A "Verified by ABTalks" pill on the right.
- Candidate row: a **photo** (left) — `user.image` in an `Avatar` (rounded,
  ring-white/40), initials fallback; and (right) the **name** (`font-display
  text-3xl font-bold`), **target role** (`text-primary-foreground/90`), and a
  context line (college · Class of YYYY for students; role @ org · N yrs for
  professionals) in `text-primary-foreground/80`. Domain + "Ready for interview"
  badges in light-on-gradient style (`bg-white/15 border-white/30`).
- **No contact line.** (The doc's email/phone/LinkedIn/GitHub row is replaced by
  the footer CTA.)

**Body** (`px-6 py-6 space-y-7`), each block conditional on data:
- **Technical Skills** — grouped: for each `skillGroups[]` entry, the `category`
  as a small bold label and its `skills` as chips. (If empty, omit.)
- **Education** — each row: degree bold; institution muted; `year` + `score`
  (GPA) as small inline text/chips.
- **Certifications** — each: `name` bold · `issuer` · `year` muted.
- **Languages spoken** — chips.
- **Achievements** — bulleted list.
- **Professional Summary** — prose paragraph.
- **Professional Experience** — each entry: title bold; `company · location`;
  `period` right-aligned/muted; `bullets` as a `list-disc` list.
- **Key Projects** — each: `title` bold + `tech` as a small monospace/secondary
  chip line; `description` muted. **No links.**

### 5.2 SECTION TWO — ABTalks Candidate Assessment Report
Start on a new printed page: wrap this section with
`print:break-before-page` (and a visible `border-t my-2` divider on screen).

**Report header band** (tinted, e.g. `bg-muted/40 px-6 py-5`):
- Title `ABTalks Candidate Assessment Report` (`font-display text-xl font-bold`).
- Candidate name; a meta line: `Assessment Date · Interviewer · Challenge Round ·
  ABTalks ID`. For `abtalksId`, use the stored value if present, else derive a
  display id: `AB-` + the first 8 chars of the user/review id, uppercased.
  (Render only the meta items that exist.)

**Assessment Score band** (`bg-gradient-to-br from-primary to-violet-500 px-6
py-5 text-primary-foreground`, only when all three scores are present):
- Big `ABTalks Assessment Score: {composite} / 300` (`font-display`), with a
  one-line note: "Composite across Communication, Programming, and Behavior.
  240+ indicates strong readiness." (use the doc's framing).
- A `grid grid-cols-1 sm:grid-cols-3 gap-3` of the three sub-scores, each a
  card: label (Communication / Programming / Behavior), `NN/100`, a thin
  progress bar (`bg-white/30` track, `bg-white` fill at `score%`), and the
  sub-caption from the doc (Verbal clarity & articulation / Algorithms & code
  quality / Culture fit & collaboration).
- If scores are partial/absent, omit this band.

**Detailed Assessment Feedback** — three subsections (each only if its text
exists): Communication, Programming & Technical Skills, Behavior & Culture Fit —
heading + prose.

**Coding Challenge Results** — if `codingChallenges[]`: a table (responsive:
cards `< md`, `<Table>` `md+`) with columns Challenge / Status / Score. Style a
"Passed" status as an emerald badge.

**Key Strengths** — bulleted list (or chips).
**Areas for Growth** — bulleted list.

**ABTalks Recommendation** — a prominent badge mapping the enum to label +
color:
- `STRONGLY_RECOMMEND` → emerald "Strongly Recommend"
- `RECOMMEND` → green "Recommend"
- `NEUTRAL` → amber "Neutral"
- `DO_NOT_RECOMMEND` → red "Do Not Recommend"
Render only if set.

**ABTalks-verified consistency** (keep, small): days completed / total with a
progress bar + current/longest streak, framed as platform-verified proof. (No
gamification synergy number here.)

### 5.3 Footer
`border-t px-6 py-5`, flex: left = "Interested? **Connect with this candidate
through ABTalks.**" with the small wordmark (and, if you want, a mailto to the
ABTalks team — NOT the candidate). Right = `<PrintButton />` (`print:hidden`).

### 5.4 Print
- Keep `[print-color-adjust:exact]`; `print:break-before-page` between the two
  sections so the resume and the report land on separate A4 pages.
- Ensure gradients render in print; if a tester reports them dropping, add
  `print:bg-primary` fallbacks on the gradient bands. Constrain to the
  `max-w-3xl` card width.
- `PrintButton` and any on-screen-only chrome are `print:hidden`.

### 5.5 Empty states
Every section renders only when it has content (same conditional pattern already
used). If essentially nothing is filled, show a minimal "Profile coming soon"
note rather than empty headings.

## 6. Guardrails for Cursor (DO NOT)
- DO NOT add `auth()`/`requireAdmin`/`requireRole` to `/r/[token]`; do NOT add
  `/r` to `middleware.ts`. It stays public.
- DO NOT render email, phone, LinkedIn, GitHub, logistics, compensation, or the
  private note anywhere on this page — they aren't in the public view-model
  (013); don't re-add them or fetch them here. The contact line from the doc is
  intentionally replaced by the "Connect via ABTalks" CTA.
- DO NOT show the gamification **Synergy** points on this page — the score shown
  is the **Assessment Score /300** computed in 013. Keep the two concepts
  separate.
- DO NOT add a photo upload / Blob — the photo is `user.image` with an initials
  fallback only.
- DO NOT pass functions/icons/Dates across a Server→Client boundary; icons are
  server-rendered, `PrintButton` is the only client island (no props).
- DO NOT use `<Button asChild>` / `<Button render={<Link>}>`; use
  `buttonVariants`.
- DO NOT introduce new dependencies (no PDF lib) — PDF is `window.print()` +
  Tailwind `print:` utilities.
- DO NOT change the read functions/actions/schema — that was 013. This plan is
  the page only.

## 7. DB safety
Not applicable — no schema or data change (all done in 013).

## 8. Verification
1. `npm run dev`. As admin, ensure a student has a fully-filled review
   (from 013) and is published.
2. Open `/r/<token>` logged-out:
   - **Resume section**: branded "AB TALKS | AI CONVERSATIONS THAT MATTER" hero
     with photo + name + target role; skills-by-category, education,
     certifications, languages, achievements, summary, experience, projects all
     render; empty ones are hidden. **No contact info anywhere.**
   - **Assessment section** (new printed page): the /300 score band with three
     /100 sub-scores + bars, feedback subsections, coding-challenge table,
     strengths, areas for growth, and the recommendation badge.
   - Footer = "Connect through ABTalks" + Download PDF (no candidate contact).
3. **Download PDF**: the resume and the assessment report land on separate A4
   pages; colors/gradients preserved; button hidden; layout clean.
4. View source / RSC payload: no email/phone/LinkedIn/GitHub/logistics/
   compensation/private-note present.
5. A student with only partial data shows just the populated sections (no broken
   empty headings).
6. **Light + dark** (admin preview) and mobile 390px: layout holds, no overflow.
7. **Build/typecheck:** `npm run lint`, `npm run build`, `tsc --noEmit` clean.

Files that should change (and only this one): `src/app/r/[token]/page.tsx`.

## 9. Commit message
```
feat(recruiter): public page in resume + assessment-report format

Redesigns /r/<token> to match the ABTalks candidate document: a branded resume
section (photo, categorized skills, education, certifications, languages,
achievements, summary, experience, projects) and an ABTalks Candidate Assessment
Report (Assessment Score /300 with Communication/Programming/Behavior /100 +
bars, detailed feedback, coding-challenge results, strengths, areas for growth,
and the recommendation). Contact details are replaced by a "Connect via ABTalks"
CTA; logistics/compensation/private notes are never shown. Two-page print-to-PDF.
No schema/deps; gamification Synergy stays separate.
```
