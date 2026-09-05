import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { saveUniversity } from "@/lib/internship/actions";
import {
  ACADEMIC_CREDIT_STATUSES,
  FUNDING_DIRECTORY_STATUSES,
  INTERNSHIP_ELIGIBILITY_STATUSES,
  UNIVERSITY_STATUSES,
} from "@/lib/internship/constants";
import {
  academicCreditLabel,
  eligibilityLabel,
  fundingStatusLabel,
  institutionRelationshipLabel,
  universityStatusLabel,
} from "@/lib/internship/labels";
import { listUniversities } from "@/lib/internship/queries";

export const dynamic = "force-dynamic";

type Search = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function InternshipUniversitiesPage({
  searchParams,
}: {
  searchParams?: Promise<Search>;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) redirect("/admin/login");

  const params = searchParams ? await searchParams : {};
  const filter = first(params.filter);
  const universities = await listUniversities({
    q: first(params.q),
    partnersOnly: filter === "partners",
    status: filter === "credit" ? "academic_credit_confirmed" : "",
  });

  const notice = first(params.ok)
    ? { kind: "ok" as const, message: first(params.ok) }
    : first(params.error)
      ? { kind: "error" as const, message: first(params.error) }
      : null;

  return (
    <main className="mx-auto max-w-6xl space-y-5 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/internship" className="text-xs font-black text-emerald-800">
            Internship Program
          </Link>
          <h1 className="mt-2 text-3xl font-black text-slate-950">University Directory</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-600">
            Add any eligible college. A Student Institution is where the intern attends.
            A University Partner is only a school with a real SitGuru relationship.
          </p>
        </div>
      </div>

      {notice ? (
        <p
          className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
            notice.kind === "ok" ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-800"
          }`}
        >
          {notice.message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {[
          ["", "All universities"],
          ["partners", "University Partners only"],
          ["credit", "Academic credit confirmed"],
        ].map(([value, label]) => (
          <Link
            key={label}
            href={value ? `/admin/internship/universities?filter=${value}` : "/admin/internship/universities"}
            className={`min-h-10 rounded-full px-4 text-xs font-black leading-10 ${
              filter === value
                ? "bg-[#0D5C3A] !text-white"
                : "border border-emerald-100 bg-white text-emerald-900"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7 space-y-2">
          {universities.map((university) => (
            <Link
              key={university.id}
              href={`/admin/internship/universities/${university.id}`}
              className="block rounded-2xl border border-emerald-100 bg-white px-4 py-4 shadow-sm hover:border-emerald-300"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-black text-slate-950">{university.displayName}</p>
                  <p className="text-xs font-semibold text-slate-500">
                    {university.city}
                    {university.state ? `, ${university.state}` : ""} · {university.region}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                    university.isUniversityPartner
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {institutionRelationshipLabel(university.isUniversityPartner)}
                </span>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-500">
                {universityStatusLabel(university.status)} · Credit{" "}
                {academicCreditLabel(university.academicCreditStatus)} · Eligibility{" "}
                {eligibilityLabel(university.internshipEligibilityStatus)} · Funding{" "}
                {fundingStatusLabel(university.fundingStatus)}
              </p>
            </Link>
          ))}
        </div>

        <form
          action={saveUniversity}
          className="xl:col-span-5 space-y-3 rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-black text-slate-950">Evaluate new university</h2>
          <p className="text-sm font-semibold text-slate-500">
            Record the school first. Do not invent credit hours, courses, or partnership.
          </p>
          <label className="block text-sm font-semibold">
            University name
            <input name="name" required className="mt-1 min-h-11 w-full rounded-xl border border-emerald-100 px-3" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input name="city" placeholder="City" className="min-h-11 rounded-xl border border-emerald-100 px-3 text-sm font-semibold" />
            <input name="state" placeholder="State" className="min-h-11 rounded-xl border border-emerald-100 px-3 text-sm font-semibold" />
          </div>
          <input name="region" placeholder="Region (Greater Philadelphia, Remote Eligible…)" className="min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold" />
          <input name="websiteUrl" placeholder="Source / career services URL" className="min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold" />
          <select name="status" defaultValue="research_needed" className="min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold">
            {UNIVERSITY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {universityStatusLabel(status)}
              </option>
            ))}
          </select>
          <select name="academicCreditStatus" defaultValue="unknown" className="min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold">
            {ACADEMIC_CREDIT_STATUSES.map((status) => (
              <option key={status} value={status}>
                Academic credit: {academicCreditLabel(status)}
              </option>
            ))}
          </select>
          <select name="internshipEligibilityStatus" defaultValue="unknown" className="min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold">
            {INTERNSHIP_ELIGIBILITY_STATUSES.map((status) => (
              <option key={status} value={status}>
                Eligibility: {eligibilityLabel(status)}
              </option>
            ))}
          </select>
          <select name="fundingStatus" defaultValue="unknown" className="min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold">
            {FUNDING_DIRECTORY_STATUSES.map((status) => (
              <option key={status} value={status}>
                Funding: {fundingStatusLabel(status)}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" name="isUniversityPartner" value="true" />
            Mark as University Partner (only if SitGuru has a real relationship)
          </label>
          <textarea name="notes" rows={3} placeholder="Research notes, last verified source…" className="w-full rounded-xl border border-emerald-100 px-3 py-2 text-sm font-semibold" />
          <button className="min-h-11 w-full rounded-2xl bg-[#0D5C3A] text-sm font-black !text-white">
            Save university
          </button>
        </form>
      </section>
    </main>
  );
}
