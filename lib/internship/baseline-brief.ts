/**
 * Baseline & Growth Brief — Phase 1 of the Final Business Growth Report.
 * Approved sections accumulate all semester. Week 15 is synthesis, not a blank page.
 */

import type { InternGlossaryTerm } from "@/lib/internship/intern-glossary";
import type {
  InternshipExperiment,
  InternshipIntern,
  InternshipMetric,
  InternshipSmartGoal,
  InternshipTask,
  InternshipWorkAttachment,
} from "@/lib/internship/types";
import { INTERN_KPI_BASELINE_NOTE } from "@/lib/internship/intern-kpis";
import type { BusinessGrowthReportSectionId } from "@/lib/internship/final-project";

export const BASELINE_GROWTH_BRIEF_TITLE = "Baseline & Growth Brief";
export const BASELINE_GROWTH_BRIEF_SUBTITLE =
  "Weeks 1–2 · Required semester deliverable · Supervisor approval required";
export const BASELINE_GROWTH_BRIEF_EMPLOYER =
  "Graff Enterprises LLC dba SitGuru";
export const BASELINE_GROWTH_BRIEF_HELP_INBOX = "intern@sitguru.com";

export const BASELINE_GROWTH_BRIEF_PURPOSE =
  "The Baseline & Growth Brief establishes the official starting point for your SitGuru Market Growth Project. The information you submit here becomes the foundation of your Final Business Growth Report. Your approved baseline, market analysis, audience definition, opportunities, SMART targets, and initial experiments will carry forward throughout the semester.";

export const BASELINE_GROWTH_BRIEF_COMPLETION =
  "Completion is not just a file upload. SitGuru needs the required written brief, presentation, structured sections, and supervisor approval. Hours approval is separate from this deliverable.";

export const BASELINE_PII_REMINDER =
  "Do not include customer names, email addresses, payment information, pet records, private messages, credentials, or other customer PII.";

export const BASELINE_KPI_VANITY_RULE =
  "Follower count, views and reach alone are not sufficient business-growth KPIs.";

export const BASELINE_INTERN_REPORTED_RULE =
  "Intern-reported values never auto-verify. SitGuru checks them from an approved source before they become official.";

export const BASELINE_VAGUE_AUDIENCE_HINT =
  "“Pet owners,” “Instagram,” or “everyone with a dog” is too vague. Name who must change behavior, in which place, and why they are not already using SitGuru.";

export const SUPERVISOR_REVIEW_GUIDANCE =
  "Tell SitGuru exactly what to verify, approve, or correct before this brief becomes official Final Report material.";

export const SUPERVISOR_REVIEW_EXAMPLE =
  "Please verify the Pet Parent registration baseline from SitGuru-controlled records, check whether my SMART target is a Tier 1 business outcome, and confirm the Greater Philadelphia campus audience is specific enough to test.";

export const BASELINE_GROWTH_TRACKS = [
  { id: "pet_parent_growth", label: "Pet Parent Growth" },
  { id: "guru_growth", label: "Guru Growth" },
  { id: "community_partnership_growth", label: "Community Partnership Growth" },
  { id: "referral_growth", label: "Referral Growth" },
  { id: "pet_event_growth", label: "Pet Event Growth" },
  { id: "content_conversion", label: "Content & Conversion Optimization" },
  { id: "seo_organic", label: "SEO / Organic Growth" },
  { id: "email_community", label: "Email Growth" },
  { id: "market_launch", label: "Market Launch" },
  { id: "campus_market_expansion", label: "Campus Market Expansion" },
  { id: "local_business_partnership", label: "Local Business Partnership Development" },
] as const;

export type BaselineGrowthTrackId = (typeof BASELINE_GROWTH_TRACKS)[number]["id"];

export const BASELINE_KPI_TIERS = [
  {
    id: "tier_1",
    label: "Tier 1 — Business Outcome",
    meaning:
      "A result that changes the SitGuru business: new Pet Parents, new Gurus, booked care on SitGuru, or attributable revenue-adjacent signups SitGuru can check.",
    example: "Attributable Pet Parent registrations from your tracking link.",
  },
  {
    id: "tier_2",
    label: "Tier 2 — Conversion / Intent",
    meaning:
      "Someone took a step toward SitGuru (clicked Find Care, started join, used your campaign link) but has not finished the business outcome yet.",
    example: "Find Care sessions or Become a Guru starts from utm_campaign=spring27_campus.",
  },
  {
    id: "tier_3",
    label: "Tier 3 — Awareness / Activity",
    meaning:
      "People saw or touched the work. Useful context only. Tier 3 cannot replace a business outcome.",
    example: "Post reach or a vendor-event conversation count. Do not treat this as the SMART target.",
  },
] as const;

export const BASELINE_METRIC_STATUSES = [
  "draft",
  "submitted",
  "pending_verification",
  "verified",
  "supervisor_approved",
  "locked",
] as const;

export type BaselineMetricStatus = (typeof BASELINE_METRIC_STATUSES)[number];

export const BASELINE_DELIVERABLE_STATUSES = [
  "todo",
  "in_progress",
  "submitted",
  "under_review",
  "changes_requested",
  "resubmitted",
  "approved",
  "locked",
] as const;

export type BaselineDeliverableStatus = (typeof BASELINE_DELIVERABLE_STATUSES)[number];

export const BASELINE_SECTION_REVIEW_STATUSES = [
  "pending",
  "approved",
  "changes_requested",
  "rejected",
] as const;

export type BaselineSectionReviewStatus =
  (typeof BASELINE_SECTION_REVIEW_STATUSES)[number];

export const BASELINE_SMART_STATUSES = [
  "draft",
  "submitted",
  "supervisor_review",
  "approved",
  "locked",
  "completed",
  "adjusted",
  "closed",
] as const;

