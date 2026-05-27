/**
 * formatReportTime
 *
 * Converts an ISO 8601 UTC timestamp from a ReportEntry into a human-readable
 * string, displayed in the **user's local timezone** as detected by the browser.
 *
 * Detection strategy (with graceful fallback):
 *   1. `Intl.DateTimeFormat().resolvedOptions().timeZone` — available in all
 *      modern browsers and Node ≥ 13. Returns an IANA timezone string such as
 *      "America/New_York" or "Europe/London".
 *   2. Falls back to "UTC" if the API is unavailable or returns an empty string.
 *
 * The formatter is created once at module load time for performance. Because
 * this module runs exclusively in the browser (it is only called from Client
 * Components), the detected timezone is stable for the lifetime of the page.
 *
 * Expected output example: "15. 2. 2017, 11:30:00"
 *
 * @param isoString - An ISO 8601 date-time string, e.g. "2016-06-15T10:50:00Z".
 * @returns         - A locale-formatted string, or a fallback "—" for invalid input.
 */

/** Detect the user's IANA timezone, falling back to UTC.
 * Returns 'UTC' during SSR so the server-rendered HTML is stable
 * and consistent — the client updates the value after hydration. */
function detectUserTimezone(): string {
  if (typeof window === 'undefined') return 'UTC';
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || 'UTC';
  } catch {
    return 'UTC';
  }
}

export const USER_TIMEZONE: string = detectUserTimezone();

const LOCAL_FORMATTER = new Intl.DateTimeFormat(undefined, {
  timeZone: USER_TIMEZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function formatReportTime(isoString: string | undefined | null): string {
  if (!isoString) return "—";

  const date = new Date(isoString);

  // `new Date()` on an invalid string produces an "Invalid Date" object.
  if (isNaN(date.getTime())) return "—";

  return LOCAL_FORMATTER.format(date);
}
