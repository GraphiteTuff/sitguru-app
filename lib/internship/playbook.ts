/**
 * SitGuru-owned educational playbook for the Social Media & Community
 * Growth Internship Program. Any approved college may use this structure.
 * University credit, hours, evaluations, and funding stay on the intern's
 * academic profile — they are not the program root.
 */

import { ATTRIBUTION_RULE, INTERNSHIP_PROGRAM_NAME } from "@/lib/internship/constants";

export const INTERNSHIP_TITLE = "Social Media & Community Growth Intern";

export const MARKET_GROWTH_PROJECT_NAME =
  "SitGuru Greater Philadelphia Market Growth Project";

export const MARKET_GROWTH_PROJECT_STATEMENT =
  "Develop, execute, measure, and optimize a digital and community growth strategy that increases SitGuru’s qualified Pet Parent acquisition and strengthens marketplace density in a defined Pennsylvania target market, with results documented through attributable business metrics.";

export const SMART_RULE =
  "Every intern goal must be Specific, Measurable, Achievable, Relevant, and Time-bound — and tied to a SitGuru-controlled source. Activity (posts published) is not a result.";

export const HOURS_RULE =
  "SitGuru does not promise a fixed weekly hour schedule until the selected student’s academic program confirms required hours. Credit, hours, and evaluations are university-specific.";

export const WEEKLY_RHYTHM = [
  "30-minute supervisor check-in: learning, decisions, roadblocks, and KPI review.",
  "One written weekly update: completed work, metrics, insight, next week’s priorities, hours, and how this week advances the Business Growth Report.",
  "Update the experiment log: hypothesis, action, audience, result, lesson, next step. Verified results and lessons learned feed the final report.",
] as const;

export const LEARNING_OBJECTIVES = [
  "Develop a measurable social media and community growth strategy tied to business objectives.",
  "Create and adapt written, visual, and short-form video content for multiple platforms.",
  "Use analytics to evaluate campaign performance and make evidence-based decisions.",
  "Apply audience research, message testing, conversion concepts, and basic marketing attribution.",
  "Practice professional communication with community partners and internal stakeholders.",
  "Present a Business Growth Report documenting measurable outcomes and lessons learned, then defend it with data.",
  "Build a portfolio-ready case study from that same approved report — no Pet Parent PII or unpublished internals.",
] as const;

export const SEMESTER_DELIVERABLES = [
  {
    id: "report",
    timing: "Weeks 1–15 · Destination",
    title: "Business Growth Report",
    demonstrates:
      "The document all weekly work builds: starting point, SMART goals, how the work was done, experiments, verified measurable outcomes, lessons learned, and recommendations.",
  },
  {
    id: "playbook",
    timing: "Weeks 1–14 · Supporting",
    title: "SitGuru Market Growth Playbook",
    demonstrates:
      "Audience, campaigns, conversion, community growth, what works, and SOPs the next intern can inherit — assembled from the same approved work as the Report.",
  },
  {
    id: "portfolio",
    timing: "Week 15 · Supporting",
    title: "Portfolio Case Study",
    demonstrates:
      "A sanitized professional version of the Report. No Pet Parent PII, passwords, or unpublished SitGuru internals.",
  },
] as const;

export const MEASUREMENT_HIERARCHY = [
  {
    tier: "Tier 1 — Business outcomes",
    evidence:
      "New Pet Parent registrations; completed Guru profiles; bookings or booking intent; approved community partners; referral activations; revenue or transaction activity when available.",
  },
  {
    tier: "Tier 2 — Conversion outcomes",
    evidence:
      "Landing-page conversion rate; qualified leads; email/SMS opt-ins; referral-code use; event-to-signup conversion; campaign-attributable website sessions.",
  },
  {
    tier: "Tier 3 — Awareness outcomes",
    evidence:
      "Reach, impressions, follower growth, video views, engagement rate, shares, saves. Useful, but not sufficient alone to prove business growth.",
  },
] as const;

export const ILLUSTRATIVE_TARGETS = [
  {
    metric: "Pet Parent acquisition",
    role: "Primary KPI",
    planningTarget:
      "15–25% increase in qualified registrations versus the agreed baseline, or another target approved after baseline review.",
  },
  {
    metric: "Guru marketplace supply",
    role: "Supporting KPI",
    planningTarget:
      "Add approximately 8–12 completed/bookable Guru profiles in the selected market.",
  },
  {
    metric: "Community partners",
    role: "Supporting KPI",
    planningTarget: "Secure approximately 4–6 approved, relevant community or business partners.",
  },
  {
    metric: "Attributable traffic",
    role: "Supporting KPI",
    planningTarget:
      "Increase campaign-attributable traffic and improve conversion rate from targeted channels.",
  },
  {
    metric: "Owned audience",
    role: "Supporting KPI",
    planningTarget:
      "Grow email/referral audience with quality opt-ins rather than purchased or artificial traffic.",
  },
  {
    metric: "Social performance",
    role: "Diagnostic KPI",
    planningTarget:
      "Improve engagement/reach while tying top-performing content to measurable site actions.",
  },
] as const;

export const ATTRIBUTION_TOOLS = [
  "UTM-tagged links for campaigns and partner placements.",
  "Dedicated referral or campaign codes where appropriate.",
  "Weekly export or dashboard of registrations, conversions, and traffic by source.",
  "Experiment log: hypothesis, action, audience, result, lesson, next step.",
  "Before/after screenshots or reports for major campaign metrics and conversion funnels.",
] as const;

