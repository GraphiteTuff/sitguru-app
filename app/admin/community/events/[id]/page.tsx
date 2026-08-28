import { redirect } from "next/navigation";
import AdminCommunityEventReviewClient from "@/components/admin/community/AdminCommunityEventReviewClient";
import AdminEventMessagePanel from "@/components/admin/community/AdminEventMessagePanel";
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

  return (
    <div className="space-y-6">
      <AdminEventMessagePanel eventId={event.id} eventTitle={event.title} />
      <AdminCommunityEventReviewClient event={event} />
    </div>
  );
}
