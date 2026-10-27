import Link from "next/link";
import { getAdminIdentity } from "@/lib/admin/access";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { listGrowthInitiatives } from "@/lib/admin/growth/outcomes";
import { resolveManagerEngagement } from "@/lib/staff-time/engagement";
import { loadMyTimeDashboard } from "@/lib/staff-time/queries";
import MyTimePanel from "@/components/staff-time/MyTimePanel";
import {
  GrowthPageFrame,
  GrowthPrimaryLink,
} from "@/components/admin/growth/GrowthPageFrame";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function ManagerMyTimePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const actor = await getAdminIdentity();

  const engagement = await resolveManagerEngagement({
    userId: access.actor.id,
    email: access.actor.email,
    role: actor?.role,
    isSuperUser: access.actor.isSuperUser,
  });

  if (!engagement) {
    return (
      <GrowthPageFrame
        kicker="My Time"
        title="Engagement required"
        detail="My Time opens once your Growth Manager engagement is active."
      >
        <GrowthPrimaryLink href="/manager">Back to Manager Portal</GrowthPrimaryLink>
      </GrowthPageFrame>
    );
  }

  const params = searchParams ? await searchParams : {};
  const [data, initiatives] = await Promise.all([
    loadMyTimeDashboard(engagement),
    listGrowthInitiatives(20),
  ]);

  return (
    <GrowthPageFrame
      kicker="Manager Portal"
      title="My Time"
      detail={`${engagement.displayName} · ${engagement.title}. Expected ${engagement.expectedWeeklyMinHours}–${engagement.expectedWeeklyMaxHours} hrs/week.`}
      action={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/manager/payments"
            className="inline-flex min-h-11 items-center rounded-2xl border border-white/40 px-4 text-sm font-black !text-white"
          >
            My Payments
          </Link>
          <GrowthPrimaryLink href="/manager">Home</GrowthPrimaryLink>
        </div>
      }
    >
      <MyTimePanel
        data={data}
        basePath="/manager"
        initiatives={initiatives.map((item) => ({ id: item.id, name: item.name }))}
        notice={
          first(params.ok)
            ? { kind: "ok", message: first(params.ok) }
            : first(params.error)
              ? { kind: "error", message: first(params.error) }
              : null
        }
      />
    </GrowthPageFrame>
  );
}
