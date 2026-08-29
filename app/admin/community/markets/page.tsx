import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import AdminCommunityMarketsClient from "@/components/admin/community/AdminCommunityMarketsClient";
import { dailySerpBudget } from "@/lib/community/markets";
import {
  backfillDiscoveryPetRelevance,
  countDiscoveriesFoundToday,
  countPartnerEventsPublished,
  countPetRelevantFoundToday,
  ensureCommunityMarketsSeeded,
  getSerpUsageToday,
  listCommunityMarkets,
  refreshMarketDiscoveryCount,
} from "@/lib/community/market-queries";

export const dynamic = "force-dynamic";

export default async function AdminCommunityMarketsPage() {
  const admin = await getAdminIdentity();
  if (!admin?.canAccessAdmin) {
    redirect("/admin/login");
  }

  let markets = await listCommunityMarkets();
  const needsCatalogFix =
    markets.length === 0 ||
    markets.every((m) => m.market_tier === "expansion") ||
    markets.some((m) => !(m.city_anchors || []).length);

  if (needsCatalogFix) {
    await ensureCommunityMarketsSeeded({ forceCatalogSync: true });
    await backfillDiscoveryPetRelevance(500);
    markets = await listCommunityMarkets();
    await Promise.all(
      markets.map((market) => refreshMarketDiscoveryCount(market.id)),
    );
    markets = await listCommunityMarkets();
  }

  const [usage, partnerEvents, communityEventsToday, petRelevantToday] =
    await Promise.all([
      getSerpUsageToday(),
      countPartnerEventsPublished(),
      countDiscoveriesFoundToday(),
      countPetRelevantFoundToday(),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/admin/community/events"
            className="text-sm font-black text-emerald-800"
          >
            ← Community Events
          </Link>
          <p className="mt-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
            Admin • Discovery Markets
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            Community Markets
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-600">
            Smart geographic growth for SerpApi discovery across PA/NJ. Partner-published
            SitGuru events stay separate and always keep visual priority.
          </p>
        </div>
        <Link
          href="/admin/community/events/featured"
          className="inline-flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-800"
        >
          Featured manager
        </Link>
      </div>

      <AdminCommunityMarketsClient
        markets={markets}
        usage={usage}
        summary={{
          partnerEvents,
          communityEventsToday,
          petRelevantToday,
          dailyBudget: dailySerpBudget(),
        }}
      />
    </div>
  );
}
