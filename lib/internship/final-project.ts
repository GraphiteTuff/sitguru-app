/**
 * SitGuru Market Growth Project — one semester capstone.
 * Every approved task, campaign, KPI, experiment, and reflection builds
 * the Business Growth Report: measurable outcomes and lessons learned.
 * The Playbook and portfolio are supporting outputs, not separate busywork.
 */

export const FINAL_PROJECT_OUTPUTS = [
  {
    id: "report",
    name: "Business Growth Report",
    purpose:
      "The semester destination document: what they did, verified measurable outcomes, lessons learned, and recommendations.",
  },
  {
    id: "playbook",
    name: "SitGuru Market Growth Playbook",
    purpose:
      "The reusable system left for SitGuru — supporting the Report, not a separate pile of busywork.",
  },
  {
    id: "portfolio",
    name: "Portfolio Case Study",
    purpose:
      "A sanitized professional version of the Report. No Pet Parent PII, no passwords, no unpublished SitGuru internals.",
  },
] as const;

export type FinalProjectOutputId = (typeof FINAL_PROJECT_OUTPUTS)[number]["id"];

export const FINAL_CONTRIBUTION_SECTIONS = [
  {
    id: "market_analysis",
    label: "Market Analysis",
    output: "report",
    chapter: "market_analysis",
  },
  {
    id: "audience_strategy",
    label: "Audience Strategy",
    output: "playbook",
    chapter: "audience_strategy",
  },
  {
    id: "growth_strategy",
    label: "Growth Strategy",
    output: "playbook",
    chapter: "baseline_goals",
  },
  {
    id: "content_system",
    label: "Content System",
    output: "playbook",
    chapter: "campaign_system",
  },
  {
    id: "campaign_system",
    label: "Campaign System",
    output: "playbook",
    chapter: "campaign_system",
  },
  {
    id: "pet_parent_growth",
    label: "Pet Parent Growth",
    output: "report",
    chapter: "experiments_results",
  },
  {
    id: "guru_growth",
    label: "Guru Growth",
    output: "report",
    chapter: "experiments_results",
  },
  {
    id: "partner_growth",
    label: "Partner Growth",
    output: "playbook",
    chapter: "experiments_results",
  },
  {
    id: "conversion_optimization",
    label: "Conversion Optimization",
    output: "playbook",
    chapter: "experiments_results",
  },
  {
    id: "analytics_attribution",
    label: "Analytics & Attribution",
    output: "report",
    chapter: "verified_impact",
  },
  {
    id: "sop_handoff",
    label: "SOP / Handoff",
    output: "playbook",
    chapter: "sops_handoff",
  },
  {
    id: "business_growth_report",
    label: "Business Growth Report",
    output: "report",
    chapter: "recommendations",
  },
  {
    id: "portfolio_case_study",
    label: "Portfolio Case Study",
    output: "portfolio",
    chapter: "portfolio",
  },
] as const;

export type FinalContributionSectionId =
  (typeof FINAL_CONTRIBUTION_SECTIONS)[number]["id"];

export const FINAL_WORKSPACE_CHAPTERS = [
  {
    id: "market_analysis",
    label: "Market Analysis",
    expected: 1,
    output: "report",
  },
  {
    id: "baseline_goals",
    label: "Baseline & SMART Goals",
    expected: 2,
    output: "report",
  },
  {
    id: "audience_strategy",
    label: "Audience Strategy",
    expected: 1,
    output: "playbook",
  },
  {
    id: "campaign_system",
    label: "Campaign System",
    expected: 2,
    output: "playbook",
  },
  {
    id: "experiments_results",
    label: "Experiments & Results",
    expected: 4,
    output: "report",
  },
  {
    id: "verified_impact",
    label: "Verified Business Impact",
    expected: 3,
    output: "report",
  },
  {
    id: "sops_handoff",
    label: "SOPs & Handoff",
    expected: 1,
    output: "playbook",
  },
  {
    id: "recommendations",
    label: "Final Recommendations",
    expected: 1,
    output: "report",
  },
  {
    id: "portfolio",
    label: "Portfolio Case Study",
    expected: 1,
    output: "portfolio",
  },
] as const;

