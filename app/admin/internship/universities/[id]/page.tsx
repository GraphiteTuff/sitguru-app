import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  markUniversityVerified,
  saveAcademicRequirement,
  saveUniversity,
  saveUniversityContact,
} from "@/lib/internship/actions";
import {
  academicCreditLabel,
  eligibilityLabel,
  fundingStatusLabel,
  institutionRelationshipHint,
  institutionRelationshipLabel,
  universityStatusLabel,
} from "@/lib/internship/labels";
import {
  getUniversity,
  listCampuses,
  listContacts,
  listFunding,
  listRequirements,
} from "@/lib/internship/queries";
import {
  ACADEMIC_CREDIT_STATUSES,
  CONTACT_ROLES,
  FUNDING_DIRECTORY_STATUSES,
  INTERNSHIP_ELIGIBILITY_STATUSES,
  UNIVERSITY_STATUSES,
} from "@/lib/internship/constants";

export const dynamic = "force-dynamic";

export default async function InternshipUniversityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) redirect("/admin/login");

  const { id } = await params;
  const university = await getUniversity(id);
  if (!university) notFound();

  const [campuses, requirements, funding, contacts] = await Promise.all([
    listCampuses(id),
    listRequirements(id),
    listFunding(id),
    listContacts(id),
  ]);

  const resolved = searchParams ? await searchParams : {};
  const ok = Array.isArray(resolved.ok) ? resolved.ok[0] : resolved.ok;
  const error = Array.isArray(resolved.error) ? resolved.error[0] : resolved.error;

  return (
    <main className="mx-auto max-w-6xl space-y-5 pb-8">
      <Link href="/admin/internship/universities" className="text-xs font-black text-emerald-800">
        University directory
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-950">{university.displayName}</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            {institutionRelationshipLabel(university.isUniversityPartner)} —{" "}
            {institutionRelationshipHint(university.isUniversityPartner)}
          </p>
        </div>
        <form action={markUniversityVerified}>
          <input type="hidden" name="id" value={university.id} />
          <button className="min-h-11 rounded-2xl border border-emerald-200 px-4 text-sm font-black text-emerald-900">
            Mark verified
          </button>
        </form>
      </div>

      {ok ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{ok}</p> : null}
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</p> : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Academic credit" value={academicCreditLabel(university.academicCreditStatus)} />
        <Stat label="Internship eligibility" value={eligibilityLabel(university.internshipEligibilityStatus)} />
        <Stat label="Funding" value={fundingStatusLabel(university.fundingStatus)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <form action={saveUniversity} className="space-y-3 rounded-[1.5rem] border border-emerald-100 bg-white p-5">
          <h2 className="font-black text-slate-950">Institution record</h2>
          <input type="hidden" name="id" value={university.id} />
          <input type="hidden" name="slug" value={university.slug} />
          <input name="name" defaultValue={university.name} className="min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold" />
          <input name="displayName" defaultValue={university.displayName} className="min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold" />
          <div className="grid grid-cols-2 gap-2">
            <input name="city" defaultValue={university.city} className="min-h-11 rounded-xl border border-emerald-100 px-3 text-sm font-semibold" />
            <input name="state" defaultValue={university.state} className="min-h-11 rounded-xl border border-emerald-100 px-3 text-sm font-semibold" />
          </div>
          <select name="status" defaultValue={university.status} className="min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold">
            {UNIVERSITY_STATUSES.map((status) => (
              <option key={status} value={status}>{universityStatusLabel(status)}</option>
            ))}
          </select>
          <select name="academicCreditStatus" defaultValue={university.academicCreditStatus} className="min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold">
            {ACADEMIC_CREDIT_STATUSES.map((status) => (
              <option key={status} value={status}>Credit: {academicCreditLabel(status)}</option>
            ))}
          </select>
          <select name="internshipEligibilityStatus" defaultValue={university.internshipEligibilityStatus} className="min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold">
            {INTERNSHIP_ELIGIBILITY_STATUSES.map((status) => (
              <option key={status} value={status}>Eligibility: {eligibilityLabel(status)}</option>
            ))}
          </select>
          <select name="fundingStatus" defaultValue={university.fundingStatus} className="min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold">
            {FUNDING_DIRECTORY_STATUSES.map((status) => (
              <option key={status} value={status}>Funding: {fundingStatusLabel(status)}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="isUniversityPartner" value="true" defaultChecked={university.isUniversityPartner} />
            University Partner
          </label>
          <textarea name="partnerNotes" defaultValue={university.partnerNotes} placeholder="Agreement, faculty relationship, or recruiting pipeline notes" className="w-full rounded-xl border border-emerald-100 px-3 py-2 text-sm font-semibold" />
          <input name="sourceUrl" defaultValue={university.sourceUrl} placeholder="Source URL" className="min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold" />
          <button className="min-h-11 rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white">Save institution</button>
        </form>

        <div className="space-y-4">
          <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5">
            <h2 className="font-black text-slate-950">Known academic requirements</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Program-level, not university-wide. Do not invent missing rules.
            </p>
            <div className="mt-3 space-y-2">
              {requirements.length ? (
                requirements.map((row) => (
                  <div key={row.id} className="rounded-2xl border border-slate-100 p-3 text-sm font-semibold text-slate-600">
                    <p className="font-black text-slate-950">
                      {row.academicProgram || "Program"} {row.courseCode ? `· ${row.courseCode}` : ""}
                    </p>
                    <p>
                      {row.creditHours != null ? `${row.creditHours} credits` : "Credits unknown"} ·{" "}
                      {row.minimumInternshipHours != null
                        ? `${row.minimumInternshipHours} hours`
                        : "Hours unknown"}
                    </p>
                    <p className="text-xs text-slate-400">{row.status} {row.sourceUrl}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm font-semibold text-amber-800">
                  University requirements have not yet been verified.
                </p>
              )}
            </div>
            <form action={saveAcademicRequirement} className="mt-4 grid gap-2">
              <input type="hidden" name="universityId" value={university.id} />
              {campuses.length ? (
                <select name="campusId" className="min-h-11 rounded-xl border border-emerald-100 px-3 text-sm font-semibold">
                  <option value="">All campuses</option>
                  {campuses.map((campus) => (
                    <option key={campus.id} value={campus.id}>{campus.displayName}</option>
                  ))}
                </select>
              ) : null}
              <input name="academicProgram" placeholder="Major / program" className="min-h-11 rounded-xl border border-emerald-100 px-3 text-sm font-semibold" />
              <div className="grid grid-cols-2 gap-2">
                <input name="courseCode" placeholder="Course code" className="min-h-11 rounded-xl border border-emerald-100 px-3 text-sm font-semibold" />
                <input name="creditHours" placeholder="Credits" type="number" className="min-h-11 rounded-xl border border-emerald-100 px-3 text-sm font-semibold" />
              </div>
              <input name="minimumInternshipHours" placeholder="Required hours" type="number" className="min-h-11 rounded-xl border border-emerald-100 px-3 text-sm font-semibold" />
              <input name="sourceUrl" placeholder="Source URL" className="min-h-11 rounded-xl border border-emerald-100 px-3 text-sm font-semibold" />
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                {[
                  ["requiresFacultySupervisor", "Faculty supervisor"],
                  ["requiresLearningAgreement", "Learning agreement"],
                  ["requiresOfferLetter", "Offer letter"],
                  ["requiresMidpointEvaluation", "Midpoint evaluation"],
                  ["requiresFinalEvaluation", "Final evaluation"],
                  ["requiresTimesheet", "Timesheet"],
                  ["requiresFinalReport", "Final report"],
                ].map(([name, label]) => (
                  <label key={name} className="flex items-center gap-2">
                    <input type="checkbox" name={name} />
                    {label}
                  </label>
                ))}
              </div>
              <button className="min-h-11 rounded-2xl bg-[#0D5C3A] text-sm font-black !text-white">
                Save verified requirement
              </button>
            </form>
          </section>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-5">
          <h2 className="font-black text-slate-950">Funding opportunities</h2>
          {funding.length ? (
            funding.map((row) => (
              <p key={String(row.id)} className="mt-2 text-sm font-semibold text-slate-600">
                {String(row.fund_name)} · {String(row.status)}
              </p>
            ))
          ) : (
            <p className="mt-2 text-sm font-semibold text-slate-500">
              None found. Do not assume every university provides internship funding.
            </p>
          )}
        </div>
        <form action={saveUniversityContact} className="space-y-3 rounded-[1.5rem] border border-emerald-100 bg-white p-5">
          <h2 className="font-black text-slate-950">University contacts</h2>
          {contacts.map((row) => (
            <p key={String(row.id)} className="text-sm font-semibold text-slate-600">
              {String(row.full_name || "Unnamed")} · {String(row.role_key)} · {String(row.email || "")}
            </p>
          ))}
          <input type="hidden" name="universityId" value={university.id} />
          <input name="fullName" placeholder="Name" className="min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold" />
          <select name="roleKey" className="min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold">
            {CONTACT_ROLES.map((role) => (
              <option key={role} value={role}>{role.replaceAll("_", " ")}</option>
            ))}
          </select>
          <input name="email" placeholder="Email" className="min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold" />
          <textarea name="notes" placeholder="Correspondence notes" className="w-full rounded-xl border border-emerald-100 px-3 py-2 text-sm font-semibold" />
          <button className="min-h-11 rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white">Save contact</button>
        </form>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-emerald-100 bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}
