"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Filter, MoreHorizontal, Search } from "lucide-react";

export type InternTableRow = {
  key: string;
  name: string;
  roleTitle: string;
  university: string;
  academicProgram: string;
  creditLine: string;
  hoursLine: string;
  weeklyLine: string;
  status: string;
  statusTone: "amber" | "violet" | "emerald" | "slate";
  onboarding: string;
  microsoft: string;
  managerName: string;
  recordId: string | null;
  canCreate: boolean;
};

const menuLink = "block rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-emerald-50";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function toneClass(tone: InternTableRow["statusTone"]) {
  if (tone === "emerald") return "bg-emerald-50 text-emerald-800";
  if (tone === "violet") return "bg-violet-50 text-violet-800";
  if (tone === "amber") return "bg-amber-50 text-amber-900";
  return "bg-slate-100 text-slate-700";
}

export default function SpringInternTable({
  rows,
  canAdminister,
}: {
  rows: InternTableRow[];
  canAdminister: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      const haystack = `${row.name} ${row.university} ${row.academicProgram} ${row.status} ${row.managerName}`.toLowerCase();
      if (needle && !haystack.includes(needle)) return false;
      if (filter === "active" && row.statusTone !== "emerald") return false;
      if (filter === "pending" && row.statusTone !== "amber") return false;
      if (filter === "prospective" && row.statusTone !== "violet") return false;
      return true;
    });
  }, [filter, query, rows]);

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <label className="relative min-w-0 flex-1 sm:max-w-xs">
          <span className="sr-only">Search interns</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search interns..."
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-semibold"
          />
        </label>
        <label className="relative">
          <span className="sr-only">Filter interns</span>
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="min-h-11 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-bold text-slate-700"
          >
            <option value="all">Filter</option>
            <option value="pending">University approval pending</option>
            <option value="prospective">Prospective</option>
            <option value="active">Active</option>
          </select>
        </label>
        {canAdminister ? (
          <Link
            href="/admin/internship/interns"
            className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl bg-[#0D5C3A] px-4 text-sm font-black !text-white"
          >
            + Add Intern
          </Link>
        ) : null}
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead>
            <tr className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">
              <th className="pb-2 pr-3">Intern</th>
              <th className="pb-2 pr-3">University</th>
              <th className="pb-2 pr-3">Program</th>
              <th className="pb-2 pr-3">Credits / Hours</th>
              <th className="pb-2 pr-3">Status</th>
              <th className="pb-2 pr-3">Onboarding</th>
              <th className="pb-2 pr-3">Microsoft 365</th>
              <th className="pb-2 pr-3">Manager</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.key} className="border-t border-slate-100">
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-600">
                      {initials(row.name)}
                    </span>
                    <span>
                      <span className="block text-sm font-black text-slate-950">{row.name}</span>
                      <span className="block text-xs font-semibold text-slate-500">{row.roleTitle}</span>
                    </span>
                  </div>
                </td>
                <td className="py-3 pr-3 text-sm font-bold text-slate-800">{row.university}</td>
                <td className="py-3 pr-3 text-sm font-semibold text-slate-600">{row.academicProgram || "Program pending"}</td>
                <td className="py-3 pr-3 text-sm font-semibold text-slate-700">
                  <span className="block">{row.creditLine}</span>
                  <span className="block text-xs text-slate-500">{row.hoursLine}</span>
                  <span className="block text-xs text-slate-500">{row.weeklyLine}</span>
                </td>
                <td className="py-3 pr-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${toneClass(row.statusTone)}`}>
                    {row.status}
                  </span>
                </td>
                <td className="py-3 pr-3 text-sm font-semibold text-slate-600">{row.onboarding}</td>
                <td className="py-3 pr-3 text-sm font-semibold text-slate-600">{row.microsoft}</td>
                <td className="py-3 pr-3">
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-800">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-black text-[#0D5C3A]">
                      {initials(row.managerName || "Manager")}
                    </span>
                    {row.managerName || "Unassigned"}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    {row.recordId ? (
                      <Link href={`/admin/internship/interns/${row.recordId}#profile`} className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-800">
                        View
                      </Link>
                    ) : (
                      <span className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-400">View</span>
                    )}
                    {row.recordId ? (
                      <details className="relative">
                        <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg border border-slate-200 text-slate-600">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">More actions for {row.name}</span>
                        </summary>
                        <div className="absolute right-0 z-10 mt-1 w-48 rounded-2xl border border-slate-200 bg-white p-1 shadow-lg">
                          <Link className={menuLink} href={`/admin/internship/interns/${row.recordId}#profile`}>View profile</Link>
                          <Link className={menuLink} href={`/admin/internship/interns#plan-${row.recordId}`}>Edit academic plan</Link>
                          <Link className={menuLink} href={`/admin/internship/interns/${row.recordId}#onboarding`}>View onboarding</Link>
                          <Link className={menuLink} href={`/admin/hr/team-access`}>Assign manager</Link>
                          <Link className={menuLink} href={`/intern?view=${encodeURIComponent(row.recordId)}`}>Open intern portal</Link>
                        </div>
                      </details>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {visible.length ? null : (
              <tr>
                <td colSpan={9} className="py-6 text-sm font-semibold text-slate-500">No interns match that search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