export type FinalWorkspaceChapterId =
  (typeof FINAL_WORKSPACE_CHAPTERS)[number]["id"];

export const BUSINESS_GROWTH_REPORT_SECTIONS = [
  {
    id: "starting_point",
    label: "Starting Point",
    chapters: ["market_analysis"],
  },
  {
    id: "baseline_goals",
    label: "Baseline & SMART Goals",
    chapters: ["baseline_goals"],
  },
  {
    id: "methods",
    label: "How the work was done",
    chapters: ["audience_strategy", "campaign_system", "sops_handoff"],
  },
  {
    id: "experiments",
    label: "Campaign Experiments",
    chapters: ["experiments_results"],
  },
  {
    id: "outcomes",
    label: "Measurable Outcomes",
    chapters: ["verified_impact"],
  },
  {
    id: "lessons",
    label: "Lessons Learned",
    chapters: [] as string[],
  },
  {
    id: "recommendations",
    label: "Recommendations",
    chapters: ["recommendations"],
  },
] as const;

export type BusinessGrowthReportSectionId =
  (typeof BUSINESS_GROWTH_REPORT_SECTIONS)[number]["id"];

export const CAPSTONE_WEEK_PLAN = [
  {
    week: 1,
    work: "Market definition, existing SitGuru metrics, audience research",
    buildsToward: "Final report: Starting Point",
    section: "market_analysis",
  },
  {
    week: 2,
    work: "Baseline KPIs, opportunities, risks, SMART targets",
    buildsToward: "Final report: Baseline & Goals",
    section: "growth_strategy",
  },
  {
    week: 3,
    work: "Competitor/community research, Pet Parent/Guru personas",
    buildsToward: "Report: How the work was done (Audience Strategy)",
    section: "audience_strategy",
  },
  {
    week: 4,
    work: "Content pillars, messaging, channel strategy",
    buildsToward: "Report: How the work was done (Communication Strategy)",
    section: "content_system",
  },
  {
    week: 5,
    work: "Editorial calendar, campaign structure, UTM/referral tracking",
    buildsToward: "Report: How the work was done (Campaign System)",
    section: "campaign_system",
  },
  {
    week: 6,
    work: "First campaign/content experiments",
    buildsToward: "Final report: Experiment #1",
    section: "pet_parent_growth",
  },
  {
    week: 7,
    work: "Analyze results, compare to baseline, make changes",
    buildsToward: "Final report: Optimization",
    section: "analytics_attribution",
  },
  {
    week: 8,
    work: "Midpoint analysis and supervisor review",
    buildsToward: "Midpoint Report",
    section: "business_growth_report",
  },
  {
    week: 9,
    work: "Second campaign based on lessons from first",
    buildsToward: "Final report: Experiment #2",
    section: "pet_parent_growth",
  },
  {
    week: 10,
    work: "Community/partner/referral growth work",
    buildsToward: "Report: How the work was done (Community Growth)",
    section: "partner_growth",
  },
  {
    week: 11,
    work: "Conversion testing: CTA, landing pages, messaging",
    buildsToward: "Report: Experiments (Conversion Strategy)",
    section: "conversion_optimization",
  },
  {
    week: 12,
    work: "Identify highest-performing channels and repeatable tactics",
    buildsToward: "Report: Lessons learned (What Works)",
    section: "analytics_attribution",
  },
  {
    week: 13,
    work: "Final optimization campaign",
    buildsToward: "Final KPI results",
    section: "pet_parent_growth",
  },
  {
    week: 14,
    work: "SOPs, templates, reusable assets, handoff documentation",
    buildsToward: "Report: How the work was done (Playbook handoff)",
    section: "sop_handoff",
  },
  {
    week: 15,
    work: "Final verified metrics, recommendations, presentation",
    buildsToward: "Business Growth Report: measurable outcomes and lessons learned",
    section: "business_growth_report",
  },
] as const;

