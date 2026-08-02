import { NextResponse } from "next/server";
import {
  assertPlaidConfigured,
  getPlaidCountryCodes,
  getPlaidProducts,
  plaidClient,
} from "@/lib/plaid";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    return JSON.stringify(error.response.data);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to create Plaid Link token.";
}

function getPlaidClientName() {
  return process.env.PLAID_CLIENT_NAME?.trim() || "SitGuru";
}

function getPlaidRedirectUri() {
  const redirectUri = process.env.PLAID_REDIRECT_URI?.trim();

  if (!redirectUri) {
    return undefined;
  }

  return redirectUri;
}

async function requireAdminUser(): Promise<
  | { user: { id: string }; response: null }
  | { user: null; response: NextResponse }
> {
  const financeCheck = await requireFinanceAdminApi();

  if (!financeCheck.identity) {
    return {
      user: null,
      response: financeCheck.response,
    };
  }

  return {
    user: { id: financeCheck.identity.id },
    response: null,
  };
}

async function createPlaidLinkToken(userId: string) {
  assertPlaidConfigured();

  const redirectUri = getPlaidRedirectUri();

  const response = await plaidClient.linkTokenCreate({
    user: {
      client_user_id: userId,
    },
    client_name: getPlaidClientName(),
    products: getPlaidProducts(),
    country_codes: getPlaidCountryCodes(),
    language: "en",
    ...(redirectUri ? { redirect_uri: redirectUri } : {}),
  });

  return {
    link_token: response.data.link_token,
    expiration: response.data.expiration,
    request_id: response.data.request_id,
    plaid_environment: process.env.PLAID_ENV || "sandbox",
    plaid_products: process.env.PLAID_PRODUCTS || "auth",
    plaid_country_codes: process.env.PLAID_COUNTRY_CODES || "US",
    plaid_redirect_uri: redirectUri || null,
    plaid_client_name: getPlaidClientName(),
  };
}

export async function GET() {
  const adminCheck = await requireAdminUser();

  if (!adminCheck.user) {
    return adminCheck.response;
  }

  try {
    const payload = await createPlaidLinkToken(adminCheck.user.id);

    return NextResponse.json({
      ok: true,
      mode: "GET diagnostic",
      message:
        "Plaid Link token created successfully. POST should also work from the Plaid page.",
      ...payload,
    });
  } catch (error) {
    const message = getErrorMessage(error);

    console.error("Plaid link token diagnostic error:", message);

    return NextResponse.json(
      {
        ok: false,
        mode: "GET diagnostic",
        error: message,
        plaid_environment: process.env.PLAID_ENV || "sandbox",
        plaid_products: process.env.PLAID_PRODUCTS || "auth",
        plaid_country_codes: process.env.PLAID_COUNTRY_CODES || "US",
        plaid_redirect_uri: getPlaidRedirectUri() || null,
        plaid_client_name: getPlaidClientName(),
      },
      { status: 500 },
    );
  }
}

export async function POST() {
  const adminCheck = await requireAdminUser();

  if (!adminCheck.user) {
    return adminCheck.response;
  }

  try {
    const payload = await createPlaidLinkToken(adminCheck.user.id);

    return NextResponse.json(payload);
  } catch (error) {
    const message = getErrorMessage(error);

    console.error("Plaid link token error:", message);

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}