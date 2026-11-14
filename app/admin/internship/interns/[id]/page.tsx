import Link from "next/link";
import { ArrowLeft, ArrowUpRight, GraduationCap } from "lucide-react";
import InternDetailSections from "@/components/internship/InternDetailSections";
import { notFound, redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import InternshipGrowthWorkspace from "@/components/internship/InternshipGrowthWorkspace";
import InternAvatar from "@/components/internship/InternAvatar";
import InternshipKpiLetterBoard from "@/components/internship/InternshipKpiLetterBoard";
import InternKpiBoard from "@/components/internship/InternKpiBoard";
import InternshipAssignmentReview from "@/components/internship/InternshipAssignmentReview";
import { findBaselineGrowthBriefTask } from "@/lib/internship/baseline-brief";
import {
  getInternWorkspace,
  listRequirements,
  matchRequirementForProgram,
  packetDocumentsForRequirement,
} from "@/lib/internship/queries";
import { saveInternAssignment } from "@/lib/internship/actions";
import { INTERNSHIP_PROGRAM_NAME, internPortalPreviewPath } from "@/lib/internship/constants";
import { academicLevelLabel } from "@/lib/internship/labels";
import { internOnboardingStatusLabel } from "@/lib/internship/onboarding";
import { buildInternshipProcess } from "@/lib/internship/process";
import { canAdministerInternshipOnboarding } from "@/lib/internship/manager-access";
import {
  activationLabel,
  activeStatusNeedsReview,
  employerDecision,
  employerDecisionLabel,
  nextApprovalAction,
  onboardingStage,
  onboardingStageLabel,
  universityDecisionLabel,
} from "@/lib/internship/approval-workflow";
import { InternshipApprovalButtons } from "@/components/internship/InternshipApprovalControls";

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
  const stage = onboardingStage(workspace.onboarding);
  const today = new Date().toISOString().slice(0, 10);
  const reviewNote = activeStatusNeedsReview({
    status: workspace.intern.status,
    universityStatus: workspace.intern.universityVerificationStatus,
    onboardingComplete: stage === "fully_executed",
    startDate: workspace.intern.academicStartDate || workspace.cohort?.startsOn || null,
    today,
  });
  const approvalCard = {
    recordId: workspace.intern.id,
    name: workspace.intern.fullName,
    university: workspace.university?.displayName || workspace.university?.name || "University pending",
    position: workspace.intern.internshipTitle || "Social Media & Community Growth Intern",
    cohort: workspace.cohort?.name || INTERNSHIP_PROGRAM_NAME,
    dates: `${workspace.cohort?.startsOn || "Start date pending"} to ${workspace.cohort?.endsOn || "end date pending"}`,
    credits: workspace.intern.credits == null ? "Credits pending" : `${workspace.intern.credits} planned credits`,
    hours: workspace.intern.requiredHours == null ? "Hours pending" : `${workspace.intern.requiredHours} required hours`,
    schedule: `${workspace.intern.plannedWeeklyHours || "—"} hours/week · ${workspace.intern.internshipWeeks || "—"} weeks`,
    manager: workspace.intern.managerName || "Ava Venezia",
    supervisor: workspace.intern.supervisorName || "Founder/Admin",
    employer: employerDecisionLabel(workspace.intern.approvalStatus),
    employerPending: employerDecision(workspace.intern.approvalStatus) === "pending",
    universityStatus: universityDecisionLabel(workspace.intern.universityVerificationStatus),
    onboarding: onboardingStageLabel(stage),
    activation: activationLabel({ status: workspace.intern.status, reviewNote }),
    nextAction: nextApprovalAction({
      approvalStatus: workspace.intern.approvalStatus,
      universityStatus: workspace.intern.universityVerificationStatus,
      onboardingStage: stage,
      status: workspace.intern.status,
    }),
  };

  const paramsIn = searchParams ? await searchParams : {};
  const ok = Array.isArray(paramsIn.ok) ? paramsIn.ok[0] : paramsIn.ok;
  const error = Array.isArray(paramsIn.error) ? paramsIn.error[0] : paramsIn.error;


  return (
    <main className="admin-desk-surface mx-auto w-full max-w-7xl min-w-0 space-y-5 px-3 pb-24 sm:px-5 lg:px-6">
      <nav aria-label="Intern record navigation" className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/admin/internship/interns" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#DBEAFE] bg-white px-4 text-xs font-black text-[#0F2744] hover:bg-[#EFF6FF]">
          <ArrowLeft size={15} aria-hidden="true" /> Back to intern team
        </Link>
        <Link href="/admin/internship/playbook" className="inline-flex min-h-10 items-center gap-2 text-xs font-black text-[#2563EB] hover:underline">
          <GraduationCap size={16} aria-hidden="true" /> Program syllabus
        </Link>
      </nav>

      <section id="profile" aria-label="Intern overview" className="scroll-mt-24 overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,39,68,0.05)] sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex min-w-0 items-start gap-4">
            <InternAvatar name={workspace.intern.fullName} email={workspace.intern.email} src={workspace.intern.avatarUrl} size="lg" className="ring-[#DBEAFE]" />
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#0D5C3A]">{workspace.cohort?.name || "Internship"} · Intern record</p>
              <h1 className="mt-1 break-words text-2xl font-black tracking-tight !text-[#0F2744] sm:text-3xl">{workspace.intern.fullName}</h1>
              <p className="mt-1 text-sm font-bold text-[#0F2744]">{workspace.university?.displayName || workspace.university?.name || "University pending"}</p>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                {[workspace.intern.academicProgram, workspace.intern.courseCode, workspace.intern.academicLevel ? academicLevelLabel(workspace.intern.academicLevel) : ""].filter(Boolean).join(" · ")}
              </p>
              <p className="mt-1 break-all text-xs font-medium text-slate-500">{workspace.intern.studentEmail || workspace.intern.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-2 lg:flex-col lg:items-stretch">
            <Link href={internPortalPreviewPath(workspace.intern.id)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-sm font-black !text-white hover:bg-[#1D4ED8]">
              Open intern portal <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/admin/internship/time" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#0F2744] hover:bg-[#F4F7FB]">
              Review hours
            </Link>
          </div>
        </div>
        <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
          <div className="rounded-xl bg-[#EFF6FF] px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#1D4ED8]">Employer decision</p>
            <p className="mt-1 text-sm font-black text-[#0F2744]">{approvalCard.employer}</p>
          </div>
          <div className="rounded-xl bg-[#F0FDF4] px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#166534]">University</p>
            <p className="mt-1 text-sm font-black text-[#0F2744]">{approvalCard.universityStatus}</p>
          </div>
          <div className="rounded-xl bg-[#F5F3FF] px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#6D28D9]">Current project stage</p>
            <p className="mt-1 text-sm font-black text-[#0F2744]">Week {process.weekNumber} · {process.deliverable.title}</p>
          </div>
        </div>
      </section>

      {ok ? <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{ok}</p> : null}
      {error ? <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">{error}</p> : null}

      <InternDetailSections sections={{
        overview: (
          <div className="space-y-4">
            <section id="approvals" className="scroll-mt-24 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,39,68,0.05)] sm:p-6">
        <h2 className="text-lg font-black text-slate-950">Status & approvals</h2>
        <p className="mt-3 rounded-2xl border border-[#DBEAFE] bg-[#EFF6FF] px-4 py-3 text-sm font-semibold leading-6 text-[#0F2744]"><span className="mr-2 font-black text-[#1D4ED8]">Next step:</span>{approvalCard.nextAction}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          {[
            ["Employer acceptance", approvalCard.employer],
            ["University approval", approvalCard.universityStatus],
            ["Onboarding", approvalCard.onboarding],
            ["Program activation", approvalCard.activation],
          ].map(([label, value]) => (
            <article key={label} className="rounded-2xl border border-slate-100 bg-[#F4F7FB] p-3">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
              <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
            </article>
          ))}
        </div>
        {reviewNote ? <p className="mt-3 text-sm font-semibold text-amber-800">{reviewNote}</p> : null}
        {canAdministerInternshipOnboarding(actor) ? <InternshipApprovalButtons card={approvalCard} /> : null}
      </section>
            <section className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        {[
          ["Pending approvals", String(process.pendingApprovals)],
          ["Unverified metrics", String(process.unverifiedMetrics)],
          ["SMART goals", String(process.smartGoalCount)],
          ["Experiments", String(process.experimentCount)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-[#F4F7FB] px-4 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">
              {label}
            </p>
            <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
          </div>
        ))}
      </section>
          </div>
        ),
        work: (
          <div className="space-y-4">
            {findBaselineGrowthBriefTask(workspace.tasks) ? (
        <section className="space-y-3">
          <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-5">
            <h2 className="font-black text-slate-950">Baseline & Growth Brief review</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Files and structured sections live here so you do not hunt tabs. Hours approval stays
              separate from this deliverable and from KPI verification.
            </p>
          </div>
          {workspace.tasks
            .filter((task) => findBaselineGrowthBriefTask([task]))
            .map((task) => (
              <InternshipAssignmentReview
                key={`brief-${task.id}`}
                internId={workspace.intern.id}
                mode="supervisor"
                itemType="task"
                id={task.id}
                title={task.title}
                status={task.status}
                workUrl={task.workUrl}
                studentNotes={task.studentNotes}
                supervisorNotes={task.supervisorNotes}
                employerLetter={task.employerLetter}
                kpiTier={task.kpiTier}
                comments={workspace.comments || []}
                attachments={workspace.attachments || []}
                intern={workspace.intern}
                task={task}
                metrics={workspace.metrics || []}
                smartGoals={workspace.smartGoals || []}
                experiments={workspace.experiments || []}
              />
            ))}
        </section>
      ) : null}
            <InternshipGrowthWorkspace
        data={workspace}
        mode="supervisor"
        embeddedInRecord
        initialTab="tasks"
        
      />
          </div>
        ),
        results: (
          <div className="space-y-4">
            <InternKpiBoard internId={workspace.intern.id} capture />
            <details className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <summary className="min-h-10 cursor-pointer text-sm font-black text-[#0F2744]">Employer KPI letter grades & rubric</summary>
              <p className="mb-4 mt-2 text-xs font-medium text-slate-600">Additional evaluation detail; actual academic grades remain with the university.</p>
              <InternshipKpiLetterBoard data={workspace} />
            </details>
          </div>
        ),
        academic: (
          <div className="space-y-4">
            <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5">
        <h2 className="font-black text-slate-950">School header for this intern</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Program and course on the intern Canvas card. School logo and title are set on the
          university record after permission is granted.
        </p>
        <details className="mt-4 group rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between text-sm font-black text-[#0F2744] marker:hidden">Edit academic plan & school information <span className="text-[#2563EB] group-open:rotate-180">⌄</span></summary>
          <p className="mt-2 text-xs font-medium text-slate-600">These academic fields are specific to this student. Confirm credits and required hours with the university before saving.</p>
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
        </details>
      </section>

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
          </div>
        ),
        onboarding: (
          <div className="space-y-4">
            <section id="onboarding" className="scroll-mt-24 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,39,68,0.05)] sm:p-6">
        <h2 className="font-black text-slate-950">Onboarding & confidentiality</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Portal tools stay locked until onboarding status is fully executed: access
          rules, electronic signature, signed-page upload with file hash, submit, and
          the current agreement version. intern@sitguru.com receives the signed page.
          The intern gets a confirmation email only — not a copy of the signed file.
        </p>
        <p className="mt-3 text-sm font-black text-slate-950">
          Status: {internOnboardingStatusLabel(workspace.onboarding)}
          {workspace.onboarding?.onboardingStatus
            ? ` · ${workspace.onboarding.onboardingStatus}`
            : ""}
        </p>
        {workspace.onboarding?.policyVersion ? (
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Agreement {workspace.onboarding.policyVersion}
            {workspace.onboarding.internNameSnapshot
              ? ` · ${workspace.onboarding.internNameSnapshot}`
              : ""}
            {workspace.onboarding.internUniversitySnapshot
              ? ` · ${workspace.onboarding.internUniversitySnapshot}`
              : ""}
            {workspace.onboarding.internProgramSnapshot
              ? ` · ${workspace.onboarding.internProgramSnapshot}`
              : ""}
          </p>
        ) : null}
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
            ({workspace.onboarding.wetInkFileName}
            {workspace.onboarding.wetInkFileHash
              ? ` · SHA-256 ${workspace.onboarding.wetInkFileHash.slice(0, 12)}…`
              : ""}
            ).
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
              ? " · intern confirmation emailed; signed page kept in SitGuru storage and emailed to intern@sitguru.com"
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
          </div>
        ),
      }} />
    </main>
  );
}
