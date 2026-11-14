"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarDays, CheckCircle2, CircleHelp, Clock3, Flag, Search, Users, X } from "lucide-react";
import ManagerSectionScaffold from "@/components/manager/ManagerSectionScaffold";
import { InternName } from "@/components/portal/PersonFace";
import { DESK_UI } from "@/lib/portal/desk-ui";
import type { ManagerMilestone, ManagerMilestoneSummary } from "@/lib/internship/manager-milestones";

type Filter = "all" | "upcoming" | "attention" | "completed" | "university";
const options: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Scheduled & in progress" },
  { value: "attention", label: "Needs attention" },
  { value: "completed", label: "Completed" },
  { value: "university", label: "University dates" },
];

function displayDate(value: string) {
  if (!value) return "Not scheduled";
  const date = new Date(value.slice(0, 10) + "T12:00:00");
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function statusLabel(status: ManagerMilestone["displayStatus"]) {
  if (status === "completed") return "Completed";
  if (status === "in_progress") return "In progress";
  if (status === "overdue") return "Past due";
  if (status === "blocked") return "Blocked";
  return "Scheduled";
}
function statusStyle(status: ManagerMilestone["displayStatus"]) {
  if (status === "completed") return "bg-[#DCFCE7] text-[#166534]";
  if (status === "in_progress") return "bg-[#DBEAFE] text-[#1D4ED8]";
  if (status === "blocked" || status === "overdue") return "bg-[#FEE2E2] text-[#B91C1C]";
  return "bg-[#F1F5F9] text-slate-700";
}

function MilestoneCard({ row }: { row: ManagerMilestone }) {
  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_6px_22px_rgba(15,39,68,0.04)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#2563EB]">
            {row.phase || "Program"} · {row.applicableTo === "university" ? "University requirement" : "SitGuru program"}
          </p>
          <h3 className="mt-1 text-base font-black leading-6 text-[#0F2744]">{row.title}</h3>
          {row.action ? <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{row.action}</p> : null}
        </div>
        <span className={"shrink-0 rounded-full px-3 py-1.5 text-xs font-black " + statusStyle(row.displayStatus)}>
          {statusLabel(row.displayStatus)}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs font-bold text-slate-600">
        <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} aria-hidden="true" /> {displayDate(row.dueOn)}</span>
        <span className="inline-flex items-center gap-1.5"><Users size={15} aria-hidden="true" /> {row.assignedInterns.length} assigned {row.assignedInterns.length === 1 ? "intern" : "interns"}</span>
        {row.universityName ? <span className="text-[#0D5C3A]">{row.universityName}</span> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {row.assignedInterns.map(intern => (
          <span key={intern.id} className="inline-flex items-center rounded-xl bg-[#F8FAFC] px-2 py-1.5 text-xs">
            <InternName name={intern.name} src={intern.avatarUrl} className="font-bold text-[#0F2744]" />
          </span>
        ))}
      </div>
    </article>
  );
}

