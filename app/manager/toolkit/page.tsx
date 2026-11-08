import ManagerToolkitHome from "@/components/manager/ManagerToolkitHome";
import { getGrowthHomeStats } from "@/lib/admin/growth/data";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { listBrandAssets, resolveBrandActor } from "@/lib/manager/brand-kit-store";
import { buildManagerToolkit, searchToolkit } from "@/lib/manager/toolkit-catalog";
import { managerWorkLinks } from "@/lib/manager/work-links";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function ManagerToolkitPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const query = first(params.q).slice(0, 80);
  const links = managerWorkLinks(access.actor.email);
  const sections = buildManagerToolkit({
    isSuperUser: access.actor.isSuperUser,
    folders: links.folders,
    teamsHref: links.teamsHref,
  });

  let stats = null;
  let statsError = "";
  try {
    const live = await getGrowthHomeStats();
    stats = {
      petParents: live.petParents,
      gurus: live.gurus,
      ambassadors: live.ambassadors,
      visits: live.visits,
      signups: live.signups,
      conversion: live.conversion,
    };
  } catch {
    statsError = "Live totals could not be loaded. Open Live Results to try again.";
  }

  let assets: Array<{ title: string; href: string; detail: string }> = [];
  let assetError = "";
  const actor = await resolveBrandActor();
  if (actor?.capabilities.viewLibrary) {
    const listed = await listBrandAssets({ actor, query });
    assetError = listed.error;
    assets = listed.assets.map((asset) => ({
      title: asset.title,
      href: `/manager/toolkit/brand#asset-${asset.id}`,
      detail: asset.fileName,
    }));
  }

  return (
    <ManagerToolkitHome
      sections={sections}
      query={query}
      hits={searchToolkit(query, sections, assets)}
      assetError={assetError}
      stats={stats}
      statsError={statsError}
    />
  );
}
