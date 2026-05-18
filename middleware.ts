import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const SUPER_USER_EMAILS = new Set(["jason@sitguru.com", "nette@sitguru.com"]);

function normalizeValue(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function normalizeEmail(value: string | null | undefined) {
  return normalizeValue(value);
}

function isSuperUserEmail(email: string | null | undefined) {
  return SUPER_USER_EMAILS.has(normalizeEmail(email));
}

function isAdminLoginPath(pathname: string) {
  return pathname === "/admin/login";
}

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isGuruLoginPath(pathname: string) {
  return pathname === "/guru/login" || pathname === "/guru/signup";
}

function isProtectedAdminPath(pathname: string) {
  return isAdminPath(pathname) && !isAdminLoginPath(pathname);
}

function isProtectedGuruDashboardPath(pathname: string) {
  return pathname === "/guru/dashboard" || pathname.startsWith("/guru/dashboard/");
}

function isPasswordRecoveryPath(pathname: string) {
  return (
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/auth/recover" ||
    pathname === "/auth/callback" ||
    pathname.startsWith("/auth/recover/") ||
    pathname.startsWith("/auth/callback/")
  );
}

function makeSessionCookieOptions(options: CookieOptions): CookieOptions {
  const sessionOptions = {
    ...options,
    path: options.path || "/",
    sameSite: options.sameSite || "lax",
  } as CookieOptions & {
    expires?: Date;
    maxAge?: number;
  };

  if (typeof sessionOptions.maxAge === "number" && sessionOptions.maxAge <= 0) {
    return sessionOptions;
  }

  delete sessionOptions.maxAge;
  delete sessionOptions.expires;

  return sessionOptions;
}

function expireSupabaseCookies(request: NextRequest, response: NextResponse) {
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.set({
        name: cookie.name,
        value: "",
        path: "/",
        maxAge: 0,
      });
    }
  }
}

function isGuruRole(role: string | null | undefined) {
  const normalized = normalizeValue(role);

  return [
    "guru",
    "pet_guru",
    "pet-care-guru",
    "pet_care_guru",
    "provider",
    "sitter",
    "walker",
    "caregiver",
  ].includes(normalized);
}

function isCustomerRole(role: string | null | undefined) {
  const normalized = normalizeValue(role);

  return [
    "customer",
    "pet_parent",
    "pet-parent",
    "pet parent",
    "pet_owner",
    "pet-owner",
    "pet owner",
    "parent",
  ].includes(normalized);
}

function isBothRole(role: string | null | undefined) {
  const normalized = normalizeValue(role);

  return [
    "both",
    "customer_guru",
    "customer-guru",
    "pet_parent_and_guru",
    "pet-parent-and-guru",
    "pet_owner_and_guru",
    "pet-owner-and-guru",
  ].includes(normalized);
}

function makeRedirectUrl({
  request,
  pathname,
  nextPath,
  error,
}: {
  request: NextRequest;
  pathname: string;
  nextPath?: string;
  error?: string;
}) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  redirectUrl.search = "";

  if (nextPath) {
    redirectUrl.searchParams.set("next", nextPath);
  }

  if (error) {
    redirectUrl.searchParams.set("error", error);
  }

  return redirectUrl;
}

function createSupabaseMiddlewareClient(
  request: NextRequest,
  responseRef: {
    current: NextResponse;
  },
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          const sessionOptions = makeSessionCookieOptions(options);

          request.cookies.set({
            name,
            value,
            ...sessionOptions,
          });

          responseRef.current = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          responseRef.current.cookies.set({
            name,
            value,
            ...sessionOptions,
          });
        },
        remove(name: string, options: CookieOptions) {
          const removalOptions = {
            ...options,
            path: options.path || "/",
            maxAge: 0,
          } as CookieOptions;

          request.cookies.set({
            name,
            value: "",
            ...removalOptions,
          });

          responseRef.current = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          responseRef.current.cookies.set({
            name,
            value: "",
            ...removalOptions,
          });
        },
      },
    },
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPasswordRecoveryPath(pathname)) {
    return NextResponse.next();
  }

  const requiresAdminAccess = isProtectedAdminPath(pathname);
  const requiresGuruAccess =
    isProtectedGuruDashboardPath(pathname) && !isGuruLoginPath(pathname);

  if (!requiresAdminAccess && !requiresGuruAccess) {
    return NextResponse.next();
  }

  const responseRef = {
    current: NextResponse.next({
      request: {
        headers: request.headers,
      },
    }),
  };

  const supabase = createSupabaseMiddlewareClient(request, responseRef);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    if (requiresAdminAccess) {
      return NextResponse.redirect(
        makeRedirectUrl({
          request,
          pathname: "/admin/login",
          nextPath: pathname,
        }),
      );
    }

    return NextResponse.redirect(
      makeRedirectUrl({
        request,
        pathname: "/guru/login",
        nextPath: pathname,
      }),
    );
  }

  const userEmail = normalizeEmail(user.email);
  const isSuperUser = isSuperUserEmail(userEmail);

  if (requiresAdminAccess && isSuperUser) {
    return responseRef.current;
  }

  if (requiresAdminAccess && !isSuperUser) {
    await supabase.auth.signOut();

    const redirectResponse = NextResponse.redirect(
      makeRedirectUrl({
        request,
        pathname: "/admin/login",
        error: "This account is not authorized for admin access.",
      }),
    );

    expireSupabaseCookies(request, redirectResponse);

    return redirectResponse;
  }

  if (requiresGuruAccess && isSuperUser) {
    return responseRef.current;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .maybeSingle();

  const profileRole = String(profile?.role || "").toLowerCase();

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roles = (roleRows || [])
    .map((row) => String(row.role || "").trim().toLowerCase())
    .filter(Boolean);

  const hasGuruRole =
    isGuruRole(profileRole) ||
    isBothRole(profileRole) ||
    roles.some((role) => isGuruRole(role) || isBothRole(role));

  const hasCustomerRole =
    isCustomerRole(profileRole) ||
    isBothRole(profileRole) ||
    roles.some((role) => isCustomerRole(role) || isBothRole(role));

  let hasGuruRow = false;

  if (requiresGuruAccess && !hasGuruRole) {
    const { data: guruRow } = await supabase
      .from("gurus")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    hasGuruRow = Boolean(guruRow?.id);
  }

  if (requiresGuruAccess && !hasGuruRole && !hasGuruRow) {
    const applicationUrl = makeRedirectUrl({
      request,
      pathname: "/guru/application",
    });

    applicationUrl.searchParams.set("from", "guru-dashboard");
    applicationUrl.searchParams.set(
      "reason",
      hasCustomerRole ? "customer-only" : "guru-access-required",
    );

    return NextResponse.redirect(applicationUrl);
  }

  return responseRef.current;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};