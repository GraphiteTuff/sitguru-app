import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveAdminIdentityForUser } from "@/lib/admin/access";
import AdminAccessDenied from "@/components/admin/live-walks/AdminAccessDenied";
import AdminLiveWalksDashboard from "@/components/admin/live-walks/AdminLiveWalksDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Live Map Dashboard | SitGuru Admin",
};

export default async function AdminLiveWalksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect("/admin/login");
  }

  const identity = await resolveAdminIdentityForUser({
    id: user.id,
    email: user.email,
  });

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
