# 013 — Recruiter profile: assessment-report data model + admin capture

> Plan A of two (companion: `014-recruiter-public-page-assessment-format.md`,
> the public page redesign). **013 must ship first** — 014 renders fields this
> plan creates. One schema migration. Branch:
> `git checkout -b feature/recruiter-assessment-data`.
>
> Reference: the user's `Untitled.docx` — a two-part artifact (a professional
> **resume page** + an **ABTalks Candidate Assessment Report**). This plan adds
> the data + admin form to capture all of it. Plan 014 presents the public
> subset.
>
> Decisions locked with the user:
> - **Public = resume + assessment only.** Compensation, Candidate Logistics,
>   and Interviewer Private Notes are stored but **admin-only**, never public.
> - **Contact stays hidden** on the public page (no email/phone/LinkedIn/GitHub;
>   "Connect via ABTalks"). Admin still sees real contacts elsewhere.
> - The interview composite is the **"ABTalks Assessment Score" /300**
>   (Communication/Programming/Behavior, each /100) — a *separate* concept from
>   the existing gamification **Synergy** points (untouched).
> - **One template, sections render only when populated.** All fields
>   admin-entered (no resume parsing). Students show education/projects;
>   professionals additionally show experience/CTC (CTC is admin-only anyway).

## 1. Goal
Expand `RecruiterReview` and the admin review form so an admin can capture the
full resume + assessment-report content from the template, including the
three-dimension /100 assessment scores, detailed feedback, coding-challenge
results, recommendation, and admin-only logistics/compensation/notes.

## 2. Context / current behavior (shipped, plans 010–011)
- `prisma/schema.prisma` `RecruiterReview` (1:1 with User) currently has:
  `confidenceRating/codingRating/communicationRating` (Int 1–5), `headline`,
  `summary`, `strengths String[]`, `recommendedRoles String[]`, `adminNote`,
  `projects Json` (`{title,description}`), `education Json`
  (`{degree,institution,year,score}`), `achievements String[]`,
  `certifications String[]`, `isPublished`, `shareToken`, `reviewedByAdminId`,
  `reviewedAt`, timestamps.
- `src/lib/validations/recruiter.ts` — Zod for `project`/`education` + parse
  helpers.
- `src/features/recruiter/get-recruiter-review.ts` — admin read (normalized).
- `src/features/recruiter/get-recruiter-profile.ts` — public read by token
  (anonymized view-model; excludes contact + adminNote).
- `src/app/actions/recruiter-review-actions.ts` — `upsertRecruiterReviewAction`
  (typed input) + publish/unpublish/regenerate; each writes an `AdminAction`.
- `src/components/admin/recruiter-review-panel.tsx` — client form (ratings 1–5,
  headline, summary, strengths, recommendedRoles, adminNote, projects,
  education, achievements, certifications) + publish controls.
- Test data only; pre-launch — destructive column changes are acceptable.

## 3. Files to touch

**Schema**
- `prisma/schema.prisma` `[edit]` — add `RecommendationLevel` enum; heavily
  expand `RecruiterReview` (add many fields, change `certifications`/`projects`
  shapes, drop the obsolete 1–5 ratings + `recommendedRoles`).

**Edited**
- `src/lib/validations/recruiter.ts` `[edit]` — add Zod schemas + parse helpers
  for the new Json shapes (skill groups, certifications, languages, experience,
  coding challenges, logistics, compensation) and the updated project shape;
  score range (0–100); recommendation enum.
- `src/app/actions/recruiter-review-actions.ts` `[edit]` — expand the upsert
  input/validation/persistence to all new fields.
- `src/features/recruiter/get-recruiter-review.ts` `[edit]` — return all fields
  (including admin-only) for the form.
- `src/features/recruiter/get-recruiter-profile.ts` `[edit]` — return the
  **public** subset only (resume + assessment); compute the composite /300.
  Still excludes contact, logistics, compensation, adminNote.
- `src/components/admin/recruiter-review-panel.tsx` `[edit]` — expand the form
  into grouped sections (Resume / Assessment / Internal-only).

**Not touched**
- `/r/[token]/page.tsx` and `print-button.tsx` — redesigned in **014**, not
  here. (013 may leave the existing page temporarily reading the renamed view-
  model fields — see §5.6 note so the build stays green between plans.)
- `middleware.ts` (`/r` stays public), synergy feature (untouched).

## 4. Server vs Client
- `validations/recruiter.ts`, `get-recruiter-review.ts`,
  `get-recruiter-profile.ts`, `recruiter-review-actions.ts` — **Server-only** /
  Server Actions. All Json is Zod-validated on write and Zod-parsed on read
  (no `any`, no `as` casts).
