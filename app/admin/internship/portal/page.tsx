import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  INTERNSHIP_ADMIN_PATH,
  internPortalPreviewPath,
} from "@/lib/internship/constants";
import { internStatusLabel, academicLevelLabel } from "@/lib/internship/labels";
import { getActiveCohort, listInterns } from "@/lib/internship/queries";

export const dynamic = "force-dynamic";

export default async function InternshipPortalAccessPage() {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) redirect("/admin/login");

  const cohort = await getActiveCohort();
  const interns = await listInterns(cohort?.id);

  if (interns.length === 1) {
    redirect(internPortalPreviewPath(interns[0].id));
  }

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 pb-8">
      <h1 className="text-3xl font-black text-slate-950">Intern Portal</h1>
      <p className="max-w-3xl text-sm font-semibold text-slate-600">
        Open the student Intern Portal from Employer HQ. You will see the intern’s
        Plan, Tasks, Campaigns, Metrics, and Review exactly as they do.
      </p>

      {interns.length ? (
        <section className="space-y-2">
          {interns.map((intern) => (
            <div
              key={intern.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white px-4 py-4 shadow-sm"
            >
              <div>
                <p className="font-black text-slate-950">{intern.fullName}</p>
                <p className="text-xs font-semibold text-slate-500">
                  {[
                    intern.studentId ? `ID ${intern.studentId}` : "",
                    intern.studentEmail || intern.email,
                    intern.phone,
                    intern.academicLevel ? academicLevelLabel(intern.academicLevel) : "",
                    internStatusLabel(intern.status),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={internPortalPreviewPath(intern.id)}
                  className="inline-flex min-h-11 items-center rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white"
                >
                  View intern portal
                </Link>
                <Link
                  href={`${INTERNSHIP_ADMIN_PATH}/interns/${intern.id}`}
                  className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 px-4 text-sm font-black text-emerald-900"
                >
                  Employer review
                </Link>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm font-semibold text-slate-500">
          Assign an intern first, then you can open their Intern Portal from here.
        </p>
      )}
    </main>
  );
}
