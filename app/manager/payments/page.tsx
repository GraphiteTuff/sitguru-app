import Link from "next/link";
import { getAdminIdentity } from "@/lib/admin/access";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { resolveManagerEngagement } from "@/lib/staff-time/engagement";
import { loadMyTimeDashboard } from "@/lib/staff-time/queries";
import { formatHours, formatUsdFromCents } from "@/lib/staff-time/money";
import { paymentStatusLabel } from "@/lib/staff-time/status";
import StatusChip from "@/components/staff-time/StatusChip";
import {
  GrowthCard,
  GrowthPageFrame,
  GrowthPrimaryLink,
} from "@/components/admin/growth/GrowthPageFrame";

export const dynamic = "force-dynamic";

export default async function ManagerPaymentsPage() {
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
      <GrowthPageFrame kicker="My Payments" title="No payment history yet">
        <GrowthPrimaryLink href="/manager">Back to Manager Portal</GrowthPrimaryLink>
      </GrowthPageFrame>
    );
  }

  const data = await loadMyTimeDashboard(engagement);

  return (
    <GrowthPageFrame
      kicker="Manager Portal"
      title="My Payments"
      detail="Friendly payment history for your SitGuru work. Bank details are never shown here."
      action={<GrowthPrimaryLink href="/manager/my-time">My Time</GrowthPrimaryLink>}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <GrowthCard>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
            Current Payment
          </p>
          <p className="mt-2 text-xl font-black text-slate-950">{data.periodLabel}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            {formatHours(data.period.totalHours)} hrs · {data.estimatedPaymentLabel}
          </p>
          <div className="mt-3">
            <StatusChip
              status={data.period.status}
              label={paymentStatusLabel(data.period.status)}
            />
          </div>
        </GrowthCard>
        <GrowthCard>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
            Current Rate
          </p>
          <p className="mt-2 text-3xl font-black text-slate-950">{data.currentRateLabel}</p>
        </GrowthCard>
        <GrowthCard>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
            Annual Paid
          </p>
          <p className="mt-2 text-3xl font-black text-slate-950">{data.annualPaidLabel}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">Based on Paid records only</p>
        </GrowthCard>
      </div>

      <GrowthCard className="mt-4">
        <h2 className="text-lg font-black text-slate-950">Payment History</h2>
        <div className="mt-4 space-y-3 md:hidden">
          {data.payments.map((payment) => (
            <article key={payment.id} className="rounded-2xl border border-emerald-100 p-3">
              <p className="font-black text-slate-950">{payment.paidOn}</p>
              <p className="text-sm font-semibold text-slate-600">
                {formatHours(payment.approvedHours)} hrs · ACH
              </p>
              <p className="mt-1 font-black text-slate-950">
                {formatUsdFromCents(payment.amountCents)}
              </p>
            </article>
          ))}
          {!data.payments.length ? (
            <p className="text-sm font-semibold text-slate-500">No paid payments yet.</p>
          ) : null}
        </div>
        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
              <tr>
                <th className="px-2 py-2">Paid</th>
                <th className="px-2 py-2">Hours</th>
                <th className="px-2 py-2">Amount</th>
                <th className="px-2 py-2">Method</th>
                <th className="px-2 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.map((payment) => (
                <tr key={payment.id} className="border-t border-emerald-50">
                  <td className="px-2 py-3 font-semibold">{payment.paidOn}</td>
                  <td className="px-2 py-3">{formatHours(payment.approvedHours)}</td>
                  <td className="px-2 py-3 font-black">
                    {formatUsdFromCents(payment.amountCents)}
                  </td>
                  <td className="px-2 py-3">Business ACH</td>
                  <td className="px-2 py-3">
                    <StatusChip status="paid" label="Paid" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-600">
          W-9 status: {data.w9StatusLabel}
        </p>
        <Link
          href="/manager"
          className="mt-3 inline-flex min-h-11 items-center text-sm font-black text-emerald-900"
        >
          Back to Manager Portal
        </Link>
      </GrowthCard>
    </GrowthPageFrame>
  );
}