export const BASELINE_ATTACHMENT_CATEGORIES = [
  {
    id: "brief",
    label: "Written Brief",
    accept: ".doc,.docx,.pdf",
    extensions: ["doc", "docx", "pdf"],
    meaning:
      "Your 2–5 page written starting point. This is the official narrative SitGuru will lock into the Final Growth Report.",
    why: "A deck alone is not enough. SitGuru needs a readable brief they can quote later.",
    example: "A Word or PDF brief covering market, baseline table, audience, risks, opportunities, SMART goals, and first tests.",
    emptyCopy:
      "Upload the written brief (DOC, DOCX, or PDF). 2–5 pages recommended. This is required — not optional supporting color.",
  },
  {
    id: "presentation",
    label: "Presentation",
    accept: ".ppt,.pptx",
    extensions: ["ppt", "pptx"],
    meaning:
      "A 6–10 slide walkthrough of the same brief so SitGuru can review it quickly in a meeting.",
    why: "The deck is the conversation. The written brief is the record. Both are required.",
    example: "A PowerPoint that follows the 10-slide outline below. A PDF export belongs in Supporting Evidence, not here.",
    emptyCopy:
      "Upload the presentation (PPT or PPTX). 6–10 slides recommended. A PDF export can go under Supporting Evidence.",
  },
  {
    id: "evidence",
    label: "Supporting Evidence",
    accept: ".pdf,.png,.jpg,.jpeg,.webp,.csv,.xlsx,.doc,.docx",
    extensions: ["pdf", "png", "jpg", "jpeg", "webp", "csv", "xlsx", "doc", "docx"],
    meaning:
      "Screenshots, research notes, charts, and source PDFs that prove the numbers and claims in the brief.",
    why: "SitGuru cannot verify a baseline from memory. Show where the number came from — without customer names.",
    example: "A cropped Market snapshot screenshot, a public event calendar PDF, or a chart with no emails visible.",
    emptyCopy:
      "Add screenshots, research, charts, or PDFs that support the brief. No customer names, emails, or payment details.",
  },
] as const;

export type BaselineAttachmentCategory =
  (typeof BASELINE_ATTACHMENT_CATEGORIES)[number]["id"];

export const BASELINE_PPT_SLIDES = [
  "Title, market, and growth track",
  "The SitGuru problem you are solving, for whom",
  "Baseline metrics table (Tier 1 first)",
  "Target audience — who must change behavior",
  "Current situation: working, weak, missing",
  "Risks (at least three when they apply)",
  "Opportunities and recommended tests",
  "SMART goals SitGuru can verify",
  "Initial experiments: hypothesis → action → measure → success",
  "What you need SitGuru to review next",
] as const;

export type BaselineBriefFieldHelp = InternGlossaryTerm & {
  why?: string;
  review?: string;
  feedsReport?: string;
};

export const BASELINE_BRIEF_SECTIONS: Array<{
  id:
    | "project"
    | "metrics"
    | "audience"
    | "situation"
    | "risks"
    | "opportunities"
    | "smart"
    | "experiments";
  title: string;
  meaning: string;
  review: string;
  feedsReport: string;
  reportSection: BusinessGrowthReportSectionId;
}> = [
  {
    id: "project",
    title: "1. Project & Market Definition",
    meaning:
      "Name the project, the growth track, the assigned market, and the business problem. This is the cover page of your semester.",
    review: "SitGuru checks that the market is real, bounded, and owned by SitGuru — not a Rover/Wag comparison.",
    feedsReport: "Later appears in the Final Growth Report as Executive Summary / Project Scope.",
    reportSection: "starting_point",
  },
  {
    id: "metrics",
    title: "2. Baseline metrics",
    meaning:
      "A baseline is the official starting number before you try to grow it. Write what SitGuru can later compare against.",
    review: "SitGuru verifies each number. Your typed value stays intern-reported until they check it.",
    feedsReport: "Later appears as Starting Position / Baseline. Locked values are the official comparison.",
    reportSection: "baseline_goals",
  },
  {
    id: "audience",
    title: "3. Target audience",
    meaning:
      "Who specifically must change behavior for this project to succeed? Name people, place, and the barrier — not “pet owners.”",
    review: "SitGuru rejects vague audiences. They want a group you can actually reach and measure.",
    feedsReport: "Later appears as Audience & Market Analysis.",
    reportSection: "methods",
  },
  {
    id: "situation",
    title: "4. Current situation",
    meaning:
      "What SitGuru is already doing, what is working, what is weak, and what is missing in this market.",
    review: "Every conclusion needs a tag: Evidence (a source), Observation (what you saw), or Interpretation (what you think it means).",
    feedsReport: "Later appears as Initial Situation Analysis.",
    reportSection: "starting_point",
  },
  {
    id: "risks",
    title: "5. Risks",
    meaning:
      "What could stop the project. At least three when they apply. A risk is not a complaint — it is something you can mitigate.",
    review: "SitGuru looks for evidence, impact, and a mitigation — not a fear list.",
    feedsReport: "Later appears as Initial Challenges.",
    reportSection: "starting_point",
  },
  {
    id: "opportunities",
    title: "6. Opportunities",
    meaning:
      "At least three reasonable bets: who they help, what evidence you have, expected impact, effort, and the first test.",
    review: "SitGuru ranks High / Medium / Low and decides which test is worth running.",
    feedsReport: "Later appears as Strategy & Opportunity Analysis.",
    reportSection: "methods",
  },
  {
    id: "smart",
    title: "7. SMART goals",
    meaning:
      "SMART means Specific, Measurable, Achievable, Relevant, Time-bound. Official only after SitGuru approves. Prefer Tier 1.",
    review: "SitGuru approves, adjusts, or locks goals. Tier 3 awareness cannot replace a business outcome.",
    feedsReport: "Later appears as Objectives & Success Criteria.",
    reportSection: "baseline_goals",
  },
  {
    id: "experiments",
    title: "8. Initial experiments",
    meaning:
      "One to three first tests. Pattern: hypothesis → action → measurement → success threshold. A failed test still counts if you write the learning.",
    review: "SitGuru checks that you can measure the test and that bookings stay on SitGuru.",
    feedsReport: "Later appears as Initial Testing Plan. Later campaigns keep feeding this chapter.",
    reportSection: "experiments",
  },
];

