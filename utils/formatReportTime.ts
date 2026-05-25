/**
 * formatReportTime
 *
 * Converts an ISO 8601 UTC timestamp from a ReportEntry into a human-readable
 * string using the Slovak locale (sk-SK) and the Slovak timezone
 * (Europe/Bratislava), as required by the assignment brief.
 *
 * The formatter is created once and reused across calls for performance.
 *
 * Expected output example: "15. 2. 2017, 11:30:00"
 *
 * @param isoString - An ISO 8601 date-time string, e.g. "2016-06-15T10:50:00Z".
 * @returns         - A locale-formatted string, or a fallback "—" for invalid input.
 */

const SK_FORMATTER = new Intl.DateTimeFormat("sk-SK", {
  timeZone: "Europe/Bratislava",
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

  return SK_FORMATTER.format(date);
}
