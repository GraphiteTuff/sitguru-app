import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

function isAdminLoginPath(pathname: string) {
  return pathname === "/admin/login";
}

function isProtectedAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

const ALLOWED_EXACT_PATHS = new Set([
  "/launch",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
]);

const ALLOWED_PREFIXES = ["/api/launch-signup", "/_next"];

const ALLOWED_PUBLIC_FILES = new Set(["/sitguru-logo-cropped.png.png"]);

function isStaticAsset(pathname: string) {
  return /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|map|txt|xml|woff|woff2|ttf|eot)$/i.test(
    pathname
  );
}

function isAllowedPrelaunchPath(pathname: string) {
  if (ALLOWED_EXACT_PATHS.has(pathname)) {
    return true;
  }

  if (ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  if (ALLOWED_PUBLIC_FILES.has(pathname)) {
    return true;
  }

  if (isStaticAsset(pathname)) {
    return true;
  }

  return false;
}

function getSiteMode() {
  return process.env.SITE_MODE === "live" ? "live" : "prelaunch";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const siteMode = getSiteMode();

  if (siteMode === "prelaunch" && !isAllowedPrelaunchPath(pathname)) {
    const launchUrl = request.nextUrl.clone();
    launchUrl.pathname = "/launch";
    launchUrl.search = "";

    return NextResponse.redirect(launchUrl);
  }

  if (!isProtectedAdminPath(pathname) || isAdminLoginPath(pathname)) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  let isAdmin = false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    typeof profile?.role === "string" &&
    profile.role.toLowerCase() === "admin"
  ) {
    isAdmin = true;
  }

  if (!isAdmin) {
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (
      (roleRows || []).some(
        (row) =>
          typeof row.role === "string" && row.role.toLowerCase() === "admin"
      )
    ) {
      isAdmin = true;
    }
  }

  if (!isAdmin) {
    return NextResponse.redirect(
      new URL(siteMode === "prelaunch" ? "/launch" : "/", request.url)
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};