import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { listContractorPeriods } from "@/lib/staff-time/queries";
import AdminPaymentQueue from "@/components/staff-time/AdminPaymentQueue";
import { GrowthPageFrame, GrowthPrimaryLink } from "@/components/admin/growth/GrowthPageFrame";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

/**
 * The one authoritative admin ledger for contractor time, review and payments.
 * Finance routes redirect here. Manager submits to the same staff_payment_periods
 * rows that this page loads, regardless of a period's start or end date.
 */
export default async function AdminPeoplePaymentsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) {
    redirect("/admin/login?next=/admin/hr/people/payments");
  }
  const canAccessContractorFinance =
    actor.isSuperUser || actor.canAccessFinancials ||
    ["hr_admin", "operations_admin"].includes(actor.role);
  if (!canAccessContractorFinance) redirect("/admin");

  const params = searchParams ? await searchParams : {};
  const allItems = await listContractorPeriods();

  const count = (status: string) =>
    allItems.filter((item) => item.period.status === status).length;

  const submitted = count("submitted");
  const ready = allItems.filter((item) =>
    ["approved", "ready_for_payment", "processing"].includes(item.period.status),
  ).length;
  const corrections = count("needs_correction");
  const paid = count("paid");

  return (
    <div className="admin-desk-surface">
      <GrowthPageFrame
        variant="desk"
        kicker="Admin HQ · HR & Financials"
        title="Contractor Hours & Payments"
        detail="One place to review every contractor's time submissions, approve or request changes, check ready-to-pay amounts, and record confirmed bank ACH payments. You are reviewing live staff records, not a duplicated timesheet."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/hr/people"
              className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-[#0F2744]"
            >
              Team Members
            </Link>
            <GrowthPrimaryLink href="/admin/hr/people/payments/export">
              Export Paid
            </GrowthPrimaryLink>
          </div>
        }
      >
        <section aria-label="Contractor payment status summary" className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Submitted for review", value: submitted, href: "#approvals", tone: "bg-amber-50 border-amber-200 text-amber-950" },
            { label: "Ready for payment", value: ready, href: "#payment-queue", tone: "bg-blue-50 border-blue-200 text-blue-950" },
            { label: "Needs correction", value: corrections, href: "#corrections", tone: "bg-orange-50 border-orange-200 text-orange-950" },
            { label: "Paid periods", value: paid, href: "#paid-history", tone: "bg-emerald-50 border-emerald-200 text-emerald-950" },
          ].map((card) => (
            <Link href={card.href} key={card.label} className={`block rounded-2xl border p-4 transition-colors hover:brightness-[.98] ${card.tone}`}>
              <p className="text-xs font-black uppercase tracking-wide">{card.label}</p>
              <p className="mt-2 text-3xl font-black tabular-nums">{card.value}</p>
              <p className="mt-1 text-xs font-semibold">View below</p>
            </Link>
          ))}
        </section>

        {allItems.length === 0 ? (
          <section role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
            <h2 className="text-lg font-black">No contractor payment periods found</h2>
            <p className="mt-2 font-medium">
              This is not confirmation that hours were never submitted. Only submitted, correction, approved, and paid periods are listed here. Unsubmitted work stays inside each manager’s My Time portal.
            </p>
          </section>
        ) : null}

        <AdminPaymentQueue
          mode="all"
          items={allItems}
          canAct={actor.isSuperUser || [
            "founder", "owner", "super_admin", "hr_admin", "operations_admin", "billing_admin",
          ].includes(actor.role)}
          notice={
            first(params.ok)
              ? { kind: "ok", message: first(params.ok) }
              : first(params.error)
                ? { kind: "error", message: first(params.error) }
                : null
          }
        />
      </GrowthPageFrame>
    </div>
  );
}