export type CapstoneWeek = (typeof CAPSTONE_WEEK_PLAN)[number];

export function capstoneWeekForNumber(weekNumber: number): CapstoneWeek {
  const week = Math.min(15, Math.max(1, Math.floor(weekNumber) || 1));
  return CAPSTONE_WEEK_PLAN[week - 1];
}

export function finalSectionById(id?: string | null) {
  return (
    FINAL_CONTRIBUTION_SECTIONS.find((row) => row.id === id) ||
    FINAL_CONTRIBUTION_SECTIONS[0]
  );
}

export function chapterById(id?: string | null) {
  return (
    FINAL_WORKSPACE_CHAPTERS.find((row) => row.id === id) ||
    FINAL_WORKSPACE_CHAPTERS[0]
  );
}

export function outputById(id?: string | null) {
  return FINAL_PROJECT_OUTPUTS.find((row) => row.id === id) || FINAL_PROJECT_OUTPUTS[1];
}

export type FinalProjectBlock = {
  id: string;
  kind: "weekly" | "task" | "campaign" | "experiment" | "metric" | "goal";
  section: FinalContributionSectionId;
  chapter: FinalWorkspaceChapterId;
  output: FinalProjectOutputId;
  title: string;
  summary: string;
  weekNumber: number | null;
  campaignName: string;
  smartGoal: string;
  internReported: string;
  verified: string;
  learning: string;
  included: boolean;
  hoursApproved: number | null;
};

export type FinalChapterProgress = {
  id: FinalWorkspaceChapterId;
  label: string;
  expected: number;
  included: number;
  percent: number;
  statusLabel: string;
  output: FinalProjectOutputId;
};

export type FinalProjectWorkspace = {
  overallPercent: number;
  chapters: FinalChapterProgress[];
  outputs: Array<{
    id: FinalProjectOutputId;
    name: string;
    purpose: string;
    included: number;
    percent: number;
  }>;
  blocks: FinalProjectBlock[];
};

function sectionMeta(sectionId?: string | null) {
  const section = finalSectionById(sectionId);
  return section;
}

