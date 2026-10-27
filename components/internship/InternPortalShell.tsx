"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChart3,
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
  Settings,
  Sparkles,
  Wrench,
} from "lucide-react";
import { PortalDeskProfileLive } from "@/components/portal/PortalDeskProfile";
import DeskSearch from "@/components/portal/DeskSearch";
import WebappBottomNav from "@/components/portal/WebappBottomNav";
import {
  INTERN_PORTAL_BRAND,
  INTERN_PORTAL_MOBILE_MORE,
  INTERN_PORTAL_SIDEBAR,
  internPortalNavActive,
  isInternPortalChromePath,
} from "@/lib/internship/intern-portal-nav";
import { INTERN_BANNER, DESK_LOGO, DESK_UI } from "@/lib/portal/desk-ui";

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
  schoolLogoUrl = "",
}: {
  children: React.ReactNode;
  assigned?: boolean;
  onboarded?: boolean;
  unreadMessages?: number;
  profileTitle?: string;
  schoolLogoUrl?: string;
}) {
  const pathname = usePathname() || "/intern";
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";

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
                <Image
                  src={DESK_LOGO}
                  alt="SitGuru. Trusted Pet Care Simplified."
                  width={420}
                  height={140}
                  className="h-14 w-full object-contain object-left mix-blend-multiply"
                  priority
                />
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
                href="/intern/settings"
                className={`flex min-h-10 items-center gap-3 rounded-2xl px-3 text-sm font-semibold ${
                  pathname === "/intern/settings" || pathname.startsWith("/intern/settings/")
                    ? DESK_UI.sidebarActive
                    : DESK_UI.sidebarIdle
                }`}
              >
                <Settings size={17} />
                Settings
              </Link>
              <div className="overflow-hidden rounded-2xl bg-[#EFF6FF]">
                <div className="relative flex h-24 items-center justify-center bg-white">
                  {schoolLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={schoolLogoUrl}
                      alt="School logo"
                      className="max-h-20 max-w-[85%] object-contain mix-blend-multiply"
                    />
                  ) : (
                    <Image
                      src={INTERN_BANNER}
                      alt=""
                      fill
                      className="object-cover object-center"
                      sizes="220px"
                    />
                  )}
                </div>
                <p className="flex items-start gap-2 px-3 py-3 text-xs font-semibold leading-5 text-[#0F2744]">
                  <PawPrint size={14} className="mt-0.5 shrink-0 text-[#2563EB]" />
                  {INTERN_PORTAL_BRAND.sidebarFooter}
                </p>
              </div>
            </div>
          </aside>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          {showFullChrome ? (
            <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur">
              <div className="flex min-h-[4.75rem] items-center gap-3 px-3 py-2 sm:px-5 lg:px-6">
                <Link href="/intern" className="min-w-0 shrink-0 xl:hidden">
                  <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-[#2563EB]">
                    SitGuru Internship
                  </p>
                  <p className="truncate text-sm font-black text-[#0F2744]">
                    {INTERN_PORTAL_BRAND.title}
                  </p>
                </Link>

                <DeskSearch
                  audience="intern"
                  placeholder="Search assignments, resources, or help..."
                />

                <PortalDeskProfileLive
                  title={profileTitle}
                  notifications={unreadMessages || 3}
                  notificationsHref="/intern/messages"
                />
              </div>
            </header>
          ) : null}

          <main className="min-w-0 flex-1 px-3 py-4 pb-28 sm:px-5 lg:px-6 lg:py-6 xl:pb-8">{children}</main>

          {showFullChrome ? (
            <WebappBottomNav
              label="Intern navigation"
              items={[
                { label: "Home", href: "/intern", icon: Home, match: (path) => path === "/intern" || path === "/intern/" },
                { label: "Work", href: "/intern/work", icon: Briefcase, match: (path) => path.startsWith("/intern/work") },
                { label: "Hours", href: "/intern/time", icon: Clock3, match: (path) => path.startsWith("/intern/time") },
                { label: "Check-In", href: "/intern/check-ins", icon: ClipboardCheck, match: (path) => path.startsWith("/intern/check-ins") },
              ]}
              more={INTERN_PORTAL_MOBILE_MORE.map((item) => ({ label: item.label, href: item.href }))}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
