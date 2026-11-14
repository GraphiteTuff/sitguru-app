/**
 * University-neutral program syllabus extension, Spring 2027.
 *
 * Employer-owned learning outcomes and evidence categories are common.
 * Academic credit, required hours, course codes, calendars, faculty review,
 * grading, and formal approvals are always controlled by the student's school.
 *
 * The quantities below are sample *evidence targets* adapted from a Penn
 * State BA 495A proposal; they do not impose that school's rules on others.
 */
export const SYLLABUS_CORE_DELIVERABLES = [
  {
    id: "research",
    letter: "A",
    title: "Market research & competitive analysis",
    objective: "Explain SitGuru's position in an assigned pet-care market using credible research.",
    evidence: "Competitor comparison matrix, audience insights, and prioritized growth opportunities.",
    model: "Example BA 495A scope: evaluate 5 competitors and identify 3 opportunities.",
    phase: "Discover",
  },
  {
    id: "baseline",
    letter: "B",
    title: "Baseline metrics & growth strategy",
    objective: "Define the starting point and design goals linked to business outcomes.",
    evidence: "Documented KPIs, source definitions, baseline dashboard, and approved SMART goals.",
    model: "Example scope: at least 3 measurable SMART objectives.",
    phase: "Discover",
  },
  {
    id: "content",
    letter: "C",
    title: "Social media calendar & creative materials",
    objective: "Create audience-specific content for Pet Parents, Gurus, and community partners.",
    evidence: "Dated content calendar, caption and creative drafts, calls to action, and approval records.",
    model: "Example scope: 4-week editorial calendar and 12 proposed posts/assets.",
    phase: "Plan",
  },
  {
    id: "campaigns",
    letter: "D",
    title: "Campaign execution & performance review",
    objective: "Run supervised marketing initiatives with clear measures of success.",
    evidence: "Campaign briefs, approved assets, tracking links, result comparisons, and lessons learned.",
    model: "Example scope: 2 supervisor-approved campaigns.",
    phase: "Execute",
  },
  {
    id: "community",
    letter: "E",
    title: "Community growth & partnership opportunities",
    objective: "Identify useful local partners and opportunities for marketplace engagement.",
    evidence: "Outreach research, relevance assessment, prioritized partner recommendations.",
    model: "Example scope: assess 10 prospects and prioritize at least 3.",
    phase: "Execute",
  },
  {
    id: "experiments",
    letter: "F",
    title: "Marketing experimentation & analytics",
    objective: "Form a hypothesis, test responsibly, measure results, and explain improvements.",
    evidence: "Experiment hypotheses, approved method, available metrics, results, and recommended changes.",
    model: "Example scope: document 3 experiments, including tests that did not succeed.",
    phase: "Measure",
  },
  {
    id: "weekly",
    letter: "G",
    title: "Weekly reporting & learning reflection",
    objective: "Demonstrate professional progress, decision-making, and reliable hour records.",
    evidence: "Weekly check-ins, tracked hours, evidence links, manager feedback, and midpoint review.",
    model: "Example 15-week proposal: 15 weekly reports. Actual count follows approved calendar.",
    phase: "All term",
  },
  {
    id: "playbook",
    letter: "H",
    title: "SitGuru Market Growth Playbook",
    objective: "Leave reusable research, templates, procedures, and strategy behind for SitGuru.",
    evidence: "Approved growth playbook, campaign templates, handoff notes, and recommendations.",
    model: "Example scope: at least 3 reusable procedures, templates, or growth practices.",
    phase: "Handoff",
  },
  {
    id: "report",
    letter: "I",
    title: "Final Business Growth Report",
    objective: "Compare baseline against verified outcomes and explain what SitGuru should do next.",
    evidence: "Results with cited sources, campaign performance, limitations, and prioritized recommendations.",
    model: "Example scope: at least 3 evidence-based next-step recommendations.",
    phase: "Handoff",
  },
  {
    id: "presentation",
    letter: "J",
    title: "Portfolio case study & final presentation",
    objective: "Communicate the business challenge, work completed, results, and professional learning.",
    evidence: "Sanitized portfolio case study and final presentation with supervisor feedback.",
    model: "Format, attendance, and university evaluation are determined by the student's institution.",
    phase: "Handoff",
  },
] as const;

