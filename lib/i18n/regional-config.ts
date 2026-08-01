/**
 * SitGuru regional configuration — Rover-aligned expansion set:
 * UK, Ireland, France, Spain, Germany, Denmark, Norway, Sweden
 * (+ US kept as default / legacy marketplace).
 */

export type RegionalCountryCode =
  | "GB"
  | "IE"
  | "FR"
  | "ES"
  | "DE"
  | "DK"
  | "NO"
  | "SE"
  | "US";

export type RegionalCurrencyCode =
  | "GBP"
  | "EUR"
  | "DKK"
  | "NOK"
  | "SEK"
  | "USD";

export type RegionalConfig = {
  countryCode: RegionalCountryCode;
  countryName: string;
  currency: RegionalCurrencyCode;
  /** ISO lowercase for Stripe */
  currencyIso: Lowercase<RegionalCurrencyCode>;
  currencySymbol: string;
  /** Locale for Intl.NumberFormat */
  locale: string;
  /** Human label for postal field */
  postalLabel: string;
  /** Elastic postal regex — alphanumeric + spaces/hyphens allowed */
  postalPattern: RegExp;
  postalExample: string;
  phoneCountryCode: string;
  regionGroup: "uk" | "eurozone" | "scandinavia" | "north_america";
};

export const REGIONAL_CONFIGS: RegionalConfig[] = [
  {
    countryCode: "GB",
    countryName: "United Kingdom",
    currency: "GBP",
    currencyIso: "gbp",
    currencySymbol: "£",
    locale: "en-GB",
    postalLabel: "Postcode",
    // Outward + inward codes: SW1A 1AA, EC1A 1BB, W1A 0AX, M1 1AE, B33 8TH, CR2 6XH, DN55 1PT
    postalPattern:
      /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
    postalExample: "SW1A 1AA",
    phoneCountryCode: "+44",
    regionGroup: "uk",
  },
  {
    countryCode: "IE",
    countryName: "Ireland",
    currency: "EUR",
    currencyIso: "eur",
    currencySymbol: "€",
    locale: "en-IE",
    postalLabel: "Eircode",
    postalPattern: /^[A-Z\d]{3}\s?[A-Z\d]{4}$/i,
    postalExample: "D02 AF30",
    phoneCountryCode: "+353",
    regionGroup: "eurozone",
  },
  {
    countryCode: "FR",
    countryName: "France",
    currency: "EUR",
    currencyIso: "eur",
    currencySymbol: "€",
    locale: "fr-FR",
    postalLabel: "Code postal",
    postalPattern: /^\d{5}$/,
    postalExample: "75001",
    phoneCountryCode: "+33",
    regionGroup: "eurozone",
  },
  {
    countryCode: "ES",
    countryName: "Spain",
    currency: "EUR",
    currencyIso: "eur",
    currencySymbol: "€",
    locale: "es-ES",
    postalLabel: "Código postal",
    postalPattern: /^\d{5}$/,
    postalExample: "28001",
    phoneCountryCode: "+34",
    regionGroup: "eurozone",
  },
  {
    countryCode: "DE",
    countryName: "Germany",
    currency: "EUR",
    currencyIso: "eur",
    currencySymbol: "€",
    locale: "de-DE",
    postalLabel: "Postleitzahl",
    postalPattern: /^\d{5}$/,
    postalExample: "10115",
    phoneCountryCode: "+49",
    regionGroup: "eurozone",
  },
  {
    countryCode: "DK",
    countryName: "Denmark",
    currency: "DKK",
    currencyIso: "dkk",
    currencySymbol: "kr.",
    locale: "da-DK",
    postalLabel: "Postnummer",
    postalPattern: /^\d{4}$/,
    postalExample: "2100",
    phoneCountryCode: "+45",
    regionGroup: "scandinavia",
  },
  {
    countryCode: "NO",
    countryName: "Norway",
    currency: "NOK",
    currencyIso: "nok",
    currencySymbol: "kr.",
    locale: "nb-NO",
    postalLabel: "Postnummer",
    postalPattern: /^\d{4}$/,
    postalExample: "0150",
    phoneCountryCode: "+47",
    regionGroup: "scandinavia",
  },
  {
    countryCode: "SE",
    countryName: "Sweden",
    currency: "SEK",
    currencyIso: "sek",
    currencySymbol: "kr.",
    locale: "sv-SE",
    postalLabel: "Postnummer",
    postalPattern: /^\d{3}\s?\d{2}$/,
    postalExample: "111 22",
    phoneCountryCode: "+46",
    regionGroup: "scandinavia",
  },
];

/** Legacy / default marketplace region */
export const DEFAULT_REGIONAL_CONFIG: RegionalConfig = {
  countryCode: "US",
  countryName: "United States",
  currency: "USD",
  currencyIso: "usd",
  currencySymbol: "$",
  locale: "en-US",
  postalLabel: "ZIP code",
  postalPattern: /^\d{5}(-\d{4})?$/,
  postalExample: "10001",
  phoneCountryCode: "+1",
  regionGroup: "north_america",
};

const COUNTRY_ALIASES: Record<string, RegionalCountryCode> = {
  gb: "GB",
  uk: "GB",
  "united kingdom": "GB",
  england: "GB",
  scotland: "GB",
  wales: "GB",
  ie: "IE",
  ireland: "IE",
  fr: "FR",
  france: "FR",
  es: "ES",
  spain: "ES",
  de: "DE",
  germany: "DE",
  deutschland: "DE",
  dk: "DK",
  denmark: "DK",
  no: "NO",
  norway: "NO",
  se: "SE",
  sweden: "SE",
  us: "US",
  usa: "US",
  "united states": "US",
  "united states of america": "US",
};

