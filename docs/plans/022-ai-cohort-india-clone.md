# 022 — `/ai-cohort-india` — India clone of the AI Cohort registration + apply flow

## 1. Goal
Ship a near-identical copy of the existing `/ai-cohort-register` (+ `/ai-cohort-register/apply`)
experience at **`/ai-cohort-india`** (+ `/ai-cohort-india/apply`). UI, UX, layout, marketing
content, and design are **identical** ("dummy clone"). The ONLY changes are two form fields:
- **Step 1:** replace the `visaCategory` dropdown with a required checkbox **"I am originated in India."**
- **Step 4:** remove the `basedInUsa` checkbox.

Applications are stored in a **new `cohort_applications_india` table in the same workshop Supabase
project** (reusing the existing `workshopSupabase` client / env keys — no new env vars, no new
Supabase project).

## 2. Current behavior (verified)
`/ai-cohort-register` = `CohortRegisterOnboardingFlow` wrapping 4 pure marketing sections (`Hero`,
`ProgramAtAGlance`, `WhatYouWillBuild`, `WhoThisIsFor`, each with a `compact` prop). Its footer's
"Get Started" sets `sessionStorage["ai-cohort-register-onboarding-complete"] = "1"` and pushes
`/ai-cohort-register/apply` (hardcoded in `onboarding-flow.tsx:68-70`).
`/ai-cohort-register/apply` = `ApplyGate` (redirects to `/ai-cohort-register` unless that
sessionStorage key is set — `apply-gate.tsx:17-22`) wrapping `ApplicationForm` (the 5-step RHF
wizard). Submissions go through `submitCohortApplicationAction` → `workshopSupabase` →
`cohort_applications` table. Schema/enums in `src/lib/validations/cohort-application.ts`.
`AppFooter` returns `null` on `/ai-cohort-register(/**)` (`app-footer.tsx:13-18`). Middleware
`protectedPaths` is an **allowlist**; cohort routes are NOT in it → public by default (no change
needed). Bottom nav only renders for authed sessions and does not special-case cohort routes — we
match that (no change).

## 3. Files to touch

**New — routes**
- `[new] src/app/ai-cohort-india/page.tsx` — Server Component. Mirror of the register page; renders
  `<CohortRegisterOnboardingFlow basePath="/ai-cohort-india" storageKey={COHORT_INDIA_ONBOARDING_KEY}>`
  around the SAME 4 marketing sections (`<Hero compact />`, `<ProgramAtAGlance compact />`,
  `<WhatYouWillBuild compact />`, `<WhoThisIsFor compact />`). Own `metadata`.
- `[new] src/app/ai-cohort-india/apply/page.tsx` — Server Component. Mirror of the apply page;
  `<ApplyGate basePath="/ai-cohort-india" storageKey={COHORT_INDIA_ONBOARDING_KEY}>` wrapping
  `<ApplicationFormIndia />`. Own `metadata`.

**New — India form, schema, action (the parts that genuinely differ)**
- `[new] src/lib/validations/cohort-application-india.ts` — copy of `cohort-application.ts` with the
  two field changes (see Step 2).
- `[new] src/components/talent-hunt/application-form-india.tsx` — copy of `application-form.tsx`
  with the two field changes + review/label tweaks (see Step 3).
- `[new] src/app/actions/cohort-application-india-actions.ts` — copy of
  `cohort-application-actions.ts` targeting `cohort_applications_india` with the changed columns
  (see Step 4).

**Edits — parameterize the two shared wrappers (small, safe, keeps USA behavior identical)**
- `[edit] src/components/talent-hunt/constants.ts` — add
  `export const COHORT_INDIA_ONBOARDING_KEY = "ai-cohort-india-onboarding-complete";`
- `[edit] src/components/talent-hunt/onboarding-flow.tsx` — accept optional
  `basePath = "/ai-cohort-register"` and `storageKey = COHORT_REGISTER_ONBOARDING_KEY` props; use
  them in `handleGetStarted` (`storageKey` + `router.push(\`${basePath}/apply\`)`). Defaults ⇒ USA
  page unchanged.
- `[edit] src/components/talent-hunt/apply-gate.tsx` — accept optional
  `basePath = "/ai-cohort-register"` and `storageKey = COHORT_REGISTER_ONBOARDING_KEY` props; use
  them in the gate check + `router.replace(basePath)`. Defaults ⇒ USA page unchanged.
- `[edit] src/components/shared/app-footer.tsx` — add an `isCohortIndia` check
  (`pathname === "/ai-cohort-india" || pathname.startsWith("/ai-cohort-india/")`) and include it in
  the existing `return null` guard.
- `[edit] docs/project-context.md` — document the new public route pair and the
  `cohort_applications_india` Supabase table.

**Reused unchanged:** `hero.tsx`, `program-at-a-glance.tsx`, `what-you-will-build.tsx`,
`who-this-is-for.tsx`, `constants.ts` (register key), `Checkbox`/`Select`/`Input`/etc. primitives.

