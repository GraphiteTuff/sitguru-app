import Link from "next/link";
import ReferralGrowthOverview from "@/components/admin/referrals/ReferralGrowthOverview";
import { loadReferralGrowthReport } from "@/lib/referrals/growth-report";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";

export const dynamic = "force-dynamic";

export default async function GrowthReferralsPage() {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const report = await loadReferralGrowthReport(30);
  return (
    <main className="mx-auto max-w-[1600px] space-y-4 px-3 py-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black !text-emerald-950">Manager Referral Performance</h1>
        <Link href="/manager/metrics" className="inline-flex min-h-11 items-center rounded-xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-900">Back to Growth</Link>
      </div>
      <ReferralGrowthOverview report={report} audience="manager" />
    </main>
  );
}
