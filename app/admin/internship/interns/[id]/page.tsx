import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import InternshipGrowthWorkspace from "@/components/internship/InternshipGrowthWorkspace";
import InternAvatar from "@/components/internship/InternAvatar";
import InternshipKpiLetterBoard from "@/components/internship/InternshipKpiLetterBoard";
import InternKpiBoard from "@/components/internship/InternKpiBoard";
import {
  getInternWorkspace,
  listRequirements,
  matchRequirementForProgram,
  packetDocumentsForRequirement,
} from "@/lib/internship/queries";
import { saveInternAssignment } from "@/lib/internship/actions";
import { INTERNSHIP_PROGRAM_NAME, internPortalPreviewPath } from "@/lib/internship/constants";
import { academicLevelLabel } from "@/lib/internship/labels";
import { MARKET_GROWTH_PROJECT_NAME } from "@/lib/internship/playbook";
import { internOnboardingStatusLabel } from "@/lib/internship/onboarding";
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
      <div className="flex items-start gap-4">
        <InternAvatar
          name={workspace.intern.fullName}
          email={workspace.intern.email}
          src={workspace.intern.avatarUrl}
          size="lg"
          className="ring-emerald-100"
        />
        <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
          Employer review · {INTERNSHIP_PROGRAM_NAME}
        </p>
        <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
          {workspace.intern.fullName}
        </h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          {[
            workspace.intern.academicLevel
              ? academicLevelLabel(workspace.intern.academicLevel)
              : "",
            workspace.intern.studentId ? `Student ID ${workspace.intern.studentId}` : "",
            workspace.intern.studentEmail,
            workspace.intern.phone,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
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
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={internPortalPreviewPath(workspace.intern.id)}
            className="inline-flex min-h-11 items-center rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white"
          >
            View intern portal
          </Link>
        </div>
        </div>
      </div>

      <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5">
        <h2 className="font-black text-slate-950">Onboarding & confidentiality</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Portal tools stay locked until the intern electronically signs, uploads the
          one-page signed sheet, and submits it. intern@sitguru.com receives the file
          and the intern gets a confirmation email.
        </p>
        <p className="mt-3 text-sm font-black text-slate-950">
          Status: {internOnboardingStatusLabel(workspace.onboarding)}
        </p>
        {workspace.onboarding?.electronicSignedAt ? (
          <p className="mt-2 text-sm font-semibold text-slate-600">
            E-signed as {workspace.onboarding.typedLegalName} on{" "}
            {new Date(workspace.onboarding.electronicSignedAt).toLocaleString()} by{" "}
            {workspace.onboarding.signerEmail || "intern login"}.
          </p>
        ) : (
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Electronic signature has not been recorded.
          </p>
        )}
        {workspace.onboarding?.wetInkUploadedAt ? (
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Signed page uploaded {new Date(workspace.onboarding.wetInkUploadedAt).toLocaleString()}{" "}
            ({workspace.onboarding.wetInkFileName}).
          </p>
        ) : (
          <p className="mt-2 text-sm font-semibold text-slate-600">
            No wet-ink scan has been uploaded.
          </p>
        )}
        {workspace.onboarding?.wetInkSubmittedAt ? (
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Submitted {new Date(workspace.onboarding.wetInkSubmittedAt).toLocaleString()}
            {workspace.onboarding.wetInkEmailedAt
              ? " · confirmation emailed to the intern and intern@sitguru.com"
              : ""}
            .
          </p>
        ) : (
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Signed page has not been submitted yet.
          </p>
        )}
        {workspace.onboarding?.wetInkStoragePath ? (
          <a
            href={`/api/internship/onboarding/file?internId=${encodeURIComponent(workspace.intern.id)}`}
            className="mt-4 inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-900"
          >
            Open signed page
          </a>
        ) : null}
      </section>

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

      <InternKpiBoard internId={workspace.intern.id} capture />

      <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5">
        <h2 className="font-black text-slate-950">School header for this intern</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Program and course on the intern Canvas card. School logo and title are set on the
          university record after permission is granted.
        </p>
        <form action={saveInternAssignment} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="internId" value={workspace.intern.id} />
          <input
            name="academicProgram"
            defaultValue={workspace.intern.academicProgram}
            placeholder="Program"
            className="min-h-11 rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
          />
          <input
            name="courseCode"
            defaultValue={workspace.intern.courseCode}
            placeholder="Course code"
            className="min-h-11 rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
          />
          <input
            name="semester"
            defaultValue={workspace.intern.semester}
            placeholder="Semester"
            className="min-h-11 rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
          />
          <input
            name="academicLevel"
            defaultValue={workspace.intern.academicLevel}
            placeholder="Academic level"
            className="min-h-11 rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
          />
          <input
            name="credits"
            type="number"
            defaultValue={workspace.intern.credits ?? ""}
            placeholder="Credits"
            className="min-h-11 rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
          />
          <input
            name="requiredHours"
            type="number"
            defaultValue={workspace.intern.requiredHours ?? ""}
            placeholder="Required hours"
            className="min-h-11 rounded-xl border border-emerald-100 px-3 text-sm font-semibold"
          />
          <button className="min-h-11 rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white sm:col-span-2">
            Save school header program
          </button>
        </form>
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
