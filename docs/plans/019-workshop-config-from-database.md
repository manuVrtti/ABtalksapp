# 019 — Workshop config (Zoom link, WhatsApp link, date, time) from Supabase instead of env vars

## 1. Goal
Move `ZOOM_LINK`, `WHATSAPP_LINK`, `NEXT_PUBLIC_WHATSAPP_LINK`, `WEBINAR_DATE`, `WEBINAR_TIME` out of
`.env.local` into a single-row Supabase table (`workshop_config`) so the workshop owner can update
the Zoom link / WhatsApp link / date / time from the Supabase dashboard without a code deploy. This
is feasible because the workshop already has its own isolated Supabase project
(`src/lib/workshop-supabase.ts`) — no new infra needed. Keeps `.env.local` limited to credentials
(Supabase URL/key, Brevo key, from-email/name).

## 2. Current behavior
- `src/components/workshop/CountdownTimer.tsx` — hardcodes the target timestamp as a JS constant
  (`WEBINAR_TARGET = new Date("2026-07-11T10:30:00Z")`), does NOT read `WEBINAR_DATE`/`WEBINAR_TIME`
  env vars at all today (those are currently dead for the timer, only used in the email).
- `src/lib/workshop-email.ts` — reads `process.env.ZOOM_LINK`, `WHATSAPP_LINK`, `WEBINAR_DATE`,
  `WEBINAR_TIME` directly inside `sendWorkshopConfirmationEmail`, falls back to `"#"`/`"TBA"`.
- `src/components/workshop/RegistrationForm.tsx` — reads `process.env.NEXT_PUBLIC_WHATSAPP_LINK`
  client-side to build the post-success redirect URL.
- `src/app/api/ai-workshop/register/route.ts` — calls `sendWorkshopConfirmationEmail(name, email)`,
  no config passed through.
- No `workshop_config` table exists in the workshop Supabase project yet.

## 3. Files to touch
- `[new]` SQL to run manually in the Supabase SQL editor (see §7) — creates `workshop_config` table.
- `[edit]` `src/lib/workshop-supabase.ts` — add a `getWorkshopConfig()` helper that fetches the
  single config row (server-only, cached per request).
- `[edit]` `src/lib/workshop-email.ts` — accept `zoomLink`, `whatsappLink`, `webinarDate`,
  `webinarTime` as parameters instead of reading `process.env` directly.
- `[edit]` `src/app/api/ai-workshop/register/route.ts` — call `getWorkshopConfig()`, pass the
  fields into `sendWorkshopConfirmationEmail(...)`.
- `[edit]` `src/app/ai-workshop/page.tsx` — fetch `getWorkshopConfig()` server-side (this is already
  a Server Component entry), pass `webinarTargetUtc` down to `CountdownTimer` and `whatsappLink`
  down to `RegistrationForm` as props.
- `[edit]` `src/components/workshop/CountdownTimer.tsx` — remove the hardcoded `WEBINAR_TARGET`
  constant, accept `targetUtc: string` prop instead, parse it client-side.
- `[edit]` `src/components/workshop/RegistrationForm.tsx` — remove `process.env.NEXT_PUBLIC_WHATSAPP_LINK`
  read, accept `whatsappLink: string` prop instead, used for the post-success redirect.
- `[edit]` `.env.local` — after the above is verified working, remove `ZOOM_LINK`, `WHATSAPP_LINK`,
  `NEXT_PUBLIC_WHATSAPP_LINK`, `WEBINAR_DATE`, `WEBINAR_TIME`. Keep everything else.
- `[edit]` `docs/project-context.md` — update the "Env vars added to `.env.local`" line for the
  workshop to reflect the smaller list, and note the new `workshop_config` Supabase table.

## 4. Server vs Client
- `src/app/ai-workshop/page.tsx` — Server Component. Does the Supabase fetch, passes plain
  string/number props down (no functions/icons/class instances — `targetUtc` as ISO string,
  `whatsappLink` as plain string, both safe to cross the Server→Client boundary).
- `CountdownTimer.tsx` — Client Component (`"use client"`, unchanged), now takes `targetUtc: string`.
- `RegistrationForm.tsx` — Client Component (`"use client"`, unchanged), now takes
  `whatsappLink: string`, with the existing hardcoded WhatsApp URL as fallback if the prop is empty
  (covers Supabase fetch failure gracefully rather than crashing registration).
- `workshop-email.ts` and the register route handler — server-only, untouched server/client split.

## 5. Steps
1. Run the SQL in §7 in the Supabase SQL editor (workshop project) to create `workshop_config` and
   insert the single row with current values (Zoom link, WhatsApp link, "July 11, 2026", "4:00 PM IST",
   webinar target `2026-07-11T10:30:00Z`).
