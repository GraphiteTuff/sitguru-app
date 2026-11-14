"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CircleDollarSign, Filter, Search, UserRound } from "lucide-react";
import { updateEngagementRate } from "@/lib/staff-time/actions";

export type StaffPeopleRow = {
  id: string;
  userId: string;
  displayName: string;
  title: string;
  email: string;
  classification: string;
  weeklyMin: number;
  weeklyMax: number;
  cadence: string;
  startOn: string | null;
  w9Status: string;
  rateCents: number | null;
};

function initials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.slice(0, 1)).join("").toUpperCase() || "SG";
}

function money(cents: number | null) {
  return cents == null ? "Rate not set" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100) + "/hr";
}

const input = "mt-1 min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0F2744] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100";

export default function StaffPeopleDirectory({ people, today }: { people: StaffPeopleRow[]; today: string }) {
  const [query, setQuery] = useState("");
  const [w9, setW9] = useState<"all" | "received" | "pending">("all");
  const [classification, setClassification] = useState("all");
  const classifications = useMemo(() => [...new Set(people.map((p) => p.classification).filter(Boolean))].sort(), [people]);
  const filtered = useMemo(() => people.filter((person) => {
    const needle = query.trim().toLowerCase();
    if (needle && !`${person.displayName} ${person.email} ${person.title} ${person.classification}`.toLowerCase().includes(needle)) return false;
    if (w9 !== "all" && (person.w9Status === "received") !== (w9 === "received")) return false;
    if (classification !== "all" && classification !== person.classification) return false;
    return true;
  }), [people, query, w9, classification]);

  return (
    <section id="team-engagements" className="min-w-0 scroll-mt-24 space-y-4">
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,39,68,0.05)] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[#0F2744]">Team directory</h2>
            <p className="mt-1 text-sm font-medium text-slate-600">Find a team member, open their workspace, or review compensation details.</p>
          </div>
          <span aria-live="polite" className="rounded-full bg-[#EFF6FF] px-3 py-2 text-xs font-black text-[#1D4ED8]">
            {filtered.length} of {people.length} active engagements
          </span>
        </div>
        <label className="mt-4 block text-xs font-black text-[#0F2744]">
          Search team members
          <span className="relative mt-1 block">
            <Search size={18} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, role, email, classification..." className="min-h-11 w-full rounded-xl border border-slate-200 bg-[#F4F7FB] pl-10 pr-3 text-sm font-medium text-[#0F2744] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </span>
        </label>
        <details className="mt-3 rounded-xl bg-[#F4F7FB] p-3">
          <summary className="flex min-h-9 cursor-pointer items-center gap-2 text-xs font-black text-[#0F2744]">
            <Filter size={16} aria-hidden="true" /> More filters
          </summary>
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <label className="text-xs font-bold text-[#0F2744]">
              W-9 status
              <select value={w9} onChange={(e) => setW9(e.target.value as "all" | "received" | "pending")} className={input}>
                <option value="all">All statuses</option>
                <option value="received">Received</option>
                <option value="pending">Not on file</option>
              </select>
            </label>
            <label className="text-xs font-bold text-[#0F2744]">
              Engagement type
              <select value={classification} onChange={(e) => setClassification(e.target.value)} className={input}>
                <option value="all">All types</option>
                {classifications.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}
              </select>
            </label>
          </div>
        </details>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        {filtered.map((person) => {
          const hasW9 = person.w9Status === "received";
          return (
            <article key={person.id} className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,39,68,0.05)] sm:p-5">
              <div className="flex min-w-0 items-start gap-3">
                <span aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#DBEAFE] text-base font-black text-[#1D4ED8]">
                  {initials(person.displayName)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-words text-lg font-black text-[#0F2744]">{person.displayName}</h3>
                    <span className="rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#166534]">Active</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-600">{person.title || "Team member"}</p>
                  <p className="mt-1 break-all text-xs font-medium text-slate-500">{person.email}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl bg-[#EFF6FF] p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#1D4ED8]">Current rate</p>
                  <p className="mt-1 text-lg font-black text-[#0F2744]">{money(person.rateCents)}</p>
                </div>
                <div className={`rounded-xl p-3 ${hasW9 ? "bg-[#F0FDF4]" : "bg-[#FFF7ED]"}`}>
                  <p className={`text-[10px] font-black uppercase tracking-wider ${hasW9 ? "text-[#166534]" : "text-[#C2410C]"}`}>W-9 status</p>
                  <p className="mt-1 text-lg font-black text-[#0F2744]">{hasW9 ? "Received" : "Not on file"}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-slate-100 p-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Weekly expectation</p>
                  <p className="mt-1 text-sm font-bold text-[#0F2744]">{person.weeklyMin}–{person.weeklyMax} hours</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Payment schedule</p>
                  <p className="mt-1 text-sm font-bold capitalize text-[#0F2744]">{person.cadence.replaceAll("_", " ")}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/admin/growth/preview/${encodeURIComponent(person.userId)}`} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-sm font-black !text-white hover:bg-[#1D4ED8] sm:flex-none">
                  Open workspace <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
                <Link href="/admin/hr/people/payments" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-[#0F2744] hover:bg-[#F4F7FB] sm:flex-none">
                  <CircleDollarSign size={16} aria-hidden="true" /> Payments
                </Link>
              </div>
              <details className="mt-4 border-t border-slate-100 pt-3">
                <summary className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-black text-[#2563EB]">
                  <UserRound size={17} aria-hidden="true" /> Compensation details & rate history
                </summary>
                <div className="mt-2 rounded-xl bg-[#F4F7FB] px-3 py-3 text-xs font-medium text-slate-600">
                  <p>Engagement: <span className="font-bold capitalize text-[#0F2744]">{person.classification.replaceAll("_", " ")}</span>
                    {person.startOn ? ` · Since ${person.startOn}` : ""}</p>
                  <p className="mt-1">Rate changes take effect on the selected date. Past approved payment calculations remain subject to the existing payroll rules.</p>
                </div>
                <form action={updateEngagementRate} className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="engagementId" value={person.id} />
                  <label className="text-xs font-black text-[#0F2744]">New hourly rate (USD)
                    <input type="number" inputMode="decimal" min="0.01" step="0.01" name="hourlyRateDollars" required defaultValue={person.rateCents == null ? "" : (person.rateCents / 100).toFixed(2)} placeholder="Agreement rate" className={input} />
                  </label>
                  <label className="text-xs font-black text-[#0F2744]">Effective on
                    <input type="date" name="effectiveOn" defaultValue={today} required className={input} />
                  </label>
                  <label className="text-xs font-black text-[#0F2744] sm:col-span-2">Reason for change
                    <input name="notes" placeholder="Approved agreement change or adjustment" className={input} />
                  </label>
                  <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0D5C3A] px-4 text-sm font-black !text-white sm:col-span-2 sm:justify-self-start">
                    Save effective-dated rate
                  </button>
                </form>
              </details>
            </article>
          );
        })}
        {!filtered.length && people.length > 0 ? (
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 sm:col-span-2">
            <p className="text-base font-black text-[#0F2744]">No matching team members</p>
            <p className="mt-1 text-sm text-slate-600">Try a different search or remove the filters.</p>
            <button type="button" onClick={() => { setQuery(""); setW9("all"); setClassification("all"); }} className="mt-3 min-h-11 rounded-xl bg-[#2563EB] px-4 text-sm font-black !text-white">Clear filters</button>
          </div>
        ) : null}
      </div>

      {!people.length ? (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
          <p className="font-black text-[#0F2744]">No active team-member engagements yet</p>
          <p className="mt-2 text-sm font-medium text-slate-600">An eligible manager's My Time workspace establishes their engagement. This page will display their current records once available.</p>
        </div>
      ) : null}
      <p className="px-1 text-xs font-medium text-slate-500">W-9 status only. Tax identifiers, uploaded tax forms and private banking information are never displayed here.</p>
    </section>
  );
}
