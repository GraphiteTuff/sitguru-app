import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  assertPlaidConfigured,
  getPlaidCountryCodes,
  getPlaidProducts,
  plaidClient,
} from "@/lib/plaid";

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

async function requireAdminUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      supabase,
      user: null,
      response: NextResponse.json(
        { error: "Unauthorized. Please sign in as admin again." },
        { status: 401 },
      ),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Plaid admin profile lookup error:", profileError);

    return {
      supabase,
      user: null,
      response: NextResponse.json(
        { error: "Unable to verify admin profile." },
        { status: 500 },
      ),
    };
  }

  if (profile?.role !== "admin") {
    return {
      supabase,
      user: null,
      response: NextResponse.json(
        { error: "Admin access required." },
        { status: 403 },
      ),
    };
  }

  return {
    supabase,
    user,
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

  if (adminCheck.response || !adminCheck.user) {
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

  if (adminCheck.response || !adminCheck.user) {
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