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

import { useState } from "react";
import type { ReportEntry } from "@/types/briefing";
import { groupReportsByStation } from "@/utils/groupReportsByStation";
import { StationGroup } from "./StationGroup";
import { DetailedDashboard } from "./DetailedDashboard";
import styles from "./BriefingResults.module.css";

interface BriefingResultsProps {
  results: ReportEntry[];
}

export function BriefingResults({ results }: BriefingResultsProps) {
  const [activeTab, setActiveTab] = useState<"RAW" | "DASHBOARD">("RAW");

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
      <nav className={styles.tabsContainer} role="tablist" aria-label="Briefing format selection">
        <button
          role="tab"
          id="tab-raw"
          aria-controls="panel-raw"
          aria-selected={activeTab === "RAW"}
          className={`${styles.tabButton} ${activeTab === "RAW" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("RAW")}
        >
          ✈ Raw Reports
        </button>
        <button
          role="tab"
          id="tab-dashboard"
          aria-controls="panel-dashboard"
          aria-selected={activeTab === "DASHBOARD"}
          className={`${styles.tabButton} ${activeTab === "DASHBOARD" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("DASHBOARD")}
        >
          📊 Detailed Dashboard
        </button>
      </nav>

      {activeTab === "RAW" ? (
        <div id="panel-raw" role="tabpanel" aria-labelledby="tab-raw" className={styles.tableWrapper}>
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
      ) : (
        <div id="panel-dashboard" role="tabpanel" aria-labelledby="tab-dashboard">
          <DetailedDashboard results={results} />
        </div>
      )}
    </section>
  );
}

