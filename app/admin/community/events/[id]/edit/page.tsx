import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import AdminEventEditor from "@/components/admin/community/AdminEventEditor";
import { fetchAdminEventById } from "@/lib/community/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditCommunityEventPage({ params }: PageProps) {
  const admin = await getAdminIdentity();

  if (!admin?.canAccessAdmin) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const event = await fetchAdminEventById(id);

  if (!event) {
    notFound();
  }

  const partnerName = event.partners?.business_name || "Partner";

  return (
    <div className="space-y-4">
      <AdminEventEditor event={event} partnerName={partnerName} />
      <p className="text-center text-sm font-semibold text-slate-500">
        Need moderation tools?{" "}
        <Link href={`/admin/community/events/${event.id}`} className="font-black text-emerald-800">
          Open review panel
        </Link>
      </p>
    </div>
  );
}
