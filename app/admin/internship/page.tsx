import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { canAdministerInternshipOnboarding } from "@/lib/internship/manager-access";
import { getActiveCohort, getCohortDashboard, listCohortMilestones } from "@/lib/internship/queries";
import { formatCohortHeadline } from "@/lib/internship/labels";
import { INTERNSHIP_PROGRAM_NAME } from "@/lib/internship/constants";
import InternshipProgramCommandCenter from "@/components/internship/InternshipProgramCommandCenter";

export const dynamic = "force-dynamic";

export default async function InternshipProgramDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) redirect("/admin/login?next=/admin/internship");

  const params = searchParams ? await searchParams : {};
  const notice = Array.isArray(params.ok) ? params.ok[0] : params.ok || "";
  const noticeError = Array.isArray(params.error) ? params.error[0] : params.error || "";

  const cohort = await getActiveCohort();
  const dashboard = cohort ? await getCohortDashboard(cohort.id) : null;
  const milestones = cohort ? await listCohortMilestones(cohort.id) : [];

  return (
    <InternshipProgramCommandCenter
      canAdminister={canAdministerInternshipOnboarding(actor)}
      cohortName={formatCohortHeadline(cohort || { name: INTERNSHIP_PROGRAM_NAME })}
      cohortId={cohort?.id || null}
      startsOn={cohort?.startsOn || null}
      endsOn={cohort?.endsOn || null}
      milestones={milestones}
      projects={dashboard?.projects || []}
      universities={dashboard?.universities || []}
      notice={notice}
      noticeError={noticeError}
    />
  );
}
