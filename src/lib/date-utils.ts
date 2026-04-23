import { differenceInCalendarDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const IST = "Asia/Kolkata";

function parseCalendarKeyToUtcDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Current moment formatted in IST (readable). */
export function getNowInIST(): string {
  return formatInTimeZone(new Date(), IST, "EEEE, d MMM yyyy, h:mm a zzz");
}

/**
 * Challenge day 1 = IST calendar day of `startedAt`.
 * Each subsequent IST calendar day increments by 1. Capped at 60, minimum 1.
 */
export function getCurrentDayNumber(startedAt: Date): number {
  const startKey = formatInTimeZone(startedAt, IST, "yyyy-MM-dd");
  const nowKey = formatInTimeZone(new Date(), IST, "yyyy-MM-dd");
  const diff = differenceInCalendarDays(
    parseCalendarKeyToUtcDate(nowKey),
    parseCalendarKeyToUtcDate(startKey),
  );
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
