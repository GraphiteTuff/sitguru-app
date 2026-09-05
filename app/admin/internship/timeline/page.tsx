import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import InternshipTimelineBoard from "@/components/internship/InternshipTimelineBoard";
import { getActiveCohort, listCohortMilestones } from "@/lib/internship/queries";

export const dynamic = "force-dynamic";

export default async function InternshipTimelinePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) redirect("/admin/login");

  const cohort = await getActiveCohort();
  const milestones = cohort ? await listCohortMilestones(cohort.id) : [];
  const params = searchParams ? await searchParams : {};
  const ok = Array.isArray(params.ok) ? params.ok[0] : params.ok;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <main className="mx-auto max-w-6xl space-y-5 pb-8">
      <Link href="/admin/internship" className="text-xs font-black text-emerald-800">
        Internship Program
      </Link>
      <div>
        <h1 className="text-3xl font-black text-slate-950">
          Spring 2027 execution timeline
        </h1>
        <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-600">
          SitGuru dates are the employer calendar. University dates are labeled by
          student institution and are not copied onto other schools.
        </p>
      </div>
      {ok ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          {ok}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {error}
        </p>
      ) : null}
      {milestones.length ? (
        <InternshipTimelineBoard milestones={milestones} />
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm font-semibold text-slate-500">
          No cohort timeline yet.
        </p>
      )}
    </main>
  );
}
