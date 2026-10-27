"use client";

import Image from "next/image";
import {
  BookOpen,
  CircleHelp,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  CreditCard,
  Home,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  PawPrint,
  Search,
  Users,
} from "lucide-react";
import ManagerDeskHome from "@/components/manager/ManagerDeskHome";
import InternPortalHome from "@/components/internship/InternPortalHome";
import { PortalDeskProfileStatic } from "@/components/portal/PortalDeskProfile";
import type { ManagerDeskBundle } from "@/lib/admin/growth/manager-desk-model";
import type { InternshipWorkspaceData } from "@/lib/internship/types";
import type { HourSummary } from "@/lib/internship/hours";
import { MANAGER_PORTAL_BRAND } from "@/lib/admin/growth/manager-portal";
import { INTERN_PORTAL_BRAND } from "@/lib/internship/intern-portal-nav";
import { DESK_UI } from "@/lib/portal/desk-ui";

function MockSidebar({ kind }: { kind: "manager" | "intern" }) {
  const items =
    kind === "manager"
      ? [
          ["Home", Home, false],
          ["Manager Desk", LayoutDashboard, true],
          ["Interns", Users, false],
          ["Growth", Megaphone, false],
          ["Messaging", MessageCircle, false],
          ["My Time", Clock3, false],
          ["Payments", CreditCard, false],
          ["Help", CircleHelp, false],
        ]
      : [
          ["Home", LayoutDashboard, true],
          ["My Work", ClipboardList, false],
          ["Hours", Clock3, false],
          ["Check-Ins", ClipboardCheck, false],
          ["Messages", MessageCircle, false],
          ["Milestones", BookOpen, false],
          ["Help", CircleHelp, false],
        ];

  return (
    <aside className="sticky top-0 hidden h-full min-h-[720px] w-[232px] shrink-0 flex-col border-r border-slate-200/80 bg-white xl:flex">
      <div className="border-b border-slate-100 px-4 py-5">
        <div className="flex items-center gap-2.5">
          <Image
            src="/images/sitguru-logo-mark.png"
            alt="SitGuru"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <div>
            <p className="text-lg font-black leading-none text-[#0F2744]">SitGuru</p>
            <p className="mt-1 text-[10px] font-semibold leading-3 text-slate-500">
              Happy Pets. Stronger Communities.
            </p>
          </div>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {items.map(([label, Icon, active]) => {
          const IconCmp = Icon as typeof LayoutDashboard;
          const isActive = Boolean(active);
          return (
            <div
              key={String(label)}
              className={
                isActive
                  ? `flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-bold ${DESK_UI.sidebarActive}`
                  : `flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-semibold ${DESK_UI.sidebarIdle}`
              }
            >
              <IconCmp size={18} />
              <span className="flex-1">{String(label)}</span>
              {label === "Messaging" || label === "Messages" ? (
                <span className="rounded-full bg-[#F05A4A] px-2 py-0.5 text-[10px] font-black !text-white">
                  3
                </span>
              ) : null}
            </div>
          );
        })}
      </nav>
      <div className="mt-auto p-4">
        <div
          className={`overflow-hidden rounded-2xl ${kind === "manager" ? "bg-[#F0FDFA]" : "bg-[#EFF6FF]"}`}
        >
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
            {kind === "manager"
              ? MANAGER_PORTAL_BRAND.tagline
              : INTERN_PORTAL_BRAND.sidebarFooter}
          </p>
        </div>
      </div>
    </aside>
  );
}

