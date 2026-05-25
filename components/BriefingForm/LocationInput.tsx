/**
 * LocationInput
 *
 * A reusable controlled text input for airport (ICAO) or country (WMO) codes.
 * Handles uppercasing on change so the user sees codes normalised in real time.
 *
 * Props:
 *  id          – unique element id (required for label association)
 *  label       – visible field label
 *  placeholder – input placeholder text
 *  hint        – small hint text shown below the input
 *  value       – current input string (controlled)
 *  onChange    – called with the new (uppercased) value
 *  error       – optional validation message; links via aria-describedby
 *  locationError – cross-field "at least one location" error (shown on airports field only)
 */

"use client";

import styles from "./LocationInput.module.css";

interface LocationInputProps {
  id: string;
  label: string;
  placeholder: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  locationError?: string | null;
}

export function LocationInput({
  id,
  label,
  placeholder,
  hint,
  value,
  onChange,
  error,
  locationError,
}: LocationInputProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const locationErrorId = `${id}-location-error`;

  const describedBy = [
    hintId,
    error ? errorId : null,
    locationError ? locationErrorId : null,
  ]
    .filter(Boolean)
    .join(" ");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Uppercase in real time so users see the normalised format as they type.
    onChange(e.target.value.toUpperCase());
  }

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        className={`${styles.input} ${error || locationError ? styles.inputError : ""}`}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        aria-describedby={describedBy || undefined}
        autoComplete="off"
        spellCheck={false}
      />
      <p id={hintId} className={styles.hint}>
        {hint}
      </p>
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
      {locationError && (
        <p id={locationErrorId} className={styles.error} role="alert">
          {locationError}
        </p>
      )}
    </div>
  );
}
