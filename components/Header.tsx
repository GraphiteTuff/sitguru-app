"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import SiteLogo from "@/components/SiteLogo";
import { supabase } from "@/lib/supabase";

type UserRole = "public" | "customer" | "guru" | "admin";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Find Care" },
  { href: "/login?redirect=/pets", label: "My Pets" },
  { href: "/become-a-guru", label: "Become a Guru" },
];

const customerLinks = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Find Care" },
  { href: "/bookings", label: "Bookings" },
  { href: "/messages", label: "Messages" },
  { href: "/pets", label: "My Pets" },
  { href: "/customer/dashboard", label: "Dashboard" },
];

const guruLinks = [
  { href: "/guru/dashboard", label: "Dashboard" },
  { href: "/guru/bookings", label: "Bookings" },
  { href: "/guru/messages", label: "Messages" },
  { href: "/guru/dashboard/profile", label: "My Profile" },
  { href: "/guru/availability", label: "Availability" },
  { href: "/guru/dashboard/earnings", label: "Earnings" },
];

const adminLinks = [
  { href: "/admin", label: "Admin" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/gurus", label: "Gurus" },
];

function normalizeRole(value?: string | null): UserRole {
  const role = String(value || "").trim().toLowerCase();

  if (role === "admin" || role === "owner" || role === "super_admin") {
    return "admin";
  }

  if (role === "guru" || role === "provider" || role === "sitter") {
    return "guru";
  }

  if (role === "customer" || role === "pet_parent" || role === "user") {
    return "customer";
  }

  return "public";
}

function getDashboardHref(role: UserRole) {
  if (role === "admin") return "/admin";
  if (role === "guru") return "/guru/dashboard";
  if (role === "customer") return "/customer/dashboard";

  return "/login";
}

function getFallbackRoleFromPath(pathname: string): UserRole {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  if (pathname === "/guru" || pathname.startsWith("/guru/")) return "guru";
  if (
    pathname === "/customer" ||
    pathname.startsWith("/customer/") ||
    pathname === "/dashboard" ||
    pathname === "/pets" ||
    pathname === "/bookings" ||
    pathname.startsWith("/bookings/") ||
    pathname === "/messages" ||
    pathname.startsWith("/messages/")
  ) {
    return "customer";
  }

  return "public";
}

export default function Header() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<UserRole>(getFallbackRoleFromPath(pathname));
  const [authChecked, setAuthChecked] = useState(false);

  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const dashboardHref = getDashboardHref(role);
  const isLoggedIn = role !== "public";

  const links = useMemo(() => {
    if (role === "admin") return adminLinks;
    if (role === "guru") return guruLinks;
    if (role === "customer") return customerLinks;

    return publicLinks;
  }, [role]);

  useEffect(() => {
    let mounted = true;

    async function resolveRole() {
      const fallbackRole = getFallbackRoleFromPath(pathname);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user?.id) {
        setRole(fallbackRole);
        setAuthChecked(true);
        return;
      }

      const metadataRole = normalizeRole(
        user.user_metadata?.role ||
          user.user_metadata?.account_type ||
          user.app_metadata?.role ||
          user.app_metadata?.account_type
      );

      if (metadataRole !== "public") {
        setRole(metadataRole);
        setAuthChecked(true);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, account_type")
        .eq("id", user.id)
        .maybeSingle();

      const profileRole = normalizeRole(
        profile?.role || profile?.account_type || null
      );

      if (profileRole !== "public") {
        setRole(profileRole);
        setAuthChecked(true);
        return;
      }

      const { data: guruProfile } = await supabase
        .from("gurus")
        .select("id, user_id, email")
        .or(`user_id.eq.${user.id},email.eq.${user.email || ""}`)
        .maybeSingle();

      if (guruProfile?.id || fallbackRole === "guru") {
        setRole("guru");
        setAuthChecked(true);
        return;
      }

      if (fallbackRole !== "public") {
        setRole(fallbackRole);
        setAuthChecked(true);
        return;
      }

      setRole("customer");
      setAuthChecked(true);
    }

    resolveRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      resolveRole();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname]);

  function isActive(href: string) {
    const cleanHref = href.split("?")[0];

    if (cleanHref === "/") return pathname === "/";
    if (cleanHref === "/messages") {
      return pathname === "/messages" || pathname.startsWith("/messages/");
    }

    return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setRole("public");
    setOpen(false);
    window.location.href = "/";
  }

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-md ${
        isAdminPage
          ? "border-slate-800 bg-slate-950/95 shadow-lg"
          : "border-slate-200 bg-white/95 shadow-sm"
      }`}
    >
      <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-6 lg:px-8">
        <SiteLogo
          priority
          wrapperClassName="h-14 w-[190px] shrink-0 sm:w-[215px] lg:w-[230px]"
        />

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {links.map((link) => {
            const active = isActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-2 text-sm font-semibold transition xl:px-4 ${
                  isAdminPage
                    ? active
                      ? "bg-white/15 text-white"
                      : "text-white/90 hover:bg-white/10 hover:text-white"
                    : active
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          {authChecked && isLoggedIn ? (
            <>
              <Link
                href={dashboardHref}
                className="inline-flex h-11 items-center justify-center rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 xl:h-12 xl:px-7 xl:text-base"
              >
                Dashboard
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                className={`text-sm font-semibold transition xl:text-base ${
                  isAdminPage
                    ? "text-white/90 hover:text-white"
                    : "text-slate-700 hover:text-slate-950"
                }`}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`text-sm font-semibold transition xl:text-base ${
                  isAdminPage
                    ? "text-white/90 hover:text-white"
                    : "text-slate-700 hover:text-slate-950"
                }`}
              >
                Customer Login
              </Link>

              <Link
                href="/guru/login"
                className={`text-sm font-semibold transition xl:text-base ${
                  isAdminPage
                    ? "text-white/90 hover:text-white"
                    : "text-slate-700 hover:text-slate-950"
                }`}
              >
                Guru Login
              </Link>

              <Link
                href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 xl:h-12 xl:px-7 xl:text-base"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-xl font-bold transition lg:hidden ${
            isAdminPage
              ? "bg-white/10 text-white hover:bg-white/15"
              : "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
          }`}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open ? (
        <div
          className={`border-t px-4 py-4 lg:hidden ${
            isAdminPage
              ? "border-slate-800 bg-slate-950"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-2">
            {links.map((link) => {
              const active = isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isAdminPage
                      ? active
                        ? "bg-white/15 text-white"
                        : "text-white/90 hover:bg-white/10 hover:text-white"
                      : active
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="mt-2 border-t border-slate-200 pt-3">
              {authChecked && isLoggedIn ? (
                <>
                  <Link
                    href={dashboardHref}
                    onClick={() => setOpen(false)}
                    className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Dashboard
                  </Link>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className={`mt-2 w-full rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
                      isAdminPage
                        ? "text-white/90 hover:bg-white/10 hover:text-white"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className={`block rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
                      isAdminPage
                        ? "text-white/90 hover:bg-white/10 hover:text-white"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                  >
                    Customer Login
                  </Link>

                  <Link
                    href="/guru/login"
                    onClick={() => setOpen(false)}
                    className={`block rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
                      isAdminPage
                        ? "text-white/90 hover:bg-white/10 hover:text-white"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                  >
                    Guru Login
                  </Link>

                  <Link
                    href="/signup"
                    onClick={() => setOpen(false)}
                    className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
