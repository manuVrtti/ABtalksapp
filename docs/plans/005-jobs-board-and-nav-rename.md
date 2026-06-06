# 005 — Jobs board + bottom-nav rename (Mock Interview → Jobs)

> Plan B of two (companion: `004-synergy-gamification-and-submission-rework.md`).
> Independent migration; can ship before or after 004. Branch off the current
> tip: `git checkout -b feature/jobs-board`.

## 1. Goal
Replace the "Mock Interview" tab with "Jobs". Build a jobs board where admins
post and remove job openings, any logged-in student can browse a job and apply
(one click, optional note), and admins can see who applied to each job and
export the applicants to CSV.

## 2. Context / current behavior
- Plan 002 (shipped on `feature/bottom-navigation`) added a mobile bottom nav
  (`src/components/shared/bottom-nav.tsx`) with tabs
  `Home / Mock Interview / Our Mission / Profile`, a desktop "Mock Interview"
  header link in `src/components/shared/app-header.tsx`, a `/mock-interview`
  page (`src/app/mock-interview/page.tsx`) gated by
  `src/features/mock-interview/check-eligibility.ts`, and a `/mission` page.
  `middleware.ts` `protectedPaths` includes `/mock-interview` and `/mission`.
- Per the product decision, **everyone logged in can view and apply** to jobs
  — no completion gate. Mock interview as a concept is removed from the nav and
  superseded by Jobs.
- Admin shell: `src/app/admin/layout.tsx` builds `navItems` and renders
  `AdminSidebar` (`src/components/admin/admin-sidebar.tsx`) with an in-file
  `iconMap` keyed by string `IconName`. Adding a sidebar entry = add a
  `navItems` row + an `iconMap` key.
- CSV export pattern is established: `src/lib/csv.ts` (`toCSV` + `downloadCSV`)
  + a server action returning `Record<string, …>[]` + a client `useTransition`
  button (see `src/components/admin/students-filters.tsx`).
- `requireAdmin()` (`src/lib/admin-auth.ts`) gates all admin actions/pages.
- No `Job` / `JobApplication` models exist.

## 3. Files to touch

**Schema / data**
- `prisma/schema.prisma` `[edit]` — add `JobType` enum, `Job` model,
  `JobApplication` model, and the `User.jobApplications` back-relation.

**New files — student-facing**
- `src/app/jobs/page.tsx` `[new]` — Server. List of open jobs.
- `src/app/jobs/[id]/page.tsx` `[new]` — Server. Job detail + apply.
- `src/components/jobs/apply-job-button.tsx` `[new]` — Client. Apply control
  (one click + optional note), calls the apply action.
- `src/features/jobs/get-open-jobs.ts` `[new]` — Server. Open jobs list.
- `src/features/jobs/get-job-detail.ts` `[new]` — Server. One job + whether the
  current user already applied.

**New files — admin-facing**
- `src/app/admin/jobs/page.tsx` `[new]` — Server. All jobs (open + closed) +
  "New job" form entry.
- `src/app/admin/jobs/[id]/page.tsx` `[new]` — Server. Edit/close/delete +
  applicants table + CSV export.
- `src/components/admin/job-form.tsx` `[new]` — Client. Create/edit form.
- `src/components/admin/job-admin-controls.tsx` `[new]` — Client. Close/reopen
  + delete + "Export applicants (CSV)".
- `src/features/jobs/get-jobs-admin.ts` `[new]` — Server. All jobs for admin
  list (with applicant counts).
- `src/features/jobs/get-job-applicants.ts` `[new]` — Server. Applicants for
  one job (admin).

**New action files**
- `src/app/actions/job-actions.ts` `[new]` — `applyToJobAction` (student).
- `src/app/actions/admin-job-actions.ts` `[new]` — `createJobAction`,
  `updateJobAction`, `deleteJobAction`, `toggleJobOpenAction`,
  `getJobApplicantsForExport`.

