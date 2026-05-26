/**
 * decodeReport.ts
 *
 * A robust, error-tolerant domain parser that decodes aviation weather syntax
 * (METAR and TAF) into clean, visual-friendly TS interfaces for the Detailed Dashboard.
 */

export interface DecodedWind {
  direction: string; // e.g. "350" or "VRB"
  speed: number;     // knots
  gusts?: number;    // knots
  variation?: {
    from: string;
    to: string;
  };
  raw: string;
}

export interface DecodedCloud {
  coverage: string;  // e.g. "FEW", "SCT", "BKN", "OVC"
  altitude: number;  // in feet
  raw: string;
}

export interface DecodedMetar {
  stationId: string;
  time: string;
  wind?: DecodedWind;
  visibility?: {
    raw: string;
    decoded: string;
    isCavok: boolean;
    valueMeters?: number;
  };
  clouds: DecodedCloud[];
  temperature?: number;
  dewPoint?: number;
  humidity?: number; // relative humidity %
  qnh?: {
    value: number;
    unit: "hPa" | "inHg";
  };
  weatherPhenomena: string[];
  flightCategory: "VFR" | "MVFR" | "IFR" | "LIFR";
  trend?: string;
  rawText: string;
}

export interface TafChangeGroup {
  type: string; // "BECMG" | "TEMPO" | "FM" | "PROB30" etc.
  period: string; // e.g., "19:00 - 21:00 UTC"
  rawText: string;
  decoded: string;
}

export interface DecodedTaf {
  stationId: string;
  issueTime: string;
  validity: string;
  baseForecast: {
    wind?: DecodedWind;
    visibility?: string;
    clouds: DecodedCloud[];
    weather?: string;
  };
  changes: TafChangeGroup[];
  rawText: string;
}

// ---------------------------------------------------------------------------
// Weather abbreviations mappings
// ---------------------------------------------------------------------------
const WEATHER_CODES: Record<string, string> = {
  DZ: "Drizzle",
  RA: "Rain",
  SN: "Snow",
  SG: "Snow Grains",
  IC: "Ice Crystals",
  PL: "Ice Pellets",
  GR: "Hail",
  GS: "Small Hail",
  UP: "Unknown Precipitation",
  BR: "Mist",
  FG: "Fog",
  FU: "Smoke",
  VA: "Volcanic Ash",
  DU: "Dust",
  SA: "Sand",
  HZ: "Haze",
  PY: "Spray",
  PO: "Dust Devils",
  SQ: "Squalls",
  FC: "Funnel Cloud (Tornado/Waterspout)",
  SS: "Sandstorm",
  DS: "Duststorm",
  TS: "Thunderstorm",
  SH: "Showers",
  FZ: "Freezing",
};

// ---------------------------------------------------------------------------
// Helper: Parse temperature/dew point values including minus (e.g. M02)
// ---------------------------------------------------------------------------
function parseTemperature(text: string): number {
  if (text.startsWith("M")) {
    return -parseInt(text.slice(1), 10);
  }
  return parseInt(text, 10);
}

// ---------------------------------------------------------------------------
// Helper: Calculate Humidity using Magnus-Tetens formula
// ---------------------------------------------------------------------------
export function calculateHumidity(temp: number, dewPoint: number): number {
  const t = temp;
  const td = dewPoint;
  const es = 6.112 * Math.exp((17.67 * t) / (t + 243.5));
  const e = 6.112 * Math.exp((17.67 * td) / (td + 243.5));
  const rh = Math.round((e / es) * 100);
  return Math.min(100, Math.max(0, rh));
}

// ---------------------------------------------------------------------------
// Helper: Parse Cloud Group
// ---------------------------------------------------------------------------
function parseClouds(tokens: string[]): DecodedCloud[] {
  const clouds: DecodedCloud[] = [];
  const cloudRe = /\b(FEW|SCT|BKN|OVC)(\d{3})(\S*)\b/;
  for (const token of tokens) {
    const match = cloudRe.exec(token);
    if (match) {
      const [, coverage, altStr] = match;
      const altitude = parseInt(altStr, 10) * 100;
      clouds.push({ coverage, altitude, raw: token });
    }
  }
  return clouds;
}

// ---------------------------------------------------------------------------
// Helper: Parse Wind Group
// ---------------------------------------------------------------------------
function parseWind(tokens: string[]): { wind?: DecodedWind; variation?: { from: string; to: string } } {
  let wind: DecodedWind | undefined;
  let variation: { from: string; to: string } | undefined;

  const windRe = /\b(VRB|\d{3})(\d{2})(?:G(\d{2}))?KT\b/;
  const varRe = /\b(\d{3})V(\d{3})\b/;

  for (const token of tokens) {
    const wMatch = windRe.exec(token);
    if (wMatch) {
      const [, dir, speedStr, gustStr] = wMatch;
      wind = {
        direction: dir,
        speed: parseInt(speedStr, 10),
        gusts: gustStr ? parseInt(gustStr, 10) : undefined,
        raw: token,
      };
    }
    const vMatch = varRe.exec(token);
    if (vMatch) {
      const [, from, to] = vMatch;
      variation = { from, to };
    }
  }

  if (wind && variation) {
    wind.variation = variation;
  }

  return { wind };
}