export default function ManagerMilestonesHome({
  summary, cohortLabel, canManageProgram,
}: {
  summary: ManagerMilestoneSummary;
  cohortLabel: string;
  canManageProgram: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = useMemo(() => {
    const terms = query.trim().toLowerCase();
    return summary.rows.filter(row => {
      if (filter === "upcoming" && !["scheduled", "in_progress"].includes(row.displayStatus)) return false;
      if (filter === "attention" && !["blocked", "overdue"].includes(row.displayStatus)) return false;
      if (filter === "completed" && row.displayStatus !== "completed") return false;
      if (filter === "university" && row.applicableTo !== "university") return false;
      if (!terms) return true;
      return [row.title, row.action, row.phase, row.universityName, row.status,
        ...row.assignedInterns.map(intern => intern.name)].join(" ").toLowerCase().includes(terms);
    });
  }, [filter, query, summary.rows]);

  return (
    <ManagerSectionScaffold
      title="Milestones"
      subtitle={"Real internship program milestones and university deadlines for your assigned team · " + cohortLabel}
      overlay="Clear priorities. Measurable progress."
      icon={<Flag size={22} />}
      stats={[
        { label: "Total milestones", value: summary.total, tone: "sky", icon: <Flag size={18} />, detail: summary.totalInterns + " assigned interns" },
        { label: "Completed", value: summary.completed, tone: "green", icon: <CheckCircle2 size={18} />, progress: summary.percentComplete ?? undefined, detail: summary.percentComplete === null ? "No milestones recorded" : summary.percentComplete + "% of scheduled milestones" },
        { label: "In progress", value: summary.inProgress, tone: "violet", icon: <Clock3 size={18} />, detail: "Actual saved milestone statuses" },
        { label: "Needs attention", value: summary.overdue + summary.blocked, tone: "peach", icon: <AlertTriangle size={18} />, detail: summary.overdue + " past due · " + summary.blocked + " blocked" },
      ]}
    >
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[#0F2744]">Assigned team timeline</h2>
            <p className="mt-1 text-sm font-medium text-slate-600">All dates and statuses below come from SitGuru's saved internship calendar. Shared program milestones are not duplicated per student.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/manager/help/program-milestones" className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-[#2563EB] hover:bg-[#EFF6FF]">How milestones work</Link>
            <Link href="/manager/team" className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm font-black text-[#0F2744] hover:bg-[#EFF6FF]">My Team</Link>
            <Link href="/manager/assignments" className="inline-flex min-h-11 items-center rounded-xl bg-[#2563EB] px-4 text-sm font-black !text-white hover:bg-[#1D4ED8]">Assignments</Link>
            {canManageProgram ? <Link href="/admin/internship/timeline" className="inline-flex min-h-11 items-center rounded-xl bg-[#0D5C3A] px-4 text-sm font-black !text-white">Manage official dates</Link> : null}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <label className="relative min-w-[200px] flex-1">
            <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#2563EB]" />
            <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search milestones, interns, university..." aria-label="Search milestones" className="min-h-12 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] py-2 pl-10 pr-10 text-sm font-semibold text-[#0F2744] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#DBEAFE]" />
            {query ? <button aria-label="Clear search" type="button" onClick={() => setQuery("")} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center text-slate-500"><X size={16} /></button> : null}
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Filter milestone status">
          {options.map(option => {
            const active = filter === option.value;
            return <button key={option.value} type="button" aria-pressed={active} onClick={() => setFilter(option.value)}
              className={"min-h-10 rounded-xl border px-3 text-xs font-black " + (active ? "border-[#2563EB] bg-[#2563EB] !text-white" : "border-slate-200 bg-white text-[#0F2744] hover:bg-[#EFF6FF]")}>
              {option.label}
            </button>;
          })}
        </div>
        <p role="status" className="mt-3 text-xs font-semibold text-slate-500">{filtered.length} of {summary.total} recorded milestones</p>
      </section>
      {filtered.length ? (
        <div className="grid min-w-0 gap-3 xl:grid-cols-2">
          {filtered.map(row => <MilestoneCard key={row.id} row={row} />)}
        </div>
      ) : (
        <section className={DESK_UI.card + " p-6"}>
          <h2 className="text-lg font-black text-[#0F2744]">{summary.total ? "No milestones match your filters" : "No program milestones assigned yet"}</h2>
          <p className="mt-2 text-sm font-medium text-slate-600">{summary.total ? "Try a different phase, name or status." : "The program timeline has no recorded entries applying to your assigned interns. Admin HQ manages the shared cohort dates."}</p>
          <button type="button" onClick={() => { setQuery(""); setFilter("all"); }} className="mt-3 min-h-11 rounded-xl bg-[#EFF6FF] px-4 text-sm font-black text-[#1D4ED8]">Show all milestones</button>
        </section>
      )}
      <div className="flex flex-wrap items-start gap-3 rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
        <CircleHelp size={20} aria-hidden="true" className="shrink-0 text-[#2563EB]" />
        <p className="min-w-0 flex-1 text-sm font-medium leading-6 text-[#0F2744]">
          <strong>Status and academic requirements:</strong> A program milestone is completed only when SitGuru records it as completed. University-specific dates apply only to students at that school. Ava can manage student assignments, submissions and reviews from the Manager Desk; changes to the shared employer calendar remain controlled through Admin HQ.
        </p>
      </div>
    </ManagerSectionScaffold>
  );
}
