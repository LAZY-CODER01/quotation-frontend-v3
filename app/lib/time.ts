// Utilities for working with UAE time (Asia/Dubai) in the frontend
// Handles:
// - Naive DB strings like "2026-02-09 18:34:01.721643"
// - ISO strings with or without timezone
// and always formats/display in UAE local time.

const UAE_TZ = "Asia/Dubai";
const UAE_OFFSET_MINUTES = 4 * 60;

// Internal: parse a naive "local UAE" timestamp string to a Date
function parseNaiveUaeTimestamp(value: string): Date | null {
  const trimmed = value.trim();

  // Match: YYYY-MM-DD[ T]HH:MM:SS[.fraction]
  const match =
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?/.exec(
      trimmed
    );
  if (!match) return null;

  const [, y, m, d, hh, mm, ss, frac] = match;
  const year = Number(y);
  const monthIndex = Number(m) - 1; // JS months 0-11
  const day = Number(d);
  const hour = Number(hh);
  const minute = Number(mm);
  const second = Number(ss);

  let ms = 0;
  if (frac) {
    // Convert fractional seconds to milliseconds (truncate to 3 digits)
    const fracMs = frac.slice(0, 3);
    ms = Number(fracMs.padEnd(3, "0"));
  }

  // The string represents local UAE wall-clock time.
  // Compute UTC millis such that when interpreted in UAE time it shows the same wall-clock.
  const utcMs =
    Date.UTC(year, monthIndex, day, hour, minute, second, ms) -
    UAE_OFFSET_MINUTES * 60 * 1000;
  return new Date(utcMs);
}

// Convert various backend values into a Date representing the correct instant.
// - If value has an explicit timezone (Z or +HH:MM), we trust it.
// - If value is naive (no timezone), we treat it as UAE local time.
export function toUaeDate(
  value: string | Date | null | undefined
): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  const str = value.trim();

  // If string already has explicit timezone info, rely on native Date parsing.
  if (/[zZ]|[+\-]\d{2}:?\d{2}$/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  // Try to parse as a naive UAE local timestamp first
  const naive = parseNaiveUaeTimestamp(str);
  if (naive) return naive;

  // Fallback to native parsing (last resort)
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

// Format a value in UAE time using Intl.DateTimeFormat.
// Returns "Invalid Date" on failure.
export function formatUae(
  value: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions
): string {
  const date = toUaeDate(value as any);
  if (!date) return "Invalid Date";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: UAE_TZ,
    ...options,
  }).format(date);
}

// Common patterns ------------------------------------------------------------

export function formatUaeDateTime(value: string | Date | null | undefined) {
  // Example: "09 Feb 2026, 6:34 PM"
  return formatUae(value, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatUaeTime(value: string | Date | null | undefined) {
  // Example: "6:34 PM"
  return formatUae(value, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Stable YYYY-MM-DD key in UAE time (for grouping/sorting by day)
export function getUaeDayKey(value: string | Date | null | undefined): string {
  const date = toUaeDate(value as any);
  if (!date) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: UAE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

// Friendly label like "Today", "Yesterday", or "09 Feb 2026" in UAE time
export function getUaeFriendlyDayLabel(
  value: string | Date | null | undefined
): string {
  const date = toUaeDate(value as any);
  if (!date) return "";

  const now = new Date();

  const todayKey = getUaeDayKey(now);
  const dateKey = getUaeDayKey(date);

  // Compute "yesterday" key relative to today in UAE
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayKey = getUaeDayKey(yesterday);

  if (dateKey === todayKey) return "Today";
  if (dateKey === yesterdayKey) return "Yesterday";

  return formatUae(date, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

