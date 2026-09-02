import { supabaseAdmin } from "@/lib/supabase/admin";

export const HANDSHAKE_JOB_ID = "11375329";
export const HANDSHAKE_JOB_URL =
  "https://app.joinhandshake.com/recruit/jobs/11375329/overview";

export const SCHOOL_STATUSES = ["pending", "approved"] as const;
export const MESSAGE_STATUSES = ["not_messaged", "messaged"] as const;
export const HIRE_STAGES = [
  "shortlisted",
  "contacted",
  "review",
  "challenge",
  "interview",
  "test",
  "hired",
  "passed",
] as const;

export type SchoolStatus = (typeof SCHOOL_STATUSES)[number];
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];
export type HireStage = (typeof HIRE_STAGES)[number];

export type GrowthHireSchool = {
  id: string;
  schoolName: string;
  handshakeStatus: SchoolStatus;
  applications: number;
  comments: number;
  notes: string;
};

export type GrowthHireLead = {
  id: string;
  fullName: string;
  email: string;
  school: string;
  major: string;
  gradYear: string;
  messageStatus: MessageStatus;
  stage: HireStage;
  nextFollowUp: string;
  lastContactedAt: string;
  hasResume: boolean;
  resumeFileName: string;
  notes: string;
};

export type GrowthHirePipelineSummary = {
  schools: number;
  approvedSchools: number;
  pendingSchools: number;
  leads: number;
  shortlisted: number;
  messaged: number;
  notMessaged: number;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function asSchoolStatus(value: unknown): SchoolStatus {
  return value === "approved" ? "approved" : "pending";
}

function asMessageStatus(value: unknown): MessageStatus {
  return value === "messaged" ? "messaged" : "not_messaged";
}

function asStage(value: unknown): HireStage {
  return (HIRE_STAGES as readonly string[]).includes(text(value))
    ? (text(value) as HireStage)
    : "shortlisted";
}

export function stageLabel(stage: string) {
  return stage
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function messageLabel(status: string) {
  return status === "messaged" ? "Messaged" : "Not messaged";
}

export function schoolStatusLabel(status: string) {
  return status === "approved" ? "Approved" : "Pending";
}

export async function listGrowthHireSchools(): Promise<GrowthHireSchool[]> {
  const { data, error } = await supabaseAdmin
    .from("growth_hire_schools")
    .select(
      "id,school_name,handshake_status,applications,comments,notes",
    )
    .order("school_name", { ascending: true });

  if (error) {
    console.warn("Growth hire schools skipped:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: text(row.id),
    schoolName: text(row.school_name),
    handshakeStatus: asSchoolStatus(row.handshake_status),
    applications: asNumber(row.applications),
    comments: asNumber(row.comments),
    notes: text(row.notes),
  }));
}

export async function listGrowthHireLeads(): Promise<GrowthHireLead[]> {
  const { data, error } = await supabaseAdmin
    .from("growth_hire_leads")
    .select(
      "id,full_name,email,school,major,grad_year,message_status,stage,next_follow_up,last_contacted_at,has_resume,resume_file_name,notes",
    )
    .order("full_name", { ascending: true });

  if (error) {
    console.warn("Growth hire leads skipped:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: text(row.id),
    fullName: text(row.full_name),
    email: text(row.email),
    school: text(row.school),
    major: text(row.major),
    gradYear: text(row.grad_year),
    messageStatus: asMessageStatus(row.message_status),
    stage: asStage(row.stage),
    nextFollowUp: text(row.next_follow_up),
    lastContactedAt: text(row.last_contacted_at),
    hasResume: Boolean(row.has_resume),
    resumeFileName: text(row.resume_file_name),
    notes: text(row.notes),
  }));
}

export async function getGrowthHirePipelineSummary(): Promise<GrowthHirePipelineSummary> {
  const [schools, leads] = await Promise.all([
    listGrowthHireSchools(),
    listGrowthHireLeads(),
  ]);

  return {
    schools: schools.length,
    approvedSchools: schools.filter((s) => s.handshakeStatus === "approved").length,
    pendingSchools: schools.filter((s) => s.handshakeStatus === "pending").length,
    leads: leads.length,
    shortlisted: leads.filter((lead) => lead.stage !== "passed").length,
    messaged: leads.filter((lead) => lead.messageStatus === "messaged").length,
    notMessaged: leads.filter((lead) => lead.messageStatus !== "messaged").length,
  };
}