2. In `src/lib/workshop-supabase.ts`, add:
   ```ts
   export interface WorkshopConfig {
     zoomLink: string;
     whatsappLink: string;
     webinarDate: string;
     webinarTime: string;
     webinarTargetUtc: string;
   }

   export async function getWorkshopConfig(): Promise<WorkshopConfig> {
     const { data, error } = await workshopSupabase
       .from("workshop_config")
       .select("zoom_link, whatsapp_link, webinar_date, webinar_time, webinar_target_utc")
       .single();
     if (error || !data) {
       return {
         zoomLink: "#",
         whatsappLink: "https://chat.whatsapp.com/LDUvHRIlb5dGHpDJLueR9i?s=cl&p=a&mlu=0&amv=0",
         webinarDate: "TBA",
         webinarTime: "TBA",
         webinarTargetUtc: "2026-07-11T10:30:00Z",
       };
     }
     return {
       zoomLink: data.zoom_link,
       whatsappLink: data.whatsapp_link,
       webinarDate: data.webinar_date,
       webinarTime: data.webinar_time,
       webinarTargetUtc: data.webinar_target_utc,
     };
   }
   ```
   (Hardcoded fallback values match what's in `.env.local` today — keeps registration working even
   if the Supabase read fails, same spirit as today's `"#"`/`"TBA"` fallbacks.)
3. In `workshop-email.ts`, change `sendWorkshopConfirmationEmail` signature to:
   ```ts
   export async function sendWorkshopConfirmationEmail(
     name: string,
     email: string,
     config: { zoomLink: string; whatsappLink: string; webinarDate: string; webinarTime: string }
   ): Promise<void>
   ```
   Remove the four `process.env.*` reads inside the function; use `config.zoomLink` etc in the template.
4. In `route.ts`, before calling the email function:
   ```ts
   const config = await getWorkshopConfig();
   ...
   await sendWorkshopConfirmationEmail(name, email, config);
   ```
5. In `page.tsx`, fetch config once at the top (Server Component, can `await getWorkshopConfig()`
   directly in the component body) and pass `targetUtc={config.webinarTargetUtc}` to
   `<CountdownTimer />` and `whatsappLink={config.whatsappLink}` to `<RegistrationForm />`.
6. In `CountdownTimer.tsx`, replace the module-level `WEBINAR_TARGET` constant with a prop:
   ```ts
   export default function CountdownTimer({ targetUtc }: { targetUtc: string }) {
     ...
     const target = new Date(targetUtc).getTime();
     // use `target` instead of WEBINAR_TARGET in the tick() closure
   ```
7. In `RegistrationForm.tsx`, add `whatsappLink` to props (`RegistrationForm({ whatsappLink }: { whatsappLink: string })`),
   replace the `process.env.NEXT_PUBLIC_WHATSAPP_LINK` line in the success-redirect `setInterval`
   callback with the prop value (keep the existing literal URL as the `||` fallback).
8. Manually verify registration end-to-end (see §8), then remove the five now-unused vars from
   `.env.local`, leaving Supabase URL/key, Brevo key, from-email/name only.
9. Update `docs/project-context.md`'s workshop env-var list and add a line documenting the new
   `workshop_config` Supabase table as the source of truth for Zoom link / WhatsApp link / date / time.

## 6. Guardrails for Cursor (DO NOT)
- Do NOT add a generic "config" abstraction layer — one typed function (`getWorkshopConfig`) in the
  existing `workshop-supabase.ts` file is enough; no new `src/lib/workshop-config.ts` file.
- Do NOT make `CountdownTimer` or `RegistrationForm` fetch Supabase themselves — they are Client
  Components; all Supabase reads stay server-side in `page.tsx` / the route handler, passed down as
  plain-string props only.
- Do NOT remove the in-code fallback values in `getWorkshopConfig()` — registration must keep
  working even if the `workshop_config` row is missing or the fetch errors.
- Do NOT touch `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `BREVO_API_KEY`,
  `FROM_EMAIL`, `FROM_NAME` — those stay as env vars (real secrets/credentials, not content).
- This is the isolated workshop Supabase project, not the main Neon/Prisma DB — §7's SQL is run
  manually by the user in the Supabase SQL editor, not via Prisma migrate.
- Keep this entirely on the `ai-workshop` branch; do not touch `master`.

## 7. DB safety (Supabase, not Neon/Prisma — manual step, run by user)
This is a new table in the **workshop's own Supabase project** (separate from the main Neon DB), so
no Prisma migration applies. Run this once in the Supabase SQL editor for that project:

```sql
create table workshop_config (
  id int primary key default 1,
  zoom_link text not null,
  whatsapp_link text not null,
  webinar_date text not null,
  webinar_time text not null,
  webinar_target_utc timestamptz not null,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into workshop_config (id, zoom_link, whatsapp_link, webinar_date, webinar_time, webinar_target_utc)
values (
  1,
  'https://zoom.us/j/1234567890',
  'https://chat.whatsapp.com/LDUvHRIlb5dGHpDJLueR9i?s=cl&p=a&mlu=0&amv=0',
  'July 11, 2026',
  '4:00 PM IST',
  '2026-07-11T10:30:00Z'
);
```
To update later (e.g. new Zoom link), the owner just runs:
```sql
update workshop_config set zoom_link = '<new link>', updated_at = now() where id = 1;
```
No redeploy needed — `page.tsx` and the register route fetch fresh on every request (no caching).

## 8. Verification
- `npm run build` and `npx tsc --noEmit` must pass.
- Manually load `/ai-workshop`: countdown timer shows the correct days/hours/min/sec counting down
  to the Supabase-stored `webinar_target_utc`.
- Submit the registration form: confirm the success modal redirects to the Supabase-stored
  WhatsApp link after 3s.
- Check the received confirmation email: Zoom link, date, and time match the `workshop_config` row,
  not the old env values.
- Update the Zoom link via SQL (`update workshop_config set zoom_link = ... where id = 1`), register
  a second test email, confirm the new link appears in that email with no code change or redeploy.
- Files expected to have changed: `src/lib/workshop-supabase.ts`, `src/lib/workshop-email.ts`,
  `src/app/api/ai-workshop/register/route.ts`, `src/app/ai-workshop/page.tsx`,
  `src/components/workshop/CountdownTimer.tsx`, `src/components/workshop/RegistrationForm.tsx`,
  `.env.local` (vars removed), `docs/project-context.md`.

## 9. Commit message
```
feat(ai-workshop): move Zoom link, WhatsApp link, date, and time to Supabase config table

Lets the workshop owner update Zoom link / WhatsApp link / date / time from
Supabase directly instead of editing env vars and redeploying.
```
