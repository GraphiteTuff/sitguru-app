import { NextResponse } from "next/server";
import { canUseGrowthPortal } from "@/lib/admin/growth/access";
import {
  getGrowthHomeStats,
  listGrowthCampaigns,
  listGrowthContent,
  listUpcomingGrowthEvents,
} from "@/lib/admin/growth/data";
import { getAdminIdentity } from "@/lib/admin/access";
import { currentAssignedIntern } from "@/lib/admin/growth/workplace";

/**
 * Device-agnostic Growth Workspace snapshot.
 * Shared by the responsive web/PWA UI and future SitGuru Mobile clients.
 * Authorization mirrors requireGrowthWorkplace — not tied to React layout.
 */
export async function GET() {
  const intern = await currentAssignedIntern();
  const admin = await getAdminIdentity();

  if (!intern && !canUseGrowthPortal(admin)) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const [stats, campaigns, content, upcomingEvents] = await Promise.all([
    getGrowthHomeStats(),
    listGrowthCampaigns(),
    listGrowthContent(),
    listUpcomingGrowthEvents(8),
  ]);

  const actorKind = intern ? "intern" : "admin";
  const permissions = {
    canRecordEventLeads: actorKind === "admin",
    canManageTeam: actorKind === "admin",
    canApproveContent: Boolean(admin?.isSuperUser),
    canCreateCampaigns: true,
    canPromoteEvents: true,
  };

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    actor: {
      kind: actorKind,
      isSuperUser: Boolean(admin?.isSuperUser),
    },
    permissions,
    kpis: {
      petParents: stats.petParents,
      gurus: stats.gurus,
      ambassadors: stats.ambassadors,
      referrals: stats.referrals,
      visits: stats.visits,
      signups: stats.signups,
      conversion: stats.conversion,
      campaigns: stats.campaigns,
      pendingReview: stats.pendingReview,
    },
    trends: stats.trends,
    campaigns: campaigns.slice(0, 12).map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      channel: campaign.channelLabel,
      market: campaign.market,
      trackingUrl: campaign.trackingUrl,
    })),
    content: content.slice(0, 20).map((item) => ({
      id: item.id,
      title: item.title,
      platform: item.platform,
      status: item.status,
      plannedDate: item.plannedDate,
    })),
    upcomingEvents: upcomingEvents.map((event) => ({
      id: event.id,
      name: event.name,
      detail: event.detail,
      href: event.href,
      market: event.market,
      startAt: event.startAt,
    })),
  });
}
