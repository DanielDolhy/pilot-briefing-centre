/**
 * BriefingResults
 *
 * Top-level results component. Receives a flat list of ReportEntry objects,
 * groups them by stationId using the Map-based utility (order-preserving),
 * and renders a semantic HTML table with one StationGroup per station.
 *
 * Edge cases handled:
 *  - Empty result array → shows a contextual "no reports found" message.
 */

import type { ReportEntry } from "@/types/briefing";
import { groupReportsByStation } from "@/utils/groupReportsByStation";
import { StationGroup } from "./StationGroup";
import styles from "./BriefingResults.module.css";

interface BriefingResultsProps {
  results: ReportEntry[];
}

export function BriefingResults({ results }: BriefingResultsProps) {
  if (results.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyMessage}>
          No reports were found for the selected criteria. Try expanding your
          search or check that the codes are correct.
        </p>
      </div>
    );
  }

  const grouped = groupReportsByStation(results);

  return (
    <section className={styles.section} aria-label="Briefing results">
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <caption className={styles.caption}>
            Pilot Briefing — {results.length} report
            {results.length !== 1 ? "s" : ""} across {grouped.size} station
            {grouped.size !== 1 ? "s" : ""}
          </caption>
          <thead className={styles.tableHead}>
            <tr>
              <th scope="col" className={styles.thType}>
                Type
              </th>
              <th scope="col" className={styles.thTime}>
                Report Time (SK)
              </th>
              <th scope="col" className={styles.thBody}>
                Report
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from(grouped.entries()).map(([stationId, reports]) => (
              <StationGroup
                key={stationId}
                stationId={stationId}
                reports={reports}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
