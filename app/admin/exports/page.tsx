import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { portalHomePath } from "@/lib/admin/portal-areas";

export default async function AdminExportsRedirectPage() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessFinancials && actor?.portalAreas?.length) {
    redirect(portalHomePath(actor.portalAreas));
  }

  redirect("/admin/financials/exports");
}
