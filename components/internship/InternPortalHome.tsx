"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileText,
  MessageCircle,
  PawPrint,
  Sparkles,
  Trophy,
} from "lucide-react";
import AskAvaForm from "@/components/internship/AskAvaForm";
import InternWorkSystemsCard from "@/components/internship/InternWorkSystemsCard";
import { INTERN_PORTAL_BRAND } from "@/lib/internship/intern-portal-nav";
import { INTERNSHIP_HELP_PATH, INTERNSHIP_GROWTH_PATH } from "@/lib/internship/intern-growth";
import { taskStatusLabel } from "@/lib/internship/labels";
import { formatHours, type HourSummary } from "@/lib/internship/hours";
import { internPressClass } from "@/lib/internship/intern-ui";
import type { InternshipWorkspaceData } from "@/lib/internship/types";
import { DESK_STAT, DESK_UI, deskInitials } from "@/lib/portal/desk-ui";

function statusTone(status: string, reviewStage?: string | null) {
  const label = taskStatusLabel(status, reviewStage).toLowerCase();
  if (label.includes("complete") || label.includes("approved")) {
    return "bg-[#DCFCE7] text-[#166534]";
  }
  if (label.includes("change") || label.includes("revision")) {
    return "bg-[#FFEDD5] text-[#9A3412]";
  }
  if (label.includes("progress") || label.includes("submitted")) {
    return "bg-[#DCFCE7] text-[#166534]";
  }
  return "bg-[#DBEAFE] text-[#1D4ED8]";
}

function statusDisplay(status: string, reviewStage?: string | null) {
  const label = taskStatusLabel(status, reviewStage);
  if (label === "Changes Requested") return "Needs Revision";
  if (label === "Approved" || label === "Complete") return "Complete";
  if (label === "Submitted" || label === "In Progress" || status === "in_progress") {
    return status === "todo" ? "Upcoming" : "In Progress";
  }
  if (status === "todo") return "Upcoming";
  return label;
}

