import { supabaseAdmin } from "@/lib/supabase/admin";
import { canReadPrivateInternRecord, type InternshipActorKind } from "@/lib/internship/manager-access";
import { getUniversity, listInterns } from "@/lib/internship/queries";
import { campusMissionIsVisible, summarizeCampusActivity } from "@/lib/internship/campus-growth";
import type { InternshipIntern } from "@/lib/internship/types";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function rows(data: unknown) {
  return (Array.isArray(data) ? data : []) as Record<string, unknown>[];
}

export type CampusOpportunity = {
  id: string;
  internId: string;
  title: string;
  type: string;
  description: string;
  sourceUrl: string;
  contactName: string;
  contactOrganization: string;
  happensOn: string;
  location: string;
  goal: string;
  rulesNotes: string;
  approval: string;
  avaReview: string;
  jasonReview: string;
  status: string;
};

export type CampusLead = {
  id: string;
  internId: string;
  name: string;
  type: string;
  organization: string;
  status: string;
  notes: string;
  followUp: string;
  updatedAt: string;
};

export type CampusLink = {
  id: string;
  internId: string;
  code: string;
  campaign: string;
  channel: string;
  target: string;
  visits: number;
  scans: number;
};

export type CampusMission = {
  id: string;
  internId: string;
  title: string;
  status: string;
  dueOn: string;
};

export type CampusResult = {
  id: string;
  internId: string;
  lesson: string;
  recommendation: string;
  reportedPetParents: number;
  reportedGuruApplications: number;
  reportedBookings: number;
  recordedAt: string;
};

export type CampusSourceKey = "profiles" | "opportunities" | "leads" | "links" | "visits" | "results" | "missions";
export type CampusSourceHealth = Record<CampusSourceKey, boolean>;

export type CampusCard = {
  universityId: string;
  internId: string;
  internName: string;
  avatarUrl: string;
  campusName: string;
  semester: string;
  status: string;
  policyNotes: string;
  marketNotes: string;
  trackingLinks: number;
  missionCount: number;
  reportedResults: number;
  opportunities: number;
  activeCampaigns: number;
  upcomingEvents: number;
  visits: number;
  scans: number;
  leads: number;
  petParents: number;
  guruApplications: number;
};

function todayKey() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

function mapOpportunity(row: Record<string, unknown>): CampusOpportunity {
  return {
    id: text(row.id),
    internId: text(row.intern_id),
    title: text(row.title),
    type: text(row.opportunity_type),
    description: text(row.description),
    sourceUrl: text(row.source_url),
    contactName: text(row.contact_name),
    contactOrganization: text(row.contact_organization),
    happensOn: text(row.happens_on),
    location: text(row.location),
    goal: text(row.potential_goal),
    rulesNotes: text(row.rules_notes),
    approval: text(row.approval) || "needs_research",
    avaReview: text(row.ava_review),
    jasonReview: text(row.jason_review),
    status: text(row.status) || "Idea",
  };
}

