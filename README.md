# Pilot Briefing Centre

A professional aviation weather briefing application built with **Next.js 15** (App Router) and **TypeScript**. Pilots query real-time METAR, TAF, and SIGMET reports by airport (ICAO code) and/or country (WMO code). Results are rendered as richly decoded, flight-deck–style station cards with automatic flight-category classification.

---

## Getting Started

```bash
npm install
npm run dev      # → http://localhost:3000
npm run lint     # ESLint check
npm run build    # Production bundle validation
npm run start    # Serve production build
```

---

## Tech Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | First-class TypeScript, file-based routing, Server/Client Component model |
| Runtime | React 19 | Concurrent features, stable `use client` boundary |
| Language | TypeScript 5 (strict) | Type safety at every layer eliminates ambiguity in API shapes |
| Styling | CSS Modules + CSS Custom Properties | Scoped styles, zero runtime cost, full expressive power |
| HTTP | Native `fetch` | No extra dependencies; wrapped in a typed service function |

> Next.js was chosen because it matches the product's nature (form + data display), has broad industry adoption, and allows future SSR / API route enhancement without major rewrites.

---

## Architecture

```
├── types/
│   └── briefing.ts                 ← All domain interfaces (ReportEntry, BriefingCriteria, FormErrors, …)
│
├── utils/
│   ├── decodeReport.ts             ← Full METAR / TAF decoder (wind, visibility, clouds, QNH, flight category)
│   ├── parseReportText.ts          ← Cloud-coverage tokeniser (BKN/FEW/SCT colour logic for raw-text view)
│   ├── formatReportTime.ts         ← UTC → user's local timezone via Intl API (dynamic detection)
│   ├── groupReportsByStation.ts    ← Map-based insertion-order-preserving grouping
│   └── validateBriefingForm.ts     ← Pure validation function (all rules in one place)
│
├── services/
│   └── opmetQueryService.ts        ← Typed fetch wrapper for the JSON-RPC endpoint
│
├── components/
│   ├── BriefingDashboard/          ← Top-level Client Component; owns results state + timezone detection
│   ├── BriefingForm/               ← Form orchestrator + sub-inputs (ReportTypeSelector, LocationInput)
│   └── BriefingResults/            ← Results view (table + per-station decoded dashboard cards)
│       ├── BriefingResults         ← Outer shell; switches between table and card views
│       ├── StationGroup            ← Collects raw rows per station
│       ├── ReportRow               ← Single raw-text report row
│       ├── ReportText              ← Tokenised, coloured cloud-coverage spans
│       ├── StationDashboardCard    ← Richly decoded station card (METAR widgets, TAF timeline, SIGMET alerts)
│       └── DetailedDashboard       ← Layout wrapper for the dashboard card view
│
└── app/
    ├── layout.tsx                  ← Root layout (SEO metadata, global CSS)
    ├── page.tsx                    ← Server Component entry point (renders BriefingDashboard)
    ├── page.module.css             ← Page-level layout tokens (header, main, card, footer)
    └── globals.css                 ← Design tokens + global reset
```

### Component Communication

```
app/page.tsx  (Server Component — no state)
│
└── <BriefingDashboard>  'use client'  (owns: results state, timezone)
    │
    ├── <BriefingForm>  (onResults, onQueryStart callbacks)
    │   ├── <ReportTypeSelector>   controlled checkboxes
    │   └── <LocationInput>        controlled text inputs (airports + countries)
    │
    └── <BriefingResults>  (results: ReportEntry[])
        └── <StationDashboardCard>  (per station)
            ├── decodeMetar()  →  METAR widgets (wind, visibility, temp/humidity, QNH, clouds, phenomena)
            ├── decodeTaf()    →  TAF timeline (base forecast + BECMG/TEMPO/FM change groups)
            └── SIGMET         →  Raw-text advisory cards with reception time
```

`page.tsx` is a **Server Component** that renders nothing but `<BriefingDashboard>`. The dashboard is the sole Client Component boundary; it owns all interactive state, preventing unnecessary client-side JavaScript in the root layout.

---

## Key Design Decisions

### Decoded Dashboard (`decodeReport.ts`)

The main results view renders a **detailed station card** rather than plain raw text. `decodeReport.ts` parses METAR and TAF strings into strongly-typed interfaces:

- **Wind** — direction, speed, gusts, and variable-wind range (`VRB`, `NNNVnnn`)
- **Visibility** — metre values, SM values, and CAVOK
- **Clouds** — coverage (`FEW`, `SCT`, `BKN`, `OVC`), altitude in feet, ceiling tagging
- **Temperature / Dew Point / Humidity** — Magnus-Tetens formula for relative humidity
- **QNH / Altimeter** — `Q` (hPa) and `A` (inHg) formats, auto-converted to the other unit
- **Weather Phenomena** — intensity, proximity, descriptor and code decoded to plain English
- **Flight Category** — `VFR` / `MVFR` / `IFR` / `LIFR` derived from ceiling and visibility thresholds
- **TAF Change Groups** — `BECMG`, `TEMPO`, `FM`, `PROB30/40` parsed into a visual timeline

### Cloud Coverage Colouring (`parseReportText.ts`)

Used in the raw-text fallback view. The regex `/\b(BKN|FEW|SCT)(\d{3})(\S*)/g` matches tokens and colours them:

- Altitude ≤ 30 (hundreds of feet) → **blue**
- Altitude > 30 → **red**

The threshold is named `ALTITUDE_BLUE_THRESHOLD` for explicitness.

### Dynamic Timezone Detection (`formatReportTime.ts`)

All times are displayed in the **user's local timezone**, not a hard-coded zone:

1. On the **server** (SSR), the formatter defaults to `UTC` so the HTML is stable.
2. On the **client**, `BriefingDashboard` calls `Intl.DateTimeFormat().resolvedOptions().timeZone` inside `useEffect` (after hydration) to obtain the real browser timezone and updates state.
3. `formatReportTime` wraps `Intl.DateTimeFormat(undefined, { timeZone: USER_TIMEZONE })` — a single module-level instance for performance — and returns `—` for invalid/null timestamps.

### Station Grouping (`groupReportsByStation.ts`)

Results are grouped using `Map<string, ReportEntry[]>`. Unlike a plain object, `Map` provides an **explicit insertion-order guarantee** per the ECMAScript spec, so station ordering reliably reflects the API response order.

### Service Layer (`opmetQueryService.ts`)

- `stations` and `countries` keys are **omitted entirely** when empty — sending `[]` is semantically different from not sending the field.
- Three distinct error paths with user-readable messages: network failure, HTTP error, JSON-RPC `error` field.
- Pure async function (not a class) for ease of mocking in tests.

### Validation (`validateBriefingForm.ts`)

All validation lives in a pure function outside the component. Rules are independently testable and the component stays lean. Errors are field-level (per input) plus one cross-field error for the "at least one location" rule.

---

## Validation Rules

| Rule | Detail |
|---|---|
| Report type required | At least one of METAR / TAF / SIGMET must be checked |
| Location required | At least one airport OR one country code must be provided |
| ICAO format | Each airport code: exactly 4 uppercase letters (`/^[A-Z]{4}$/`) |
| WMO format | Each country code: exactly 2 uppercase letters (`/^[A-Z]{2}$/`) |
| Normalisation | Input is trimmed and uppercased before validation |

---

## API Reference

**Endpoint:** `POST https://ogcie.iblsoft.com/ria/opmetquery`

**Request format (JSON-RPC):**
```json
{
  "id": "query-<timestamp>",
  "method": "query",
  "params": [{
    "id": "briefing-<timestamp>",
    "reportTypes": ["METAR", "TAF_LONGTAF"],
    "stations": ["LZIB", "LKPR"],
    "countries": ["LZ"]
  }]
}
```

Note: `stations` and `countries` are omitted when empty.

---

## Flight Category Reference

| Category | Ceiling | Visibility |
|---|---|---|
| **VFR** | > 3,000 ft | > 5 SM (> 8,000 m) |
| **MVFR** | 1,000 – 3,000 ft | 3 – 5 SM (4,800 – 8,000 m) |
| **IFR** | 500 – 1,000 ft | 1 – 3 SM (1,600 – 4,800 m) |
| **LIFR** | < 500 ft | < 1 SM (< 1,600 m) |

CAVOK always maps to **VFR**.

---

## Potential Future Improvements

- Unit tests for `decodeReport`, `parseReportText`, `formatReportTime`, and `validateBriefingForm`
- Keyboard-accessible auto-complete for airport ICAO codes
- Persist last-used criteria to `localStorage`
- Support for printing / exporting the briefing as PDF
- Highlight expired reports (e.g. METAR older than 2 hours)
- Wind rose visualisation for the wind widget
- Offline support via Service Worker caching of the last successful briefing
