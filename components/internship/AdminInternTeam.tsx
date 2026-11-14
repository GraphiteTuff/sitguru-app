"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Filter, Search, Users } from "lucide-react";
import InternAvatar from "@/components/internship/InternAvatar";
import { isFounderPersonalMarketplaceEmail } from "@/lib/admin/super-users";
import { saveInternshipAssignment } from "@/lib/internship/assignment-actions";
import { portalEnabledForInternStatus } from "@/lib/internship/onboarding-authority";
import { lifecycleLabel, universityApprovalLabel } from "@/lib/internship/assignment";
import InternshipStaffPicker, { type StaffChoice } from "@/components/internship/InternshipStaffPicker";

export type AdminInternCard = {
  id: string;
  name: string;
  email: string;
  university: string;
  program: string;
  term: string;
  academicYear: string;
  title: string;
  departmentId: string;
  departmentName: string;
  managerUserId: string;
  managerName: string;
  supervisorUserId: string;
  supervisorName: string;
  universityStatus: string;
  internshipStatus: string;
  credits: string;
  requiredHours: string;
  plannedWeeklyHours: string;
  weeks: string;
  startDate: string;
  endDate: string;
  weekLabel: string;
  paceLabel: string;
  approvedHours: string;
  notes: string;
  avatarUrl?: string | null;
};

const FILTERS = [
  "all",
  "candidate",
  "pending_university_approval",
  "approved",
  "onboarding",
  "active",
  "completed",
  "archived",
] as const;

