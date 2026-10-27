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

export default async function AdminPeoplePaymentsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) redirect("/admin/login?next=/admin/hr/people/payments");

  const params = searchParams ? await searchParams : {};
  const items = await listPeriodsNeedingAttention();

  return (
    <GrowthPageFrame
      kicker="People & Administration"
      title="Team Payments"
      detail="Approve submitted payment periods and record Business ACH after bank payment. Stripe Connect is not used for team-member service payments."
      action={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/hr/people"
            className="inline-flex min-h-11 items-center rounded-2xl border border-white/40 px-4 text-sm font-black !text-white"
          >
            People
          </Link>
          <GrowthPrimaryLink href="/admin/hr/people/payments/export">
            Export Paid
          </GrowthPrimaryLink>
        </div>
      }
    >
      <AdminPaymentQueue
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
