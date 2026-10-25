import Link from "next/link";

export type GrowthWeekItem = {
  title: string;
  href: string;
  kind: string;
};

function prettyDay(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Desktop: 7-column week grid.
 * Mobile/tablet portrait: stacked day cards (no cramped 7-col squeeze).
 */
export default function GrowthWeekBoard({
  days,
  today,
  calendarItems,
}: {
  days: string[];
  today: string;
  calendarItems: Map<string, GrowthWeekItem[]>;
}) {
  return (
    <>
      {/* Mobile / narrow: stacked days */}
      <div className="space-y-2 md:hidden">
        {days.map((day) => {
          const items = calendarItems.get(day) || [];
          const isToday = day === today;
          return (
            <div
              key={`m-${day}`}
              className={`rounded-2xl border px-3 py-3 ${
                isToday
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-slate-100 bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-black text-slate-950">
                  {prettyDay(day)}
                  {isToday ? (
                    <span className="ml-2 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                      Today
                    </span>
                  ) : null}
                </p>
                <p className="text-xs font-black text-emerald-800">
                  {items.length ? `${items.length} planned` : "Open"}
                </p>
              </div>
              {items.length ? (
                <ul className="mt-2 space-y-1.5">
                  {items.map((item) => (
                    <li key={`${day}-${item.title}`}>
                      <Link
                        href={item.href}
                        className="block min-h-11 rounded-xl bg-white px-3 py-2 text-sm font-bold text-emerald-900"
                      >
                        <span className="block break-words">{item.title}</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                          {item.kind}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Tablet landscape / desktop: week grid */}
      <div className="hidden grid-cols-7 gap-1.5 md:grid lg:gap-2">
        {days.map((day) => {
          const items = calendarItems.get(day) || [];
          const isToday = day === today;
          return (
            <div
              key={`d-${day}`}
              className={`min-h-[108px] min-w-0 rounded-xl border p-2 lg:min-h-[118px] ${
                isToday
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-slate-100 bg-slate-50"
              }`}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
                {prettyDay(day).split(" ")[0]}
              </p>
              <p className="text-sm font-black text-slate-950">
                {Number(day.slice(8))}
              </p>
              <div className="mt-2 space-y-1">
                {items.slice(0, 2).map((item) => (
                  <p
                    key={`${day}-${item.title}`}
                    className="truncate text-[10px] font-bold text-emerald-800"
                    title={item.title}
                  >
                    {item.title}
                  </p>
                ))}
                {items.length > 2 ? (
                  <p className="text-[10px] font-black text-emerald-700">
                    +{items.length - 2} more
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
