"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  MessageCircle,
  Sparkles,
  Trophy,
} from "lucide-react";
import AskAvaForm from "@/components/internship/AskAvaForm";
import { INTERN_PORTAL_BRAND } from "@/lib/internship/intern-portal-nav";
import { INTERNSHIP_HELP_PATH, INTERNSHIP_GROWTH_PATH } from "@/lib/internship/intern-growth";
import { taskStatusLabel } from "@/lib/internship/labels";
import { formatHours, type HourSummary } from "@/lib/internship/hours";
import { internPressClass, internPrimaryBtnClass } from "@/lib/internship/intern-ui";
import type { InternshipWorkspaceData } from "@/lib/internship/types";

function statusTone(status: string, reviewStage?: string | null) {
  const label = taskStatusLabel(status, reviewStage).toLowerCase();
  if (label.includes("complete") || label.includes("approved")) {
    return "bg-emerald-50 text-emerald-900";
  }
  if (label.includes("change") || label.includes("revision")) {
    return "bg-amber-50 text-amber-950";
  }
  if (label.includes("progress") || label.includes("submitted")) {
    return "bg-emerald-50 text-emerald-900";
  }
  return "bg-sky-50 text-sky-900";
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
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800">
            {INTERN_PORTAL_BRAND.title}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
            Manage your assignments, hours, milestones, and growth work — all in one place.
          </p>
        </div>
        <div className="public-dark-section relative min-h-[150px] overflow-hidden rounded-[1.75rem] bg-[#0D5C3A] shadow-[0_18px_50px_rgba(13,92,58,0.16)] sm:min-h-[180px]">
          <Image
            src="/images/homepage/sitguru-dog-walking-hero.jpg"
            alt=""
            fill
            className="object-cover opacity-90"
            sizes="(max-width: 1280px) 100vw, 45vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D5C3A]/90 via-[#0D5C3A]/40 to-transparent" />
          <div className="relative flex h-full min-h-[150px] flex-col justify-end p-5 sm:min-h-[180px]">
            <p className="max-w-sm text-lg font-black leading-snug !text-white sm:text-xl">
              {INTERN_PORTAL_BRAND.heroLine}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-800">
            <Clock3 size={16} />
            <p className="text-[10px] font-black uppercase tracking-[0.14em]">Hours Approved</p>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-950">
            {formatHours(approved)}
            {required ? (
              <span className="text-base font-bold text-slate-500">
                {" "}
                of {formatHours(required)}
              </span>
            ) : null}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-50">
            <div className="h-full rounded-full bg-[#0D5C3A]" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">{pct}% complete</p>
        </article>

        <button
          type="button"
          onClick={onOpenHours}
          className={`rounded-[1.5rem] border border-sky-100 bg-white p-4 text-left shadow-sm ${internPressClass}`}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-sky-800">
            This Week&apos;s Hours
          </p>
          <p className="mt-3 text-2xl font-black text-slate-950">
            {formatHours(hourSummary.loggedThisWeek)}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {planned
              ? `on track for ${formatHours(planned)} hours`
              : hourSummary.paceLabel}
          </p>
        </button>

        <button
          type="button"
          onClick={onOpenWork}
          className={`rounded-[1.5rem] border border-violet-100 bg-white p-4 text-left shadow-sm ${internPressClass}`}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-800">
            Current Assignment
          </p>
          <p className="mt-3 line-clamp-2 text-lg font-black text-slate-950">
            {currentAssignmentTitle || "No active assignment"}
          </p>
          <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-900">
            In Progress
          </p>
        </button>

        <button
          type="button"
          onClick={onOpenMilestones}
          className={`rounded-[1.5rem] border border-amber-100 bg-white p-4 text-left shadow-sm ${internPressClass}`}
        >
          <div className="flex items-center gap-2 text-amber-800">
            <Trophy size={16} />
            <p className="text-[10px] font-black uppercase tracking-[0.14em]">Next Milestone</p>
          </div>
          <p className="mt-3 text-lg font-black text-slate-950">
            {required ? `${formatHours(required)} hours` : hourSummary.weekLabel}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-600">Final project progress</p>
        </button>

        <button
          type="button"
          onClick={onOpenCheckIn}
          className={`rounded-[1.5rem] border border-emerald-100 bg-white p-4 text-left shadow-sm sm:col-span-2 xl:col-span-1 ${internPressClass}`}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
            Check-In Status
          </p>
          <p className="mt-3 flex items-center gap-2 text-xl font-black text-slate-950">
            {weeklyDone ? <CheckCircle2 className="text-emerald-700" size={22} /> : null}
            {weeklyDone ? "Submitted" : "Due this week"}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-600">This week&apos;s check-in</p>
        </button>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-[1.75rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-black text-slate-950">My Assignments</h2>
            <button type="button" onClick={onOpenWork} className="text-xs font-black text-emerald-800">
              View all
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {assignments.map((task) => (
              <li
                key={task.id}
                className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-slate-100 px-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-slate-950">
                    {task.title}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Week {task.weekNumber || "—"}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${statusTone(task.status, task.reviewStage)}`}
                >
                  {statusDisplay(task.status, task.reviewStage)}
                </span>
              </li>
            ))}
            {!assignments.length ? (
              <li className="rounded-2xl bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-500">
                No assignments yet.
              </li>
            ) : null}
          </ul>
        </article>

        <article className="rounded-[1.75rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-black text-slate-950">Hours Progress</h2>
          <div className="mt-4 flex flex-col items-center">
            <div
              className="relative flex h-36 w-36 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#0D5C3A ${pct * 3.6}deg, #E7F2EC 0deg)`,
              }}
            >
              <div className="flex h-[6.5rem] w-[6.5rem] flex-col items-center justify-center rounded-full bg-white text-center">
                <p className="text-2xl font-black text-slate-950">{pct}%</p>
                <p className="text-[11px] font-bold text-slate-500">
                  {formatHours(approved)} / {required ? formatHours(required) : "—"}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm font-black text-emerald-900">
              Great progress, {firstName}!
            </p>
            <div className="mt-4 grid w-full grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-slate-50 px-2 py-3">
                <p className="text-sm font-black text-slate-950">
                  {formatHours(hourSummary.loggedThisWeek)}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  This week
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-2 py-3">
                <p className="text-sm font-black text-slate-950">{hourSummary.paceLabel}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Pacing
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-2 py-3">
                <p className="text-sm font-black text-slate-950">{formatHours(remaining)}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Remaining
                </p>
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-black text-slate-950">Weekly Check-In</h2>
          {weeklyDone ? (
            <>
              <p className="mt-4 flex items-center gap-2 text-2xl font-black text-emerald-900">
                <CheckCircle2 size={28} /> Submitted!
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                {thisWeekReview?.weekOf
                  ? `Week of ${thisWeekReview.weekOf.slice(0, 10)}`
                  : "This week’s check-in is on file."}
              </p>
            </>
          ) : (
            <>
              <p className="mt-4 text-2xl font-black text-slate-950">Ready when you are</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                Submit your weekly check-in so Ava can review your progress.
              </p>
            </>
          )}
          <button
            type="button"
            onClick={onOpenCheckIn}
            className={`${internPrimaryBtnClass} mt-5 w-full`}
          >
            {weeklyDone ? "View Check-In" : "Submit Check-In"}
          </button>
        </article>
      </section>

      <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-black text-slate-950">Milestones / Final Project</h2>
          <button type="button" onClick={onOpenMilestones} className="text-xs font-black text-emerald-800">
            View details
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
                    ? "border-emerald-200 bg-emerald-50"
                    : current
                      ? "border-sky-200 bg-sky-50"
                      : "border-slate-100 bg-slate-50"
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  {mark} hours
                </p>
                <p className="mt-2 text-sm font-black text-slate-950">
                  {done ? "Completed" : current ? "In Progress" : "Not started"}
                </p>
              </div>
            );
          })}
        </div>
        {milestones[0] ? (
          <p className="mt-4 rounded-2xl bg-[#F7FAF8] px-3 py-3 text-sm font-semibold text-slate-700">
            Next up: <span className="font-black text-slate-950">{milestones[0].title}</span>
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]">
        <article className="rounded-[1.75rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
            <MessageCircle size={18} className="text-emerald-800" />
            Messages
          </h2>
          <ul className="mt-4 space-y-2">
            {comments.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700"
              >
                <span className="font-black text-slate-950">
                  {item.authorRole === "supervisor" ? "Manager feedback" : "You"}
                </span>
                <span className="mt-1 block line-clamp-2 text-xs text-slate-500">
                  {item.body}
                </span>
              </li>
            ))}
            {!comments.length ? (
              <li className="rounded-2xl bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-500">
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

        <article className="rounded-[1.75rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-black text-slate-950">Quick Actions</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={onOpenHours} className={`${internPrimaryBtnClass} w-full`}>
              Log Hours
            </button>
            <button
              type="button"
              onClick={onOpenCheckIn}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 px-3 text-sm font-black text-emerald-950"
            >
              Submit Check-In
            </button>
            <button
              type="button"
              onClick={onOpenWork}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-100 bg-white px-3 text-sm font-black text-emerald-950"
            >
              <ClipboardList size={16} className="mr-1.5" />
              View Assignments
            </button>
            <Link
              href={INTERNSHIP_HELP_PATH}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-100 bg-white px-3 text-sm font-black text-emerald-950"
            >
              Open Help
            </Link>
          </div>
          <div className="relative mt-4 overflow-hidden rounded-[1.25rem] bg-[#FAF6EE]">
            <div className="relative h-24">
              <Image
                src="/images/rogue-avatar.png"
                alt=""
                fill
                className="object-cover object-top"
                sizes="360px"
              />
            </div>
            <p className="px-3 py-2 text-xs font-black text-emerald-900">
              {INTERN_PORTAL_BRAND.quickActionsLine}
            </p>
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
            <Sparkles size={18} className="text-emerald-800" />
            Recent Activity
          </h2>
          <ul className="mt-4 space-y-2">
            {(data.weeklyReviews || []).slice(0, 2).map((row) => (
              <li
                key={row.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700"
              >
                Weekly check-in · {row.weekOf?.slice(0, 10) || "this week"}
                <span className="mt-1 block text-xs text-slate-500">{row.reviewStatus}</span>
              </li>
            ))}
            {assignments.slice(0, 2).map((task) => (
              <li
                key={`act-${task.id}`}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700"
              >
                {task.title}
                <span className="mt-1 block text-xs text-slate-500">
                  {statusDisplay(task.status, task.reviewStage)}
                </span>
              </li>
            ))}
            {!assignments.length && !(data.weeklyReviews || []).length ? (
              <li className="rounded-2xl bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-500">
                Your recent internship activity will appear here.
              </li>
            ) : null}
          </ul>
          <Link
            href={INTERNSHIP_GROWTH_PATH}
            className="mt-4 inline-flex min-h-11 items-center text-sm font-black text-emerald-800"
          >
            Open Growth Workplace →
          </Link>
        </article>
      </section>
    </div>
  );
}
