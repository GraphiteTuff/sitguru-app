import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isHardcodedSuperUserEmail,
  normalizeAdminEmail,
} from "@/lib/admin/super-users";

type SafeFormData = {
  get(name: string): unknown;
};

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

  return NextResponse.redirect(url, 303);
}

export async function POST(request: NextRequest) {
  const formData = (await request.formData()) as unknown as SafeFormData;

  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  const email =
    typeof rawEmail === "string" ? normalizeAdminEmail(rawEmail) : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";

  if (!email || !password) {
    return redirectWithMessage(
      request,
      "error",
      "Please enter both email and password.",
    );
  }

  if (!isHardcodedSuperUserEmail(email)) {
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

  const verifiedEmail = normalizeAdminEmail(user.email);

  if (!isHardcodedSuperUserEmail(verifiedEmail)) {
    await supabase.auth.signOut();

    return redirectWithMessage(
      request,
      "error",
      "This account is not authorized for admin access.",
    );
  }

  // jason@ / nette@ are HQ Super Users. The same Jason account is also a
  // Pet Parent (profiles.role = customer). Proxy already allows Admin by
  // email; do not sign out after a successful password check.
  const baseUrl = getBaseUrl(request);

  return NextResponse.redirect(new URL("/admin", baseUrl), 303);
}
