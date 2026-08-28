import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import AdminFeaturedEventsManager from "@/components/admin/community/AdminFeaturedEventsManager";
import {
  fetchAdminEvents,
  fetchFeaturedEventsForAdmin,
  fetchPublicEvents,
} from "@/lib/community/queries";

export const dynamic = "force-dynamic";

export default async function AdminFeaturedCommunityEventsPage() {
  const admin = await getAdminIdentity();

  if (!admin?.canAccessAdmin) {
    redirect("/admin/login");
  }

  const [featured, published, upcoming] = await Promise.all([
    fetchFeaturedEventsForAdmin(),
    fetchAdminEvents({ status: "published", limit: 100 }),
    fetchPublicEvents({ limit: 8 }),
  ]);

  const pool =
    featured.length > 0
      ? featured
      : published.filter((event) => new Date(event.start_at) >= new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/admin/community/events" className="text-sm font-black text-emerald-800">
            ← Community Events
          </Link>
          <p className="mt-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
            Admin • Featured
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            Homepage & featured manager
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-600">
            Schedule featured placements, set market targeting, and preview Happening Near You before
            you save.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/community/events/new"
            className="inline-flex min-h-11 items-center rounded-2xl bg-emerald-700 px-5 text-sm font-black text-white"
          >
            Create event
          </Link>
          <Link
            href="/admin/community/markets"
            className="inline-flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-800"
          >
            Discovery markets
          </Link>
        </div>
      </div>

      <AdminFeaturedEventsManager events={pool} previewUpcoming={upcoming} />
    </div>
  );
}