export const BASELINE_PROJECT_FIELDS: BaselineBriefFieldHelp[] = [
  {
    label: "Project name",
    meaning: "A short name SitGuru can repeat all semester.",
    why: "The Final Report will use this title on the cover.",
    example: "Greater Philadelphia campus Pet Parent growth — Spring 2027",
  },
  {
    label: "Primary growth track",
    meaning: "The one SitGuru growth lane this project is judged on.",
    why: "Your SMART goal and experiments should match this track.",
    example: "Pet Parent Growth or Campus Market Expansion — pick the main one.",
  },
  {
    label: "Assigned market",
    meaning: "The place and people SitGuru assigned you. Not the whole internet.",
    example: "Campus and nearby neighborhoods around your university in Greater Philadelphia.",
  },
  {
    label: "Geographic boundaries",
    meaning: "Where the work stops. Cities, campuses, or a ZIP cluster — not “online.”",
    example: "University campus + a 10-mile radius. Do not list private home addresses.",
  },
  {
    label: "Business objective",
    meaning:
      "What SitGuru business problem are you trying to solve, for whom, and in what market?",
    why: "This sentence becomes the Executive Summary opener.",
    example:
      "Help nearby Pet Parents find a trusted local Guru on SitGuru instead of leaving the market unserved.",
  },
  {
    label: "Project start date",
    meaning: "The week you officially started internship work.",
    example: "The Monday of week 1.",
  },
  {
    label: "Baseline measurement date / range",
    meaning: "The dates the starting numbers cover. SitGuru needs a range they can re-check.",
    example: "August 1–20, 2026, from SitGuru-controlled totals.",
  },
];

export const BASELINE_METRIC_FIELDS: BaselineBriefFieldHelp[] = [
  {
    label: "Metric",
    meaning: "The thing you will grow. Prefer a business outcome SitGuru already tracks.",
    example: "Pet Parent registrations attributed to your campaign.",
  },
  {
    label: "KPI tier",
    meaning: "Tier 1 = business outcome. Tier 2 = conversion/intent. Tier 3 = awareness only.",
    why: BASELINE_KPI_VANITY_RULE,
    example: "Registrations = Tier 1. Find Care clicks = Tier 2. Followers = Tier 3.",
  },
  {
    label: "Baseline value (intern-reported)",
    meaning: "The starting number you believe is true. SitGuru still has to check it.",
    why: BASELINE_INTERN_REPORTED_RULE,
    example: "20 — and it stays “intern-reported” until SitGuru marks it verified.",
  },
  {
    label: "Employer-verified value",
    meaning: "The number SitGuru confirmed. The report shows both sides. One never silently replaces the other.",
    example: "SitGuru confirms 20. If they correct it to 18, both 20 and 18 stay visible.",
  },
  {
    label: "Unit",
    meaning: "What the number is counted in.",
    example: "registrations, sessions, Gurus, event shares",
  },
  {
    label: "Measurement period",
    meaning: "The start and end dates for this baseline row.",
    example: "Aug 1–20, 2026",
  },
  {
    label: "Data source",
    meaning: "Which approved SitGuru-controlled source the number came from.",
    example: "SitGuru registration records or an approved analytics view — not a personal screenshot of likes.",
  },
  {
    label: "Source URL",
    meaning: "A public or intern-safe link SitGuru can open. No passwords and no unpublished SitGuru internals.",
    example: "A public event page or a tracking-link destination on sitguru.com.",
  },
  {
    label: "Date captured",
    meaning: "The day you wrote the number down.",
    example: "2026-08-20",
  },
  {
    label: "Intern notes",
    meaning: "How you found it and anything SitGuru should know. No customer names.",
    example: "Copied from the intern Market snapshot. No emails in the screenshot.",
  },
  {
    label: "Verification status",
    meaning:
      "Draft → Submitted → Pending Verification → Verified → Supervisor Approved → Locked. Locked means you cannot edit it.",
  },
];

export const BASELINE_AUDIENCE_FIELDS: BaselineBriefFieldHelp[] = [
  {
    label: "Primary audience",
    meaning: "The one group that must change behavior for the project to succeed.",
    example: "Undergraduate Pet Parents within 10 miles of campus who do not yet have a SitGuru account.",
  },
  {
    label: "Secondary audience",
    meaning: "A helpful second group — not a second project.",
    example: "Nearby Gurus who can cover weekend walks.",
  },
  {
    label: "Geography",
    meaning: "Where those people actually are.",
    example: "Campus + adjoining ZIP codes. No private street addresses.",
  },
  {
    label: "Problem / need",
    meaning: "The job they need done that SitGuru can do.",
    example: "They need trusted local pet care they can book on SitGuru, not a random social post.",
  },
  {
    label: "Alternative / competitor",
    meaning: "What they do today instead. Do not send bookings off SitGuru.",
    example: "Asking a roommate, or doing nothing. Bookings stay on SitGuru — never Rover or Wag.",
  },
  {
    label: "Why SitGuru",
    meaning: "Why SitGuru is the better next step for them.",
    example: "Find Care + live PawReport + bookings that stay on SitGuru.",
  },
  {
    label: "Where you can reach them",
    meaning: "Real channels you can use this semester.",
    example: "Campus club posts, public pet events, and @SitGuruOfficial shares with a tracking link.",
  },
  {
    label: "Conversion barrier",
    meaning: "Why they have not signed up or booked yet.",
    example: "They do not know SitGuru is local, or the CTA is “learn more” instead of Find Care.",
  },
  {
    label: "Audience evidence",
    meaning: "How you know this group exists. Public sources only.",
    example: "Campus pet policy page + intern-safe Market snapshot totals.",
  },
];

