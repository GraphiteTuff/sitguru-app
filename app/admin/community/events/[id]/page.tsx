import { redirect } from "next/navigation";
import AdminCommunityEventReviewClient from "@/components/admin/community/AdminCommunityEventReviewClient";
import { getAdminIdentity } from "@/lib/admin/access";
import { fetchAdminEventById } from "@/lib/community/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminCommunityEventDetailPage({ params }: PageProps) {
  const admin = await getAdminIdentity();

  if (!admin?.canAccessAdmin) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const event = await fetchAdminEventById(id);

  if (!event) {
    redirect("/admin/community/events");
  }

  return <AdminCommunityEventReviewClient event={event} />;
}
