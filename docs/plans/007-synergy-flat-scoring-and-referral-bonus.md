# 007 — Synergy: drop time-based rank bonus, add +3 referral bonus

## 1. Goal
Two synergy-system changes shipping together:

1. **Make submission synergy time-independent.** Today the per-submission
   payout includes a `rankBonus` (10/8/6/5/2 based on how early the student
   submitted vs. peers for the same `(challengeId, dayNumber)`). Remove it
   from the scoring formula AND from the user-facing "How you earn" tiles.
   New formula: `base (5) + github (5 if attached) + linkedin (5 if attached)`
   — deterministic 5–15 per day. Existing synergy balances are NOT touched.

2. **Award +3 synergy to the referrer on referee signup.** When a new user
   completes registration with a valid referral code, the referrer
   immediately gets +3 synergy points. One-time per referee (idempotent via
   the existing `Referral.referredId @unique`). Surface this as a "Refer a
   friend" tile in the SynergyChip dialog, replacing the removed "Finish
   early" tile.

## 2. Current behavior

### Backend scoring
`src/features/synergy/scoring.ts`:
- Exports `SYNERGY_BASE_SUBMISSION = 5`, `SYNERGY_PROOF_GITHUB = 5`,
  `SYNERGY_PROOF_LINKEDIN = 5`.
- Exports `rankBonus(rank): number` returning 10/8/6/5/2 by tier.
- Exports `computeSubmissionSynergy({ rank, hasGithub, hasLinkedin })` adding
  base + rankBonus + proofs.

`src/features/synergy/award-submission-synergy.ts`:
- Counts `earlier` submissions for `(dayNumber, challengeId)` with
  `submittedAt: { lt: args.submittedAt }`, sets `rank = earlier + 1`.
- Calls `computeSubmissionSynergy` and inserts `SynergyEvent` with
  `type: "SUBMISSION"` and `rankAtAward: rank`.
- Increments `studentProfile.synergyPoints` by the awarded amount.

`prisma/schema.prisma` — `SynergyEvent`:
```
type             String         // freeform — "SUBMISSION" today
submissionId     String? @unique
rankAtAward      Int?           // nullable
reason           String?
```
`type` is a freeform string (not an enum), so adding a `"REFERRAL"` value is
zero-migration.

### Referral creation
`src/features/registration/complete-registration.ts` lines 158-170: AFTER
the main registration transaction commits, the code does a fire-and-forget
`prisma.referral.create({ data: { referrerId, referredId, rewardGiven: false } })`
wrapped in try/catch. The `Referral.referredId @unique` constraint blocks
double-creation. Then `submit-day.ts:275-279` flips `rewardGiven` to true
when the referee submits any day ≥ 7. The "rewarded" state is separate from
this plan — the +3 fires at signup, not at Day 7.

### Frontend
`src/components/shared/synergy-chip.tsx`:
- Chip button + dialog hero use the `Sparkles` icon (no color overrides —
  inherits from parent).
- Dialog has a 2×2 "How you earn" grid (`grid-cols-1 sm:grid-cols-2`) with
  four tiles: **Finish early** (Clock, indigo), **Attach your GitHub**
  (GitCommit, emerald), **Share on LinkedIn** (Share2, sky), **Show up for
  the community** (Users, violet). The Finish early tile (lines 75-84)
  describes the rank bonus. That copy and tile are obsolete.

### What is NOT touched
- `studentProfile.synergyPoints` balances stay as-is.
- Existing `SynergyEvent` rows stay as-is (including their historic
  `rankAtAward` values). Audit history is preserved.
- `Referral` rewardGiven flag and the existing Day-7 flip behaviour.
- The leaderboard / public profile / admin views consuming `synergyPoints`
  read the denormalized field and are unaffected.

## 3. Files to touch

