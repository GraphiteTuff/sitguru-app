"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  CircleHelp,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Home,
  MessageCircle,
  Search,
} from "lucide-react";
import { SiteAccountMenu } from "@/components/sitguru/SiteAccountMenu";
import {
  INTERN_PORTAL_BRAND,
  INTERN_PORTAL_MOBILE_MORE,
  INTERN_PORTAL_SIDEBAR,
  internPortalNavActive,
  isInternPortalChromePath,
} from "@/lib/internship/intern-portal-nav";
import { INTERN_GROWTH_WORKPLACE } from "@/lib/internship/intern-tools";

const ICONS = {
  Home,
  "My Work": ClipboardList,
  Hours: Clock3,
  "Check-Ins": ClipboardCheck,
  Messages: MessageCircle,
  Milestones: BookOpen,
  Help: CircleHelp,
} as const;

export default function InternPortalShell({
  children,
  assigned = false,
  onboarded = false,
  unreadMessages = 0,
}: {
  children: React.ReactNode;
  assigned?: boolean;
  onboarded?: boolean;
  unreadMessages?: number;
}) {
  const pathname = usePathname() || "/intern";
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";
  const [moreOpen, setMoreOpen] = useState(false);

  if (!isInternPortalChromePath(pathname)) {
    return <>{children}</>;
  }

  const showFullChrome = assigned && onboarded;

  return (
    <div className="min-h-dvh bg-[#F3F6F4] text-slate-950">
      <div className="mx-auto flex min-h-dvh max-w-[1600px]">
        {showFullChrome ? (
          <aside className="public-dark-section sticky top-0 hidden h-dvh w-[232px] shrink-0 flex-col bg-[#0D5C3A] text-white xl:flex">
            <div className="border-b border-white/10 px-4 py-5">
              <Link href="/intern" className="block" aria-label="SitGuru Intern Portal">
                <Image
                  src="/images/email/sitguru-logo-on-dark.png"
                  alt="SitGuru"
                  width={140}
                  height={36}
                  className="h-9 w-auto"
                  priority
                />
                <p className="mt-2 text-[11px] font-semibold leading-4 !text-white/80">
                  {INTERN_PORTAL_BRAND.tagline}
                </p>
              </Link>
            </div>
            <nav aria-label="Intern Portal" className="flex flex-1 flex-col gap-1 px-3 py-4">
              {INTERN_PORTAL_SIDEBAR.map((item) => {
                const Icon = ICONS[item.label as keyof typeof ICONS] || Home;
                const active = internPortalNavActive(pathname, search, item);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={
                      active
                        ? "flex min-h-11 items-center gap-3 rounded-2xl bg-white/15 px-3 text-sm font-black !text-white"
                        : "flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-bold !text-white/85 hover:bg-white/10"
                    }
                  >
                    <Icon size={18} className="shrink-0 opacity-90" />
                    <span className="flex-1">{item.label}</span>
                    {item.id === "messages" && unreadMessages > 0 ? (
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
                  {INTERN_PORTAL_BRAND.sidebarFooter}
                </p>
              </div>
            </div>
          </aside>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-emerald-100/80 bg-[#F3F6F4]/95 backdrop-blur print:hidden">
            <div className="flex min-h-14 items-center gap-2 px-3 py-2 sm:min-h-16 sm:gap-3 sm:px-5 lg:px-6">
              <Link href="/intern" className="min-w-0 xl:hidden">
                <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
                  SitGuru Internship
                </p>
                <p className="truncate text-sm font-black text-slate-950">
                  {INTERN_PORTAL_BRAND.title}
                </p>
              </Link>

              {showFullChrome ? (
                <label className="relative mx-auto hidden min-w-0 max-w-xl flex-1 md:block">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="search"
                    placeholder="Search assignments, messages, or help..."
                    className="min-h-11 w-full rounded-2xl border border-emerald-100 bg-white pl-10 pr-3 text-sm font-semibold text-slate-800 outline-none ring-emerald-700/20 focus:ring-2"
                  />
                </label>
              ) : (
                <div className="flex-1" />
              )}

              <div className="ml-auto flex items-center gap-2">
                {showFullChrome ? (
                  <Link
                    href={INTERN_GROWTH_WORKPLACE.href}
                    className="hidden min-h-11 items-center rounded-2xl border border-emerald-100 bg-white px-3 text-xs font-black text-emerald-950 lg:inline-flex"
                  >
                    Growth
                  </Link>
                ) : null}
                <SiteAccountMenu compact />
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-3 py-4 sm:px-5 lg:px-6 lg:py-6">{children}</main>

          {showFullChrome ? (
            <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur xl:hidden">
              {moreOpen ? (
                <div className="mb-2 grid grid-cols-2 gap-2 rounded-2xl bg-emerald-50 p-2">
                  {INTERN_PORTAL_MOBILE_MORE.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-2 text-center text-sm font-black text-slate-900"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
              <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
                {INTERN_PORTAL_SIDEBAR.filter((item) =>
                  ["home", "work", "hours", "checkins"].includes(item.id),
                ).map((item) => {
                  const Icon = ICONS[item.label as keyof typeof ICONS] || Home;
                  const active = internPortalNavActive(pathname, search, item);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-black ${
                        active && !moreOpen ? "bg-emerald-50 text-emerald-900" : "text-slate-500"
                      }`}
                    >
                      <Icon size={18} />
                      {item.id === "checkins" ? "Check-In" : item.label.replace("My ", "")}
                    </Link>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setMoreOpen((open) => !open)}
                  className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-black ${
                    moreOpen ? "bg-emerald-50 text-emerald-900" : "text-slate-500"
                  }`}
                  aria-expanded={moreOpen}
                >
                  <CircleHelp size={18} />
                  More
                </button>
              </div>
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
