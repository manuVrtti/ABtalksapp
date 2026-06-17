# 015 — Welcome email on registration (Resend + abtalks.in)

> New feature. No schema. Adds one dependency (`resend`) + one env var
> (`RESEND_API_KEY`). Branch: `git checkout -b feature/welcome-email`.
>
> Decisions locked: provider **Resend** (free tier; best fit for Next.js on
> Vercel); fire the email **when the user completes registration** (joins a
> challenge); domain **abtalks.in** with DNS managed in **Vercel**; send
> **from `ABTalks <team@abtalks.in>`**, reply-to `team@abtalks.in`.

## 1. Goal
Send a branded welcome email from `team@abtalks.in` to every user the moment
they finish registration (profile + enrollment created), without blocking or
risking the registration flow.

## 2. Context / current behavior
- Registration: `/register` form → `completeRegistrationAction(formData)`
  (`src/app/actions/registration-actions.ts`) → `completeRegistration(userId,
  payload)` (`src/features/registration/complete-registration.ts`), which
  creates the `StudentProfile` + `Enrollment` in a transaction and returns
  `{ ok: true, profileId } | { ok: false, … }`.
- The action has `session.user.email` and parses `fullName` + the `domain`
  (track) from the form — everything a personalized email needs.
- **No email infrastructure exists** (no `resend`/`nodemailer` dep, no
  `lib/email`). Email was listed as Phase-2 in `docs/project-context.md`.
- Runtime: the registration action runs in the Node serverless runtime (not
  edge), so the Resend SDK is fine there. It must NOT be imported into
  `middleware.ts` / the edge path.
- Next.js 16.2.4 ships stable `after()` (`next/server`) for running work after
  the response is sent — the right tool for fire-and-forget email on Vercel
  (a non-awaited promise can be killed when the function returns; `after`
  keeps the invocation alive).

## 3. Files to touch

**New files**
- `src/lib/email.ts` `[new]` — server-only Resend wrapper: `sendEmail({ to,
  subject, html, text })`. Graceful no-op when `RESEND_API_KEY` is unset
  (local dev) so registration never breaks.
- `src/features/email/welcome-email.ts` `[new]` — pure builder returning
  `{ subject, html, text }` for the welcome email (no React, inline-styled HTML).

**Edited files**
- `src/app/actions/registration-actions.ts` `[edit]` — after a successful
  `completeRegistration`, schedule the welcome email via `after()`.
- `package.json` `[edit]` — add the `resend` dependency (Cursor runs
  `npm install resend`).

**Not touched**
- `complete-registration.ts` — keep it pure; the email is sent from the action
  (it has the session email + parsed fields). No change there.
- `middleware.ts` / `auth.config.ts` — do NOT import `lib/email` into the edge
  path.
- Schema — none.

## 4. Server vs Client
- `lib/email.ts` — **Server-only** (`import "server-only"` at top). Reads
  `RESEND_API_KEY`; instantiates the Resend SDK. Never imported by client code.
- `welcome-email.ts` — **Server** util (pure function; returns strings).
- `registration-actions.ts` — **Server Action** (`"use server"`). No
  Server→Client prop changes; the email runs in `after()` post-response.

## 5. Step-by-step changes

### 5.1 `src/lib/email.ts` (new)
```ts
import "server-only";
import { Resend } from "resend";
import { logger } from "@/lib/logger";

const FROM = "ABTalks <team@abtalks.in>";
const REPLY_TO = "team@abtalks.in";

export type SendEmailResult =
  | { ok: true }
  | { ok: false; skipped?: boolean };

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn("[email] RESEND_API_KEY missing — skipping send");
    return { ok: false, skipped: true };
  }
  // Never email seed/test accounts (avoid bounces hurting domain reputation).
  if (opts.to.toLowerCase().endsWith("@abtalks.dev")) {
    logger.info("[email] skipping test address");
    return { ok: false, skipped: true };
  }
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      replyTo: REPLY_TO,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    if (error) {
      logger.error("[email] send failed", { message: error.message });
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    logger.error("[email] send threw", { error: String(e) });
    return { ok: false };
  }
}
```
- Use the project `logger`, never `console.*`.
- The `@abtalks.dev` guard keeps the 10 seeded test users from triggering real
  sends/bounces.