export const BASELINE_SITUATION_FIELDS: BaselineBriefFieldHelp[] = [
  { label: "What SitGuru is doing now", meaning: "Current channels, offers, or campaigns in this market.", example: "Find Care + official socials + public Events." },
  { label: "What is working", meaning: "Keep this. Tie it to evidence.", example: "Tracking-link campus posts that SitGuru already approved." },
  { label: "What is weak", meaning: "Something present but not converting.", example: "Homepage URLs in captions that SitGuru cannot attribute." },
  { label: "What is missing", meaning: "A gap you can test.", example: "No campus-specific Guru story with a Become a Guru link." },
  { label: "Channels", meaning: "Where SitGuru shows up today.", example: "Instagram, Events page, Find Care." },
  { label: "Messaging", meaning: "What the current copy asks people to do.", example: "“Find a local Guru” vs a vague “check us out.”" },
  { label: "Conversion gaps", meaning: "Where people drop off before a SitGuru action.", example: "Event interest with no tracking link." },
  { label: "Competitive notes", meaning: "What people do instead. Do not promote off-platform booking.", example: "Word of mouth. Bookings stay on SitGuru." },
  { label: "Community notes", meaning: "Campus clubs, public events, local partners — no private contact lists.", example: "Public Paws-at-the-Park style listings on sitguru.com/events." },
];

export const BASELINE_STATUS_HELP: Record<string, InternGlossaryTerm> = {
  draft: {
    label: "Draft",
    meaning: "You can still edit. SitGuru has not treated this as submitted work.",
    example: "Save draft as you fill sections. Nothing is official yet.",
  },
  todo: {
    label: "To do",
    meaning: "The brief is assigned. SitGuru is not reviewing it yet.",
  },
  in_progress: {
    label: "In progress",
    meaning: "You started the sections or uploaded a file. Keep going until Ready to Submit is complete.",
  },
  submitted: {
    label: "Submitted",
    meaning: "You sent it. Wait for SitGuru. You can still comment, but do not treat it as approved.",
  },
  under_review: {
    label: "Under review",
    meaning: "SitGuru is reading the files and sections. Hours approval is a different decision.",
  },
  changes_requested: {
    label: "Changes requested",
    meaning: "Edit the sections they flagged, add a note about what changed, and send it back.",
  },
  resubmitted: {
    label: "Resubmitted",
    meaning: "You sent a new version. Older files stay in history — they are not overwritten.",
  },
  approved: {
    label: "Approved",
    meaning: "Official Final Report material. Draft work is labeled Draft / Not Yet Approved until this status.",
  },
  locked: {
    label: "Locked",
    meaning:
      "The official starting point. You cannot edit locked baseline numbers. Corrections need a reason and SitGuru approval.",
  },
  pending: {
    label: "Pending",
    meaning: "This section is waiting for SitGuru. It is not official yet.",
  },
  rejected: {
    label: "Rejected",
    meaning: "This section cannot be used as-is. Read the comment and rebuild it.",
  },
  intern_reported: {
    label: "Intern-reported",
    meaning: "You typed the number. It is not a SitGuru result until they verify it.",
  },
  verified: {
    label: "Verified",
    meaning: "SitGuru checked the number from an approved source. The report still shows your original number beside it.",
  },
  pending_verification: {
    label: "Pending verification",
    meaning: "SitGuru has the number and has not finished checking it.",
  },
  supervisor_approved: {
    label: "Supervisor approved",
    meaning: "SitGuru accepted the section or metric. Locking is a later step.",
  },
};

export const BASELINE_WORD_DEFINITIONS: InternGlossaryTerm[] = [
  {
    label: "Baseline & Growth Brief",
    meaning: BASELINE_GROWTH_BRIEF_PURPOSE,
    example: "Weeks 1–2 required deliverable. Written brief + presentation + sections + SitGuru approval.",
  },
  {
    label: "Baseline",
    meaning:
      "The official starting number before you try to grow it. Once SitGuru locks it, later results are compared to this number — not to a new guess.",
    example: "Pet Parent registrations = 20 on August 20, verified by SitGuru.",
  },
  {
    label: "Locked baseline",
    meaning:
      "SitGuru froze the starting numbers. You cannot edit them. A correction needs the original value, the new value, a reason, who changed it, the date, and supervisor approval.",
  },
  {
    label: "Growth track",
    meaning:
      "The SitGuru lane your project is judged on (Pet Parent Growth, Guru Growth, campus expansion, and so on). Pick one primary track.",
  },
  {
    label: "SMART goal",
    meaning:
      "Specific, Measurable, Achievable, Relevant, Time-bound. It is official only after SitGuru approves it. Prefer a Tier 1 business outcome.",
    example: "Grow attributable campus Pet Parent registrations from 20 to 40 by March 31, using campaign spring27_campus.",
  },
  {
    label: "Experiment",
    meaning:
      "A named test: hypothesis → action → measurement → success threshold. Failures are allowed when the learning is written down.",
    example: "If the Find Care CTA is in the first comment, tracking-link sessions will rise 20% in two weeks.",
  },
  {
    label: "UTM / tracking link",
    meaning:
      "The unique SitGuru URL that proves a click came from your work. A bare homepage does not count.",
    example: "https://sitguru.com/?utm_source=instagram&utm_campaign=spring27_campus",
  },
  {
    label: "Intern-reported vs verified",
    meaning:
      "Intern-reported is your number. Verified is SitGuru’s checked number. The Final Report always shows both. One never silently replaces the other.",
  },
  {
    label: "KPI tier",
    meaning: `${BASELINE_KPI_TIERS.map((row) => `${row.label}: ${row.meaning}`).join(" ")} ${BASELINE_KPI_VANITY_RULE}`,
  },
  {
    label: "Written Brief",
    meaning: BASELINE_ATTACHMENT_CATEGORIES[0].meaning,
    example: BASELINE_ATTACHMENT_CATEGORIES[0].example,
  },
  {
    label: "Presentation",
    meaning: BASELINE_ATTACHMENT_CATEGORIES[1].meaning,
    example: BASELINE_ATTACHMENT_CATEGORIES[1].example,
  },
  {
    label: "Supporting Evidence",
    meaning: BASELINE_ATTACHMENT_CATEGORIES[2].meaning,
    example: BASELINE_ATTACHMENT_CATEGORIES[2].example,
  },
  {
    label: "Supervisor review requested",
    meaning: SUPERVISOR_REVIEW_GUIDANCE,
    example: SUPERVISOR_REVIEW_EXAMPLE,
  },
  {
    label: "Ready to Submit %",
    meaning:
      "How much of the required brief is filled: written brief, presentation, required sections, at least one baseline metric, a SMART goal, and a review request. 100% means you can send it — not that it is approved.",
  },
  {
    label: "Final Growth Report",
    meaning:
      "The semester destination SitGuru assembles from approved brief sections, weekly work, campaigns, experiments, and verified numbers. Do not wait until week 15 to write it.",
  },
  {
    label: "Draft / Not Yet Approved",
    meaning:
      "Work that is saved but not official Final Report material. Only SitGuru-approved content is official.",
  },
];

