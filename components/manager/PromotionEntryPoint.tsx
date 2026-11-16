import Link from "next/link";

/** Promotion workflow entry shared by the Manager's content-producing and
 * analytics pages. These are links, not automatic social publishing actions. */
export default function PromotionEntryPoint({
  source,
  description,
}: {
  source: string;
  description: string;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between" aria-label="Promote SitGuru content">
      <div>
        <h2 className="text-base font-black text-[#0F2744]">Promote through SitGuru</h2>
        <p className="mt-1 text-sm leading-6 text-slate-700">{description}</p>
        <p className="mt-1 text-xs font-medium text-slate-600">Source: {source} · Ava reviews content before the team publishes. Paid advertising needs separate approval.</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link href="/manager/promotions" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#2563EB] px-4 text-xs font-black text-white">
          Promotion Hub
        </Link>
        <Link href="/manager/campaigns-content" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-blue-200 bg-white px-4 text-xs font-black text-blue-800">
          Content Studio
        </Link>
      </div>
    </section>
  );
}