- `recruiter-review-panel.tsx` — **Client**. Receives the full review as plain
  serializable props (numbers/null, strings, string[], typed arrays from Json,
  booleans). `assessmentDate` is passed as an ISO/`yyyy-mm-dd` string (no Date
  across the boundary).

## 5. Step-by-step changes

### 5.1 Schema (`prisma/schema.prisma`)
Add the enum:
```prisma
enum RecommendationLevel {
  STRONGLY_RECOMMEND
  RECOMMEND
  NEUTRAL
  DO_NOT_RECOMMEND
}
```
Update `RecruiterReview` to this target shape:
```prisma
model RecruiterReview {
  id                    String               @id @default(cuid())
  userId                String               @unique

  // Resume
  targetRole            String?
  skillGroups           Json?                // Array<{ category: string; skills: string[] }>
  education             Json?                // Array<{ degree, institution, year, score }>
  certifications        Json?                // Array<{ name, issuer, year }>   (was String[])
  languagesSpoken       String[]             @default([])  // "English — Native"
  achievements          String[]             @default([])
  headline              String?
  summary               String?              // Professional Summary
  experience            Json?                // Array<{ title, company, location, period, bullets: string[] }>
  projects              Json?                // Array<{ title, tech, description }>

  // Assessment (each score /100; composite /300 computed, not stored)
  communicationScore    Int?
  programmingScore      Int?
  behaviorScore         Int?
  communicationFeedback String?
  programmingFeedback   String?
  behaviorFeedback      String?
  codingChallenges      Json?                // Array<{ name, status, score }>
  strengths             String[]             @default([])  // Key Strengths
  areasForGrowth        String[]             @default([])
  recommendation        RecommendationLevel?
  assessmentDate        DateTime?
  interviewerName       String?
  challengeRound        String?
  abtalksId             String?              // optional override; else derived from user id

  // Admin-only (NEVER public)
  logistics             Json?                // { openToRelocation, preferredLocations, currentLocation, availableFrom, noticePeriod, workAuthorization, preferredWorkMode }
  compensation          Json?                // { currentCtc, expectedCtc, negotiatedOffer, equity, benefitsRequired, currencyPreference }
  adminNote             String?              // Interviewer Private Notes

  // Publish
  isPublished           Boolean              @default(false)
  shareToken            String?              @unique
  reviewedByAdminId     String?
  reviewedAt            DateTime?
  createdAt             DateTime             @default(now())
  updatedAt             DateTime             @updatedAt
  user                  User                 @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([shareToken])
}
```
- **Removed:** `confidenceRating`, `codingRating`, `communicationRating`,
  `recommendedRoles` (superseded by the /100 scores + `targetRole`).
- **Changed:** `certifications` String[] → Json; `projects` Json gains `tech`.
- Photo: **no new column** — the public page uses the OAuth `user.image` with an
  initials fallback (no upload; Blob still avoided).

### 5.2 `validations/recruiter.ts` (edit)
Add Zod schemas + `parseX` helpers (each `safeParse` → typed array, fallback
`[]`/`null`):
```ts
export const skillGroupSchema = z.object({
  category: z.string().trim().min(1).max(60),
  skills: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});
export const certificationSchema = z.object({
  name: z.string().trim().min(1).max(160),
  issuer: z.string().trim().max(120).default(""),
  year: z.string().trim().max(12).default(""),
});
export const experienceSchema = z.object({
  title: z.string().trim().min(1).max(120),
  company: z.string().trim().max(120).default(""),
  location: z.string().trim().max(120).default(""),
  period: z.string().trim().max(60).default(""),     // "MMM YYYY – Present"
  bullets: z.array(z.string().trim().min(1).max(400)).max(8).default([]),
});
export const codingChallengeSchema = z.object({
  name: z.string().trim().min(1).max(160),
  status: z.string().trim().max(40).default(""),     // "Passed"
  score: z.string().trim().max(40).default(""),      // "48 / 50"
});
// updated project shape (adds tech)
export const projectSchema = z.object({
  title: z.string().trim().min(1).max(120),
  tech: z.string().trim().max(200).default(""),      // "React, Node.js, AWS"
  description: z.string().trim().max(600).default(""),
});
export const logisticsSchema = z.object({
  openToRelocation: z.string().trim().max(40).default(""),
  preferredLocations: z.string().trim().max(200).default(""),
  currentLocation: z.string().trim().max(120).default(""),
  availableFrom: z.string().trim().max(60).default(""),
  noticePeriod: z.string().trim().max(60).default(""),
  workAuthorization: z.string().trim().max(80).default(""),
  preferredWorkMode: z.string().trim().max(40).default(""),
});
export const compensationSchema = z.object({
  currentCtc: z.string().trim().max(60).default(""),
  expectedCtc: z.string().trim().max(60).default(""),
  negotiatedOffer: z.string().trim().max(60).default(""),
  equity: z.string().trim().max(60).default(""),
  benefitsRequired: z.string().trim().max(160).default(""),
  currencyPreference: z.string().trim().max(20).default(""),
});
export const scoreSchema = z.coerce.number().int().min(0).max(100);
export const recommendationSchema = z.enum([
  "STRONGLY_RECOMMEND","RECOMMEND","NEUTRAL","DO_NOT_RECOMMEND",
]);
// array wrappers (with .max caps) + parseSkillGroups/parseCertifications/
// parseExperience/parseCodingChallenges/parseLogistics/parseCompensation, plus
// the updated parseProjects. Keep the existing parseEducation.
```
Export inferred types (`SkillGroup`, `Certification`, `Experience`,
`CodingChallenge`, `Project`, `Logistics`, `Compensation`).

