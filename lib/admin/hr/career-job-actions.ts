"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  CAREER_CATEGORIES,
  CAREER_STATUSES,
  CAREER_TRACKS,
  COMPENSATION_TYPES,
  EMPLOYMENT_TYPES,
} from "@/lib/careers/types";
import { deleteCareerJobRow, saveCareerJobRow } from "@/lib/careers/jobs";

function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function pick<T extends string>(value: string, allowed: readonly T[], fallback: T) {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function refreshCareers(id?: string) {
  revalidatePath("/careers", "layout");
  revalidatePath("/admin/hr");
  revalidatePath("/admin/hr/careers");
  if (id) revalidatePath(`/admin/hr/careers/${id}`);
}

function bounce(kind: "ok" | "error", message: string, id?: string): never {
  const path = id ? `/admin/hr/careers/${id}` : "/admin/hr/careers";
  redirect(`${path}?${kind}=${encodeURIComponent(message)}`);
}

async function requireHr() {
  const actor = await getAdminIdentity();
  if (!actor?.canManageUsers) {
    bounce("error", "Only Super Admins or HR can publish SitGuru careers.");
  }
  return actor;
}

export async function saveCareerJob(formData: FormData) {
  const actor = await requireHr();
  const id = field(formData, "id") || undefined;
  const highlights = field(formData, "highlights")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const result = await saveCareerJobRow(
    {
      id,
      slug: field(formData, "slug"),
      title: field(formData, "title"),
      category: pick(field(formData, "category"), CAREER_CATEGORIES, "career"),
      track: pick(field(formData, "track"), CAREER_TRACKS, "general"),
      location: field(formData, "location") || "Remote",
      employmentType: pick(
        field(formData, "employmentType"),
        EMPLOYMENT_TYPES,
        "full_time",
      ),
      compensationType: pick(
        field(formData, "compensationType"),
        COMPENSATION_TYPES,
        "paid_salary",
      ),
      compensationNote: field(formData, "compensationNote"),
      hoursPerWeek: field(formData, "hoursPerWeek"),
      academicCreditEligible: formData.get("academicCreditEligible") === "on",
      collegePartner: field(formData, "collegePartner"),
      status: pick(field(formData, "status"), CAREER_STATUSES, "draft"),
      summary: field(formData, "summary"),
      description: field(formData, "description"),
      highlights,
      applyEmail: field(formData, "applyEmail") || "jason@sitguru.com",
      applyUrl: field(formData, "applyUrl"),
      sortOrder: Number(field(formData, "sortOrder") || 100),
    },
    actor.id,
  );

  refreshCareers(result.ok ? result.id : id);
  if (!result.ok) bounce("error", result.error, id);
  bounce("ok", id ? "Role updated and synced to Careers." : "Role added to Careers.", result.id);
}

export async function deleteCareerJob(formData: FormData) {
  await requireHr();
  const id = field(formData, "id");
  const result = await deleteCareerJobRow(id);
  refreshCareers();
  if (!result.ok) bounce("error", result.error, id);
  bounce("ok", "Role removed from Careers.");
}
