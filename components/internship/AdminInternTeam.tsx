"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { saveInternshipAssignment } from "@/lib/internship/assignment-actions";
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
};

const FILTERS = [
  "all",
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

  const universities = useMemo(
    () => [...new Set(interns.map((intern) => intern.university).filter(Boolean))].sort(),
    [interns],
  );
  const visible = interns.filter((intern) => {
    const haystack = `${intern.name} ${intern.university} ${intern.managerName} ${intern.departmentName}`.toLowerCase();
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
    <div className="space-y-4">
      <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-4">
        <h2 className="font-black text-slate-950">Manager capacity</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {[...groups.entries()].map(([key, rows]) => (
            <article key={key} className="rounded-2xl bg-[#FAF6EE] p-3">
              <p className="font-black text-slate-950">{rows[0]?.managerName || "Unassigned"}</p>
              <p className="text-sm font-semibold text-slate-600">Open interns: {rows.length}</p>
              <ul className="mt-2 space-y-1 text-sm font-semibold text-slate-800">
                {rows.map((intern) => (
                  <li key={intern.id}>{intern.name}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm font-semibold text-slate-700">
          Search
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, school, manager" className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value as (typeof FILTERS)[number])} className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base">
            {FILTERS.map((item) => (
              <option key={item} value={item}>{item === "all" ? "All" : lifecycleLabel(item)}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Manager
          <select value={managerId} onChange={(event) => setManagerId(event.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base">
            <option value="">All managers</option>
            {interns
              .filter((intern, index, list) => intern.managerUserId && list.findIndex((row) => row.managerUserId === intern.managerUserId) === index)
              .map((intern) => (
                <option key={intern.managerUserId} value={intern.managerUserId}>{intern.managerName || intern.managerUserId}</option>
              ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Department
          <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base">
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
          University
          <select value={university} onChange={(event) => setUniversity(event.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base">
            <option value="">All universities</option>
            {universities.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3">
        {visible.map((intern) => (
          <article key={intern.id} className="rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-xl font-black text-slate-950">{intern.name}</h2>
                <p className="text-sm font-semibold text-slate-600">{intern.email}</p>
              </div>
              <p className="text-sm font-black text-emerald-900">{lifecycleLabel(intern.internshipStatus)}</p>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm lg:grid-cols-4">
              {[
                ["University", intern.university || "Pending"],
                ["Program", intern.program || "Pending"],
                ["Term", intern.term || "Pending"],
                ["Title", intern.title || "Intern"],
                ["Department", intern.departmentName || "Unassigned"],
                ["Manager", intern.managerName || "Unassigned"],
                ["Supervisor", intern.supervisorName || "Unassigned"],
                ["University status", universityApprovalLabel(intern.universityStatus)],
                ["Credits", intern.credits || "Pending"],
                ["Required hours", intern.requiredHours || "Pending"],
                ["Weekly plan", intern.plannedWeeklyHours || "Pending"],
                ["Weeks", intern.weeks || "Pending"],
                ["Week", intern.weekLabel],
                ["Pace", intern.paceLabel],
                ["Approved hours", intern.approvedHours],
                ["Dates", [intern.startDate, intern.endDate].filter(Boolean).join(" – ") || "Not set"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-[#FAF6EE] px-3 py-2">
                  <dt className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">{label}</dt>
                  <dd className="mt-1 font-bold text-slate-950">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/admin/internship/interns/${intern.id}`} className="inline-flex min-h-11 items-center rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white">View intern</Link>
              <Link href={`/intern?view=${intern.id}`} className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 px-4 text-sm font-black text-emerald-900">Intern portal</Link>
              <Link href={`/intern/time?view=${intern.id}`} className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 px-4 text-sm font-black text-emerald-900">Time</Link>
              {intern.managerUserId ? (
                <Link href={`/intern/manage?manager=${intern.managerUserId}`} className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 px-4 text-sm font-black text-emerald-900">Manager desk</Link>
              ) : null}
            </div>
            <details className="mt-3">
              <summary className="min-h-11 cursor-pointer text-sm font-black text-emerald-900">Update assignment</summary>
              <form action={saveInternshipAssignment} className="mt-3 grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="internId" value={intern.id} />
                <label className="text-sm font-semibold">Internship title
                  <input name="internshipTitle" defaultValue={intern.title} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base" />
                </label>
                <label className="text-sm font-semibold">Program
                  <input name="academicProgram" defaultValue={intern.program} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base" />
                </label>
                <label className="text-sm font-semibold">Department
                  <select name="departmentId" defaultValue={intern.departmentId} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base">
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
                  <select name="internshipStatus" defaultValue={intern.internshipStatus} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base">
                    {["candidate", "pending_university_approval", "approved", "onboarding", "active", "completed", "archived"].map((item) => (
                      <option key={item} value={item}>{lifecycleLabel(item)}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold">University approval
                  <select name="universityApproval" defaultValue={intern.universityStatus || "pending"} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base">
                    {["pending", "approved", "needs_information", "declined", "not_required"].map((item) => (
                      <option key={item} value={item}>{universityApprovalLabel(item)}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold">Term
                  <input name="semester" defaultValue={intern.term} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base" />
                </label>
                <label className="text-sm font-semibold">Academic year
                  <input name="academicYear" defaultValue={intern.academicYear} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base" />
                </label>
                <label className="text-sm font-semibold">Credits
                  <input name="credits" defaultValue={intern.credits} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base" />
                </label>
                <label className="text-sm font-semibold">Required hours
                  <input name="requiredHours" defaultValue={intern.requiredHours} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base" />
                </label>
                <label className="text-sm font-semibold">Weekly hours
                  <input name="plannedWeeklyHours" defaultValue={intern.plannedWeeklyHours} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base" />
                </label>
                <label className="text-sm font-semibold">Weeks
                  <input name="internshipWeeks" defaultValue={intern.weeks} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base" />
                </label>
                <label className="text-sm font-semibold">Start
                  <input type="date" name="startDate" defaultValue={intern.startDate} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base" />
                </label>
                <label className="text-sm font-semibold">End
                  <input type="date" name="endDate" defaultValue={intern.endDate} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base" />
                </label>
                <label className="text-sm font-semibold sm:col-span-2">University notes
                  <textarea name="universityNotes" defaultValue={intern.notes} rows={2} className="mt-1 w-full rounded-xl border px-3 py-3 text-base" />
                </label>
                <label className="text-sm font-semibold sm:col-span-2">Reason
                  <input name="reason" required placeholder="Why this assignment changed" className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base" />
                </label>
                <button className="min-h-12 rounded-2xl bg-[#166534] px-4 text-sm font-black !text-white sm:col-span-2">Save assignment</button>
              </form>
            </details>
          </article>
        ))}
        {!visible.length ? <p className="text-sm font-semibold text-slate-600">No internships match those filters.</p> : null}
      </div>
    </div>
  );
}
