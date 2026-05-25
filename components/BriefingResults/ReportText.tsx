/**
 * ReportText
 *
 * Renders the plain-text body of a meteorological report with cloud-coverage
 * segments coloured per the assignment brief:
 *
 *   BKN/FEW/SCT + 3 digits → blue if altitude ≤ 30, red if altitude > 30
 *
 * The text is tokenised by `parseReportText` into TextSegment objects.
 * Each segment is rendered as an inline <span>; coloured segments receive an
 * additional data attribute for clarity and potential future styling hooks.
 *
 * Multi-line bodies (typical for TAF reports) preserve line breaks.
 */

import { parseReportText } from "@/utils/parseReportText";
import type { TextSegment } from "@/types/briefing";
import styles from "./ReportText.module.css";

interface ReportTextProps {
  text: string;
}

export function ReportText({ text }: ReportTextProps) {
  // TAF reports often contain embedded newlines. Split into lines, tokenise
  // each independently, then re-join with <br> elements.
  const lines = text.split("\n");

  return (
    <span className={styles.reportText}>
      {lines.map((line, lineIndex) => {
        const segments = parseReportText(line);
        return (
          <span key={lineIndex}>
            {lineIndex > 0 && <br />}
            {segments.map((segment: TextSegment, segIndex: number) =>
              segment.color ? (
                <span
                  key={segIndex}
                  className={
                    segment.color === "blue"
                      ? styles.cloudBlue
                      : styles.cloudRed
                  }
                  data-cloud-color={segment.color}
                >
                  {segment.text}
                </span>
              ) : (
                <span key={segIndex}>{segment.text}</span>
              )
            )}
          </span>
        );
      })}
    </span>
  );
}