> No Prisma model, no migration, no new API route, no `middleware.ts` change, no auth change.

## 4. Server vs Client
| File | Type | Notes |
|---|---|---|
| `ai-cohort-india/page.tsx`, `apply/page.tsx` | **Server** | Compose + `metadata`; pass only **plain string** props (`basePath`, `storageKey`) into the client wrappers — safe across the boundary. |
| `onboarding-flow.tsx`, `apply-gate.tsx` | **Client** (`"use client"`, already) | Now take plain-string props. No functions/icons passed in. |
| `application-form-india.tsx` | **Client** (`"use client"`) | RHF wizard; imports the India action + schema. Takes no props. |
| `cohort-application-india-actions.ts` | **Server** (`"use server"`) | Uses `workshopSupabase`; never imported into edge/middleware. |

No Server→Client function/icon/class-instance props anywhere (only strings). ✅

## 5. Steps

### Step 1 — constants + wrapper parameterization
- `constants.ts`: add `COHORT_INDIA_ONBOARDING_KEY = "ai-cohort-india-onboarding-complete"` (keep the
  existing register key).
- `onboarding-flow.tsx`: change the signature to
  `function CohortRegisterOnboardingFlow({ children, basePath = "/ai-cohort-register", storageKey = COHORT_REGISTER_ONBOARDING_KEY }: Props)`
  (extend `Props` with `basePath?: string; storageKey?: string;`). In `handleGetStarted`, use
  `sessionStorage.setItem(storageKey, "1")` and `router.push(\`${basePath}/apply\`)`.
- `apply-gate.tsx`: change signature to
  `function ApplyGate({ children, basePath = "/ai-cohort-register", storageKey = COHORT_REGISTER_ONBOARDING_KEY }: Props)`;
  use `sessionStorage.getItem(storageKey)` and `router.replace(basePath)`.
- Verify `/ai-cohort-register` still works with defaults (no call-site change there).

### Step 2 — India schema (`src/lib/validations/cohort-application-india.ts`)
Copy `cohort-application.ts` verbatim, then:
- **Remove** the `VISA_CATEGORIES` const and the `visaCategory` field.
- **Add** to Step 1: `originatedInIndia: z.literal(true, { error: "Please confirm to continue." })`.
- **Remove** the `basedInUsa` field from Step 4.
- Keep all other enums/fields **identical**. Export `cohortApplicationIndiaSchema` and
  `type CohortApplicationIndiaInput = z.infer<...>`.

### Step 3 — India form (`src/components/talent-hunt/application-form-india.tsx`)
Copy `application-form.tsx`, then:
- Import from `cohort-application-india` (schema/enums, `CohortApplicationIndiaInput`) and
  `submitCohortApplicationIndiaAction`. Drop the `VISA_CATEGORIES` import.
- `STEP_FIELDS[1]`: replace `"visaCategory"` with `"originatedInIndia"`.
- `STEP_FIELDS[4]`: remove `"basedInUsa"`.
- `COMMITMENTS`: remove the `basedInUsa` entry (Step 4 now has 4 checkboxes). Update its TS `name`
  union type to drop `"basedInUsa"`.
- `EMPTY_DEFAULTS`: drop `visaCategory`, drop `basedInUsa`, add `originatedInIndia: false`.
- **Step 1 render:** replace the entire `visaCategory` `<Select>` block with a single checkbox row
  (same markup pattern as a Step-4 commitment): `<Controller name="originatedInIndia">` →
  `<Checkbox id="originatedInIndia" checked={field.value === true} onCheckedChange={(c)=>field.onChange(c===true)} />`
  with `<Label htmlFor="originatedInIndia">I am originated in India.</Label>` and the inline
  `errors.originatedInIndia` message below.
- **Step 4 render:** no code change beyond `COMMITMENTS` losing one row (it maps the array).
- **Step 5 review:** in "Personal Information", replace the `Visa status` `ReviewRow` with
  `<ReviewRow label="Originated in India" value={values.originatedInIndia ? "Yes" : "No"} />`.
  In "Commitment & Readiness", change `"All 5 confirmed ✓"` → `"All 4 confirmed ✓"`.
- Everything else (copy, subtitle text, styling, success screen, animations) stays **identical**.
  NOTE: per the "keep everything the same" instruction, the header subtitle
  `"Pre-assessment - Cohort 1 - USA"` and all marketing copy remain unchanged (still say USA) — see §6.

### Step 4 — India action (`src/app/actions/cohort-application-india-actions.ts`)
Copy `cohort-application-actions.ts`, then:
- Import `cohortApplicationIndiaSchema` / `CohortApplicationIndiaInput`; export
  `submitCohortApplicationIndiaAction`.
- Dedupe + insert against `.from("cohort_applications_india")`.
- Insert columns: same as USA **except** replace `visa_category: d.visaCategory` with
  `originated_in_india: d.originatedInIndia` and **remove** `based_in_usa`.
- Keep logging via `lib/logger.ts` and the result envelope identical.

