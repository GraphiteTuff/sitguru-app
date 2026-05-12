import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getBaseUrl(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const origin = request.headers.get("origin");

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  if (origin) {
    return origin;
  }

  return request.nextUrl.origin;
}

function redirectWithMessage(
  request: NextRequest,
  type: "error" | "status",
  message: string,
) {
  const baseUrl = getBaseUrl(request);
  const url = new URL("/admin/login", baseUrl);

  url.searchParams.set(type, message);

  return NextResponse.redirect(url);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return redirectWithMessage(
      request,
      "error",
      "Please enter both email and password.",
    );
  }

  const supabase = await createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return redirectWithMessage(
      request,
      "error",
      signInError.message || "Unable to sign in.",
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    await supabase.auth.signOut();

    return redirectWithMessage(
      request,
      "error",
      "Unable to verify your admin account.",
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    await supabase.auth.signOut();

    return redirectWithMessage(
      request,
      "error",
      `Unable to verify admin profile: ${profileError.message}`,
    );
  }

  if (profile?.role !== "admin") {
    await supabase.auth.signOut();

    return redirectWithMessage(
      request,
      "error",
      "This account is not authorized for admin access.",
    );
  }

  const { data: aalData, error: aalError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aalError) {
    return redirectWithMessage(
      request,
      "error",
      aalError.message || "Unable to verify MFA status.",
    );
  }

  const baseUrl = getBaseUrl(request);

  if (aalData?.currentLevel === "aal2") {
    return NextResponse.redirect(new URL("/admin", baseUrl));
  }

  if (aalData?.nextLevel === "aal2") {
    return NextResponse.redirect(
      new URL("/admin/security/mfa/challenge", baseUrl),
    );
  }

  return NextResponse.redirect(new URL("/admin/security/mfa", baseUrl));
}