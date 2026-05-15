import type { Domain } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ValidateGithubResult } from "@/features/submission/validate-github-url";
import {
  normalizeGithubUrl,
  validateGithubUrl,
} from "@/features/submission/validate-github-url";

const CLAUDE_ARTIFACT =
  /^https:\/\/claude\.ai\/(share|chat|artifact|public\/artifacts)\/[a-zA-Z0-9_-]+/;

/**
 * GitHub repo URLs for SE/DS/AI (unchanged). Claude artifact / public URLs for CLAUDE.
 * Claude URLs skip HEAD checks (often auth-gated); duplicate detection still applies.
 */
export async function validateSubmissionUrl(
  url: string,
  domain: Domain,
  currentUserId: string,
  allowSlot?: { enrollmentId: string; dayNumber: number },
): Promise<ValidateGithubResult> {
  if (domain === "CLAUDE") {
    return validateClaudeArtifactUrl(url, currentUserId, allowSlot);
  }
  return validateGithubUrl(url, currentUserId, allowSlot);
}

async function validateClaudeArtifactUrl(
  url: string,
  _currentUserId: string,
  allowSlot?: { enrollmentId: string; dayNumber: number },
): Promise<ValidateGithubResult> {
  const trimmed = url.trim();
  if (!CLAUDE_ARTIFACT.test(trimmed)) {
    return {
      ok: false,
      reason: "invalid_format",
      message:
        "Must be a Claude artifact URL (e.g., https://claude.ai/share/...)",
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

  return { ok: true };
}
