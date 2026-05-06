import {
  Configuration,
  CountryCode,
  PlaidApi,
  PlaidEnvironments,
  Products,
} from "plaid";

const plaidEnv = process.env.PLAID_ENV || "sandbox";

const plaidClientId = process.env.PLAID_CLIENT_ID;
const plaidSecret = process.env.PLAID_SECRET;

const basePath =
  plaidEnv === "production"
    ? PlaidEnvironments.production
    : plaidEnv === "development"
      ? PlaidEnvironments.development
      : PlaidEnvironments.sandbox;

if (!plaidClientId) {
  console.warn("Missing PLAID_CLIENT_ID environment variable.");
}

if (!plaidSecret) {
  console.warn("Missing PLAID_SECRET environment variable.");
}

const configuration = new Configuration({
  basePath,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": plaidClientId || "",
      "PLAID-SECRET": plaidSecret || "",
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

export function getPlaidEnvironment() {
  return plaidEnv;
}

export function assertPlaidConfigured() {
  if (!plaidClientId || !plaidSecret) {
    throw new Error(
      "Plaid is not configured. Add PLAID_CLIENT_ID and PLAID_SECRET to .env.local, then restart the dev server.",
    );
  }
}

export function getPlaidProducts() {
  const products = (process.env.PLAID_PRODUCTS || "auth")
    .split(",")
    .map((product) => product.trim().toLowerCase())
    .filter(Boolean);

  return products.map((product) => {
    if (product === "transactions") return Products.Transactions;
    if (product === "identity") return Products.Identity;
    if (product === "balance") return Products.Balance;
    return Products.Auth;
  });
}

export function getPlaidCountryCodes() {
  const codes = (process.env.PLAID_COUNTRY_CODES || "US")
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);

  return codes.map((code) => {
    if (code === "CA") return CountryCode.Ca;
    if (code === "GB") return CountryCode.Gb;
    if (code === "ES") return CountryCode.Es;
    if (code === "FR") return CountryCode.Fr;
    if (code === "IE") return CountryCode.Ie;
    if (code === "NL") return CountryCode.Nl;
    return CountryCode.Us;
  });
}