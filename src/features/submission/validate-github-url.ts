import { prisma } from "@/lib/db";

const GITHUB_REPO =
  /^https:\/\/github\.com\/[\w-]+\/[\w.-]+(\/.*)?$/;

export type ValidateGithubResult =
  | { ok: true }
  | { ok: false; reason: "invalid_format"; message: string }
  | { ok: false; reason: "duplicate"; message: string }
  | { ok: false; reason: "unreachable"; message: string };

export function normalizeGithubUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/**
 * @param allowSlot When re-using the same GitHub URL for an upsert on this
 *   enrollment+day, exclude that row from duplicate detection.
 */
export async function validateGithubUrl(
  url: string,
  _currentUserId: string,
  allowSlot?: { enrollmentId: string; dayNumber: number },
): Promise<ValidateGithubResult> {
  const trimmed = url.trim();
  if (!GITHUB_REPO.test(trimmed)) {
    return {
      ok: false,
      reason: "invalid_format",
      message: "Must be a valid GitHub repo URL",
    };
  }

  const normalized = normalizeGithubUrl(trimmed);

  const rows = await prisma.submission.findMany({
    where: { githubUrl: normalized },
    select: {
      userId: true,
      enrollmentId: true,
      dayNumber: true,
    },
  });

  const blocking = rows.filter(
    (r) =>
      !allowSlot ||
      r.enrollmentId !== allowSlot.enrollmentId ||
      r.dayNumber !== allowSlot.dayNumber,
  );

  if (blocking.length > 0) {
    return {
      ok: false,
      reason: "duplicate",
      message: "This URL has been submitted by another student",
    };
  }

  try {
    const res = await fetch(normalized, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });
    if (res.status < 200 || res.status >= 400) {
      return {
        ok: false,
        reason: "unreachable",
        message: "URL did not return a valid response",
      };
    }
  } catch {
    return {
      ok: false,
      reason: "unreachable",
      message: "URL did not return a valid response",
    };
  }

  return { ok: true };
}
