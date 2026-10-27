"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MoreHorizontal, Search } from "lucide-react";
import { DESK_UI, deskInitials } from "@/lib/portal/desk-ui";

export type DeskRosterRow = {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  hoursThisWeek: string;
  totalHours: string;
  progress: number;
  status: string;
  attention: boolean;
  assignment: string;
  deadline: string;
  roster: "active" | "completed" | "archived";
};

const TABS = [
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "archived", label: "Archived" },
] as const;

export default function ManagerDeskRoster({ rows }: { rows: DeskRosterRow[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("active");
  const [query, setQuery] = useState("");
  const counts = useMemo(
    () => ({
      active: rows.filter((row) => row.roster === "active").length,
      completed: rows.filter((row) => row.roster === "completed").length,
      archived: rows.filter((row) => row.roster === "archived").length,
    }),
    [rows],
  );
  const visible = rows.filter((row) => {
    if (row.roster !== tab) return false;
    const haystack = `${row.name} ${row.role} ${row.assignment}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  return (
    <section className={`${DESK_UI.card} overflow-hidden`}>
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-lg font-black text-[#0F2744]">All Interns</h2>
          <div className="flex gap-4 text-sm font-bold">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={
                  tab === item.id
                    ? "border-b-2 border-[#2563EB] pb-2 text-[#2563EB]"
                    : "pb-2 text-slate-500"
                }
              >
                {item.label} ({counts[item.id]})
              </button>
            ))}
          </div>
        </div>
        <label className="relative block w-full sm:w-56">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search interns..."
            className="min-h-10 w-full rounded-full bg-[#F1F5F9] pl-8 pr-3 text-sm font-medium text-[#0F2744] outline-none"
          />
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[880px] w-full text-left text-sm">
          <thead className="text-xs font-semibold text-slate-500">
            <tr>
              {["Intern", "Role", "Hours This Week", "Total Hours", "Progress", "Status", "Current Assignment", "Next Deadline", "Actions"].map(
                (label) => (
                  <th key={label} className="px-4 py-3 font-semibold">
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2 font-bold text-[#0F2744]">
                    <Face name={row.name} src={row.avatarUrl} />
                    {row.name}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-slate-600">{row.role}</td>
                <td className="px-4 py-3 font-semibold text-slate-700">{row.hoursThisWeek}</td>
                <td className="px-4 py-3 font-semibold text-slate-700">{row.totalHours}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-16 overflow-hidden rounded-full bg-slate-100">
                      <span
                        className="block h-full rounded-full bg-[#22C55E]"
                        style={{ width: `${row.progress}%` }}
                      />
                    </span>
                    <span className="text-xs font-bold text-slate-500">{row.progress}%</span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusPill label={row.status} attention={row.attention} />
                </td>
                <td className="px-4 py-3 font-medium text-slate-700">{row.assignment}</td>
                <td className="px-4 py-3 font-bold text-[#DC2626]">{row.deadline}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/intern/manage?intern=${row.id}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                    aria-label={`Open ${row.name}`}
                  >
                    <MoreHorizontal size={16} />
                  </Link>
                </td>
              </tr>
            ))}
            {!visible.length ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-sm font-medium text-slate-500">
                  No interns in this list yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Face({ name, src }: { name: string; src?: string }) {
  return (
    <span className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-[10px] font-black text-[#1D4ED8] ring-1 ring-slate-200">
      <span className="absolute inset-0 bg-white" />
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" src={src} className="relative z-[1] h-full w-full object-cover object-center" />
      ) : (
        <span className="relative z-[1]">{deskInitials(name)}</span>
      )}
    </span>
  );
}

function StatusPill({ label, attention }: { label: string; attention: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
        attention ? "bg-[#FFEDD5] text-[#C2410C]" : "bg-[#DCFCE7] text-[#166534]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${attention ? "bg-[#F97316]" : "bg-[#22C55E]"}`} />
      {label}
    </span>
  );
}