export async function addGrowthHireSchoolRow(input: {
  schoolName: string;
  handshakeStatus?: SchoolStatus;
}) {
  const schoolName = input.schoolName.trim();
  if (!schoolName) return { ok: false as const, error: "Enter a school name." };

  const { error } = await supabaseAdmin.from("growth_hire_schools").insert({
    school_name: schoolName,
    handshake_status: input.handshakeStatus || "pending",
    handshake_job_id: HANDSHAKE_JOB_ID,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    if (error.message.toLowerCase().includes("duplicate")) {
      return { ok: false as const, error: "That school is already on the list." };
    }
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}

export async function updateGrowthHireSchoolRow(input: {
  id: string;
  handshakeStatus?: SchoolStatus;
  applications?: number;
  comments?: number;
  notes?: string;
}) {
  if (!input.id) return { ok: false as const, error: "Missing school." };

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.handshakeStatus) payload.handshake_status = input.handshakeStatus;
  if (input.applications !== undefined) payload.applications = input.applications;
  if (input.comments !== undefined) payload.comments = input.comments;
  if (input.notes !== undefined) payload.notes = input.notes;

  const { error } = await supabaseAdmin
    .from("growth_hire_schools")
    .update(payload)
    .eq("id", input.id);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function addGrowthHireLeadRow(input: {
  fullName: string;
  email?: string;
  school?: string;
  major?: string;
  gradYear?: string;
  messageStatus?: MessageStatus;
  stage?: HireStage;
  notes?: string;
  hasResume?: boolean;
}) {
  const fullName = input.fullName.trim();
  if (!fullName) return { ok: false as const, error: "Enter a candidate name." };

  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("growth_hire_leads").insert({
    full_name: fullName,
    email: input.email || null,
    school: input.school || null,
    major: input.major || null,
    grad_year: input.gradYear || null,
    source: "handshake",
    handshake_job_id: HANDSHAKE_JOB_ID,
    shortlisted: true,
    message_status: input.messageStatus || "not_messaged",
    stage: input.stage || "shortlisted",
    has_resume: Boolean(input.hasResume),
    notes: input.notes || null,
    last_contacted_at:
      input.messageStatus === "messaged" ? now : null,
    updated_at: now,
  });

  if (error) {
    if (error.message.toLowerCase().includes("duplicate")) {
      return { ok: false as const, error: "That candidate is already on the list." };
    }
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}

export async function updateGrowthHireLeadRow(input: {
  id: string;
  email?: string;
  school?: string;
  major?: string;
  gradYear?: string;
  messageStatus?: MessageStatus;
  stage?: HireStage;
  nextFollowUp?: string;
  notes?: string;
  hasResume?: boolean;
}) {
  if (!input.id) return { ok: false as const, error: "Missing candidate." };

  const now = new Date().toISOString();
  const payload: Record<string, unknown> = { updated_at: now };
  if (input.email !== undefined) payload.email = input.email || null;
  if (input.school !== undefined) payload.school = input.school || null;
  if (input.major !== undefined) payload.major = input.major || null;
  if (input.gradYear !== undefined) payload.grad_year = input.gradYear || null;
  if (input.messageStatus) {
    payload.message_status = input.messageStatus;
    if (input.messageStatus === "messaged") payload.last_contacted_at = now;
  }
  if (input.stage) payload.stage = input.stage;
  if (input.nextFollowUp !== undefined) {
    payload.next_follow_up = input.nextFollowUp || null;
  }
  if (input.notes !== undefined) payload.notes = input.notes || null;
  if (input.hasResume !== undefined) payload.has_resume = input.hasResume;

  const { error } = await supabaseAdmin
    .from("growth_hire_leads")
    .update(payload)
    .eq("id", input.id);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
