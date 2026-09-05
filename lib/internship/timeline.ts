/**
 * Employer execution timeline for a SitGuru internship cohort.
 * SitGuru-owned rows apply to every intern. University-owned rows attach
 * to a student institution and must not be copied onto another school.
 */

export type TimelineOwner = "sitguru" | "intern" | "university";

export type TimelineMilestoneSeed = {
  key: string;
  title: string;
  dueOn: string;
  phase: string;
  owner: TimelineOwner;
  universitySlug?: string;
  action: string;
};

/** SitGuru Spring 2027 employer calendar. Academic dates still follow each intern's university. */
export const SPRING_2027_SITGURU_MILESTONES: TimelineMilestoneSeed[] = [
  {
    key: "program_confirmation",
    title: "Program confirmation",
    dueOn: "2026-09-18",
    phase: "Recruiting",
    owner: "sitguru",
    action:
      "Confirm project structure, site-supervisor expectations, credit-eligibility language, and any known university funding windows. Do not invent a university’s unpublished deadline.",
  },
  {
    key: "post_recruit",
    title: "Post & recruit",
    dueOn: "2026-09-30",
    phase: "Recruiting",
    owner: "sitguru",
    action:
      "Publish the SitGuru Internship Program posting. Target communications, business, marketing, and related majors at any eligible university.",
  },
  {
    key: "candidate_pipeline",
    title: "Candidate pipeline",
    dueOn: "2026-10-31",
    phase: "Recruiting",
    owner: "sitguru",
    action:
      "Screen, interview, and explain academic credit/funding as opportunities subject to the student’s university approval.",
  },
  {
    key: "select_finalist",
    title: "Select finalist + alternate",
    dueOn: "2026-11-13",
    phase: "Onboarding",
    owner: "sitguru",
    action:
      "Choose the primary intern and one alternate. Confirm that intern’s hours and academic pathway. Add a second intern only with a distinct project and supervision capacity.",
  },
  {
    key: "employer_paperwork",
    title: "Employer paperwork",
    dueOn: "2026-11-20",
    phase: "Onboarding",
    owner: "sitguru",
    action:
      "Complete the employer acceptance letter on SitGuru / Graff Enterprises LLC letterhead using that intern’s university template when provided.",
  },
  {
    key: "onboarding_ready",
    title: "Onboarding, access, SMART baseline",
    dueOn: "2027-01-09",
    phase: "Onboarding",
    owner: "sitguru",
    action:
      "Prepare portal access, KPI baseline template, timesheet, weekly check-in schedule, confidentiality, brand standards, and SMART learning plan before the intern’s academic start.",
  },
  {
    key: "phase_1",
    title: "Phase 1 — Baseline",
    dueOn: "2027-01-22",
    phase: "Delivery",
    owner: "intern",
    action: "Baseline, market research, KPI targets, campaign plan (Weeks 1–2 deliverable).",
  },
  {
    key: "phase_2",
    title: "Phase 2 — Campaign system",
    dueOn: "2027-02-19",
    phase: "Delivery",
    owner: "intern",
    action: "Build content system, tracking, creative assets, and first experiments.",
  },
  {
    key: "phase_3",
    title: "Phase 3 — Execute and iterate",
    dueOn: "2027-04-02",
    phase: "Delivery",
    owner: "intern",
    action: "Execute campaigns, pause for that intern’s academic breaks, keep the experiment log current.",
  },
  {
    key: "phase_4",
    title: "Phase 4 — Optimize and document",
    dueOn: "2027-04-23",
    phase: "Delivery",
    owner: "intern",
    action: "Optimize strongest channels, consolidate documentation, prepare final analysis.",
  },
  {
    key: "closeout",
    title: "Closeout — growth report + evaluation",
    dueOn: "2027-04-30",
    phase: "Closeout",
    owner: "sitguru",
    action:
      "Final presentation, Business Growth Report, handoff package, and any midpoint/final evaluations that intern’s university requires.",
  },
];

/** Penn State Abington configuration only — not the SitGuru program calendar. */
export const SPRING_2027_PENN_STATE_ABINGTON_MILESTONES: TimelineMilestoneSeed[] = [
  {
    key: "psu_abington_career_fair",
    title: "Optional campus recruiting event",
    dueOn: "2026-10-21",
    phase: "Recruiting",
    owner: "university",
    universitySlug: "penn-state-abington",
    action:
      "Optional Penn State Abington Fall 2026 Internship & Career Fair. Verify with that campus before treating as required.",
  },
  {
    key: "psu_abington_credit_deadline",
    title: "Published Spring 2027 credit application deadline",
    dueOn: "2026-12-04",
    phase: "Onboarding",
    owner: "university",
    universitySlug: "penn-state-abington",
    action:
      "Penn State Abington currently lists December 4, 2026 for Spring 2027 internship applications and advises 2–4 weeks for processing. Confirm before committing to a student.",
  },
  {
    key: "psu_abington_term",
    title: "Published Spring 2027 class dates",
    dueOn: "2027-01-11",
    phase: "Delivery",
    owner: "university",
    universitySlug: "penn-state-abington",
    action:
      "Penn State Abington currently lists classes January 11–April 30, 2027, finals May 3–6, Spring Break March 7–13. Other universities will differ.",
  },
  {
    key: "psu_abington_funding_watch",
    title: "Watch Spring 2027 funding cycle",
    dueOn: "2026-12-15",
    phase: "Onboarding",
    owner: "university",
    universitySlug: "penn-state-abington",
    action:
      "As of September 5, 2026 the public funding page still showed Fall 2026. Contact internships-ab@psu.edu and monitor that university’s funding page. Do not invent a Spring deadline.",
  },
];

export function milestoneStatus(dueOn: string, today = new Date()) {
  const due = new Date(`${dueOn}T12:00:00`);
  if (Number.isNaN(due.getTime())) return "scheduled";
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return "due_or_past";
  if (diff <= 14) return "upcoming";
  return "scheduled";
}
