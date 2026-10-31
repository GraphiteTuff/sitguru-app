import { AdminWorkplaceDenied } from "@/components/admin/growth/GrowthPageFrame";
import SpringProgramDashboard from "@/components/admin/hr/SpringProgramDashboard";
import { getAdminIdentity } from "@/lib/admin/access";
import { canAdministerInternshipOnboarding } from "@/lib/internship/manager-access";

export const dynamic = "force-dynamic";

export default async function AdminHrPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  const params = searchParams ? await searchParams : {};
  const notice = Array.isArray(params.ok) ? params.ok[0] : params.ok || "";
  const noticeError = Array.isArray(params.error) ? params.error[0] : params.error || "";

  if (!actor?.canAccessAdmin) {
    return (
      <AdminWorkplaceDenied
        detail="Sign in with an authorized SitGuru admin or HR account to open Hiring & People."
      />
    );
  }

  return (
    <SpringProgramDashboard
      canAdminister={canAdministerInternshipOnboarding(actor)}
      notice={notice}
      noticeError={noticeError}
    />
  );
}
