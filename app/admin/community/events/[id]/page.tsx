import { redirect } from "next/navigation";
import AdminCommunityEventReviewClient from "@/components/admin/community/AdminCommunityEventReviewClient";
import AdminEventAttendancePanel from "@/components/admin/community/AdminEventAttendancePanel";
import AdminEventMessagePanel from "@/components/admin/community/AdminEventMessagePanel";
import { getAdminIdentity } from "@/lib/admin/access";
import { listEventAttendanceForAdmin } from "@/lib/community/attendance";
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

  const attendance = await listEventAttendanceForAdmin(event.id);

  return (
    <div className="space-y-6">
      <AdminEventMessagePanel eventId={event.id} eventTitle={event.title} />
      <AdminEventAttendancePanel
        counts={attendance.counts}
        rows={attendance.rows}
      />
      <AdminCommunityEventReviewClient event={event} />
    </div>
  );
}
