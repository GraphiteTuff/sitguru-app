import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminIdentity } from "@/lib/admin/access";
import InternshipGrowthWorkspace from "@/components/internship/InternshipGrowthWorkspace";
import { INTERNSHIP_PROGRAM_NAME } from "@/lib/internship/constants";
import {
  findInternByAccount,
  getInternWorkspace,
  linkInternUserId,
} from "@/lib/internship/queries";
import { MARKET_GROWTH_PROJECT_NAME } from "@/lib/internship/playbook";
import { buildInternshipProcess } from "@/lib/internship/process";

export const dynamic = "force-dynamic";

export default async function InternPortalPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/intern/login");

  const intern = await findInternByAccount({
    userId: user.id,
    email: user.email,
  });

  if (!intern) {
    const admin = await getAdminIdentity();
    if (admin?.canAccessAdmin) redirect("/admin/internship");
    redirect("/intern/login?error=This account is not assigned to the SitGuru Internship Program.");
  }

  if (!intern.userId) {
    await linkInternUserId(intern.id, user.id);
  }

  const workspace = await getInternWorkspace(intern.id);
  if (!workspace) redirect("/intern/login");
  const process = buildInternshipProcess(workspace);

  const params = searchParams ? await searchParams : {};
  const ok = Array.isArray(params.ok) ? params.ok[0] : params.ok;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:pb-10">
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
