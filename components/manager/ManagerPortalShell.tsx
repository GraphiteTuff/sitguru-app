"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CircleHelp,
  Clock3,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Search,
  Users,
} from "lucide-react";
import GrowthPhoneBar from "@/components/admin/growth/GrowthPhoneBar";
import { SiteAccountMenu } from "@/components/sitguru/SiteAccountMenu";
import {
  isManagerGrowthPath,
  MANAGER_PORTAL_BRAND,
  MANAGER_PORTAL_SIDEBAR,
} from "@/lib/admin/growth/manager-portal";

const GROWTH_MANAGER_BASE = "/manager";

const ICONS = {
  "Manager Desk": LayoutDashboard,
  Interns: Users,
  Growth: Megaphone,
  Messaging: MessageCircle,
  "My Time": Clock3,
  Payments: CreditCard,
  Help: CircleHelp,
} as const;

function navActive(pathname: string, item: (typeof MANAGER_PORTAL_SIDEBAR)[number]) {
  if (item.match === "exact") return pathname === item.href;
  if (item.match === "growth") return isManagerGrowthPath(pathname);
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export default function ManagerPortalShell({
  children,
  unreadMessages = 0,
}: {
  children: React.ReactNode;
  unreadMessages?: number;
}) {
  const pathname = usePathname() || GROWTH_MANAGER_BASE;

  return (
    <div className="min-h-dvh bg-[#F3F6F4] text-slate-950">
      <div className="mx-auto flex min-h-dvh max-w-[1600px]">
        <aside className="public-dark-section sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col bg-[#0D5C3A] text-white xl:flex">
          <div className="border-b border-white/10 px-5 py-5">
            <Link href={MANAGER_PORTAL_BRAND.homePath} className="block" aria-label="SitGuru Manager Portal">
              <Image
                src="/images/email/sitguru-logo-on-dark.png"
                alt="SitGuru"
                width={148}
                height={40}
                className="h-10 w-auto"
                priority
              />
              <p className="mt-2 text-[11px] font-semibold leading-4 !text-white/80">
                Happy Pets. Stronger Communities.
              </p>
            </Link>
          </div>

          <nav aria-label="Manager Portal" className="flex flex-1 flex-col gap-1 px-3 py-4">
            {MANAGER_PORTAL_SIDEBAR.map((item) => {
              const Icon = ICONS[item.label];
              const active = navActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? "flex min-h-11 items-center gap-3 rounded-2xl bg-white/15 px-3 text-sm font-black !text-white"
                      : "flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-bold !text-white/85 hover:bg-white/10"
                  }
                >
                  <Icon size={18} className="shrink-0 opacity-90" />
                  <span className="flex-1">{item.label}</span>
                  {item.label === "Messaging" && unreadMessages > 0 ? (
                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black !text-white">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-white/10 p-4">
            <div className="overflow-hidden rounded-[1.4rem] bg-white/10">
              <div className="relative h-28">
                <Image
                  src="/images/homepage/sitguru-dog-walking-hero.jpg"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="220px"
                />
              </div>
              <p className="px-3 py-3 text-xs font-semibold leading-5 !text-white/90">
                {MANAGER_PORTAL_BRAND.tagline}
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-emerald-100/80 bg-[#F3F6F4]/95 backdrop-blur">
            <div className="flex min-h-16 items-center gap-3 px-3 py-2 sm:px-5 lg:px-6">
              <Link href={MANAGER_PORTAL_BRAND.homePath} className="min-w-0 xl:hidden">
                <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
                  {MANAGER_PORTAL_BRAND.kicker}
                </p>
                <p className="truncate text-sm font-black text-slate-950">
                  {MANAGER_PORTAL_BRAND.deskTitle}
                </p>
              </Link>

              <label className="relative mx-auto hidden min-w-0 max-w-xl flex-1 md:block">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  placeholder="Search interns, tasks, messages, or help..."
                  className="min-h-11 w-full rounded-2xl border border-emerald-100 bg-white pl-10 pr-3 text-sm font-semibold text-slate-800 outline-none ring-emerald-700/20 focus:ring-2"
                />
              </label>

              <div className="ml-auto flex items-center gap-2">
                <Link
                  href="/manager/events"
                  className="hidden min-h-11 items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-3 text-xs font-black text-emerald-950 sm:inline-flex"
                >
                  <CalendarDays size={14} />
                  Events
                </Link>
                <SiteAccountMenu />
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-3 py-4 sm:px-5 lg:px-6 lg:py-6">{children}</main>
          <GrowthPhoneBar
            pathname={pathname}
            basePath={GROWTH_MANAGER_BASE}
            hideFrom="xl"
          />
        </div>
      </div>
    </div>
  );
}
