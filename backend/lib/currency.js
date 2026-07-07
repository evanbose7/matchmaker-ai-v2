// Converts the $4.99 base price into whatever currency the customer is
// actually in, using live FX rates — so Razorpay checkout shows their local
// currency instead of always USD (or worse, INR).
//
// Rates come from Frankfurter (free, no API key, ECB-sourced). Cached for an
// hour so we're not hitting it on every request. If a currency isn't
// supported by the FX source, or the fetch fails, we fall back to USD.

const BASE_PRICE_USD = 4.99;

// Currencies with 0 decimal places (Razorpay/ISO 4217 rule — no subunit multiplier)
const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND", "CLP", "ISK"]);
// Currencies with 3 decimal places (subunit is x1000, not x100)
const THREE_DECIMAL = new Set(["BHD", "KWD", "OMR"]);

// Currencies we're willing to try converting to. Keep this to currencies
// Frankfurter actually supports — anything else just falls back to USD.
const SUPPORTED = new Set([
  "USD", "EUR", "GBP", "INR", "CAD", "AUD", "NZD", "JPY", "KRW", "CNY",
  "SGD", "HKD", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "TRY",
  "MXN", "BRL", "ZAR", "THB", "PHP", "MYR", "IDR", "ILS", "RON", "BGN",
]);

let rateCache = { fetchedAt: 0, rates: null };
const CACHE_MS = 60 * 60 * 1000; // 1 hour

async function getRates() {
  if (rateCache.rates && Date.now() - rateCache.fetchedAt < CACHE_MS) {
    return rateCache.rates;
  }
  const res = await fetch("https://api.frankfurter.app/latest?from=USD");
  if (!res.ok) throw new Error("FX rate fetch failed");
  const data = await res.json();
  rateCache = { fetchedAt: Date.now(), rates: { USD: 1, ...data.rates } };
  return rateCache.rates;
}

function toSubunits(amount, currency) {
  if (ZERO_DECIMAL.has(currency)) return Math.round(amount);
  if (THREE_DECIMAL.has(currency)) return Math.round(amount * 1000);
  return Math.round(amount * 100);
}

function formatDisplay(amount, currency) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

// Returns { currency, amount (major units), subunits, display }
// `requestedCurrency` is whatever the client detected (e.g. via IP geolocation) —
// never trusted blindly; always re-derived server-side from live rates.
export async function getLocalizedPrice(requestedCurrency) {
  const currency = (requestedCurrency || "USD").toUpperCase();

  if (currency === "USD" || !SUPPORTED.has(currency)) {
    const amount = BASE_PRICE_USD;
    return { currency: "USD", amount, subunits: toSubunits(amount, "USD"), display: formatDisplay(amount, "USD") };
  }

  try {
    const rates = await getRates();
    const rate = rates[currency];
    if (!rate) throw new Error("Unsupported currency");
    const amount = Math.round(BASE_PRICE_USD * rate * 100) / 100;
    return { currency, amount, subunits: toSubunits(amount, currency), display: formatDisplay(amount, currency) };
  } catch (err) {
    console.error("FX conversion failed, falling back to USD:", err.message);
    const amount = BASE_PRICE_USD;
    return { currency: "USD", amount, subunits: toSubunits(amount, "USD"), display: formatDisplay(amount, "USD") };
  }
}