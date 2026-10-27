"use client";

import Image from "next/image";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CircleHelp,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  CreditCard,
  FolderOpen,
  GraduationCap,
  Home,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  PawPrint,
  Search,
  Settings,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import ManagerDeskHome from "@/components/manager/ManagerDeskHome";
import ManagerGrowthWorkspaceHome from "@/components/manager/ManagerGrowthWorkspaceHome";
import InternPortalHome from "@/components/internship/InternPortalHome";
import InternGrowthWorkspaceHome from "@/components/internship/InternGrowthWorkspaceHome";
import { PortalDeskProfileStatic } from "@/components/portal/PortalDeskProfile";
import type { ManagerDeskBundle } from "@/lib/admin/growth/manager-desk-model";
import type { InternshipWorkspaceData } from "@/lib/internship/types";
import type { HourSummary } from "@/lib/internship/hours";
import { MANAGER_PORTAL_BRAND } from "@/lib/admin/growth/manager-portal";
import { INTERN_PORTAL_BRAND } from "@/lib/internship/intern-portal-nav";
import { DESK_UI } from "@/lib/portal/desk-ui";

function MockSidebar({
  kind,
  active = "desk",
}: {
  kind: "manager" | "intern";
  active?: "desk" | "growth";
}) {
  const items =
    kind === "manager"
      ? [
          ["Home", Home, false],
          ["Growth Home", Sparkles, active === "growth"],
          ["Manager Desk", LayoutDashboard, active === "desk"],
          ["My Time", Clock3, false],
          ["My Payments", CreditCard, false],
          ["My Team", Users, false],
          ["Assignments", ClipboardList, false],
          ["Check-Ins", ClipboardCheck, false],
          ["Milestones", BookOpen, false],
          ["Messaging", MessageCircle, false],
          ["Live Results", BarChart3, false],
          ["Calendar", CalendarDays, false],
          ["Metrics", Megaphone, false],
          ["Reports", BarChart3, false],
          ["Manager Toolkit", Wrench, false],
          ["Training", GraduationCap, false],
          ["Resources", FolderOpen, false],
          ["Help", CircleHelp, false],
        ]
      : [
          ["Home", LayoutDashboard, active === "desk"],
          ["Intern Portal", LayoutDashboard, false],
          ["My Work", ClipboardList, false],
          ["My Assignments", ClipboardList, false],
          ["My Milestones", BookOpen, false],
          ["My Hours", Clock3, false],
          ["My Check-Ins", ClipboardCheck, false],
          ["Messages", MessageCircle, false],
          ["Live Results", BarChart3, false],
          ["Calendar", CalendarDays, false],
          ["Metrics", Megaphone, false],
          ["Business Growth Report", Sparkles, active === "growth"],
          ["Intern Toolkit", Wrench, false],
          ["Training", GraduationCap, false],
          ["Resources", FolderOpen, false],
          ["Help", CircleHelp, false],
        ];

  return (
    <aside className="sticky top-0 hidden h-full min-h-[720px] w-[248px] shrink-0 flex-col border-r border-slate-200/80 bg-white xl:flex">
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
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
        {items.map(([label, Icon, itemActive]) => {
          const IconCmp = Icon as typeof LayoutDashboard;
          const isActive = Boolean(itemActive);
          return (
            <div
              key={String(label)}
              className={
                isActive
                  ? `flex min-h-9 items-center gap-3 rounded-2xl px-3 text-sm font-bold ${DESK_UI.sidebarActive}`
                  : `flex min-h-9 items-center gap-3 rounded-2xl px-3 text-sm font-semibold ${DESK_UI.sidebarIdle}`
              }
            >
              <IconCmp size={16} />
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
      <div className="space-y-3 p-4">
        <div className={`flex min-h-9 items-center gap-3 rounded-2xl px-3 text-sm font-semibold ${DESK_UI.sidebarIdle}`}>
          <Settings size={16} />
          Settings
        </div>
        <div
          className={`overflow-hidden rounded-2xl ${kind === "manager" ? "bg-[#F0FDFA]" : "bg-[#EFF6FF]"}`}
        >
          <div className="relative h-20">
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
        {!mobile ? <MockSidebar kind="manager" active="desk" /> : null}
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

export function ManagerGrowthMockFrame({
  desk,
  mobile = false,
}: {
  desk: ManagerDeskBundle;
  mobile?: boolean;
}) {
  const team = [
    ...desk.cards.map((card) => ({
      id: card.id,
      name: card.name === "Ryan" ? "Ryan Chen" : card.name === "Lola" ? "Lola Martinez" : card.name,
      status: card.paceTone,
      statusLabel: card.paceLabel,
      school: card.school,
      program: card.school,
      hoursSubmitted: card.summary.submittedHours || 0,
      hoursApproved: card.summary.approvedHours || 0,
      managerDeskHref: `/intern/manage?intern=${card.id}`,
    })),
    {
      id: "jordan",
      name: "Jordan Kim",
      status: "at_risk",
      statusLabel: "Needs Attention",
      school: "Growth Research Intern",
      program: "Growth Research Intern",
      hoursSubmitted: 44,
      hoursApproved: 40,
      managerDeskHref: "/intern/manage",
    },
  ];

  return (
    <div className={`overflow-hidden ${DESK_UI.pageBg} ${mobile ? "" : "min-h-[820px]"}`}>
      <div className={`flex ${mobile ? "flex-col" : "min-h-[820px]"}`}>
        {!mobile ? <MockSidebar kind="manager" active="growth" /> : null}
        <div className="flex min-w-0 flex-1 flex-col">
          <MockTopBar kind="manager" mobile={mobile} />
          <div className="min-w-0 flex-1 px-3 py-4 sm:px-5">
            <ManagerGrowthWorkspaceHome
              firstName={desk.firstName}
              team={team}
              initiatives={desk.initiatives}
              reviewCount={5}
              checkInCount={2}
              assignmentCount={2}
              hoursSubmissionCount={1}
              teamHoursThisWeek={24}
              teamHoursPlanned={30}
              deadlines={[
                { title: "Weekly Check-ins", when: "Oct 27", kind: "Check-in" },
                { title: "Community Outreach Plan", when: "Oct 28", kind: "Assignment" },
                { title: "Content Calendar Draft", when: "Oct 30", kind: "Assignment" },
              ]}
              activity={[
                { title: "Ryan Chen submitted a check-in", detail: "2 hours ago" },
                { title: "Lola Martinez completed an assignment", detail: "Yesterday" },
                { title: "Jordan Kim logged hours", detail: "Yesterday" },
                { title: "New help question from Ryan", detail: "Can I post tracking in Stories?" },
              ]}
            />
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
        {!mobile ? <MockSidebar kind="intern" active="desk" /> : null}
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

export function InternGrowthMockFrame({
  firstName,
  mobile = false,
}: {
  firstName: string;
  mobile?: boolean;
}) {
  return (
    <div className={`overflow-hidden ${DESK_UI.pageBg} ${mobile ? "" : "min-h-[820px]"}`}>
      <div className={`flex ${mobile ? "flex-col" : "min-h-[820px]"}`}>
        {!mobile ? <MockSidebar kind="intern" active="growth" /> : null}
        <div className="flex min-w-0 flex-1 flex-col">
          <MockTopBar kind="intern" mobile={mobile} />
          <div className="min-w-0 flex-1 px-3 py-4 sm:px-5">
            <InternGrowthWorkspaceHome
              firstName={firstName}
              hoursThisWeek={8}
              hoursPlanned={10}
              assignmentCount={2}
              assignmentsDueSoon={1}
              checkInsDue={0}
              nextCheckIn="Oct 27"
              milestoneCount={3}
              milestonesInProgress={1}
              assignments={[
                {
                  id: "a1",
                  title: "Create 3 Instagram Posts",
                  status: "In Progress",
                  due: "Oct 27",
                },
                {
                  id: "a2",
                  title: "Community Outreach Plan",
                  status: "Not Started",
                  due: "Nov 3",
                },
                {
                  id: "a3",
                  title: "Q4 Growth Research",
                  status: "Not Started",
                  due: "Nov 10",
                },
              ]}
              progress={[
                { label: "Hours", pct: 65, tone: "bg-[#22C55E]" },
                { label: "Check-ins", pct: 75, tone: "bg-[#3B82F6]" },
                { label: "Assignments", pct: 67, tone: "bg-[#A855F7]" },
                { label: "Milestones", pct: 33, tone: "bg-[#F97316]" },
              ]}
              nextActions={[
                {
                  step: 1,
                  title: "Complete “Create 3 Instagram Posts”",
                  href: "/intern?tab=work",
                  cta: "Open assignment",
                },
                {
                  step: 2,
                  title: "Log this week’s hours",
                  href: "/intern/time",
                  cta: "Log hours",
                },
                {
                  step: 3,
                  title: "Prepare for weekly check-in",
                  href: "/intern?tab=work&focus=checkin",
                  cta: "Start check-in",
                },
              ]}
              messages={[
                {
                  author: "Ava Venezia",
                  preview: "Love these content ideas — keep stacking wins!",
                },
                {
                  author: "SitGuru Help",
                  preview: "Reminder: weekly check-in is Oct 27.",
                },
              ]}
              upcoming={[
                { title: "Weekly Check-in", when: "Oct 27", kind: "Check-in" },
                { title: "Community Outreach Plan", when: "Nov 3", kind: "Assignment" },
                { title: "Complete 40 Hours", when: "Nov 10", kind: "Milestone" },
              ]}
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
        Manager Desk
      </a>
      <a href="?view=intern" className="rounded-full bg-[#0D5C3A] px-3 py-2 !text-white">
        Intern Portal
      </a>
      <a href="?view=growth-manager" className="rounded-full bg-[#0D5C3A] px-3 py-2 !text-white">
        Growth · Manager
      </a>
      <a href="?view=growth-intern" className="rounded-full bg-[#0D5C3A] px-3 py-2 !text-white">
        Growth · Intern
      </a>
      <a
        href="?view=growth"
        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[#0F2744]"
      >
        Growth both
      </a>
      <a
        href="?view=both"
        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[#0F2744]"
      >
        Desk both
      </a>
    </div>
  );
}
