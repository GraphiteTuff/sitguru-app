import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import AdminCreateEventClient from "@/components/admin/community/AdminCreateEventClient";
import { fetchAdminPartnerOptions } from "@/lib/community/admin-event-mutations";

export const dynamic = "force-dynamic";

export default async function AdminCreateCommunityEventPage() {
  const admin = await getAdminIdentity();

  if (!admin?.canAccessAdmin) {
    redirect("/admin/login");
  }

  const partners = await fetchAdminPartnerOptions();

  return <AdminCreateEventClient partners={partners} />;
}
