import CommunityStudioBoard from "@/components/community-studio/CommunityStudioBoard";
import CommunityWorkLinks from "@/components/community-studio/CommunityWorkLinks";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadCommunityWorkspace } from "@/lib/community-studio/actions";

export const dynamic = "force-dynamic";

export default async function InternCommunityStudioPage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const workspace = await loadCommunityWorkspace("intern");
  return <div className="space-y-5"><CommunityStudioBoard workspace={workspace} mode="intern" /><CommunityWorkLinks mode="intern" /></div>;
}
