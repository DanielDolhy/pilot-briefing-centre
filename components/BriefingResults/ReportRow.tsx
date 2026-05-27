/**
 * ReportRow
 *
 * Renders a single meteorological report as a table row.
 * Displays: queryType | formatted reportTime | coloured report body text.
 *
 * Falls back to `receptionTime` when `reportTime` is absent, and to "—"
 * if neither is available.
 */

import type { ReportEntry } from "@/types/briefing";
import { formatReportTime } from "@/utils/formatReportTime";
import { ReportText } from "./ReportText";
import styles from "./ReportRow.module.css";

interface ReportRowProps {
  report: ReportEntry;
}

export function ReportRow({ report }: ReportRowProps) {
  // Prefer reportTime; fall back to receptionTime if reportTime is missing.
  const displayTime = report.reportTime || report.receptionTime;

  return (
    <tr className={styles.row}>
      <td className={styles.queryType} data-label="Type">
        <span className={styles.queryTypeBadge}>{report.queryType}</span>
      </td>
      <td className={styles.reportTime} data-label="Time">
        {formatReportTime(displayTime)}
      </td>
      <td className={styles.reportBody} data-label="Report">
        <ReportText text={report.text} />
      </td>
    </tr>
  );
}
