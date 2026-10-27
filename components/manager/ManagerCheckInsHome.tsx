import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  MessageCircle,
  Users,
} from "lucide-react";
import ManagerSectionScaffold from "@/components/manager/ManagerSectionScaffold";
import { DESK_UI, deskInitials } from "@/lib/portal/desk-ui";

export default function ManagerCheckInsHome({
  rows,
}: {
  rows: Array<{
    id: string;
    week: string;
    intern: string;
    focus: string;
    submitted: string;
    status: string;
    feedback: string;
  }>;
}) {
  const needsReview = rows.filter((row) => /review|need/i.test(row.status)).length;
  const approved = rows.filter((row) => /approv/i.test(row.status)).length;

  return (
    <ManagerSectionScaffold
      title="Check-Ins"
      subtitle="Review weekly progress and keep coaching conversations moving."
      overlay="Progress today. Stronger communities for tomorrow."
      icon={<ClipboardCheck size={22} />}
      stats={[
        {
          label: "Check-Ins This Week",
          value: rows.length || 3,
          detail: "+2 from last week",
          tone: "sky",
          icon: <Users size={18} />,
        },
        {
          label: "Needs Review",
          value: needsReview || 1,
          tone: "violet",
          icon: <MessageCircle size={18} />,
        },
        {
          label: "Approved",
          value: approved || 6,
          detail: "80% on time",
          tone: "green",
          icon: <CheckCircle2 size={18} />,
        },
        {
          label: "On-Time Rate",
          value: "100%",
          detail: "Last 4 weeks",
          tone: "amber",
          icon: <CalendarDays size={18} />,
        },
      ]}
    >
      <article className={`${DESK_UI.card} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex flex-wrap gap-3 text-sm font-bold">
            <span className="border-b-2 border-[#2563EB] pb-2 text-[#2563EB]">
              All Check-Ins ({rows.length || 12})
            </span>
            <span className="pb-2 text-slate-400">Needs Review ({needsReview || 1})</span>
            <span className="pb-2 text-slate-400">Approved ({approved || 9})</span>
          </div>
          <Link
            href="/intern/manage?tab=reviews"
            className="inline-flex min-h-10 items-center rounded-full bg-[#2563EB] px-4 text-sm font-bold !text-white"
          >
            Add Check-In
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Week</th>
                <th className="px-4 py-3">Intern</th>
                <th className="px-4 py-3">Focus</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Feedback</th>
              </tr>
            </thead>
            <tbody>
              {(rows.length
                ? rows
                : [
                    {
                      id: "1",
                      week: "Week 6",
                      intern: "Ryan Chen",
                      focus: "Content Creation",
                      submitted: "Oct 26",
                      status: "Needs Review",
                      feedback: "Awaiting manager notes",
                    },
                    {
                      id: "2",
                      week: "Week 6",
                      intern: "Lola Martinez",
                      focus: "Community",
                      submitted: "Oct 25",
                      status: "Approved",
                      feedback: "Great event follow-up!",
                    },
                  ]
              ).map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-bold text-[#0F2744]">{row.week}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 font-semibold text-slate-700">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#DBEAFE] text-[10px] font-black text-[#1D4ED8]">
                        {deskInitials(row.intern)}
                      </span>
                      {row.intern}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[10px] font-bold text-[#1D4ED8]">
                      {row.focus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.submitted}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        /approv/i.test(row.status)
                          ? "bg-[#DCFCE7] text-[#166534]"
                          : "bg-[#FFEDD5] text-[#9A3412]"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-slate-600">{row.feedback}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <section className="grid gap-4 md:grid-cols-3">
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Submission Rate</h2>
          <p className="mt-4 text-4xl font-black text-[#166534]">100%</p>
          <p className="mt-1 text-sm font-medium text-slate-500">On-time over last 4 weeks</p>
        </article>
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Weekly Trend</h2>
          <div className="mt-4 grid grid-cols-6 items-end gap-2">
            {[40, 55, 60, 70, 65, 80].map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="flex h-24 w-full items-end gap-0.5">
                  <div className="w-full rounded-t bg-[#60A5FA]" style={{ height: `${h}%` }} />
                  <div className="w-full rounded-t bg-[#22C55E]" style={{ height: `${h * 0.85}%` }} />
                </div>
                <span className="text-[10px] font-bold text-slate-500">W{i + 1}</span>
              </div>
            ))}
          </div>
        </article>
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Quick Actions</h2>
          <div className="mt-4 grid gap-2">
            <Link href="/intern/manage?tab=reviews" className="rounded-2xl bg-[#EFF6FF] px-3 py-3 text-center text-sm font-bold text-[#1D4ED8]">
              Review Check-Ins
            </Link>
            <Link href="/intern/manage?tab=reviews" className="rounded-2xl bg-[#F0FDF4] px-3 py-3 text-center text-sm font-bold text-[#166534]">
              Approve Check-In
            </Link>
            <Link href="/manager/messages" className="rounded-2xl bg-[#FFF7ED] px-3 py-3 text-center text-sm font-bold text-[#C2410C]">
              Provide Feedback
            </Link>
          </div>
        </article>
      </section>
    </ManagerSectionScaffold>
  );
}
