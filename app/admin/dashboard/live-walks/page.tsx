import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import AdminAccessDenied from "@/components/admin/live-walks/AdminAccessDenied";
import AdminLiveWalksDashboard from "@/components/admin/live-walks/AdminLiveWalksDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Live Map Dashboard | SitGuru Admin",
};

async function assertAdminAccess() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { ok: false as const, reason: "unauthenticated" };
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, role, account_status")
    .eq("id", user.id)
    .maybeSingle();

  const role = String(profile?.role || "")
    .trim()
    .toLowerCase();
  const status = String(profile?.account_status || "active")
    .trim()
    .toLowerCase();

  if (role !== "admin" || (status && status !== "active")) {
    return { ok: false as const, reason: "forbidden" };
  }

  return { ok: true as const, userId: user.id };
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
