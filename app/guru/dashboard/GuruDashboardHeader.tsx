"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpen, CalendarDays, LayoutDashboard, MessageCircle, Wallet } from "lucide-react";
import { SiteAccountMenu } from "@/components/sitguru/SiteAccountMenu";

/**
 * The Guru header uses the same account/avatar/role-switch menu as the
 * Manager, Intern, Ambassador and Admin workspaces. The public Guru
 * promotional photo remains independent of the personal account avatar.
 */
type ActiveGuruTab =
  | "dashboard"
  | "bookings"
  | "referrals"
  | "messages"
  | "profile"
  | "availability"
  | "earnings";

type GuruDashboardHeaderProps = {
  guruProfile?: unknown;
  activeTab?: ActiveGuruTab;
  active?: ActiveGuruTab;
  displayName?: string | null;
  imageUrl?: string | null;
  tierLabel?: string | null;
  profileCompletion?: number | null;
};

const navItems = [
  { label: "Home", href: "/guru/dashboard", tab: "dashboard", icon: LayoutDashboard },
  { label: "Bookings", href: "/guru/dashboard/bookings", tab: "bookings", icon: CalendarDays },
  { label: "Messages", href: "/guru/dashboard/messages", tab: "messages", icon: MessageCircle },
  { label: "Availability", href: "/guru/dashboard/availability", tab: "availability", icon: CalendarDays },
  { label: "Earnings", href: "/guru/dashboard/earnings", tab: "earnings", icon: Wallet },
] as const;

function isSelected(pathname: string, href: string, active?: ActiveGuruTab) {
  if (href === "/guru/dashboard") return pathname === href || active === "dashboard";
  return pathname === href || pathname.startsWith(href + "/") ||
    (active !== undefined && navItems.some(item => item.href === href && item.tab === active));
}

export default function GuruDashboardHeader({ activeTab, active }: GuruDashboardHeaderProps) {
  const pathname = usePathname() || "";
  const activeSelection = activeTab || active;
  return (
    <header className="sg-guru-header sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-[0_6px_22px_rgba(15,23,42,0.04)] backdrop-blur">
      <div className="mx-auto flex h-[76px] w-full max-w-[1500px] items-center justify-between gap-3 px-3 sm:h-[84px] sm:px-6 lg:px-8">
        <Link
          href="/guru/dashboard"
          className="inline-flex h-14 shrink-0 items-center justify-start transition hover:opacity-90 lg:h-16"
          aria-label="SitGuru Guru Dashboard"
        >
          <Image
            src="/images/sitguru-logo-cropped.png"
            alt="SitGuru"
            width={190}
            height={68}
            priority
            className="h-auto max-h-11 w-auto object-contain lg:max-h-12"
          />
        </Link>

        <nav aria-label="Guru desktop navigation" className="hidden flex-1 items-center justify-center gap-4 xl:flex 2xl:gap-6">
          {navItems.map((item) => {
            const selected = isSelected(pathname, item.href, activeSelection);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={selected ? "page" : undefined}
                className={`relative inline-flex h-[84px] items-center whitespace-nowrap text-[14px] font-bold tracking-tight transition hover:text-emerald-700 2xl:text-[15px] ${selected ? "text-slate-950" : "text-slate-700"}`}
              >
                {item.label}
                {selected ? <span className="absolute inset-x-0 bottom-[14px] h-[3px] rounded-full bg-emerald-500" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/guru/success-center"
            className="hidden min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm hover:border-emerald-200 hover:bg-emerald-50 2xl:inline-flex"
          >
            <BookOpen className="h-4 w-4 text-sky-600" />
            Guru Success Center
          </Link>
          <Link
            href="/guru/dashboard/messages"
            aria-label="Guru notifications and messages"
            className="grid h-11 w-11 place-items-center rounded-full text-[#0F2744] transition hover:bg-[#EEF2F6]"
          >
            <Bell className="h-5 w-5" />
          </Link>
          <SiteAccountMenu variant="desk" />
        </div>
      </div>
    </header>
  );
}
