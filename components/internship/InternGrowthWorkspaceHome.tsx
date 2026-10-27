import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  MessageCircle,
  Sparkles,
  Trophy,
} from "lucide-react";
import { DESK_STAT, DESK_UI } from "@/lib/portal/desk-ui";
import { INTERNSHIP_HELP_PATH } from "@/lib/internship/intern-growth";

export default function InternGrowthWorkspaceHome({
  firstName,
  hoursThisWeek,
  hoursPlanned,
  assignmentCount,
  assignmentsDueSoon,
  checkInsDue,
  nextCheckIn,
  milestoneCount,
  milestonesInProgress,
  assignments,
  progress,
  nextActions,
  messages,
  upcoming,
}: {
  firstName: string;
  hoursThisWeek: number;
  hoursPlanned: number;
  assignmentCount: number;
  assignmentsDueSoon: number;
  checkInsDue: number;
  nextCheckIn: string;
  milestoneCount: number;
  milestonesInProgress: number;
  assignments: Array<{
    id: string;
    title: string;
    status: string;
    due: string;
  }>;
  progress: Array<{ label: string; pct: number; tone: string }>;
  nextActions: Array<{ step: number; title: string; href: string; cta: string }>;
  messages: Array<{ author: string; preview: string }>;
  upcoming: Array<{ title: string; when: string; kind: string }>;
}) {
  const weekPct =
    hoursPlanned > 0
      ? Math.min(100, Math.round((hoursThisWeek / hoursPlanned) * 100))
      : 0;

  return (
    <div className="space-y-5 pb-28 xl:pb-6">
      <section className="rounded-2xl border border-sky-100/80 bg-gradient-to-r from-[#EFF6FF] via-white to-[#F0FDF4] p-4 shadow-sm sm:p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#0D5C3A]">
          Growth Workspace
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0F2744] sm:text-4xl">
          Welcome back, {firstName}!
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">
          Here&apos;s what you need to focus on today — assignments, hours,
          check-ins, and milestones.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className={`rounded-2xl border p-4 shadow-sm ${DESK_STAT.green.wrap}`}>
          <p className={`text-2xl font-black leading-none ${DESK_STAT.green.value}`}>
            {hoursThisWeek}
            <span className="text-sm font-bold text-slate-500">
              {" "}
              / {hoursPlanned || "—"}
            </span>
          </p>
          <p className="mt-1 text-xs font-bold text-[#0F2744]">Hours This Week</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/80">
              <div className="h-full rounded-full bg-[#22C55E]" style={{ width: `${weekPct}%` }} />
            </div>
            <span className="text-xs font-bold text-[#166534]">{weekPct}%</span>
          </div>
        </article>

        <article className={`rounded-2xl border p-4 shadow-sm ${DESK_STAT.violet.wrap}`}>
          <p className={`text-3xl font-black leading-none ${DESK_STAT.violet.value}`}>
            {assignmentCount}
          </p>
          <p className="mt-1 text-xs font-bold text-[#0F2744]">Assignments</p>
          <p className="mt-2 text-sm font-medium text-slate-600">
            {assignmentsDueSoon} due soon
          </p>
        </article>

        <article className={`rounded-2xl border p-4 shadow-sm ${DESK_STAT.sky.wrap}`}>
          <p className={`text-3xl font-black leading-none ${DESK_STAT.sky.value}`}>
            {checkInsDue}
          </p>
          <p className="mt-1 text-xs font-bold text-[#0F2744]">Check-ins Due</p>
          <p className="mt-2 text-sm font-medium text-slate-600">Next: {nextCheckIn}</p>
        </article>

        <article className={`rounded-2xl border p-4 shadow-sm ${DESK_STAT.peach.wrap}`}>
          <p className={`text-3xl font-black leading-none ${DESK_STAT.peach.value}`}>
            {milestoneCount}
          </p>
          <p className="mt-1 text-xs font-bold text-[#0F2744]">Milestones</p>
          <p className="mt-2 text-sm font-medium text-slate-600">
            {milestonesInProgress} in progress
          </p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-black text-[#0F2744]">
              <ClipboardList size={18} className="text-[#7C3AED]" />
              My Assignments
            </h2>
            <Link href="/intern?tab=work" className={`text-xs font-bold ${DESK_UI.link}`}>
              View all →
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {assignments.slice(0, 4).map((task) => (
              <li
                key={task.id}
                className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-[#F8FAFC] px-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-[#0F2744]">
                    {task.title}
                  </span>
                  <span className="text-xs font-medium text-slate-500">Due {task.due}</span>
                </span>
                <span className="shrink-0 rounded-full bg-[#DBEAFE] px-2.5 py-1 text-[10px] font-bold text-[#1D4ED8]">
                  {task.status}
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
          <h2 className="text-lg font-black text-[#0F2744]">My Progress</h2>
          <ul className="mt-4 space-y-3">
            {progress.map((item) => (
              <li key={item.label}>
                <div className="flex items-center justify-between text-sm font-bold text-[#0F2744]">
                  <span>{item.label}</span>
                  <span>{item.pct}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${item.tone}`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="flex items-center gap-2 text-lg font-black text-[#0F2744]">
            <Trophy size={18} className="text-[#0D5C3A]" />
            What should I do now?
          </h2>
          <ol className="mt-4 space-y-3">
            {nextActions.map((item) => (
              <li
                key={item.step}
                className="rounded-2xl border border-slate-100 bg-[#F8FAFC] px-3 py-3"
              >
                <p className="text-sm font-bold text-[#0F2744]">
                  {item.step}. {item.title}
                </p>
                <Link
                  href={item.href}
                  className={`mt-2 inline-flex items-center gap-1 text-sm font-bold ${DESK_UI.link}`}
                >
                  {item.cta} <ChevronRight size={14} />
                </Link>
              </li>
            ))}
          </ol>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="flex items-center gap-2 text-lg font-black text-[#0F2744]">
            <MessageCircle size={18} className="text-[#2563EB]" />
            Recent Messages
          </h2>
          <ul className="mt-4 space-y-2">
            {messages.slice(0, 3).map((item) => (
              <li
                key={item.author + item.preview}
                className="rounded-2xl border border-slate-100 px-3 py-3"
              >
                <p className="text-sm font-bold text-[#0F2744]">{item.author}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{item.preview}</p>
              </li>
            ))}
            {!messages.length ? (
              <li className="rounded-2xl bg-slate-50 px-3 py-4 text-sm font-medium text-slate-500">
                Messages from Ava will show here.
              </li>
            ) : null}
          </ul>
        </article>

        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="flex items-center gap-2 text-lg font-black text-[#0F2744]">
            <CalendarDays size={18} className="text-[#7C3AED]" />
            Upcoming Dates
          </h2>
          <ul className="mt-4 space-y-2">
            {upcoming.slice(0, 4).map((item) => (
              <li
                key={item.title + item.when}
                className="rounded-2xl border border-slate-100 bg-[#F8FAFC] px-3 py-3 text-sm font-medium text-slate-700"
              >
                <span className="font-bold text-[#0F2744]">{item.title}</span>
                <span className="mt-1 block text-xs text-slate-500">
                  {item.kind} · {item.when}
                </span>
              </li>
            ))}
            {!upcoming.length ? (
              <li className="rounded-2xl bg-slate-50 px-3 py-4 text-sm font-medium text-slate-500">
                No upcoming dates yet.
              </li>
            ) : null}
          </ul>
        </article>

        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Quick Actions</h2>
          <div className="mt-4 grid gap-2">
            <Link
              href="/intern/time"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-3 text-sm font-bold !text-white"
            >
              <Clock3 size={16} /> Log Hours
            </Link>
            <Link
              href="/intern?tab=work&focus=checkin"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#EFF6FF] px-3 text-sm font-bold text-[#1D4ED8]"
            >
              <CheckCircle2 size={16} /> Open Check-In
            </Link>
            <Link
              href="/intern?tab=work"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#F5F3FF] px-3 text-sm font-bold text-[#6D28D9]"
            >
              <ClipboardList size={16} /> View Assignments
            </Link>
            <Link
              href={INTERNSHIP_HELP_PATH}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#FFF7ED] px-3 text-sm font-bold text-[#C2410C]"
            >
              <Sparkles size={16} /> Open Help
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