export default function AdminInternTeam({
  interns,
  managers,
  supervisors,
  departments,
}: {
  interns: AdminInternCard[];
  managers: StaffChoice[];
  supervisors: StaffChoice[];
  departments: { id: string; name: string }[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof FILTERS)[number]>("all");
  const [managerId, setManagerId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [university, setUniversity] = useState("");

  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/^#(plan|approval|intern)-(.+)$/);
    if (!match) return;
    const details = document.getElementById(`assignment-${match[2]}`);
    if (details instanceof HTMLDetailsElement) details.open = true;
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
  }, []);

  const universities = useMemo(
    () => [...new Set(interns.map((intern) => intern.university).filter(Boolean))].sort(),
    [interns],
  );
  const visible = interns.filter((intern) => {
    const haystack = `${intern.name} ${intern.email} ${intern.program} ${intern.university} ${intern.managerName} ${intern.departmentName}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;
    if (status !== "all" && intern.internshipStatus !== status && !(status === "approved" && intern.internshipStatus === "accepted")) return false;
    if (managerId && intern.managerUserId !== managerId) return false;
    if (departmentId && intern.departmentId !== departmentId) return false;
    if (university && intern.university !== university) return false;
    return true;
  });
  const groups = new Map<string, AdminInternCard[]>();
  for (const intern of interns.filter((row) => !["archived", "withdrawn", "completed"].includes(row.internshipStatus))) {
    const key = intern.managerUserId || "unassigned";
    const list = groups.get(key) || [];
    list.push(intern);
    groups.set(key, list);
  }


  return (
    <div id="roster" className="min-w-0 scroll-mt-24 space-y-4">
      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,39,68,0.05)] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black tracking-tight text-[#0F2744]">Intern directory</h2>
            <p className="mt-1 text-sm font-medium text-slate-600">Find a student, review their progress, or update an assignment.</p>
          </div>
          <span aria-live="polite" className="rounded-full bg-[#EFF6FF] px-3 py-2 text-xs font-black text-[#1D4ED8]">
            {visible.length} of {interns.length} interns
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <label className="block text-xs font-black text-[#0F2744]">
            Search interns
            <span className="relative mt-1 block">
              <Search size={18} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email, school, manager..." className="min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-[#F4F7FB] pl-10 pr-3 text-sm font-medium text-[#0F2744] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100" />
            </span>
          </label>
          <label className="block text-xs font-black text-[#0F2744]">
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value as (typeof FILTERS)[number])} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-[#0F2744] focus:border-[#2563EB]">
              {FILTERS.map((item) => (
                <option key={item} value={item}>{item === "all" ? "All statuses" : lifecycleLabel(item)}</option>
              ))}
            </select>
          </label>
        </div>
        <details className="mt-3 rounded-xl bg-[#F4F7FB] px-3 py-2">
          <summary className="flex min-h-10 cursor-pointer items-center gap-2 text-xs font-black text-[#0F2744]"><Filter size={15} aria-hidden="true" /> More filters <span className="font-medium text-slate-500">(manager, department, university)</span></summary>
          <div className="grid gap-3 pb-3 sm:grid-cols-3">
            <label className="block text-xs font-bold text-[#0F2744]">
              Manager
              <select value={managerId} onChange={(event) => setManagerId(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                <option value="">All managers</option>
                {interns.filter((intern, index, list) => intern.managerUserId && list.findIndex((row) => row.managerUserId === intern.managerUserId) === index).map((intern) => (
                  <option key={intern.managerUserId} value={intern.managerUserId}>{intern.managerName || intern.managerUserId}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold text-[#0F2744]">
              Department
              <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                <option value="">All departments</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>{department.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold text-[#0F2744]">
              University
              <select value={university} onChange={(event) => setUniversity(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                <option value="">All universities</option>
                {universities.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </label>
          </div>
        </details>
      </section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        {visible.map((intern) => {
          const legacy = isFounderPersonalMarketplaceEmail(intern.email);
          const required = Number(intern.requiredHours);
          const approved = Number(intern.approvedHours);
          const hasHours = Boolean(intern.requiredHours) && Number.isFinite(required) && required > 0 && Number.isFinite(approved);
          const progress = hasHours ? Math.min(100, Math.max(0, Math.round((approved / required) * 100))) : null;
          const pending = ["candidate", "prospective", "pending_university_approval"].includes(intern.internshipStatus);
          const tone = intern.internshipStatus === "active"
            ? "bg-[#DCFCE7] text-[#166534]"
            : pending
              ? "bg-[#FFF4ED] text-[#C2410C]"
              : intern.internshipStatus === "completed"
                ? "bg-[#DBEAFE] text-[#1D4ED8]"
                : "bg-[#EFF6FF] text-[#1D4ED8]";
          return (
            <article key={intern.id} id={`intern-${intern.id}`} className="min-w-0 scroll-mt-24 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,39,68,0.05)] sm:p-5">
              <div className="flex min-w-0 flex-wrap items-start gap-3 sm:flex-nowrap">
                <InternAvatar name={intern.name} email={intern.email} src={intern.avatarUrl} size="md" className="ring-[#DBEAFE]" />
                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-lg font-black text-[#0F2744]">{intern.name}</h3>
                  <p className="mt-0.5 text-xs font-semibold text-slate-600">{intern.university || "School pending"}</p>
                  <p className="mt-1 break-all text-xs font-medium text-slate-500">{intern.email}</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${tone}`}>{lifecycleLabel(intern.internshipStatus)}</span>
              </div>
              {legacy ? (
                <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">Legacy test record, not an active student placement.</p>
              ) : null}
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl bg-[#F4F7FB] px-3 py-3">
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Assigned manager</p>
                  <p className="mt-1 break-words text-sm font-bold text-[#0F2744]">{intern.managerName || "Not assigned"}</p>
                </div>
                <div className="rounded-xl bg-[#EFF6FF] px-3 py-3">
                  <p className="text-[10px] font-black uppercase tracking-wide text-[#1D4ED8]">University verification</p>
                  <p className="mt-1 text-sm font-bold text-[#0F2744]">{universityApprovalLabel(intern.universityStatus)}</p>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-slate-100 px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-black text-[#0F2744]">Approved internship hours</p>
                  <p className="text-sm font-black text-[#0F2744]">
                    {intern.approvedHours} {intern.requiredHours ? `/ ${intern.requiredHours}` : ""} hours
                  </p>
                </div>
                {progress != null ? (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-[#22C55E]" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-600">{progress}%</span>
                  </div>
                ) : (
                  <p className="mt-1 text-xs font-medium text-slate-500">Hour requirement or approved hours not yet verified.</p>
                )}
                <p className="mt-2 text-xs font-semibold text-slate-500">{intern.weekLabel} · {intern.paceLabel}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/admin/internship/interns/${intern.id}#profile`} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-sm font-black !text-white hover:bg-[#1D4ED8] sm:flex-none">
                  Open record <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
                <Link href={`/intern?view=${intern.id}`} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-[#0F2744] hover:bg-[#F4F7FB] sm:flex-none">
                  {legacy || !portalEnabledForInternStatus(intern.internshipStatus) ? "Preview portal" : "Open portal"}
                </Link>
              </div>
              <details className="mt-3">
                <summary className="min-h-10 cursor-pointer py-2 text-xs font-bold text-slate-600">More: time & manager links</summary>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/intern/time?view=${intern.id}`} className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-3 text-xs font-bold text-[#2563EB]">Review time</Link>
                  {intern.managerUserId ? <Link href={`/intern/manage?manager=${intern.managerUserId}`} className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-3 text-xs font-bold text-[#2563EB]">Manager view</Link> : null}
                </div>
              </details>
                          <details id={`assignment-${intern.id}`} className="group mt-4 border-t border-slate-100 pt-3">
              <summary className="flex min-h-11 cursor-pointer items-center text-sm font-black text-[#2563EB]">Edit assignment & academic plan</summary>
              <form action={saveInternshipAssignment} className="mt-3 grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="internId" value={intern.id} />
                <label className="text-sm font-semibold">Internship title
                  <input name="internshipTitle" defaultValue={intern.title} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" />
                </label>
                <label className="text-sm font-semibold">Program
                  <input name="academicProgram" defaultValue={intern.program} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" />
                </label>
                <label className="text-sm font-semibold">Department
                  <select name="departmentId" defaultValue={intern.departmentId} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                    <option value="">Choose</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>{department.name}</option>
                    ))}
                  </select>
                </label>
                <InternshipStaffPicker
                  name="managerUserId"
                  label="Assigned manager"
                  people={managers}
                  defaultId={intern.managerUserId}
                  preserved={intern.managerUserId ? { id: intern.managerUserId, name: intern.managerName || "Current manager", email: "Existing assignment", jobTitle: "Keep current assignment" } : null}
                  emptyMessage="No eligible internship managers are configured. Configure a staff member's internship eligibility in Admin."
                />
                <InternshipStaffPicker
                  name="supervisorUserId"
                  label="Formal supervisor"
                  people={supervisors}
                  defaultId={intern.supervisorUserId}
                  preserved={intern.supervisorUserId ? { id: intern.supervisorUserId, name: intern.supervisorName || "Current supervisor", email: "Existing assignment", jobTitle: "Keep current assignment" } : null}
                  emptyMessage="No eligible internship supervisors are configured."
                />
                <label className="text-sm font-semibold">Internship status
                  <select name="internshipStatus" defaultValue={intern.internshipStatus} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                    {["candidate", "pending_university_approval", "approved", "onboarding", "active", "completed", "archived"].map((item) => (
                      <option key={item} value={item}>{lifecycleLabel(item)}</option>
                    ))}
                  </select>
                </label>
                <label id={`approval-${intern.id}`} className="scroll-mt-24 text-sm font-semibold">University approval
                  <select name="universityApproval" defaultValue={intern.universityStatus || "pending"} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
                    {["pending", "approved", "needs_information", "declined", "not_required"].map((item) => (
                      <option key={item} value={item}>{universityApprovalLabel(item)}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold">Term
                  <input name="semester" defaultValue={intern.term} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" />
                </label>
                <label className="text-sm font-semibold">Academic year
                  <input name="academicYear" defaultValue={intern.academicYear} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" />
                </label>
                <label id={`plan-${intern.id}`} className="scroll-mt-24 text-sm font-semibold">Credits
                  <input name="credits" defaultValue={intern.credits} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" />
                </label>
                <label className="text-sm font-semibold">Required hours
                  <input name="requiredHours" defaultValue={intern.requiredHours} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" />
                </label>
                <label className="text-sm font-semibold">Weekly hours
                  <input name="plannedWeeklyHours" defaultValue={intern.plannedWeeklyHours} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" />
                </label>
                <label className="text-sm font-semibold">Weeks
                  <input name="internshipWeeks" defaultValue={intern.weeks} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" />
                </label>
                <label className="text-sm font-semibold">Start
                  <input type="date" name="startDate" defaultValue={intern.startDate} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" />
                </label>
                <label className="text-sm font-semibold">End
                  <input type="date" name="endDate" defaultValue={intern.endDate} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" />
                </label>
                <label className="text-sm font-semibold sm:col-span-2">University notes
                  <textarea name="universityNotes" defaultValue={intern.notes} rows={2} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm" />
                </label>
                <label className="text-sm font-semibold sm:col-span-2">Reason
                  <input name="reason" required placeholder="Why this assignment changed" className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" />
                </label>
                <button className="min-h-11 rounded-xl bg-[#2563EB] px-4 text-sm font-black !text-white sm:col-span-2">Save assignment</button>
              </form>
            </details>
            </article>
          );
        })}
        {!visible.length ? <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600">No interns match these filters. Clear search or choose another status.</p> : null}
      </div>

      <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <summary className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-black text-[#0F2744]"><Users size={17} aria-hidden="true" /> Manager capacity & assignments</summary>
        <p className="mt-2 text-xs font-medium text-slate-600">Current intern allocation by assigned manager; archived and completed records are excluded.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...groups.entries()].map(([key, rows]) => (
            <article key={key} className="rounded-xl bg-[#F4F7FB] p-3">
              <p className="font-black text-[#0F2744]">{rows[0]?.managerName || "Unassigned"}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{rows.length} intern{rows.length === 1 ? "" : "s"}</p>
              <ul className="mt-2 space-y-1 text-sm font-medium text-slate-700">
                {rows.map((intern) => <li key={intern.id}>{intern.name}</li>)}
              </ul>
            </article>
          ))}
          {!groups.size ? <p className="text-sm font-medium text-slate-500">No open internship assignments.</p> : null}
        </div>
      </details>
    </div>
  );
}
