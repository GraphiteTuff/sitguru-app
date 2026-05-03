import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";

type ChartItem = {
  label: string;
  value: number;
  helper?: string;
  href?: string;
};

type GuruReadinessDrilldownsProps = {
  visibilityChart: ChartItem[];
  profileChart: ChartItem[];
  trustChart: ChartItem[];
  exportHref: string;
};

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

function getMaxValue(items: ChartItem[]) {
  return Math.max(...items.map((item) => item.value), 0);
}

function getDrilldownHref(title: string, label: string) {
  const normalizedTitle = title.toLowerCase();
  const normalizedLabel = label.toLowerCase();

  if (normalizedTitle.includes("bookable")) {
    if (normalizedLabel.includes("not bookable")) {
      return "/admin/gurus?filter=not-bookable";
    }

    if (normalizedLabel.includes("bookable")) {
      return "/admin/gurus?status=bookable";
    }
  }

  if (normalizedTitle.includes("profile")) {
    if (normalizedLabel.includes("needs update")) {
      return "/admin/gurus?filter=profile-updates";
    }

    if (normalizedLabel.includes("complete")) {
      return "/admin/gurus?filter=profile-complete";
    }
  }

  if (normalizedTitle.includes("trust")) {
    if (normalizedLabel.includes("identity")) {
      return "/admin/gurus?trust=identity";
    }

    if (normalizedLabel.includes("background")) {
      return "/admin/gurus?trust=background";
    }

    if (normalizedLabel.includes("safety")) {
      return "/admin/gurus?trust=safety";
    }
  }

  return "/admin/gurus";
}

function DrilldownChartCard({
  title,
  valueLabel,
  items,
  emptyLabel = "No chart data found yet.",
}: {
  title: string;
  valueLabel: string;
  items: ChartItem[];
  emptyLabel?: string;
}) {
  const maxValue = getMaxValue(items);

  return (
    <div className="rounded-[24px] border border-[#edf3ee] bg-[#fbfcf9] p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-base font-black text-slate-950">{title}</h3>
        <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
          {valueLabel}
        </span>
      </div>

      <div className="space-y-4">
        {items.length ? (
          items.map((item, index) => {
            const href = item.href || getDrilldownHref(title, item.label);
            const width = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

            return (
              <Link
                key={`${item.label}-${index}`}
                href={href}
                className="group block rounded-2xl border border-transparent p-2 transition hover:border-green-100 hover:bg-white hover:shadow-sm"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">
                      {item.label}
                    </p>

                    {item.helper ? (
                      <p className="truncate text-xs font-bold text-slate-500">
                        {item.helper}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <p className="text-sm font-black text-green-800">
                      {number(item.value)}
                    </p>

                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-50 text-green-800 transition group-hover:bg-green-800 group-hover:text-white">
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-green-800"
                    style={{ width: `${Math.max(3, width)}%` }}
                  />
                </div>

                <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-green-800 opacity-0 transition group-hover:opacity-100">
                  Drill into records
                </p>
              </Link>
            );
          })
        ) : (
          <div className="rounded-2xl border border-white bg-white p-4 text-sm font-bold text-slate-500">
            {emptyLabel}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GuruReadinessDrilldowns({
  visibilityChart,
  profileChart,
  trustChart,
  exportHref,
}: GuruReadinessDrilldownsProps) {
  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-xl font-black text-slate-950">
            Guru Readiness Charts
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Drill into bookable visibility, profile quality, and trust check
            readiness.
          </p>
        </div>

        <Link
          href={exportHref}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-sm font-black text-white transition hover:bg-green-900"
        >
          <Download size={16} />
          Export
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <DrilldownChartCard
          title="Bookable Visibility"
          valueLabel="Gurus"
          items={visibilityChart}
        />

        <DrilldownChartCard
          title="Profile Quality"
          valueLabel="Gurus"
          items={profileChart}
        />

        <DrilldownChartCard
          title="Trust Checks"
          valueLabel="Ready"
          items={trustChart}
        />
      </div>
    </div>
  );
}