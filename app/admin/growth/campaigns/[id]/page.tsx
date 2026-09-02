import Link from "next/link";
import { notFound } from "next/navigation";
import { requireGrowthPortal } from "@/lib/admin/growth/access";
import { updateGrowthCampaignStatus } from "@/lib/admin/growth/actions";
import { GROWTH_CAMPAIGN_STATUSES } from "@/lib/admin/growth/constants";
import { getGrowthCampaign } from "@/lib/admin/growth/data";
import CopyLinkButton from "@/components/admin/growth/CopyLinkButton";
import {
  GrowthCard,
  GrowthPageFrame,
  StatusPill,
} from "@/components/admin/growth/GrowthPageFrame";

export const dynamic = "force-dynamic";

export default async function GrowthCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const access = await requireGrowthPortal();
  if (!access.ok) return access.ui;

  const { id } = await params;
  const campaign = await getGrowthCampaign(id);
  if (!campaign) notFound();

  return (
    <GrowthPageFrame
      title={campaign.name}
      detail="Copy this link into Instagram, Facebook, TikTok, or a Facebook group. SitGuru records the click."
    >
      <GrowthCard>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill value={campaign.status} />
          <span className="text-sm font-semibold text-slate-600">
            {campaign.channelLabel}
            {campaign.market ? ` · ${campaign.market}` : ""}
          </span>
        </div>
        <p className="mt-4 break-all text-sm font-black text-emerald-900">
          {campaign.trackingUrl}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <CopyLinkButton value={campaign.trackingUrl} />
          <Link
            href={campaign.destination}
            className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 px-4 text-sm font-black text-emerald-900"
          >
            Open destination
          </Link>
        </div>
        {campaign.notes ? (
          <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
            {campaign.notes}
          </p>
        ) : null}
      </GrowthCard>

      <GrowthCard>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
          Status
        </p>
        <form action={updateGrowthCampaignStatus} className="mt-3 flex flex-wrap gap-2">
          <input type="hidden" name="id" value={campaign.id} />
          {GROWTH_CAMPAIGN_STATUSES.map((status) => (
            <button
              key={status}
              name="status"
              value={status}
              className="min-h-11 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 text-sm font-black capitalize text-emerald-950"
            >
              {status}
            </button>
          ))}
        </form>
      </GrowthCard>
    </GrowthPageFrame>
  );
}