function MockTopBar({
  kind,
  mobile = false,
}: {
  kind: "manager" | "intern";
  mobile?: boolean;
}) {
  return (
    <header className="border-b border-slate-200/70 bg-white">
      <div className="flex min-h-14 items-center gap-2 px-3 py-2 sm:min-h-16 sm:px-5">
        <div className="min-w-0 xl:hidden">
          <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-[#0D5C3A]">
            {kind === "manager" ? MANAGER_PORTAL_BRAND.kicker : "SitGuru Internship"}
          </p>
          <p className="truncate text-sm font-black text-[#0F2744]">
            {kind === "manager" ? MANAGER_PORTAL_BRAND.deskTitle : INTERN_PORTAL_BRAND.title}
          </p>
        </div>
        {!mobile ? (
          <label className="relative mx-auto hidden min-w-0 max-w-xl flex-1 md:block">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              readOnly
              value=""
              placeholder={
                kind === "manager"
                  ? "Search interns, tasks, messages, or help..."
                  : "Search assignments, messages, or help..."
              }
              className={DESK_UI.search}
            />
          </label>
        ) : (
          <div className="flex-1" />
        )}
        <PortalDeskProfileStatic
          name={kind === "manager" ? "Ava Venezia" : "Ryan"}
          title={
            kind === "manager"
              ? "Social Media & Community Growth Manager"
              : "Social Media & Content Intern"
          }
          avatarUrl={
            kind === "manager"
              ? "/images/demo/emma-walsh.png"
              : "/images/demo/caleb-brooks.png"
          }
          notifications={kind === "manager" ? 5 : 3}
        />
      </div>
    </header>
  );
}

function MockMobileBar({ kind }: { kind: "manager" | "intern" }) {
  const items =
    kind === "manager"
      ? ["Home", "Messages", "Interns", "More"]
      : ["Home", "Work", "Hours", "Check-In", "More"];
  return (
    <div className="border-t border-slate-200 bg-white px-2 py-2 xl:hidden">
      <div className="grid grid-cols-4 gap-1 sm:grid-cols-5">
        {items.map((label, index) => (
          <div
            key={label}
            className={`flex min-h-12 flex-col items-center justify-center rounded-2xl text-[11px] font-bold ${
              index === 0 ? "bg-[#E7F5EE] text-[#0D5C3A]" : "text-slate-500"
            }`}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ManagerMockFrame({
  desk,
  mobile = false,
}: {
  desk: ManagerDeskBundle;
  mobile?: boolean;
}) {
  return (
    <div className={`overflow-hidden ${DESK_UI.pageBg} ${mobile ? "" : "min-h-[820px]"}`}>
      <div className={`flex ${mobile ? "flex-col" : "min-h-[820px]"}`}>
        {!mobile ? <MockSidebar kind="manager" /> : null}
        <div className="flex min-w-0 flex-1 flex-col">
          <MockTopBar kind="manager" mobile={mobile} />
          <div className="min-w-0 flex-1 px-3 py-4 sm:px-5">
            <ManagerDeskHome desk={desk} />
          </div>
          {mobile ? <MockMobileBar kind="manager" /> : null}
        </div>
      </div>
    </div>
  );
}

export function InternMockFrame({
  data,
  hourSummary,
  firstName,
  mobile = false,
}: {
  data: InternshipWorkspaceData;
  hourSummary: HourSummary;
  firstName: string;
  mobile?: boolean;
}) {
  return (
    <div className={`overflow-hidden ${DESK_UI.pageBg} ${mobile ? "" : "min-h-[820px]"}`}>
      <div className={`flex ${mobile ? "flex-col" : "min-h-[820px]"}`}>
        {!mobile ? <MockSidebar kind="intern" /> : null}
        <div className="flex min-w-0 flex-1 flex-col">
          <MockTopBar kind="intern" mobile={mobile} />
          <div className="min-w-0 flex-1 px-3 py-4 sm:px-5">
            <InternPortalHome
              data={data}
              hourSummary={hourSummary}
              firstName={firstName}
              weeklyDone
              currentAssignmentTitle="Social Media Campaign"
              preview
              onOpenWork={() => {}}
              onOpenCheckIn={() => {}}
              onOpenHours={() => {}}
              onOpenMilestones={() => {}}
            />
          </div>
          {mobile ? <MockMobileBar kind="intern" /> : null}
        </div>
      </div>
    </div>
  );
}

export function MockupLinks() {
  return (
    <div className="mt-3 flex flex-wrap gap-2 text-sm font-black">
      <a href="?view=manager" className="rounded-full bg-[#0D5C3A] px-3 py-2 !text-white">
        Manager
      </a>
      <a href="?view=intern" className="rounded-full bg-[#0D5C3A] px-3 py-2 !text-white">
        Intern
      </a>
      <a
        href="?view=both"
        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[#0F2744]"
      >
        Both
      </a>
    </div>
  );
}
