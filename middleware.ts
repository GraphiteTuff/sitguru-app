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

function isGuruLoginPath(pathname: string) {
  return pathname === "/guru/login" || pathname === "/guru/signup";
}

function isProtectedAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isProtectedGuruDashboardPath(pathname: string) {
  return pathname === "/guru/dashboard" || pathname.startsWith("/guru/dashboard/");
}

function getSiteMode() {
  return process.env.SITE_MODE === "prelaunch" ? "prelaunch" : "live";
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

function isAdminRole(role: string | null | undefined) {
  const normalized = normalizeValue(role);

  return [
    "admin",
    "owner",
    "super_admin",
    "super user",
    "superuser",
    "founder",
    "ceo",
    "founder/ceo",
    "co-founder",
    "cofounder",
  ].includes(normalized);
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
}: {
  request: NextRequest;
  pathname: string;
  nextPath?: string;
}) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  redirectUrl.search = "";

  if (nextPath) {
    redirectUrl.searchParams.set("next", nextPath);
  }

  return redirectUrl;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const siteMode = getSiteMode();

  if (siteMode === "live" && pathname === "/launch") {
    return NextResponse.redirect(
      makeRedirectUrl({
        request,
        pathname: "/",
      }),
    );
  }

  if (siteMode === "prelaunch" && pathname === "/") {
    return NextResponse.redirect(
      makeRedirectUrl({
        request,
        pathname: "/launch",
      }),
    );
  }

  const requiresAdminAccess = isProtectedAdminPath(pathname) && !isAdminLoginPath(pathname);
  const requiresGuruAccess =
    isProtectedGuruDashboardPath(pathname) && !isGuruLoginPath(pathname);

  if (!requiresAdminAccess && !requiresGuruAccess) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
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

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          response.cookies.set({
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

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          response.cookies.set({
            name,
            value: "",
            ...removalOptions,
          });
        },
      },
    },
  );

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

  if (isSuperUser) {
    return response;
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

  const hasAdminRole =
    isAdminRole(profileRole) || roles.some((role) => isAdminRole(role));

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

  if (requiresAdminAccess && !hasAdminRole) {
    return NextResponse.redirect(
      makeRedirectUrl({
        request,
        pathname: siteMode === "prelaunch" ? "/launch" : "/",
      }),
    );
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

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};