import Link from "next/link";
import {
  getGraffEnterprisesFilingCalendar,
  type DatedFilingDeadline,
} from "@/lib/admin/financials/tax-filing-calendar";
import { GrowthCard } from "@/components/admin/growth/GrowthPageFrame";

function urgencyClass(urgency: DatedFilingDeadline["urgency"]) {
  if (urgency === "overdue") return "border-rose-200 bg-rose-50 text-rose-800";
  if (urgency === "due_soon") return "border-amber-200 bg-amber-50 text-amber-800";
  if (urgency === "upcoming") return "border-sky-200 bg-sky-50 text-sky-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function FilingRow({ item }: { item: DatedFilingDeadline }) {
  const external = item.href.startsWith("http");
  return (
    <div className="grid min-w-0 gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 md:grid-cols-[7.5rem_1fr_auto] md:items-center">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          {item.authority}
        </p>
        <p className="mt-1 text-sm font-black text-slate-950">{item.form}</p>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-black text-slate-950">{item.title}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">{item.dueLabel}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
          {item.who}. {item.notes}
        </p>
      </div>
      <Link
        href={item.href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className="inline-flex min-h-11 items-center justify-center rounded-2xl px-4 text-sm font-black !text-white"
        style={{ background: "#0D5C3A" }}
      >
        {item.action}
      </Link>
    </div>
  );
}

export function TaxFilingCalendar({
  asOf,
  compact = false,
}: {
  asOf?: Date;
  compact?: boolean;
}) {
  const calendar = getGraffEnterprisesFilingCalendar(asOf);
  const spotlight = [...calendar.nextUp, ...calendar.upcoming].slice(0, compact ? 4 : 8);
  const rest = compact
    ? []
    : calendar.open.filter((item) => !spotlight.some((shown) => shown.id === item.id)).slice(0, 8);

  return (
    <GrowthCard id="filings">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
            Graff Enterprises LLC dba SitGuru
          </p>
          <h2 className="mt-1 text-lg font-black text-slate-950">
            IRS and Pennsylvania filing dates
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            PA multi-member LLC path: Form 1065 + PA-20S/PA-65, then member 1040 / PA-40.
            Confirm entity classification with your CPA before paying.
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${urgencyClass(calendar.nextDeadline.urgency)}`}
        >
          Next: {calendar.nextDeadline.form}
        </span>
      </div>

      <div className="mt-4 grid min-w-0 gap-2">
        {spotlight.map((item) => (
          <FilingRow key={item.id} item={item} />
        ))}
      </div>

      {rest.length ? (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-black text-emerald-800">
            Later {calendar.homeState} and IRS dates
          </summary>
          <div className="mt-3 grid min-w-0 gap-2">
            {rest.map((item) => (
              <FilingRow key={item.id} item={item} />
            ))}
          </div>
        </details>
      ) : null}
    </GrowthCard>
  );
}