export const SYLLABUS_PHASES = [
  {
    label: "Weeks 1–2",
    title: "Discover & baseline",
    description: "Onboard; understand SitGuru, its users and market; research audiences and competitors; agree on the initial KPI baseline and SMART goals.",
    output: "Baseline & Growth Brief",
  },
  {
    label: "Weeks 3–5",
    title: "Design & prepare",
    description: "Build audience strategy, content pillars, editorial calendar, tracking links, campaign briefs, and approval-ready creative.",
    output: "Campaign & content system",
  },
  {
    label: "Weeks 6–11",
    title: "Execute & learn",
    description: "Run approved campaigns, partner research, and structured experiments; report measured results and iterate.",
    output: "Verified experiments and midpoint review",
  },
  {
    label: "Weeks 12–14",
    title: "Optimize & hand off",
    description: "Evaluate what worked, standardize reusable workflows, finalize recommendations, and build a supervisor-approved playbook.",
    output: "Market Growth Playbook",
  },
  {
    label: "Week 15",
    title: "Present & close out",
    description: "Verify hours and source evidence; complete final employer review and any university-specific report or presentation.",
    output: "Business Growth Report & final presentation",
  },
] as const;

export const SYLLABUS_ACADEMIC_FIELDS = [
  { key: "course", title: "Course and academic program", note: "Approved course code, department, credit type and learning agreement." },
  { key: "credits", title: "Credit and required hours", note: "University-prescribed credits, total hours, weekly expectations and attendance rules." },
  { key: "calendar", title: "Academic dates", note: "Start/end dates, exam flexibility, check-ins, university deadlines and reporting windows." },
  { key: "evaluation", title: "Evaluations & grading", note: "Faculty contact, midpoint/final evaluations, assessment rubric and required presentation." },
  { key: "funding", title: "Eligibility & funding", note: "University funding, work authorization, required approvals and academic records." },
] as const;

export const SYLLABUS_WORKFLOW = [
  { step: "01", label: "Assign", actor: "Ava / SitGuru manager", detail: "Publish goals, acceptance criteria, due date and resources in SitGuru." },
  { step: "02", label: "Do the work", actor: "Assigned intern", detail: "Research, draft and collaborate within approved role permissions." },
  { step: "03", label: "Record evidence", actor: "Assigned intern", detail: "Save sources, work files and notes in the assignment's SharePoint folder; log hours and weekly reflections." },
  { step: "04", label: "Submit for review", actor: "Intern → Ava", detail: "Submit the SitGuru assignment for manager feedback; revise as needed." },
  { step: "05", label: "Verify results", actor: "Manager / Founder", detail: "Approve evidence and KPI attribution before results enter the growth report." },
  { step: "06", label: "Close out", actor: "Founder + university", detail: "Complete final employer evaluation, approved university forms and presentation." },
] as const;

export const SYLLABUS_ASSESSMENT = [
  { title: "Deliverable quality", description: "Accuracy, audience relevance, completeness, originality, and professional standards." },
  { title: "Evidence & measurement", description: "Verifiable sources, honest attribution, sound analysis and explainable conclusions." },
  { title: "Initiative & collaboration", description: "Timely communication, responsiveness to feedback, teamwork, and problem-solving." },
  { title: "Reflection & improvement", description: "Reasoned decisions, documented experiments, learning from setbacks, and next steps." },
] as const;

export const SYLLABUS_GUIDELINES = [
  "Every intern has an individualized academic agreement. The university—not SitGuru's general syllabus—determines course credit, hours, required evaluations, and course grades.",
  "Work is remote and flexible around the student's approved academic calendar; live meetings and any required presentations are coordinated with the supervisor.",
  "The intern should be the primary educational beneficiary, receive direct supervision and feedback, and not replace paid staff. Academic credit alone does not settle wage-and-hour obligations.",
  "Official SitGuru content needs the assigned manager's approval before publication. University marks and claims of school endorsement need the university's separate permission.",
  "Do not export Pet Parent or Guru private information, customer contacts, passwords, confidential research, or unapproved draft material to personal portfolios or third-party AI tools.",
  "Performance results are reviewed against approved data sources and SMART goals. The employer's KPI board is not an official university course grade.",
] as const;

export const BA495A_EXAMPLE = {
  label: "Penn State BA 495A proposal example",
  credits: "6 credits proposed",
  hours: "300 total hours proposed",
  weeks: "15-week example (~20 hours/week)",
  summary: "This is an example academic mapping drawn from a student's BA 495A proposal. It does not change SitGuru's universal program, grant academic approval, or set another intern's hours.",
} as const;

export function syllabusAcademicPlanSummary(input: {
  credits: number | null;
  requiredHours: number | null;
  weeks: number | null;
  courseCode: string;
}) {
  const credits = input.credits != null && input.credits > 0 ? `${input.credits} planned credit${input.credits === 1 ? "" : "s"}` : "Credits pending";
  const hours = input.requiredHours != null && input.requiredHours > 0 ? `${input.requiredHours} planned hours` : "Hours pending";
  const weeks = input.weeks != null && input.weeks > 0 ? `${input.weeks} weeks planned` : "Academic schedule pending";
  return [input.courseCode.trim() || "Course pending", credits, hours, weeks];
}
