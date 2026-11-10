import CommunityStudioBoard from "@/components/community-studio/CommunityStudioBoard";
import CommunityWorkLinks from "@/components/community-studio/CommunityWorkLinks";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadCommunityWorkspace } from "@/lib/community-studio/actions";

export const dynamic = "force-dynamic";

export default async function ManagerCommunityStudioPage() {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const workspace = await loadCommunityWorkspace("manager");
  return <div className="space-y-5"><CommunityStudioBoard workspace={workspace} /><CommunityWorkLinks mode="manager" /></div>;
}
