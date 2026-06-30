# 016 — Recruiter report: dedicated 2-page PDF generator (`@react-pdf/renderer`)

> **Why this exists:** browser `window.print()` cannot reliably force the report into
> exactly 2 pages — the content is ~2.6 print-pages and density/zoom hacks (plan 015 §5.7)
> keep re-breaking per candidate. Decision (user): generate the PDF server-side with
> `@react-pdf/renderer`, where we author Page 1 and Page 2 explicitly. The **web** report
> (`/r/[token]`, plan 015) stays exactly as it is for on-screen viewing; only the
> "Download PDF" action changes to stream the generated document.
>
> Branch: `git checkout -b feature/recruiter-pdf`. No schema/data change.

## 1. Goal
A `GET /r/<token>/pdf` route that streams a deterministic **2-page** PDF of the recruiter
report — Page 1 = resume, Page 2 = assessment — matching the navy + gold template from plan
015, reusing the existing public getter. "Download PDF" links to this route instead of
`window.print()`. Exactly 2 pages for any candidate, no clipping, no near-empty page.

## 2. Current behavior
- `/r/[token]/page.tsx` renders the rich HTML report (plan 015 — navy hero, light sidebar,
  assessment with score cards / logistics / compensation / recommendation). Data comes from
  `getRecruiterProfileByToken(token)` (public subset; **omits `adminNote`**; includes
  contact, logistics, compensation, scores).
- `print-button.tsx` (`"use client"`) calls `window.print()` → the browser prints the HTML.
  This is what produces the unreliable 4-page PDF.
- No PDF library is installed. `/r` is public (no auth; `metadata.robots: { index: false }`).

## 3. Files to touch
- `package.json` `[edit]` — add dependency `@react-pdf/renderer` (^4). Server-only; it lives
  in the route, so it does **not** ship to the client bundle.
- `src/features/recruiter/recruiter-pdf.tsx` `[new]` — the PDF document: a function returning
  a `<Document>` with two `<Page size="A4">` built from react-pdf primitives (`Page`, `View`,
  `Text`, `Image`, `StyleSheet`). **Server-only module** (no `"use client"`, never imported
  by a client component). Takes the `RecruiterProfileView` as a prop.
- `src/features/recruiter/pdf-fonts.ts` `[new]` — registers fonts for react-pdf (see §5.4).
- `public/fonts/*.ttf` `[new]` — TTFs for the brand fonts (or rely on the Helvetica fallback
  in v1 — see §5.4).
- `src/app/r/[token]/pdf/route.ts` `[new]` — `GET` route handler (Node runtime). Fetches the
  profile, renders the document to a stream/buffer, returns `application/pdf`. **Public.**
- `src/app/r/[token]/print-button.tsx` `[edit]` → becomes a **Download PDF link** to
  `/r/[token]/pdf` (it no longer needs `window.print()`; can become a styled `<a>`). Keep the
  filename/exported name or rename to `DownloadPdfLink` and update the import in `page.tsx`.
- `src/app/r/[token]/page.tsx` `[edit, minimal]` — pass the token to the download link;
  otherwise unchanged. The rich HTML view stays.

**Not touched:** `getRecruiterProfileByToken` / schema / actions, `middleware.ts` (`/r`
stays public), `src/components/ui/*`, the gamification synergy. Plan 015's HTML report and
its print CSS stay as the on-screen view (the `@page`/`print:` rules become harmless/unused
for the PDF path — leave them; optional cleanup later).

## 4. Server vs Client
- `recruiter-pdf.tsx` + `pdf-fonts.ts` — **server-only.** `@react-pdf/renderer` must never be
  imported into a client component or the edge runtime (it's a Node renderer with its own
  reconciler; it would blow up the client/edge bundle). No `"use client"`.
- `pdf/route.ts` — **server route, `export const runtime = "nodejs"`** (react-pdf needs Node
  APIs/streams; it is NOT edge-safe). Public — **no `auth`/`requireAdmin`**.
