import { routeAssignmentCategory, type AssignmentWorkRoute } from "@/lib/admin/growth/work-routing";
import { assignmentIsVisibleToIntern, type AssignmentDraft } from "@/lib/internship/manager-assignment";
import type { InternshipActorKind } from "@/lib/internship/manager-access";

export const CAMPUS_OPPORTUNITY_TYPES = [
  "Student Organization",
  "Campus Event",
  "Community Event",
  "Tabling Opportunity",
  "Flyer / Poster Opportunity",
  "Digital Display",
  "Social Media",
  "Student Newsletter",
  "Campus Media",
  "Pet-related Club",
  "Pre-Vet Club",
  "Volunteer Organization",
  "Rescue / Shelter",
  "Local Pet Business",
  "Veterinary Practice",
  "Community Organization",
  "Future Guru Recruiting",
  "Pet Parent Awareness",
  "Partnership Opportunity",
  "Other",
] as const;

export const CAMPUS_OPPORTUNITY_STATUSES = [
  "Idea",
  "Researching",
  "Needs Ava Review",
  "Approval Required",
  "Approved",
  "Scheduled",
  "Active",
  "Completed",
  "Not Pursuing",
] as const;

export const CAMPUS_APPROVALS = [
  "approved",
  "ava_review",
  "university_approval",
  "jason_review",
  "not_permitted",
  "needs_research",
] as const;

export type CampusApproval = (typeof CAMPUS_APPROVALS)[number];

export const CAMPUS_LEAD_TYPES = [
  "Pet Parent",
  "Future Guru",
  "Student Organization",
  "Campus Department",
  "Pet Business",
  "Veterinary Practice",
  "Rescue",
  "Shelter",
  "Community Organization",
  "Ambassador Candidate",
  "Event",
  "Partnership",
  "Media",
  "Other",
] as const;

export const CAMPUS_PHASES = ["explore", "recommend", "approval", "execute", "measure", "learn"] as const;
export type CampusPhase = (typeof CAMPUS_PHASES)[number];

export const CAMPUS_TARGETS = [
  "pet_parent",
  "future_guru",
  "petperks",
  "event",
  "partnership",
  "social",
  "awareness",
] as const;

export const CAMPUS_CHANNELS = ["qr", "link", "instagram", "facebook", "tiktok", "x", "youtube", "event", "flyer"] as const;

export const CAMPUS_GROWTH_PRINCIPLE =
  "Your campus can be a real market for SitGuru — but the goal is not to spam people or simply distribute links. Research the community, identify genuine opportunities, follow university rules, use approved SitGuru messaging, measure results, and tell us what you learned.";

export const CAMPUS_COACHING_PROMPTS = [
  "What did the intern discover?",
  "What is their recommended approach?",
  "What evidence supports it?",
  "What approval is required?",
  "What outcome are we testing?",
  "What did we learn?",
  "What should we change next?",
] as const;

export const CAMPUS_MISSION_CHECKLIST = [
  "Research campus opportunities",
  "Identify university requirements",
  "Submit proposal to Ava",
  "Create approved materials",
  "Launch campaign",
  "Record QR and link performance",
  "Capture leads",
  "Submit results",
  "Write recommendation",
] as const;

const APPROVAL_LABELS: Record<CampusApproval, { label: string; tone: string }> = {
  approved: { label: "Approved", tone: "bg-[#DCFCE7] text-[#166534]" },
  ava_review: { label: "Ava Review Required", tone: "bg-[#DBEAFE] text-[#1D4ED8]" },
  university_approval: { label: "University Approval Required", tone: "bg-[#FEF3C7] text-[#92400E]" },
  jason_review: { label: "Jason Review Required", tone: "bg-[#EDE9FE] text-[#6D28D9]" },
  not_permitted: { label: "Not Permitted", tone: "bg-[#FEE2E2] text-[#B91C1C]" },
  needs_research: { label: "Needs Research", tone: "bg-slate-100 text-slate-600" },
};

