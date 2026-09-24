"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  LineChart,
  MessageCircle,
  QrCode,
  Share2,
  Users,
  WalletCards,
} from "lucide-react";
import { SiteAccountMenu } from "@/components/sitguru/SiteAccountMenu";

type AmbassadorDashboardLayoutProps = {
  children: ReactNode;
};

type AmbassadorNavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  isActive: (pathname: string) => boolean;
};

const navItems: AmbassadorNavItem[] = [
  {
    label: "Performance",
    href: "/ambassador/dashboard/performance",
    icon: <LineChart size={16} />,
    isActive: (pathname) =>
      pathname.startsWith("/ambassador/dashboard/performance"),
  },
  {
    label: "Dashboard",
    href: "/ambassador/dashboard",
    icon: <LayoutDashboard size={16} />,
    isActive: (pathname) => pathname === "/ambassador/dashboard",
  },
  {
    label: "Portal",
    href: "/ambassador/dashboard/command-center",
    icon: <BriefcaseBusiness size={16} />,
    isActive: (pathname) =>
      pathname.startsWith("/ambassador/dashboard/command-center"),
  },
  {
    label: "Referrals",
    href: "/ambassador/dashboard/referrals",
    icon: <Users size={16} />,
    isActive: (pathname) =>
      pathname.startsWith("/ambassador/dashboard/referrals"),
  },
  {
    label: "Social",
    href: "/ambassador/dashboard/social",
    icon: <Share2 size={16} />,
    isActive: (pathname) =>
      pathname.startsWith("/ambassador/dashboard/social"),
  },
  {
    label: "Training",
    href: "/ambassador/dashboard/training",
    icon: <GraduationCap size={16} />,
    isActive: (pathname) =>
      pathname.startsWith("/ambassador/dashboard/training"),
  },
  {
    label: "Messages",
    href: "/ambassador/dashboard/messages?support=admin&role=ambassador",
    icon: <MessageCircle size={16} />,
    isActive: (pathname) =>
      pathname.startsWith("/ambassador/dashboard/messages"),
  },
  {
    label: "Support",
    href: "/ambassador/dashboard/support",
    icon: <Headphones size={16} />,
    isActive: (pathname) =>
      pathname.startsWith("/ambassador/dashboard/support"),
  },
  {
    label: "Rewards",
    href: "/ambassador/dashboard/commissions",
    icon: <WalletCards size={16} />,
    isActive: (pathname) =>
      pathname.startsWith("/ambassador/dashboard/commissions") ||
      pathname.startsWith("/ambassador/dashboard/payouts"),
  },
];

export default function AmbassadorDashboardLayout({
  children,
}: AmbassadorDashboardLayoutProps) {
  const pathname = usePathname();
  const isDashboardHome = pathname === "/ambassador/dashboard";

  return (
    <div className="min-h-[100svh] bg-[linear-gradient(180deg,#F7FBFD_0%,#F3FAF8_48%,#EEF6FF_100%)]">
      <header className="sticky top-0 z-50 border-b border-sky-100 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-[1500px] px-3 sm:px-5 lg:px-6">
          <div className="flex min-h-16 items-center justify-between gap-4 py-2">
            <Link
              href="/ambassador/dashboard"
              className="min-w-0 shrink-0"
              aria-label="Open Ambassador Dashboard"
            >
              <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-[#0D5C3A]">
                SitGuru Ambassador
              </p>
              <p className="truncate text-base font-black tracking-tight text-slate-950">
                Dashboard & Portal
              </p>
            </Link>

            <nav
              aria-label="Ambassador dashboard navigation"
              className="min-w-0 flex-1 overflow-x-auto"
            >
              <div className="ml-auto flex w-max items-center gap-1.5 py-1">
                {navItems.map((item) => {
                  const active = item.isActive(pathname);

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black transition sm:text-sm ${
                        active
                          ? "bg-[#0D5C3A] text-white shadow-sm"
                          : "text-slate-600 hover:bg-sky-50 hover:text-[#0D5C3A]"
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>

            <SiteAccountMenu compact />
          </div>
        </div>
      </header>

      {isDashboardHome ? (
        <section className="border-b border-sky-100 bg-[linear-gradient(135deg,#ecfeff_0%,#ffffff_48%,#f0fdf4_100%)]">
          <div className="mx-auto max-w-[1500px] px-3 py-4 sm:px-5 lg:px-6">
            <Link
              href="/ambassador/dashboard/command-center"
              className="group flex flex-col gap-4 rounded-[24px] border border-sky-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-5"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0D5C3A] text-white shadow-sm">
                  <BriefcaseBusiness size={23} />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">
                    Your Working Area
                  </p>
                  <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                    Open the SitGuru Ambassador Portal
                  </h2>
                  <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
                    Schedule activities, manage your calendar, record events and
                    marketing, submit leads, track hours and results, and request
                    help from SitGuru Support.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      {
                        label: "Calendar",
                        icon: <CalendarDays size={13} />,
                      },
                      {
                        label: "Activities",
                        icon: <LayoutDashboard size={13} />,
                      },
                      {
                        label: "Marketing",
                        icon: <Share2 size={13} />,
                      },
                      {
                        label: "Leads",
                        icon: <Users size={13} />,
                      },
                      {
                        label: "QR & Referrals",
                        icon: <QrCode size={13} />,
                      },
                      {
                        label: "Support",
                        icon: <MessageCircle size={13} />,
                      },
                    ].map((item) => (
                      <span
                        key={item.label}
                        className="inline-flex items-center gap-1.5 rounded-full border border-green-100 bg-green-50 px-2.5 py-1 text-[10px] font-black text-green-900"
                      >
                        {item.icon}
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <span className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-2 text-sm font-black text-white transition group-hover:bg-green-900">
                Open Portal
                <ArrowRight
                  size={16}
                  className="transition group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          </div>
        </section>
      ) : null}

      {children}
    </div>
  );
}