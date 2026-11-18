import { Suspense } from "react";
import { getAdminIdentity } from "@/lib/admin/access";
import AdminAccessDenied from "@/components/admin/live-walks/AdminAccessDenied";
import AdminLiveWalksDashboard from "@/components/admin/live-walks/AdminLiveWalksDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Live Map Dashboard | SitGuru Admin",
};

export default async function AdminLiveWalksPage() {
  const identity = await getAdminIdentity();

  if (!identity?.canAccessAdmin) {
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
