import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminIdentity } from "@/lib/admin/access";
import { adminLoginDestination } from "@/lib/admin/growth-paths";
import { normalizeAdminEmail } from "@/lib/admin/super-users";

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

  const identity = await getAdminIdentity();

  if (!identity?.canAccessAdmin || identity.id !== user.id) {
    await supabase.auth.signOut();

    return redirectWithMessage(
      request,
      "error",
      "This account is not authorized for admin access.",
    );
  }

  const baseUrl = getBaseUrl(request);
  const destination = adminLoginDestination({
    role: identity.role,
    isSuperUser: identity.isSuperUser,
    portalAreas: identity.portalAreas,
  });

  return NextResponse.redirect(new URL(destination, baseUrl), 303);
}
