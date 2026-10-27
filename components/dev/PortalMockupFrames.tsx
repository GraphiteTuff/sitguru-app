"use client";

import Image from "next/image";
import {
  BookOpen,
  CircleHelp,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Search,
  Users,
} from "lucide-react";
import ManagerDeskHome from "@/components/manager/ManagerDeskHome";
import InternPortalHome from "@/components/internship/InternPortalHome";
import type { ManagerDeskBundle } from "@/lib/admin/growth/manager-desk-model";
import type { InternshipWorkspaceData } from "@/lib/internship/types";
import type { HourSummary } from "@/lib/internship/hours";
import { MANAGER_PORTAL_BRAND } from "@/lib/admin/growth/manager-portal";
import { INTERN_PORTAL_BRAND } from "@/lib/internship/intern-portal-nav";

function MockSidebar({
  kind,
}: {
  kind: "manager" | "intern";
}) {
  const items =
    kind === "manager"
      ? [
          ["Manager Desk", LayoutDashboard],
          ["Interns", Users],
          ["Growth", Megaphone],
          ["Messaging", MessageCircle],
          ["My Time", Clock3],
          ["Payments", CreditCard],
          ["Help", CircleHelp],
        ]
      : [
          ["Home", LayoutDashboard],
          ["My Work", ClipboardList],
          ["Hours", Clock3],
          ["Check-Ins", ClipboardCheck],
          ["Messages", MessageCircle],
          ["Milestones", BookOpen],
          ["Help", CircleHelp],
        ];

  return (
    <aside className="public-dark-section sticky top-0 hidden h-full min-h-[720px] w-[232px] shrink-0 flex-col bg-[#0D5C3A] text-white xl:flex">
      <div className="border-b border-white/10 px-4 py-5">
        <Image
          src="/images/email/sitguru-logo-on-dark.png"
          alt="SitGuru"
          width={140}
          height={36}
          className="h-9 w-auto"
        />
        <p className="mt-2 text-[11px] font-semibold leading-4 !text-white/80">
          Happy Pets. Stronger Communities.
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {items.map(([label, Icon], index) => {
          const IconCmp = Icon as typeof LayoutDashboard;
          const active = index === 0;
          return (
            <div
              key={String(label)}
              className={
                active
                  ? "flex min-h-11 items-center gap-3 rounded-2xl bg-white/15 px-3 text-sm font-black !text-white"
                  : "flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-bold !text-white/85"
              }
            >
              <IconCmp size={18} />
              {String(label)}
              {label === "Messaging" || label === "Messages" ? (
                <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black !text-white">
                  3
                </span>
              ) : null}
            </div>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-white/10 p-4">
        <div className="overflow-hidden rounded-[1.4rem] bg-white/10">
          <div className="relative h-24">
            <Image
              src="/images/homepage/sitguru-dog-walking-hero.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="220px"
            />
          </div>
          <p className="px-3 py-3 text-xs font-semibold leading-5 !text-white/90">
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
    <header className="border-b border-emerald-100/80 bg-[#F3F6F4]">
      <div className="flex min-h-14 items-center gap-2 px-3 py-2 sm:min-h-16 sm:px-5">
        <div className="min-w-0 xl:hidden">
          <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
            {kind === "manager"
              ? MANAGER_PORTAL_BRAND.kicker
              : "SitGuru Internship"}
          </p>
          <p className="truncate text-sm font-black text-slate-950">
            {kind === "manager"
              ? MANAGER_PORTAL_BRAND.deskTitle
              : INTERN_PORTAL_BRAND.title}
          </p>
        </div>
        {!mobile ? (
          <label className="relative mx-auto hidden min-w-0 max-w-xl flex-1 md:block">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              readOnly
              value=""
              placeholder={
                kind === "manager"
                  ? "Search interns, tasks, messages, or help..."
                  : "Search assignments, messages, or help..."
              }
              className="min-h-11 w-full rounded-2xl border border-emerald-100 bg-white pl-10 pr-3 text-sm font-semibold text-slate-800"
            />
          </label>
        ) : (
          <div className="flex-1" />
        )}
        <div className="ml-auto rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-right">
          <p className="text-xs font-black text-slate-950">
            {kind === "manager" ? "Ava Venezia" : "Ryan"}
          </p>
          <p className="text-[10px] font-semibold text-slate-500">
            {kind === "manager"
              ? "Manager Portal"
              : "Social Media & Content Intern"}
          </p>
        </div>
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
    <div className="border-t border-emerald-100 bg-white px-2 py-2 xl:hidden">
      <div className="grid grid-cols-4 gap-1 sm:grid-cols-5">
        {items.map((label, index) => (
          <div
            key={label}
            className={`flex min-h-12 flex-col items-center justify-center rounded-2xl text-[11px] font-black ${
              index === 0 ? "bg-emerald-50 text-emerald-900" : "text-slate-500"
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
    <div className={`overflow-hidden bg-[#F3F6F4] ${mobile ? "" : "min-h-[820px]"}`}>
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
    <div className={`overflow-hidden bg-[#F3F6F4] ${mobile ? "" : "min-h-[820px]"}`}>
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
        className="rounded-full border border-emerald-200 px-3 py-2 text-emerald-950"
      >
        Both
      </a>
    </div>
  );
}
