import Link from "next/link";
import type { GrowthPromoteItem } from "@/lib/admin/growth/data";

export default function PromoteList({
  items,
  kind,
  empty,
}: {
  items: GrowthPromoteItem[];
  kind: string;
  empty: string;
}) {
  if (!items.length) {
    return <p className="font-semibold text-slate-600">{empty}</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const createHref = `/admin/growth/create?type=${kind}&title=${encodeURIComponent(
          item.name,
        )}&market=${encodeURIComponent(item.market)}&href=${encodeURIComponent(item.href)}`;

        return (
          <article
            key={item.id}
            className="rounded-[1.4rem] border border-emerald-100 bg-white p-4 shadow-sm"
          >
            <p className="text-lg font-black text-slate-950">{item.name}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">{item.detail}</p>
            {item.market ? (
              <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                {item.market}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={createHref}
                className="inline-flex min-h-11 items-center rounded-2xl px-4 text-sm font-black text-white"
                style={{ background: "#0D5C3A" }}
              >
                Promote
              </Link>
              <Link
                href={item.href}
                className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 px-4 text-sm font-black text-emerald-900"
              >
                View public
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
