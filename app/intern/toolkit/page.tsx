import { redirect } from "next/navigation";
import { getGrowthHomeStats, listGrowthCampaigns } from "@/lib/admin/growth/data";
import { listBrandAssets, resolveBrandActor } from "@/lib/manager/brand-kit-store";
import type { InternBrandCard } from "@/components/internship/InternBrandLibrary";
import {
  listGrowthInitiatives,
  listGrowthIntelligence,
} from "@/lib/admin/growth/outcomes";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import InternToolkitHome from "@/components/internship/InternToolkitHome";
import SharedTeamToolkitAssets from "@/components/portal/SharedTeamToolkitAssets";
import InternToolkitToolView from "@/components/internship/InternToolkitToolView";
import { loadInternSectionWorkspace } from "@/lib/internship/intern-section-data";
import { listInternPromoteEvents } from "@/lib/internship/intern-promote-events";
import { INTERN_HOME_TOOLS, type InternHomeToolId } from "@/lib/internship/intern-tools";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

function isTool(value: string): value is InternHomeToolId {
  return INTERN_HOME_TOOLS.some((tool) => tool.id === value);
}

function weekLabel(now = new Date()) {
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  const fmt = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `This Week (${fmt(start)} – ${fmt(now)}, ${now.getFullYear()})`;
}

export default async function InternToolkitPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const requested = first(params.tool);
  if (requested === "brand") {
    const next = new URLSearchParams();
    for (const field of ["q", "category", "sort", "page"]) {
      const value = first(params[field]).slice(0, 120);
      if (value) next.set(field, value);
    }
    const qs = next.toString();
    redirect(qs ? `/intern/toolkit/brand?${qs}` : "/intern/toolkit/brand");
  }
  const notice = first(params.ok) || first(params.error);
  const noticeError = Boolean(first(params.error));
  const section = await loadInternSectionWorkspace();

  if (isTool(requested)) {
    if (!section) {
      return (
        <div className="mx-auto max-w-lg rounded-[1.75rem] border border-amber-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black text-slate-950">Toolkit needs an assigned intern</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Brand kit, tracking links, and the market snapshot open on an assigned internship login.
          </p>
        </div>
      );
    }
    const events = await listInternPromoteEvents();
    const brandQuery = first(params.q);
    const brandCategory = first(params.category);
    const brandPage = Number(first(params.page) || 1);
    let brandLibrary: {
      assets: InternBrandCard[];
      total: number;
      page: number;
      pages: number;
      loadError: string;
      query: string;
      category: string;
    } | undefined;
    if (requested === "brand") {
      const actor = await resolveBrandActor();
      if (actor?.capabilities.viewApproved) {
        const listed = await listBrandAssets({
          actor,
          status: "approved",
          query: brandQuery,
          category: brandCategory,
          page: brandPage,
          pageSize: 12,
          sort: "approved_first",
        });
        brandLibrary = {
          assets: listed.assets.map((asset) => ({
            id: asset.id,
            title: asset.title,
            category: asset.category,
            fileName: asset.fileName,
            mimeType: asset.mimeType,
            fileSize: asset.fileSize,
            previewKind: asset.previewKind,
          })),
          total: listed.total,
          page: listed.page,
          pages: listed.pages,
          loadError: listed.error,
          query: brandQuery,
          category: brandCategory,
        };
      } else {
        brandLibrary = {
          assets: [],
          total: 0,
          page: 1,
          pages: 1,
          loadError: "Approved brand files are not available on this login.",
          query: brandQuery,
          category: brandCategory,
        };
      }
    }
    return (
      <div className="space-y-3">
        {notice ? (
          <p
            role={noticeError ? "alert" : "status"}
            className={`rounded-2xl px-4 py-3 text-sm font-bold ${noticeError ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-900"}`}
          >
            {notice}
          </p>
        ) : null}
        <InternToolkitToolView
          data={section.workspace}
          events={events}
          tool={requested}
          preview={Boolean(first(params.view))}
          brandLibrary={brandLibrary}
        />
      </div>
    );
  }

  const brandActor = await resolveBrandActor();
  const approved = brandActor?.capabilities.viewApproved
    ? await listBrandAssets({ actor: brandActor, status: "approved", pageSize: 6 })
    : { assets: [], total: 0, error: "Approved brand files require a completed internship onboarding." };

  const [stats, events, campaigns, initiatives, insights] = await Promise.all([
    getGrowthHomeStats(),
    listInternPromoteEvents(),
    listGrowthCampaigns(),
    listGrowthInitiatives(4),
    listGrowthIntelligence(1),
  ]);

  return (
    <InternToolkitHome
      stats={stats}
      weekLabel={weekLabel()}
      events={events}
      campaigns={campaigns}
      initiatives={initiatives}
      insight={insights[0] || null}
      sharedAssets={<SharedTeamToolkitAssets role="intern" assets={approved.assets} total={approved.total} error={approved.error} />}
    />
  );
}
