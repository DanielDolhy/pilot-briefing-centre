"use client";

import { useState } from "react";
import type { ReportEntry } from "@/types/briefing";
import { BriefingForm } from "@/components/BriefingForm/BriefingForm";
import { BriefingResults } from "@/components/BriefingResults/BriefingResults";
import styles from "@/app/page.module.css";

export function BriefingDashboard() {
  const [results, setResults] = useState<ReportEntry[] | null>(null);

  function handleQueryStart() {
    // Clear previous results as soon as a new query begins.
    setResults(null);
  }

  function handleResults(newResults: ReportEntry[]) {
    setResults(newResults);
  }

  return (
    <div className={styles.pageWrapper}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logoMark} aria-hidden="true">✈</div>
          <div>
            <h1 className={styles.title}>Pilot Briefing Centre</h1>
            <p className={styles.subtitle}>
              Real-time METAR · TAF · SIGMET
            </p>
          </div>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main className={styles.main}>
        {/* Form card */}
        <section className={styles.card} aria-label="Briefing request form">
          <h2 className={styles.cardTitle}>New Briefing</h2>
          <BriefingForm
            onResults={handleResults}
            onQueryStart={handleQueryStart}
          />
        </section>

        {/* Results — only rendered after at least one query */}
        {results !== null && (
          <div className={styles.resultsSection}>
            <BriefingResults results={results} />
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <p>
          Data provided by{" "}
          <a
            href="https://ogcie.iblsoft.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            IBL Soft
          </a>{" "}
          · Times displayed in Slovak local time (Europe/Bratislava)
        </p>
      </footer>
    </div>
  );
}