export function assembleFinalProjectWorkspace(input: {
  weekNumber?: number;
  weeklyReviews?: Array<{
    id: string;
    weekOf: string;
    accomplished: string;
    dataShowed: string;
    didntWork: string;
    changingNextWeek: string;
    finalSection?: string;
    contributionAdded?: string;
    hoursLogged?: number | null;
    workApproved?: boolean;
    hoursApproved?: boolean;
    evidenceApproved?: boolean;
    contributionApproved?: boolean;
    internReportedKpi?: string;
    verifiedKpi?: string;
  }>;
  tasks?: Array<{
    id: string;
    title: string;
    status: string;
    supervisorApproved?: boolean;
    businessObjective?: string;
    studentNotes?: string;
    finalSection?: string;
    weekNumber?: number | null;
    internReportedValue?: string;
    verifiedValue?: string;
  }>;
  campaigns?: Array<{
    id: string;
    name: string;
    objective?: string;
    utmCampaign?: string;
    status?: string;
    finalSection?: string;
  }>;
  experiments?: Array<{
    id: string;
    hypothesis: string;
    action: string;
    result: string;
    lesson: string;
    nextStep: string;
    finalSection?: string;
    internReportedResult?: string;
    verifiedResult?: string;
    includedInFinal?: boolean;
  }>;
  metrics?: Array<{
    id: string;
    label: string;
    valueNumeric: number | null;
    isVerified: boolean;
    selfReported: boolean;
    sourceNote?: string;
    finalSection?: string;
  }>;
  smartGoals?: Array<{
    id: string;
    specific: string;
    targetValue: string;
    baselineValue: string;
    status: string;
  }>;
}): FinalProjectWorkspace {
  const blocks: FinalProjectBlock[] = [];

  for (const review of input.weeklyReviews || []) {
    const section = sectionMeta(review.finalSection);
    blocks.push({
      id: `weekly-${review.id}`,
      kind: "weekly",
      section: section.id,
      chapter: section.chapter,
      output: section.output,
      title: `Week of ${review.weekOf}`,
      summary: review.contributionAdded || review.accomplished,
      weekNumber: null,
      campaignName: "",
      smartGoal: "",
      internReported: review.internReportedKpi || "",
      verified: review.verifiedKpi || "",
      learning: review.didntWork || "",
      included: review.contributionApproved === true,
      hoursApproved:
        review.hoursApproved && review.hoursLogged != null ? review.hoursLogged : null,
    });
  }

  for (const task of input.tasks || []) {
    const section = sectionMeta(task.finalSection);
    const included = task.supervisorApproved === true || task.status === "approved";
    blocks.push({
      id: `task-${task.id}`,
      kind: "task",
      section: section.id,
      chapter: section.chapter,
      output: section.output,
      title: task.title,
      summary: task.studentNotes || task.businessObjective || "",
      weekNumber: task.weekNumber ?? null,
      campaignName: "",
      smartGoal: "",
      internReported: task.internReportedValue || "",
      verified: task.verifiedValue || "",
      learning: "",
      included,
      hoursApproved: null,
    });
  }

  for (const campaign of input.campaigns || []) {
    const section = sectionMeta(campaign.finalSection || "campaign_system");
    blocks.push({
      id: `campaign-${campaign.id}`,
      kind: "campaign",
      section: section.id,
      chapter: section.chapter,
      output: section.output,
      title: campaign.name,
      summary: campaign.objective || campaign.utmCampaign || "",
      weekNumber: null,
      campaignName: campaign.name,
      smartGoal: "",
      internReported: "",
      verified: "",
      learning: "",
      included: campaign.status === "active" || campaign.status === "completed",
      hoursApproved: null,
    });
  }

  for (const experiment of input.experiments || []) {
    const section = sectionMeta(experiment.finalSection || "pet_parent_growth");
    blocks.push({
      id: `experiment-${experiment.id}`,
      kind: "experiment",
      section: section.id,
      chapter: section.chapter,
      output: section.output,
      title: experiment.hypothesis || experiment.action,
      summary: experiment.action,
      weekNumber: null,
      campaignName: "",
      smartGoal: "",
      internReported: experiment.internReportedResult || experiment.result,
      verified: experiment.verifiedResult || "",
      learning: experiment.lesson || "",
      included: experiment.includedInFinal === true,
      hoursApproved: null,
    });
  }

  for (const metric of input.metrics || []) {
    if (metric.sourceNote?.trim().toLowerCase() === "baseline") {
      const section = sectionMeta("growth_strategy");
      blocks.push({
        id: `metric-${metric.id}`,
        kind: "metric",
        section: section.id,
        chapter: "baseline_goals",
        output: "report",
        title: `${metric.label} baseline`,
        summary: "Locked SitGuru baseline for the Market Growth Project.",
        weekNumber: null,
        campaignName: "",
        smartGoal: "",
        internReported: "",
        verified: metric.isVerified && metric.valueNumeric != null ? String(metric.valueNumeric) : "",
        learning: "",
        included: metric.isVerified,
        hoursApproved: null,
      });
      continue;
    }
    const section = sectionMeta(metric.finalSection || "analytics_attribution");
    blocks.push({
      id: `metric-${metric.id}`,
      kind: "metric",
      section: section.id,
      chapter: metric.isVerified ? "verified_impact" : section.chapter,
      output: "report",
      title: metric.label,
      summary: metric.selfReported ? "You sent this. SitGuru still needs to check it." : "From SitGuru’s own data.",
      weekNumber: null,
      campaignName: "",
      smartGoal: "",
      internReported: metric.selfReported && metric.valueNumeric != null ? String(metric.valueNumeric) : "",
      verified: metric.isVerified && metric.valueNumeric != null ? String(metric.valueNumeric) : "",
      learning: "",
      included: metric.isVerified,
      hoursApproved: null,
    });
  }

  for (const goal of input.smartGoals || []) {
    const included = goal.status === "approved" || goal.status === "locked";
    blocks.push({
      id: `goal-${goal.id}`,
      kind: "goal",
      section: "growth_strategy",
      chapter: "baseline_goals",
      output: "report",
      title: goal.specific || "SMART goal",
      summary: `Baseline ${goal.baselineValue || "—"} → target ${goal.targetValue || "—"}`,
      weekNumber: null,
      campaignName: "",
      smartGoal: goal.specific,
      internReported: "",
      verified: "",
      learning: "",
      included,
      hoursApproved: null,
    });
  }

  const chapters: FinalChapterProgress[] = FINAL_WORKSPACE_CHAPTERS.map((chapter) => {
    const included = blocks.filter((row) => row.chapter === chapter.id && row.included).length;
    const percent =
      included <= 0 ? 0 : Math.min(100, Math.round((included / chapter.expected) * 100));
    return {
      id: chapter.id,
      label: chapter.label,
      expected: chapter.expected,
      included,
      percent,
      statusLabel: included <= 0 ? "Not Started" : `${percent}%`,
      output: chapter.output,
    };
  });

  const outputs = FINAL_PROJECT_OUTPUTS.map((output) => {
    const related = chapters.filter((row) => row.output === output.id);
    const percent = related.length
      ? Math.round(related.reduce((sum, row) => sum + row.percent, 0) / related.length)
      : 0;
    return {
      id: output.id,
      name: output.name,
      purpose: output.purpose,
      included: blocks.filter((row) => row.output === output.id && row.included).length,
      percent,
    };
  });

  const overallPercent = Math.round(
    chapters.reduce((sum, row) => sum + row.percent, 0) / chapters.length,
  );

  return { overallPercent, chapters, outputs, blocks };
}

