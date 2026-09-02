import Link from "next/link";
import { requireGrowthPortal } from "@/lib/admin/growth/access";
import { listGrowthCampaigns } from "@/lib/admin/growth/data";
import CopyLinkButton from "@/components/admin/growth/CopyLinkButton";
import {
  GrowthCard,
  GrowthPageFrame,
  GrowthPrimaryLink,
  StatusPill,
} from "@/components/admin/growth/GrowthPageFrame";

export const dynamic = "force-dynamic";

export default async function GrowthCampaignsPage() {
  const access = await requireGrowthPortal();
  if (!access.ok) return access.ui;

  const campaigns = await listGrowthCampaigns();

  return (
    <GrowthPageFrame
      title="Campaigns"
      detail="Every real post gets a tracking link. Never send people to a bare SitGuru homepage."
      action={<GrowthPrimaryLink href="/admin/growth/create">New campaign</GrowthPrimaryLink>}
    >
      <div className="space-y-3">
        {campaigns.map((campaign) => (
          <GrowthCard key={campaign.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/growth/campaigns/${campaign.id}`}
                    className="text-lg font-black text-slate-950"
                  >
                    {campaign.name}
                  </Link>
                  <StatusPill value={campaign.status} />
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {campaign.channelLabel}
                  {campaign.market ? ` · ${campaign.market}` : ""}
                </p>
                <p className="mt-2 break-all text-xs font-semibold text-emerald-800">
                  {campaign.trackingUrl}
                </p>
              </div>
              <CopyLinkButton value={campaign.trackingUrl} />
            </div>
          </GrowthCard>
        ))}
        {campaigns.length === 0 ? (
          <GrowthCard>
            <p className="font-semibold text-slate-600">
              No campaigns yet. Create a Guru or Pet Parent post to get a link.
            </p>
          </GrowthCard>
        ) : null}
      </div>
    </GrowthPageFrame>
  );
}
