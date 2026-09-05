import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminIdentity } from "@/lib/admin/access";
import InternshipGrowthWorkspace from "@/components/internship/InternshipGrowthWorkspace";
import InternshipBackToProgram from "@/components/internship/InternshipBackToProgram";
import { INTERNSHIP_ADMIN_PATH, INTERNSHIP_PROGRAM_NAME } from "@/lib/internship/constants";
import {
  findInternByAccount,
  findInternById,
  getInternWorkspace,
  linkInternUserId,
} from "@/lib/internship/queries";
import { MARKET_GROWTH_PROJECT_NAME } from "@/lib/internship/playbook";
import { buildInternshipProcess } from "@/lib/internship/process";
import Link from "next/link";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function InternPortalPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const params = searchParams ? await searchParams : {};
  const viewId = first(params.view);
  const ok = first(params.ok);
  const error = first(params.error);

  if (!user) redirect("/intern/login");

  const admin = await getAdminIdentity();
  const ownIntern = await findInternByAccount({
    userId: user.id,
    email: user.email,
  });

  const preview = Boolean(viewId && admin?.canAccessAdmin);
  const intern = preview ? await findInternById(viewId) : ownIntern;

  if (!intern) {
    if (admin?.canAccessAdmin) redirect(`${INTERNSHIP_ADMIN_PATH}/portal`);
    redirect("/intern/login?error=This account is not assigned to the SitGuru Internship Program.");
  }

  if (!preview && !intern.userId) {
    await linkInternUserId(intern.id, user.id);
  }

  const workspace = await getInternWorkspace(intern.id);
  if (!workspace) redirect("/intern/login");
  const process = buildInternshipProcess(workspace);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:pb-10">
      {preview ? (
        <section className="space-y-3">
          <InternshipBackToProgram />
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-950">
              Employer HQ preview of {workspace.intern.fullName}’s Intern Portal.
              This is the student view. Grade and approve from Employer review.
            </p>
            <Link
              href={`${INTERNSHIP_ADMIN_PATH}/interns/${intern.id}`}
              className="inline-flex min-h-11 items-center rounded-2xl bg-[#0D5C3A] px-4 text-xs font-black !text-white"
            >
              Employer review
            </Link>
          </div>
        </section>
      ) : null}
      <section
        className="public-dark-section rounded-[1.75rem] p-5 sm:p-7"
        data-brand-green
        style={{ background: "#0D5C3A" }}
      >
        <p className="text-xs font-black uppercase tracking-[0.24em] !text-white">
          Intern portal
        </p>
        <h1 className="mt-3 text-2xl font-black !text-white sm:text-3xl">{INTERNSHIP_PROGRAM_NAME}</h1>
        <p className="mt-2 text-sm font-semibold !text-white/90">
          {MARKET_GROWTH_PROJECT_NAME}. Week {process.weekNumber}: {process.deliverable.title}.
          Tasks, SMART goals, experiments, and metrics sync live with Employer HQ.
        </p>
      </section>
      <InternshipGrowthWorkspace
        data={workspace}
        mode="intern"
        preview={preview}
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
