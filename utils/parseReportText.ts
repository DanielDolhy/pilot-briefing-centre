/**
 * parseReportText
 *
 * Tokenises a plain-text meteorological report body and annotates
 * cloud-coverage tokens with colour information per the brief spec:
 *
 *   - Tokens starting with BKN, FEW, or SCT immediately followed by
 *     three digits are coloured:
 *       • blue  if the numeric value (altitude in hundreds of feet) ≤ 30
 *       • red   if the numeric value > 30
 *   - The **entire** token is coloured, not just the digits
 *     (e.g. "FEW033///" is coloured as one unit).
 *   - All other text is returned as plain (no colour) segments.
 *
 * @param text - The raw `text` field from a ReportEntry.
 * @returns    - An ordered array of TextSegment objects ready for rendering.
 */

import type { TextSegment } from "@/types/briefing";

/**
 * Matches a cloud-coverage token:
 *   Group 1 – prefix (BKN | FEW | SCT)
 *   Group 2 – three-digit altitude
 *   Group 3 – any trailing non-whitespace characters (e.g. "///", "CB")
 *
 * The \b word boundary before the prefix ensures we do not match mid-word.
 * The global flag allows repeated `exec` calls across the full string.
 */
const CLOUD_TOKEN_RE = /\b(BKN|FEW|SCT)(\d{3})(\S*)/g;

/**
 * Altitude threshold per the brief: values ≤ 30 are blue, > 30 are red.
 * Expressed as a named constant to make the business rule explicit.
 */
const ALTITUDE_BLUE_THRESHOLD = 30;

export function parseReportText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  // Reset the regex state for every call (important for global regexes).
  CLOUD_TOKEN_RE.lastIndex = 0;

  let match: RegExpExecArray | null;

  while ((match = CLOUD_TOKEN_RE.exec(text)) !== null) {
    const [fullMatch, , digitsStr] = match;
    const matchStart = match.index;

    // Capture any plain text that precedes this token.
    if (matchStart > lastIndex) {
      segments.push({ text: text.slice(lastIndex, matchStart) });
    }

    const altitude = parseInt(digitsStr, 10);
    const color: "blue" | "red" =
      altitude <= ALTITUDE_BLUE_THRESHOLD ? "blue" : "red";

    segments.push({ text: fullMatch, color });

    lastIndex = matchStart + fullMatch.length;
  }

  // Capture any remaining plain text after the last match.
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) });
  }

  // Edge case: text contained no cloud tokens — return it as a single segment.
  if (segments.length === 0) {
    segments.push({ text });
  }

  return segments;
}
