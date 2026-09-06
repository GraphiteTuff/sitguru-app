import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { GrowthCreateScreen } from "@/components/admin/growth/GrowthWorkplacePages";

export const dynamic = "force-dynamic";

export default async function InternGrowthCreatePage({
  searchParams,
}: {
  searchParams?: Promise<{
    type?: string;
    title?: string;
    market?: string;
    dest?: string;
    href?: string;
  }>;
}) {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  return <GrowthCreateScreen workplace={access} searchParams={(await searchParams) || {}} />;
}