export type BaselineConclusionKind = "evidence" | "observation" | "interpretation";

export type BaselineRiskRow = {
  risk: string;
  evidence: string;
  impact: string;
  mitigation: string;
};

export type BaselineOpportunityRow = {
  opportunity: string;
  outcome: string;
  audience: string;
  evidence: string;
  expectedImpact: string;
  effort: string;
  priority: "high" | "medium" | "low" | "";
  recommendedTest: string;
};

export type BaselineMetricRow = {
  metricKey: string;
  label: string;
  kpiTier: string;
  internReportedValue: string;
  verifiedValue: string;
  unit: string;
  periodStart: string;
  periodEnd: string;
  sourceSystem: string;
  sourceUrl: string;
  capturedOn: string;
  internNotes: string;
  verificationStatus: BaselineMetricStatus | string;
  originalValue?: string;
  correctionReason?: string;
};

export type BaselineAudience = {
  primary: string;
  secondary: string;
  geo: string;
  problemNeed: string;
  alternative: string;
  whySitguru: string;
  whereReached: string;
  conversionBarrier: string;
  evidence: string;
};

export type BaselineSituation = {
  current: string;
  working: string;
  weak: string;
  missing: string;
  channels: string;
  messaging: string;
  conversionGaps: string;
  competitive: string;
  community: string;
  conclusions: Array<{ text: string; kind: BaselineConclusionKind | "" }>;
};

export type BaselineProject = {
  name: string;
  growthTrack: string;
  assignedMarket: string;
  geographicBoundaries: string;
  businessObjective: string;
  projectStartDate: string;
  baselineMeasurementRange: string;
};

export type BaselineSectionReviews = Record<
  (typeof BASELINE_BRIEF_SECTIONS)[number]["id"],
  BaselineSectionReviewStatus
>;

export type BaselineBriefPayload = {
  project: BaselineProject;
  audience: BaselineAudience;
  situation: BaselineSituation;
  risks: BaselineRiskRow[];
  opportunities: BaselineOpportunityRow[];
  metrics: BaselineMetricRow[];
  supervisorReviewRequested: string;
  sectionReviews: BaselineSectionReviews;
  overallStatus: BaselineDeliverableStatus | string;
};

export const EMPTY_BASELINE_PROJECT: BaselineProject = {
  name: "",
  growthTrack: "",
  assignedMarket: "",
  geographicBoundaries: "",
  businessObjective: "",
  projectStartDate: "",
  baselineMeasurementRange: "",
};

export const EMPTY_BASELINE_AUDIENCE: BaselineAudience = {
  primary: "",
  secondary: "",
  geo: "",
  problemNeed: "",
  alternative: "",
  whySitguru: "",
  whereReached: "",
  conversionBarrier: "",
  evidence: "",
};

export const EMPTY_BASELINE_SITUATION: BaselineSituation = {
  current: "",
  working: "",
  weak: "",
  missing: "",
  channels: "",
  messaging: "",
  conversionGaps: "",
  competitive: "",
  community: "",
  conclusions: [
    { text: "", kind: "" },
    { text: "", kind: "" },
    { text: "", kind: "" },
  ],
};

export const EMPTY_SECTION_REVIEWS: BaselineSectionReviews = {
  project: "pending",
  metrics: "pending",
  audience: "pending",
  situation: "pending",
  risks: "pending",
  opportunities: "pending",
  smart: "pending",
  experiments: "pending",
};

export function emptyBaselineBriefPayload(): BaselineBriefPayload {
  return {
    project: { ...EMPTY_BASELINE_PROJECT },
    audience: { ...EMPTY_BASELINE_AUDIENCE },
    situation: {
      ...EMPTY_BASELINE_SITUATION,
      conclusions: EMPTY_BASELINE_SITUATION.conclusions.map((row) => ({ ...row })),
    },
    risks: [
      { risk: "", evidence: "", impact: "", mitigation: "" },
      { risk: "", evidence: "", impact: "", mitigation: "" },
      { risk: "", evidence: "", impact: "", mitigation: "" },
    ],
    opportunities: [
      {
        opportunity: "",
        outcome: "",
        audience: "",
        evidence: "",
        expectedImpact: "",
        effort: "",
        priority: "",
        recommendedTest: "",
      },
      {
        opportunity: "",
        outcome: "",
        audience: "",
        evidence: "",
        expectedImpact: "",
        effort: "",
        priority: "",
        recommendedTest: "",
      },
      {
        opportunity: "",
        outcome: "",
        audience: "",
        evidence: "",
        expectedImpact: "",
        effort: "",
        priority: "",
        recommendedTest: "",
      },
    ],
    metrics: [],
    supervisorReviewRequested: "",
    sectionReviews: { ...EMPTY_SECTION_REVIEWS },
    overallStatus: "todo",
  };
}

export function isBaselineGrowthBriefTask(task: {
  title?: string | null;
  studentNotes?: string | null;
  weekNumber?: number | null;
}) {
  const title = String(task.title || "").trim().toLowerCase();
  if (title.includes("baseline & growth brief") || title.includes("baseline and growth brief")) {
    return true;
  }
  const notes = String(task.studentNotes || "").toLowerCase();
  return notes.includes("shared sitguru semester deliverable") && title.includes("baseline");
}

export function findBaselineGrowthBriefTask<T extends { title?: string | null; studentNotes?: string | null }>(
  tasks: T[] | null | undefined,
) {
  return (tasks || []).find((task) => isBaselineGrowthBriefTask(task)) || null;
}

