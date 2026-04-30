"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

type GuruDashboardHeaderProps = {
  active?:
    | "dashboard"
    | "bookings"
    | "messages"
    | "profile"
    | "availability"
    | "earnings"
    | "resources"
    | "settings";
  displayName?: string | null;
  imageUrl?: string | null;
  tierLabel?: string | null;
  profileCompletion?: number | null;
};

const GURU_DASHBOARD_LOGO = "/images/sitguru-logo-cropped.png";

const navItems = [
  { label: "Dashboard", href: "/guru/dashboard", key: "dashboard" },
  { label: "Bookings", href: "/guru/dashboard/bookings", key: "bookings" },
  { label: "Messages", href: "/guru/dashboard/messages", key: "messages" },
  { label: "My Profile", href: "/guru/dashboard/profile", key: "profile" },
  { label: "Availability", href: "/guru/dashboard/availability", key: "availability" },
  { label: "Earnings", href: "/guru/dashboard/earnings", key: "earnings" },
] as const;

function getFirstName(name?: string | null) {
  return String(name || "Guru").trim().split(/\s+/)[0] || "Guru";
}

function getInitial(name?: string | null) {
  return getFirstName(name).charAt(0).toUpperCase() || "G";
}

function isRouteActive({
  href,
  key,
  active,
  pathname,
}: {
  href: string;
  key: string;
  active?: string;
  pathname: string;
}) {
  if (active === key) return true;
  if (href === "/guru/dashboard") return pathname === "/guru/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MiniAvatar({
  displayName,
  imageUrl,
}: {
  displayName?: string | null;
  imageUrl?: string | null;
}) {
  if (imageUrl) {
    return (
      <div className="h-11 w-11 overflow-hidden rounded-full border-2 border-white bg-white shadow-sm ring-1 ring-slate-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`${displayName || "Guru"} avatar`}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-[linear-gradient(135deg,#dbfff3_0%,#dcebff_100%)] text-sm font-black !text-slate-950 shadow-sm ring-1 ring-slate-200">
      {getInitial(displayName)}
    </div>
  );
}

export default function GuruDashboardHeader({
  active = "dashboard",
  displayName = "Guru",
  imageUrl = null,
}: GuruDashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);

    try {
      await supabase.auth.signOut();
      setMobileOpen(false);
      router.replace("/guru/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-[0_6px_22px_rgba(15,23,42,0.04)] backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
        <Link
          href="/guru/dashboard"
          className="inline-flex h-14 w-[190px] shrink-0 items-center justify-start rounded-2xl px-1 transition hover:opacity-90 sm:w-[215px] lg:h-16 lg:w-[235px]"
          aria-label="Go to SitGuru Guru dashboard"
        >
          <Image
            src={GURU_DASHBOARD_LOGO}
            alt="SitGuru"
            width={310}
            height={118}
            priority
            className="h-auto max-h-12 w-auto object-contain lg:max-h-14"
          />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-6 xl:gap-10 lg:flex">
          {navItems.map((item) => {
            const activeItem = isRouteActive({
              href: item.href,
              key: item.key,
              active,
              pathname,
            });

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`pb-5 text-base font-black transition xl:text-lg ${
                  activeItem
                    ? "border-b-[3px] border-emerald-500 !text-slate-950"
                    : "!text-slate-900 hover:!text-emerald-700"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/guru/dashboard/resources"
            className="hidden items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black !text-slate-950 shadow-sm transition hover:bg-slate-50 md:inline-flex xl:px-6 xl:text-base"
          >
            <span className="text-lg">📖</span>
            <span>Guru Resources</span>
          </Link>

          <details className="group relative hidden md:block">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1.5 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-100 focus:outline-none focus:ring-4 focus:ring-emerald-100 [&::-webkit-details-marker]:hidden">
              <MiniAvatar displayName={displayName} imageUrl={imageUrl} />

              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-lg font-black leading-none text-white ring-1 ring-emerald-400 group-open:hidden">
                ⌃
              </span>

              <span className="hidden h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-lg font-black leading-none text-white ring-1 ring-emerald-500 group-open:flex">
                ⌄
              </span>

              <span className="sr-only">Open Guru account menu</span>
            </summary>

            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+0.75rem)] z-[9999] w-64 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white p-3 text-left shadow-[0_22px_55px_rgba(15,23,42,0.18)]"
            >
              <Link
                href="/guru/dashboard/profile"
                role="menuitem"
                className="mb-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-base font-black !text-slate-950 transition hover:border-emerald-200 hover:bg-emerald-50 hover:!text-emerald-700"
              >
                Update Profile
              </Link>

              <button
                type="button"
                role="menuitem"
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full rounded-xl border border-emerald-200 bg-emerald-600 px-4 py-3 text-left text-base font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {signingOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </details>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-xl font-black text-slate-950 transition hover:bg-slate-50 lg:hidden"
            aria-label="Toggle Guru menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
          <div className="mx-auto grid max-w-[1440px] gap-2">
            {navItems.map((item) => {
              const activeItem = isRouteActive({
                href: item.href,
                key: item.key,
                active,
                pathname,
              });

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                    activeItem
                      ? "bg-emerald-50 !text-emerald-700"
                      : "!text-slate-800 hover:bg-slate-50 hover:!text-slate-950"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <Link
              href="/guru/dashboard/resources"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-bold !text-slate-800 transition hover:bg-slate-50 hover:!text-slate-950"
            >
              Guru Resources
            </Link>

            <Link
              href="/guru/dashboard/profile"
              onClick={() => setMobileOpen(false)}
              className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black !text-slate-950 transition hover:border-emerald-200 hover:bg-emerald-50 hover:!text-emerald-700"
            >
              Update Profile
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="rounded-xl border border-emerald-200 bg-emerald-600 px-4 py-3 text-left text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {signingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