### Step 5 — pages
- `ai-cohort-india/page.tsx`: mirror `ai-cohort-register/page.tsx` exactly, but wrap with
  `basePath`/`storageKey` props (Step 1) and set India `metadata` (title
  `"AI Cohort Training Program (India) | ABTalks"`). Same 4 `compact` marketing sections.
- `ai-cohort-india/apply/page.tsx`: mirror the apply page, `ApplyGate` with the India
  `basePath`/`storageKey`, render `<ApplicationFormIndia />`.

### Step 6 — footer + docs
- `app-footer.tsx`: add `isCohortIndia` and include in the `if (… ) return null;` guard.
- `docs/project-context.md`: add `/ai-cohort-india` + `/ai-cohort-india/apply` to public routes and
  note the `cohort_applications_india` Supabase table (source of truth for India applications).

## 6. Guardrails for Cursor (DO NOT)
- **Public surface** — no `auth()`/`requireRole`/`requireAdmin`; do NOT add these routes to
  `protectedPaths`. Must work logged-out.
- **Storage** — India applications go ONLY to `cohort_applications_india` in the workshop Supabase
  project via the existing `workshopSupabase` client. Do NOT touch Neon/Prisma or add a migration.
- **Do NOT change the USA flow's behavior** — the wrapper prop defaults must keep
  `/ai-cohort-register` byte-for-byte in behavior. Do not edit the USA page call-sites.
- **Only the two field changes** — visa dropdown → "I am originated in India" checkbox; remove
  `basedInUsa`. Do NOT alter any other field, copy, subtitle, or marketing text (dummy clone). The
  "USA" wording stays unless the user later asks to localize.
- **Mutations via Server Action, not an API route.**
- **Buttons/links** — `buttonVariants` on `<a>`/`<Link>`; never `<Button asChild>`.
- **Logging** via `lib/logger.ts`; strict TS, no `any`; Zod at the action boundary + `zodResolver`.
- **Reuse the marketing sections unchanged** — do NOT duplicate `hero/program-at-a-glance/
  what-you-will-build/who-this-is-for`.
- Confirm files were written and `npm run build` + `npx tsc --noEmit` pass before reporting done.

## 7. DB safety (Supabase — manual, run by the user; NOT Prisma)
New table in the **workshop Supabase project** (same one holding `cohort_applications`). **Match the
RLS posture of `cohort_applications`** — it shows as *UNRESTRICTED* (RLS disabled) in the dashboard,
so anon insert/select works; do the same here or the anon-key insert/dedupe will silently fail.

```sql
create table if not exists cohort_applications_india (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  linkedin_url text not null,
  originated_in_india boolean not null default false,
  education_level text not null,
  total_experience text not null,
  ai_ml_experience text not null,
  current_title_company text not null,
  industry text not null,
  primary_languages_tools text not null,
  why_interested text not null,
  what_to_achieve text not null,
  target_role text not null,
  commit_hours boolean not null default false,
  attend_sessions boolean not null default false,
  understand_pre_call boolean not null default false,
  ready_for_challenge boolean not null default false,
  preferred_start_window text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create unique index if not exists cohort_applications_india_email_key
  on cohort_applications_india (lower(email));

-- match cohort_applications (UNRESTRICTED / RLS disabled):
alter table cohort_applications_india disable row level security;
```
(If `cohort_applications` instead uses explicit anon policies, mirror those rather than disabling RLS.)

## 8. Verification
- `npm run build` + `npx tsc --noEmit` pass.
- `/ai-cohort-register` (+ `/apply`) still behaves exactly as before (regression check on the shared
  wrappers).
- `/ai-cohort-india` renders the identical onboarding UI; "Get Started" routes to
  `/ai-cohort-india/apply` and sets the India sessionStorage key.
- Visiting `/ai-cohort-india/apply` directly (without onboarding) redirects to `/ai-cohort-india`.
- Step 1 shows the "I am originated in India" checkbox (no visa dropdown); "Next" blocks until it's
  checked. Step 4 shows 4 commitment checkboxes (no "based in the United States"). Step 5 review
  shows "Originated in India: Yes" and "All 4 confirmed ✓".
- Submit → success screen; a row lands in `cohort_applications_india` with `originated_in_india=true`
  and no `based_in_usa`/`visa_category` columns. Re-submit same email → "already applied" toast, no
  dup.
- No app footer/bottom nav on `/ai-cohort-india(/**)`; renders logged-out; light + dark + 390px OK.

## 9. Commit message
```
feat(ai-cohort-india): clone AI Cohort register/apply flow with India form variant

Adds /ai-cohort-india (+ /apply) mirroring /ai-cohort-register, with two form
changes: a required "I am originated in India" checkbox replacing visa status,
and removal of the "based in USA" commitment. Stores submissions in a new
cohort_applications_india table in the workshop Supabase project. Shared
onboarding/apply-gate wrappers parameterized (defaults keep the USA flow
unchanged).
```
