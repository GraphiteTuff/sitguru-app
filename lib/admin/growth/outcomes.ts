import { supabaseAdmin } from "@/lib/supabase/admin";

type AnyRow = Record<string, unknown>;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function int(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

async function safeRows<T>(
  query: PromiseLike<{ data: unknown; error: unknown }>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;
    if (result.error) {
      console.warn(`Growth outcomes skipped ${label}:`, result.error);
      return [];
    }
    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Growth outcomes skipped ${label}:`, error);
    return [];
  }
}

export type GrowthInitiative = {
  id: string;
  name: string;
  purpose: string;
  status: string;
  market: string;
  startOn: string | null;
  endOn: string | null;
  notes: string;
};

export type GrowthEventResult = {
  id: string;
  communityEventId: string;
  eventName: string;
  eventDate: string | null;
  location: string;
  eventType: string;
  status: string;
  objective: string;
  targetAudiences: string;
  petParentLeads: number;
  guruLeads: number;
  ambassadorLeads: number;
  qrScans: number;
  petParentRegistrations: number;
  guruRegistrations: number;
  ambassadorRegistrations: number;
  followUpCount: number;
  totalLeads: number;
  totalRegistrations: number;
  conversionRate: string;
  notes: string;
  lessonsLearned: string;
  recommendedNextAction: string;
  leadsMetricSource: string;
  registrationsMetricSource: string;
  qrScansMetricSource: string;
};

export type GrowthIntelligenceEntry = {
  id: string;
  title: string;
  studyType: string;
  audience: string;
  objective: string;
  responseCount: number;
  keyFinding: string;
  businessInterpretation: string;
  recommendation: string;
  actionTaken: string;
  followUpTest: string;
  status: string;
  testedOn: string | null;
};

function toInitiative(row: AnyRow): GrowthInitiative {
  return {
    id: text(row.id),
    name: text(row.name) || "Untitled initiative",
    purpose: text(row.purpose),
    status: text(row.status) || "active",
    market: text(row.market),
    startOn: text(row.start_on) || null,
    endOn: text(row.end_on) || null,
    notes: text(row.notes),
  };
}

function toEventResult(row: AnyRow): GrowthEventResult {
  const petParentLeads = int(row.pet_parent_leads);
  const guruLeads = int(row.guru_leads);
  const ambassadorLeads = int(row.ambassador_leads);
  const petParentRegistrations = int(row.pet_parent_registrations);
  const guruRegistrations = int(row.guru_registrations);
  const ambassadorRegistrations = int(row.ambassador_registrations);
  const totalLeads = petParentLeads + guruLeads + ambassadorLeads;
  const totalRegistrations =
    petParentRegistrations + guruRegistrations + ambassadorRegistrations;
  const conversionRate =
    totalLeads === 0
      ? "—"
      : `${((totalRegistrations / totalLeads) * 100).toFixed(1)}%`;

  return {
    id: text(row.id),
    communityEventId: text(row.community_event_id),
    eventName: text(row.event_name) || "Event",
    eventDate: text(row.event_date) || null,
    location: text(row.location),
    eventType: text(row.event_type) || "community",
    status: text(row.status) || "completed",
    objective: text(row.objective),
    targetAudiences: text(row.target_audiences),
    petParentLeads,
    guruLeads,
    ambassadorLeads,
    qrScans: int(row.qr_scans),
    petParentRegistrations,
    guruRegistrations,
    ambassadorRegistrations,
    followUpCount: int(row.follow_up_count),
    totalLeads,
    totalRegistrations,
    conversionRate,
    notes: text(row.notes),
    lessonsLearned: text(row.lessons_learned),
    recommendedNextAction: text(row.recommended_next_action),
    leadsMetricSource: text(row.leads_metric_source) || "manual",
    registrationsMetricSource:
      text(row.registrations_metric_source) || "manual",
    qrScansMetricSource: text(row.qr_scans_metric_source) || "manual",
  };
}

function toIntelligence(row: AnyRow): GrowthIntelligenceEntry {
  return {
    id: text(row.id),
    title: text(row.title) || "Untitled study",
    studyType: text(row.study_type) || "survey",
    audience: text(row.audience),
    objective: text(row.objective),
    responseCount: int(row.response_count),
    keyFinding: text(row.key_finding),
    businessInterpretation: text(row.business_interpretation),
    recommendation: text(row.recommendation),
    actionTaken: text(row.action_taken),
    followUpTest: text(row.follow_up_test),
    status: text(row.status) || "recorded",
    testedOn: text(row.tested_on) || null,
  };
}

export async function listGrowthInitiatives(limit = 8): Promise<GrowthInitiative[]> {
  const rows = await safeRows<AnyRow>(
    supabaseAdmin
      .from("growth_initiatives")
      .select(
        "id,name,purpose,status,market,start_on,end_on,notes,created_at",
      )
      .order("updated_at", { ascending: false })
      .limit(limit),
    "growth_initiatives",
  );
  return rows.map(toInitiative);
}

export async function listGrowthEventResults(limit = 12): Promise<GrowthEventResult[]> {
  const rows = await safeRows<AnyRow>(
    supabaseAdmin
      .from("growth_event_results")
      .select("*")
      .order("event_date", { ascending: false, nullsFirst: false })
      .limit(limit),
    "growth_event_results",
  );
  return rows.map(toEventResult);
}

export async function listGrowthIntelligence(limit = 12): Promise<GrowthIntelligenceEntry[]> {
  const rows = await safeRows<AnyRow>(
    supabaseAdmin
      .from("growth_intelligence_entries")
      .select("*")
      .order("tested_on", { ascending: false, nullsFirst: false })
      .limit(limit),
    "growth_intelligence",
  );
  return rows.map(toIntelligence);
}
