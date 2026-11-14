import GrowthOneNoteShortcuts from "@/components/admin/growth/GrowthOneNoteShortcuts";
import GrowthSharePointShortcuts from "@/components/admin/growth/GrowthSharePointShortcuts";
import ManagerResourceLibrary from "@/components/manager/ManagerResourceLibrary";
import SharedTeamToolkitAssets from "@/components/portal/SharedTeamToolkitAssets";
import { listBrandAssets, resolveBrandActor } from "@/lib/manager/brand-kit-store";
import { isSitGuruWorkEmail } from "@/lib/admin/growth/teams-access";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { buildManagerResources, searchResources } from "@/lib/manager/resource-catalog";
import { managerWorkLinks } from "@/lib/manager/work-links";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function ManagerResourcesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const query = first(params.q).slice(0, 80);
  const links = managerWorkLinks(access.actor.email);
  const groups = searchResources(
    query,
    buildManagerResources({
      isSuperUser: access.actor.isSuperUser,
      folders: links.folders,
      teamsHref: links.teamsHref,
    }),
  );
  const showWorkLinks = isSitGuruWorkEmail(access.actor.email);
  const brandActor = await resolveBrandActor();
  const approved = brandActor?.capabilities.viewApproved
    ? await listBrandAssets({ actor: brandActor, status: "approved", pageSize: 6 })
    : { assets: [], total: 0, error: "Approved files are not available on this account." };

  return (
    <div className="space-y-5">
      <SharedTeamToolkitAssets role="manager" assets={approved.assets} total={approved.total} error={approved.error} />
    <ManagerResourceLibrary groups={groups} query={query} empty={Boolean(query) && groups.length === 0}>
      {showWorkLinks ? (
        <>
          <GrowthSharePointShortcuts email={access.actor.email} />
          <GrowthOneNoteShortcuts email={access.actor.email} />
        </>
      ) : (
        <p className="text-sm font-semibold text-slate-600">
          SharePoint and OneNote stay closed until this account uses an @sitguru.com work email. Nothing is copied into SitGuru.
        </p>
      )}
    </ManagerResourceLibrary>
    </div>
  );
}
