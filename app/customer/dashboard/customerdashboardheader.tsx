"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import NotificationBell from "@/components/NotificationBell";

type CustomerDashboardHeaderProps = {
  customerName?: string | null;
  customerImageUrl?: string | null;
};

type CustomerNavItem = {
  label: string;
  href: string;
  activePaths: string[];
};

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

function getInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "SU";
}

const navItems: CustomerNavItem[] = [
  {
    label: "Dashboard",
    href: "/customer/dashboard",
    activePaths: ["/customer/dashboard"],
  },
  {
    label: "Find a Guru",
    href: "/customer/find-guru",
    activePaths: ["/customer/find-guru", "/find-guru", "/search"],
  },
  {
    label: "Bookings",
    href: "/customer/dashboard/bookings",
    activePaths: [
      "/customer/dashboard/bookings",
      "/customer/bookings",
      "/bookings",
    ],
  },
  {
    label: "Messages",
    href: "/customer/dashboard/messages",
    activePaths: [
      "/customer/dashboard/messages",
      "/customer/messages",
      "/messages",
    ],
  },
  {
    label: "My Pets",
    href: "/customer/dashboard/pets",
    activePaths: ["/customer/dashboard/pets", "/customer/pets"],
  },
  {
    label: "PawPerks",
    href: "/customer/dashboard/pawperks",
    activePaths: ["/customer/dashboard/pawperks"],
  },
  {
    label: "My Profile",
    href: "/customer/dashboard/profile",
    activePaths: ["/customer/dashboard/profile", "/customer/profile"],
  },
];

export default function CustomerDashboardHeader({
  customerName = "SitGuru User",
  customerImageUrl = "",
}: CustomerDashboardHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [profileOpen, setProfileOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const displayName = cleanText(customerName) || "SitGuru User";
  const displayImageUrl = cleanText(customerImageUrl);

  const customerInitials = useMemo(() => {
    return getInitials(displayName);
  }, [displayName]);

  const isActive = (activePaths: string[]) => {
    return activePaths.some((activePath) => {
      if (activePath === "/customer/dashboard") {
        return pathname === "/customer/dashboard";
      }

      if (activePath === "/messages") {
        return pathname === "/messages" || pathname?.startsWith("/messages/");
      }

      return pathname === activePath || pathname?.startsWith(`${activePath}/`);
    });
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("sitguruCustomer");
      localStorage.removeItem("sitguruCustomerProfile");
      localStorage.removeItem("sitguruUser");
      localStorage.removeItem("sitguruAuth");
      localStorage.removeItem("sitguruUserRole");
    } catch {
      // Keep logout safe if localStorage is unavailable.
    }

    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-100 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/customer/dashboard"
          className="flex min-w-fit items-center gap-3"
          aria-label="SitGuru Customer Dashboard"
        >
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/sitguru-logo-cropped.png"
              alt="SitGuru"
              className="h-9 w-9 object-contain"
            />
          </div>

          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-black tracking-tight text-emerald-950">
              SitGuru
            </p>
            <p className="text-xs font-semibold text-emerald-600">
              Customer Portal
            </p>
          </div>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {navItems.map((item) => {
            const active = isActive(item.activePaths);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "relative rounded-full px-4 py-2 text-sm font-bold transition",
                  active
                    ? "bg-emerald-50 text-emerald-800"
                    : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-800",
                ].join(" ")}
              >
                {item.label}

                {active ? (
                  <span className="absolute -bottom-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-emerald-500" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="relative flex items-center gap-3">
          <Link
            href="/customer/dashboard/bookings"
            className="hidden min-h-[44px] items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 px-4 text-sm font-black text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-100 md:inline-flex"
          >
            My Care
          </Link>

          <NotificationBell />

          <div className="hidden text-right md:block">
            <p className="text-sm font-black text-slate-950">{displayName}</p>
            <p className="text-xs font-semibold text-emerald-600">
              Customer Account
            </p>
          </div>

          <button
            type="button"
            onClick={() => setProfileOpen((current) => !current)}
            className="flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-2 py-2 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
            aria-label="Open customer menu"
            aria-expanded={profileOpen}
          >
            <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-sm font-black text-emerald-800 ring-2 ring-emerald-200">
              {!imageFailed && displayImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayImageUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                customerInitials
              )}
            </span>

            <span className="hidden text-lg font-black text-emerald-700 sm:inline">
              {profileOpen ? "▴" : "▾"}
            </span>
          </button>

          {profileOpen ? (
            <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-64 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl">
              <div className="border-b border-emerald-50 bg-emerald-50/80 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white text-sm font-black text-emerald-700 ring-2 ring-emerald-200">
                    {!imageFailed && displayImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={displayImageUrl}
                        alt={displayName}
                        className="h-full w-full object-cover"
                        onError={() => setImageFailed(true)}
                      />
                    ) : (
                      customerInitials
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-black text-slate-950">
                      {displayName}
                    </p>
                    <p className="text-xs font-semibold text-emerald-700">
                      Customer Profile
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <Link
                  href="/customer/dashboard/profile"
                  onClick={() => setProfileOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                >
                  Update Profile
                </Link>

                <Link
                  href="/customer/dashboard/bookings"
                  onClick={() => setProfileOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                >
                  My Care / Bookings
                </Link>

                <Link
                  href="/customer/dashboard/messages"
                  onClick={() => setProfileOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                >
                  Message Center
                </Link>

                <Link
                  href="/customer/dashboard/pets"
                  onClick={() => setProfileOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                >
                  My Pets
                </Link>

                <Link
                  href="/customer/dashboard/pawperks"
                  onClick={() => setProfileOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                >
                  PawPerks
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 block w-full rounded-2xl px-4 py-3 text-left text-sm font-black text-red-600 transition hover:bg-red-50"
                >
                  Log Out
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <nav className="border-t border-emerald-50 bg-white px-3 py-2 lg:hidden">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const active = isActive(item.activePaths);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "relative min-w-fit rounded-full px-4 py-2 text-sm font-bold transition",
                  active
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