// ---------------------------------------------------------------------------
// METAR DECODER
// ---------------------------------------------------------------------------
export function decodeMetar(text: string): DecodedMetar {
  const cleanText = text.replace(/=$/, "").trim();
  const tokens = cleanText.split(/\s+/);

  // Initial setup
  const stationId = tokens[0] || "UNKNOWN";
  const time = tokens[1] || "";

  // 1. Wind
  const { wind } = parseWind(tokens);

  // 2. Visibility
  let visibility: DecodedMetar["visibility"];
  let isCavok = false;
  let valueMeters: number | undefined;

  if (tokens.includes("CAVOK")) {
    isCavok = true;
    visibility = { raw: "CAVOK", decoded: "CAVOK (Ceiling & Vis OK)", isCavok: true, valueMeters: 9999 };
  } else {
    // Look for 9999, 5000, 0800, etc. or SM values
    const visMeterMatch = tokens.find(t => /^\d{4}$/.test(t));
    const visSMMatch = tokens.find(t => /^\d+SM$/.test(t) || /^\d+\/\d+SM$/.test(t));

    if (visMeterMatch) {
      const meters = parseInt(visMeterMatch, 10);
      valueMeters = meters;
      const dec = meters >= 9999 ? "10 km or more" : `${meters} m`;
      visibility = { raw: visMeterMatch, decoded: dec, isCavok: false, valueMeters };
    } else if (visSMMatch) {
      visibility = { raw: visSMMatch, decoded: visSMMatch, isCavok: false };
    }
  }

  // 3. Clouds
  const clouds = parseClouds(tokens);

  // 4. Temperature & Dew Point
  let temperature: number | undefined;
  let dewPoint: number | undefined;
  let humidity: number | undefined;

  const tempMatch = tokens.find(t => /^\b(M?\d{2})\/(M?\d{2})\b$/.test(t));
  if (tempMatch) {
    const [tStr, dpStr] = tempMatch.split("/");
    temperature = parseTemperature(tStr);
    dewPoint = parseTemperature(dpStr);
    humidity = calculateHumidity(temperature, dewPoint);
  }

  // 5. Altimeter / QNH
  let qnh: DecodedMetar["qnh"];
  const qnhMatch = tokens.find(t => /^[Q|A]\d{4}$/.test(t));
  if (qnhMatch) {
    const unit = qnhMatch.startsWith("Q") ? "hPa" : "inHg";
    const value = parseInt(qnhMatch.slice(1), 10);
    qnh = { value, unit };
  }

  // 6. Weather Phenomena
  const weatherPhenomena: string[] = [];
  const weatherRe = /^([+-])?(VC)?(MI|PR|BC|DR|BL|SH|TS|FZ)?(DZ|RA|SN|SG|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|SS|DS)$/;
  for (const token of tokens) {
    const match = weatherRe.exec(token);
    if (match) {
      const [, intensity, proximity, descriptor, code] = match;
      const intensText = intensity === "+" ? "Heavy" : intensity === "-" ? "Light" : "";
      const proxText = proximity === "VC" ? "Vicinity" : "";
      const descText = descriptor === "TS" ? "Thunderstorm" : descriptor === "SH" ? "Showers" : descriptor === "FZ" ? "Freezing" : "";
      const codeText = WEATHER_CODES[code] || code;

      const fullDesc = [intensText, proxText, descText, codeText].filter(Boolean).join(" ");
      weatherPhenomena.push(`${token} (${fullDesc})`);
    }
  }

  // 7. Flight Category Calculation
  let flightCategory: DecodedMetar["flightCategory"] = "VFR";
  
  // Find ceiling (lowest BKN or OVC layer)
  const ceilingLayers = clouds.filter(c => c.coverage === "BKN" || c.coverage === "OVC");
  const ceilingAlt = ceilingLayers.length > 0 ? Math.min(...ceilingLayers.map(l => l.altitude)) : Infinity;

  // Visibility threshold in miles/meters conversion:
  // LIFR: Vis < 1 SM (1600m) or Ceiling < 500 ft
  // IFR: Vis 1-3 SM (1600-4800m) or Ceiling 500-1000 ft
  // MVFR: Vis 3-5 SM (4800-8000m) or Ceiling 1000-3000 ft
  // VFR: Vis > 5 SM (>8000m) and Ceiling > 3000 ft (or CAVOK)

  if (isCavok) {
    flightCategory = "VFR";
  } else {
    const visM = valueMeters !== undefined ? valueMeters : 9999;
    
    // Categorize
    if (ceilingAlt < 500 || visM < 1600) {
      flightCategory = "LIFR";
    } else if (ceilingAlt < 1000 || visM < 4800) {
      flightCategory = "IFR";
    } else if (ceilingAlt <= 3000 || visM <= 8000) {
      flightCategory = "MVFR";
    } else {
      flightCategory = "VFR";
    }
  }

  // 8. Trend
  const trendIndex = tokens.findIndex(t => ["NOSIG", "BECMG", "TEMPO"].includes(t));
  let trend: string | undefined;
  if (trendIndex !== -1) {
    trend = tokens.slice(trendIndex).join(" ");
  }

  return {
    stationId,
    time,
    wind,
    visibility,
    clouds,
    temperature,
    dewPoint,
    humidity,
    qnh,
    weatherPhenomena,
    flightCategory,
    trend,
    rawText: text,
  };
}

