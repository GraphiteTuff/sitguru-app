import { MapPinned } from "lucide-react";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadMarketDensity } from "@/lib/admin/load-market-density";
import MarketGrowthBoard from "@/components/admin/MarketGrowthBoard";
import DeskPageHero from "@/components/manager/DeskPageHero";

export const dynamic = "force-dynamic";

export default async function ManagerMarketDensityPage() {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const { markets, summary, issues } = await loadMarketDensity();
  return (
    <div className="space-y-5 pb-28 lg:pb-8">
      <DeskPageHero icon={<MapPinned size={22} />} title="Market Density" subtitle="Find the markets where care supply and pet parent demand can grow together." quote={"Local insight.\nStronger communities."} />
      <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-medium leading-6 text-emerald-950">
        <p>Marketplace intelligence from Guru, Pet Parent, Ambassador, and booking records. Launch ready means at least 2 bookable Gurus and 5 Pet Parents in the same market.</p>
        <p className="mt-2 text-xs text-emerald-800">Map locations represent markets. Counts are aggregated; individual addresses and identities are not shared.</p>
      </section>
      {issues.length ? <p role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">Some market sources are unavailable or incomplete: {issues.join("; ")}. Resolve these sources before using the counts for spending decisions.</p> : null}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><MarketGrowthBoard markets={markets.map((market) => ({ ...market, latitude: market.latitude == null ? null : Math.round(market.latitude * 100) / 100, longitude: market.longitude == null ? null : Math.round(market.longitude * 100) / 100 }))} summary={summary} /></section>
    </div>
  );
}
