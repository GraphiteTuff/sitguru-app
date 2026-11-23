import Link from "next/link";
import SocialIntelligenceBoard from "@/components/social-intelligence/SocialIntelligenceBoard";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { parseFiltersFromSearch } from "@/lib/growth-center-v2/date-range";
import { loadSocialIntelligenceSnapshot } from "@/lib/social-intelligence/dashboard";

export const dynamic = "force-dynamic";

/** Admin HQ receives the same verified metrics as Manager and native mobile. */
export default async function AdminSocialIntelligencePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("admin");
  if (!access.ok) return access.ui;
  if (!access.actor.isSuperUser) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-xl font-black text-slate-950">Admin analytics restricted</h1>
        <p className="mt-2 text-sm text-slate-700">Open the Manager Portal to view authorized team results.</p>
        <Link href="/manager/metrics?view=social-intelligence" className="mt-3 inline-flex rounded-xl border border-slate-200 px-4 py-3 text-emerald-900">Manager insights</Link>
      </main>
    );
  }
  const params = searchParams ? await searchParams : {};
  const filters = parseFiltersFromSearch(params);
  const snapshot = await loadSocialIntelligenceSnapshot({ filters });
  return <SocialIntelligenceBoard role="admin" snapshot={snapshot} />;
}
