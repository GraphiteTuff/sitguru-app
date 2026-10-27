import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Flag,
  Plus,
} from "lucide-react";
import ManagerSectionScaffold from "@/components/manager/ManagerSectionScaffold";
import { DESK_UI, deskInitials } from "@/lib/portal/desk-ui";

export default function ManagerMilestonesHome({
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
  const completed = rows.filter((row) => /complete/i.test(row.status)).length;
  const inProgress = rows.filter((row) => /progress/i.test(row.status)).length;
  const overdue = rows.filter((row) => /overdue|late/i.test(row.status)).length;

  return (
    <ManagerSectionScaffold
      title="Milestones"
      subtitle="Track key goals and accomplishments for each intern."
      overlay="Small steps today. Bigger opportunities tomorrow."
      icon={<Flag size={22} />}
      stats={[
        {
          label: "Total Milestones",
          value: rows.length || 24,
          detail: "Across 3 interns",
          tone: "sky",
          icon: <Flag size={18} />,
          href: "/manager/milestones",
          linkLabel: "View all milestones →",
        },
        {
          label: "Completed",
          value: completed || 16,
          tone: "green",
          icon: <CheckCircle2 size={18} />,
          progress: 67,
        },
        {
          label: "In Progress",
          value: inProgress || 6,
          tone: "amber",
          icon: <Clock3 size={18} />,
          progress: 25,
        },
        {
          label: "Overdue",
          value: overdue || 2,
          tone: "peach",
          icon: <AlertTriangle size={18} />,
          progress: 8,
        },
      ]}
    >
      <article className={`${DESK_UI.card} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex flex-wrap gap-3 text-sm font-bold">
            <span className="border-b-2 border-[#2563EB] pb-2 text-[#2563EB]">
              All Milestones ({rows.length || 24})
            </span>
            <span className="pb-2 text-slate-400">In Progress ({inProgress || 6})</span>
            <span className="pb-2 text-slate-400">Completed ({completed || 16})</span>
          </div>
          <Link
            href="/intern/manage"
            className="inline-flex min-h-10 items-center gap-1 rounded-full bg-[#2563EB] px-4 text-sm font-bold !text-white"
          >
            <Plus size={16} /> Add Milestone
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
                      title: "Instagram Campaign Series",
                      intern: "Ryan Chen",
                      category: "Content",
                      due: "Oct 27",
                      status: "Completed",
                      progress: 100,
                    },
                    {
                      id: "2",
                      title: "Community Event Content",
                      intern: "Lola Martinez",
                      category: "Community",
                      due: "Oct 30",
                      status: "In Progress",
                      progress: 70,
                    },
                    {
                      id: "3",
                      title: "Competitor Analysis",
                      intern: "Jordan Kim",
                      category: "Research",
                      due: "Oct 25",
                      status: "Overdue",
                      progress: 30,
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
                    <span className="rounded-full bg-[#F5F3FF] px-2.5 py-1 text-[10px] font-bold text-[#6D28D9]">
                      {row.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-[#DC2626]">{row.due}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        /complete/i.test(row.status)
                          ? "bg-[#DCFCE7] text-[#166534]"
                          : /overdue/i.test(row.status)
                            ? "bg-[#FEE2E2] text-[#B91C1C]"
                            : "bg-[#FFEDD5] text-[#9A3412]"
                      }`}
                    >
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
    </ManagerSectionScaffold>
  );
}