- Download link — a plain server-rendered `<a href="/r/<token>/pdf">` styled with
  `buttonVariants`. **No client island needed** (it's a navigation, not `window.print()`), so
  `print-button.tsx` can drop `"use client"` and become an `<a>`. (If you keep a client
  component, that's fine too — but it needs no JS.)

## 5. Steps

### 5.1 Add the dependency
`npm install @react-pdf/renderer` (pin ^4.x). Confirm it resolves under React 19 / Next 16
(react-pdf renders via its own reconciler server-side — it does not use React DOM, so RSC/
React-19 compatibility is fine for our usage in a route handler).

### 5.2 The PDF document — `recruiter-pdf.tsx`
Export `function RecruiterPdf({ profile }: { profile: RecruiterProfileView })` returning a
`<Document>`. Build a `StyleSheet.create({...})` with the plan-015 palette as constants:
navy `#1e3a5f`, gold `#d99c2c` / darker gold `#b9831f` for small text, sidebar gray
`#f3f4f6`, score colors `#2f6fb0` / `#8e3b8e` / `#1a9e8f`. react-pdf uses a flexbox subset
(`flexDirection`, `padding`, `width: "32%"`, etc.) — re-express the 015 layout, **not**
Tailwind.

**Guaranteeing exactly 2 pages — the core technique:**
- One `<Page size="A4" style={{padding: ...}}>` **per section**: Page 1 = resume, Page 2 =
  assessment. react-pdf auto-paginates if a page overflows, so the job is to make each
  section *fit* its page — which is **deterministic** here (unlike the browser), so once it
  fits for a given content volume it stays fitting.
- Pick compact, fixed font sizes: e.g. base 9–10pt body, 8pt captions, headings 11–13pt,
  candidate name ~20pt. Tight `marginBottom`/`gap`. The assessment is dense — use ~9pt and
  two columns (feedback left, logistics/compensation/recommendation right) as in 015.
- **Cap unbounded free-text so a verbose candidate can't push to page 3:** truncate very long
  fields to a sane char limit with an ellipsis — `summary` (~600), each feedback paragraph
  (~480), each bullet (~160). (These are display-only caps in the PDF; the web view keeps
  full text.) This is what converts "usually 2 pages" into "always 2 pages."
- As a final hard stop, you may set `wrap={false}` on each `<Page>` so overflow is clipped
  rather than spilling to a 3rd page — but prefer the font-size + truncation approach so
  nothing is ever clipped. Only use `wrap={false}` if testing shows an outlier still spills.

**Page 1 — resume layout** (mirror 015): top navy brand bar ("AB TALKS" gold) + navy hero
(`name` white, `targetRole` gold, contact line white) → a row split into a light-gray sidebar
(`width ~32%`: photo, Technical Skills by group, Education, Languages Spoken, Certifications,
Achievements; gold headings) and a white main column (Professional Summary, Professional
Experience with navy titles + gold dates/company, Key Projects). Footer line.

**Page 2 — assessment layout** (mirror 015): navy band (label + name + meta) → pale-gold
synergy callout (`assessmentComposite`/`assessmentMax`) → three colored score cards with a
bar each (`communication`/`programming`/`behavior` + captions) → two columns: left = Detailed
Assessment Feedback (color-matched sub-headings), Coding Challenge Results (a `View`-based
table with a navy header row — react-pdf has no `<table>`, build rows with `flexDirection:
row`), Key Strengths, Areas for Growth; right = Candidate Logistics, Compensation Details,
navy Recommendation box. Footer line. **Do NOT render `adminNote`.**

### 5.3 Images
- Photo: `<Image src={profile.image}>` when present. react-pdf fetches remote URLs (e.g.
  Google avatars) server-side — wrap in try/handling so a failed/blocked fetch falls back to
  an initials block (a navy `View` with `Text` initials), and skip if `profile.image` is null.

### 5.4 Fonts — `pdf-fonts.ts`
- To match the web look, register **Plus Jakarta Sans** (headings) and **Inter** (body) with
  `Font.register({ family, src })`. Most reliable in serverless: place TTFs in `public/fonts/`
  and register from the filesystem (`fs.readFileSync(path.join(process.cwd(),
  "public/fonts/Inter-Regular.ttf"))` → Buffer) at module load. Register the weights used
  (Regular/Medium/SemiBold/Bold).
- Call the registration once (module side-effect, imported by `recruiter-pdf.tsx`).
- **Acceptable v1 fallback:** if font plumbing is fiddly, skip registration and use
  react-pdf's built-in **Helvetica** — the PDF is a separate artifact and Helvetica looks
  clean. Brand fonts can be a follow-up. (Pick one; don't block the feature on fonts.)

### 5.5 The route — `pdf/route.ts`
```
export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // token-specific, no caching of PII
export async function GET(_req, { params }) {
  const { token } = await params;
  const profile = await getRecruiterProfileByToken(token);
  if (!profile) return new Response("Not found", { status: 404 });
  const { renderToStream } = await import("@react-pdf/renderer"); // server-only, keep out of edge
  const stream = await renderToStream(<RecruiterPdf profile={profile} />);
  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safeName(profile.fullName)}-abtalks.pdf"`,
    },
  });
}
```
- **Public** — no auth. Same exposure model as the HTML report (tokenized).
- `force-dynamic` + no `s-maxage` so the PDF (contains contact/PII) isn't cached at the edge.
- Sanitize the filename from `fullName` (strip non-filename chars).
- Node stream → `Response`: if the `renderToStream` Node stream isn't directly accepted, use
  `renderToBuffer(...)` and return the `Buffer` instead (simpler, fine for this size).

### 5.6 Download link
- `print-button.tsx`: replace the `window.print()` button with an `<a href={`/r/${token}/pdf`}>`
  (add a `token` prop) styled `cn(buttonVariants({ variant: "default" }), "print:hidden")`,
  keep the `Download` icon and "Download PDF" label. Add `target="_blank" rel="noopener"` so
  it opens the PDF in a new tab. (No `"use client"` needed once it's an anchor.)
- `page.tsx`: pass `token` to the link. No other changes to the HTML report.

## 6. Guardrails for Cursor (DO NOT)
- **DO NOT** import `@react-pdf/renderer` (or `recruiter-pdf.tsx`/`pdf-fonts.ts`) into any
  client component or edge-runtime file. It is **server-only**; the route must declare
  `runtime = "nodejs"`. Keep it out of `middleware.ts` and `auth.config.ts`.
- **DO NOT** add `auth()`/`requireAdmin`/`requireRole` to the `/r/[token]/pdf` route or add
  `/r` to `middleware.ts` — it's public, same as the report page.
- **DO NOT** render `adminNote` / private notes in the PDF (same privacy rule as the page).
- **DO NOT** change `getRecruiterProfileByToken`, the schema, or the actions — reuse them.
- **DO NOT** change the HTML report's design/data (`page.tsx` body) — only swap the download
  control. The web view stays the plan-015 report.
- **DO NOT** cache the PDF response (PII) — `force-dynamic`, no `s-maxage`.
- **DO NOT** let the PDF spill to a 3rd page — guarantee 2 via compact fixed font sizes + the
  free-text caps in §5.2; only use `wrap={false}` as a last resort.
- **DO NOT** use `<Button asChild>`/`<Button render={<Link>}>`; the download is a styled `<a>`
  with `buttonVariants`.

## 7. DB safety
Not applicable — no schema or data change. New dependency only (`@react-pdf/renderer`); commit
the lockfile.

## 8. Verification
1. `npm install`, `npm run dev`. Open `/r/<token>` → "Download PDF" opens `/r/<token>/pdf`.
2. The PDF is **exactly 2 pages**: Page 1 resume, Page 2 assessment. Confirm with the same
   `d263e2b56a594f628e5a01b7ca8a2b71` token that was 4 pages before.
3. Test **three** profiles: the full example, a **sparse** one (few sections), and a
   **verbose** one (long feedback/many rows) — all must be 2 pages, nothing clipped, free-text
   truncated gracefully where capped.
4. Visual: navy hero + gold accents + light sidebar (p1); navy band, colored score cards with
   bars, logistics/compensation/recommendation (p2). Photo renders (or initials fallback).
   **No private note** anywhere.
5. `npx tsc --noEmit` and `npm run lint` clean. Confirm `@react-pdf/renderer` is **not** in
   the client bundle (it's only imported by the Node route / server module) — `next build`
   succeeds and the route is a Node function.
6. The on-screen HTML report at `/r/<token>` is unchanged (still rich/scrollable).

## 9. Commit message
```
feat(recruiter): generate a deterministic 2-page PDF with @react-pdf/renderer

Adds GET /r/<token>/pdf (Node runtime, public) that streams a server-generated 2-page PDF —
page 1 resume, page 2 assessment — matching the navy + gold template, reusing the existing
public getter. Replaces the unreliable window.print() download (which produced 4 pages) with
explicit page layout: compact fixed font sizes + free-text caps guarantee exactly 2 pages for
any candidate. The on-screen HTML report is unchanged; private notes are never rendered.
```
