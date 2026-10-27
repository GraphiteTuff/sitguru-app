import Link from "next/link";
import { CreditCard, FileText, HelpCircle, Landmark } from "lucide-react";
import DeskPageHero from "@/components/manager/DeskPageHero";
import { formatHours, formatUsdFromCents } from "@/lib/staff-time/money";
import { paymentStatusLabel } from "@/lib/staff-time/status";
import type { MyTimeDashboard } from "@/lib/staff-time/types";
import { DESK_UI } from "@/lib/portal/desk-ui";

export default function PaymentsDesk({ data }: { data: MyTimeDashboard }) {
  const paid = data.payments;
  const hoursGoal = (data.week.expectedMax || 0) * 2 || 1;
  const pct = Math.min(100, Math.round((data.period.totalHours / hoursGoal) * 100));
  const months = new Map<string, number>();
  for (const payment of paid) {
    const key = (payment.paidOn || payment.createdAt).slice(0, 7) || "Paid";
    months.set(key, (months.get(key) || 0) + payment.amountCents);
  }
  const slices = [...months.entries()];
  const total = slices.reduce((sum, [, cents]) => sum + cents, 0) || 1;
  let cursor = 0;
  const gradient = slices.length
    ? `conic-gradient(${slices
        .map(([, cents], index) => {
          const start = cursor;
          cursor += (cents / total) * 100;
          const color = ["#2563EB", "#60A5FA", "#93C5FD", "#BFDBFE"][index % 4];
          return `${color} ${start}% ${cursor}%`;
        })
        .join(",")})`
    : "conic-gradient(#E2E8F0 0 100%)";

  return (
    <div className="space-y-4 pb-28 lg:pb-8">
      <DeskPageHero
        icon={<CreditCard size={22} />}
        title="My Payments"
        subtitle="Track your payment periods, history, and invoices. Bank details are never shown here."
        quote={"Support\nYour Work.\nBigger Impact.®"}
      />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl bg-[#ECFDF5] p-4 text-[#047857]">
          <p className="text-3xl font-black text-[#0F2744]">{data.estimatedPaymentLabel}</p>
          <p className="text-sm font-black">Estimated Next Payment</p>
          <p className="text-xs font-semibold">{data.periodLabel}</p>
        </article>
        <article className="rounded-2xl bg-[#F5F3FF] p-4 text-[#6D28D9]">
          <p className="text-xl font-black text-[#0F2744]">{data.periodLabel}</p>
          <p className="text-sm font-black">Current Payment Period</p>
          <p className="text-xs font-semibold">{pct}% of the planned hours</p>
        </article>
        <article className="rounded-2xl bg-[#EFF6FF] p-4 text-[#1D4ED8]">
          <p className="text-3xl font-black text-[#0F2744]">{paid.length}</p>
          <p className="text-sm font-black">Total Payments</p>
          <p className="text-xs font-semibold">Paid records only</p>
        </article>
        <article className="rounded-2xl bg-[#FFF7ED] p-4 text-[#C2410C]">
          <p className="text-3xl font-black text-[#0F2744]">{data.annualPaidLabel}</p>
          <p className="text-sm font-black">Total Earned</p>
          <p className="text-xs font-semibold">This year</p>
        </article>
      </section>
      <section className="grid gap-4 xl:grid-cols-3">
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Current Payment Period</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{data.periodLabel}</p>
          <p className="mt-3 text-2xl font-black text-[#0F2744]">{formatHours(data.period.totalHours)} / {formatHours(hoursGoal)} hours</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-[#22C55E]" style={{ width: `${pct}%` }} /></div>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div><dt className="text-xs text-slate-500">Hourly Rate</dt><dd className="font-black">{data.currentRateLabel}</dd></div>
            <div><dt className="text-xs text-slate-500">Estimated Pay</dt><dd className="font-black">{data.estimatedPaymentLabel}</dd></div>
            <div><dt className="text-xs text-slate-500">Status</dt><dd className="font-black">{paymentStatusLabel(data.period.status)}</dd></div>
          </dl>
          <p className="mt-3 text-xs font-medium text-slate-500">W-9 status: {data.w9StatusLabel}. Final pay can change after hours are approved.</p>
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Hours by Week</h2>
          <p className="mt-6 text-4xl font-black text-[#0F2744]">{formatHours(data.week.hours)}</p>
          <p className="text-sm font-semibold text-slate-500">Logged this week · {data.week.rangeLabel}</p>
          <Link href="/manager/my-time" className="mt-4 inline-flex text-sm font-bold text-[#2563EB]">Open My Time →</Link>
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Payment Actions</h2>
          <div className="mt-3 grid gap-2">
            <Link href="#payment-history" className="flex items-center gap-2 rounded-2xl bg-[#F8FAFC] px-3 py-3 text-sm font-bold text-[#0F2744]"><FileText size={16} /> View payment history</Link>
            <Link href="/manager/settings" className="flex items-center gap-2 rounded-2xl bg-[#F8FAFC] px-3 py-3 text-sm font-bold text-[#0F2744]"><Landmark size={16} /> Update payment info</Link>
            <Link href="/manager/help" className="flex items-center gap-2 rounded-2xl bg-[#F8FAFC] px-3 py-3 text-sm font-bold text-[#0F2744]"><HelpCircle size={16} /> Payment help</Link>
          </div>
        </article>
      </section>
      <section id="payment-history" className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)]">
        <article className={`${DESK_UI.card} overflow-hidden`}>
          <h2 className="px-4 py-3 text-lg font-black text-[#0F2744]">Payment History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs font-bold text-slate-400"><tr><th className="px-4 py-2">Paid</th><th>Hours</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
              <tbody>
                {paid.map((payment) => (
                  <tr key={payment.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold">{payment.paidOn || payment.createdAt.slice(0, 10)}</td>
                    <td>{formatHours(payment.approvedHours)}</td>
                    <td className="font-black">{formatUsdFromCents(payment.amountCents)}</td>
                    <td>{payment.paymentMethod || "Business ACH"}</td>
                    <td><span className="rounded-full bg-[#DCFCE7] px-2 py-1 text-[10px] font-bold text-[#166534]">Paid</span></td>
                  </tr>
                ))}
                {!paid.length ? <tr><td colSpan={5} className="px-4 py-6 text-slate-500">No paid payments yet.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Payment Breakdown</h2>
          <div className="mx-auto mt-4 grid h-36 w-36 place-items-center rounded-full" style={{ background: gradient }}>
            <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center text-sm font-black text-[#0F2744]">{data.annualPaidLabel}</div>
          </div>
          <ul className="mt-3 space-y-1 text-sm font-semibold text-slate-600">
            {slices.map(([month, cents]) => (
              <li key={month} className="flex justify-between"><span>{month}</span><span>{formatUsdFromCents(cents)}</span></li>
            ))}
            {!slices.length ? <li>Paid months will chart here.</li> : null}
          </ul>
        </article>
      </section>
    </div>
  );
}
