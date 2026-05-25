/**
 * opmetQueryService
 *
 * Typed HTTP service layer for the IBL Soft opmet query JSON-RPC endpoint.
 *
 * Responsibilities:
 *  - Build a well-formed JSON-RPC request envelope from BriefingCriteria.
 *  - Omit `stations` and `countries` keys entirely when empty (avoids sending
 *    empty arrays to the API — cleaner contract, prevents unexpected behaviour).
 *  - Throw a descriptive Error for HTTP-level failures.
 *  - Throw a descriptive Error when the JSON-RPC envelope contains an error.
 *  - Return a typed ReportEntry[] on success.
 *
 * This module is a plain async function, not a class, to keep it easy to mock
 * in tests and straightforward to call from components.
 */

import type {
  BriefingCriteria,
  OpmetQueryRequest,
  OpmetQueryResponse,
  ReportEntry,
} from "@/types/briefing";

const ENDPOINT = "https://ogcie.iblsoft.com/ria/opmetquery";

/**
 * Builds the JSON-RPC request body from validated briefing criteria.
 * The inner `params[0].id` and outer `id` use the same value for traceability.
 */
function buildRequestBody(
  criteria: BriefingCriteria,
  requestId: string
): OpmetQueryRequest {
  const params: OpmetQueryRequest["params"][0] = {
    id: `briefing-${requestId}`,
    reportTypes: criteria.reportTypes,
  };

  // Only include the key when there is at least one value — omitting empty
  // arrays keeps the request semantically clean.
  if (criteria.stations.length > 0) {
    params.stations = criteria.stations;
  }
  if (criteria.countries.length > 0) {
    params.countries = criteria.countries;
  }

  return {
    id: `query-${requestId}`,
    method: "query",
    params: [params],
  };
}

/**
 * Sends a POST request to the opmet endpoint and returns the report entries.
 *
 * @param criteria - Validated briefing criteria from the form.
 * @returns        - Flat ordered array of ReportEntry objects.
 * @throws         - Error with a human-readable message on any failure.
 */
export async function fetchBriefing(
  criteria: BriefingCriteria
): Promise<ReportEntry[]> {
  // Use a timestamp-based ID so concurrent requests are distinguishable in logs.
  const requestId = Date.now().toString(36);
  const body = buildRequestBody(criteria, requestId);

  let response: Response;

  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (networkError) {
    // fetch() itself throws only on network-level failures (no connection, DNS, etc.)
    throw new Error(
      "Unable to reach the weather data service. Please check your connection and try again."
    );
  }

  if (!response.ok) {
    throw new Error(
      `The weather data service returned an error (HTTP ${response.status}). Please try again later.`
    );
  }

  let data: OpmetQueryResponse;

  try {
    data = (await response.json()) as OpmetQueryResponse;
  } catch {
    throw new Error(
      "The weather data service returned an unreadable response. Please try again later."
    );
  }

  // The JSON-RPC protocol uses an `error` field even on HTTP 200 responses.
  if (data.error) {
    throw new Error(`Weather service error: ${data.error}`);
  }

  return data.result ?? [];
}
