import Link from "next/link";
import { Clock3, CreditCard, TriangleAlert } from "lucide-react";
import type { ManagerHomeExtras } from "@/lib/staff-time/home-summary";
import { myTimeSnapshotLines } from "@/lib/staff-time/home-summary";
import StatusChip from "@/components/staff-time/StatusChip";
import { GrowthCard } from "@/components/admin/growth/GrowthPageFrame";

export default function ManagerHomeTimeCards({
  extras,
  basePath = "/admin/growth",
}: {
  extras: ManagerHomeExtras;
  basePath?: string;
}) {
  const timeBase = basePath === "/manager" ? "/manager" : "/admin/growth";
  const { myTime, needsAttention } = extras;
  if (!myTime && !needsAttention.length) return null;
  const snap = myTime ? myTimeSnapshotLines(myTime) : null;

  return (
    <section className="order-1 min-w-0 space-y-3 lg:col-span-12">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
          Manager Workspace
        </p>
        <h2 className="text-lg font-black text-slate-950 sm:text-xl">
          Needs Attention · My Time · Payments
        </h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <GrowthCard>
          <div className="flex items-center gap-2 text-amber-800">
            <TriangleAlert size={16} />
            <p className="text-[10px] font-black uppercase tracking-[0.14em]">
              Needs Attention
            </p>
          </div>
          <ul className="mt-3 space-y-2">
            {needsAttention.map((item) => (
              <li key={`${item.label}-${item.href}`}>
                <Link
                  href={item.href}
                  className="flex min-h-10 items-center justify-between gap-2 rounded-2xl bg-amber-50 px-3 text-sm font-bold text-amber-950"
                >
                  <span>{item.label}</span>
                  <span>{item.count}</span>
                </Link>
              </li>
            ))}
            {!needsAttention.length ? (
              <li className="text-sm font-semibold text-slate-500">All clear.</li>
            ) : null}
          </ul>
        </GrowthCard>

        {snap && myTime ? (
          <>
            <GrowthCard>
              <div className="flex items-center gap-2 text-emerald-800">
                <Clock3 size={16} />
                <p className="text-[10px] font-black uppercase tracking-[0.14em]">
                  My Time
                </p>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-950">{snap.weekLabel}</p>
              <p
                className={`mt-2 text-sm font-semibold ${
                  myTime.week.aboveExpected ? "text-amber-800" : "text-slate-600"
                }`}
              >
                {snap.rangeLabel}
              </p>
              <Link
                href={`${timeBase}/my-time`}
                className="mt-3 inline-flex min-h-11 items-center text-sm font-black text-emerald-900"
              >
                Open My Time
              </Link>
            </GrowthCard>

            <GrowthCard>
              <div className="flex items-center gap-2 text-emerald-800">
                <CreditCard size={16} />
                <p className="text-[10px] font-black uppercase tracking-[0.14em]">
                  Current Payment
                </p>
              </div>
              <p className="mt-3 text-lg font-black text-slate-950">{snap.periodLabel}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                {snap.hoursLabel} · {snap.amountLabel}
              </p>
              <div className="mt-3">
                <StatusChip status={myTime.period.status} label={snap.statusLabel} />
              </div>
              <Link
                href={`${timeBase}/payments`}
                className="mt-3 inline-flex min-h-11 items-center text-sm font-black text-emerald-900"
              >
                View Payments
              </Link>
            </GrowthCard>

            <GrowthCard>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                Quick Actions
              </p>
              <div className="mt-3 grid gap-2">
                {[
                  [`${timeBase}/create`, "Create Growth Initiative"],
                  ["/intern/manage", "Review Intern Work"],
                  [`${timeBase}/my-time`, "Add Time"],
                  [`${timeBase}/messages`, "Open Messages"],
                  [`${timeBase}/payments`, "View Payments"],
                ].map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-100 px-3 text-sm font-black text-emerald-950"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </GrowthCard>
          </>
        ) : null}
      </div>
    </section>
  );
}
