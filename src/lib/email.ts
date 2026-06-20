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
  attachments?: { filename: string; content: Buffer }[];
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
      attachments: opts.attachments,
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
