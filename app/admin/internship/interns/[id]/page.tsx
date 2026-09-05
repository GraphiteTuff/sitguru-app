import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import InternshipGrowthWorkspace from "@/components/internship/InternshipGrowthWorkspace";
import InternshipKpiLetterBoard from "@/components/internship/InternshipKpiLetterBoard";
import {
  getInternWorkspace,
  listRequirements,
  matchRequirementForProgram,
  packetDocumentsForRequirement,
} from "@/lib/internship/queries";
import { INTERNSHIP_PROGRAM_NAME } from "@/lib/internship/constants";
import { MARKET_GROWTH_PROJECT_NAME } from "@/lib/internship/playbook";
import { buildInternshipProcess } from "@/lib/internship/process";

export const dynamic = "force-dynamic";

export default async function InternshipInternDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) redirect("/admin/login");

  const { id } = await params;
  const workspace = await getInternWorkspace(id);
  if (!workspace) notFound();

  const requirements = await listRequirements(workspace.intern.universityId);
  const requirement = matchRequirementForProgram(
    requirements,
    workspace.intern.academicProgram,
  );
  const packet = packetDocumentsForRequirement(requirement);

  const process = buildInternshipProcess(workspace);

  const paramsIn = searchParams ? await searchParams : {};
  const ok = Array.isArray(paramsIn.ok) ? paramsIn.ok[0] : paramsIn.ok;
  const error = Array.isArray(paramsIn.error) ? paramsIn.error[0] : paramsIn.error;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 px-4 pb-8">
      <Link href="/admin/internship/interns" className="text-xs font-black text-emerald-800">
        Interns
      </Link>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
          Employer review · {INTERNSHIP_PROGRAM_NAME}
        </p>
        <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
          {workspace.intern.fullName}
        </h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          {MARKET_GROWTH_PROJECT_NAME} · Week {process.weekNumber}: {process.deliverable.title}.
          Same Plan, Tasks, Campaigns, Metrics, and Review the intern sees at /intern.
        </p>
        <p className="mt-2 text-xs font-semibold text-slate-500">
          Intern signs in at{" "}
          <Link href="/intern/login" className="font-black text-emerald-800 underline">
            /intern/login
          </Link>{" "}
          with {workspace.intern.email}. Assignments and approvals sync both ways.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Pending approvals", String(process.pendingApprovals)],
          ["Unverified metrics", String(process.unverifiedMetrics)],
          ["SMART goals", String(process.smartGoalCount)],
          ["Experiments", String(process.experimentCount)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-emerald-100 bg-white px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">
              {label}
            </p>
            <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <InternshipKpiLetterBoard data={workspace} />

      <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5">
        <h2 className="font-black text-slate-950">University packet</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Only documents required by this student’s institution are included.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {packet.map((doc) => (
            <li key={doc.slug} className="rounded-xl border border-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
              {doc.name}
              {doc.required ? " · required" : ""}
            </li>
          ))}
        </ul>
      </section>

      <InternshipGrowthWorkspace
        data={workspace}
        mode="supervisor"
        notice={
          ok
            ? { kind: "ok", message: ok }
            : error
              ? { kind: "error", message: error }
              : null
        }
      />
    </main>
  );
}
