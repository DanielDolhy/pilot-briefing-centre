/**
 * StationGroup
 *
 * Renders all reports for a single ICAO station within the results table.
 * The station identifier is displayed as a full-width header row above the
 * station's report rows, matching the tabular layout shown in the brief.
 */

import type { ReportEntry } from "@/types/briefing";
import { ReportRow } from "./ReportRow";
import styles from "./StationGroup.module.css";

interface StationGroupProps {
  stationId: string;
  reports: ReportEntry[];
}

export function StationGroup({ stationId, reports }: StationGroupProps) {
  return (
    <>
      {/* Station header spans all columns */}
      <tr className={styles.stationHeader}>
        <td colSpan={3} className={styles.stationId}>
          {stationId}
        </td>
      </tr>

      {reports.map((report, index) => (
        <ReportRow key={`${report.queryType}-${report.reportTime}-${index}`} report={report} />
      ))}
    </>
  );
}