**Edited files — nav rename + cleanup**
- `src/components/shared/bottom-nav.tsx` `[edit]` — `Mock Interview` → `Jobs`
  (`href: "/jobs"`, icon `Briefcase`). Update the `isTabActive` subtree note
  (jobs matches `/jobs` and `/jobs/...`).
- `src/components/shared/app-header.tsx` `[edit]` — desktop "Mock Interview"
  link → "Jobs" (`/jobs`).
- `src/app/admin/layout.tsx` `[edit]` — add a `Jobs` entry to `navItems`.
- `src/components/admin/admin-sidebar.tsx` `[edit]` — add `jobs` to `IconName`
  + `iconMap` (`Briefcase`).
- `middleware.ts` `[edit]` — add `"/jobs"` to `protectedPaths`; remove
  `"/mock-interview"`. **Edge-safe: no `@/lib/*` imports.**

**Removed (cleanup — now unreachable)**
- `src/app/mock-interview/page.tsx` `[delete]`
- `src/features/mock-interview/check-eligibility.ts` `[delete]`
  (and the now-empty `src/features/mock-interview/` dir)

**Not touched**
- `/mission` page and tab stay.
- `src/components/ui/*` — no primitive edits.

## 4. Server vs Client
- `get-open-jobs.ts`, `get-job-detail.ts`, `get-jobs-admin.ts`,
  `get-job-applicants.ts` — **Server-only** modules (`select` only).
- `job-actions.ts`, `admin-job-actions.ts` — **Server Actions**.
- `jobs/page.tsx`, `jobs/[id]/page.tsx`, `admin/jobs/page.tsx`,
  `admin/jobs/[id]/page.tsx` — **Server Components**.
- `apply-job-button.tsx`, `job-form.tsx`, `job-admin-controls.tsx` —
  **Client**. They own their own form state / `useTransition`. Lucide icons
  used inside them stay inside.
- **Server→Client props:** pages pass plain JSON to the client controls —
  `jobId` (string), `alreadyApplied` (boolean), and for the form the job's
  current field values (all strings/numbers/booleans; `JobType` passed as its
  string value). Convert any `Date` (e.g. `createdAt`) to a formatted string
  server-side before passing. No functions/icons/Dates cross the boundary.

## 5. Step-by-step changes