export const INTERN_ACCESS_TOOLS = [
  {
    key: "intern_dashboard",
    name: "Internship Growth Dashboard",
    access: "Intern",
    purpose: "Tasks, content, campaigns, metrics, weekly updates, and SMART goals.",
    path: "/intern",
  },
  {
    key: "utm_builder",
    name: "Campaign tracking / UTM + referral codes",
    access: "Intern",
    purpose: "No growth result counts without a unique tracking mechanism.",
    path: "/intern",
  },
  {
    key: "experiment_log",
    name: "Experiment log",
    access: "Intern",
    purpose: "Record hypothesis → action → result so learning is visible even when a test fails.",
    path: "/intern",
  },
  {
    key: "verified_metrics",
    name: "Verified KPI sources",
    access: "Read with supervisor verification",
    purpose:
      "SitGuru Admin, GA4, Search Console, Meta, TikTok, X, YouTube, Mailchimp, referral tracking, registration records.",
    path: "/intern",
  },
  {
    key: "brand_kit",
    name: "SitGuru brand standards",
    access: "Intern",
    purpose: "Use SitGuru branding only. Do not use university marks unless that university authorizes them.",
    path: "/intern",
  },
  {
    key: "social_accounts",
    name: "SitGuru official social",
    access: "Intern",
    purpose:
      "Promote @SitGuruOfficial. Draft and log posts in the intern portal. Account passwords stay with SitGuru.",
    path: "/intern",
  },
  {
    key: "public_events",
    name: "Events to promote",
    access: "Intern",
    purpose: "Public pet events and tracking links only. No Events admin and no partner contact emails.",
    path: "/intern",
  },
  {
    key: "limited_admin",
    name: "Role-based SitGuru tools",
    access: "Granted per intern",
    purpose:
      "Only the platform and analytics access necessary for the role. No customer/pet-parent PII in portfolio work.",
    path: "/admin/internship",
  },
] as const;

export const SUPERVISION_CONTROLS = [
  "Named professional site supervisor with direct, regular feedback (Jason L. Graff, Founder & CEO, unless another supervisor is assigned).",
  "Written learning objectives and a semester Market Growth Project — not routine posting-only work.",
  "Accommodate the academic calendar and the student’s approved hour requirement.",
  "The intern complements rather than replaces paid staff.",
  "Complete midpoint and final evaluations required by that intern’s university/program.",
  "Unpaid at the employer level unless SitGuru later elects compensation. No paid job is promised at the end.",
  "Confirm with the intern’s university that the supervisor and remote site satisfy that program’s standards.",
] as const;

export const COMPLIANCE_CONTROLS = [
  "SitGuru is a for-profit business. Design the internship so the student is the primary educational beneficiary.",
  "Academic credit helps, but credit alone does not determine wage-and-hour compliance. Review uncertain arrangements with qualified counsel (DOL Fact Sheet #71 / primary-beneficiary test).",
  "Do not use a university’s logos, athletics marks, or other restricted graphics unless that university specifically authorizes use.",
  "Do not imply a university endorses SitGuru. It is appropriate to say the role may be eligible for credit subject to that university’s approval.",
  "Avoid presenting the internship as commission-based selling, required personal-network solicitation, or a brand-ambassador arrangement.",
  "Employer identity: Graff Enterprises LLC dba SitGuru.",
  ATTRIBUTION_RULE,
] as const;

export const INFORMATION_ACCESS_CONTROLS = [
  "Give the intern only the platform and analytics access necessary for the role.",
  "Use role-based permissions for social accounts, admin tools, customer data, and partner information.",
  "Keep customer or Pet Parent personally identifiable information out of student portfolio materials; use aggregated or anonymized results.",
  "Self-reported numbers are not attributable until the supervisor verifies them from an approved source.",
] as const;

export const SMART_CHECKLIST = [
  {
    letter: "S",
    label: "Specific",
    prompt: "What exact market, channel, and audience will this intern move?",
  },
  {
    letter: "M",
    label: "Measurable",
    prompt: "Which Tier 1 or Tier 2 metric, from which SitGuru-controlled source?",
  },
  {
    letter: "A",
    label: "Achievable",
    prompt: "Is the target a planning range to finalize after the two-week baseline — not a promise?",
  },
  {
    letter: "R",
    label: "Relevant",
    prompt: "Does this serve Pet Parent acquisition and marketplace density, not vanity reach alone?",
  },
  {
    letter: "T",
    label: "Time-bound",
    prompt: "What is due by midpoint vs. final week of this intern’s academic calendar?",
  },
] as const;

export const SUCCESS_DEFINITION = [
  {
    area: "Academic",
    definition:
      "At least one intern is formally approved and enrolled for academic credit by their own university, when that is the agreed path.",
  },
  {
    area: "Student value",
    definition:
      "The intern completes a Business Growth Report with verified outcomes and lessons learned, plus a sanitized portfolio case study.",
  },
  {
    area: "Business growth",
    definition:
      "The Business Growth Report documents measurable movement in at least one Tier 1 business outcome and supporting conversion metrics, plus what did not work.",
  },
  {
    area: "Funding readiness",
    definition:
      "If the intern’s university offers funding, the student submits a complete application on that university’s timeline. Funding is never guaranteed by SitGuru.",
  },
  {
    area: "Repeatability",
    definition:
      "SitGuru finishes with a documented campaign system, analytics dashboard, and playbook reusable for future markets and interns.",
  },
  {
    area: "Program decision",
    definition:
      "SitGuru can make an evidence-based decision to repeat, expand, pay, or redesign the internship for the next term.",
  },
] as const;

export function internshipPositioningSummary() {
  return `${INTERNSHIP_TITLE} works a structured ${MARKET_GROWTH_PROJECT_NAME}: research a target market, establish baseline metrics, execute multi-platform content and community campaigns, analyze results, and document measurable outcomes and lessons learned in a Business Growth Report. ${HOURS_RULE}`;
}
