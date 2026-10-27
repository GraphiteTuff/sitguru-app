import { redirect } from "next/navigation";
import InternshipAdminBackBar from "@/components/internship/InternshipAdminBackBar";
import WorkspaceLiveSyncMount from "@/components/realtime/WorkspaceLiveSyncMount";
import { getAdminIdentity } from "@/lib/admin/access";
import { isGrowthOnlyRole } from "@/lib/admin/growth-paths";

export default async function InternshipAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) redirect("/admin/login?next=/admin/internship");
  if (isGrowthOnlyRole(actor.role) && !actor.isSuperUser) redirect("/intern/manage");

  return (
    <div className="min-w-0 overflow-x-hidden">
      <WorkspaceLiveSyncMount />
      <InternshipAdminBackBar />
      {children}
    </div>
  );
}
