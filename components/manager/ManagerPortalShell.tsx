"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarCheck2,
  CalendarDays,
  CircleHelp,
  ClipboardList,
  Clock3,
  CreditCard,
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
  Users,
  Wrench,
} from "lucide-react";
import { PortalDeskProfileLive } from "@/components/portal/PortalDeskProfile";
import DeskSearch from "@/components/portal/DeskSearch";
import WebappBottomNav from "@/components/portal/WebappBottomNav";
import {
  isManagerGrowthHomePath,
  MANAGER_PORTAL_BRAND,
  MANAGER_PORTAL_SIDEBAR,
} from "@/lib/admin/growth/manager-portal";
import { DESK_UI } from "@/lib/portal/desk-ui";

const GROWTH_MANAGER_BASE = "/manager";

const ICONS = {
  Home,
  "Growth Home": Sparkles,
  "Manager Desk": LayoutDashboard,
  "My Time": Clock3,
  "My Payments": CreditCard,
  "My Team": Users,
  Assignments: ClipboardList,
  "Check-Ins": CalendarCheck2,
  Milestones: Flag,
  Messaging: MessageCircle,
  "Live Results": LineChart,
  Calendar: CalendarDays,
  Metrics: BarChart3,
  Reports: BarChart3,
  "Business Growth Report": BarChart3,
  "Manager Toolkit": Wrench,
  Training: GraduationCap,
  Resources: FolderOpen,
  Help: CircleHelp,
} as const;

function navActive(pathname: string, item: (typeof MANAGER_PORTAL_SIDEBAR)[number]) {
  if (item.match === "none") return false;
  if (item.match === "exact") return pathname === item.href || pathname === `${item.href}/`;
  if (item.match === "growth-home") return isManagerGrowthHomePath(pathname);
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
    <div className={`min-h-dvh ${DESK_UI.pageBg} text-[#0F2744]`}>
      <div className="mx-auto flex min-h-dvh max-w-[1600px]">
        <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r border-slate-200/80 bg-white xl:flex">
          <div className="border-b border-slate-100 px-5 py-5">
            <Link href={MANAGER_PORTAL_BRAND.homePath} className="block" aria-label="SitGuru Manager Portal">
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
                    Happy Pets. Stronger Communities.
                  </p>
                </div>
              </div>
            </Link>
          </div>

          <nav aria-label="Manager Portal" className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
            {MANAGER_PORTAL_SIDEBAR.map((item) => {
              const Icon = ICONS[item.label as keyof typeof ICONS] || LayoutDashboard;
              const active = navActive(pathname, item);
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={
                    active
                      ? `flex min-h-10 items-center gap-3 rounded-2xl px-3 text-sm font-bold ${DESK_UI.sidebarActive}`
                      : `flex min-h-10 items-center gap-3 rounded-2xl px-3 text-sm font-semibold ${DESK_UI.sidebarIdle}`
                  }
                >
                  <Icon size={17} className="shrink-0 opacity-90" />
                  <span className="flex-1">{item.label}</span>
                  {item.label === "Messaging" && unreadMessages > 0 ? (
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
              href={MANAGER_PORTAL_BRAND.settingsPath}
              className={`flex min-h-10 items-center gap-3 rounded-2xl px-3 text-sm font-semibold ${
                pathname === MANAGER_PORTAL_BRAND.settingsPath ||
                pathname.startsWith(`${MANAGER_PORTAL_BRAND.settingsPath}/`)
                  ? DESK_UI.sidebarActive
                  : DESK_UI.sidebarIdle
              }`}
            >
              <Settings size={17} />
              Settings
            </Link>
            <div className="overflow-hidden rounded-2xl bg-[#F0FDFA]">
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
                <PawPrint size={14} className="mt-0.5 shrink-0 text-[#2563EB]" />
                {MANAGER_PORTAL_BRAND.tagline}
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur">
            <div className="flex min-h-[4.75rem] items-center gap-3 px-3 py-2 sm:px-5 lg:px-6">
              <Link href={MANAGER_PORTAL_BRAND.homePath} className="min-w-0 shrink-0 xl:hidden">
                <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-[#2563EB]">
                  {MANAGER_PORTAL_BRAND.kicker}
                </p>
                <p className="truncate text-sm font-black text-[#0F2744]">
                  {MANAGER_PORTAL_BRAND.title}
                </p>
              </Link>

              <DeskSearch
                audience="manager"
                placeholder="Search interns, assignments, check-ins, messages, or help..."
              />

              <PortalDeskProfileLive
                title={MANAGER_PORTAL_BRAND.kicker}
                notifications={unreadMessages || 5}
                notificationsHref={MANAGER_PORTAL_BRAND.messagesPath}
              />
            </div>
          </header>

          <main className="min-w-0 flex-1 px-3 py-4 pb-28 sm:px-5 lg:px-6 lg:py-6 xl:pb-8">{children}</main>
          <WebappBottomNav
            label="Manager navigation"
            items={[
              { label: "Desk", href: "/manager", icon: LayoutDashboard, match: (path) => path === "/manager" || path === "/manager/" },
              { label: "Team", href: "/manager/team", icon: Users, match: (path) => path.startsWith("/manager/team") },
              { label: "Check-Ins", href: "/manager/check-ins", icon: CalendarCheck2, match: (path) => path.startsWith("/manager/check-ins") },
              { label: "Messages", href: "/manager/messages", icon: MessageCircle, match: (path) => path.startsWith("/manager/messages") },
            ]}
            more={MANAGER_PORTAL_SIDEBAR.filter(
              (item) =>
                !["/manager", "/manager/team", "/manager/check-ins", "/manager/messages"].includes(item.href) ||
                item.label === "Growth Home",
            )
              .filter((item) => item.label !== "Home")
              .concat([{ href: MANAGER_PORTAL_BRAND.settingsPath, label: "Settings", match: "prefix" }])
              .map((item) => ({ label: item.label, href: item.href }))}
          />
        </div>
      </div>
    </div>
  );
}