export function baselineAttachmentCategory(value: string | null | undefined): BaselineAttachmentCategory | null {
  const id = String(value || "").trim().toLowerCase();
  return BASELINE_ATTACHMENT_CATEGORIES.some((row) => row.id === id)
    ? (id as BaselineAttachmentCategory)
    : null;
}

export function attachmentsForBriefCategory(
  attachments: Array<{ itemType: string; itemId: string; caption?: string; category?: string }> | null | undefined,
  itemId: string,
  category: BaselineAttachmentCategory,
) {
  return (attachments || []).filter((row) => {
    if (row.itemId !== itemId) return false;
    if (row.itemType !== "task" && row.itemType !== "brief" && row.itemType !== "presentation" && row.itemType !== "evidence") {
      return false;
    }
    const kind = baselineAttachmentCategory(row.category || row.caption);
    return kind === category;
  });
}

export function fileMatchesBriefCategory(fileName: string, category: BaselineAttachmentCategory) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const spec = BASELINE_ATTACHMENT_CATEGORIES.find((row) => row.id === category);
  return Boolean(spec?.extensions.includes(ext));
}

export function internAllowedBriefUpload(
  file: { name?: string | null; type?: string | null; size?: number | null },
  category: BaselineAttachmentCategory,
) {
  const name = String(file.name || "");
  const size = Number(file.size || 0);
  if (size <= 0) return "Choose a file.";
  if (size > 10 * 1024 * 1024) return "Files must be 10MB or smaller.";
  if (!fileMatchesBriefCategory(name, category)) {
    if (category === "brief") return "Written brief must be DOC, DOCX, or PDF.";
    if (category === "presentation") return "Presentation must be PPT or PPTX. Put a PDF export under Supporting Evidence.";
    return "Use a screenshot, chart, PDF, spreadsheet, or document. No customer names.";
  }
  return "";
}

function filled(value: string | null | undefined) {
  return String(value || "").trim().length > 0;
}

function filledCount(values: Array<string | null | undefined>, min: number) {
  return values.filter((row) => filled(row)).length >= min;
}

export function parseBaselineBriefPayload(raw: unknown): BaselineBriefPayload {
  const empty = emptyBaselineBriefPayload();
  if (!raw || typeof raw !== "object") return empty;
  const row = raw as Record<string, unknown>;
  const project = (row.project && typeof row.project === "object" ? row.project : {}) as Record<string, unknown>;
  const audience = (row.audience && typeof row.audience === "object" ? row.audience : {}) as Record<string, unknown>;
  const situation = (row.situation && typeof row.situation === "object" ? row.situation : {}) as Record<string, unknown>;
  const reviews = (row.sectionReviews && typeof row.sectionReviews === "object" ? row.sectionReviews : {}) as Record<
    string,
    unknown
  >;
  return {
    project: {
      name: String(project.name || ""),
      growthTrack: String(project.growthTrack || ""),
      assignedMarket: String(project.assignedMarket || ""),
      geographicBoundaries: String(project.geographicBoundaries || ""),
      businessObjective: String(project.businessObjective || ""),
      projectStartDate: String(project.projectStartDate || ""),
      baselineMeasurementRange: String(project.baselineMeasurementRange || ""),
    },
    audience: {
      primary: String(audience.primary || ""),
      secondary: String(audience.secondary || ""),
      geo: String(audience.geo || ""),
      problemNeed: String(audience.problemNeed || ""),
      alternative: String(audience.alternative || ""),
      whySitguru: String(audience.whySitguru || ""),
      whereReached: String(audience.whereReached || ""),
      conversionBarrier: String(audience.conversionBarrier || ""),
      evidence: String(audience.evidence || ""),
    },
    situation: {
      current: String(situation.current || ""),
      working: String(situation.working || ""),
      weak: String(situation.weak || ""),
      missing: String(situation.missing || ""),
      channels: String(situation.channels || ""),
      messaging: String(situation.messaging || ""),
      conversionGaps: String(situation.conversionGaps || ""),
      competitive: String(situation.competitive || ""),
      community: String(situation.community || ""),
      conclusions: Array.isArray(situation.conclusions)
        ? situation.conclusions.map((item) => {
            const rec = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
            const kind = String(rec.kind || "");
            return {
              text: String(rec.text || ""),
              kind:
                kind === "evidence" || kind === "observation" || kind === "interpretation"
                  ? kind
                  : ("" as const),
            };
          })
        : empty.situation.conclusions,
    },
    risks: Array.isArray(row.risks)
      ? row.risks.map((item) => {
          const rec = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
          return {
            risk: String(rec.risk || ""),
            evidence: String(rec.evidence || ""),
            impact: String(rec.impact || ""),
            mitigation: String(rec.mitigation || ""),
          };
        })
      : empty.risks,
    opportunities: Array.isArray(row.opportunities)
      ? row.opportunities.map((item) => {
          const rec = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
          const priority = String(rec.priority || "");
          return {
            opportunity: String(rec.opportunity || ""),
            outcome: String(rec.outcome || ""),
            audience: String(rec.audience || ""),
            evidence: String(rec.evidence || ""),
            expectedImpact: String(rec.expectedImpact || ""),
            effort: String(rec.effort || ""),
            priority:
              priority === "high" || priority === "medium" || priority === "low"
                ? priority
                : ("" as const),
            recommendedTest: String(rec.recommendedTest || ""),
          };
        })
      : empty.opportunities,
    metrics: Array.isArray(row.metrics)
      ? row.metrics.map((item) => {
          const rec = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
          return {
            metricKey: String(rec.metricKey || ""),
            label: String(rec.label || ""),
            kpiTier: String(rec.kpiTier || "tier_3"),
            internReportedValue: String(rec.internReportedValue || ""),
            verifiedValue: String(rec.verifiedValue || ""),
            unit: String(rec.unit || ""),
            periodStart: String(rec.periodStart || ""),
            periodEnd: String(rec.periodEnd || ""),
            sourceSystem: String(rec.sourceSystem || ""),
            sourceUrl: String(rec.sourceUrl || ""),
            capturedOn: String(rec.capturedOn || ""),
            internNotes: String(rec.internNotes || ""),
            verificationStatus: String(rec.verificationStatus || "draft"),
            originalValue: String(rec.originalValue || ""),
            correctionReason: String(rec.correctionReason || ""),
          };
        })
      : [],
    supervisorReviewRequested: String(row.supervisorReviewRequested || ""),
    sectionReviews: {
      project: (reviews.project as BaselineSectionReviewStatus) || "pending",
      metrics: (reviews.metrics as BaselineSectionReviewStatus) || "pending",
      audience: (reviews.audience as BaselineSectionReviewStatus) || "pending",
      situation: (reviews.situation as BaselineSectionReviewStatus) || "pending",
      risks: (reviews.risks as BaselineSectionReviewStatus) || "pending",
      opportunities: (reviews.opportunities as BaselineSectionReviewStatus) || "pending",
      smart: (reviews.smart as BaselineSectionReviewStatus) || "pending",
      experiments: (reviews.experiments as BaselineSectionReviewStatus) || "pending",
    },
    overallStatus: String(row.overallStatus || "todo"),
  };
}

