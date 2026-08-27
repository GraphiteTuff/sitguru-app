import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadMarketDensity } from "@/lib/admin/load-market-density";
import MarketGrowthBoard from "@/components/admin/MarketGrowthBoard";

export const dynamic = "force-dynamic";

export default async function AdminMarketGrowthPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { markets, summary } = await loadMarketDensity();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section
          className="public-dark-section overflow-hidden rounded-[32px] bg-[#0D5C3A] p-6 text-white shadow-xl sm:p-8"
          data-brand-green
        >
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-100">
            SitGuru Admin · Growth
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] !text-white sm:text-5xl">
            SitGuru Market Density
          </h1>
          <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-emerald-50 sm:text-base">
            Spend marketing dollars where the marketplace can convert: bookable
            Gurus plus Pet Parents in the same ZIP. This is not a Guru list —
            it is launch readiness by market.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/admin"
              className="inline-flex min-h-11 items-center rounded-2xl bg-white px-4 py-2 text-sm font-black text-emerald-950"
            >
              Operations Dashboard
            </Link>
            <Link
              href="/admin/sales-marketing"
              className="inline-flex min-h-11 items-center rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-black !text-white"
            >
              Sales & Marketing
            </Link>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <MarketGrowthBoard markets={markets} summary={summary} />
        </section>
      </div>
    </main>
  );
}