export default function InternPortalHome({
  data,
  hourSummary,
  firstName,
  weeklyDone,
  currentAssignmentTitle,
  onOpenWork,
  onOpenCheckIn,
  onOpenHours,
  onOpenMilestones,
  preview = false,
}: {
  data: InternshipWorkspaceData;
  hourSummary: HourSummary;
  firstName: string;
  weeklyDone: boolean;
  currentAssignmentTitle: string;
  onOpenWork: () => void;
  onOpenCheckIn: () => void;
  onOpenHours: () => void;
  onOpenMilestones: () => void;
  preview?: boolean;
}) {
  const required = hourSummary.requiredHours || 0;
  const approved = hourSummary.approvedHours || 0;
  const pct =
    hourSummary.progressPercent != null
      ? Math.min(100, Math.round(hourSummary.progressPercent))
      : required > 0
        ? Math.min(100, Math.round((approved / required) * 100))
        : 0;
  const remaining = hourSummary.remainingHours ?? Math.max(0, required - approved);
  const planned = hourSummary.plannedWeeklyHours;
  const assignments = [...(data.tasks || [])]
    .sort((a, b) => Number(a.weekNumber || 0) - Number(b.weekNumber || 0))
    .slice(0, 4);
  const milestones = (data.milestones || []).slice(0, 4);
  const thisWeekReview = (data.weeklyReviews || [])
    .slice()
    .sort((a, b) => String(b.weekOf).localeCompare(String(a.weekOf)))[0];
  const comments = (data.comments || []).slice(0, 3);

  return (
    <div className="space-y-4 pb-28 xl:pb-6">
      <section className="overflow-hidden rounded-2xl border border-sky-100/80 bg-gradient-to-r from-[#EFF6FF] via-white to-[#F0FDF4] shadow-[0_8px_24px_rgba(15,39,68,0.04)]">
        <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:items-center">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-sm font-black text-[#0F2744]">
              <PawPrint size={18} className="text-[#0D5C3A]" />
              {INTERN_PORTAL_BRAND.title}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0F2744] sm:text-4xl">
              Welcome back, {firstName}.
            </h1>
            <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-slate-600">
              Manage your assignments, hours, milestones, and growth work — all in one place.
            </p>
          </div>
          <div className="relative min-h-[140px] overflow-hidden rounded-2xl sm:min-h-[160px]">
            <Image
              src="/images/homepage/sitguru-dog-walking-hero.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 45vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F2744]/50 via-[#0F2744]/15 to-transparent" />
            <div className="relative flex h-full min-h-[140px] flex-col justify-end p-4 sm:min-h-[160px]">
              <p className="max-w-sm text-lg font-black leading-snug !text-white sm:text-xl">
                {INTERN_PORTAL_BRAND.impactLine}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article className={`rounded-2xl border p-4 shadow-sm ${DESK_STAT.green.wrap}`}>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${DESK_STAT.green.iconWrap}`}
            >
              <Clock3 size={18} />
            </span>
            <div className="min-w-0">
              <p className={`text-2xl font-black leading-none ${DESK_STAT.green.value}`}>
                {formatHours(approved)}
                {required ? (
                  <span className="text-sm font-bold text-slate-500">
                    {" "}
                    of {formatHours(required)}
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-xs font-bold text-[#0F2744]">Hours Approved</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/80">
              <div className="h-full rounded-full bg-[#22C55E]" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-bold text-[#166534]">{pct}%</span>
          </div>
        </article>

        <button
          type="button"
          onClick={onOpenHours}
          className={`rounded-2xl border p-4 text-left shadow-sm ${DESK_STAT.sky.wrap} ${internPressClass}`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${DESK_STAT.sky.iconWrap}`}
            >
              <BarChart3 size={18} />
            </span>
            <div>
              <p className={`text-2xl font-black leading-none ${DESK_STAT.sky.value}`}>
                {formatHours(hourSummary.loggedThisWeek)}
              </p>
              <p className="mt-1 text-xs font-bold text-[#0F2744]">This Week&apos;s Hours</p>
            </div>
          </div>
          <p className="mt-2 flex items-center justify-between text-sm font-medium text-slate-600">
            <span>
              {planned
                ? `on track for ${formatHours(planned)} hours`
                : hourSummary.paceLabel}
            </span>
            <ChevronRight size={14} className="text-[#2563EB]" />
          </p>
        </button>

        <button
          type="button"
          onClick={onOpenWork}
          className={`rounded-2xl border p-4 text-left shadow-sm ${DESK_STAT.violet.wrap} ${internPressClass}`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${DESK_STAT.violet.iconWrap}`}
            >
              <FileText size={18} />
            </span>
            <div className="min-w-0">
              <p className={`line-clamp-2 text-base font-black leading-snug ${DESK_STAT.violet.value}`}>
                {currentAssignmentTitle || "No active assignment"}
              </p>
              <p className="mt-1 text-xs font-bold text-[#0F2744]">Current Assignment</p>
            </div>
          </div>
          <p className="mt-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[10px] font-bold text-[#166534]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
              In Progress
            </span>
            <ChevronRight size={14} className="text-[#2563EB]" />
          </p>
        </button>

        <button
          type="button"
          onClick={onOpenMilestones}
          className={`rounded-2xl border p-4 text-left shadow-sm ${DESK_STAT.peach.wrap} ${internPressClass}`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${DESK_STAT.peach.iconWrap}`}
            >
              <Trophy size={18} />
            </span>
            <div>
              <p className={`text-xl font-black leading-none ${DESK_STAT.peach.value}`}>
                {required ? `${formatHours(required)} hours` : hourSummary.weekLabel}
              </p>
              <p className="mt-1 text-xs font-bold text-[#0F2744]">Next Milestone</p>
            </div>
          </div>
          <p className="mt-2 flex items-center justify-between text-sm font-medium text-slate-600">
            <span>Final Project Proposal</span>
            <ChevronRight size={14} className="text-[#2563EB]" />
          </p>
        </button>

        <button
          type="button"
          onClick={onOpenCheckIn}
          className={`rounded-2xl border p-4 text-left shadow-sm sm:col-span-2 xl:col-span-1 ${DESK_STAT.teal.wrap} ${internPressClass}`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${DESK_STAT.teal.iconWrap}`}
            >
              <CheckCircle2 size={18} />
            </span>
            <div>
              <p className={`text-xl font-black leading-none ${DESK_STAT.teal.value}`}>
                {weeklyDone ? "Submitted" : "Due this week"}
              </p>
              <p className="mt-1 text-xs font-bold text-[#0F2744]">Check-In Status</p>
            </div>
          </div>
          <p className="mt-2 flex items-center justify-between text-sm font-medium text-slate-600">
            <span>This week&apos;s check-in</span>
            <ChevronRight size={14} className="text-[#2563EB]" />
          </p>
        </button>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-black text-[#0F2744]">
              <ClipboardList size={18} className="text-[#2563EB]" />
              My Assignments
            </h2>
            <button
              type="button"
              onClick={onOpenWork}
              className={`inline-flex items-center gap-1 text-xs font-bold ${DESK_UI.link}`}
            >
              View all <ChevronRight size={12} />
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {assignments.map((task) => (
              <li
                key={task.id}
                className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-[#F8FAFC] px-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-[#0F2744]">
                    {task.title}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    Week {task.weekNumber || "—"}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${statusTone(task.status, task.reviewStage)}`}
                >
                  {statusDisplay(task.status, task.reviewStage)}
                </span>
              </li>
            ))}
            {!assignments.length ? (
              <li className="rounded-2xl bg-slate-50 px-3 py-4 text-sm font-medium text-slate-500">
                No assignments yet.
              </li>
            ) : null}
          </ul>
        </article>

        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-black text-[#0F2744]">
              <Clock3 size={18} className="text-[#0D9488]" />
              Hours Progress
            </h2>
            <button
              type="button"
              onClick={onOpenHours}
              className={`inline-flex items-center gap-1 text-xs font-bold ${DESK_UI.link}`}
            >
              View details <ChevronRight size={12} />
            </button>
          </div>
          <div className="mt-4 flex flex-col items-center">
            <div
              className="relative flex h-36 w-36 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#0D9488 ${pct * 3.6}deg, #E0F2F1 0deg)`,
              }}
            >
              <div className="flex h-[6.5rem] w-[6.5rem] flex-col items-center justify-center rounded-full bg-white text-center">
                <p className="text-2xl font-black text-[#0F2744]">{pct}%</p>
                <p className="text-[11px] font-bold text-slate-500">
                  {formatHours(approved)} / {required ? formatHours(required) : "—"}
                </p>
              </div>
            </div>
            <div className="mt-4 grid w-full grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-[#EFF6FF] px-2 py-3">
                <p className="text-sm font-black text-[#1D4ED8]">
                  {formatHours(hourSummary.loggedThisWeek)}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  This week
                </p>
              </div>
              <div className="rounded-2xl bg-[#F0FDF4] px-2 py-3">
                <p className="text-sm font-black text-[#166534]">{hourSummary.paceLabel}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Pacing
                </p>
              </div>
              <div className="rounded-2xl bg-[#FFF7ED] px-2 py-3">
                <p className="text-sm font-black text-[#C2410C]">{formatHours(remaining)}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Remaining
                </p>
              </div>
            </div>
          </div>
        </article>

        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-black text-[#0F2744]">
              <CalendarDays size={18} className="text-[#16A34A]" />
              Weekly Check-In
            </h2>
            <button
              type="button"
              onClick={onOpenCheckIn}
              className={`inline-flex items-center gap-1 text-xs font-bold ${DESK_UI.link}`}
            >
              View all <ChevronRight size={12} />
            </button>
          </div>
          {weeklyDone ? (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#F0FDF4] p-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#22C55E] text-white">
                <CheckCircle2 size={24} />
              </span>
              <div>
                <p className="text-xl font-black text-[#166534]">Submitted!</p>
                <p className="mt-1 text-sm font-medium text-slate-600">
                  {thisWeekReview?.weekOf
                    ? `Week of ${thisWeekReview.weekOf.slice(0, 10)}`
                    : "This week’s check-in is on file."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-4 text-2xl font-black text-[#0F2744]">Ready when you are</p>
              <p className="mt-2 text-sm font-medium text-slate-600">
                Submit your weekly check-in so Ava can review your progress.
              </p>
            </>
          )}
          <button
            type="button"
            onClick={onOpenCheckIn}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#0D5C3A] px-4 text-sm font-bold !text-white"
          >
            {weeklyDone ? "View Check-In" : "Submit Check-In"}
          </button>
        </article>
      </section>

      <section className={`${DESK_UI.card} p-4 sm:p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-black text-[#0F2744]">Milestones / Final Project</h2>
          <button
            type="button"
            onClick={onOpenMilestones}
            className={`inline-flex items-center gap-1 text-xs font-bold ${DESK_UI.link}`}
          >
            View details <ChevronRight size={12} />
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[25, 50, 100, 150].map((mark) => {
            const done = required > 0 ? approved >= mark : false;
            const current = required > 0 && approved < mark && approved >= mark - 50;
            return (
              <div
                key={mark}
                className={`rounded-2xl border px-3 py-4 ${
                  done
                    ? "border-emerald-200 bg-[#F0FDF4]"
                    : current
                      ? "border-sky-200 bg-[#EFF6FF]"
                      : "border-slate-100 bg-[#F8FAFC]"
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  {mark} hours
                </p>
                <p className="mt-2 text-sm font-black text-[#0F2744]">
                  {done ? "Completed" : current ? "In Progress" : "Not started"}
                </p>
              </div>
            );
          })}
        </div>
        {milestones[0] ? (
          <p className="mt-4 rounded-2xl bg-[#EFF6FF] px-3 py-3 text-sm font-medium text-slate-700">
            Next up: <span className="font-bold text-[#0F2744]">{milestones[0].title}</span>
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]">
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="flex items-center gap-2 text-lg font-black text-[#0F2744]">
            <MessageCircle size={18} className="text-[#2563EB]" />
            Messages
          </h2>
          <ul className="mt-4 space-y-2">
            {comments.map((item) => (
              <li
                key={item.id}
                className="flex gap-3 rounded-2xl border border-slate-100 px-3 py-3"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] text-sm font-black text-[#1D4ED8]">
                  {deskInitials(
                    item.authorRole === "supervisor" ? "Ava Venezia" : firstName || "You",
                  )}
                </span>
                <span className="min-w-0">
                  <span className="font-bold text-[#0F2744]">
                    {item.authorRole === "supervisor" ? "Ava Venezia" : "You"}
                  </span>
                  <span className="mt-1 block line-clamp-2 text-xs font-medium text-slate-500">
                    {item.body}
                  </span>
                </span>
              </li>
            ))}
            {!comments.length ? (
              <li className="rounded-2xl bg-slate-50 px-3 py-4 text-sm font-medium text-slate-500">
                Feedback from Ava will show here.
              </li>
            ) : null}
          </ul>
          {!preview ? (
            <div className="mt-4">
              <AskAvaForm internId={data.intern.id} />
            </div>
          ) : null}
        </article>

        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Quick Actions</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onOpenHours}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0D5C3A] px-3 text-sm font-bold !text-white"
            >
              Log Hours
            </button>
            <button
              type="button"
              onClick={onOpenCheckIn}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#EFF6FF] px-3 text-sm font-bold text-[#1D4ED8]"
            >
              Submit Check-In
            </button>
            <button
              type="button"
              onClick={onOpenWork}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#F5F3FF] px-3 text-sm font-bold text-[#6D28D9]"
            >
              <ClipboardList size={16} className="mr-1.5" />
              View Assignments
            </button>
            <Link
              href={INTERNSHIP_HELP_PATH}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#FFF7ED] px-3 text-sm font-bold text-[#C2410C]"
            >
              Open Help
            </Link>
          </div>
          <div className="relative mt-4 overflow-hidden rounded-2xl bg-[#FFF7ED]">
            <div className="relative h-24">
              <Image
                src="/images/rogue-avatar.png"
                alt=""
                fill
                className="object-cover object-top"
                sizes="360px"
              />
            </div>
            <p className="px-3 py-2 text-xs font-bold text-[#0F2744]">
              {INTERN_PORTAL_BRAND.quickActionsLine}
            </p>
          </div>
        </article>

        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="flex items-center gap-2 text-lg font-black text-[#0F2744]">
            <Sparkles size={18} className="text-[#EA580C]" />
            Recent Activity
          </h2>
          <ul className="mt-4 space-y-2">
            {(data.weeklyReviews || []).slice(0, 2).map((row) => (
              <li
                key={row.id}
                className="rounded-2xl border border-slate-100 bg-[#F8FAFC] px-3 py-3 text-sm font-medium text-slate-700"
              >
                Weekly check-in · {row.weekOf?.slice(0, 10) || "this week"}
                <span className="mt-1 block text-xs text-slate-500">{row.status}</span>
              </li>
            ))}
            {assignments.slice(0, 2).map((task) => (
              <li
                key={`act-${task.id}`}
                className="rounded-2xl border border-slate-100 bg-[#F8FAFC] px-3 py-3 text-sm font-medium text-slate-700"
              >
                {task.title}
                <span className="mt-1 block text-xs text-slate-500">
                  {statusDisplay(task.status, task.reviewStage)}
                </span>
              </li>
            ))}
            {!assignments.length && !(data.weeklyReviews || []).length ? (
              <li className="rounded-2xl bg-slate-50 px-3 py-4 text-sm font-medium text-slate-500">
                Your recent internship activity will appear here.
              </li>
            ) : null}
          </ul>
          <Link
            href={INTERNSHIP_GROWTH_PATH}
            className={`mt-4 inline-flex min-h-11 items-center text-sm font-bold ${DESK_UI.link}`}
          >
            Open Growth Workplace →
          </Link>
        </article>
      </section>

      <InternWorkSystemsCard />
    </div>
  );
}
