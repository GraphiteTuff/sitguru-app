import { Suspense } from "react";
import { getAdminIdentity } from "@/lib/admin/access";
import AdminAccessDenied from "@/components/admin/live-walks/AdminAccessDenied";
import AdminLiveWalksDashboard from "@/components/admin/live-walks/AdminLiveWalksDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Live Map Dashboard | SitGuru Admin",
};

async function assertAdminAccess() {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) {
    return { ok: false as const, reason: actor ? "forbidden" : "unauthenticated" };
  }
  return { ok: true as const, userId: actor.id };
}

export default async function AdminLiveWalksPage() {
  const access = await assertAdminAccess();

  if (!access.ok) {
    return <AdminAccessDenied />;
  }

  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-600 shadow-sm">
          Loading live map dashboard…
        </div>
      }
    >
      <AdminLiveWalksDashboard />
    </Suspense>
  );
}
