import { addDays, differenceInCalendarDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const IST = "Asia/Kolkata";

/** Parse an IST calendar key `yyyy-MM-dd` to a UTC Date at that civil date. */
export function parseCalendarKeyToUtcDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Current moment formatted in IST (readable). */
export function getNowInIST(): string {
  return formatInTimeZone(new Date(), IST, "EEEE, d MMM yyyy, h:mm a zzz");
}

type EnrollmentDayAnchor = { startedAt: Date };
type ChallengeSyncStart = { startsAt?: Date | null };

function referenceStartDate(
  startedAt: Date,
  challenge?: ChallengeSyncStart,
): Date {
  return challenge?.startsAt != null ? challenge.startsAt : startedAt;
}

/**
 * Challenge day 1 = IST calendar day of the reference start
 * (`challenge.startsAt` when set, otherwise `enrollment.startedAt`).
 * Each subsequent IST calendar day increments by 1. Capped at 60.
 * Before a synchronized `startsAt` (IST), returns 0 so callers treat all days as locked.
 */
/** IST calendar date string for challenge day `dayNumber` (1 = first IST day of the reference start). */
export function getIstDateKeyForChallengeDay(
  enrollment: EnrollmentDayAnchor | Date,
  dayNumber: number,
  challenge?: ChallengeSyncStart,
): string {
  const startedAt =
    enrollment instanceof Date ? enrollment : enrollment.startedAt;
  const ref = referenceStartDate(startedAt, challenge);
  const startKey = formatInTimeZone(ref, IST, "yyyy-MM-dd");
  const base = parseCalendarKeyToUtcDate(startKey);
  const dayDate = addDays(base, dayNumber - 1);
  return formatInTimeZone(dayDate, IST, "yyyy-MM-dd");
}

export function getCurrentDayNumber(
  enrollment: EnrollmentDayAnchor | Date,
  challenge?: ChallengeSyncStart,
): number {
  const startedAt =
    enrollment instanceof Date ? enrollment : enrollment.startedAt;
  const ref = referenceStartDate(startedAt, challenge);
  const startKey = formatInTimeZone(ref, IST, "yyyy-MM-dd");
  const nowKey = formatInTimeZone(new Date(), IST, "yyyy-MM-dd");
  const startUtc = parseCalendarKeyToUtcDate(startKey);
  const nowUtc = parseCalendarKeyToUtcDate(nowKey);

  if (challenge?.startsAt != null && nowUtc < startUtc) {
    return 0;
  }

  const diff = differenceInCalendarDays(nowUtc, startUtc);
  const day = diff + 1;
  return Math.min(60, Math.max(1, day));
}

/** e.g. "15 Mar 2026" in IST */
export function formatDateIST(date: Date): string {
  return formatInTimeZone(date, IST, "d MMM yyyy");
}

export function formatDateTimeIST(date: Date): string {
  return formatInTimeZone(date, IST, "d MMM yyyy, h:mm a");
}

export { IST };