export function baselineMetricsFromWorkspace(
  payload: BaselineBriefPayload,
  metrics: InternshipMetric[] = [],
): BaselineMetricRow[] {
  if (payload.metrics.length) return payload.metrics;
  return metrics
    .filter((row) => row.sourceNote.trim().toLowerCase() === INTERN_KPI_BASELINE_NOTE)
    .map((row) => ({
      metricKey: row.metricKey,
      label: row.label,
      kpiTier: "tier_1",
      internReportedValue:
        row.selfReported && row.valueNumeric != null ? String(row.valueNumeric) : "",
      verifiedValue: row.isVerified && row.valueNumeric != null ? String(row.valueNumeric) : "",
      unit: "",
      periodStart: row.periodStart || "",
      periodEnd: row.periodEnd || "",
      sourceSystem: row.sourceSystem,
      sourceUrl: "",
      capturedOn: row.periodEnd || "",
      internNotes: row.sourceNote,
      verificationStatus: row.isVerified ? "verified" : row.selfReported ? "submitted" : "draft",
    }));
}

export type BaselineBriefChecklist = {
  writtenBrief: boolean;
  presentation: boolean;
  evidence: boolean;
  project: boolean;
  metrics: boolean;
  audience: boolean;
  situation: boolean;
  risks: boolean;
  opportunities: boolean;
  smart: boolean;
  experiments: boolean;
  supervisorReview: boolean;
};

export function baselineBriefChecklist(input: {
  payload: BaselineBriefPayload;
  attachments?: InternshipWorkAttachment[];
  taskId: string;
  smartGoals?: InternshipSmartGoal[];
  experiments?: InternshipExperiment[];
  metrics?: InternshipMetric[];
}): BaselineBriefChecklist {
  const { payload, taskId } = input;
  const metrics = baselineMetricsFromWorkspace(payload, input.metrics);
  const hasBrief = attachmentsForBriefCategory(input.attachments, taskId, "brief").length > 0;
  const hasDeck = attachmentsForBriefCategory(input.attachments, taskId, "presentation").length > 0;
  const hasEvidence = attachmentsForBriefCategory(input.attachments, taskId, "evidence").length > 0;
  const project = filledCount(
    [
      payload.project.name,
      payload.project.growthTrack,
      payload.project.assignedMarket,
      payload.project.businessObjective,
    ],
    4,
  );
  const metricReady = metrics.some(
    (row) => filled(row.label) && filled(row.internReportedValue) && filled(row.sourceSystem || row.internNotes),
  );
  const audience = filledCount(
    [payload.audience.primary, payload.audience.geo, payload.audience.problemNeed, payload.audience.whySitguru],
    4,
  );
  const situation = filledCount(
    [payload.situation.current, payload.situation.working, payload.situation.weak, payload.situation.missing],
    4,
  );
  const risks = payload.risks.filter((row) => filled(row.risk) && filled(row.mitigation)).length >= 3;
  const opportunities =
    payload.opportunities.filter((row) => filled(row.opportunity) && filled(row.recommendedTest)).length >= 3;
  const smart = (input.smartGoals || []).some((row) => filled(row.specific) && filled(row.targetValue));
  const experiments = (input.experiments || []).some((row) => filled(row.hypothesis) && filled(row.action));
  return {
    writtenBrief: hasBrief,
    presentation: hasDeck,
    evidence: hasEvidence,
    project,
    metrics: metricReady,
    audience,
    situation,
    risks,
    opportunities,
    smart,
    experiments,
    supervisorReview: filled(payload.supervisorReviewRequested),
  };
}

const REQUIRED_CHECKLIST_KEYS: Array<keyof BaselineBriefChecklist> = [
  "writtenBrief",
  "presentation",
  "project",
  "metrics",
  "audience",
  "situation",
  "risks",
  "opportunities",
  "smart",
  "experiments",
  "supervisorReview",
];

export function baselineBriefReadyPercent(checklist: BaselineBriefChecklist) {
  const done = REQUIRED_CHECKLIST_KEYS.filter((key) => checklist[key]).length;
  return Math.round((done / REQUIRED_CHECKLIST_KEYS.length) * 100);
}

export function baselineBriefReadyToSubmit(checklist: BaselineBriefChecklist) {
  return REQUIRED_CHECKLIST_KEYS.every((key) => checklist[key]);
}

export function baselineBriefSubmitBlockers(checklist: BaselineBriefChecklist) {
  const labels: Record<keyof BaselineBriefChecklist, string> = {
    writtenBrief: "Upload the written brief (DOC, DOCX, or PDF).",
    presentation: "Upload the presentation (PPT or PPTX).",
    evidence: "Add supporting evidence.",
    project: "Finish Project & Market Definition.",
    metrics: "Add at least one baseline metric with a source.",
    audience: "Define a specific target audience.",
    situation: "Describe the current situation.",
    risks: "Add at least three risks with mitigations.",
    opportunities: "Add at least three opportunities with a recommended test.",
    smart: "Propose at least one SMART goal.",
    experiments: "Log at least one initial experiment.",
    supervisorReview: "Write what SitGuru should review.",
  };
  return REQUIRED_CHECKLIST_KEYS.filter((key) => !checklist[key]).map((key) => labels[key]);
}

