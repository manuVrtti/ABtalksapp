# 040 — Remove MSG91 OTP (keep DB)

## 1. Goal
Strip MSG91/OTP verification from the running app (UI, actions, validations, registration gates, admin badges) so phone capture returns to the pre-OTP simple optional field. **Do not** migrate, drop, or alter the database. Leave orphaned-but-harmless schema fields in place.

## 2. Current behavior
Commit `fcac369` (merged via `dc5f271`) added MSG91 widget OTP: new files (`otp-actions`, `msg91`, `PhoneVerifyField`, nudge, etc.), split `countryCode`/`phoneNumber` on register, compulsory +91 verification via `PhoneVerification`, profile Verify dialog, dashboard nudge, admin Verified badge, plus schema:

- `StudentProfile.phoneVerified` / `phoneVerifiedAt`
- `PhoneVerification` model + `User.phoneVerification`
- Migration `prisma/migrations/20260720143000_add_phone_verified/migration.sql`

## 3. Files to touch

**Delete**
- `src/app/actions/otp-actions.ts` `[delete]`
- `src/lib/msg91.ts` `[delete]`
- `src/lib/validations/otp.ts` `[delete]`
- `src/components/shared/phone-verify-field.tsx` `[delete]`
- `src/components/dashboard/phone-verify-nudge.tsx` `[delete]`

**Edit**
- `src/lib/validations/phone.ts` `[edit]` — restore pre-OTP helpers only
- `src/lib/validations/register.ts` `[edit]` — restore `phone: optionalPhoneSchema`
- `src/lib/feature-flags.ts` `[edit]` — remove OTP bypass helpers
- `src/app/actions/registration-actions.ts` `[edit]` — parse `phone` from FormData
- `src/features/registration/complete-registration.ts` `[edit]` — optional phone; no OTP gate
- `src/app/register/registration-form.tsx` `[edit]` — Client: plain phone input
- `src/app/profile/profile-form.tsx` `[edit]` — Client: plain phone; no Verify dialog
- `src/app/profile/page.tsx` `[edit]` — Server: stop passing `phoneVerified`
- `src/app/dashboard/page.tsx` `[edit]` — Server: remove nudge
- `src/app/admin/students/[id]/page.tsx` `[edit]` — Server: remove verified badges
- `src/features/dashboard/get-dashboard-data.ts` `[edit]` — drop phone/phoneVerified
- `src/features/profile/get-profile.ts` `[edit]` — drop `phoneVerified`
- `src/features/user/get-user-with-profile.ts` `[edit]` — drop phone/phoneVerified selects
- `docs/CHANGELOG.md` `[edit]` — pending reconcile line
- `docs/plans/040-remove-msg91-otp.md` `[new]` — this plan

**Do not touch**
- `prisma/schema.prisma` OTP fields / `PhoneVerification`
- `prisma/migrations/20260720143000_add_phone_verified/`
- `.env` / `.env.local`
- `docs/plans/039-otp-phone-verification-msg91.md`

## 4. Server vs Client
- Server: dashboard/profile/admin pages, getters, `complete-registration`, `registration-actions`; delete `otp-actions` / `msg91`.
- Client: `registration-form`, `profile-form`; delete `phone-verify-field`, `phone-verify-nudge`.
- Remove `phoneVerified` prop to `ProfileForm` / nudge (no new Server→Client props).

## 5. Steps
1. Delete the five OTP-only source files.
2. Revert phone validations + register schema + feature-flags OTP helpers to `fcac369^`.
3. Revert registration action + `completeRegistration` phone path.
4. Restore register/profile UI; remove dashboard nudge and admin badges.
5. Strip `phoneVerified` (and nudge-only `phone`) from getters.
6. Grep under `src/` must be clean of OTP/MSG91 symbols.
7. Append CHANGELOG line; write this plan file.
8. `npx tsc --noEmit` / `npm run build` must pass. Do not migrate.

## 6. Guardrails for Cursor (DO NOT)
- DO NOT create or run any Prisma migration, `db push`, or SQL that drops/alters columns/tables.
- DO NOT edit `phoneVerified` / `phoneVerifiedAt` / `PhoneVerification` / `User.phoneVerification` in `prisma/schema.prisma`.
- DO NOT delete the existing migration folder `20260720143000_add_phone_verified`.
- DO NOT add new abstraction files; only delete OTP files and edit listed paths.
- DO NOT put OTP/MSG91 back behind a feature flag — full removal from app code.
- DO NOT touch `middleware.ts` or edge auth paths.
- DO NOT edit `CLAUDE.md` or `docs/project-context.md`.

## 7. DB safety
No schema/data migration. Existing columns/table remain; app ignores them.

## 8. Verification
- Manual: `/register` single phone field; `/profile` no Verify; `/dashboard` no nudge; admin phone text only.
- `rg` under `src/` clean of MSG91/OTP symbols.
- `npx tsc --noEmit` and production build succeed.
- `git diff prisma/` empty.

## 9. Commit message
```
revert(otp): remove MSG91 phone OTP from app; keep DB columns

Strip OTP UI/actions/validations and restore optional phone capture.
Leave StudentProfile.phoneVerified* and PhoneVerification in schema/DB unused.
```