export async function loadCampusGrowth(input: {
  actor: InternshipActorKind;
  actorUserId: string;
  actorInternId?: string | null;
}) {
  const interns = (await listInterns()).filter((intern) => canReadPrivateInternRecord({
    actor: input.actor,
    actorUserId: input.actorUserId,
    actorInternId: input.actorInternId,
    targetInternId: intern.id,
    managerUserId: intern.managerUserId,
  }));
  const ids = interns.map((intern) => intern.id);
  if (!ids.length) {
    return {
      cards: [] as CampusCard[], opportunities: [] as CampusOpportunity[],
      leads: [] as CampusLead[], links: [] as CampusLink[],
      missions: [] as CampusMission[], results: [] as CampusResult[],
      sourceHealth: { profiles:true, opportunities:true, leads:true, links:true, visits:true, results:true, missions:true } as CampusSourceHealth,
      sourceIssues: [] as string[], interns,
    };
  }
  const [universities, profiles, opportunities, leads, links, visits, results, tasks] = await Promise.all([
    Promise.all(interns.map(async (intern) => ({ id: intern.universityId, school: intern.universityId ? await getUniversity(intern.universityId) : null }))),
    supabaseAdmin.from("campus_growth_profiles").select("intern_id,status,policy_notes,market_notes").in("intern_id", ids),
    supabaseAdmin.from("campus_growth_opportunities").select("*").in("intern_id", ids).order("created_at", { ascending: false }),
    supabaseAdmin.from("campus_growth_leads").select("*").in("intern_id", ids).order("created_at", { ascending: false }),
    supabaseAdmin.from("campus_growth_links").select("*").in("intern_id", ids).order("created_at", { ascending: false }),
    supabaseAdmin.from("campus_growth_visits").select("intern_id,link_id,kind").in("intern_id", ids),
    supabaseAdmin.from("campus_growth_results").select("id,intern_id,pet_parent_registrations,guru_applications,bookings,lesson,recommendation,created_at").in("intern_id", ids),
    supabaseAdmin.from("internship_tasks").select("id,intern_id,title,status,due_on,metric_affected,brief_payload").in("intern_id", ids),
  ]);
  const sourceResponses = { profiles, opportunities, leads, links, visits, results, missions:tasks };
  const sourceLabels: Record<CampusSourceKey,string> = {
    profiles:"Campus notes", opportunities:"Opportunities", leads:"Leads",
    links:"Tracking links", visits:"Tracked visits and QR scans",
    results:"Reported outcomes", missions:"Campus missions",
  };
  const sourceHealth = Object.fromEntries(
    (Object.keys(sourceLabels) as CampusSourceKey[]).map(key => [key, !sourceResponses[key].error])
  ) as CampusSourceHealth;
  const sourceIssues = (Object.keys(sourceLabels) as CampusSourceKey[])
    .filter(key => !sourceHealth[key])
    .map(key => sourceLabels[key]);
  if (sourceIssues.length) {
    console.error("[campus growth] unavailable data sources", sourceIssues.join(", "));
  }
  const schoolName = new Map(universities.map((row) => [row.id, row.school?.displayName || row.school?.name || "Campus not on file"]));
  const profileByIntern = new Map(rows(profiles.data).map((row) => [text(row.intern_id), row]));
  const opportunityRows = rows(opportunities.data).map(mapOpportunity);
  const leadRows: CampusLead[] = rows(leads.data).map((row) => ({
    id: text(row.id),
    internId: text(row.intern_id),
    name: text(row.name),
    type: text(row.lead_type),
    organization: text(row.organization),
    status: text(row.status) || "New",
    notes: text(row.notes),
    followUp: text(row.follow_up),
    updatedAt: text(row.updated_at),
  }));
  const trackedVisits=rows(visits.data);
  const linkRows: CampusLink[] = rows(links.data).map((row) => ({
    id: text(row.id),
    internId: text(row.intern_id),
    code: text(row.code),
    campaign: text(row.campaign_label),
    channel: text(row.channel),
    target: text(row.target_type),
    visits: trackedVisits.filter(visit => text(visit.link_id) === text(row.id) && text(visit.kind) !== "qr_scan").length,
    scans: trackedVisits.filter(visit => text(visit.link_id) === text(row.id) && text(visit.kind) === "qr_scan").length,
  }));
  const resultRows: CampusResult[] = rows(results.data).map(row => ({
    id:text(row.id),internId:text(row.intern_id),
    lesson:text(row.lesson),recommendation:text(row.recommendation),
    reportedPetParents:Math.max(0,Number(row.pet_parent_registrations||0)||0),
    reportedGuruApplications:Math.max(0,Number(row.guru_applications||0)||0),
    reportedBookings:Math.max(0,Number(row.bookings||0)||0),
    recordedAt:text(row.created_at),
  }));
  const missionRows: CampusMission[] = rows(tasks.data).filter((row) => {
    const brief = row.brief_payload && typeof row.brief_payload === "object" ? row.brief_payload as Record<string, unknown> : {};
    return text(row.metric_affected) === "Campus Growth" || brief.campusMission === true || text(brief.category) === "Campus Growth";
  }).map((row) => ({
    id: text(row.id),
    internId: text(row.intern_id),
    title: text(row.title),
    status: text(row.status),
    dueOn: text(row.due_on),
  }));
  const today = todayKey();
  const cards = interns.map((intern) => {
    const profile = profileByIntern.get(intern.id);
    const mineOpps = opportunityRows.filter((row) => row.internId === intern.id);
    const mineMissions = missionRows.filter((row) => row.internId === intern.id);
    const mineVisits = rows(visits.data).filter((row) => text(row.intern_id) === intern.id);
    const mineResults = rows(results.data).filter((row) => text(row.intern_id) === intern.id);
    const summary = summarizeCampusActivity({
      opportunities: mineOpps.map((row) => ({ status: row.status, happensOn: row.happensOn })),
      missions: mineMissions,
      leads: leadRows.filter((row) => row.internId === intern.id).length,
      visits: mineVisits.filter((row) => text(row.kind) !== "qr_scan").length,
      scans: mineVisits.filter((row) => text(row.kind) === "qr_scan").length,
      petParents: mineResults.reduce((sum, row) => sum + Number(row.pet_parent_registrations || 0), 0),
      guruApplications: mineResults.reduce((sum, row) => sum + Number(row.guru_applications || 0), 0),
      today,
    });
    return {
      universityId: intern.universityId || "",
      internId: intern.id,
      internName: intern.preferredName || intern.fullName,
      avatarUrl: intern.avatarUrl || "",
      campusName: schoolName.get(intern.universityId) || "Campus not on file",
      semester: intern.semester || "",
      status: text(profile?.status) || (intern.status === "active" ? "Active" : intern.status || "Active"),
      policyNotes: text(profile?.policy_notes),
      marketNotes: text(profile?.market_notes),
      trackingLinks: linkRows.filter(link => link.internId === intern.id).length,
      missionCount: mineMissions.length,
      reportedResults: resultRows.filter(result => result.internId === intern.id).length,
      opportunities: summary.opportunities,
      activeCampaigns: summary.activeCampaigns,
      upcomingEvents: summary.upcomingEvents,
      visits: summary.visits,
      scans: summary.scans,
      leads: summary.leads,
      petParents: summary.petParents,
      guruApplications: summary.guruApplications,
    } satisfies CampusCard;
  });
  return {
    cards, opportunities: opportunityRows, leads: leadRows,
    links: linkRows, results: resultRows,
    missions: missionRows.filter(row => input.actor !== "intern" || campusMissionIsVisible(row.status)),
    sourceHealth, sourceIssues, interns,
  };
}

export function campusReportTotals(cards: CampusCard[], missions: CampusMission[]) {
  const visible = missions.filter((row) => campusMissionIsVisible(row.status));
  const top = [...cards].sort((a, b) => b.visits + b.scans - (a.visits + a.scans))[0];
  return {
    campuses: cards.length,
    campaigns: visible.length,
    visits: cards.reduce((sum, row) => sum + row.visits, 0),
    scans: cards.reduce((sum, row) => sum + row.scans, 0),
    leads: cards.reduce((sum, row) => sum + row.leads, 0),
    petParents: cards.reduce((sum, row) => sum + row.petParents, 0),
    guruApplications: cards.reduce((sum, row) => sum + row.guruApplications, 0),
    events: cards.reduce((sum, row) => sum + row.upcomingEvents, 0),
    topCampus: top?.campusName || "",
    topCampaign: visible[0]?.title || "",
  };
}

export type { InternshipIntern };
