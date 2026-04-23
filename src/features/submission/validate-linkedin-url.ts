const LINKEDIN_POST =
  /^https:\/\/(www\.)?linkedin\.com\/(posts|feed\/update)\/.+/;

export type ValidateLinkedinResult =
  | { ok: true }
  | { ok: false; reason: "invalid_format"; message: string };

export function validateLinkedinUrl(url: string): ValidateLinkedinResult {
  const trimmed = url.trim();
  if (!LINKEDIN_POST.test(trimmed)) {
    return {
      ok: false,
      reason: "invalid_format",
      message: "Must be a valid LinkedIn post URL",
    };
  }
  return { ok: true };
}