### 5.3 `recruiter-review-actions.ts` (edit)
- Extend `upsertRecruiterReviewAction`'s Zod input with every new field
  (scores via `scoreSchema.nullable().optional()`; arrays via the wrappers;
  Json objects via their schemas; `recommendation` via `recommendationSchema`;
  `assessmentDate` accepted as a `yyyy-mm-dd` string → convert to Date or null;
  `interviewerName`/`challengeRound`/`abtalksId`/`targetRole`/feedback strings).
- Persist: scalars directly; arrays as `string[]`; the rest as Json (pass the
  validated JS objects/arrays). Keep setting `reviewedByAdminId`/`reviewedAt`
  and writing the `AdminAction` audit row. Keep publish/unpublish/regenerate
  unchanged.

### 5.4 `get-recruiter-review.ts` (edit, admin read)
- `select` all fields (including `logistics`, `compensation`, `adminNote`).
- Return a normalized object: scalars as-is; arrays defaulting to `[]`; Json
  via the `parseX` helpers into typed arrays/objects; `assessmentDate` as a
  `yyyy-mm-dd` string (or `""`). This feeds the admin form.

### 5.5 `get-recruiter-profile.ts` (edit, PUBLIC read)
- Extend the `RecruiterReview` `select` with the **public** fields only:
  `targetRole`, `skillGroups`, `education`, `certifications`, `languagesSpoken`,
  `achievements`, `headline`, `summary`, `experience`, `projects`,
  `communicationScore`, `programmingScore`, `behaviorScore`,
  `communicationFeedback`, `programmingFeedback`, `behaviorFeedback`,
  `codingChallenges`, `strengths`, `areasForGrowth`, `recommendation`,
  `assessmentDate`, `interviewerName`, `challengeRound`, `abtalksId`,
  `isPublished`.
  **Do NOT select** `logistics`, `compensation`, `adminNote` (defense-in-depth:
  they must not even be queried into the public view-model).
- Extend `RecruiterProfileView` with the typed public fields; add a computed
  `assessmentComposite: number | null` = sum of the three scores when all three
  are non-null, else null (and `assessmentMax = 300`).
- Keep the existing identity/proof fields (fullName, domain, college/grad or
  org/role/yearsExp, days/streak, isReadyForInterview, user.image for the
  photo). **Drop the gamification `synergyPoints`** from the public view-model
  (it would clash with "Assessment Score"); the 60-day consistency strip
  (days/streak) stays as ABTalks-verified proof.
- Still excludes email/phone/linkedinUrl/githubUsername entirely.

### 5.6 `recruiter-review-panel.tsx` (edit, admin form)
Reorganize the form into three clearly separated groups (use collapsible
sections or sub-tabs; keep it one client component):
- **Resume:** `targetRole`; **Skill groups** (repeatable: category + a tag list
  of skills); **Education** (repeatable rows; existing); **Certifications**
  (repeatable: name + issuer + year — upgraded from the old tag list);
  **Languages spoken** (tag list); **Achievements** (tag list); **Professional
  summary** (textarea); **Experience** (repeatable: title, company, location,
  period, bullets tag-list); **Projects** (repeatable: title, tech, description).
