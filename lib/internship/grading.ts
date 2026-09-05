import { compareKpi, type KpiTrend } from "@/lib/sitguru/kpi-trend";
import type {
  InternshipMetric,
  InternshipSmartGoal,
  InternshipWorkspaceData,
} from "@/lib/internship/types";

export const EMPLOYER_LETTERS = ["A", "B", "C", "D", "F", "I"] as const;
export type EmployerLetter = (typeof EMPLOYER_LETTERS)[number];

export const EMPLOYER_GRADE_DISCLAIMER =
  "This is SitGuru’s employer evaluation of KPI and output versus agreed SMART targets. It does not replace the university’s official course grade.";

export const REVIEW_DECISIONS = [
  "approved",
  "revision_requested",
  "not_accepted",
] as const;
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

export const KPI_TIERS = ["tier_1", "tier_2", "tier_3", "none"] as const;
export type KpiTier = (typeof KPI_TIERS)[number];

export type EmployerLetterTone =
  | "emerald"
  | "sky"
  | "amber"
  | "rose"
  | "violet"
  | "slate";

export const KPI_LETTER_RUBRIC = [
  {
    letter: "A" as const,
    minPct: 100,
    evidence: "Verified Tier 1 business outcome",
    tone: "emerald" as const,
    demoCurrent: 110,
    demoTarget: 100,
    meaning:
      "Met or exceeded the agreed SMART target on a SitGuru-verified Tier 1 KPI (Pet Parent acquisition, bookable Gurus, bookings/intent, approved partners, referral activations, or revenue when available).",
  },
  {
    letter: "B" as const,
    minPct: 85,
    evidence: "Near Tier 1 target, or exceeded Tier 2 with Tier 1 movement",
    tone: "emerald" as const,
    demoCurrent: 90,
    demoTarget: 100,
    meaning:
      "85–99% of the agreed Tier 1 target, or 100%+ of a Tier 2 conversion target with documented movement toward a business outcome.",
  },
  {
    letter: "C" as const,
    minPct: 50,
    evidence: "Meaningful verified progress",
    tone: "amber" as const,
    demoCurrent: 65,
    demoTarget: 100,
    meaning:
      "50–84% of the agreed target, or strong verified conversion evidence that has not yet produced the business outcome.",
  },
  {
    letter: "D" as const,
    minPct: 1,
    evidence: "Activity / awareness, weak attributable output",
    tone: "rose" as const,
    demoCurrent: 20,
    demoTarget: 100,
    meaning:
      "Some verified output, but mostly Tier 3 awareness (reach, views, followers) or well below half the agreed target.",
  },
  {
    letter: "F" as const,
    minPct: 0,
    evidence: "No attributable result",
    tone: "rose" as const,
    demoCurrent: 0,
    demoTarget: 100,
    meaning:
      "Work was submitted without SitGuru-verified evidence against the agreed KPI, or verified results are zero versus the target.",
  },
  {
    letter: "I" as const,
    minPct: null,
    evidence: "Incomplete measurement setup",
    tone: "slate" as const,
    demoCurrent: null,
    demoTarget: null,
    meaning:
      "Baseline, SMART target, or verified source is missing, so a KPI letter cannot be calculated yet.",
  },
] as const;

const LETTER_RANK: Record<EmployerLetter, number> = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  F: 1,
  I: 0,
};

const TIER1_PATTERN =
  /pet.?parent|registration|booking|guru|partner|referral|revenue|transaction|marketplace/i;
const TIER2_PATTERN =
  /conversion|opt.?in|lead|landing|session|utm|qualified|click.?through|ctr/i;
const TIER3_PATTERN =
  /reach|impression|follower|view|engagement|share|save|like|play/i;

export function parseMetricNumber(value?: string | number | null) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = String(value || "").trim();
  if (!raw) return null;
  const match = raw.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

export function inferEvidenceTier(metricKeyOrLabel: string): Exclude<KpiTier, "none"> {
  const text = metricKeyOrLabel || "";
  if (TIER1_PATTERN.test(text)) return "tier_1";
  if (TIER2_PATTERN.test(text)) return "tier_2";
  if (TIER3_PATTERN.test(text)) return "tier_3";
  return "tier_3";
}

export function capLetterByEvidence(letter: EmployerLetter, tier: KpiTier): EmployerLetter {
  if (letter === "I" || tier === "none") return letter === "I" ? "I" : "F";
  const cap: EmployerLetter = tier === "tier_1" ? "A" : tier === "tier_2" ? "B" : "D";
  return LETTER_RANK[letter] > LETTER_RANK[cap] ? cap : letter;
}

export function letterFromAttainment(
  attainmentPct: number | null,
  evidenceTier: KpiTier,
): EmployerLetter {
  if (evidenceTier === "none" || attainmentPct == null) return "I";
  let letter: EmployerLetter = "F";
  if (attainmentPct >= 100) letter = "A";
  else if (attainmentPct >= 85) letter = "B";
  else if (attainmentPct >= 50) letter = "C";
  else if (attainmentPct > 0) letter = "D";
  return capLetterByEvidence(letter, evidenceTier);
}

