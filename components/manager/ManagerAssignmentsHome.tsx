"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock3,
} from "lucide-react";
import CreateAssignmentDialog, {
  type AssignmentFormValue,
  type AssignmentInternOption,
  type AssignmentMilestoneOption,
} from "@/components/manager/CreateAssignmentDialog";
import ManagerSectionScaffold from "@/components/manager/ManagerSectionScaffold";
import { InternName } from "@/components/portal/PersonFace";
import { DESK_UI } from "@/lib/portal/desk-ui";

export type ManagerAssignmentRow = AssignmentFormValue & {
  id: string;
  intern: string;
  avatarUrl?: string;
  dueLabel: string;
  statusLabel: string;
  progress: number;
};

export default function ManagerAssignmentsHome({
  rows,
  interns,
  milestones,
  notice,
  initialOpen = false,
  links = {},
}: {
  rows: ManagerAssignmentRow[];
  interns: AssignmentInternOption[];
  milestones: AssignmentMilestoneOption[];
  notice?: { kind: "ok" | "error"; message: string } | null;
  initialOpen?: boolean;
  links?: Record<string, { planner: string; files: string; teams: string; plannerUrl: string; filesUrl: string; teamsUrl: string }>;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [focusIntern, setFocusIntern] = useState(false);
  const [editing, setEditing] = useState<AssignmentFormValue | null>(null);
  const active = rows.filter((row) => row.statusLabel !== "Draft").length;
  const onTrack = rows.filter((row) => /progress|track|not started|to do/i.test(row.statusLabel)).length;
  const inProgress = rows.filter((row) => /progress/i.test(row.statusLabel)).length;
  const needsReview = rows.filter((row) => /review/i.test(row.statusLabel)).length;
  const internCount = new Set(rows.map((row) => row.internId).filter(Boolean)).size;

  function openCreate(focus: boolean) {
    setEditing(null);
    setFocusIntern(focus);
    setOpen(true);
  }

  return (
    <ManagerSectionScaffold
      title="Assignments"
      subtitle="Create, manage, and track intern assignments."
      overlay="Real work. Real experience. A brighter future for pets."
      icon={<ClipboardList size={22} />}
      stats={[
        {
          label: "Active Assignments",
          value: active,
          detail: internCount ? `Across ${internCount} intern${internCount === 1 ? "" : "s"}` : "No assignments yet",
          tone: "sky",
          icon: <ClipboardList size={18} />,
          linkLabel: "View all assignments →",
          href: "/manager/assignments",
        },
        {
          label: "On Track",
          value: onTrack,
          tone: "green",
          icon: <CheckCircle2 size={18} />,
          progress: 58,
        },
        {
          label: "In Progress",
          value: inProgress,
          tone: "amber",
          icon: <Clock3 size={18} />,
          progress: 25,
        },
        {
          label: "Needs Review",
          value: needsReview,
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
              All Assignments ({rows.length})
            </span>
            <span className="pb-2 text-slate-400">Active ({active})</span>
            <span className="pb-2 text-slate-400">Needs Review ({needsReview})</span>
          </div>
          <button
            type="button"
            onClick={() => openCreate(false)}
            className="inline-flex min-h-10 items-center gap-1 rounded-full bg-[#2563EB] px-4 text-sm font-bold !text-white"
          >
            Create Assignment
          </button>
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
                <th className="px-4 py-3">Planner</th>
                <th className="px-4 py-3">Files</th>
                <th className="px-4 py-3">Teams</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-bold text-[#0F2744]">
                    <button type="button" onClick={() => { setEditing(row); setFocusIntern(false); setOpen(true); }} className="text-left font-bold text-[#0F2744] underline-offset-2 hover:underline">
                      {row.title}
                    </button>
                    <Link href={`/manager/assignments/${row.id}`} className="mt-1 block text-xs font-bold text-[#2563EB]">Open</Link>
                  </td>
                  <td className="px-4 py-3">
                    <InternName name={row.intern} src={row.avatarUrl} className="font-semibold text-slate-700" />
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[10px] font-bold text-[#1D4ED8]">
                      {row.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-[#DC2626]">{row.dueLabel}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[#FFEDD5] px-2.5 py-1 text-[10px] font-bold text-[#9A3412]">
                      {row.statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-[#22C55E]" style={{ width: `${row.progress}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-500">{row.progress}%</span>
                    </div>
                  </td>
                  {(["planner", "files", "teams"] as const).map((key) => {
                    const item = links[row.id];
                    const label = item?.[key] || "Not configured";
                    const href = key === "planner" ? item?.plannerUrl : key === "files" ? item?.filesUrl : item?.teamsUrl;
                    return (
                      <td key={key} className="px-4 py-3 text-xs font-bold text-slate-600">
                        {href ? <a href={href} className="text-[#2563EB]">{label}</a> : label}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-sm font-medium text-slate-500">No assignments yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>

      <section className="grid gap-4 md:grid-cols-3">
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Assignment Progress</h2>
          <div className="mt-4 flex items-center justify-center">
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-[#EEF2F6]">
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
                <span className="text-2xl font-black text-[#0F2744]">{rows.length}</span>
                <span className="text-[10px] font-bold text-slate-500">Total</span>
              </div>
            </div>
          </div>
        </article>
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Upcoming Deadlines</h2>
          <ul className="mt-4 space-y-2 text-sm font-medium text-slate-700">
            {rows.filter((row) => row.dueOn && row.statusLabel !== "Draft").slice(0, 4).map((item) => (
              <li key={item.id} className="rounded-2xl bg-[#F8FAFC] px-3 py-3">
                <span className="font-bold text-[#0F2744]">{item.title}</span>
                <span className="mt-1 block text-xs text-slate-500">
                  {item.intern} · <span className="font-bold text-[#DC2626]">{item.dueLabel}</span>
                </span>
              </li>
            ))}
            {!rows.some((row) => row.dueOn && row.statusLabel !== "Draft") ? (
              <li className="rounded-2xl bg-[#F8FAFC] px-3 py-3 text-slate-500">No upcoming deadlines.</li>
            ) : null}
          </ul>
        </article>
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Quick Actions</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => openCreate(false)} className="rounded-2xl bg-[#FFF7ED] px-3 py-3 text-center text-sm font-bold text-[#C2410C]">
              Create Assignment
            </button>
            <button type="button" onClick={() => openCreate(true)} className="rounded-2xl bg-[#EFF6FF] px-3 py-3 text-center text-sm font-bold text-[#1D4ED8]">
              Assign to Intern
            </button>
            <Link href="/manager/analytics" className="rounded-2xl bg-[#F0FDF4] px-3 py-3 text-center text-sm font-bold text-[#166534]">
              View Progress Report
            </Link>
            <Link href="/manager/milestones" className="rounded-2xl bg-[#F5F3FF] px-3 py-3 text-center text-sm font-bold text-[#6D28D9]">
              View Templates
            </Link>
          </div>
        </article>
      </section>
      {notice ? (
        <p role="status" className={`fixed bottom-24 left-1/2 z-[70] w-[min(24rem,calc(100%-2rem))] -translate-x-1/2 rounded-2xl px-4 py-3 text-sm font-bold shadow-lg ${notice.kind === "ok" ? "bg-[#166534] !text-white" : "bg-rose-700 !text-white"}`}>
          {notice.message}
        </p>
      ) : null}
      <CreateAssignmentDialog
        interns={interns}
        milestones={milestones}
        open={open}
        focusIntern={focusIntern}
        initial={editing}
        onClose={() => setOpen(false)}
      />
    </ManagerSectionScaffold>
  );
}
