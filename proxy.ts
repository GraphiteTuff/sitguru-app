import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import {
  isHardcodedSuperUserEmail,
  normalizeAdminEmail,
} from "@/lib/admin/super-users";
import {
  hasGrowthOnlyRole,
  isGrowthAllowedAdminPath,
} from "@/lib/admin/growth-paths";
import {
  guruLookupOrFilter,
  isEligibleGuruProfile,
  shouldRepairMissingGuruRole,
} from "@/lib/auth/guru-access";

const ADMIN_PROFILE_ROLES = new Set([
  "founder",
  "owner",
  "super_admin",
  "admin",
  "finance_admin",
  "finance",
  "accounting",
  "bookkeeper",
  "billing_admin",
  "support_admin",
  "operations",
  "operations_admin",
  "moderator",
  "hr_admin",
  "sales_admin",
  "marketing_admin",
  "social_community_manager",
  "partner_admin",
  "customer_service",
  "guru_approvals_admin",
  "developer_admin",
  "executive_viewer",
  "finance_viewer",
  "support_viewer",
  "marketing_viewer",
  "tech_support_admin",
  "technical_support",
  "systems_admin",
  "trust_safety_admin",
]);

function normalizeValue(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function normalizeEmail(value: string | null | undefined) {
  return normalizeAdminEmail(value);
}

function getEnvAdminEmails() {
  return String(
    process.env.SITGURU_FINANCE_ADMIN_EMAILS || process.env.ADMIN_EMAILS || "",
  )
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

function isSuperUserEmail(email: string | null | undefined) {
  return isHardcodedSuperUserEmail(email);
}

function isEnvAdminEmail(email: string | null | undefined) {
  return getEnvAdminEmails().includes(normalizeEmail(email));
}

function isAdminProfileRole(role: string | null | undefined) {
  return ADMIN_PROFILE_ROLES.has(normalizeValue(role));
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

function isAmbassadorLoginPath(pathname: string) {
  return (
    pathname === "/ambassador/login" ||
    pathname === "/ambassador/signup"
  );
}

function isProtectedAdminPath(pathname: string) {
  return isAdminPath(pathname) && !isAdminLoginPath(pathname);
}

function isProtectedGuruDashboardPath(pathname: string) {
  return (
    pathname === "/guru/dashboard" ||
    pathname.startsWith("/guru/dashboard/")
  );
}

function isProtectedAmbassadorDashboardPath(pathname: string) {
  return (
    pathname === "/ambassador/dashboard" ||
    pathname.startsWith("/ambassador/dashboard/")
  );
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

function isAmbassadorRole(role: string | null | undefined) {
  const normalized = normalizeValue(role);

  return [
    "ambassador",
    "ambassadors",
    "student_ambassador",
    "student-ambassador",
    "community_ambassador",
    "community-ambassador",
    "military_ambassador",
    "military-ambassador",
    "veteran_ambassador",
    "veteran-ambassador",
    "partner",
    "rep",
    "representative",
    "sitguru_rep",
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

function rewriteMangledAdminQueryPath(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Some email/SMS clients turn `?query=` into `@query=`, which 404s as a path.
  // Recover common admin review links so SitGuru Alerts still open the account.
  const mangledMatch = pathname.match(
    /^(\/admin\/(?:account-lifecycle|customers|gurus|ambassadors|incomplete-profiles))@query=(.+)$/i,
  );

  if (!mangledMatch) return null;

  const [, basePath, rawQuery] = mangledMatch;
  const queryValue = decodeURIComponent(rawQuery).trim();
  if (!queryValue) return null;

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = basePath;
  redirectUrl.search = "";
  redirectUrl.searchParams.set("query", queryValue);
  return NextResponse.redirect(redirectUrl);
}

export async function proxy(request: NextRequest) {
  const mangledAdminRedirect = rewriteMangledAdminQueryPath(request);
  if (mangledAdminRedirect) {
    return mangledAdminRedirect;
  }

  const { pathname } = request.nextUrl;

  // Native form POST to /api/admin/login can 302/307 onto /admin/login and
  // keep POST. App Router pages only accept GET, so Chrome shows HTTP 405
  // ("this page isn't working") instead of the login form. Force GET.
  if (request.method === "POST" && isAdminLoginPath(pathname)) {
    return NextResponse.redirect(request.nextUrl, 303);
  }

  if (isPasswordRecoveryPath(pathname)) {
    return NextResponse.next();
  }

  // Capture ?ref= on any public hit and set 30-day attribution cookie (non-blocking).
  const refParam =
    request.nextUrl.searchParams.get("ref") ||
    request.nextUrl.searchParams.get("referral") ||
    request.nextUrl.searchParams.get("ambassador");
  const normalizedRef = String(refParam || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");

  const requiresAdminAccess = isProtectedAdminPath(pathname);
  const requiresGuruAccess =
    isProtectedGuruDashboardPath(pathname) && !isGuruLoginPath(pathname);
  const requiresAmbassadorAccess =
    isProtectedAmbassadorDashboardPath(pathname) &&
    !isAmbassadorLoginPath(pathname);

  if (
    !requiresAdminAccess &&
    !requiresGuruAccess &&
    !requiresAmbassadorAccess
  ) {
    const passthrough = NextResponse.next();
    if (normalizedRef) {
      passthrough.cookies.set({
        name: "sitguru_ambassador_ref",
        value: normalizedRef,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      // Canonical cookie already consumed by signup + /r/ flows
      passthrough.cookies.set({
        name: "sitguru_ambassador_code",
        value: normalizedRef,
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return passthrough;
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

    if (requiresAmbassadorAccess) {
      return NextResponse.redirect(
        makeRedirectUrl({
          request,
          pathname: "/ambassador/login",
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
  const isSuperUser = isSuperUserEmail(userEmail) || isEnvAdminEmail(userEmail);

  if (requiresAdminAccess && isSuperUser) {
    return responseRef.current;
  }

  if (requiresAdminAccess && !isSuperUser) {
    const [{ data: adminProfile }, { data: adminRoleRows }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, role, account_type, is_active")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id),
    ]);

    const profileRole = normalizeValue(adminProfile?.role);
    const roleList = (adminRoleRows || [])
      .map((row) => normalizeValue(row.role))
      .filter(Boolean);
    const profileActive = adminProfile?.is_active !== false;
    const hasAdminRole =
      profileActive &&
      (isAdminProfileRole(profileRole) ||
        roleList.some((role) => isAdminProfileRole(role)));

    if (hasAdminRole) {
      const growthOnly = hasGrowthOnlyRole([profileRole, ...roleList]);
      if (
        growthOnly &&
        (pathname === "/admin" ||
          pathname === "/admin/" ||
          !isGrowthAllowedAdminPath(pathname))
      ) {
        const growthUrl = request.nextUrl.clone();
        growthUrl.pathname = "/admin/growth";
        growthUrl.search = "";
        return NextResponse.redirect(growthUrl);
      }

      return responseRef.current;
    }

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

  if ((requiresGuruAccess || requiresAmbassadorAccess) && isSuperUser) {
    return responseRef.current;
  }

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, role, account_type")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id),
  ]);

  const profileRole = normalizeValue(profile?.role);
  const profileAccountType = normalizeValue(profile?.account_type);

  const roles = (roleRows || [])
    .map((row) => normalizeValue(row.role))
    .filter(Boolean);

  if (profileRole) roles.push(profileRole);
  if (profileAccountType) roles.push(profileAccountType);

  const hasGuruRole = roles.some(
    (role) => isGuruRole(role) || isBothRole(role),
  );

  const hasCustomerRole = roles.some(
    (role) => isCustomerRole(role) || isBothRole(role),
  );

  const hasAmbassadorRoleValue = roles.some(isAmbassadorRole);

  let hasGuruRow = false;

  if (requiresGuruAccess && !hasGuruRole) {
    const { data: guruRow } = await supabase
      .from("gurus")
      .select("id, user_id, email, status, application_status, is_bookable, is_active")
      .or(guruLookupOrFilter(user.id, user.email))
      .maybeSingle();

    hasGuruRow = isEligibleGuruProfile(guruRow);

    if (
      hasGuruRow &&
      shouldRepairMissingGuruRole({
        hasGuruRole,
        hasEligibleGuruProfile: hasGuruRow,
      })
    ) {
      await supabase.from("user_roles").upsert(
        {
          user_id: user.id,
          role: "guru",
        },
        { onConflict: "user_id,role" },
      );
    }
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

  if (requiresAmbassadorAccess) {
    const { data: ambassadorRow } = await supabase
      .from("ambassadors")
      .select("id, dashboard_enabled, login_enabled, status")
      .eq("user_id", user.id)
      .maybeSingle();

    const ambassadorStatus = normalizeValue(ambassadorRow?.status);
    const hasUsableAmbassadorWorkspace =
      Boolean(ambassadorRow?.id) &&
      ambassadorRow?.dashboard_enabled === true &&
      ambassadorRow?.login_enabled === true &&
      ambassadorStatus !== "archived";

    if (!hasAmbassadorRoleValue || !hasUsableAmbassadorWorkspace) {
      return NextResponse.redirect(
        makeRedirectUrl({
          request,
          pathname: "/ambassador/login",
          nextPath: pathname,
          error:
            "Your Ambassador workspace is not available yet. Please contact SitGuru support if you believe this is an error.",
        }),
      );
    }
  }

  return responseRef.current;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};