- **Assessment:** three score inputs (0–100) for Communication / Programming /
  Behavior with a live composite "/300" readout; three feedback textareas;
  **Coding challenges** (repeatable: name, status, score); **Key strengths**
  (tag list, existing); **Areas for growth** (tag list); **Recommendation**
  (select over the 4 enum values); metadata: `assessmentDate` (date input),
  `interviewerName`, `challengeRound`, `abtalksId` (with helper "leave blank to
  auto-generate").
- **Internal — not shown to recruiters:** **Logistics** (the 7 fields),
  **Compensation** (the 6 fields), **Interviewer private notes** (`adminNote`
  textarea). Label this group clearly as confidential/admin-only.
- Initialize all state from the expanded `get-recruiter-review` props; submit
  the full object to `upsertRecruiterReviewAction`. Keep the existing publish/
  link controls. `useTransition`; no `<Button asChild>`.

> **Keep-build-green note:** the live `/r/[token]/page.tsx` (plan 011) reads
> the OLD fields (`ratings.confidence`, etc.). Since 013 removes those, update
> `/r/[token]/page.tsx` minimally in this plan ONLY enough to compile against
> the new view-model (e.g. temporarily render the new `assessmentComposite` +
> scores in place of the old stars). Plan 014 then fully redesigns it. Do not
> leave the build broken between plans.

## 6. Guardrails for Cursor (DO NOT)
- DO NOT select or expose `logistics`, `compensation`, or `adminNote` in
  `get-recruiter-profile.ts` or anywhere in the public path. These are
  admin-only. Same for email/phone/LinkedIn/GitHub (never public).
- DO NOT rename or touch the gamification **Synergy** feature (chip, scoring,
  awards). The /300 "Assessment Score" is a separate concept computed here from
  the three /100 fields.
- DO NOT store any Json without Zod validation on write and Zod parsing on read.
  No `as` casts of Prisma `Json`; go through the `parseX` helpers. No `any`.
- DO NOT add a photo upload / Vercel Blob / PDF parser / LLM. Photo = OAuth
  `user.image` + initials fallback; all other data is admin-typed.
- DO NOT pass Dates/functions/icons across the Server→Client boundary —
  `assessmentDate` crosses as a string.
- DO NOT use `include` — `select` only; multi-write actions stay in
  `prisma.$transaction` with an `AdminAction` audit row.
- DO NOT use `<Button asChild>`; `lib/logger.ts` for errors; no `console.*`.
- DO NOT leave the build broken — see the keep-build-green note in §5.6.

## 7. DB safety (schema change)
1. **Checkpoint:** `git add -A && git commit -m "checkpoint before recruiter assessment schema"`. Note the hash.
2. **Neon branch snapshot** before migrating.
3. **Migrate:** `npx prisma migrate dev --name expand_recruiter_review_assessment_format`.
   - Drops `confidenceRating`/`codingRating`/`communicationRating`/
     `recommendedRoles`; changes `certifications` (String[]→Json) and adds the
     new columns/enum. **Destructive on those columns** — acceptable: test data
     only, pre-launch. If any test rows have data you want to keep, re-seed
     after (`npm run db:cleanup:test && npm run db:seed`).
4. **Regenerate client:** `npx prisma generate`.
5. `npm run build` to confirm migration + types.

## 8. Verification
1. `npm run dev`. As `admin@abtalks.dev`, open a student → "Recruiter Profile".
   The form now has Resume / Assessment / Internal groups with all fields.
2. Fill a realistic profile (skill groups, education, certs, languages,
   achievements, summary, an experience entry, two projects; the three /100
   scores with the live /300 readout; feedback; coding challenges; strengths;
   areas for growth; recommendation; metadata; plus internal logistics/
   compensation/private note). Save → reload → everything persists.
3. Publish, then load `/r/<token>` (logged-out): it renders the new view-model
   (interim layout from §5.6 is fine here; full redesign is plan 014). Confirm
   **no** logistics/compensation/private-note/contact appears in the page source
   / RSC payload.
4. **Build/typecheck:** `npm run lint`, `npm run build`, `tsc --noEmit` clean.

Files that should change (and only these): the schema + the 5 edited files in §3.

## 9. Commit message
```
feat(recruiter): assessment-report data model + expanded admin capture

Expands RecruiterReview to the full resume + assessment-report format: target
role, categorized skill groups, education, certifications, languages,
achievements, professional summary, experience, projects (with tech); a /100
assessment per Communication/Programming/Behavior (composite /300), detailed
feedback, coding-challenge results, key strengths, areas for growth, and a
recommendation; plus admin-only logistics, compensation, and private notes.
Drops the old 1–5 ratings. All Json validated/parsed via Zod. The public view-
model exposes resume + assessment only (no contact, logistics, compensation, or
notes). Gamification Synergy is untouched and separate from the Assessment Score.

Migration: expand_recruiter_review_assessment_format.
```
