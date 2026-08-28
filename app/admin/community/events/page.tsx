import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import AdminCommunityEventsClient from "@/components/admin/community/AdminCommunityEventsClient";
import { fetchAdminEvents } from "@/lib/community/queries";
import { countUnreadEventThreadsForAdmin } from "@/lib/messaging/event-conversation-queries";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    partnerId?: string;
    city?: string;
    state?: string;
    category?: string;
  }>;
};

export default async function AdminCommunityEventsPage({ searchParams }: PageProps) {
  const admin = await getAdminIdentity();

  if (!admin?.canAccessAdmin) {
    redirect("/admin/login");
  }

  const filters = await searchParams;
  const statusFilter = filters?.status;
  const events = await fetchAdminEvents({
    q: filters?.q,
    status:
      statusFilter && statusFilter !== "all"
        ? (statusFilter as import("@/lib/community/types").CommunityEventStatus)
        : "all",
    partnerId: filters?.partnerId,
    city: filters?.city,
    state: filters?.state,
    category: filters?.category,
  });

  const stats = {
    published: events.filter((event) => event.status === "published").length,
    pending: events.filter((event) => event.status === "pending_review").length,
    changesRequested: events.filter((event) => event.status === "changes_requested").length,
    featured: events.filter((event) => event.featured_status !== "none").length,
    upcoming: events.filter((event) => new Date(event.start_at) >= new Date()).length,
    past: events.filter((event) => new Date(event.start_at) < new Date()).length,
    total: events.length,
  };

  const unreadEventMessages = await countUnreadEventThreadsForAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
            Admin • Community
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Events</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/community/events/new"
            className="inline-flex min-h-11 items-center rounded-2xl bg-emerald-700 px-5 text-sm font-black text-white"
          >
            Create event
          </Link>
          <Link
            href="/admin/community/events/featured"
            className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 bg-white px-5 text-sm font-black text-emerald-800"
          >
            Featured manager
          </Link>
          <Link
            href="/admin/messages?filter=event-admin"
            className="inline-flex min-h-11 items-center rounded-2xl border border-teal-200 bg-teal-50 px-5 text-sm font-black text-teal-900"
          >
            Event messages{unreadEventMessages ? ` (${unreadEventMessages})` : ""}
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Published", stats.published],
          ["Pending Review", stats.pending],
          ["Changes Requested", stats.changesRequested],
          ["Featured", stats.featured],
          ["Upcoming", stats.upcoming],
          ["Past", stats.past],
          ["Total Events", stats.total],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              {label}
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      <AdminCommunityEventsClient events={events} initialFilters={filters || {}} />
    </div>
  );
}