### 5.2 `src/features/email/welcome-email.ts` (new)
- Pure function:
  ```ts
  export function welcomeEmail(input: {
    fullName: string;
    domain: "SE" | "DS" | "AI" | "CLAUDE";
    appUrl: string;
  }): { subject: string; html: string; text: string }
  ```
- Map `domain` to a friendly track name (Software Engineering / Data Science /
  Artificial Intelligence / Claude AI Mastery).
- `subject`: e.g. `"Welcome to ABTalks — your 60-day journey starts now 🚀"`.
- `html`: a **single-column, inline-styled** HTML email (email clients ignore
  external CSS / Tailwind classes — use `style="…"` attributes only). Include:
  - ABTalks wordmark/heading (indigo `#4F46E5` accent).
  - A short greeting using `fullName` and the track name.
  - 2–3 lines on what to do next: open the dashboard, complete Day 1, post your
    proof of work, build your streak.
  - A primary CTA button (`<a>` styled as a button) → `${appUrl}/dashboard`.
  - A footer: "You're receiving this because you registered at ABTalks." +
    `team@abtalks.in`. Keep it simple and mobile-friendly (max-width ~600px).
- `text`: a plain-text fallback mirroring the HTML (deliverability + clients
  that block HTML). Always provide both.
- No external images that could break; keep it text + styled blocks. (A hosted
  logo image is optional later.)

### 5.3 `src/app/actions/registration-actions.ts` (edit)
- Import `after` from `next/server`, `sendEmail` from `@/lib/email`,
  `welcomeEmail` from `@/features/email/welcome-email`.
- After computing `result = await completeRegistration(...)`, on success
  schedule the email post-response:
  ```ts
  if (result.ok && session.user.email) {
    const to = session.user.email;
    after(async () => {
      const { subject, html, text } = welcomeEmail({
        fullName,                       // already parsed in this action
        domain: payload.domain,         // from the validated payload
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://abtalksapp.vercel.app",
      });
      await sendEmail({ to, subject, html, text });
    });
  }
  return result;
  ```
- The email is **fire-and-forget**: its success/failure never changes
  `result`. If `RESEND_API_KEY` is missing or the send fails, registration still
  succeeds (the wrapper swallows + logs).
- Use the exact variable names already present in the action for `fullName`
  and the validated `payload`/`domain` (adapt to the file's local names).

### 5.4 `package.json` (edit)
- Add `resend` to dependencies (`npm install resend`). No other config changes.

## 6. Guardrails for Cursor (DO NOT)
- DO NOT block or fail registration on the email. Use `after()` (post-response),
  fire-and-forget; never gate the `{ ok: true }` result on the send.
- DO NOT import `@/lib/email` (or `resend`) into `middleware.ts`,
  `auth.config.ts`, or anything in the edge path — it's Node-only and would
  blow the edge bundle. Keep `import "server-only"` at the top of `lib/email.ts`.
- DO NOT expose the key to the client: it's `RESEND_API_KEY` (NOT
  `NEXT_PUBLIC_*`), read only in `lib/email.ts`.
- DO NOT send to `@abtalks.dev` seed addresses (guard in `sendEmail`).
- DO NOT style the email with Tailwind classes or external CSS — inline
  `style="…"` only; always include a plain-text part.
- DO NOT use `console.*` — log via `lib/logger.ts`.
- DO NOT hardcode the production URL in the email body — use
  `NEXT_PUBLIC_APP_URL` with a sensible fallback.
- DO NOT change `complete-registration.ts`, the schema, or the registration
  result shape.
- DO NOT add React Email or other email-templating deps — a plain inline-HTML
  string is enough for one transactional email.

