"use client";

import { useMemo, useState } from "react";
import {
  activateInternHandoff,
  assignSelectedInterns,
  saveCohortDefaultStaff,
} from "@/lib/internship/onboarding-assign-actions";

export type AssignInternRow = {
  id: string;
  name: string;
  email: string;
  semester: string;
  status: string;
  portalEnabled: boolean;
  managerUserId: string;
  managerName: string;
  supervisorUserId: string;
  supervisorName: string;
};

export type AssignStaffOption = { id: string; label: string };

export default function AssignManagerDesk({
  interns,
  managers,
  supervisors,
  defaultManagerId,
  defaultSupervisorId,
  history,
  returnTo,
}: {
  interns: AssignInternRow[];
  managers: AssignStaffOption[];
  supervisors: AssignStaffOption[];
  defaultManagerId: string;
  defaultSupervisorId: string;
  history: Array<{ id: string; summary: string; when: string }>;
  returnTo: string;
}) {
  const [query, setQuery] = useState("");
  const [semester, setSemester] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const terms = useMemo(
    () => ["all", ...Array.from(new Set(interns.map((intern) => intern.semester).filter(Boolean)))],
    [interns],
  );
  const visible = interns.filter((intern) => {
    const haystack = `${intern.name} ${intern.email}`.toLowerCase();
    if (query && !haystack.includes(query.trim().toLowerCase())) return false;
    if (semester !== "all" && intern.semester !== semester) return false;
    if (status === "pending" && intern.portalEnabled) return false;
    if (status === "active" && !intern.portalEnabled) return false;
    return true;
  });

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <div className="space-y-5">
      <form action={saveCohortDefaultStaff} className="rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Spring 2027 default seats</h2>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          Ava Venezia manages active interns. Jason Graff is the official supervisor. Saving this does not activate anyone.
        </p>
        <input type="hidden" name="returnTo" value={returnTo} />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold text-slate-700">
            Default manager
            <select name="managerUserId" defaultValue={defaultManagerId} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-base">
              <option value="">Choose a manager</option>
              {managers.map((person) => (
                <option key={person.id} value={person.id}>{person.label}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold text-slate-700">
            Default supervisor
            <select name="supervisorUserId" defaultValue={defaultSupervisorId} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-base">
              <option value="">Choose a supervisor</option>
              {supervisors.map((person) => (
                <option key={person.id} value={person.id}>{person.label}</option>
              ))}
            </select>
          </label>
        </div>
        <button className="mt-3 inline-flex min-h-11 items-center rounded-full bg-[#0D5C3A] px-4 text-sm font-black !text-white" type="submit">
          Save Spring 2027 defaults
        </button>
      </form>

      <form action={assignSelectedInterns} className="rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">Assign manager</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              A saved assignment does not open the Intern Portal. Lalita stays prospective until her offer and university approval are confirmed.
            </p>
          </div>
        </div>
        <input type="hidden" name="returnTo" value={returnTo} />
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-bold text-slate-700">
            Search
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-base" placeholder="Name or email" />
          </label>
          <label className="text-sm font-bold text-slate-700">
            Cohort term
            <select value={semester} onChange={(event) => setSemester(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-base">
              {terms.map((term) => (
                <option key={term} value={term}>{term === "all" ? "All terms" : term}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold text-slate-700">
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-base">
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="active">Active portal</option>
            </select>
          </label>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold text-slate-700">
            Manager
            <select name="managerUserId" defaultValue={defaultManagerId} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-base">
              <option value="">Choose a manager</option>
              {managers.map((person) => (
                <option key={person.id} value={person.id}>{person.label}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold text-slate-700">
            Supervisor
            <select name="supervisorUserId" defaultValue={defaultSupervisorId} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-base">
              <option value="">Choose a supervisor</option>
              {supervisors.map((person) => (
                <option key={person.id} value={person.id}>{person.label}</option>
              ))}
            </select>
          </label>
        </div>
        <ul className="mt-4 grid gap-2">
          {visible.map((intern) => (
            <li key={intern.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 px-3 py-3">
              <label className="flex min-w-0 items-start gap-3">
                <input
                  type="checkbox"
                  name="internId"
                  value={intern.id}
                  checked={selected.includes(intern.id)}
                  onChange={() => toggle(intern.id)}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <span className="block font-black text-slate-950">{intern.name}</span>
                  <span className="block text-sm font-semibold text-slate-500">
                    {intern.email || "No email yet"} · {intern.status.replaceAll("_", " ")}
                    {intern.portalEnabled ? " · portal on" : " · not active"}
                    {intern.managerName ? ` · ${intern.managerName}` : ""}
                  </span>
                </span>
              </label>
            </li>
          ))}
          {visible.length ? null : <li className="text-sm font-semibold text-slate-500">No interns match these filters.</li>}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="inline-flex min-h-11 items-center rounded-full bg-[#0D5C3A] px-4 text-sm font-black !text-white" type="submit">
            Assign selected
          </button>
          <button className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-black text-slate-700" name="intent" value="clear" type="submit">
            Remove manager
          </button>
        </div>
      </form>

      <div className="grid gap-2">
        {visible.filter((intern) => !intern.portalEnabled).map((intern) => (
          <form key={intern.id} action={activateInternHandoff} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-3 py-3">
            <input type="hidden" name="returnTo" value={returnTo} />
            <input type="hidden" name="internId" value={intern.id} />
            <p className="text-sm font-bold text-slate-700">Activate {intern.name} only after approval, university verification, and onboarding are complete.</p>
            <button className="inline-flex min-h-10 items-center rounded-full border border-emerald-200 bg-white px-3 text-xs font-black text-[#0D5C3A]" type="submit">
              Activate when ready
            </button>
          </form>
        ))}
      </div>

      <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Assignment history</h2>
        <ul className="mt-3 grid gap-2">
          {history.length ? history.map((item) => (
            <li key={item.id} className="text-sm font-semibold text-slate-700">
              <span className="font-black text-slate-950">{item.when}</span> {item.summary}
            </li>
          )) : <li className="text-sm font-semibold text-slate-500">No assignment changes yet.</li>}
        </ul>
      </section>
    </div>
  );
}
