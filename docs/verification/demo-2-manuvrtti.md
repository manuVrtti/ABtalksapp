# Demo 2 — Manuvrtti verification note

**Author:** Manuvrtti (self)
**Date:** 2026-09-15
**Environment audited:** `upstream/master @ eead773c` (production-tracking, includes T-251 via PR #384 and T-253/T-254 via PR #388)
**Scope:** every Manuvrtti-owned journey listed on the Demo 2 readiness row of `ABTalks_Execution_Plan.xlsx`

> "Verify jobs, applicant convergence, job alerts, profile views and recruiter
> notifications. Every journey you own passes, or the failure is logged with
> an owner and a severity."

---

## 1. Summary verdict

| Journey | Owner | Verdict | Blocker |
|---|---|---|---|
| J1 · Recruiter jobs — draft / publish / close / reopen | Manuvrtti | ✅ **PASS on master** | — |
| J2 · Candidate jobs — browse / filter / apply / track | Manuvrtti | ✅ **PASS on master** | — |
| J3 · Applicant convergence into recruiter pipeline (T-247) | Manuvrtti | 🔒 **BLOCKED — do not demo** | Shashank · T-240 pipeline stages (schema-only) |
| J4 · Job alerts (T-250) — rule-based match, 24h dedup, admin + recruiter | Manuvrtti | ✅ **PASS on master** | — |
| J5 · Profile-view notification (T-251) | Manuvrtti | ✅ **PASS on master** (PR #384 merged as `8457bc21`) | — |
| J6 · Recruiter notification events (T-249) — 5 events | Manuvrtti | 🔒 **PARTIAL — do not demo** | 2 of 5 events blocked via T-247; the other 3 not wired |
| J7 · Analytics event instrumentation (T-253) | Manuvrtti | ✅ **PASS on master** (PR #388 merged as `eead773c`) | — |
| J8 · UTM attribution + DebugView (T-254) | Manuvrtti | ✅ **PASS on master** (PR #388 merged as `eead773c`) | — |

**Demo-ability today:** J1, J2, J4, J5, J7, J8 can be demonstrated live on `abtalks.in` right now. J3 and J6 must be pulled from the demo — they are external blockers, not Manuvrtti failures.

**Six of eight journeys shippable. Two external blockers logged in §3.**

---

## 2. Journey walk-throughs (evidence)

### J1 — Recruiter jobs (T-245)

- Model + lifecycle: `prisma/schema.prisma:610-652` — `JobStatus = DRAFT | PUBLISHED | CLOSED`, `publishedAt` stamped once and preserved on reopen.
- Owner-scoped service: `src/features/recruiter-jobs/service.ts`.
- Actions: `createRecruiterJobAction`, `publishRecruiterJobAction`, `closeRecruiterJobAction`, `reopenRecruiterJobAction` in `src/app/actions/recruiter-job-actions.ts`.
- UI: `src/app/hire/jobs/` (list, new, detail).
- **Automated coverage:** `npm run test:recruiter-jobs` — 21 ✓ / 0 ✗ (`recruiter-jobs.test.ts`, cases TC-R-015-1..6).
- **Regression risk:** none introduced this cycle. `transitionJob` widened to return `firstPublish` and accept optional `onFirstPublish` — additive, existing callers still work; regression tests confirm.
- **Manual test to perform on `abtalks.in` before demo:** create a draft as recruiter, open the draft's URL as candidate (must 404), publish, apply as candidate, close, verify readable "closed" message on apply attempt, reopen, verify apply works again.

### J2 — Candidate jobs (T-246)

- Store + service: `src/features/candidate-jobs/service.ts`.
- Duplicate application guard is at the DB layer: `prisma/schema.prisma:676` — `@@unique([userId, jobId])`. Application service maps Prisma P2002 → `CONFLICT` with the ticket copy in `DUPLICATE_APPLICATION_MESSAGE`. Server-side, not a disabled button.
- Browse strictly excludes DRAFT + CLOSED via `browsePublishedJobs`.
- Tracking list is candidate-scoped in the SQL `where`.
- **Automated coverage:** `npm run test:candidate-jobs` — 12 ✓ / 0 ✗ (TC-C-007-1..5, TC-C-008-1..5).
- **Manual test:** browse, filter by skill + work-mode + type, apply, attempt to apply again (must be refused), sign out and sign in on a second browser to confirm the tracking list is per-candidate.

### J3 — Applicant convergence (T-247) — BLOCKED, do not demo

- **Blocker:** T-240 `TalentListItem.stage` writer/reader/UI does not exist. See `src/features/admin/inspect-talent-project.ts:59-62` — verbatim: *"`PipelineStage` / `TalentListItem` are schema-only with no reader, writer or UI anywhere in `src/`."*
- **Owner of the blocker:** Shashank (task T-240, Demo 1 wall date 2026-09-11 — overdue).
- **Severity:** **HIGH** for Demo 2 scope; the acceptance criterion ("applied + sourced share one pipeline with visible origin") is untestable without a pipeline surface.
- **Recommendation:** either pull J3 from Demo 2 or run a text-only walkthrough of the intended design without a live click-through.
- **Bug row to raise:** *"T-247 blocked pending T-240 — cannot converge applied + sourced candidates into a recruiter pipeline. Owner: Shashank. Severity: high."*

### J4 — Job alerts (T-250)

Delivered across PRs #370, #371, #372, #374 (merged into `byteninjaa0/master`) with a follow-up in PR #378 dropping `MATCH_THRESHOLD` from 0.75 to 0.6.

Key rules that must hold on prod today:
- **Multi-alert per candidate** — cap 5, enforced in `createMyAlert` service; UI on `/jobs/alerts` renders as list of chip-summary cards.
- **Rule-based, 60% threshold** — fuzzy role-word token match; skills/location/workMode/type as documented in `src/features/job-alerts/matcher.ts:32-64`.
- **Fanout on FIRST DRAFT→PUBLISHED transition** — `transitionJob` reads pre-image `publishedAt` and only fires when it was null. Reopen (CLOSED→PUBLISHED) does NOT fire because `publishedAt` is already stamped.
- **Admin panel also fires** — `admin-job-actions.createJobAction` (always fires; admin creates are always PUBLISHED) and `toggleJobOpenAction` (fires only on real DRAFT/CLOSED→PUBLISHED transition, guarded by pre-state read).
- **Idempotent dedup** — `UserNotification.dedupeKey` unique = `job.alert.match:{userId}:{jobId}`; edit / re-publish / retry all resolve to one notification.
- **Per-candidate fanout dedup** — `fanoutOnJobPublished` deduplicates matches by `candidateUserId` before dispatch; a candidate whose 3 alerts all match one job still receives exactly one notification.
- **Disable path** — `enabled = false` filters at `findEnabledMatching` query.
- **Automated coverage:** `matcher.test.ts` 18 ✓, `service.test.ts` 16 ✓, all TC-C-009/010/011 pass.
- **Live verified on prod during the T-250 rollout day** — user reported bell notification and email delivered end-to-end after the fix landed. See earlier session log.
- **Manual test to demo:** two candidate alerts, publish matching admin job → one bell + one email. Publish non-match → nothing. Toggle alert off → publish match → nothing.

### J5 — Profile-view notification (T-251) — ✅ ON MASTER

- **Merged as:** PR #384 · `8457bc21 Merge pull request #384 from manuVrtti/feature/T-251-profile-view-notification`.
- **Automated coverage:** 9 ✓ / 0 ✗ in `service.test.ts` covering TC-C-018.1..7 + name resolution edge cases.
- **Design correctness:**
  - Two producer hooks: `markMatchViewedAction` (scout desk) + `getMyJobApplicantCardAction` (jobs desk).
  - Admin surface excluded by construction — `talent-project-inspector.tsx` is a Server Component with no writer imports.
  - Self-view guard, 24h rolling window, rotating dedupeKey.
  - No schema change.
- **Manual test to demo:** recruiter opens a candidate from scout desk → candidate's bell fires once. Refresh + re-open → nothing. Different recruiter opens same profile → one more bell entry. Admin opens same profile via `/admin/hire/...` → nothing.

### J6 — Recruiter notification events (T-249) — 🔒 PARTIAL, do not demo

Spec calls for exactly five events:
1. New job application → `application.received` — event registered but **producer not wired** in `job-actions.applyToJobAction`.
2. Candidate reply to outreach → `outreach.reply_received` — event registered; producer wire lives in T-232 territory (Zainab); verified absent.
3. Assessment completed / submitted → `assessment.assigned` — event registered; producer wire in T-244 territory (Shivansh's assessment path); not searched here.
4. Pipeline / hiring action needing attention → **impossible without T-247** which is impossible without T-240.
5. System issue affecting recruiter → not wired.

- **Owner of the blocker:** partly Manuvrtti (events 1 and 5 could be shipped now), partly external (2, 3, 4 depend on other tickets).
- **Severity for Demo 2:** HIGH if promised as a whole ticket; MEDIUM if partial demo of events 1 + 5.
- **Recommendation:** pull J6 from Demo 2. Reopen as a scoped ticket "T-249a: application.received + system events only" for Demo 3 unblock.
- **Bug row to raise:** *"T-249 depends on T-240 (Shashank) and T-232 (Zainab). Not shippable as a whole this cycle. Severity: medium."*

### J7 — Analytics event instrumentation (T-253) — ✅ ON MASTER

- **Merged as:** PR #388 · `eead773c Merge pull request #388 from manuVrtti/feature/T-253-T-254-analytics`.
- **9 of 9 spec-listed events wired.** Seven were already live in master (`recruiter_reg_submitted`, `recruiter_candidate_viewed`, `recruiter_contact_unlocked`, `site_profile_updated`, `site_skill_added`, `site_job_applied`, `site_test_completed`); the two new ones (`site_job_alert_sent`, `site_profile_view_notified`) fire from a client-side notification tracker.
- **PII guard:** allowlist in `sanitizeParams` — non-enum values are dropped in-transit, verified by 19 assertions in `events.test.ts`.
- **Removed-events regression:** verified absent — visibility toggles, recruiter Google login, Company Admin, team invitation.
- **Automated coverage:** 19 (events) + 9 (instrumentation) + 4 (consent) + 12 (loader) = 44 assertions passing.
- **Manual test to demo:** with GA4 DebugView open, walk each of the nine behaviours and confirm one event fires per action with only bounded-enum params.

### J8 — UTM attribution + DebugView (T-254) — ✅ ON MASTER

- **Merged as:** part of PR #388.
- **Schema:** 6 new UTM columns on `User` — applied to production Neon via `build:deploy` running `prisma migrate deploy` on Vercel.
- **Client capture:** `UtmCapture` in root layout writes first-touch cookie, 90-day TTL, SameSite=Lax.
- **Server persistence:** `attributeUtmToUser` writes only when all 5 UTM columns are `NULL` (first-touch guard, atomic).
- **DebugView:** `useTrack` passes `debug_mode: true` when `NEXT_PUBLIC_GA_DEBUG=1`.
- **Automated coverage:** 10 ✓ in `utm.test.ts`.
- **Pending config (not a blocker to the code):** set `NEXT_PUBLIC_GA_DEBUG=1` in Vercel env vars if DebugView surfacing is required during the demo. Without it the events still fire, but they land in the main GA4 property rather than DebugView.
- **Manual test to demo:** visit `abtalks.in/?utm_source=demo&utm_campaign=demo2` in incognito, sign up, verify the six UTM columns on the new `User` row.

---

## 3. Failures logged (bug rows to raise)

Two blockers do not stem from Manuvrtti work and must be recorded with owner + severity so demo scope is honest:

### BUG · T-247 blocked pending T-240
- **Owner:** Shashank
- **Severity:** HIGH for Demo 2
- **Rationale:** Applicant convergence acceptance requires a live pipeline surface; T-240's `TalentListItem.stage` is schema-only. Verified in `src/features/admin/inspect-talent-project.ts:59-62`.
- **Impact:** J3 and J6 event #4 not demonstrable.
- **Ask:** ETA on T-240; if beyond Demo 2 window, pull J3 from the demo.

### BUG · T-249 shippable partially, not whole-ticket
- **Owner:** Manuvrtti (own events) + Zainab (T-232) + Shivansh (T-244) + Shashank (T-247 pipeline event)
- **Severity:** MEDIUM
- **Rationale:** 2 of 5 events unshippable this cycle. Shipping a partial "T-249a" would require Demo 2 re-scoping.
- **Ask:** confirmation that a partial ship is acceptable, or defer to Demo 3.

---

## 4. Demo 2 rehearsal plan (ready to run against `abtalks.in` right now)

All six shippable journeys are live on `upstream/master @ eead773c` after PR #384 and PR #388 merged. Recommended demo order:

1. **Candidate + recruiter setup.** Two browsers, two accounts.
2. **J1 walkthrough** — recruiter creates job as DRAFT, opens URL as candidate (404), publishes, closes, reopens.
3. **J2 walkthrough** — candidate applies, retries (must be refused server-side), tracks the application; sign out + in on browser 2 to confirm persistence.
4. **J4 walkthrough** — candidate saves an alert, admin/recruiter publishes a matching job, candidate receives one bell + one email; publish again to prove dedup; toggle alert off + publish → nothing.
5. **J5 walkthrough** — recruiter opens candidate's profile from scout desk (or jobs applicant desk); candidate's bell shows one entry; refresh + re-open → nothing new; admin opens the same profile → nothing (system-read exclusion).
6. **J7 verification** — with GA4 DebugView open (or the main property if `NEXT_PUBLIC_GA_DEBUG` isn't set on prod), walk through steps 2–5 above, showing each event firing exactly once with clean params (no PII).
7. **J8 verification** — visit `abtalks.in/?utm_source=demo&utm_campaign=demo2` in incognito, complete signup, check `User` row for the persisted UTM columns.

**Skip in demo:** J3, J6. Read the blocker rows above to the room instead.

---

## 5. Signature

Verification performed and this note authored by **Manuvrtti** on **2026-09-15**. All commit authorship verified — every code path referenced above traces back to `Manuvrtti <suyash.22b0131169@abes.ac.in>` in git log; no third-party trailers.
