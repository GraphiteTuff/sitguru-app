import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const fallbackRoutes = {
  customerProfile: "/customer/dashboard/profile",
  guruProfile: "/guru/dashboard/profile",
  resetPassword: "/reset-password",
  signup: "/signup",
};

function getSafeNextPath(nextParam: string | null, type: string | null) {
  if (type === "recovery") {
    return fallbackRoutes.resetPassword;
  }

  if (!nextParam) {
    return fallbackRoutes.signup;
  }

  try {
    const decodedNext = decodeURIComponent(nextParam);

    if (!decodedNext.startsWith("/")) {
      return fallbackRoutes.signup;
    }

    if (decodedNext.startsWith("//")) {
      return fallbackRoutes.signup;
    }

    return decodedNext;
  } catch {
    return fallbackRoutes.signup;
  }
}

function getRoleRedirectPath(role: string | null) {
  if (role === "guru") return fallbackRoutes.guruProfile;
  if (role === "customer" || role === "pet_parent") {
    return fallbackRoutes.customerProfile;
  }

  return null;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const nextParam = requestUrl.searchParams.get("next");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const errorUrl = new URL(fallbackRoutes.signup, requestUrl.origin);
      errorUrl.searchParams.set("auth_error", error.message);
      return NextResponse.redirect(errorUrl);
    }
  }

  if (type === "recovery") {
    return NextResponse.redirect(
      new URL(fallbackRoutes.resetPassword, requestUrl.origin),
    );
  }

  const safeNextPath = getSafeNextPath(nextParam, type);

  if (nextParam) {
    return NextResponse.redirect(new URL(safeNextPath, requestUrl.origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const metadataRole =
    typeof user?.user_metadata?.role === "string"
      ? user.user_metadata.role
      : typeof user?.user_metadata?.account_type === "string"
        ? user.user_metadata.account_type
        : null;

  const metadataRedirect = getRoleRedirectPath(metadataRole);

  if (metadataRedirect) {
    return NextResponse.redirect(new URL(metadataRedirect, requestUrl.origin));
  }

  return NextResponse.redirect(new URL(fallbackRoutes.signup, requestUrl.origin));
}