/**
 * Server-side feature flags (read from process.env).
 * For client components, pass boolean props from a Server Component parent.
 */
export function isClaudeEnabled(): boolean {
  return process.env.ENABLE_CLAUDE_CHALLENGE === "true";
}

export function isDayLockBypassEnabled(): boolean {
  return process.env.BYPASS_DAY_LOCKS === "true";
}

export function isProgramEnabled(): boolean {
  return process.env.ENABLE_PROGRAM === "true";
}
