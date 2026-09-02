import Link from "next/link";
import { requireGrowthPortal } from "@/lib/admin/growth/access";
import { GROWTH_CREATE_KINDS } from "@/lib/admin/growth/constants";
import GrowthWorkForm from "@/components/admin/growth/GrowthWorkForm";
import { GrowthCard, GrowthPageFrame } from "@/components/admin/growth/GrowthPageFrame";

export const dynamic = "force-dynamic";

export default async function GrowthCreatePage({
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
  const access = await requireGrowthPortal();
  if (!access.ok) return access.ui;

  const query = (await searchParams) || {};
  const type = query.type || "post";

  return (
    <GrowthPageFrame
      title="Create"
      detail="Write the post here, copy the tracking link after save, then publish in Canva / CapCut / Meta / TikTok."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {GROWTH_CREATE_KINDS.map((kind) => (
          <Link
            key={kind.value}
            href={`/admin/growth/create?type=${kind.value}`}
            className={`rounded-2xl border p-4 ${
              type === kind.value
                ? "border-emerald-700 bg-emerald-50"
                : "border-emerald-100 bg-white"
            }`}
          >
            <p className="font-black text-slate-950">{kind.label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">{kind.detail}</p>
          </Link>
        ))}
      </div>

      <GrowthCard>
        <GrowthWorkForm
          defaultKind={type}
          defaultTitle={query.title || ""}
          defaultMarket={query.market || ""}
          defaultDestination={query.dest || ""}
          sourceHref={query.href || ""}
        />
      </GrowthCard>
    </GrowthPageFrame>
  );
}
