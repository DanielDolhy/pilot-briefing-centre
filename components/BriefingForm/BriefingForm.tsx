/**
 * BriefingForm
 *
 * The main form component. Owns all form state, coordinates validation, calls
 * the API service, and reports results upward via the `onResults` callback.
 * Loading and error state are also owned here and displayed inline.
 *
 * Responsibilities:
 *  - Manage form field state (reportTypes, airports, countries)
 *  - Run validation on submit via the validateBriefingForm utility
 *  - Call fetchBriefing service and surface loading / error states
 *  - Lift results to parent via onResults callback (parent owns result data)
 *
 * The component intentionally does NOT own the result data — that belongs
 * to the parent page so BriefingResults can be a sibling, not a child.
 */

"use client";

import { useState } from "react";
import type { BriefingCriteria, ReportEntry, ReportType } from "@/types/briefing";
import { fetchBriefing } from "@/services/opmetQueryService";
import {
  validateBriefingForm,
  hasNoErrors,
} from "@/utils/validateBriefingForm";
import { ReportTypeSelector } from "./ReportTypeSelector";
import { LocationInput } from "./LocationInput";
import styles from "./BriefingForm.module.css";

interface BriefingFormProps {
  /** Called when the API returns results. Parent stores and renders these. */
  onResults: (results: ReportEntry[]) => void;
  /** Called when a new query starts, so parent can clear previous results. */
  onQueryStart: () => void;
}

export function BriefingForm({ onResults, onQueryStart }: BriefingFormProps) {
  // ── Form state ────────────────────────────────────────────────────────────
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [airportsInput, setAirportsInput] = useState("");
  const [countriesInput, setCountriesInput] = useState("");

  // ── UI state ──────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState({
    reportTypes: null as string | null,
    stations: null as string | null,
    countries: null as string | null,
    location: null as string | null,
  });

  // ── Submit handler ────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Normalise inputs before validation: trim whitespace, uppercase.
    const airportsNorm = airportsInput.trim().toUpperCase();
    const countriesNorm = countriesInput.trim().toUpperCase();

    const errors = validateBriefingForm(reportTypes, airportsNorm, countriesNorm);
    setFormErrors(errors);

    if (!hasNoErrors(errors)) return;

    // Build validated criteria object for the service layer.
    const criteria: BriefingCriteria = {
      reportTypes,
      stations: airportsNorm.split(/\s+/).filter(Boolean),
      countries: countriesNorm.split(/\s+/).filter(Boolean),
    };

    setIsLoading(true);
    setApiError(null);
    onQueryStart();

    try {
      const results = await fetchBriefing(criteria);
      onResults(results);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <form
      id="briefing-form"
      className={styles.form}
      onSubmit={handleSubmit}
      noValidate
    >
      <ReportTypeSelector
        value={reportTypes}
        onChange={setReportTypes}
        error={formErrors.reportTypes}
      />

      <div className={styles.locationFields}>
        <LocationInput
          id="airports-input"
          label="Airports"
          placeholder="e.g. LZIB LKPR EGLL"
          hint="ICAO codes (4 letters each), separated by spaces"
          value={airportsInput}
          onChange={setAirportsInput}
          error={formErrors.stations}
          locationError={formErrors.location}
        />
        <LocationInput
          id="countries-input"
          label="Countries"
          placeholder="e.g. SQ LK"
          hint="WMO codes (2 letters each), separated by spaces"
          value={countriesInput}
          onChange={setCountriesInput}
          error={formErrors.countries}
        />
      </div>

      {apiError && (
        <div className={styles.apiError} role="alert">
          <span className={styles.apiErrorIcon}>⚠</span>
          <span>{apiError}</span>
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="submit"
          id="submit-briefing"
          className={styles.submitButton}
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <span className={styles.spinner} aria-hidden="true" />
              Fetching Briefing…
            </>
          ) : (
            "Create Briefing"
          )}
        </button>
      </div>
    </form>
  );
}
