import React from "react";
import type { ReportEntry } from "@/types/briefing";
import { groupReportsByStation } from "@/utils/groupReportsByStation";
import { StationDashboardCard } from "./StationDashboardCard";
import styles from "./DetailedDashboard.module.css";

interface DetailedDashboardProps {
  results: ReportEntry[];
}

export function DetailedDashboard({ results }: DetailedDashboardProps) {
  const grouped = groupReportsByStation(results);

  return (
    <section className={styles.dashboardContainer} aria-label="Aviation Weather Dashboard">
      <header className={styles.dashboardHeader}>
        <h2 className={styles.dashboardTitle}>Weather Dashboard</h2>
        <p className={styles.dashboardSubtitle}>
          Decoded, visual interpretation of {results.length} reports across {grouped.size} station
          {grouped.size !== 1 ? "s" : ""}
        </p>
      </header>

      <div className={styles.cardsGrid}>
        {Array.from(grouped.entries()).map(([stationId, reports]) => (
          <StationDashboardCard
            key={stationId}
            stationId={stationId}
            reports={reports}
          />
        ))}
      </div>
    </section>
  );
}