| Path | Status | Note |
|---|---|---|
| `src/features/synergy/scoring.ts` | [edit] | Delete `rankBonus()`. Change `computeSubmissionSynergy` signature: drop the `rank` field, keep `{ hasGithub, hasLinkedin }`. Return shape becomes `{ points: number }` (drop `rankBonus` from the return). Add `export const SYNERGY_REFERRAL = 3;`. |
| `src/features/synergy/award-submission-synergy.ts` | [edit] | Drop the `tx.submission.count({ earlier })` query and the `rank` variable. Drop `submittedAt` from the function args (now unused). Call the new `computeSubmissionSynergy` without `rank`. Insert `SynergyEvent` with `rankAtAward: null` going forward. |
| `src/features/synergy/award-referral-synergy.ts` | [new] | New helper `awardReferralSynergy(tx, { referrerId, referralId, referredUserId })` that inserts a `SynergyEvent` of `type: "REFERRAL"` with `points: SYNERGY_REFERRAL`, `reason: "Signup via referral code (referralId=<id>)"`, then increments `referrer.studentProfile.synergyPoints` by `SYNERGY_REFERRAL`. No write to `Referral` itself. |
| `src/features/registration/complete-registration.ts` | [edit] | Wrap the existing `prisma.referral.create({...})` (lines 158-170) in a `prisma.$transaction` that ALSO calls `awardReferralSynergy`. Atomic — if the unique constraint fires (P2002), nothing is awarded. Keep the surrounding try/catch and existing logger pattern. |
| `src/features/submission/submit-day.ts` | [edit] | The current `awardSubmissionSynergy(...)` call passes `submittedAt`. After the args change in Step above, remove `submittedAt` from the call site. No other change. |
| `src/components/shared/synergy-chip.tsx` | [edit] | Drop the `Clock` import. Add `UserPlus` import from lucide-react. Add `SYNERGY_REFERRAL` to the existing `@/features/synergy/scoring` import line. Replace the "Finish early" tile (lines 75-84) with a "Refer a friend" tile using `UserPlus`, an emerald or amber tint different from the other three tiles, and copy that interpolates `+{SYNERGY_REFERRAL}`. |
| `prisma/schema.prisma` | (no edit) | `SynergyEvent.type` is a freeform `String` — `"REFERRAL"` is a new value, not a new column. `rankAtAward` is already `Int?` (nullable). |
| Migrations / seed | (no edit) | No data backfill. Existing balances stay. |

## 4. Server vs Client
- All synergy backend files (`scoring.ts`, `award-*.ts`, `complete-registration.ts`, `submit-day.ts`) — Server. No boundary change.
- `synergy-chip.tsx` — Client (`"use client"`). Receives no new server props; reads `SYNERGY_REFERRAL` as a module import (pure constant — safe to bundle into the Client component since the constants file has no Prisma / `next/headers` imports). Confirm before edit: `src/features/synergy/scoring.ts` is pure (no `prisma`, no `headers()`, no `auth()` imports). It is today; preserve that.

## 5. Steps

### Feature 1 — Time-independent submission synergy

**Step 1 — Update `scoring.ts`**

In `src/features/synergy/scoring.ts`, replace the entire file with:

```ts
export const SYNERGY_BASE_SUBMISSION = 5;
export const SYNERGY_PROOF_GITHUB = 5;
export const SYNERGY_PROOF_LINKEDIN = 5;
export const SYNERGY_REFERRAL = 3;

export function computeSubmissionSynergy(input: {
  hasGithub: boolean;
  hasLinkedin: boolean;
}): { points: number } {
  const points =
    SYNERGY_BASE_SUBMISSION +
    (input.hasGithub ? SYNERGY_PROOF_GITHUB : 0) +
    (input.hasLinkedin ? SYNERGY_PROOF_LINKEDIN : 0);
  return { points };
}
```

`rankBonus` is gone. `rank` is gone from the input. The return shape loses `rankBonus`.

**Step 2 — Update `award-submission-synergy.ts`**

In `src/features/synergy/award-submission-synergy.ts`:
- Drop the `tx.submission.count({ where: { ..., submittedAt: { lt: ... } } })` query and the `rank = earlier + 1` line.
- Drop `submittedAt` from the `args` type — no longer needed.
- Call `computeSubmissionSynergy({ hasGithub: args.hasGithub, hasLinkedin: args.hasLinkedin })`.
- In the `tx.synergyEvent.create` call, set `rankAtAward: null` (or omit the field — Prisma treats omission as null for nullable columns).
- Keep the `studentProfile.synergyPoints` increment unchanged.

