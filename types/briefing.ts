/**
 * Domain types for the Pilot Briefing Centre.
 *
 * These interfaces model the JSON-RPC API contract described in the assignment
 * brief, keeping the rest of the codebase agnostic of raw API shapes.
 */

// ---------------------------------------------------------------------------
// Report type identifiers
// ---------------------------------------------------------------------------

/** The three report categories the user can request. */
export type ReportType = "METAR" | "TAF_LONGTAF" | "SIGMET";

// ---------------------------------------------------------------------------
// API request types
// ---------------------------------------------------------------------------

/**
 * Top-level JSON-RPC request envelope sent to the opmet query endpoint.
 * Method is always "query" per the API spec.
 */
export interface OpmetQueryRequest {
  id: string;
  method: "query";
  params: [BriefingQueryParams];
}

/**
 * The inner params object that carries the user's briefing criteria.
 * `stations` and `countries` are omitted entirely when empty so we do not
 * send empty arrays to the API (cleaner contract, avoids ambiguity).
 */
export interface BriefingQueryParams {
  id: string;
  reportTypes: ReportType[];
  stations?: string[];
  countries?: string[];
}

// ---------------------------------------------------------------------------
// API response types
// ---------------------------------------------------------------------------

/**
 * A single met report entry as returned by the opmet API.
 * Fields map 1-to-1 to the documented JSON-RPC response shape.
 */
export interface ReportEntry {
  /** Composite place identifier, e.g. "icao:EGLL". */
  placeId: string;
  /** Report category as returned by the API, e.g. "METAR", "TAF", "SIGMET". */
  queryType: string;
  /** ISO 8601 timestamp of when the report was received by the server. */
  receptionTime: string;
  /** ISO 8601 timestamp of the official report observation time. */
  reportTime: string;
  /** Internal report type string, e.g. "MSG_METAR". */
  reportType: string;
  /** Optional correction indicator, e.g. "COR". */
  revision?: string;
  /** ICAO station identifier, e.g. "EGLL". */
  stationId: string;
  /** Plain-text body of the meteorological report. */
  text: string;
  /** Server-provided HTML-formatted text (unused; we apply our own colouring). */
  textHTML?: string;
}

/**
 * Full JSON-RPC response wrapper.
 * `error` is null on success; `result` is the flat list of matched reports.
 */
export interface OpmetQueryResponse {
  id: string;
  error: string | null;
  result: ReportEntry[];
}

// ---------------------------------------------------------------------------
// Form / validated criteria types
// ---------------------------------------------------------------------------

/**
 * The clean, validated form data passed from the form to the service layer.
 * All string values are already trimmed and uppercased at this point.
 */
export interface BriefingCriteria {
  reportTypes: ReportType[];
  /** ICAO airport codes; may be empty when the user only supplied countries. */
  stations: string[];
  /** WMO country codes; may be empty when the user only supplied airports. */
  countries: string[];
}

// ---------------------------------------------------------------------------
// UI helper types
// ---------------------------------------------------------------------------

/**
 * A single colour-annotated segment of report body text produced by
 * `parseReportText`. Used by `ReportText` to render coloured spans.
 */
export interface TextSegment {
  text: string;
  /**
   * Present only for cloud-coverage tokens (BKN/FEW/SCT + 3 digits).
   * "blue"  → altitude ≤ 30 (hundreds of feet)
   * "red"   → altitude > 30
   */
  color?: "blue" | "red";
}

/**
 * Per-field validation errors surfaced by the briefing form.
 * A null value means the field is valid.
 */
export interface FormErrors {
  reportTypes: string | null;
  stations: string | null;
  countries: string | null;
  /** Cross-field error when neither airports nor countries are provided. */
  location: string | null;
}
