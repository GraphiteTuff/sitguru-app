import Link from "next/link";
import { getAdminIdentity } from "@/lib/admin/access";
import { hireGrowthManager, removeGrowthManager } from "@/lib/admin/growth/hire-actions";
import { GROWTH_HIRE_TITLE, listGrowthHires } from "@/lib/admin/growth/hire";
import {
  addGrowthHireLead,
  addGrowthHireSchool,
  updateGrowthHireLead,
  updateGrowthHireSchool,
} from "@/lib/admin/growth/pipeline-actions";
import {
  HANDSHAKE_JOB_URL,
  HIRE_STAGES,
  listGrowthHireLeads,
  listGrowthHireSchools,
  messageLabel,
  schoolStatusLabel,
  stageLabel,
  type GrowthHireLead,
  type GrowthHireSchool,
} from "@/lib/admin/growth/pipeline";

export const dynamic = "force-dynamic";

const SCHOOLS_PER_PAGE = 10;

type Query = {
  ok?: string;
  error?: string;
  q?: string;
  schoolStatus?: string;
  schoolPage?: string;
  leadFilter?: string;
  leadSchool?: string;
};

function hrefFor(next: Partial<Query>, hash = "schools") {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return `/admin/hr/growth-hire${qs ? `?${qs}` : ""}#${hash}`;
}

function Metric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-emerald-100 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
    </div>
  );
}