Resulting function body should be ~15 lines shorter and no longer touch the `Submission` table for reads.

**Step 3 — Update the call site in `submit-day.ts`**

`grep -n "awardSubmissionSynergy" src/features/submission/submit-day.ts` — there should be exactly one call. Remove `submittedAt:` from the arg object. No other change. **Do NOT** delete the `submittedAt: new Date()` assignment on the `Submission.create` / `upsert` itself — that's the audit timestamp, separate concern.

**Step 4 — Sweep for orphaned consumers**

Run these greps and confirm zero hits:
- `grep -rn "rankBonus" src/` — must be zero matches after Step 1.
- `grep -rn "\\brank\\b.*computeSubmissionSynergy\\|computeSubmissionSynergy.*\\brank\\b" src/` — must be zero.
- `grep -rn "rankAtAward" src/` — admin / display surfaces, if any, must tolerate `null`. (The Prisma type is already `Int?` so consumers should already handle null; this is just a sanity check.)

If any match surfaces, surface it for triage — do NOT fix it speculatively.

### Feature 2 — Referral synergy

**Step 5 — Create `awardReferralSynergy`**

Add new file `src/features/synergy/award-referral-synergy.ts`:

```ts
import type { Prisma } from "@prisma/client";
import { SYNERGY_REFERRAL } from "./scoring";

export async function awardReferralSynergy(
  tx: Prisma.TransactionClient,
  args: {
    referrerId: string;
    referralId: string;
    referredUserId: string;
  },
): Promise<number> {
  await tx.synergyEvent.create({
    data: {
      userId: args.referrerId,
      points: SYNERGY_REFERRAL,
      type: "REFERRAL",
      reason: `Referral signup (referralId=${args.referralId}, referredUserId=${args.referredUserId})`,
    },
  });
  await tx.studentProfile.updateMany({
    where: { userId: args.referrerId },
    data: { synergyPoints: { increment: SYNERGY_REFERRAL } },
  });
  return SYNERGY_REFERRAL;
}
```

Notes:
- `tx.studentProfile.updateMany` (not `update`): the referrer may not have a `StudentProfile` yet in some edge cases (corrupt data, deleted profile). `updateMany` is a no-op rather than throwing. We accept that the SynergyEvent row still gets inserted as an audit record even if the profile increment is a no-op.
- `submissionId` / `enrollmentId` / `dayNumber` / `rankAtAward` fields are omitted — Prisma treats them as null.
- Idempotency is enforced upstream by the `Referral.referredId @unique` constraint — this helper does not need its own dedupe.

**Step 6 — Wire into registration**

In `src/features/registration/complete-registration.ts`, replace the existing block at lines 158-170:

```ts
if (referrerId) {
  try {
    await prisma.referral.create({
      data: {
        referrerId,
        referredId: userId,
        rewardGiven: false,
      },
    });
  } catch (error) {
    console.error("[registration] referral creation failed:", error);
  }
}
```

with:

```ts
if (referrerId) {
  try {
    await prisma.$transaction(async (tx) => {
      const referral = await tx.referral.create({
        data: {
          referrerId,
          referredId: userId,
          rewardGiven: false,
        },
        select: { id: true },
      });
      await awardReferralSynergy(tx, {
        referrerId,
        referralId: referral.id,
        referredUserId: userId,
      });
    });
  } catch (error) {
    // The Referral.referredId @unique constraint will throw P2002 on
    // duplicate signup attempts; that path also rolls back the synergy
    // award, which is what we want.
    console.error("[registration] referral creation failed:", error);
  }
}
```

Add the import: `import { awardReferralSynergy } from "@/features/synergy/award-referral-synergy";`

Notes:
- The wrapping `$transaction` is intentional. Atomic: if the unique constraint fires (or the synergy insert fails for any reason), nothing partial commits.
- **Keep** the outer try/catch and the existing `console.error` log line verbatim — the project uses this exact pattern here. Do NOT swap it for `lib/logger.ts` in this change; that's a separate concern.
- This block stays OUTSIDE the main registration transaction (which ends at line 156). The main transaction creates `User`/`StudentProfile`/`Enrollment`; failing the referral synergy must NOT roll back the registration itself.

