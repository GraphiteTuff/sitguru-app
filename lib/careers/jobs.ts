import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  CAREER_CATEGORIES,
  CAREER_STATUSES,
  CAREER_TRACKS,
  COMPENSATION_TYPES,
  EMPLOYMENT_TYPES,
  slugifyTitle,
  type CareerCategory,
  type CareerJob,
  type CareerJobInput,
  type CareerStatus,
  type CareerTrack,
  type CompensationType,
  type EmploymentType,
} from "@/lib/careers/types";

export * from "@/lib/careers/types";

const SELECT_COLUMNS =
  "id, slug, title, category, track, location, employment_type, compensation_type, compensation_note, hours_per_week, academic_credit_eligible, college_partner, status, summary, description, highlights, apply_email, apply_url, sort_order, published_at, created_at, updated_at";

function asCategory(value: unknown): CareerCategory {
  return (CAREER_CATEGORIES as readonly string[]).includes(String(value))
    ? (value as CareerCategory)
    : "career";
}

function asStatus(value: unknown): CareerStatus {
  return (CAREER_STATUSES as readonly string[]).includes(String(value))
    ? (value as CareerStatus)
    : "draft";
}

function asTrack(value: unknown): CareerTrack {
  return (CAREER_TRACKS as readonly string[]).includes(String(value))
    ? (value as CareerTrack)
    : "general";
}

function asEmployment(value: unknown): EmploymentType {
  return (EMPLOYMENT_TYPES as readonly string[]).includes(String(value))
    ? (value as EmploymentType)
    : "full_time";
}

function asCompensation(value: unknown): CompensationType {
  return (COMPENSATION_TYPES as readonly string[]).includes(String(value))
    ? (value as CompensationType)
    : "paid_salary";
}

function mapRow(row: Record<string, unknown>): CareerJob {
  const highlights = Array.isArray(row.highlights)
    ? row.highlights.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  return {
    id: String(row.id || ""),
    slug: String(row.slug || ""),
    title: String(row.title || ""),
    category: asCategory(row.category),
    track: asTrack(row.track),
    location: String(row.location || "Remote"),
    employmentType: asEmployment(row.employment_type),
    compensationType: asCompensation(row.compensation_type),
    compensationNote: String(row.compensation_note || ""),
    hoursPerWeek: String(row.hours_per_week || ""),
    academicCreditEligible: Boolean(row.academic_credit_eligible),
    collegePartner: String(row.college_partner || ""),
    status: asStatus(row.status),
    summary: String(row.summary || ""),
    description: String(row.description || ""),
    highlights,
    applyEmail: String(row.apply_email || "jason@sitguru.com"),
    applyUrl: String(row.apply_url || ""),
    sortOrder: Number(row.sort_order || 100),
    publishedAt: row.published_at ? String(row.published_at) : null,
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || ""),
  };
}

export async function listCareerJobs() {
  const { data, error } = await supabaseAdmin
    .from("career_jobs")
    .select(SELECT_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[career_jobs] list", error.message);
    return [] as CareerJob[];
  }

  return ((data || []) as Record<string, unknown>[]).map(mapRow);
}

export async function countCareerJobs() {
  const jobs = await listCareerJobs();
  return {
    total: jobs.length,
    published: jobs.filter((job) => job.status === "published").length,
    internships: jobs.filter(
      (job) => job.category === "internship" && job.status === "published",
    ).length,
    careers: jobs.filter(
      (job) => job.category === "career" && job.status === "published",
    ).length,
    drafts: jobs.filter((job) => job.status === "draft").length,
  };
}

export async function getCareerJobById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("career_jobs")
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapRow(data as Record<string, unknown>);
}

export async function listPublishedCareerJobs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("career_jobs")
    .select(SELECT_COLUMNS)
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false });

  if (error) {
    console.error("[career_jobs] published", error.message);
    return [] as CareerJob[];
  }

  return ((data || []) as Record<string, unknown>[]).map(mapRow);
}

export async function getPublishedCareerJobBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("career_jobs")
    .select(SELECT_COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return mapRow(data as Record<string, unknown>);
}

async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugifyTitle(base) || `role-${Date.now()}`;
  let candidate = root;
  let attempt = 2;

  while (attempt < 40) {
    const { data } = await supabaseAdmin
      .from("career_jobs")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data || (excludeId && data.id === excludeId)) return candidate;
    candidate = `${root}-${attempt}`;
    attempt += 1;
  }

  return `${root}-${Date.now()}`;
}

export async function saveCareerJobRow(
  input: CareerJobInput,
  actorId?: string | null,
) {
  const title = input.title.trim();
  if (!title) return { ok: false as const, error: "Title is required." };

  const slug = await uniqueSlug(input.slug || title, input.id);
  const payload = {
    slug,
    title,
    category: input.category,
    track: input.track,
    location: input.location.trim() || "Remote",
    employment_type: input.employmentType,
    compensation_type: input.compensationType,
    compensation_note: input.compensationNote?.trim() || null,
    hours_per_week: input.hoursPerWeek?.trim() || null,
    academic_credit_eligible: Boolean(input.academicCreditEligible),
    college_partner: input.collegePartner?.trim() || null,
    status: input.status,
    summary: input.summary.trim(),
    description: input.description.trim(),
    highlights: input.highlights.map((item) => item.trim()).filter(Boolean),
    apply_email: input.applyEmail?.trim() || "jason@sitguru.com",
    apply_url: input.applyUrl?.trim() || null,
    sort_order: Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 100,
    published_at:
      input.status === "published" ? new Date().toISOString() : null,
    updated_by: actorId || null,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data, error } = await supabaseAdmin
      .from("career_jobs")
      .update(payload)
      .eq("id", input.id)
      .select("id")
      .maybeSingle();
    if (error || !data) {
      return {
        ok: false as const,
        error: error?.message || "Could not update this role.",
      };
    }
    return { ok: true as const, id: String(data.id) };
  }

  const { data, error } = await supabaseAdmin
    .from("career_jobs")
    .insert({ ...payload, created_by: actorId || null })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false as const,
      error: error?.message || "Could not create this role.",
    };
  }
  return { ok: true as const, id: String(data.id) };
}

export async function deleteCareerJobRow(id: string) {
  const { error } = await supabaseAdmin.from("career_jobs").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
