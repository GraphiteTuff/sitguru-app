"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarDays,
  CircleHelp,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Flag,
  FolderOpen,
  GraduationCap,
  Home,
  LayoutDashboard,
  LineChart,
  MessageCircle,
  PawPrint,
  Search,
  Settings,
  Sparkles,
  Wrench,
} from "lucide-react";
import { PortalDeskProfileLive } from "@/components/portal/PortalDeskProfile";
import {
  INTERN_PORTAL_BRAND,
  INTERN_PORTAL_MOBILE_MORE,
  INTERN_PORTAL_SIDEBAR,
  internPortalNavActive,
  isInternPortalChromePath,
} from "@/lib/internship/intern-portal-nav";
import { DESK_UI } from "@/lib/portal/desk-ui";

const ICONS = {
  Home,
  "Intern Portal": LayoutDashboard,
  "My Work": ClipboardList,
  "My Assignments": ClipboardList,
  "My Milestones": Flag,
  "My Hours": Clock3,
  "My Check-Ins": ClipboardCheck,
  Messages: MessageCircle,
  "Live Results": LineChart,
  Calendar: CalendarDays,
  Metrics: BarChart3,
  "Business Growth Report": Sparkles,
  "Intern Toolkit": Wrench,
  Training: GraduationCap,
  Resources: FolderOpen,
  Help: CircleHelp,
} as const;

export default function InternPortalShell({
  children,
  assigned = false,
  onboarded = false,
  unreadMessages = 0,
  profileTitle = "Social Media & Content Intern",
}: {
  children: React.ReactNode;
  assigned?: boolean;
  onboarded?: boolean;
  unreadMessages?: number;
  profileTitle?: string;
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
    <div className={`min-h-dvh ${DESK_UI.pageBg} text-[#0F2744]`}>
      <div className="mx-auto flex min-h-dvh max-w-[1600px]">
        {showFullChrome ? (
          <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r border-slate-200/80 bg-white xl:flex">
            <div className="border-b border-slate-100 px-4 py-5">
              <Link href="/intern" className="block" aria-label="SitGuru Intern Portal">
                <div className="flex items-center gap-2.5">
                  <Image
                    src="/images/sitguru-logo-mark.png"
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                    priority
                  />
                  <div>
                    <p className="text-lg font-black leading-none text-[#0F2744]">SitGuru</p>
                    <p className="mt-1 text-[10px] font-semibold leading-3 text-slate-500">
                      {INTERN_PORTAL_BRAND.tagline}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
            <nav
              aria-label="Intern Portal"
              className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4"
            >
              {INTERN_PORTAL_SIDEBAR.map((item) => {
                const Icon = ICONS[item.label as keyof typeof ICONS] || Home;
                const active = internPortalNavActive(pathname, search, item);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={
                      active
                        ? `flex min-h-10 items-center gap-3 rounded-2xl px-3 text-sm font-bold ${DESK_UI.sidebarActive}`
                        : `flex min-h-10 items-center gap-3 rounded-2xl px-3 text-sm font-semibold ${DESK_UI.sidebarIdle}`
                    }
                  >
                    <Icon size={17} className="shrink-0 opacity-90" />
                    <span className="flex-1">{item.label}</span>
                    {item.id === "messages" && unreadMessages > 0 ? (
                      <span className="rounded-full bg-[#F05A4A] px-2 py-0.5 text-[10px] font-black !text-white">
                        {unreadMessages > 9 ? "9+" : unreadMessages}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
            <div className="space-y-3 p-4">
              <Link
                href="/intern?edit=page"
                className={`flex min-h-10 items-center gap-3 rounded-2xl px-3 text-sm font-semibold ${DESK_UI.sidebarIdle}`}
              >
                <Settings size={17} />
                Settings
              </Link>
              <div className="overflow-hidden rounded-2xl bg-[#EFF6FF]">
                <div className="relative h-24">
                  <Image
                    src="/images/homepage/sitguru-dog-walking-hero.jpg"
                    alt=""
                    fill
                    className="object-cover"
                    sizes="220px"
                  />
                </div>
                <p className="flex items-start gap-2 px-3 py-3 text-xs font-semibold leading-5 text-[#0F2744]">
                  <PawPrint size={14} className="mt-0.5 shrink-0 text-[#0D5C3A]" />
                  {INTERN_PORTAL_BRAND.sidebarFooter}
                </p>
              </div>
            </div>
          </aside>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          {showFullChrome ? (
            <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur">
              <div className="flex min-h-16 items-center gap-3 px-3 py-2 sm:px-5 lg:px-6">
                <Link href="/intern" className="min-w-0 xl:hidden">
                  <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-[#0D5C3A]">
                    SitGuru Internship
                  </p>
                  <p className="truncate text-sm font-black text-[#0F2744]">
                    {INTERN_PORTAL_BRAND.title}
                  </p>
                </Link>

                <label className="relative mx-auto hidden min-w-0 max-w-xl flex-1 md:block">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="search"
                    placeholder="Search assignments, resources, or help..."
                    className={DESK_UI.search}
                  />
                </label>

                <PortalDeskProfileLive
                  title={profileTitle}
                  notifications={unreadMessages || 3}
                  notificationsHref="/intern/messages"
                />
              </div>
            </header>
          ) : null}

          <main className="min-w-0 flex-1 px-3 py-4 sm:px-5 lg:px-6 lg:py-6">{children}</main>

          {showFullChrome ? (
            <div className="sticky bottom-0 z-40 border-t border-slate-200 bg-white px-2 py-2 xl:hidden">
              <div className="grid grid-cols-5 gap-1">
                {[
                  ["Home", "/intern", Home],
                  ["Work", "/intern/work", Briefcase],
                  ["Hours", "/intern/time", Clock3],
                  ["Check-In", "/intern/check-ins", ClipboardCheck],
                  ["More", "#more", BookOpen],
                ].map(([label, href, Icon], index) => {
                  const IconCmp = Icon as typeof Home;
                  const isMore = href === "#more";
                  const active =
                    !isMore &&
                    (pathname === href ||
                      (href !== "/intern" && pathname.startsWith(String(href))));
                  return (
                    <button
                      key={String(label)}
                      type="button"
                      onClick={() => {
                        if (isMore) setMoreOpen((open) => !open);
                        else window.location.href = String(href);
                      }}
                      className={`flex min-h-12 flex-col items-center justify-center rounded-2xl text-[11px] font-bold ${
                        active || (isMore && moreOpen)
                          ? "bg-[#E7F5EE] text-[#0D5C3A]"
                          : "text-slate-500"
                      }`}
                    >
                      <IconCmp size={16} />
                      {String(label)}
                    </button>
                  );
                })}
              </div>
              {moreOpen ? (
                <div className="mt-2 grid gap-1 rounded-2xl border border-slate-200 bg-white p-2">
                  {INTERN_PORTAL_MOBILE_MORE.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-xl px-3 py-2 text-sm font-bold text-[#0F2744] hover:bg-slate-50"
                      onClick={() => setMoreOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