### Feature 3 — Update SynergyChip UI

**Step 7 — Drop the "Finish early" tile, add "Refer a friend"**

In `src/components/shared/synergy-chip.tsx`:

- Line 4-11 import block: remove `Clock,` and add `UserPlus,`. Final import (alphabetical-ish, matching existing style):
  ```ts
  import {
    GitCommit,
    Share2,
    Sparkles,
    TrendingUp,
    UserPlus,
    Users,
  } from "lucide-react";
  ```
- Lines 20-23: extend the scoring import to include the new constant:
  ```ts
  import {
    SYNERGY_PROOF_GITHUB,
    SYNERGY_PROOF_LINKEDIN,
    SYNERGY_REFERRAL,
  } from "@/features/synergy/scoring";
  ```
- Replace the "Finish early" tile (lines 75-84) with the "Refer a friend" tile. Suggested markup, matching the style of the surrounding tiles:
  ```tsx
  <div className="rounded-xl border bg-card p-3">
    <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
      <UserPlus className="size-4 text-amber-600 dark:text-amber-400" />
    </div>
    <p className="text-sm font-semibold">Refer a friend</p>
    <p className="mt-1 text-xs text-muted-foreground">
      Share your referral link. When someone signs up using it, you get
      +{SYNERGY_REFERRAL} synergy instantly.
    </p>
  </div>
  ```
- Keep the GitHub / LinkedIn / Community tiles unchanged. The grid stays 2×2 on `sm:`.
- Do NOT change the chip button, the dialog header, the `TrendingUp` footer banner, or the close button.

## 6. Guardrails for Cursor (DO NOT)
- **DO NOT** retroactively recompute existing `SynergyEvent.points` or `studentProfile.synergyPoints`. The product decision is forward-only. Existing audit rows with `rankAtAward != null` stay as historical record.
- **DO NOT** add a database migration. `SynergyEvent.type` is already `String` (not enum); `"REFERRAL"` is a value, not a schema change. `rankAtAward` is already nullable.
- **DO NOT** delete `rankAtAward` from the Prisma schema. Historical rows still use it. Removing the column would require a destructive migration and lose audit history.
- **DO NOT** move the referral-synergy award into `submit-day.ts:275-279` (the rewardGiven flip). The product decision is "on signup," not "on Day 7."
- **DO NOT** add a +3 award to existing referrals (no backfill pass). New referrals only.
- **DO NOT** move the referral-creation block INTO the main registration transaction at `complete-registration.ts:115-156`. That transaction must succeed for registration to be considered complete; the referral side-effect must remain best-effort outside it.
- **DO NOT** swap `console.error` for `lib/logger.ts` in `complete-registration.ts` in this change. Out of scope.
- **DO NOT** add color or style overrides to the `Sparkles` icon (still used in the chip button and dialog header). The user has a separate plan in flight (plan 005) about that icon — don't touch it here.
- **DO NOT** change the chip button gradient, the chip's points display, or `getMySynergy.ts`. The denormalized read path is unchanged.
- **DO NOT** add a new column to `SynergyEvent` to track referral linkage. The `reason: "Referral signup (referralId=..., referredUserId=...)"` string is enough for audit.
- **DO NOT** widen the change to the public profile, leaderboard, or admin views consuming `synergyPoints`. Those read the denormalized integer; the integer's source of truth doesn't change.
- **DO NOT** keep `rankBonus` or `rank` exported from `scoring.ts` "for backwards compatibility." Cursor must delete them. If any importer surfaces in Step 4's grep, surface that file for a fix rather than re-introducing the symbol.

## 7. DB safety
No schema changes, no migrations, no seed updates. The new `SynergyEvent` rows of `type: "REFERRAL"` are pure inserts into an existing table with all-nullable secondary columns. No Neon snapshot required; the existing rollback safety net (just `git revert`) covers code-only changes.

## 8. Verification

