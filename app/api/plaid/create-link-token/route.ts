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

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in as admin again." },
      { status: 401 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Plaid admin profile lookup error:", profileError);

    return NextResponse.json(
      { error: "Unable to verify admin profile." },
      { status: 500 },
    );
  }

  if (profile?.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  }

  try {
    assertPlaidConfigured();

    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: user.id,
      },
      client_name: "SitGuru",
      products: getPlaidProducts(),
      country_codes: getPlaidCountryCodes(),
      language: "en",
    });

    return NextResponse.json({
      link_token: response.data.link_token,
      expiration: response.data.expiration,
      request_id: response.data.request_id,
    });
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