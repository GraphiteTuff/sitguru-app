import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  MessageCircle,
  Sparkles,
  Users,
} from "lucide-react";
import type { GrowthTeamMember } from "@/lib/admin/growth/team-summary";
import type { GrowthInitiative } from "@/lib/admin/growth/outcomes";
import { DESK_STAT, DESK_UI, deskInitials } from "@/lib/portal/desk-ui";

function initiativePill(status: string) {
  const value = status.toLowerCase();
  if (value.includes("review")) return "bg-[#FFEDD5] text-[#9A3412]";
  if (value.includes("plan") || value.includes("draft")) return "bg-[#DBEAFE] text-[#1D4ED8]";
  return "bg-[#DCFCE7] text-[#166534]";
}

function initiativeLabel(status: string) {
  const value = status.toLowerCase();
  if (value.includes("review")) return "Needs Review";
  if (value.includes("plan") || value.includes("draft")) return "Planned";
  return "Active";
}

export default function ManagerGrowthWorkspaceHome({
  firstName,
  team,
  initiatives,
  reviewCount,
  checkInCount,
  assignmentCount,
  hoursSubmissionCount,
  teamHoursThisWeek,
  teamHoursPlanned,
  deadlines,
  activity,
}: {
  firstName: string;
  team: GrowthTeamMember[];
  initiatives: GrowthInitiative[];
  reviewCount: number;
  checkInCount: number;
  assignmentCount: number;
  hoursSubmissionCount: number;
  teamHoursThisWeek: number;
  teamHoursPlanned: number;
  deadlines: Array<{ title: string; when: string; kind: string }>;
  activity: Array<{ title: string; detail: string }>;
}) {
  const activeInterns = team.length;
  const weekPct =
    teamHoursPlanned > 0
      ? Math.min(100, Math.round((teamHoursThisWeek / teamHoursPlanned) * 100))
      : 0;
  const itemsToReview = reviewCount || checkInCount + assignmentCount + hoursSubmissionCount;

  return (
    <div className="space-y-5 pb-28 lg:pb-8">
      <section className="rounded-2xl border border-sky-100/80 bg-gradient-to-r from-[#EFF6FF] via-white to-[#F0FDFA] p-4 shadow-sm sm:p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#0D5C3A]">
          Growth Workspace
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0F2744] sm:text-4xl">
          Lead, support, and grow your interns.
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">
          Welcome back, {firstName}. Track team hours, reviews, initiatives, and
          what needs attention next.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className={`rounded-2xl border p-4 shadow-sm ${DESK_STAT.sky.wrap}`}>
          <div className="flex items-center gap-3">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${DESK_STAT.sky.iconWrap}`}>
              <Users size={18} />
            </span>
            <div>
              <p className={`text-3xl font-black leading-none ${DESK_STAT.sky.value}`}>
                {activeInterns}
              </p>
              <p className="mt-1 text-xs font-bold text-[#0F2744]">Active Interns</p>
            </div>
          </div>
          <Link href="/intern/manage" className={`mt-3 inline-flex items-center gap-1 text-sm font-bold ${DESK_UI.link}`}>
            View team <ChevronRight size={14} />
          </Link>
        </article>

        <article className={`rounded-2xl border p-4 shadow-sm ${DESK_STAT.green.wrap}`}>
          <div className="flex items-center gap-3">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${DESK_STAT.green.iconWrap}`}>
              <Clock3 size={18} />
            </span>
            <div>
              <p className={`text-2xl font-black leading-none ${DESK_STAT.green.value}`}>
                {teamHoursThisWeek}
                <span className="text-sm font-bold text-slate-500">
                  {" "}
                  / {teamHoursPlanned || "—"}
                </span>
              </p>
              <p className="mt-1 text-xs font-bold text-[#0F2744]">Team Hours This Week</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/80">
              <div className="h-full rounded-full bg-[#22C55E]" style={{ width: `${weekPct}%` }} />
            </div>
            <span className="text-xs font-bold text-[#166534]">{weekPct}%</span>
          </div>
        </article>

        <article className={`rounded-2xl border p-4 shadow-sm ${DESK_STAT.amber.wrap}`}>
          <div className="flex items-center gap-3">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${DESK_STAT.amber.iconWrap}`}>
              <AlertTriangle size={18} />
            </span>
            <div>
              <p className={`text-3xl font-black leading-none ${DESK_STAT.amber.value}`}>
                {itemsToReview}
              </p>
              <p className="mt-1 text-xs font-bold text-[#0F2744]">Items to Review</p>
            </div>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-600">
            {checkInCount} check-ins · {assignmentCount} assignments · {hoursSubmissionCount} hours
          </p>
        </article>

        <article className={`rounded-2xl border p-4 shadow-sm ${DESK_STAT.violet.wrap}`}>
          <div className="flex items-center gap-3">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${DESK_STAT.violet.iconWrap}`}>
              <CalendarDays size={18} />
            </span>
            <div>
              <p className={`text-3xl font-black leading-none ${DESK_STAT.violet.value}`}>
                {deadlines.length}
              </p>
              <p className="mt-1 text-xs font-bold text-[#0F2744]">Upcoming Deadlines</p>
            </div>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-600">
            {deadlines[0]?.title || "Nothing due yet"}
          </p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className={`${DESK_UI.card} p-4 sm:p-5 xl:col-span-1`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-black text-[#0F2744]">My Interns</h2>
            <Link href="/intern/manage" className={`text-xs font-bold ${DESK_UI.link}`}>
              Open desk →
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {team.slice(0, 5).map((member) => {
              const required = 150;
              const approved = member.hoursApproved || 0;
              const pct = Math.min(100, Math.round((approved / required) * 100));
              const attention = member.statusLabel.toLowerCase().includes("attention")
                || member.status === "at_risk";
              return (
                <li key={member.id} className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-3">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] text-sm font-black text-[#1D4ED8]">
                      {deskInitials(member.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-[#0F2744]">{member.name}</p>
                          <p className="text-xs font-medium text-slate-500">
                            {member.program || member.school || "Intern"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            attention
                              ? "bg-[#FFEDD5] text-[#9A3412]"
                              : "bg-[#DCFCE7] text-[#166534]"
                          }`}
                        >
                          {attention ? "Needs Attention" : member.statusLabel || "On Track"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        {approved} / {required} hours · {pct}%
                      </p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                        <div
                          className="h-full rounded-full bg-[#3B82F6]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
            {!team.length ? (
              <li className="rounded-2xl bg-slate-50 px-3 py-4 text-sm font-medium text-slate-500">
                No assigned interns yet.
              </li>
            ) : null}
          </ul>
        </article>

        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Team Progress</h2>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Approved vs pending review this month
          </p>
          <div className="mt-4 grid grid-cols-4 items-end gap-2">
            {[
              { label: "W1", approved: 62, pending: 18 },
              { label: "W2", approved: 70, pending: 22 },
              { label: "W3", approved: 78, pending: 16 },
              {
                label: "W4",
                approved: Math.max(40, Math.round(teamHoursThisWeek * 3)),
                pending: Math.max(8, hoursSubmissionCount * 6),
              },
            ].map((week) => (
              <div key={week.label} className="flex flex-col items-center gap-2">
                <div className="flex h-28 w-full items-end justify-center gap-1">
                  <div
                    className="w-3 rounded-t bg-[#22C55E]"
                    style={{ height: `${Math.min(100, week.approved)}%` }}
                    title="Approved"
                  />
                  <div
                    className="w-3 rounded-t bg-[#FDBA74]"
                    style={{ height: `${Math.min(100, week.pending)}%` }}
                    title="Pending"
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-500">{week.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-xs font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#22C55E]" /> Approved
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#FDBA74]" /> Pending review
            </span>
          </div>
        </article>

        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-black text-[#0F2744]">Growth Initiatives</h2>
            <Link href="/manager/campaigns" className={`text-xs font-bold ${DESK_UI.link}`}>
              View all →
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {initiatives.slice(0, 5).map((item) => (
              <li
                key={item.id}
                className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-slate-100 px-3"
              >
                <span className="truncate text-sm font-bold text-[#0F2744]">{item.name}</span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${initiativePill(item.status)}`}
                >
                  {initiativeLabel(item.status)}
                </span>
              </li>
            ))}
            {!initiatives.length ? (
              <li className="rounded-2xl bg-slate-50 px-3 py-4 text-sm font-medium text-slate-500">
                No growth initiatives yet.
              </li>
            ) : null}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="flex items-center gap-2 text-lg font-black text-[#0F2744]">
            <CalendarDays size={18} className="text-[#7C3AED]" />
            Upcoming Deadlines
          </h2>
          <ul className="mt-4 space-y-2">
            {deadlines.slice(0, 5).map((item) => (
              <li
                key={`${item.title}-${item.when}`}
                className="rounded-2xl border border-slate-100 bg-[#F8FAFC] px-3 py-3 text-sm font-medium text-slate-700"
              >
                <span className="font-bold text-[#0F2744]">{item.title}</span>
                <span className="mt-1 block text-xs text-slate-500">
                  {item.kind} · {item.when}
                </span>
              </li>
            ))}
            {!deadlines.length ? (
              <li className="rounded-2xl bg-slate-50 px-3 py-4 text-sm font-medium text-slate-500">
                No upcoming deadlines.
              </li>
            ) : null}
          </ul>
        </article>

        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="flex items-center gap-2 text-lg font-black text-[#0F2744]">
            <Sparkles size={18} className="text-[#EA580C]" />
            Recent Activity
          </h2>
          <ul className="mt-4 space-y-2">
            {activity.slice(0, 5).map((item) => (
              <li
                key={item.title + item.detail}
                className="rounded-2xl border border-slate-100 bg-[#F8FAFC] px-3 py-3 text-sm font-medium text-slate-700"
              >
                <span className="font-bold text-[#0F2744]">{item.title}</span>
                <span className="mt-1 block text-xs text-slate-500">{item.detail}</span>
              </li>
            ))}
            {!activity.length ? (
              <li className="rounded-2xl bg-slate-50 px-3 py-4 text-sm font-medium text-slate-500">
                <span className="inline-flex items-center gap-2 font-bold text-[#166534]">
                  <CheckCircle2 size={16} /> All quiet
                </span>
              </li>
            ) : null}
          </ul>
        </article>

        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Quick Actions</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              ["/intern/manage?tab=reviews", "Review Check-ins", "bg-[#EFF6FF] text-[#1D4ED8]", ClipboardCheck],
              ["/intern/manage?tab=reviews", "Approve Hours", "bg-[#F0FDF4] text-[#166534]", Clock3],
              ["/intern/manage", "Create Assignment", "bg-[#F5F3FF] text-[#6D28D9]", ClipboardCheck],
              ["/manager/messages", "Message Team", "bg-[#FFF7ED] text-[#C2410C]", MessageCircle],
            ].map(([href, label, tone, Icon]) => {
              const IconCmp = Icon as typeof ClipboardCheck;
              return (
                <Link
                  key={`${href}-${label}`}
                  href={String(href)}
                  className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-bold ${tone}`}
                >
                  <IconCmp size={16} />
                  {String(label)}
                </Link>
              );
            })}
          </div>
          <Link
            href="/manager/analytics"
            className={`mt-4 inline-flex min-h-11 items-center text-sm font-bold ${DESK_UI.link}`}
          >
            Open Reports →
          </Link>
        </article>
      </section>
    </div>
  );
}
