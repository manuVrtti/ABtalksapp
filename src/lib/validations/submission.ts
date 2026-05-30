import type { Domain } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ValidateGithubResult } from "@/features/submission/validate-github-url";
import {
  normalizeGithubUrl,
  validateGithubUrl,
} from "@/features/submission/validate-github-url";

const GITHUB_COMMIT =
  /^https:\/\/github\.com\/[^/]+\/[^/]+\/commit\/[a-f0-9]{7,40}(\/.*)?$/i;

/**
 * GitHub repo URLs for SE/DS/AI (unchanged). GitHub commit URLs for CLAUDE.
 */
export async function validateSubmissionUrl(
  url: string,
  domain: Domain,
  currentUserId: string,
  allowSlot?: { enrollmentId: string; dayNumber: number },
): Promise<ValidateGithubResult> {
  if (domain === "CLAUDE") {
    return validateClaudeCommitUrl(url, currentUserId, allowSlot);
  }
  return validateGithubUrl(url, currentUserId, allowSlot);
}

async function validateClaudeCommitUrl(
  url: string,
  _currentUserId: string,
  allowSlot?: { enrollmentId: string; dayNumber: number },
): Promise<ValidateGithubResult> {
  const trimmed = url.trim();
  if (!GITHUB_COMMIT.test(trimmed)) {
    return {
      ok: false,
      reason: "invalid_format",
      message:
        "Submit a GitHub commit URL — must look like https://github.com/your-username/your-repo/commit/abc123... (any repo name works, but it must be a specific commit URL, not just the repo)",
    };
  }

  const normalized = normalizeGithubUrl(trimmed);

  if (allowSlot) {
    const existing = await prisma.submission.findFirst({
      where: {
        enrollmentId: allowSlot.enrollmentId,
        githubUrl: normalized,
        dayNumber: { not: allowSlot.dayNumber },
      },
      select: { dayNumber: true },
    });

    if (existing) {
      return {
        ok: false,
        reason: "duplicate",
        message: `This commit URL was already submitted for Day ${existing.dayNumber}. Push a new commit for this day.`,
      };
    }
  }

  return { ok: true };
}
