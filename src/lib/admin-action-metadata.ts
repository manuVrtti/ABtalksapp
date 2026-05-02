/** Parse `dayNumber` from admin action JSON metadata (e.g. REJECT_SUBMISSION). */
export function readDayNumberFromMetadata(metadata: unknown): number | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const value = (metadata as Record<string, unknown>).dayNumber;
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) ? parsed : null;
  }
  return null;
}
