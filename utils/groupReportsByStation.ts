/**
 * groupReportsByStation
 *
 * Groups a flat array of ReportEntry objects into an ordered Map keyed by
 * stationId. The Map preserves insertion order, meaning stations appear in the
 * same sequence as their first occurrence in the API response — intentionally
 * using Map rather than a plain object to make the ordering guarantee explicit.
 *
 * @param entries - Flat list of report entries from the API.
 * @returns       - Ordered map of stationId → list of that station's reports.
 */

import type { ReportEntry } from "@/types/briefing";

export function groupReportsByStation(
  entries: ReportEntry[]
): Map<string, ReportEntry[]> {
  const grouped = new Map<string, ReportEntry[]>();

  for (const entry of entries) {
    const existing = grouped.get(entry.stationId);
    if (existing) {
      existing.push(entry);
    } else {
      grouped.set(entry.stationId, [entry]);
    }
  }

  return grouped;
}