function SchoolStatusBadge({ status }: { status: string }) {
  const approved = status === "approved";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${
        approved ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
      }`}
    >
      {schoolStatusLabel(status)}
    </span>
  );
}

function SchoolRow({
  school,
  query,
}: {
  school: GrowthHireSchool;
  query: Query;
}) {
  return (
    <tr className="border-b border-slate-50 last:border-0">
      <td className="py-3 pr-3 font-black text-slate-950">{school.schoolName}</td>
      <td className="py-3 pr-3">
        <SchoolStatusBadge status={school.handshakeStatus} />
      </td>
      <td className="py-3 pr-3 font-semibold text-slate-600">{school.applications}</td>
      <td className="py-3 pr-3 font-semibold text-slate-600">{school.comments}</td>
      <td className="py-3 text-right">
        <details className="relative inline-block text-left">
          <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600">
            <span className="sr-only">School actions</span>
            <span aria-hidden className="text-lg leading-none">
              ≡
            </span>
          </summary>
          <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-emerald-100 bg-white p-3 shadow-lg">
            <form action={updateGrowthHireSchool} className="grid gap-2">
              <input type="hidden" name="id" value={school.id} />
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                  Status
                </span>
                <select
                  name="handshakeStatus"
                  defaultValue={school.handshakeStatus}
                  className="mt-1 min-h-10 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                    Apps
                  </span>
                  <input
                    name="applications"
                    type="number"
                    min={0}
                    defaultValue={school.applications}
                    className="mt-1 min-h-10 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                    Comments
                  </span>
                  <input
                    name="comments"
                    type="number"
                    min={0}
                    defaultValue={school.comments}
                    className="mt-1 min-h-10 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                  Notes
                </span>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={school.notes}
                  className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 text-sm font-semibold"
                />
              </label>
              <input type="hidden" name="returnQ" value={query.q || ""} />
              <button
                type="submit"
                className="min-h-10 rounded-xl text-sm font-black text-white"
                style={{ background: "#0D5C3A" }}
              >
                Save school
              </button>
            </form>
          </div>
        </details>
      </td>
    </tr>
  );
}

function CandidateCard({ lead }: { lead: GrowthHireLead }) {
  return (
    <details className="rounded-2xl border border-slate-100 bg-slate-50">
      <summary className="flex cursor-pointer list-none flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-black text-slate-950">{lead.fullName}</p>
          <p className="text-xs font-semibold text-slate-500">
            {lead.school || "School TBD"}
            {lead.major ? ` · ${lead.major}` : ""}
            {lead.gradYear ? ` · ’${lead.gradYear}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
              lead.messageStatus === "messaged"
                ? "bg-sky-50 text-sky-800"
                : "bg-amber-50 text-amber-800"
            }`}
          >
            {messageLabel(lead.messageStatus)}
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
            {stageLabel(lead.stage)}
          </span>
          {lead.hasResume ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">
              Resume
            </span>
          ) : null}
        </div>
      </summary>
      <form action={updateGrowthHireLead} className="grid gap-3 border-t border-white p-4 sm:grid-cols-2">
        <input type="hidden" name="id" value={lead.id} />
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
            School
          </span>
          <input
            name="school"
            defaultValue={lead.school}
            className="mt-1 min-h-11 w-full rounded-xl border border-emerald-100 bg-white px-3 text-sm font-semibold"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
            Email
          </span>
          <input
            name="email"
            type="email"
            defaultValue={lead.email}
            placeholder="If Handshake shares one"
            className="mt-1 min-h-11 w-full rounded-xl border border-emerald-100 bg-white px-3 text-sm font-semibold"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
            Major
          </span>
          <input
            name="major"
            defaultValue={lead.major}
            className="mt-1 min-h-11 w-full rounded-xl border border-emerald-100 bg-white px-3 text-sm font-semibold"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
            Grad year
          </span>
          <input
            name="gradYear"
            defaultValue={lead.gradYear}
            className="mt-1 min-h-11 w-full rounded-xl border border-emerald-100 bg-white px-3 text-sm font-semibold"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
            Handshake message
          </span>
          <select
            name="messageStatus"
            defaultValue={lead.messageStatus}
            className="mt-1 min-h-11 w-full rounded-xl border border-emerald-100 bg-white px-3 text-sm font-semibold"
          >
            <option value="not_messaged">Not messaged</option>
            <option value="messaged">Messaged</option>
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
            Stage
          </span>
          <select
            name="stage"
            defaultValue={lead.stage}
            className="mt-1 min-h-11 w-full rounded-xl border border-emerald-100 bg-white px-3 text-sm font-semibold"
          >
            {HIRE_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stageLabel(stage)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
            Next follow-up
          </span>
          <input
            type="date"
            name="nextFollowUp"
            defaultValue={lead.nextFollowUp.slice(0, 10)}
            className="mt-1 min-h-11 w-full rounded-xl border border-emerald-100 bg-white px-3 text-sm font-semibold"
          />
        </label>
        <label className="flex items-end gap-2 pb-1">
          <input
            type="checkbox"
            name="hasResume"
            defaultChecked={lead.hasResume}
            className="h-4 w-4"
          />
          <span className="text-sm font-bold text-slate-700">
            Resume on file
            {lead.resumeFileName ? ` · ${lead.resumeFileName}` : ""}
          </span>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
            Notes
          </span>
          <textarea
            name="notes"
            rows={3}
            defaultValue={lead.notes}
            className="mt-1 w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm font-semibold"
          />
        </label>
        <button
          type="submit"
          className="min-h-11 rounded-xl text-sm font-black text-white sm:col-span-2"
          style={{ background: "#0D5C3A" }}
        >
          Save candidate
        </button>
      </form>
    </details>
  );
}

export default async function HrGrowthHirePage({
  searchParams,
}: {
  searchParams?: Promise<Query>;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canManageUsers) {
    return (
      <div className="mx-auto max-w-xl rounded-[1.75rem] border border-rose-100 bg-white p-6">
        <h1 className="text-2xl font-black text-slate-950">HR access required.</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Super Admins track Handshake schools and hire the Social & Community
          Manager from Human Resources.
        </p>
      </div>
    );
  }

  const query = (await searchParams) || {};
  const [hires, schools, leads] = await Promise.all([
    listGrowthHires(),
    listGrowthHireSchools(),
    listGrowthHireLeads(),
  ]);

  const schoolQuery = (query.q || "").toLowerCase();
  const schoolStatus = query.schoolStatus === "approved" || query.schoolStatus === "pending"
    ? query.schoolStatus
    : "";
  const filteredSchools = schools.filter((school) => {
    const matchesQuery = school.schoolName.toLowerCase().includes(schoolQuery);
    const matchesStatus = !schoolStatus || school.handshakeStatus === schoolStatus;
    return matchesQuery && matchesStatus;
  });
  const schoolPage = Math.max(1, Number(query.schoolPage || 1) || 1);
  const schoolPages = Math.max(1, Math.ceil(filteredSchools.length / SCHOOLS_PER_PAGE));
  const safeSchoolPage = Math.min(schoolPage, schoolPages);
  const pagedSchools = filteredSchools.slice(
    (safeSchoolPage - 1) * SCHOOLS_PER_PAGE,
    safeSchoolPage * SCHOOLS_PER_PAGE,
  );
  const approvedCount = schools.filter((s) => s.handshakeStatus === "approved").length;
  const pendingCount = schools.filter((s) => s.handshakeStatus === "pending").length;

  const leadFilter = query.leadFilter === "messaged" || query.leadFilter === "not_messaged"
    ? query.leadFilter
    : "";
  const leadSchool = query.leadSchool || "";
  const filteredLeads = leads.filter((lead) => {
    const matchesMessage = !leadFilter || lead.messageStatus === leadFilter;
    const matchesSchool = !leadSchool || lead.school === leadSchool;
    return matchesMessage && matchesSchool;
  });
  const messaged = leads.filter((lead) => lead.messageStatus === "messaged").length;
  const schoolNames = Array.from(new Set(leads.map((lead) => lead.school).filter(Boolean))).sort();

  const keep = {
    q: query.q,
    schoolStatus,
    leadFilter,
    leadSchool,
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <section
        className="public-dark-section rounded-[1.75rem] p-5 sm:p-7"
        data-brand-green
        style={{ background: "#0D5C3A" }}
      >
        <Link href="/admin/hr" className="text-xs font-black !text-white/80">
          ← Human Resources
        </Link>
        <h1 className="mt-3 text-3xl font-black !text-white sm:text-4xl">
          Social & Community hire
        </h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 !text-white/90">
          Handshake job live. Track requested schools, shortlisted candidates,
          and the 30-day contractor trial. Success is Pet Parent and Guru
          signups — not follower count.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={HANDSHAKE_JOB_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl bg-white/15 px-4 py-2 text-xs font-black !text-white"
          >
            Open Handshake job
          </a>
          <a
            href="#schools"
            className="rounded-2xl bg-white px-4 py-2 text-xs font-black text-[#0D5C3A]"
          >
            Requested schools
          </a>
          <a
            href="#candidates"
            className="rounded-2xl bg-white/15 px-4 py-2 text-xs font-black !text-white"
          >
            Candidates
          </a>
        </div>
      </section>

      {query.ok ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
          {query.ok}
        </p>
      ) : null}
      {query.error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
          {query.error}
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Shortlisted" value={String(leads.length)} helper="Handshake candidates" />
        <Metric label="Messaged" value={String(messaged)} helper="Outreach sent" />
        <Metric
          label="Not messaged"
          value={String(leads.length - messaged)}
          helper="Still to contact"
        />
        <Metric label="Schools approved" value={String(approvedCount)} helper="Handshake posted" />
        <Metric label="Schools pending" value={String(pendingCount)} helper="Waiting on career center" />
      </section>

      <section
        id="schools"
        className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
              Handshake
            </p>
            <h2 className="text-lg font-black text-slate-950">Requested schools</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              Your job has been shared with the following schools.
            </p>
          </div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            {filteredSchools.length} shown · {schools.length} total
          </p>
        </div>

        <form
          method="get"
          action="/admin/hr/growth-hire"
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <input type="hidden" name="leadFilter" value={leadFilter} />
          <input type="hidden" name="leadSchool" value={leadSchool} />
          <input
            name="q"
            defaultValue={query.q || ""}
            placeholder="Search for a school"
            className="min-h-12 flex-1 rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
          />
          <button
            type="submit"
            className="min-h-12 rounded-2xl px-5 text-sm font-black text-white"
            style={{ background: "#0D5C3A" }}
          >
            Search
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={hrefFor({ ...keep, schoolStatus: "", schoolPage: "" })}
            className={`rounded-full px-3 py-1.5 text-xs font-black ${
              !schoolStatus ? "bg-[#0D5C3A] text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            All ({schools.length})
          </Link>
          <Link
            href={hrefFor({ ...keep, schoolStatus: "pending", schoolPage: "" })}
            className={`rounded-full px-3 py-1.5 text-xs font-black ${
              schoolStatus === "pending"
                ? "bg-amber-100 text-amber-900"
                : "border border-amber-200 bg-white text-amber-800"
            }`}
          >
            Pending ({pendingCount})
          </Link>
          <Link
            href={hrefFor({ ...keep, schoolStatus: "approved", schoolPage: "" })}
            className={`rounded-full px-3 py-1.5 text-xs font-black ${
              schoolStatus === "approved"
                ? "bg-emerald-100 text-emerald-900"
                : "border border-emerald-200 bg-white text-emerald-800"
            }`}
          >
            Approved ({approvedCount})
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                <th className="pb-3 pr-3">School</th>
                <th className="pb-3 pr-3">Status</th>
                <th className="pb-3 pr-3">Applications</th>
                <th className="pb-3 pr-3">Comments</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedSchools.map((school) => (
                <SchoolRow key={school.id} school={school} query={query} />
              ))}
              {pagedSchools.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm font-semibold text-slate-500">
                    No schools match that filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            Page {safeSchoolPage} / {schoolPages}
          </p>
          <div className="flex gap-2">
            <Link
              href={hrefFor({
                ...keep,
                schoolPage: String(Math.max(1, safeSchoolPage - 1)),
              })}
              className={`min-h-10 rounded-xl border px-4 text-sm font-black leading-10 ${
                safeSchoolPage <= 1
                  ? "pointer-events-none border-slate-100 text-slate-300"
                  : "border-emerald-200 text-emerald-800"
              }`}
            >
              Previous
            </Link>
            <Link
              href={hrefFor({
                ...keep,
                schoolPage: String(Math.min(schoolPages, safeSchoolPage + 1)),
              })}
              className={`min-h-10 rounded-xl border px-4 text-sm font-black leading-10 ${
                safeSchoolPage >= schoolPages
                  ? "pointer-events-none border-slate-100 text-slate-300"
                  : "border-emerald-200 text-emerald-800"
              }`}
            >
              Next
            </Link>
          </div>
        </div>

        <form
          action={addGrowthHireSchool}
          className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-[1fr_160px_auto]"
        >
          <input
            name="schoolName"
            required
            placeholder="Add another school"
            className="min-h-12 rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
          />
          <select
            name="handshakeStatus"
            defaultValue="pending"
            className="min-h-12 rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>
          <button
            type="submit"
            className="min-h-12 rounded-2xl px-5 text-sm font-black text-white"
            style={{ background: "#0D5C3A" }}
          >
            Add school
          </button>
        </form>
      </section>

      <section
        id="candidates"
        className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
              Pipeline
            </p>
            <h2 className="text-lg font-black text-slate-950">Handshake candidates</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              5 messaged. 11 shortlisted and waiting. Open a row to update
              follow-up, stage, or notes.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={hrefFor({ ...keep, leadFilter: "", leadSchool: "" }, "candidates")}
            className={`rounded-full px-3 py-1.5 text-xs font-black ${
              !leadFilter && !leadSchool
                ? "bg-[#0D5C3A] text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            All ({leads.length})
          </Link>
          <Link
            href={hrefFor({ ...keep, leadFilter: "messaged" }, "candidates")}
            className={`rounded-full px-3 py-1.5 text-xs font-black ${
              leadFilter === "messaged"
                ? "bg-sky-100 text-sky-900"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            Messaged ({messaged})
          </Link>
          <Link
            href={hrefFor({ ...keep, leadFilter: "not_messaged" }, "candidates")}
            className={`rounded-full px-3 py-1.5 text-xs font-black ${
              leadFilter === "not_messaged"
                ? "bg-amber-100 text-amber-900"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            Not messaged ({leads.length - messaged})
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {schoolNames.map((name) => (
            <Link
              key={name}
              href={hrefFor({ ...keep, leadSchool: name }, "candidates")}
              className={`rounded-full px-3 py-1.5 text-xs font-black ${
                leadSchool === name
                  ? "bg-[#0D5C3A] text-white"
                  : "border border-slate-200 bg-white text-slate-700"
              }`}
            >
              {name}
            </Link>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {filteredLeads.map((lead) => (
            <CandidateCard key={lead.id} lead={lead} />
          ))}
          {filteredLeads.length === 0 ? (
            <p className="text-sm font-semibold text-slate-600">
              No candidates match that filter.
            </p>
          ) : null}
        </div>

        <form
          action={addGrowthHireLead}
          className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2"
        >
          <h3 className="text-sm font-black text-slate-950 sm:col-span-2">
            Add a Handshake candidate
          </h3>
          <input
            name="fullName"
            required
            placeholder="Full name"
            className="min-h-12 rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
          />
          <input
            name="school"
            placeholder="School"
            className="min-h-12 rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
          />
          <input
            name="major"
            placeholder="Major"
            className="min-h-12 rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
          />
          <input
            name="gradYear"
            placeholder="Grad year (26)"
            className="min-h-12 rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
          />
          <select
            name="messageStatus"
            defaultValue="not_messaged"
            className="min-h-12 rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
          >
            <option value="not_messaged">Not messaged</option>
            <option value="messaged">Messaged</option>
          </select>
          <select
            name="stage"
            defaultValue="shortlisted"
            className="min-h-12 rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
          >
            {HIRE_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stageLabel(stage)}
              </option>
            ))}
          </select>
          <textarea
            name="notes"
            rows={2}
            placeholder="Notes from Handshake or the resume"
            className="rounded-2xl border border-emerald-100 px-4 py-3 text-sm font-semibold sm:col-span-2"
          />
          <label className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" name="hasResume" className="h-4 w-4" />
            <span className="text-sm font-bold text-slate-700">Resume on file</span>
          </label>
          <button
            type="submit"
            className="min-h-12 rounded-2xl px-5 text-sm font-black text-white sm:col-span-2"
            style={{ background: "#0D5C3A" }}
          >
            Add candidate
          </button>
        </form>
      </section>

      <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Grant portal access</h2>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          After the paid test, hire the contractor here. If they already have a
          SitGuru login, we attach the role. Check Invite to email a new
          contractor into `/admin/growth`.
        </p>
        <form action={hireGrowthManager} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              Name
            </span>
            <input
              name="name"
              required
              placeholder="First and last name"
              className="mt-2 min-h-12 w-full rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              Work email
            </span>
            <input
              type="email"
              name="email"
              required
              placeholder="name@email.com"
              className="mt-2 min-h-12 w-full rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              Start date
            </span>
            <input
              type="date"
              name="startDate"
              className="mt-2 min-h-12 w-full rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              Location
            </span>
            <input
              name="location"
              defaultValue="Remote US"
              className="mt-2 min-h-12 w-full rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              Notes
            </span>
            <textarea
              name="notes"
              rows={3}
              defaultValue="30-day contractor trial. Measure Pet Parent and Guru signups, not followers."
              className="mt-2 w-full rounded-2xl border border-emerald-100 px-4 py-3 text-sm font-semibold"
            />
          </label>
          <label className="flex items-center gap-3 sm:col-span-2">
            <input type="checkbox" name="invite" defaultChecked className="h-4 w-4" />
            <span className="text-sm font-bold text-slate-700">
              Email an invite to the Growth Portal
            </span>
          </label>
          <button
            type="submit"
            className="min-h-12 rounded-2xl px-5 text-sm font-black text-white sm:col-span-2"
            style={{ background: "#0D5C3A" }}
          >
            Hire and open Growth Portal
          </button>
        </form>
      </section>

      <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black text-slate-950">{GROWTH_HIRE_TITLE}s</h2>
          <Link href="/admin/growth" className="text-sm font-black text-emerald-800">
            Open portal →
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {hires.map((hire) => (
            <div
              key={hire.id}
              className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-black text-slate-950">{hire.email}</p>
                <p className="text-xs font-semibold text-slate-500">
                  {hire.status}
                  {hire.assignedAt
                    ? ` · ${new Date(hire.assignedAt).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
              {hire.status === "active" ? (
                <form action={removeGrowthManager}>
                  <input type="hidden" name="email" value={hire.email} />
                  <button className="min-h-11 rounded-2xl border border-rose-200 px-4 text-sm font-black text-rose-800">
                    Remove access
                  </button>
                </form>
              ) : null}
            </div>
          ))}
          {hires.length === 0 ? (
            <p className="text-sm font-semibold text-slate-600">
              Nobody has this role yet. Hire from the form above when the
              contractor is ready.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