### 5.1 Schema (`prisma/schema.prisma`)
```prisma
enum JobType {
  FULL_TIME
  INTERNSHIP
  CONTRACT
  PART_TIME
}

model Job {
  id              String           @id @default(cuid())
  title           String
  company         String
  location        String?
  type            JobType          @default(FULL_TIME)
  description     String           // long-form; rendered as text/markdown
  applyExternalUrl String?         // optional; if set, "Apply" can deep-link out
  isOpen          Boolean          @default(true)
  createdByAdminId String
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  applications    JobApplication[]

  @@index([isOpen, createdAt(sort: Desc)])
}

model JobApplication {
  id        String   @id @default(cuid())
  jobId     String
  userId    String
  note      String?
  createdAt DateTime @default(now())
  job       Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([jobId, userId])
  @@index([userId])
  @@index([jobId])
}
```
- Add to `User`: `jobApplications JobApplication[]`.
- `createdByAdminId` is a plain string (admin user id); no FK relation needed
  (keeps the User model uncluttered, matches `AdminAction` style where actor is
  referenced but we don't need a back-relation here). If a relation is
  preferred for integrity, that's acceptable too — but do not add a back-ref
  that forces a `User` schema churn beyond `jobApplications`.

### 5.2 Student read modules
- `get-open-jobs.ts`:
  ```ts
  export async function getOpenJobs() {
    return prisma.job.findMany({
      where: { isOpen: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, company: true, location: true,
                type: true, createdAt: true,
                _count: { select: { applications: true } } },
    });
  }
  ```
- `get-job-detail.ts(jobId, userId)`:
  ```ts
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true, title: true, company: true, location: true, type: true,
              description: true, applyExternalUrl: true, isOpen: true, createdAt: true },
  });
  if (!job) return null;
  const applied = await prisma.jobApplication.findUnique({
    where: { jobId_userId: { jobId, userId } }, select: { id: true },
  });
  return { job, alreadyApplied: !!applied };
  ```

### 5.3 Student pages
- `src/app/jobs/page.tsx` (Server):
  - `auth()` guard → redirect `/login` if no session (middleware already gates,
    but guard defensively).
  - Render `<AppHeader user={…} />`, page heading "Jobs", and the open-jobs
    list as cards (mobile-first; `grid gap-4`). Each card links to
    `/jobs/{id}`, shows title, company, location, a `JobType` badge, and
    `{count} applied`.
  - Empty state: "No open roles right now — check back soon."
  - Add `pb-16 md:pb-0` already handled by the root layout's `<main>`.
- `src/app/jobs/[id]/page.tsx` (Server):
  - Load `getJobDetail(id, session.user.id)`. 404 → `notFound()`.
  - Render full description (use `react-markdown`, already a dep, or plain
    pre-wrapped text), the meta (company/location/type), and the
    `<ApplyJobButton jobId={job.id} alreadyApplied={alreadyApplied}
    externalUrl={job.applyExternalUrl ?? ""} isOpen={job.isOpen} />`.
  - If `!job.isOpen`, show "This role is closed" and disable applying.

### 5.4 `apply-job-button.tsx` (Client)
- Props: `{ jobId: string; alreadyApplied: boolean; externalUrl: string; isOpen: boolean }`.
- If `alreadyApplied` → render a disabled "Applied ✓" state.
- Else a primary "Apply" button. On click, reveal an optional note `<textarea>`
  ("Add a note to the recruiter (optional)") + a confirm button, OR apply
  immediately if you prefer minimal friction — **implement: click Apply →
  inline optional note + "Submit application"**.
- `useTransition` → `applyToJobAction({ jobId, note })`. Toast result;
  on success switch to the "Applied ✓" state and `router.refresh()`.
- If `externalUrl` is set, ALSO show a secondary link
  `<Link className={cn(buttonVariants({ variant: "outline" }), …)} href={externalUrl} target="_blank">Apply on company site ↗</Link>`
  (recording the in-app application is still the primary path).

### 5.5 `job-actions.ts` (Student action)
```ts
"use server";
const applySchema = z.object({
  jobId: z.string().min(1),
  note: z.string().max(1000).optional().default(""),
});
export async function applyToJobAction(input: { jobId: string; note?: string }) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, message: "Sign in to apply." };
  const parsed = applySchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "Invalid input" };
  try {
    const job = await prisma.job.findUnique({
      where: { id: parsed.data.jobId }, select: { isOpen: true },
    });
    if (!job || !job.isOpen) return { ok: false as const, message: "This role is closed." };
    await prisma.jobApplication.create({
      data: { jobId: parsed.data.jobId, userId: session.user.id,
              note: parsed.data.note.trim() || null },
    });
    return { ok: true as const };
  } catch (e) {
    // P2002 = already applied (unique jobId+userId)
    return { ok: false as const, message: "You've already applied to this role." };
  }
}
```
- **This is a public-ish authed surface — do NOT add `requireAdmin`.** Any
  logged-in student may apply.

### 5.6 Admin read modules
- `get-jobs-admin.ts`: all jobs (open + closed), newest first, with
  `_count.applications`. `select` only.
- `get-job-applicants.ts(jobId)`: applicants with student display fields:
  ```ts
  prisma.jobApplication.findMany({
    where: { jobId },
    orderBy: { createdAt: "desc" },
    select: { id: true, note: true, createdAt: true,
      user: { select: { email: true,
        studentProfile: { select: { fullName: true, phone: true, domain: true,
          linkedinUrl: true, githubUsername: true, college: true,
          graduationYear: true, isReadyForInterview: true } } } } },
  });
  ```

### 5.7 Admin pages
- `src/app/admin/jobs/page.tsx` (Server): table/cards of all jobs (title,
  company, type, open/closed badge, applicant count, link to detail). A
  `<JobForm mode="create" />` (collapsible or top-of-page) to post a new job.
- `src/app/admin/jobs/[id]/page.tsx` (Server): `<JobForm mode="edit"
  job={…} />` prefilled; `<JobAdminControls jobId isOpen />` for close/reopen,
  delete, and CSV export; and the applicants table (responsive: cards `< md`,
  table `md+`, matching plan 003's pattern). Applicant rows link to
  `/admin/students/{userId}`.

### 5.8 Admin client components
- `job-form.tsx` (Client): fields title, company, location (optional), type
  (`<select>` over the 4 `JobType` values), description (textarea),
  applyExternalUrl (optional). `useTransition` → `createJobAction` /
  `updateJobAction`. Toast + `router.push`/`refresh`.
- `job-admin-controls.tsx` (Client): "Close"/"Reopen"
  (`toggleJobOpenAction`), "Delete" (confirm dialog → `deleteJobAction` →
  `router.push("/admin/jobs")`), and "Export applicants (CSV)" using
  `getJobApplicantsForExport(jobId)` + `toCSV` + `downloadCSV` (filename
  `abtalks-job-{jobId}-applicants-{date}.csv`).

### 5.9 `admin-job-actions.ts`
- All actions start with `await requireAdmin()`. Zod-validate inputs.
- `createJobAction(input)`: validate (title/company/description required, type
  in enum, urls optional-or-valid), `prisma.job.create({ data: { …,
  createdByAdminId: admin.userId } })`, return `{ ok, data: { id } }`.
- `updateJobAction(input)`: `job.update` by id.
- `toggleJobOpenAction({ jobId, isOpen })`: `job.update` set `isOpen`.
- `deleteJobAction({ jobId })`: `job.delete` (cascades applications).
- `getJobApplicantsForExport(jobId)`: `requireAdmin`, call
  `get-job-applicants`, map to a flat `Record<string, string|number>[]`
  (Full Name, Email, Phone, Domain, College, Graduation Year, LinkedIn,
  GitHub, Ready For Interview, Applied At, Note).

### 5.10 Nav rename + cleanup
- `bottom-nav.tsx`: change the second tab to
  `{ href: "/jobs", label: "Jobs", Icon: Briefcase }`. Import `Briefcase`
  from lucide-react; drop the now-unused `Mic`. `isTabActive("/jobs")` already
  works via the generic `startsWith` branch.
- `app-header.tsx`: change the desktop "Mock Interview" `<Link href="/mock-interview">`
  to "Jobs" `href="/jobs"` (keep the same active-state logic, compare against
  `/jobs`).
- `admin/layout.tsx`: add `{ href: "/admin/jobs", label: "Jobs", icon: "jobs" }`
  to `navItems` (place after "Submissions").
- `admin-sidebar.tsx`: add `"jobs"` to the `IconName` union and
  `jobs: Briefcase` to `iconMap` (import `Briefcase`).
- `middleware.ts`: in `protectedPaths`, add `"/jobs"`, remove
  `"/mock-interview"`. Keep `/admin` (covers `/admin/jobs`). No `@/lib/*`.
- Delete `src/app/mock-interview/page.tsx` and
  `src/features/mock-interview/check-eligibility.ts`. Grep for any remaining
  imports of `check-eligibility` / `/mock-interview` and remove them (there
  should be none outside the deleted page after the nav edits).

## 6. Guardrails for Cursor (DO NOT)
- DO NOT add `requireAdmin` / `requireRole` to `applyToJobAction`, `/jobs`, or
  `/jobs/[id]`. Those are authed student surfaces — any logged-in user can
  view and apply. Only `/admin/jobs*` and the `admin-job-actions` are
  admin-gated.
- DO NOT import `@/lib/*` (or anything beyond `next-auth` / `next/server` /
  `@/auth.config`) into `middleware.ts`. Only edit the `protectedPaths` array.
- DO NOT pass Lucide icons, functions, or Date objects across the
  Server→Client boundary. Format dates to strings server-side; pass `JobType`
  as its string value; resolve icons inside client components.
- DO NOT use `<Button asChild>` / `<Button render={<Link>}>`. Use
  `buttonVariants` on `<Link>`. (Standing rule.)
- DO NOT use `include` — `select` only. Multi-row writes (none here beyond
  single creates/deletes) would be transactional; single writes are fine.
- DO NOT use `any`. Action results use the `{ ok, … } | { ok:false, message }`
  envelope.
- DO NOT log via `console.*`. Use `lib/logger.ts` for caught errors.
- DO NOT leave dead references to mock-interview. After deleting the page and
  feature, grep `mock-interview` and `check-eligibility` → zero hits expected.
- DO NOT add a new sidebar item for anything other than Jobs.
- DO NOT create a new CSV helper — reuse `lib/csv.ts`.
- DO NOT gate applying behind synergy or 60-day completion (per product
  decision: everyone can view and apply).

## 7. DB safety (schema change)
1. **Checkpoint:** `git add -A && git commit -m "checkpoint before jobs migration"`. Note the hash.
2. **Neon branch snapshot** before migrating.
3. **Migrate:** `npx prisma migrate dev --name add_jobs_and_applications`.
4. **Regenerate:** `npx prisma generate`.
5. **Optional seed:** add 2–3 sample jobs to `prisma/seed.ts` so `/jobs` and
   `/admin/jobs` aren't empty in dev. Not required.
6. `npm run build` to confirm migration + types.

## 8. Verification
Manual (local, `ENABLE_DEV_AUTH=true`):
1. `npm run dev`.
2. **Nav rename**: on a phone width, the bottom nav reads
   `Home / Jobs / Our Mission / Profile` with a briefcase icon. Desktop header
   shows a "Jobs" link. `/mock-interview` now 404s (route removed); the
   Jobs tab highlights on `/jobs` and `/jobs/{id}`.
3. **Admin posts a job**: as `admin@abtalks.dev`, `/admin/jobs` → fill the new
   job form → job appears in the list and at `/jobs` for students.
4. **Student applies**: as `arjun@abtalks.dev`, `/jobs` → open the job → Apply
   (with optional note) → button becomes "Applied ✓". Re-applying is blocked
   ("already applied").
5. **Admin sees applicants + CSV**: back in `/admin/jobs/{id}`, the applicants
   table lists Arjun with his note and applied-at. "Export applicants (CSV)"
   downloads a file with the flat columns. Close the job → students see
   "This role is closed" and cannot apply. Delete the job → it disappears and
   applications cascade away.
6. **Responsive**: `/admin/jobs/{id}` applicants render as cards `< md`, table
   `md+`. `/jobs` cards stack cleanly on a phone.
7. **Build/typecheck**: `npm run lint`, `npm run build`, `tsc --noEmit` clean.
   Grep: no `mock-interview` / `check-eligibility` references remain.

Files that should change (and only these): the schema, the new files, the
edited nav/cleanup files in §3, and the two deletions.

## 9. Commit message
```
feat(jobs): jobs board with apply + admin posting, replace Mock Interview tab

- New Job + JobApplication models. Admins post/edit/close/delete jobs at
  /admin/jobs and export each job's applicants to CSV. Any logged-in student
  can browse /jobs, open a role, and apply once (optional note).
- Bottom nav and desktop header: Mock Interview -> Jobs (/jobs). Removes the
  now-superseded /mock-interview page and its eligibility feature; middleware
  protectedPaths swaps /mock-interview for /jobs.

Migration: add_jobs_and_applications.
```