export function normalizeCountryCode(
  value: unknown,
): RegionalCountryCode | null {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw) return null;
  return COUNTRY_ALIASES[raw] || null;
}

export function getRegionalConfig(
  country: unknown,
): RegionalConfig {
  const code = normalizeCountryCode(country);
  if (!code) return DEFAULT_REGIONAL_CONFIG;
  if (code === "US") return DEFAULT_REGIONAL_CONFIG;
  return (
    REGIONAL_CONFIGS.find((row) => row.countryCode === code) ||
    DEFAULT_REGIONAL_CONFIG
  );
}

export function getCurrencyIsoForCountry(country: unknown) {
  return getRegionalConfig(country).currencyIso;
}

export function formatRegionalMoney(
  amount: number,
  countryOrCurrency: unknown,
) {
  const byCountry = getRegionalConfig(countryOrCurrency);
  const currencyGuess = String(countryOrCurrency || "")
    .trim()
    .toUpperCase();
  const matchedCurrency = REGIONAL_CONFIGS.find(
    (row) => row.currency === currencyGuess,
  );
  const config = matchedCurrency || byCountry;

  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
  }).format(Number(amount) || 0);
}

/**
 * Resolve marketplace region from request + account hints.
 * Priority: explicit country → account country → Cloudflare / Vercel geo → Accept-Language → US.
 */
export function resolveRegionalConfig(params: {
  country?: unknown;
  accountCountry?: unknown;
  headers?: Headers | Record<string, string | null | undefined> | null;
  acceptLanguage?: string | null;
}): RegionalConfig {
  const headerGet = (key: string) => {
    if (!params.headers) return "";
    if (typeof (params.headers as Headers).get === "function") {
      return (params.headers as Headers).get(key) || "";
    }
    const record = params.headers as Record<string, string | null | undefined>;
    return record[key] || record[key.toLowerCase()] || "";
  };

  const geoCountry =
    headerGet("x-vercel-ip-country") ||
    headerGet("cf-ipcountry") ||
    headerGet("x-country-code");

  const languageHint = (
    params.acceptLanguage ||
    headerGet("accept-language") ||
    ""
  )
    .split(",")[0]
    ?.trim()
    .toLowerCase();

  const languageCountry =
    languageHint?.includes("-gb") || languageHint === "en-gb"
      ? "GB"
      : languageHint?.startsWith("fr")
        ? "FR"
        : languageHint?.startsWith("es")
          ? "ES"
          : languageHint?.startsWith("de")
            ? "DE"
            : languageHint?.startsWith("da")
              ? "DK"
              : languageHint?.startsWith("nb") || languageHint?.startsWith("nn")
                ? "NO"
                : languageHint?.startsWith("sv")
                  ? "SE"
                  : languageHint === "ga" || languageHint?.startsWith("en-ie")
                    ? "IE"
                    : null;

  return getRegionalConfig(
    params.country ||
      params.accountCountry ||
      geoCountry ||
      languageCountry ||
      "US",
  );
}

/** Convert major units → Stripe minor units for supported currencies. */
export function toStripeAmountCents(
  majorUnits: number,
  currencyIso: string,
) {
  const iso = String(currencyIso || "usd").toLowerCase();
  // All SitGuru expansion currencies use 2 decimal places in Stripe.
  void iso;
  return Math.round((Number(majorUnits) || 0) * 100);
}

/**
 * Elastic postal validation:
 * - If country known → use that nation's pattern
 * - Otherwise accept international alphanumeric postals (spaces/hyphens OK)
 */
export function isValidPostalCode(
  value: string,
  country?: unknown,
): boolean {
  const cleaned = String(value || "").trim();
  if (!cleaned) return false;
  if (cleaned.length < 2 || cleaned.length > 16) return false;

  const code = normalizeCountryCode(country);
  if (code) {
    const config = getRegionalConfig(code);
    return config.postalPattern.test(cleaned);
  }

  // International elastic fallback (non-US alphanumeric postals)
  return /^[A-Z0-9][A-Z0-9\s-]{1,14}[A-Z0-9]$/i.test(cleaned);
}

/**
 * Elastic phone validation — allows +, spaces, dashes, parentheses.
 * Accepts 8–15 digits (E.164 range) after stripping formatting.
 */
export function isValidInternationalPhone(value: string): boolean {
  const raw = String(value || "").trim();
  if (!raw) return false;
  if (!/^[+\d][\d\s()./-]*$/.test(raw)) return false;
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

/** Soft format: preserve international input; lightly normalize US 10-digit only. */
export function formatFlexiblePhone(value: string): string {
  const raw = String(value || "");
  const hasPlus = raw.trim().startsWith("+");
  const digits = raw.replace(/\D/g, "");

  // Keep international / long numbers mostly intact (spaces allowed)
  if (hasPlus || digits.length > 10 || digits.length < 10) {
    return raw.replace(/[^\d+\s()./-]/g, "").slice(0, 24);
  }

  // US-style convenience formatting when exactly 10 digits and no +
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export function listSupportedExpansionCountries() {
  return REGIONAL_CONFIGS.map((row) => ({
    countryCode: row.countryCode,
    countryName: row.countryName,
    currency: row.currency,
    currencySymbol: row.currencySymbol,
  }));
}
