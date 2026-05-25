/**
 * ReportTypeSelector
 *
 * A controlled fieldset of checkboxes for selecting meteorological report types.
 * Grouped in a <fieldset> with <legend> for proper screen-reader accessibility.
 *
 * Props:
 *  value    – currently selected report types
 *  onChange – called with the new selection on each toggle
 *  error    – optional validation message to display below the fieldset
 */

"use client";

import type { ReportType } from "@/types/briefing";
import styles from "./ReportTypeSelector.module.css";

/** Human-readable label for each report type value. */
const REPORT_TYPE_OPTIONS: { value: ReportType; label: string }[] = [
  { value: "METAR", label: "METAR" },
  { value: "SIGMET", label: "SIGMET" },
  { value: "TAF_LONGTAF", label: "TAF" },
];

interface ReportTypeSelectorProps {
  value: ReportType[];
  onChange: (selected: ReportType[]) => void;
  error?: string | null;
}

export function ReportTypeSelector({
  value,
  onChange,
  error,
}: ReportTypeSelectorProps) {
  function handleChange(type: ReportType, checked: boolean) {
    if (checked) {
      onChange([...value, type]);
    } else {
      onChange(value.filter((t) => t !== type));
    }
  }

  return (
    <fieldset
      className={styles.fieldset}
      aria-describedby={error ? "reportTypes-error" : undefined}
    >
      <legend className={styles.legend}>Report Types</legend>
      <div className={styles.checkboxGroup}>
        {REPORT_TYPE_OPTIONS.map(({ value: type, label }) => (
          <label key={type} className={styles.checkboxLabel}>
            <input
              type="checkbox"
              className={styles.checkbox}
              id={`reportType-${type}`}
              checked={value.includes(type)}
              onChange={(e) => handleChange(type, e.target.checked)}
            />
            <span className={styles.labelText}>{label}</span>
          </label>
        ))}
      </div>
      {error && (
        <p id="reportTypes-error" className={styles.error} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
