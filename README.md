# Pilot Briefing Centre

A clean, modular aviation weather briefing application built with **Next.js 14** and **TypeScript**. Pilots can query real-time METAR, TAF, and SIGMET reports by airport (ICAO code) and/or country (WMO code).

---

## Getting Started

```bash
npm install
npm run dev      # → http://localhost:3000
npm run lint     # ESLint check
npm run build    # Production bundle validation
```

---

## Tech Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) | First-class TypeScript, file-based routing, future SSR capability |
| Language | TypeScript (strict) | Type safety at every layer eliminates ambiguity in API shapes |
| Styling | CSS Modules + CSS Custom Properties | Scoped styles, zero runtime cost, full expressive power |
| HTTP | Native `fetch` | No external dependencies; wrapped in a typed service function |

> The brief recommends Angular but permits any framework. Next.js was chosen as a deliberate senior-level decision — it matches the product's nature (form + data display), has broad industry adoption, and allows future enhancement (SSR, API routes) without major rewrites.

---

## Architecture

```
├── types/
│   └── briefing.ts             ← All domain interfaces (ReportEntry, BriefingCriteria, etc.)
│
├── utils/
│   ├── parseReportText.ts      ← Cloud-coverage tokeniser (BKN/FEW/SCT colour logic)
│   ├── formatReportTime.ts     ← UTC → Europe/Bratislava, sk-SK locale
│   ├── groupReportsByStation.ts← Map-based insertion-order-preserving grouping
│   └── validateBriefingForm.ts ← Pure validation function (all rules in one place)
│
├── services/
│   └── opmetQueryService.ts    ← Typed fetch wrapper for the JSON-RPC endpoint
│
├── components/
│   ├── BriefingForm/           ← Form orchestrator + sub-inputs
│   └── BriefingResults/        ← Results table + station groups + coloured text
│
└── app/
    ├── layout.tsx              ← Root layout (SEO metadata)
    ├── page.tsx                ← Page entry (owns results state)
    └── globals.css             ← Design tokens + global reset
```

### Component Communication

```
page.tsx (results state)
│
├── <BriefingForm>  (onResults, onQueryStart callbacks)
│   ├── <ReportTypeSelector>   controlled checkboxes
│   └── <LocationInput>        controlled text inputs (×2)
│
└── <BriefingResults>  (results: ReportEntry[])
    └── <StationGroup>  (per station in Map order)
        └── <ReportRow>  (per report entry)
            └── <ReportText>  (tokenised, coloured spans)
```

The page owns results state so that `BriefingForm` and `BriefingResults` are clean siblings — neither is aware of the other.

---

## Key Design Decisions

### Cloud Coverage Colouring (`parseReportText.ts`)

The brief requires colouring segments starting with `BKN`, `FEW`, or `SCT` followed by **exactly three digits**, applying the colour to the **entire token** (including trailing characters like `///`).

Regex used: `/\b(BKN|FEW|SCT)(\d{3})(\S*)/g`

Colour rule:
- Altitude value (integer) **≤ 30** → **blue**
- Altitude value (integer) **> 30** → **red**

The threshold 30 is named `ALTITUDE_BLUE_THRESHOLD` for explicitness.

### Station Grouping (`groupReportsByStation.ts`)

Results are grouped using `Map<string, ReportEntry[]>`. Unlike a plain object, `Map` provides an **explicit insertion-order guarantee** per the ECMAScript spec, so station ordering reliably reflects the API response order.

### Time Formatting (`formatReportTime.ts`)

Uses `Intl.DateTimeFormat('sk-SK', { timeZone: 'Europe/Bratislava' })`. The formatter instance is created **once at module level** (not per call) for performance. Handles invalid/null timestamps gracefully with a `—` fallback.

### Service Layer (`opmetQueryService.ts`)

- `stations` and `countries` keys are **omitted entirely** when empty — sending `[]` is semantically different from not sending the field.
- Three distinct error paths with user-readable messages: network failure, HTTP error, JSON-RPC error field.
- Pure async function (not a class) for ease of mocking in tests.

### Validation (`validateBriefingForm.ts`)

All validation lives in a pure function outside the component. This makes the rules independently testable and keeps the component lean. Errors are field-level (per input) plus one cross-field error for the "at least one location" rule.

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
    "countries": ["SQ"]
  }]
}
```

Note: `stations` and `countries` are omitted when empty.

---

## Potential Future Improvements

- Unit tests for `parseReportText`, `formatReportTime`, and `validateBriefingForm`
- Keyboard-accessible auto-complete for airport ICAO codes
- Persist last-used criteria to `localStorage`
- Support for printing / exporting the briefing as PDF
- Highlight expired reports (e.g. METAR older than 2 hours)
