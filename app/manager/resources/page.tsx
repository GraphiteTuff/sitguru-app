import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import GrowthOneNoteShortcuts from "@/components/admin/growth/GrowthOneNoteShortcuts";
import GrowthSharePointShortcuts from "@/components/admin/growth/GrowthSharePointShortcuts";
import ResourcesBoard from "@/components/portal/ResourcesBoard";
import { isSitGuruWorkEmail } from "@/lib/admin/growth/teams-access";

export const dynamic = "force-dynamic";

export default async function ManagerResourcesPage() {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const showWorkLinks = isSitGuruWorkEmail(access.actor.email);

  return (
    <div className="space-y-5">
      <ResourcesBoard audience="manager" />
      {showWorkLinks ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <GrowthSharePointShortcuts email={access.actor.email} />
          <GrowthOneNoteShortcuts email={access.actor.email} />
        </div>
      ) : null}
    </div>
  );
}
