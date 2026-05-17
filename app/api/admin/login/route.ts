import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SUPER_USER_EMAILS = new Set(["jason@sitguru.com", "nette@sitguru.com"]);

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

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return redirectWithMessage(
      request,
      "error",
      "Please enter both email and password.",
    );
  }

  if (!SUPER_USER_EMAILS.has(email)) {
    return redirectWithMessage(
      request,
      "error",
      "This account is not authorized for admin access.",
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

  const verifiedEmail = String(user.email || "")
    .trim()
    .toLowerCase();

  if (!SUPER_USER_EMAILS.has(verifiedEmail)) {
    await supabase.auth.signOut();

    return redirectWithMessage(
      request,
      "error",
      "This account is not authorized for admin access.",
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    await supabase.auth.signOut();

    return redirectWithMessage(
      request,
      "error",
      `Unable to verify admin profile: ${profileError.message}`,
    );
  }

  if (profile?.role && profile.role !== "admin") {
    await supabase.auth.signOut();

    return redirectWithMessage(
      request,
      "error",
      "This account is not authorized for admin access.",
    );
  }

  const baseUrl = getBaseUrl(request);

  return NextResponse.redirect(new URL("/admin", baseUrl));
}