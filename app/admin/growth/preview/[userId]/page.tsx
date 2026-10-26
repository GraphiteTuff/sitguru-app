import { notFound, redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { listActiveEngagements } from "@/lib/staff-time/engagement";
import { loadMyTimeDashboard } from "@/lib/staff-time/queries";
import { listGrowthInitiatives } from "@/lib/admin/growth/outcomes";
import AdminPreviewBanner from "@/components/admin/AdminPreviewBanner";
import MyTimePanel from "@/components/staff-time/MyTimePanel";
import { GrowthPageFrame } from "@/components/admin/growth/GrowthPageFrame";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { mapEngagement } from "@/lib/staff-time/mappers";

export const dynamic = "force-dynamic";

/**
 * Admin View-As for a Growth Manager workspace (read-only).
 * Uses the same live My Time data the target user sees.
 */
export default async function GrowthManagerPreviewPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) redirect("/admin/login");
  if (!actor.isSuperUser && !["founder", "owner", "hr_admin", "operations_admin"].includes(actor.role)) {
    redirect("/admin/growth");
  }

  const { userId } = await params;
  const { data } = await supabaseAdmin
    .from("staff_engagements")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const engagement = data
    ? mapEngagement(data as Record<string, unknown>)
    : (await listActiveEngagements()).find((item) => item.userId === userId) ||
      null;

  if (!engagement) notFound();

  const [dash, initiatives] = await Promise.all([
    loadMyTimeDashboard(engagement),
    listGrowthInitiatives(12),
  ]);

  return (
    <>
      <AdminPreviewBanner
        viewingAs={engagement.displayName}
        exitHref="/admin/hr/people"
      />
      <GrowthPageFrame
        kicker="Admin Preview · Read-Only"
        title={`${engagement.displayName}'s Workspace`}
        detail="Live authorized data. Mutations are disabled in preview — exit to act as Admin."
      >
        <div className="pointer-events-none select-none opacity-95">
          <MyTimePanel
            data={dash}
            initiatives={initiatives.map((item) => ({
              id: item.id,
              name: item.name,
            }))}
          />
        </div>
      </GrowthPageFrame>
    </>
  );
}
