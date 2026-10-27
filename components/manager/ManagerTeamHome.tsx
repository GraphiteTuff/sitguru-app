import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MessageCircle,
  Trophy,
  Users,
} from "lucide-react";
import type { GrowthTeamMember } from "@/lib/admin/growth/team-summary";
import ManagerSectionScaffold from "@/components/manager/ManagerSectionScaffold";
import { DESK_UI, deskInitials } from "@/lib/portal/desk-ui";

export default function ManagerTeamHome({
  team,
  reviewCount,
  checkInCount,
  assignmentCount,
  hoursSubmissionCount,
  teamHoursThisWeek,
  teamHoursPlanned,
  milestones,
  checkIns,
  assignments,
  messages,
}: {
  team: GrowthTeamMember[];
  reviewCount: number;
  checkInCount: number;
  assignmentCount: number;
  hoursSubmissionCount: number;
  teamHoursThisWeek: number;
  teamHoursPlanned: number;
  milestones: Array<{ title: string; owner: string; when: string }>;
  checkIns: Array<{ name: string; detail: string }>;
  assignments: Array<{ title: string; owner: string; status: string }>;
  messages: Array<{ author: string; preview: string; when: string }>;
}) {
  const weekPct =
    teamHoursPlanned > 0
      ? Math.min(100, Math.round((teamHoursThisWeek / teamHoursPlanned) * 100))
      : 0;

  return (
    <ManagerSectionScaffold
      title="My Team"
      subtitle="Guide, support, and grow your interns."
      overlay="Great people. Great ideas. A stronger pet community."
      icon={<Users size={22} />}
      stats={[
        {
          label: "Active Interns",
          value: team.length,
          tone: "sky",
          icon: <Users size={18} />,
          href: "/manager/team",
          linkLabel: "View all interns →",
        },
        {
          label: "Team Hours This Week",
          value: `${teamHoursThisWeek} / ${teamHoursPlanned || "—"}`,
          tone: "green",
          icon: <Clock3 size={18} />,
          progress: weekPct,
        },
        {
          label: "Items to Review",
          value: reviewCount,
          detail: `${checkInCount} Check-ins · ${assignmentCount} Assignments · ${hoursSubmissionCount} Hours`,
          tone: "violet",
          icon: <AlertTriangle size={18} />,
          href: "/manager/check-ins",
          linkLabel: "View review queue →",
        },
        {
          label: "Upcoming Milestones",
          value: milestones.length,
          tone: "amber",
          icon: <Trophy size={18} />,
          href: "/manager/milestones",
          linkLabel: "View milestones →",
        },
      ]}
    >
      <section className="grid gap-4 xl:grid-cols-3">
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Team Overview</h2>
          <ul className="mt-4 space-y-3">
            {team.map((member) => {
              const required = 150;
              const approved = member.hoursApproved || 0;
              const pct = Math.min(100, Math.round((approved / required) * 100));
              const attention =
                member.statusLabel.toLowerCase().includes("attention") ||
                member.status === "at_risk";
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
                        {approved} / {required} hours
                      </p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full rounded-full bg-[#3B82F6]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </article>

        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-black text-[#0F2744]">Team Hours</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
              This Week
            </span>
          </div>
          <div className="mt-4 grid grid-cols-5 items-end gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, index) => {
              const heights = [70, 55, 85, 60, 75];
              return (
                <div key={day} className="flex flex-col items-center gap-2">
                  <div className="flex h-28 w-full flex-col justify-end gap-0.5">
                    <div className="w-full rounded-t bg-[#60A5FA]" style={{ height: `${heights[index]}%` }} />
                    <div className="w-full bg-[#A78BFA]" style={{ height: `${heights[index] * 0.45}%` }} />
                    <div className="w-full rounded-b bg-[#93C5FD]" style={{ height: `${heights[index] * 0.3}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">{day}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#60A5FA]" /> Ryan
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#A78BFA]" /> Lola
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#93C5FD]" /> Jordan
            </span>
          </div>
        </article>

        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-black text-[#0F2744]">
              <CalendarDays size={18} className="text-[#EA580C]" />
              Upcoming Milestones
            </h2>
            <Link href="/manager/milestones" className={`text-xs font-bold ${DESK_UI.link}`}>
              View all →
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {milestones.map((item) => (
              <li
                key={item.title + item.when}
                className="rounded-2xl border border-slate-100 bg-[#F8FAFC] px-3 py-3"
              >
                <p className="text-sm font-bold text-[#0F2744]">{item.title}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{item.owner}</p>
                <p className="mt-1 text-xs font-bold text-[#DC2626]">{item.when}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Check-Ins Needing Review</h2>
          <ul className="mt-4 space-y-2">
            {checkIns.map((item) => (
              <li
                key={item.name + item.detail}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 px-3 py-3"
              >
                <span>
                  <span className="block text-sm font-bold text-[#0F2744]">{item.name}</span>
                  <span className="text-xs font-medium text-slate-500">{item.detail}</span>
                </span>
                <Link
                  href="/manager/check-ins"
                  className="inline-flex min-h-9 items-center rounded-full bg-[#2563EB] px-3 text-xs font-bold !text-white"
                >
                  Review
                </Link>
              </li>
            ))}
            {!checkIns.length ? (
              <li className="rounded-2xl bg-slate-50 px-3 py-4 text-sm font-medium text-slate-500">
                <span className="inline-flex items-center gap-2 font-bold text-[#166534]">
                  <CheckCircle2 size={16} /> Queue clear
                </span>
              </li>
            ) : null}
          </ul>
        </article>

        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Team Assignments</h2>
          <ul className="mt-4 space-y-2">
            {assignments.map((item) => (
              <li
                key={item.title + item.owner}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 px-3 py-3"
              >
                <span>
                  <span className="block text-sm font-bold text-[#0F2744]">{item.title}</span>
                  <span className="text-xs font-medium text-slate-500">{item.owner}</span>
                </span>
                <span className="rounded-full bg-[#DBEAFE] px-2.5 py-1 text-[10px] font-bold text-[#1D4ED8]">
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        </article>

        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-black text-[#0F2744]">
              <MessageCircle size={18} className="text-[#2563EB]" />
              Team Messages
            </h2>
            <Link href="/manager/messages" className={`text-xs font-bold ${DESK_UI.link}`}>
              Open →
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {messages.map((item) => (
              <li
                key={item.author + item.preview}
                className="rounded-2xl border border-slate-100 px-3 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-[#0F2744]">{item.author}</p>
                  <span className="text-[10px] font-bold text-slate-400">{item.when}</span>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-500">{item.preview}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <article className={`${DESK_UI.card} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div className="flex gap-4 text-sm font-bold">
            <span className="border-b-2 border-[#2563EB] pb-2 text-[#2563EB]">
              Active ({team.length})
            </span>
            <span className="pb-2 text-slate-400">Completed (0)</span>
            <span className="pb-2 text-slate-400">Archived (0)</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {team.map((member) => {
                const required = 150;
                const approved = member.hoursApproved || 0;
                const pct = Math.min(100, Math.round((approved / required) * 100));
                return (
                  <tr key={member.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-bold text-[#0F2744]">{member.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {member.program || member.school || "Intern"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {approved} / {required}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-[#22C55E]" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-500">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[10px] font-bold text-[#166534]">
                        {member.statusLabel || "On Track"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>
    </ManagerSectionScaffold>
  );
}
