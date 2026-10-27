import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Plus,
} from "lucide-react";
import ManagerSectionScaffold from "@/components/manager/ManagerSectionScaffold";
import { DESK_UI, deskInitials } from "@/lib/portal/desk-ui";

export default function ManagerAssignmentsHome({
  rows,
}: {
  rows: Array<{
    id: string;
    title: string;
    intern: string;
    category: string;
    due: string;
    status: string;
    progress: number;
  }>;
}) {
  const active = rows.length;
  const onTrack = rows.filter((row) => /track|progress|active/i.test(row.status)).length;
  const inProgress = rows.filter((row) => /progress/i.test(row.status)).length;
  const needsReview = rows.filter((row) => /review|need/i.test(row.status)).length;

  return (
    <ManagerSectionScaffold
      title="Assignments"
      subtitle="Create, manage, and track intern assignments."
      overlay="Real work. Real experience. A brighter future for pets."
      icon={<ClipboardList size={22} />}
      stats={[
        {
          label: "Active Assignments",
          value: active || 12,
          detail: `Across ${Math.max(3, new Set(rows.map((r) => r.intern)).size)} interns`,
          tone: "sky",
          icon: <ClipboardList size={18} />,
          linkLabel: "View all assignments →",
          href: "/manager/assignments",
        },
        {
          label: "On Track",
          value: onTrack || 7,
          tone: "green",
          icon: <CheckCircle2 size={18} />,
          progress: 58,
        },
        {
          label: "In Progress",
          value: inProgress || 3,
          tone: "amber",
          icon: <Clock3 size={18} />,
          progress: 25,
        },
        {
          label: "Needs Review",
          value: needsReview || 2,
          tone: "peach",
          icon: <AlertTriangle size={18} />,
          progress: 17,
        },
      ]}
    >
      <article className={`${DESK_UI.card} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex flex-wrap gap-3 text-sm font-bold">
            <span className="border-b-2 border-[#2563EB] pb-2 text-[#2563EB]">
              All Assignments ({active || 12})
            </span>
            <span className="pb-2 text-slate-400">Active ({onTrack || 7})</span>
            <span className="pb-2 text-slate-400">Needs Review ({needsReview || 2})</span>
          </div>
          <Link
            href="/intern/manage"
            className="inline-flex min-h-10 items-center gap-1 rounded-full bg-[#2563EB] px-4 text-sm font-bold !text-white"
          >
            <Plus size={16} /> Create Assignment
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Intern</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Progress</th>
              </tr>
            </thead>
            <tbody>
              {(rows.length
                ? rows
                : [
                    {
                      id: "1",
                      title: "Instagram Campaign Posts",
                      intern: "Ryan Chen",
                      category: "Content",
                      due: "Oct 27",
                      status: "In Progress",
                      progress: 60,
                    },
                    {
                      id: "2",
                      title: "Community Outreach Plan",
                      intern: "Lola Martinez",
                      category: "Planning",
                      due: "Oct 28",
                      status: "In Review",
                      progress: 80,
                    },
                    {
                      id: "3",
                      title: "Q4 Growth Research",
                      intern: "Jordan Kim",
                      category: "Research",
                      due: "Nov 10",
                      status: "Not Started",
                      progress: 10,
                    },
                  ]
              ).map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-bold text-[#0F2744]">{row.title}</td>
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
                      {row.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-[#DC2626]">{row.due}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[#FFEDD5] px-2.5 py-1 text-[10px] font-bold text-[#9A3412]">
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#22C55E]"
                          style={{ width: `${row.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-500">{row.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <section className="grid gap-4 md:grid-cols-3">
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Assignment Progress</h2>
          <div className="mt-4 flex items-center justify-center">
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-[conic-gradient(#22C55E_0_58%,#F59E0B_58%_83%,#EF4444_83%_100%)]">
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
                <span className="text-2xl font-black text-[#0F2744]">{active || 12}</span>
                <span className="text-[10px] font-bold text-slate-500">Total</span>
              </div>
            </div>
          </div>
        </article>
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Upcoming Deadlines</h2>
          <ul className="mt-4 space-y-2 text-sm font-medium text-slate-700">
            {(rows.slice(0, 4).length
              ? rows.slice(0, 4)
              : [
                  { title: "Instagram Campaign Posts", intern: "Ryan Chen", due: "Oct 27" },
                  { title: "Community Outreach Plan", intern: "Lola Martinez", due: "Oct 28" },
                ]
            ).map((item) => (
              <li key={item.title} className="rounded-2xl bg-[#F8FAFC] px-3 py-3">
                <span className="font-bold text-[#0F2744]">{item.title}</span>
                <span className="mt-1 block text-xs text-slate-500">
                  {item.intern} · <span className="font-bold text-[#DC2626]">{item.due}</span>
                </span>
              </li>
            ))}
          </ul>
        </article>
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Quick Actions</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link href="/intern/manage" className="rounded-2xl bg-[#FFF7ED] px-3 py-3 text-center text-sm font-bold text-[#C2410C]">
              Create Assignment
            </Link>
            <Link href="/manager/team" className="rounded-2xl bg-[#EFF6FF] px-3 py-3 text-center text-sm font-bold text-[#1D4ED8]">
              Assign to Intern
            </Link>
            <Link href="/manager/analytics" className="rounded-2xl bg-[#F0FDF4] px-3 py-3 text-center text-sm font-bold text-[#166534]">
              View Progress Report
            </Link>
            <Link href="/manager/milestones" className="rounded-2xl bg-[#F5F3FF] px-3 py-3 text-center text-sm font-bold text-[#6D28D9]">
              View Templates
            </Link>
          </div>
        </article>
      </section>
    </ManagerSectionScaffold>
  );
}
