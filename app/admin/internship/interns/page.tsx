import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { saveIntern } from "@/lib/internship/actions";
import { internStatusLabel } from "@/lib/internship/labels";
import {
  getActiveCohort,
  listInterns,
  listPathTypes,
  listUniversities,
} from "@/lib/internship/queries";
import InternshipRequirementChecker from "@/components/internship/InternshipRequirementChecker";

export const dynamic = "force-dynamic";

export default async function InternshipInternsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) redirect("/admin/login");

  const cohort = await getActiveCohort();
  const [interns, universities, pathTypes] = await Promise.all([
    listInterns(cohort?.id),
    listUniversities(),
    listPathTypes(),
  ]);
  const params = searchParams ? await searchParams : {};
  const ok = Array.isArray(params.ok) ? params.ok[0] : params.ok;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <main className="mx-auto max-w-6xl space-y-5 pb-8">
      <Link href="/admin/internship" className="text-xs font-black text-emerald-800">
        Internship Program
      </Link>
      <h1 className="text-3xl font-black text-slate-950">Interns</h1>
      <p className="max-w-3xl text-sm font-semibold text-slate-600">
        Each intern keeps a frozen academic profile for their own university. Do not
        copy one school’s hours or evaluations onto another student.
      </p>
      {ok ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{ok}</p> : null}
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</p> : null}

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-6 space-y-2">
          {interns.map((intern) => (
            <Link
              key={intern.id}
              href={`/admin/internship/interns/${intern.id}`}
              className="block rounded-2xl border border-emerald-100 bg-white px-4 py-4 shadow-sm"
            >
              <p className="font-black text-slate-950">{intern.fullName}</p>
              <p className="text-xs font-semibold text-slate-500">
                {intern.email} · {internStatusLabel(intern.status)} ·{" "}
                {intern.requiredHours != null ? `${intern.requiredHours} hours` : "hours unverified"}
              </p>
            </Link>
          ))}
        </div>

        <form action={saveIntern} className="xl:col-span-6 space-y-3 rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="font-black text-slate-950">Assign intern</h2>
          {!cohort ? (
            <p className="text-sm font-semibold text-rose-700">Create a cohort before assigning interns.</p>
          ) : (
            <input type="hidden" name="cohortId" value={cohort.id} />
          )}
          <input name="fullName" required placeholder="Student name" className="min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold" />
          <input name="email" type="email" required placeholder="Student email" className="min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold" />
          <InternshipRequirementChecker universities={universities} />
          <select name="pathType" className="min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold">
            {pathTypes.map((path) => (
              <option key={path.slug} value={path.slug}>{path.name}</option>
            ))}
          </select>
          <input name="semester" defaultValue={cohort ? `${cohort.season} ${cohort.year}` : ""} className="min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold" />
          <input name="facultySupervisor" placeholder="Faculty supervisor" className="min-h-11 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold" />
          <button disabled={!cohort} className="min-h-11 w-full rounded-2xl bg-[#0D5C3A] text-sm font-black !text-white disabled:opacity-50">
            Freeze requirements and add intern
          </button>
        </form>
      </section>
    </main>
  );
}
