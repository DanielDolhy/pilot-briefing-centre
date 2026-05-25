/**
 * validateBriefingForm
 *
 * Pure validation function for the briefing form inputs. Returns a FormErrors
 * object where each field is null (valid) or a descriptive error string.
 *
 * Rules (per assignment brief):
 *  1. At least one report type must be selected.
 *  2. At least one airport code OR one country code must be provided.
 *  3. Each airport code must be exactly 4 uppercase letters (ICAO format).
 *  4. Each country code must be exactly 2 uppercase letters (WMO format).
 *
 * Input is expected to be already trimmed and uppercased before calling this.
 */

import type { FormErrors, ReportType } from "@/types/briefing";

/** ICAO airport code: exactly 4 uppercase ASCII letters. */
const ICAO_CODE_RE = /^[A-Z]{4}$/;

/** WMO country code: exactly 2 uppercase ASCII letters. */
const WMO_CODE_RE = /^[A-Z]{2}$/;

/**
 * Splits a space-separated input string into individual non-empty tokens.
 * Handles multiple consecutive spaces gracefully.
 */
function tokenise(input: string): string[] {
  return input.split(/\s+/).filter(Boolean);
}

export function validateBriefingForm(
  reportTypes: ReportType[],
  airportsRaw: string,
  countriesRaw: string
): FormErrors {
  const errors: FormErrors = {
    reportTypes: null,
    stations: null,
    countries: null,
    location: null,
  };

  // Rule 1: at least one report type.
  if (reportTypes.length === 0) {
    errors.reportTypes = "Select at least one report type.";
  }

  const airportTokens = tokenise(airportsRaw);
  const countryTokens = tokenise(countriesRaw);

  // Rule 2: at least one location (airport or country).
  if (airportTokens.length === 0 && countryTokens.length === 0) {
    errors.location =
      "Enter at least one airport (ICAO) or country (WMO) code.";
  }

  // Rule 3: validate individual airport codes.
  const invalidAirports = airportTokens.filter(
    (code) => !ICAO_CODE_RE.test(code)
  );
  if (invalidAirports.length > 0) {
    errors.stations = `Invalid ICAO code${invalidAirports.length > 1 ? "s" : ""}: ${invalidAirports.join(", ")}. Each code must be exactly 4 uppercase letters.`;
  }

  // Rule 4: validate individual country codes.
  const invalidCountries = countryTokens.filter(
    (code) => !WMO_CODE_RE.test(code)
  );
  if (invalidCountries.length > 0) {
    errors.countries = `Invalid WMO code${invalidCountries.length > 1 ? "s" : ""}: ${invalidCountries.join(", ")}. Each code must be exactly 2 uppercase letters.`;
  }

  return errors;
}

/** Returns true when all fields in a FormErrors object are null (no errors). */
export function hasNoErrors(errors: FormErrors): boolean {
  return Object.values(errors).every((v) => v === null);
}
