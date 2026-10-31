"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type DirectoryPerson = {
  id: string;
  name: string;
  avatarUrl?: string;
  group: "staff" | "guru" | "ambassador" | "intern" | "partner";
  groupLabel: string;
  role: string;
  organization: string;
  status: string;
  statusTone: "emerald" | "amber" | "violet" | "slate";
  onboarding: string;
  training: string;
  microsoft: string;
  href: string;
};

const tabs = [
  { id: "all", label: "All People" },
  { id: "staff", label: "Staff" },
  { id: "guru", label: "Gurus" },
  { id: "ambassador", label: "Ambassadors" },
  { id: "intern", label: "Interns" },
  { id: "partner", label: "Community Partners" },
] as const;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "SG";
}

function tone(toneName: DirectoryPerson["statusTone"]) {
  if (toneName === "emerald") return "bg-emerald-50 text-emerald-800";
  if (toneName === "amber") return "bg-amber-50 text-amber-900";
  if (toneName === "violet") return "bg-violet-50 text-violet-800";
  return "bg-slate-100 text-slate-700";
}

function microsoftTone(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === "ready" || normalized === "connected") return "bg-emerald-50 text-emerald-800";
  if (normalized.includes("provision") || normalized.includes("progress")) return "bg-amber-50 text-amber-900";
  return "bg-slate-100 text-slate-600";
}

function Avatar({ person }: { person: DirectoryPerson }) {
  return (
    <span className="relative inline-flex h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
      {person.avatarUrl ? (
        <img src={person.avatarUrl} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-emerald-50 text-[10px] font-black text-[#0D5C3A]">
          {initials(person.name)}
        </span>
      )}
    </span>
  );
}

export default function WorkforceDirectory({
  people,
  totals,
}: {
  people: DirectoryPerson[];
  totals?: Partial<Record<(typeof tabs)[number]["id"], number>>;
}) {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const counts = useMemo(() => {
    const base = { all: people.length, staff: 0, guru: 0, ambassador: 0, intern: 0, partner: 0 };
    for (const person of people) base[person.group] += 1;
    return { ...base, ...totals, all: totals?.all ?? base.all };
  }, [people, totals]);
  const visible = people.filter((person) => {
    if (tab !== "all" && person.group !== tab) return false;
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return `${person.name} ${person.role} ${person.organization} ${person.groupLabel} ${person.status}`.toLowerCase().includes(needle);
  });

  return (
    <section className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          Workforce Directory
        </h2>
        <Link href="/admin/users" className="text-xs font-black text-[#0D5C3A]">View Full Directory</Link>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`min-h-11 whitespace-nowrap rounded-full px-3 py-2 text-xs font-black ${
              tab === item.id ? "bg-[#0D5C3A] !text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            {item.label} ({counts[item.id]})
          </button>
        ))}
      </div>
      <label className="mt-3 block">
        <span className="sr-only">Search people</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search people"
          className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900"
        />
      </label>
      <div className="mt-3 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead>
            <tr className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">
              <th className="pb-2 pr-3">Name</th>
              <th className="pb-2 pr-3">Role / Group</th>
              <th className="pb-2 pr-3">Organization</th>
              <th className="pb-2 pr-3">Status</th>
              <th className="pb-2 pr-3">Onboarding</th>
              <th className="pb-2 pr-3">Training</th>
              <th className="pb-2 pr-3">Microsoft 365</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((person) => (
              <tr key={`${person.group}-${person.id}`} className="border-t border-slate-100">
                <td className="py-3 pr-3 font-black text-slate-950">
                  <span className="inline-flex items-center gap-2">
                    <Avatar person={person} />
                    {person.name}
                  </span>
                </td>
                <td className="py-3 pr-3 font-semibold text-slate-700">{person.role}</td>
                <td className="py-3 pr-3 font-semibold text-slate-600">{person.organization}</td>
                <td className="py-3 pr-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${tone(person.statusTone)}`}>{person.status}</span>
                </td>
                <td className="py-3 pr-3 font-semibold text-slate-600">{person.onboarding}</td>
                <td className="py-3 pr-3 font-semibold text-slate-600">{person.training}</td>
                <td className="py-3 pr-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${microsoftTone(person.microsoft)}`}>{person.microsoft}</span>
                </td>
                <td className="py-3">
                  <Link href={person.href} className="inline-flex min-h-11 items-center text-xs font-black text-[#0D5C3A]">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 grid gap-2 md:hidden">
        {visible.map((person) => (
          <Link key={`${person.group}-${person.id}`} href={person.href} className="rounded-2xl border border-slate-100 p-3">
            <span className="flex items-center gap-3">
              <Avatar person={person} />
              <span className="min-w-0">
                <span className="block truncate font-black text-slate-950">{person.name}</span>
                <span className="block truncate text-sm font-semibold text-slate-600">{person.role} · {person.organization}</span>
              </span>
            </span>
            <span className="mt-2 flex flex-wrap gap-1.5">
              <span className={`rounded-full px-2 py-1 text-xs font-bold ${tone(person.statusTone)}`}>{person.status}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{person.onboarding}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{person.training}</span>
              <span className={`rounded-full px-2 py-1 text-xs font-bold ${microsoftTone(person.microsoft)}`}>{person.microsoft}</span>
            </span>
          </Link>
        ))}
      </div>
      {visible.length ? null : <p className="mt-4 text-sm font-semibold text-slate-500">No people in this group yet.</p>}
      {counts[tab] > visible.length && !query.trim() ? (
        <p className="mt-3 text-xs font-semibold text-slate-500">
          Showing {visible.length} of {counts[tab]}. View Full Directory opens the complete list.
        </p>
      ) : null}
    </section>
  );
}