export function briefIsLocked(
  intern: Pick<InternshipIntern, "baselineLockedAt"> | null | undefined,
  payload?: BaselineBriefPayload | null,
) {
  if (intern?.baselineLockedAt) return true;
  return payload?.overallStatus === "locked";
}

export function internCanEditBrief(input: {
  intern?: Pick<InternshipIntern, "baselineLockedAt"> | null;
  payload?: BaselineBriefPayload | null;
  taskStatus?: string;
}) {
  if (briefIsLocked(input.intern, input.payload)) return false;
  if (input.payload?.overallStatus === "approved") return false;
  if (input.taskStatus === "approved" || input.taskStatus === "not_accepted") return false;
  return true;
}

export function officialSmartGoal(goal: Pick<InternshipSmartGoal, "status">) {
  return ["approved", "locked", "completed"].includes(goal.status);
}

export function baselineDeliverableStatus(input: {
  task: Pick<InternshipTask, "status" | "supervisorApproved">;
  payload?: BaselineBriefPayload | null;
  intern?: Pick<InternshipIntern, "baselineLockedAt"> | null;
}): BaselineDeliverableStatus {
  if (input.intern?.baselineLockedAt || input.payload?.overallStatus === "locked") return "locked";
  if (input.task.supervisorApproved || input.task.status === "approved") return "approved";
  if (input.task.status === "revision_requested") return "changes_requested";
  if (input.payload?.overallStatus === "resubmitted") return "resubmitted";
  if (input.payload?.overallStatus === "under_review") return "under_review";
  if (input.task.status === "submitted") return "submitted";
  if (input.task.status === "in_progress") return "in_progress";
  return "todo";
}

export function baselineDeliverableLabel(status: string) {
  return BASELINE_STATUS_HELP[status]?.label || status.replaceAll("_", " ");
}

export type BaselineReportBlock = {
  id: string;
  sectionId: (typeof BASELINE_BRIEF_SECTIONS)[number]["id"];
  reportSection: BusinessGrowthReportSectionId;
  title: string;
  summary: string;
  official: boolean;
};

export function mapApprovedBriefToReportSections(input: {
  payload: BaselineBriefPayload;
  approved: boolean;
  smartGoals?: InternshipSmartGoal[];
  experiments?: InternshipExperiment[];
}): BaselineReportBlock[] {
  if (!input.approved) return [];
  const { payload } = input;
  const blocks: BaselineReportBlock[] = [
    {
      id: "brief-project",
      sectionId: "project",
      reportSection: "starting_point",
      title: payload.project.name || "Project & Market",
      summary: payload.project.businessObjective,
      official: true,
    },
    {
      id: "brief-metrics",
      sectionId: "metrics",
      reportSection: "baseline_goals",
      title: "Starting Position / Baseline",
      summary: payload.metrics
        .map((row) => `${row.label}: intern-reported ${row.internReportedValue || "—"} / verified ${row.verifiedValue || "pending"}`)
        .join("; "),
      official: true,
    },
    {
      id: "brief-audience",
      sectionId: "audience",
      reportSection: "methods",
      title: "Audience & Market Analysis",
      summary: payload.audience.primary,
      official: true,
    },
    {
      id: "brief-situation",
      sectionId: "situation",
      reportSection: "starting_point",
      title: "Initial Situation Analysis",
      summary: payload.situation.current,
      official: true,
    },
    {
      id: "brief-risks",
      sectionId: "risks",
      reportSection: "starting_point",
      title: "Initial Challenges",
      summary: payload.risks
        .filter((row) => filled(row.risk))
        .map((row) => row.risk)
        .join("; "),
      official: true,
    },
    {
      id: "brief-opportunities",
      sectionId: "opportunities",
      reportSection: "methods",
      title: "Strategy & Opportunity Analysis",
      summary: payload.opportunities
        .filter((row) => filled(row.opportunity))
        .map((row) => row.opportunity)
        .join("; "),
      official: true,
    },
    {
      id: "brief-smart",
      sectionId: "smart",
      reportSection: "baseline_goals",
      title: "Objectives & Success Criteria",
      summary: (input.smartGoals || [])
        .filter(officialSmartGoal)
        .map((row) => `${row.specific} (${row.baselineValue || "—"} → ${row.targetValue || "—"})`)
        .join("; "),
      official: true,
    },
    {
      id: "brief-experiments",
      sectionId: "experiments",
      reportSection: "experiments",
      title: "Initial Testing Plan",
      summary: (input.experiments || [])
        .map((row) => row.hypothesis || row.action)
        .filter(filled)
        .join("; "),
      official: true,
    },
  ];
  return blocks.filter((row) => filled(row.summary) || filled(row.title));
}

export function internSafeBriefCopy(text: string) {
  const value = String(text || "");
  return (
    !/jasongraff1978@gmail\.com/i.test(value) &&
    !/\bJason\b/.test(value) &&
    !/Proprietary and confidential/i.test(value) &&
    !/Admin HQ/i.test(value)
  );
}

export function allBaselineBriefDefinitions(): InternGlossaryTerm[] {
  return [
    ...BASELINE_WORD_DEFINITIONS,
    ...BASELINE_KPI_TIERS.map((row) => ({
      label: row.label,
      meaning: row.meaning,
      example: row.example,
    })),
    ...BASELINE_BRIEF_SECTIONS.map((row) => ({
      label: row.title,
      meaning: `${row.meaning} ${row.review} ${row.feedsReport}`,
    })),
    ...BASELINE_PROJECT_FIELDS,
    ...BASELINE_METRIC_FIELDS,
    ...BASELINE_AUDIENCE_FIELDS,
    ...Object.values(BASELINE_STATUS_HELP),
  ];
}