export function campusApprovalView(value: string) {
  const key = (CAMPUS_APPROVALS as readonly string[]).includes(value) ? (value as CampusApproval) : "needs_research";
  return APPROVAL_LABELS[key];
}

export function campusExecutionAllowed(approval: string) {
  return approval === "approved";
}

/** Interns can ask for review. They cannot approve their own campus work. */
export function campusApprovalChangeAllowed(input: { actor: InternshipActorKind; next: string }) {
  if (!(CAMPUS_APPROVALS as readonly string[]).includes(input.next)) return false;
  if (input.actor === "supervisor") return true;
  if (input.actor === "manager") return true;
  if (input.actor === "intern") return input.next === "needs_research" || input.next === "ava_review";
  return false;
}

export function campusLaneCategory(lane: string) {
  if (lane === "creative") return "Content";
  if (lane === "coaching") return "Other";
  if (lane === "outreach") return "Community Outreach";
  if (lane === "results") return "Analytics";
  return "Campus Growth";
}

export function routeCampusLane(lane: string): AssignmentWorkRoute {
  if (lane === "coaching") return routeAssignmentCategory("Internship Milestone");
  return routeAssignmentCategory(campusLaneCategory(lane));
}

export function campusSlug(value: string) {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return (slug || "campus").slice(0, 24);
}

export function campusTrackingCode(input: { campus: string; intern: string; target: string; channel: string }) {
  return [campusSlug(input.campus), campusSlug(input.intern), campusSlug(input.target), campusSlug(input.channel)].join("-").slice(0, 80);
}

export function campusTrackingPath(code: string) {
  return `/r/campus/${encodeURIComponent(code)}`;
}

/** Campus links attribute SitGuru growth. They do not create Ambassador or PetPerks rewards. */
export function campusAttributionReward() {
  return { grantsAmbassadorReward: false, grantsPetPerksReward: false, kind: "business_attribution" as const };
}

export function campusMissionDraft(input: {
  internId: string;
  title: string;
  dueOn: string;
  description: string;
  freedom: string;
  lane: string;
  phases: string[];
  clientRequestId: string;
}): AssignmentDraft {
  const phases = input.phases.filter((phase) => (CAMPUS_PHASES as readonly string[]).includes(phase));
  const deliverables = phases.length
    ? phases.map((phase) => `Phase: ${phase[0].toUpperCase()}${phase.slice(1)}`)
    : [...CAMPUS_MISSION_CHECKLIST];
  return {
    internId: input.internId,
    title: input.title.trim(),
    category: campusLaneCategory(input.lane),
    milestoneId: "",
    dueOn: input.dueOn.trim(),
    priority: "Normal",
    description: input.description.trim(),
    deliverables,
    review: "Manager Review Required",
    freedom: input.freedom === "Directed" || input.freedom === "Guided" ? input.freedom : "Explore",
    resources: [],
    notes: "Campus Growth mission. Interns stay interns. This is not an Ambassador role.",
    clientRequestId: input.clientRequestId,
  };
}

export function campusMissionIsVisible(status: string) {
  return assignmentIsVisibleToIntern(status);
}

export function summarizeCampusActivity(input: {
  opportunities: { status: string; happensOn: string }[];
  missions: { status: string; title: string }[];
  leads: number;
  visits: number;
  scans: number;
  petParents: number;
  guruApplications: number;
  today: string;
}) {
  const activeMissions = input.missions.filter((row) => campusMissionIsVisible(row.status) && row.status !== "done" && row.status !== "cancelled");
  const upcoming = input.opportunities.filter((row) => row.happensOn && row.happensOn >= input.today && !["Completed", "Not Pursuing"].includes(row.status));
  return {
    opportunities: input.opportunities.length,
    activeCampaigns: activeMissions.length,
    upcomingEvents: upcoming.length,
    leads: input.leads,
    visits: input.visits,
    scans: input.scans,
    petParents: input.petParents,
    guruApplications: input.guruApplications,
    topCampaign: activeMissions[0]?.title || "",
  };
}
