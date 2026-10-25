import { NextResponse } from "next/server";
import { canUseGrowthPortal } from "@/lib/admin/growth/access";
import {
  getGrowthHomeStats,
  listGrowthCampaigns,
  listUpcomingGrowthEvents,
} from "@/lib/admin/growth/data";
import {
  listGrowthEventResults,
  listGrowthInitiatives,
  listGrowthIntelligence,
} from "@/lib/admin/growth/outcomes";
import { listGrowthTeamSummary } from "@/lib/admin/growth/team-summary";
import {
  getGrowthResourceLinks,
  GROWTH_OPERATING_LOOP,
  GROWTH_RESPONSIBILITY_MAP,
} from "@/lib/admin/growth/operating-model";
import { getAdminIdentity } from "@/lib/admin/access";
import { currentAssignedIntern } from "@/lib/admin/growth/workplace";

/**
 * Device-agnostic Growth Workspace snapshot (measurement layer).
 * Does not sync Microsoft Graph / Planner / Teams.
 * Shared by responsive web/PWA and future SitGuru Mobile.
 */
export async function GET() {
  const intern = await currentAssignedIntern();
  const admin = await getAdminIdentity();

  if (!intern && !canUseGrowthPortal(admin)) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const actorKind = intern ? "intern" : "admin";
  const [
    stats,
    campaigns,
    upcomingEvents,
    eventResults,
    intelligence,
    initiatives,
    team,
  ] = await Promise.all([
    getGrowthHomeStats(),
    listGrowthCampaigns(),
    listUpcomingGrowthEvents(8),
    listGrowthEventResults(12),
    listGrowthIntelligence(12),
    listGrowthInitiatives(8),
    actorKind === "admin" && admin
      ? listGrowthTeamSummary({
          actorUserId: admin.id,
          isSuperUser: admin.isSuperUser,
        })
      : Promise.resolve([]),
  ]);

  const permissions = {
    canRecordEventResults: actorKind === "admin",
    canRecordIntelligence: true,
    canManageTeam: actorKind === "admin",
    canApproveContent: Boolean(admin?.isSuperUser),
    canCreateTrackingLinks: true,
    // Explicit non-capabilities — owned elsewhere
    ownsPlannerTasks: false,
    ownsTeamsChat: false,
    ownsInternAcademicRecord: false,
  };

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    operatingModel: {
      summary:
        "Teams = communicate. Planner = manage work. Growth Workspace = measure growth.",
      loop: GROWTH_OPERATING_LOOP,
      responsibilities: GROWTH_RESPONSIBILITY_MAP,
      microsoftGraphSync: "future_enhancement_only",
    },
    actor: {
      kind: actorKind,
      isSuperUser: Boolean(admin?.isSuperUser),
    },
    permissions,
    resources: getGrowthResourceLinks({ intern: actorKind === "intern" }),
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
    initiatives: initiatives.map((item) => ({
      id: item.id,
      name: item.name,
      purpose: item.purpose,
      status: item.status,
      market: item.market,
    })),
    campaigns: campaigns.slice(0, 12).map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      channel: campaign.channelLabel,
      market: campaign.market,
      trackingUrl: campaign.trackingUrl,
    })),
    upcomingEvents: upcomingEvents.map((event) => ({
      id: event.id,
      name: event.name,
      detail: event.detail,
      href: event.href,
      market: event.market,
      startAt: event.startAt,
    })),
    eventResults: eventResults.map((result) => ({
      id: result.id,
      eventName: result.eventName,
      eventDate: result.eventDate,
      totalLeads: result.totalLeads,
      totalRegistrations: result.totalRegistrations,
      conversionRate: result.conversionRate,
      lessonsLearned: result.lessonsLearned,
      recommendedNextAction: result.recommendedNextAction,
      leadsMetricSource: result.leadsMetricSource,
      registrationsMetricSource: result.registrationsMetricSource,
      qrScansMetricSource: result.qrScansMetricSource,
    })),
    intelligence: intelligence.map((entry) => ({
      id: entry.id,
      title: entry.title,
      studyType: entry.studyType,
      responseCount: entry.responseCount,
      keyFinding: entry.keyFinding,
      recommendation: entry.recommendation,
      actionTaken: entry.actionTaken,
    })),
    team: team.map((member) => ({
      id: member.id,
      name: member.name,
      statusLabel: member.statusLabel,
      school: member.school,
      hoursSubmitted: member.hoursSubmitted,
      hoursApproved: member.hoursApproved,
      managerDeskHref: member.managerDeskHref,
    })),
  });
}