## 7. External setup (operational — YOU do this, not Cursor)
This is required for real sends; the code degrades gracefully without it.

**A. Resend account + verify the domain**
1. Create an account at resend.com.
2. **Domains → Add Domain →** `abtalks.in`. Resend shows a set of DNS records
   (a DKIM `TXT`, an SPF `TXT` and an `MX` on a `send.abtalks.in` subdomain,
   and optionally a DMARC `TXT`). Copy the **exact** Type/Name/Value it shows —
   they're account-specific.

**B. Add those records in Vercel DNS** (your DNS is on Vercel)
3. Vercel dashboard → the project (or Account) that owns the domain →
   **Domains → abtalks.in → DNS Records** → add each record from Resend exactly
   (Type, Name/Host, Value, and Priority for the MX).
4. Because Resend uses the **`send.` subdomain** for SPF/MX, it does **not**
   touch the root MX that delivers mail to your `team@abtalks.in` mailbox — so
   receiving email keeps working unchanged.
5. Back in Resend, click **Verify** (propagation is usually minutes, up to ~1h).

**C. API key + Vercel env var**
6. Resend → **API Keys → Create** → copy it (shown once).
7. Vercel → Project → **Settings → Environment Variables** → add
   `RESEND_API_KEY` for **Production** (and Preview). Add the same line to your
   local `.env` for testing.
8. **Redeploy** so the env var is picked up.

**D. From address**
9. Once `abtalks.in` shows "Verified" in Resend you can send from any
   `@abtalks.in` address; this plan sends from `ABTalks <team@abtalks.in>`
   with reply-to `team@abtalks.in`. (Before verification, Resend only lets you
   send from `onboarding@resend.dev` to your own email — verify first.)

**E. DMARC (recommended)**
10. Add a `TXT` at `_dmarc.abtalks.in`:
    `v=DMARC1; p=none; rua=mailto:team@abtalks.in` (start in monitor mode;
    tighten to `quarantine`/`reject` later once SPF+DKIM pass consistently).

> Tip: after the first real send, open the received email → "Show original" /
> headers and confirm **SPF=pass** and **DKIM=pass** for abtalks.in. That's the
> deliverability check that keeps you out of spam.

## 8. DB safety
Not applicable — no schema or data change.

## 9. Verification
1. **Without the key (local):** unset `RESEND_API_KEY`, register a new user →
   registration succeeds; logs show "RESEND_API_KEY missing — skipping send".
   No crash, no delay.
2. **With the key + verified domain:** set `RESEND_API_KEY`, register using a
   **real inbox you control** (not `@abtalks.dev`) → within seconds an email
   arrives **from `team@abtalks.in`**, personalized with the name + track, with
   a working "Open dashboard" button. Check headers: SPF + DKIM pass; it lands
   in the inbox (not spam).
3. Register a seeded `@abtalks.dev` user → no email is sent (guard), logs note
   the skip.
4. The `after()` send does not delay the post-registration redirect.
5. **Build/typecheck:** `npm run lint`, `npm run build`, `tsc --noEmit` clean.
   `resend` resolves; `lib/email.ts` is not pulled into the edge/middleware
   bundle (watch the build's edge bundle report).

Files that should change (and only these): `src/lib/email.ts` (new),
`src/features/email/welcome-email.ts` (new),
`src/app/actions/registration-actions.ts`, `package.json` (+ lockfile).

## 10. Commit message
```
feat(email): send a welcome email on registration via Resend

Adds a server-only Resend wrapper (lib/email.ts) and a welcome-email template,
and fires a personalized welcome from team@abtalks.in via next/server after()
when a user completes registration. Fire-and-forget: never blocks or fails
registration; no-ops gracefully when RESEND_API_KEY is unset and skips
@abtalks.dev seed accounts. Requires RESEND_API_KEY and a verified abtalks.in
domain in Resend (DNS records added in Vercel).
```
