import React from "react";
import type { ReportEntry } from "@/types/briefing";
import { decodeMetar, decodeTaf } from "@/utils/decodeReport";
import { formatReportTime } from "@/utils/formatReportTime";
import styles from "./DetailedDashboard.module.css";

interface StationDashboardCardProps {
  stationId: string;
  reports: ReportEntry[];
}

export function StationDashboardCard({ stationId, reports }: StationDashboardCardProps) {
  // Find report types
  const metarReport = reports.find(
    (r) => r.queryType === "METAR" || r.reportType.includes("METAR")
  );
  const tafReport = reports.find(
    (r) => r.queryType === "TAF_LONGTAF" || r.reportType.includes("TAF")
  );
  const sigmetReports = reports.filter(
    (r) => r.queryType === "SIGMET" || r.reportType.includes("SIGMET")
  );

  // Decode reports
  const metar = metarReport ? decodeMetar(metarReport.text) : undefined;
  const taf = tafReport ? decodeTaf(tafReport.text) : undefined;

  // Determine flight category styling
  const category = metar?.flightCategory || "VFR";
  const categoryClass = styles[`cat${category}`] || styles.catVFR;

  const categoryDescriptions = {
    VFR: "Visual Flight Rules (Ceiling > 3,000 ft, Visibility > 5 SM)",
    MVFR: "Marginal Visual Flight Rules (Ceiling 1,000 - 3,000 ft and/or Visibility 3 - 5 SM)",
    IFR: "Instrument Flight Rules (Ceiling 500 - 1,000 ft and/or Visibility 1 - 3 SM)",
    LIFR: "Low Instrument Flight Rules (Ceiling < 500 ft and/or Visibility < 1 SM)",
  };

  return (
    <article className={styles.stationCard} aria-labelledby={`station-title-${stationId}`}>
      {/* ── Card Header ────────────────────────────────────────────────── */}
      <header className={styles.cardHeader}>
        <div className={styles.stationInfo}>
          <h3 id={`station-title-${stationId}`} className={styles.stationId}>
            {stationId}
          </h3>
          <span className={styles.airportSubtitle}>Airport Weather Centre</span>
        </div>

        <div className={`${styles.categoryBadge} ${categoryClass}`}>
          <span className={styles.categoryDot} />
          {category}
        </div>
      </header>

      {/* Flight category description */}
      <div className={styles.categoryDescription}>
        <strong>Rules:</strong> {categoryDescriptions[category]}
      </div>

      {/* ── METAR Decoded Section ───────────────────────────────────────── */}
      {metar && (
        <section className={styles.metarSection} aria-label="METAR Decoded Data">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>METAR (Current Conditions)</span>
            <span className={styles.issueTime}>
              Observed: {formatReportTime(metarReport?.reportTime || metarReport?.receptionTime)}
            </span>
          </div>

          <div className={styles.metricsGrid}>
            {/* Wind Widget */}
            <div className={styles.widget}>
              <div className={styles.widgetLabel}>WIND</div>
              {metar.wind ? (
                <div className={styles.widgetValueContainer}>
                  <div className={styles.widgetValue}>
                    {metar.wind.direction === "VRB" ? "Variable" : `${metar.wind.direction}°`}
                    <span className={styles.widgetUnit}> @ {metar.wind.speed} KT</span>
                  </div>
                  {metar.wind.gusts && (
                    <div className={styles.widgetSubValue}>
                      Gusts up to <strong>{metar.wind.gusts} KT</strong>
                    </div>
                  )}
                  {metar.wind.variation && (
                    <div className={styles.widgetSubValue}>
                      Varying {metar.wind.variation.from}° to {metar.wind.variation.to}°
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.widgetValue}>Calm</div>
              )}
            </div>

            {/* Visibility Widget */}
            <div className={styles.widget}>
              <div className={styles.widgetLabel}>VISIBILITY</div>
              {metar.visibility ? (
                <div className={styles.widgetValueContainer}>
                  <div className={styles.widgetValue}>
                    {metar.visibility.raw === "CAVOK" ? "CAVOK" : metar.visibility.decoded}
                  </div>
                  <div className={styles.widgetSubValue}>
                    {metar.visibility.isCavok
                      ? "Ceiling & Vis OK"
                      : (metar.visibility.valueMeters || 9999) >= 9999
                      ? "Unrestricted"
                      : "Restricted"}
                  </div>
                </div>
              ) : (
                <div className={styles.widgetValue}>—</div>
              )}
            </div>

            {/* Temperature & Humidity Widget */}
            <div className={styles.widget}>
              <div className={styles.widgetLabel}>TEMP & HUMIDITY</div>
              {metar.temperature !== undefined && metar.dewPoint !== undefined ? (
                <div className={styles.widgetValueContainer}>
                  <div className={styles.widgetValue}>
                    {metar.temperature}°C <span className={styles.tempDivider}>/</span> {metar.dewPoint}°C
                  </div>
                  <div className={styles.widgetSubValue}>
                    Dew Point: {metar.dewPoint}°C • Humidity: <strong>{metar.humidity}%</strong>
                  </div>
                </div>
              ) : (
                <div className={styles.widgetValue}>—</div>
              )}
            </div>

            {/* Barometer Widget */}
            <div className={styles.widget}>
              <div className={styles.widgetLabel}>ALTIMETER (QNH)</div>
              {metar.qnh ? (
                <div className={styles.widgetValueContainer}>
                  <div className={styles.widgetValue}>
                    {metar.qnh.value}
                    <span className={styles.widgetUnit}> {metar.qnh.unit}</span>
                  </div>
                  <div className={styles.widgetSubValue}>
                    {metar.qnh.unit === "hPa"
                      ? `${(metar.qnh.value * 0.02953).toFixed(2)} inHg`
                      : `${Math.round(metar.qnh.value / 0.02953)} hPa`}
                  </div>
                </div>
              ) : (
                <div className={styles.widgetValue}>—</div>
              )}
            </div>
          </div>

          {/* Clouds and Weather Row */}
          <div className={styles.cloudsRow}>
            {/* Clouds subcard */}
            <div className={styles.subCard}>
              <h4 className={styles.subCardTitle}>Cloud Layers</h4>
              {metar.clouds.length > 0 ? (
                <ul className={styles.cloudList}>
                  {metar.clouds.map((cloud, i) => {
                    const isLow = cloud.altitude <= 3000;
                    const altLabel = `${cloud.altitude.toLocaleString()} ft`;
                    const colorClass = isLow ? styles.cloudBlue : styles.cloudRed;
                    const isCeiling = cloud.coverage === "BKN" || cloud.coverage === "OVC";

                    return (
                      <li key={i} className={styles.cloudItem}>
                        <span className={`${styles.cloudBadge} ${colorClass}`}>
                          {cloud.coverage} {altLabel}
                        </span>
                        {isCeiling && <span className={styles.ceilingTag}>CEILING</span>}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className={styles.noInfo}>Sky Clear (No significant clouds)</div>
              )}
            </div>

            {/* Weather Phenomena & Trend subcard */}
            <div className={styles.subCard}>
              <h4 className={styles.subCardTitle}>Weather & Trend</h4>
              <div className={styles.weatherInfo}>
                {metar.weatherPhenomena.length > 0 ? (
                  <div className={styles.weatherList}>
                    {metar.weatherPhenomena.map((p, i) => (
                      <span key={i} className={styles.weatherBadge}>
                        {p}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className={styles.noInfo}>No active weather phenomena reported.</div>
                )}
                {metar.trend && (
                  <div className={styles.trendBlock}>
                    <strong>Trend:</strong> <code className={styles.trendCode}>{metar.trend}</code>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── TAF Decoded Section ─────────────────────────────────────────── */}
      {taf && (
        <section className={styles.tafSection} aria-label="TAF Decoded Data">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>TAF (Aerodrome Forecast)</span>
            <span className={styles.issueTime}>
              Valid: {taf.validity}
            </span>
          </div>

          {/* Base Forecast info */}
          <div className={styles.tafBaseCard}>
            <h4 className={styles.tafBaseTitle}>Initial Conditions</h4>
            <div className={styles.tafBaseMetrics}>
              <div>
                <strong>Wind:</strong>{" "}
                {taf.baseForecast.wind
                  ? `${taf.baseForecast.wind.direction === "VRB" ? "Variable" : `${taf.baseForecast.wind.direction}°`} @ ${taf.baseForecast.wind.speed} KT`
                  : "Calm"}
              </div>
              <div>
                <strong>Visibility:</strong> {taf.baseForecast.visibility || "—"}
              </div>
              <div>
                <strong>Clouds:</strong>{" "}
                {taf.baseForecast.clouds.length > 0 ? (
                  <span className={styles.tafCloudsInline}>
                    {taf.baseForecast.clouds.map((c, i) => (
                      <span
                        key={i}
                        className={`${styles.cloudTextSpan} ${
                          c.altitude <= 3000 ? styles.textBlue : styles.textRed
                        }`}
                      >
                        {c.coverage} @ {c.altitude.toLocaleString()}ft
                      </span>
                    ))}
                  </span>
                ) : (
                  "Clear"
                )}
              </div>
            </div>
          </div>

          {/* Forecast changes timeline */}
          {taf.changes.length > 0 ? (
            <div className={styles.timelineContainer}>
              <h4 className={styles.subCardTitle}>Expected Changes</h4>
              <div className={styles.timeline}>
                {taf.changes.map((change, idx) => (
                  <div key={idx} className={styles.timelineItem}>
                    <div className={styles.timelineMarker}>
                      <span className={styles.markerDot} />
                    </div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineTime}>
                        <span className={styles.markerBadge}>{change.type}</span>
                        <span>{change.period}</span>
                      </div>
                      <div className={styles.timelineDesc}>{change.decoded}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.noInfo}>No forecast changes expected during this period.</div>
          )}
        </section>
      )}

      {/* ── SIGMET Section ─────────────────────────────────────────────── */}
      {sigmetReports.length > 0 && (
        <section className={styles.sigmetSection} aria-label="SIGMET Advisories">
          <div className={styles.sigmetHeader}>
            <span className={styles.sigmetAlertMark}>⚠</span>
            <span>ACTIVE SIGMET WARNINGS ({sigmetReports.length})</span>
          </div>
          <div className={styles.sigmetContainer}>
            {sigmetReports.map((report, idx) => (
              <div key={idx} className={styles.sigmetCard}>
                <div className={styles.sigmetMeta}>
                  <strong>Received:</strong> {formatReportTime(report.receptionTime)}
                </div>
                <pre className={styles.sigmetText}>{report.text}</pre>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
