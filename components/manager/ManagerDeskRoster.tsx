"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, MoreHorizontal, Search } from "lucide-react";
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
    <section className={`${DESK_UI.card} min-w-0 max-w-full overflow-hidden`}>
      <div className="flex min-w-0 flex-col gap-3 border-b border-slate-100 px-3 py-4 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          <h2 className="text-lg font-black text-[#0F2744]">All Interns</h2>
          <div className="flex min-w-0 flex-wrap gap-2 text-sm font-bold" aria-label="Intern roster status">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-pressed={tab === item.id}
                className={
                  tab === item.id
                    ? "min-h-10 rounded-full bg-[#EFF6FF] px-3 text-[#2563EB] ring-1 ring-blue-200"
                    : "min-h-10 rounded-full px-3 text-slate-500 hover:bg-slate-100"
                }
              >
                {item.label} ({counts[item.id]})
              </button>
            ))}
          </div>
        </div>
        <label className="relative block w-full min-w-0 lg:w-56 lg:shrink-0">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search interns..."
            className="min-h-11 w-full min-w-0 rounded-full bg-[#F1F5F9] pl-8 pr-3 text-base font-medium text-[#0F2744] outline-none focus:ring-2 focus:ring-blue-200 lg:text-sm"
          />
        </label>
      </div>
      {/* Mobile/tablet: full-width cards instead of a 880px table spilling off-screen. */}
      <div className="grid min-w-0 gap-3 p-3 lg:hidden">
        {visible.map((row) => (
          <article key={row.id} className="min-w-0 space-y-3 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-3 shadow-sm sm:p-4">
            <div className="flex min-w-0 items-start gap-3">
              <Face name={row.name} src={row.avatarUrl} />
              <div className="min-w-0 flex-1">
                <h3 className="break-words text-base font-black text-[#0F2744]">{row.name}</h3>
                <p className="mt-0.5 break-words text-sm font-medium text-slate-600">{row.role}</p>
              </div>
              <span className="max-w-[44%] shrink-0">
                <StatusPill label={row.status} attention={row.attention} />
              </span>
            </div>
            <dl className="grid min-w-0 grid-cols-2 gap-2">
              <div className="min-w-0 rounded-xl bg-white p-3 ring-1 ring-slate-100">
                <dt className="text-[11px] font-semibold text-slate-500">Hours this week</dt>
                <dd className="mt-1 break-words text-sm font-black text-[#0F2744]">{row.hoursThisWeek}</dd>
              </div>
              <div className="min-w-0 rounded-xl bg-white p-3 ring-1 ring-slate-100">
                <dt className="text-[11px] font-semibold text-slate-500">Approved / required hours</dt>
                <dd className="mt-1 break-words text-sm font-black text-[#0F2744]">{row.totalHours}</dd>
              </div>
            </dl>
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-600">Progress</span>
                <span className="text-xs font-black text-[#0F2744]">{row.progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-[#22C55E]" style={{ width: String(row.progress) + "%" }} />
              </div>
            </div>
            <dl className="grid min-w-0 gap-2 sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Current assignment</dt>
                <dd className="mt-0.5 break-words text-sm font-semibold text-[#0F2744]">{row.assignment}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Next deadline</dt>
                <dd className="mt-0.5 break-words text-sm font-semibold text-[#DC2626]">{row.deadline}</dd>
              </div>
            </dl>
            <Link
              href={"/intern/manage?intern=" + encodeURIComponent(row.id)}
              className="inline-flex min-h-11 w-full items-center justify-between rounded-xl border border-blue-200 bg-white px-3 text-sm font-black text-[#2563EB] active:bg-blue-50"
            >
              <span>Open {row.name.split(" ")[0]}’s intern workspace</span>
              <ChevronRight size={18} aria-hidden="true" />
            </Link>
          </article>
        ))}
        {!visible.length ? (
          <p className="rounded-xl bg-[#F8FAFC] p-5 text-center text-sm font-medium text-slate-500">No interns in this list yet.</p>
        ) : null}
      </div>
      {/* Desktop keeps the full table. Overflow remains inside the table region. */}
      <div className="hidden min-w-0 max-w-full overflow-x-auto lg:block" role="region" aria-label="Intern roster table" tabIndex={0}>
        <table className="w-full min-w-[880px] text-left text-sm">
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
