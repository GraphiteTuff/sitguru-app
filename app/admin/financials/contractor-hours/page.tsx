import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { listPeriodsNeedingAttention } from "@/lib/staff-time/queries";
import AdminPaymentQueue from "@/components/staff-time/AdminPaymentQueue";
import {
  GrowthPageFrame,
  GrowthPrimaryLink,
} from "@/components/admin/growth/GrowthPageFrame";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function AdminContractorHoursPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) {
    redirect("/admin/login?next=/admin/financials/contractor-hours");
  }
  if (!actor.isSuperUser && !actor.canAccessFinancials) {
    redirect("/admin");
  }

  const params = searchParams ? await searchParams : {};
  const items = (await listPeriodsNeedingAttention()).filter((item) =>
    ["submitted", "needs_correction"].includes(item.period.status),
  );

  return (
    <GrowthPageFrame
      kicker="Finance · Contractor Hours"
      title="Review contractor service logs"
      detail="Approve or request changes on submitted weekly/biweekly service periods. Approval creates a payable — it does not send ACH."
      action={
        <div className="flex flex-wrap gap-2">
          <GrowthPrimaryLink href="/admin/financials/contractor-payments">
            Contractor Payments
          </GrowthPrimaryLink>
          <Link
            href="/admin/hr/people/payments"
            className="inline-flex min-h-11 items-center rounded-2xl border border-white/40 px-4 text-sm font-black !text-white"
          >
            HR Team Payments
          </Link>
        </div>
      }
    >
      <AdminPaymentQueue
        mode="hours"
        items={items}
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
