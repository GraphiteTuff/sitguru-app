import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { GrowthCreateScreen } from "@/components/admin/growth/GrowthWorkplacePages";

export const dynamic = "force-dynamic";

export default async function ManagerCreatePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v || "");
  return (
    <GrowthCreateScreen
      workplace={access}
      searchParams={{
        type: first(params.type),
        title: first(params.title),
        market: first(params.market),
        dest: first(params.dest),
        href: first(params.href),
      }}
    />
  );
}
