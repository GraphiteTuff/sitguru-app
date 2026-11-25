import Link from "next/link";
import ReferralGrowthOverview from "@/components/admin/referrals/ReferralGrowthOverview";
import { loadReferralGrowthReport } from "@/lib/referrals/growth-report";
import type { ReferralReportingPeriod } from "@/lib/referrals/reporting-epoch";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";

export const dynamic = "force-dynamic";

export default async function GrowthReferralsPage({ searchParams }: { searchParams?: Promise<{ days?: string; period?: string }> }) {
  const params = searchParams ? await searchParams : {};
  const period: ReferralReportingPeriod =
    
    params.period === "7" || params.days === "7" ? "7" :
    params.period === "30" || params.days === "30" ? "30" :
    params.period === "90" || params.days === "90" ? "90" : "since_reset";
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const report = await loadReferralGrowthReport(period);
  return (
    <main className="mx-auto max-w-[1600px] space-y-4 px-3 py-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black !text-emerald-950">Intern Community Referral Performance</h1>
        <Link href="/intern/growth" className="inline-flex min-h-11 items-center rounded-xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-900">Back to Growth</Link>
      </div>
      <ReferralGrowthOverview report={report} audience="intern" />
    </main>
  );
}
