import { NextRequest, NextResponse } from "next/server";

function getAppUrl(request: NextRequest) {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    request.nextUrl.origin;

  return configuredUrl.replace(/\/$/, "");
}

export async function GET(request: NextRequest) {
  const appUrl = getAppUrl(request);
  const receivedRedirectUri = request.url;

  const redirectUrl = new URL("/api/plaid/start", appUrl);

  redirectUrl.searchParams.set("oauth_return", "true");
  redirectUrl.searchParams.set("received_redirect_uri", receivedRedirectUri);

  const oauthStateId = request.nextUrl.searchParams.get("oauth_state_id");
  const institutionId = request.nextUrl.searchParams.get("institution_id");
  const error = request.nextUrl.searchParams.get("error");
  const errorCode = request.nextUrl.searchParams.get("error_code");
  const errorMessage = request.nextUrl.searchParams.get("error_message");

  if (oauthStateId) {
    redirectUrl.searchParams.set("oauth_state_id", oauthStateId);
  }

  if (institutionId) {
    redirectUrl.searchParams.set("institution_id", institutionId);
  }

  if (error) {
    redirectUrl.searchParams.set("error", error);
  }

  if (errorCode) {
    redirectUrl.searchParams.set("error_code", errorCode);
  }

  if (errorMessage) {
    redirectUrl.searchParams.set("error_message", errorMessage);
  }

  return NextResponse.redirect(redirectUrl);
}