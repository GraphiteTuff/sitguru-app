import SocialIntelligenceBoard from "@/components/social-intelligence/SocialIntelligenceBoard";
import { currentAssignedIntern, requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { parseFiltersFromSearch } from "@/lib/growth-center-v2/date-range";
import { loadSocialIntelligenceSnapshot } from "@/lib/social-intelligence/dashboard";

export const dynamic = "force-dynamic";

/** Only this intern's published posts and their attributed events are available here. */
export default async function InternSocialIntelligencePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const intern = await currentAssignedIntern();
  if (!intern) {
    return (
      <main className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-[#F4F7FB] px-4 py-8 shadow-sm">
        <h1 className="text-xl font-black text-[#0F2744]">My Content Performance</h1>
        <p className="mt-2 text-sm text-slate-600">Insights become available after you sign in with your assigned internship account and complete onboarding.</p>
      </main>
    );
  }
  const params = searchParams ? await searchParams : {};
  const filters = parseFiltersFromSearch(params);
  const snapshot = await loadSocialIntelligenceSnapshot({ filters, internId: intern.id });
  return <SocialIntelligenceBoard role="intern" snapshot={snapshot} />;
}
