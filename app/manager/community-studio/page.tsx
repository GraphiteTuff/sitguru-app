import PromotionEntryPoint from "@/components/manager/PromotionEntryPoint";
import CommunityStudioBoard from "@/components/community-studio/CommunityStudioBoard";
import CommunityWorkLinks from "@/components/community-studio/CommunityWorkLinks";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadCommunityWorkspace } from "@/lib/community-studio/actions";

export const dynamic = "force-dynamic";

export default async function ManagerCommunityStudioPage() {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const workspace = await loadCommunityWorkspace("manager");
  return <div className="space-y-5"><CommunityStudioBoard workspace={workspace} /><PromotionEntryPoint source="Community Studio" description="Only stories with explicit social reuse permission and all required Pet Parent approvals can become external social campaigns." /><CommunityWorkLinks mode="manager" /></div>;
}
