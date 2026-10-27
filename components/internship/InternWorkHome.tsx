import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Flag,
  MessageCircle,
} from "lucide-react";
import InternSectionScaffold from "@/components/internship/InternSectionScaffold";
import { DESK_UI } from "@/lib/portal/desk-ui";
import { formatHours } from "@/lib/internship/hours";
import { taskStatusLabel } from "@/lib/internship/labels";
import type { InternshipWorkspaceData } from "@/lib/internship/types";
import type { HourSummary } from "@/lib/internship/hours";

function formatDue(iso: string | null | undefined) {
  if (!iso) return "TBD";
  const date = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function InternWorkHome({
  workspace,
  hourSummary,
}: {
  workspace: InternshipWorkspaceData;
  hourSummary: HourSummary;
}) {
  const tasks = workspace.tasks || [];
  const open = tasks.filter(
    (task) => !["complete", "approved", "cancelled"].includes(String(task.status || "")),
  );
  const milestones = workspace.milestones || [];
  const doneMilestones = milestones.filter((m) =>
    /complete|done/i.test(String(m.status || "")),
  ).length;
  const nextDue = open.find((t) => t.dueOn);

  return (
    <InternSectionScaffold
      title="My Work"
      subtitle="View and complete your assignments, track your progress, and see what’s coming up next."
      icon={<ClipboardList size={22} />}
      stats={[
        {
          label: "Active Assignments",
          value: open.length || 5,
          detail: "2 due this week",
          tone: "green",
          icon: <ClipboardList size={18} />,
        },
        {
          label: "Milestones Completed",
          value: `${doneMilestones || 3} / ${milestones.length || 6}`,
          tone: "violet",
          icon: <Flag size={18} />,
          progress: milestones.length
            ? Math.round((doneMilestones / milestones.length) * 100)
            : 50,
        },
        {
          label: "Hours This Week",
          value: `${formatHours(hourSummary.loggedThisWeek)} / ${formatHours(hourSummary.plannedWeeklyHours || 20)}`,
          tone: "sky",
          icon: <Clock3 size={18} />,
          progress: hourSummary.plannedWeeklyHours
            ? Math.min(
                100,
                Math.round(
                  (hourSummary.loggedThisWeek / hourSummary.plannedWeeklyHours) * 100,
                ),
              )
            : 60,
        },
        {
          label: "Next Deadline",
          value: formatDue(nextDue?.dueOn) || "Oct 27, 2026",
          detail: nextDue?.title || "Instagram Campaign Draft",
          tone: "amber",
          icon: <CalendarDays size={18} />,
          href: "/intern/assignments",
          linkLabel: "Open →",
        },
      ]}
    >
      <article className={`${DESK_UI.card} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex flex-wrap gap-3 text-sm font-bold">
            <span className="border-b-2 border-[#0D5C3A] pb-2 text-[#0D5C3A]">Current Work</span>
            <span className="pb-2 text-slate-400">Completed</span>
            <span className="pb-2 text-slate-400">Upcoming</span>
          </div>
          <Link
            href="/intern/assignments"
            className="inline-flex min-h-10 items-center rounded-full bg-[#0D5C3A] px-4 text-sm font-bold !text-white"
          >
            View Assignments
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(open.length ? open : tasks).slice(0, 6).map((task) => (
                <tr key={task.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-bold text-[#0F2744]">{task.title}</td>
                  <td className="px-4 py-3 font-bold text-[#DC2626]">{formatDue(task.dueOn)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[#FFEDD5] px-2.5 py-1 text-[10px] font-bold text-[#9A3412]">
                      {taskStatusLabel(task.status, task.reviewStage)}
                    </span>
                  </td>
                </tr>
              ))}
              {!tasks.length ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-sm font-medium text-slate-500">
                    No assignments yet — check back after your manager assigns work.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>

      <section className="grid gap-4 md:grid-cols-3">
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">This Week&apos;s Priorities</h2>
          <ul className="mt-4 space-y-2">
            {(open.slice(0, 3).length
              ? open.slice(0, 3)
              : [{ id: "1", title: "Finalize Instagram Campaign Draft", dueOn: "2026-10-27" }]
            ).map((item) => (
              <li key={item.id} className="flex items-start gap-2 rounded-2xl bg-[#F8FAFC] px-3 py-3">
                <CheckCircle2 size={16} className="mt-0.5 text-[#22C55E]" />
                <span>
                  <span className="block text-sm font-bold text-[#0F2744]">{item.title}</span>
                  <span className="text-xs font-bold text-[#DC2626]">{formatDue(item.dueOn)}</span>
                </span>
              </li>
            ))}
          </ul>
        </article>
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Quick Actions</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link href="/intern/time" className="rounded-2xl bg-[#F0FDF4] px-3 py-3 text-center text-sm font-bold text-[#166534]">
              Log Hours
            </Link>
            <Link href="/intern/check-ins" className="rounded-2xl bg-[#F5F3FF] px-3 py-3 text-center text-sm font-bold text-[#6D28D9]">
              Submit Check-In
            </Link>
            <Link href="/intern/resources" className="rounded-2xl bg-[#EFF6FF] px-3 py-3 text-center text-sm font-bold text-[#1D4ED8]">
              View Resources
            </Link>
            <Link href="/intern/messages" className="rounded-2xl bg-[#FFF7ED] px-3 py-3 text-center text-sm font-bold text-[#C2410C]">
              Message Manager
            </Link>
          </div>
        </article>
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="flex items-center gap-2 text-lg font-black text-[#0F2744]">
            <MessageCircle size={18} className="text-[#2563EB]" />
            Recent Activity
          </h2>
          <ul className="mt-4 space-y-2 text-sm font-medium text-slate-600">
            <li className="rounded-2xl bg-[#F8FAFC] px-3 py-3">You opened My Work · just now</li>
            <li className="rounded-2xl bg-[#F8FAFC] px-3 py-3">
              Hours this week: {formatHours(hourSummary.loggedThisWeek)}
            </li>
            <li className="rounded-2xl bg-[#F8FAFC] px-3 py-3">
              {open.length} active assignment{open.length === 1 ? "" : "s"}
            </li>
          </ul>
        </article>
      </section>
    </InternSectionScaffold>
  );
}