// ---------------------------------------------------------------------------
// TAF DECODER
// ---------------------------------------------------------------------------
export function decodeTaf(text: string): DecodedTaf {
  const cleanText = text.replace(/=$/, "").trim();
  
  // Clean newlines but keep track of segments. TAF blocks can be separated by BECMG/TEMPO
  // We can look for keywords and separate the raw text into sections
  const keywords = ["BECMG", "TEMPO", "FM", "PROB30", "PROB40"];
  const tokens = cleanText.split(/\s+/);
  
  const stationId = tokens[0] || "UNKNOWN";
  const issueTime = tokens[1] || "";
  const validity = tokens[2] || "";

  // Find the split indices of change groups
  const sections: { type: string; start: number }[] = [];
  tokens.forEach((token, idx) => {
    if (keywords.includes(token) || token.startsWith("FM")) {
      let type = token;
      if (token.startsWith("FM")) {
        type = "FM";
      }
      sections.push({ type, start: idx });
    }
  });

  // Base forecast is everything up to the first section
  const firstSectionStart = sections.length > 0 ? sections[0].start : tokens.length;
  const baseTokens = tokens.slice(0, firstSectionStart);

  // Decode Base Forecast details
  const { wind: baseWind } = parseWind(baseTokens);
  
  let baseVisibility = "";
  if (baseTokens.includes("CAVOK")) {
    baseVisibility = "CAVOK";
  } else {
    const vis = baseTokens.find(t => /^\d{4}$/.test(t) || /^\d+SM$/.test(t));
    if (vis) baseVisibility = vis;
  }

  const baseClouds = parseClouds(baseTokens);

  // Decode Change groups
  const changes: TafChangeGroup[] = [];
  sections.forEach((sec, index) => {
    const end = index + 1 < sections.length ? sections[index + 1].start : tokens.length;
    const groupTokens = tokens.slice(sec.start, end);
    const rawGroupText = groupTokens.join(" ");

    let period = "";
    let decoded = "";

    // Specific keyword parsers
    if (sec.type === "BECMG" || sec.type === "TEMPO") {
      const timePeriod = groupTokens[1] || "";
      if (/^\d{4}\/\d{4}$/.test(timePeriod)) {
        const [start, endT] = timePeriod.split("/");
        const startDay = parseInt(start.slice(0, 2), 10);
        const startHour = start.slice(2, 4);
        const endDay = parseInt(endT.slice(0, 2), 10);
        const endHour = endT.slice(2, 4);

        period = `${startDay}th ${startHour}:00 - ${endDay}th ${endHour}:00 UTC`;
      } else {
        period = timePeriod;
      }
      
      const details = groupTokens.slice(2).join(" ");
      decoded = `${sec.type === "BECMG" ? "Becoming" : "Temporarily"}: ${details}`;
    } else if (sec.type === "FM") {
      const fmToken = groupTokens[0];
      const timeStr = fmToken.slice(2); // e.g. "260800" -> 26th day 08:00
      if (timeStr.length === 6) {
        const day = parseInt(timeStr.slice(0, 2), 10);
        const hour = timeStr.slice(2, 4);
        const min = timeStr.slice(4, 6);
        period = `From ${day}th ${hour}:${min} UTC`;
      } else {
        period = fmToken;
      }
      const details = groupTokens.slice(1).join(" ");
      decoded = `From then: ${details}`;
    } else if (sec.type.startsWith("PROB")) {
      const timePeriod = groupTokens[1] || "";
      period = timePeriod;
      const details = groupTokens.slice(2).join(" ");
      decoded = `Probability ${sec.type.slice(4)}%: ${details}`;
    }

    changes.push({
      type: sec.type,
      period,
      rawText: rawGroupText,
      decoded,
    });
  });

  // Format validity
  let validityFormatted = validity;
  if (/^\d{4}\/\d{4}$/.test(validity)) {
    const [start, end] = validity.split("/");
    validityFormatted = `${start.slice(0, 2)}th ${start.slice(2, 4)}Z to ${end.slice(0, 2)}th ${end.slice(2, 4)}Z`;
  }

  return {
    stationId,
    issueTime,
    validity: validityFormatted,
    baseForecast: {
      wind: baseWind,
      visibility: baseVisibility,
      clouds: baseClouds,
    },
    changes,
    rawText: text,
  };
}
