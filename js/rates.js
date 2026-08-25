const RATES_CACHE_KEY = "currency_exch_rates_v2";
const RATES_API_URL =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/uah.json";
const RATES_API_FALLBACK_URL =
  "https://latest.currency-api.pages.dev/v1/currencies/uah.json";

const TARGET_CODES = ["usd", "eur", "gbp", "pln", "chf", "czk", "try", "cad", "jpy", "cny"];

function roundRate(value) {
  return Number(Number(value).toFixed(2));
}

function normalizeRates(rates) {
  const toUah = {};
  for (const code of Object.keys(rates.toUah || {})) {
    toUah[code] = roundRate(rates.toUah[code]);
  }
  return { ...rates, toUah };
}

function invertUahRates(uahMap) {
  const toUah = {};
  for (const code of TARGET_CODES) {
    const perUah = uahMap[code];
    if (typeof perUah === "number" && perUah > 0) {
      toUah[code.toUpperCase()] = roundRate(1 / perUah);
    }
  }
  return toUah;
}

function readCachedRates() {
  try {
    const raw = localStorage.getItem(RATES_CACHE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.toUah) {
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
}

function writeCachedRates(rates) {
  try {
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(rates));
  } catch (error) {
    // ignore quota errors
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

async function loadRates() {
  try {
    localStorage.removeItem("currency_exch_rates_v1");
  } catch (error) {
    // ignore
  }
  const cached = readCachedRates();

  try {
    let data;
    try {
      data = await fetchJson(RATES_API_URL);
    } catch (primaryError) {
      data = await fetchJson(RATES_API_FALLBACK_URL);
    }

    const toUah = invertUahRates(data.uah || {});
    if (Object.keys(toUah).length < TARGET_CODES.length) {
      throw new Error("Incomplete rate set");
    }

    const rates = {
      date: data.date || new Date().toISOString().slice(0, 10),
      source: "api",
      toUah,
    };
    writeCachedRates(rates);
    return normalizeRates(rates);
  } catch (error) {
    if (cached) {
      return normalizeRates({ ...cached, source: "cache" });
    }
    return normalizeRates({ ...RATES_FALLBACK });
  }
}

function getRateToUah(rates, code) {
  const rate = rates.toUah[code];
  if (typeof rate !== "number" || !Number.isFinite(rate)) {
    return null;
  }
  return roundRate(rate);
}