### Pre-flight
- `npx tsc --noEmit` must pass.
- Lint must pass.
- `npm run build` must succeed.
- `grep -rn "rankBonus\\|rankBonus(" src/` returns zero hits.
- `grep -rn "computeSubmissionSynergy" src/` shows exactly two hits: the definition in `scoring.ts` and the call in `award-submission-synergy.ts`.
- `grep -rn "SYNERGY_REFERRAL" src/` shows exactly three hits: the definition in `scoring.ts`, the import in `award-referral-synergy.ts`, and the import + render in `synergy-chip.tsx`.

### Manual test matrix

**Submission scoring**
| Scenario | Expected points awarded |
|---|---|
| User submits a day with both GitHub + LinkedIn URLs | 5 + 5 + 5 = **15** |
| User submits with GitHub only (LinkedIn somehow blank — rare, defensive) | 5 + 5 = **10** |
| User submits with neither (admin mark-day-complete path) | 5 (just the base) |
| Same user submits two days back-to-back, one a backfill | Each award is independent and equal — both yield 15 if both have proofs. No "first submitter" advantage. |
| Two different users submit the same day at different times | Both get the same number of points (no rank advantage). |

Verify `SynergyEvent` rows now have `rankAtAward: null` for fresh submissions.

**Referral synergy**
| Scenario | Expected |
|---|---|
| New user registers with a valid referral code | Referrer's `synergyPoints` increases by exactly 3. A `SynergyEvent` row of `type: "REFERRAL"` appears with `points: 3`, `reason` containing both the referralId and referredUserId. |
| Registration without a referral code | No synergy event, no balance change. |
| Registration with an invalid / unknown referral code | (Whatever existing behavior is — likely the `referrerId` is null and the block is skipped; no synergy change.) |
| Same referee tries to register twice with the same email | First call awards +3. Second call fails the `Referral.referredId @unique` constraint and the whole inner transaction rolls back — no double award. |
| Referrer has no `StudentProfile` yet | `updateMany` is a no-op; the `SynergyEvent` row is still created as audit. No throw. |
| Referee later finishes Day 7 (existing rewardGiven flip in `submit-day.ts`) | `rewardGiven` flips to `true`. No additional synergy is awarded (we only fire on signup). |

**SynergyChip UI**
| Step | Expected |
|---|---|
| Open the SynergyChip dialog on any logged-in page | 4 tiles in the 2×2 "How you earn" grid: Refer a friend, Attach your GitHub, Share on LinkedIn, Show up for the community. |
| "Refer a friend" tile copy | Includes `+3 synergy` (interpolated from `SYNERGY_REFERRAL`). |
| Inspect — no `Clock` icon, no "Finish early" copy | Confirmed via DOM and source grep. |
| Other tiles' icons and copy | Unchanged. |
| Chip button + dialog hero | Still show `Sparkles` (plan 005 may swap to `Flame` separately — out of scope here). |

### Files that should have changed
- `src/features/synergy/scoring.ts`
- `src/features/synergy/award-submission-synergy.ts`
- `src/features/synergy/award-referral-synergy.ts` (new)
- `src/features/registration/complete-registration.ts`
- `src/features/submission/submit-day.ts` (call-site cleanup only)
- `src/components/shared/synergy-chip.tsx`

Nothing else. If `git diff --name-only` shows changes to `prisma/`, the heatmap, the leaderboard, the public profile, or admin views, STOP and review.

## 9. Commit message

```
feat(synergy): flat submission scoring + 3-point referral bonus

Submission synergy no longer depends on submission time. Drop rankBonus
entirely; each submission now scores base (5) + github (5) + linkedin (5).
Backfilled days, late submissions, and on-time submissions all score
identically. Existing balances and SynergyEvent history are not touched.

New: referrer gets +3 synergy the moment a referee completes registration
with their referral code. Awarded atomically alongside the Referral row
create — idempotent via the existing Referral.referredId @unique. Tracked
as a SynergyEvent of type "REFERRAL".

UI: SynergyChip dialog drops the "Finish early" tile and adds a "Refer a
friend" tile that surfaces the +3.

No schema change.
```