export function attainmentPercent(input: {
  current: number | null;
  baseline: number | null;
  target: number | null;
}) {
  if (input.current == null || input.target == null) return null;
  const baseline = input.baseline ?? 0;
  if (input.target === baseline) return input.current >= input.target ? 100 : 0;
  return ((input.current - baseline) / (input.target - baseline)) * 100;
}

export function employerLetterLabel(letter?: string | null) {
  const row = KPI_LETTER_RUBRIC.find((item) => item.letter === letter);
  if (!row) return letter ? String(letter) : "Not graded";
  return `${row.letter} — ${row.evidence}`;
}

export function employerLetterTone(letter?: string | null): EmployerLetterTone {
  if (letter === "A" || letter === "B") return "emerald";
  if (letter === "C") return "amber";
  if (letter === "D" || letter === "F") return "rose";
  return "slate";
}

export function reviewDecisionLabel(decision?: string | null) {
  if (decision === "approved") return "Approved";
  if (decision === "revision_requested") return "Revision requested";
  if (decision === "not_accepted") return "Not accepted";
  if (decision === "submitted") return "Awaiting review";
  return "Not submitted";
}

export function kpiTrendVersusTarget(
  current: number | null,
  target: number | null,
): KpiTrend | null {
  if (current == null || target == null) return null;
  return compareKpi(current, target, { decimals: 1 });
}

export function rubricTrend(letter: EmployerLetter): KpiTrend | null {
  const row = KPI_LETTER_RUBRIC.find((item) => item.letter === letter);
  if (!row || row.demoCurrent == null || row.demoTarget == null) return null;
  return compareKpi(row.demoCurrent, row.demoTarget, { decimals: 0 });
}

export type SmartGoalStanding = {
  goalId: string;
  title: string;
  metricKey: string;
  baseline: number | null;
  target: number | null;
  current: number | null;
  attainmentPct: number | null;
  evidenceTier: KpiTier;
  letter: EmployerLetter;
  verified: boolean;
  primary: boolean;
  trend: KpiTrend | null;
};

export type KpiLetterStanding = {
  letter: EmployerLetter;
  attainmentPct: number | null;
  evidenceTier: KpiTier;
  summary: string;
  tone: EmployerLetterTone;
  trend: KpiTrend | null;
  goals: SmartGoalStanding[];
};

function latestVerifiedValue(metrics: InternshipMetric[], metricKey: string) {
  const key = metricKey.trim().toLowerCase();
  const match = metrics.find((row) => {
    if (!row.isVerified || row.valueNumeric == null) return false;
    const rowKey = `${row.metricKey} ${row.label}`.toLowerCase();
    return Boolean(key) && (row.metricKey.toLowerCase() === key || rowKey.includes(key));
  });
  return match?.valueNumeric ?? null;
}

export function suggestKpiStanding(
  smartGoals: InternshipSmartGoal[] = [],
  metrics: InternshipMetric[] = [],
): KpiLetterStanding {
  const verified = metrics.filter((row) => row.isVerified);
  const goals: SmartGoalStanding[] = smartGoals.map((goal) => {
    const metricKey = goal.metricKey || goal.specific;
    const baseline = parseMetricNumber(goal.baselineValue);
    const target = parseMetricNumber(goal.targetValue);
    const current =
      latestVerifiedValue(verified, goal.metricKey) ??
      latestVerifiedValue(verified, goal.specific);
    const evidenceTier = inferEvidenceTier(
      `${goal.metricKey} ${goal.specific} ${goal.measurable}`,
    );
    const verifiedHit = current != null;
    const attainmentPct = attainmentPercent({ current, baseline, target });
    const letter = letterFromAttainment(attainmentPct, verifiedHit ? evidenceTier : "none");
    return {
      goalId: goal.id,
      title: goal.specific || goal.metricKey || "SMART goal",
      metricKey,
      baseline,
      target,
      current,
      attainmentPct,
      evidenceTier: verifiedHit ? evidenceTier : "none",
      letter,
      verified: verifiedHit,
      primary: false,
      trend: kpiTrendVersusTarget(current, target),
    };
  });

  const primaryIndex = goals.findIndex((row) =>
    /pet.?parent|primary|acquisition/i.test(`${row.metricKey} ${row.title}`),
  );
  const resolvedIndex = primaryIndex >= 0 ? primaryIndex : 0;
  if (goals[resolvedIndex]) goals[resolvedIndex].primary = true;
  const primary = goals[resolvedIndex] || null;

  if (!primary) {
    return {
      letter: "I",
      attainmentPct: null,
      evidenceTier: "none",
      summary:
        "Set SMART targets and verify KPI from SitGuru-controlled sources before a letter can be calculated.",
      tone: "slate",
      trend: null,
      goals,
    };
  }

  return {
    letter: primary.letter,
    attainmentPct: primary.attainmentPct,
    evidenceTier: primary.evidenceTier,
    summary: `${employerLetterLabel(primary.letter)}. ${EMPLOYER_GRADE_DISCLAIMER}`,
    tone: employerLetterTone(primary.letter),
    trend: primary.trend,
    goals,
  };
}

export function workspaceKpiStanding(data: InternshipWorkspaceData) {
  return suggestKpiStanding(data.smartGoals || [], data.metrics || []);
}
