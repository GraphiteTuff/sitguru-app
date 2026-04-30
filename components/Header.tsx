"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  LogOut,
  Menu,
  UserRound,
  X,
} from "lucide-react";

type HeaderProps = {
  user?: {
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    role?: "customer" | "guru" | "admin" | string | null;
  } | null;
};

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Find Care", href: "/search" },
  { label: "My Pets", href: "/pets" },
  { label: "Become a Guru", href: "/become-a-guru" },
];

export default function Header({ user = null }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  const avatarMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        avatarMenuRef.current &&
        !avatarMenuRef.current.contains(event.target as Node)
      ) {
        setAvatarOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setAvatarOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  const dashboardHref =
    user?.role === "guru"
      ? "/guru/dashboard"
      : user?.role === "admin"
        ? "/admin"
        : "/customer/dashboard";

  const profileHref =
    user?.role === "guru"
      ? "/guru/profile"
      : user?.role === "admin"
        ? "/admin/profile"
        : "/customer/profile";

  async function handleLogout() {
    setAvatarOpen(false);

    try {
      await fetch("/auth/signout", {
        method: "POST",
      });
    } catch {
      // Keep logout flow moving even if the endpoint is not present.
    }

    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/sitguru-logo-cropped.png"
            alt="SitGuru"
            width={190}
            height={70}
            priority
            className="h-auto w-[150px] sm:w-[175px] lg:w-[190px]"
          />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => {
            const active = isActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative pb-2 text-[15px] font-extrabold transition ${
                  active
                    ? "text-emerald-500"
                    : "text-slate-900 hover:text-emerald-600"
                }`}
              >
                {link.label}

                {active && (
                  <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-full bg-emerald-400" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <div ref={avatarMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setAvatarOpen((current) => !current)}
                className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
                aria-expanded={avatarOpen}
                aria-label="Open user menu"
              >
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-emerald-100">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.name || "User profile"}
                      width={44}
                      height={44}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound className="h-6 w-6 text-emerald-700" />
                  )}
                </div>

                <div className="hidden text-left xl:block">
                  <p className="max-w-[145px] truncate text-sm font-extrabold text-slate-900">
                    {user.name || "My Account"}
                  </p>
                  <p className="max-w-[145px] truncate text-xs font-semibold text-slate-500">
                    {user.role || "Customer"}
                  </p>
                </div>

                {avatarOpen ? (
                  <ChevronUp className="h-5 w-5 text-slate-700" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-700" />
                )}
              </button>

              {avatarOpen && (
                <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                  <div className="border-b border-slate-100 bg-emerald-50 px-5 py-4">
                    <p className="truncate text-sm font-extrabold text-slate-900">
                      {user.name || "SitGuru Member"}
                    </p>

                    {user.email && (
                      <p className="truncate text-xs font-semibold text-slate-500">
                        {user.email}
                      </p>
                    )}
                  </div>

                  <div className="p-2">
                    <Link
                      href={dashboardHref}
                      className="flex items-center rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      Dashboard
                    </Link>

                    <Link
                      href={profileHref}
                      className="flex items-center rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      Update Profile
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/guru/login"
                className="rounded-full border border-emerald-200 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-800 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Guru Login
              </Link>

              <Link
                href="/customer/login"
                className="rounded-full border border-emerald-200 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-800 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Customer Login
              </Link>

              <Link
                href="/signup"
                className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-emerald-700"
              >
                Sign Up Free
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((current) => !current)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm lg:hidden"
          aria-label="Open mobile menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-5 py-5 shadow-lg lg:hidden">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-2xl px-4 py-3 text-base font-extrabold transition ${
                    active
                      ? "bg-emerald-50 text-emerald-600"
                      : "text-slate-900 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 grid gap-3">
            {user ? (
              <>
                <Link
                  href={dashboardHref}
                  className="rounded-full border border-emerald-200 bg-white px-5 py-3 text-center text-sm font-extrabold text-slate-800 shadow-sm"
                >
                  Dashboard
                </Link>

                <Link
                  href={profileHref}
                  className="rounded-full border border-emerald-200 bg-white px-5 py-3 text-center text-sm font-extrabold text-slate-800 shadow-sm"
                >
                  Update Profile
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full bg-red-600 px-5 py-3 text-center text-sm font-extrabold text-white shadow-sm"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/guru/login"
                  className="rounded-full border border-emerald-200 bg-white px-5 py-3 text-center text-sm font-extrabold text-slate-800 shadow-sm"
                >
                  Guru Login
                </Link>

                <Link
                  href="/customer/login"
                  className="rounded-full border border-emerald-200 bg-white px-5 py-3 text-center text-sm font-extrabold text-slate-800 shadow-sm"
                >
                  Customer Login
                </Link>

                <Link
                  href="/signup"
                  className="rounded-full bg-emerald-600 px-5 py-3 text-center text-sm font-extrabold text-white shadow-md"
                >
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}