export type BusinessGrowthReportDraft = {
  name: string;
  purpose: string;
  percent: number;
  outcomes: FinalProjectBlock[];
  lessons: FinalProjectBlock[];
  sections: Array<{
    id: BusinessGrowthReportSectionId;
    label: string;
    entries: FinalProjectBlock[];
    statusLabel: string;
  }>;
};

export function assembleBusinessGrowthReport(
  workspace: FinalProjectWorkspace,
): BusinessGrowthReportDraft {
  const included = workspace.blocks.filter((row) => row.included);
  const outcomes = included.filter((row) => Boolean((row.verified || "").trim()));
  const lessons = included.filter((row) => Boolean((row.learning || "").trim()));
  const sections = BUSINESS_GROWTH_REPORT_SECTIONS.map((section) => {
    const entries =
      section.id === "outcomes"
        ? outcomes
        : section.id === "lessons"
          ? lessons
          : included.filter((row) =>
              (section.chapters as readonly string[]).includes(row.chapter),
            );
    return {
      id: section.id,
      label: section.label,
      entries,
      statusLabel: entries.length ? `${entries.length} included` : "Not Started",
    };
  });
  const filled = sections.filter((row) => row.entries.length).length;
  const percent = Math.round((filled / sections.length) * 100);
  return {
    name: "Business Growth Report",
    purpose:
      "Documents measurable outcomes and lessons learned from the SitGuru Market Growth Project.",
    percent,
    outcomes,
    lessons,
    sections,
  };
}

export function defaultFinalSectionForWeek(weekNumber: number): FinalContributionSectionId {
  return capstoneWeekForNumber(weekNumber).section;
}
