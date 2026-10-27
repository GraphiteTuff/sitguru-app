import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { InternMessagesPageView } from "@/components/internship/InternSectionPages";

export const dynamic = "force-dynamic";

export default async function InternMessagesPage() {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  return <InternMessagesPageView />;
}
