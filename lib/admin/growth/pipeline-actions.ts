"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  HIRE_STAGES,
  MESSAGE_STATUSES,
  SCHOOL_STATUSES,
  addGrowthHireLeadRow,
  addGrowthHireSchoolRow,
  updateGrowthHireLeadRow,
  updateGrowthHireSchoolRow,
  type HireStage,
  type MessageStatus,
  type SchoolStatus,
} from "@/lib/admin/growth/pipeline";

function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function asSchoolStatus(value: string): SchoolStatus {
  return (SCHOOL_STATUSES as readonly string[]).includes(value)
    ? (value as SchoolStatus)
    : "pending";
}

function asMessageStatus(value: string): MessageStatus {
  return (MESSAGE_STATUSES as readonly string[]).includes(value)
    ? (value as MessageStatus)
    : "not_messaged";
}

function asStage(value: string): HireStage {
  return (HIRE_STAGES as readonly string[]).includes(value)
    ? (value as HireStage)
    : "shortlisted";
}

function refreshHire() {
  revalidatePath("/admin/hr");
  revalidatePath("/admin/hr/growth-hire");
}

function bounce(kind: "ok" | "error", message: string, hash = "schools"): never {
  redirect(
    `/admin/hr/growth-hire?${kind}=${encodeURIComponent(message)}#${hash}`,
  );
}

async function requireHr() {
  const actor = await getAdminIdentity();
  if (!actor?.canManageUsers) {
    bounce("error", "Only Super Admins can update this hire pipeline.");
  }
  return actor;
}

export async function addGrowthHireSchool(formData: FormData) {
  await requireHr();
  const result = await addGrowthHireSchoolRow({
    schoolName: field(formData, "schoolName"),
    handshakeStatus: asSchoolStatus(field(formData, "handshakeStatus")),
  });
  refreshHire();
  if (!result.ok) bounce("error", result.error);
  bounce("ok", "School added to the Handshake list.");
}

export async function updateGrowthHireSchool(formData: FormData) {
  await requireHr();
  const result = await updateGrowthHireSchoolRow({
    id: field(formData, "id"),
    handshakeStatus: asSchoolStatus(field(formData, "handshakeStatus")),
    applications: Number(field(formData, "applications") || 0),
    comments: Number(field(formData, "comments") || 0),
    notes: field(formData, "notes"),
  });
  refreshHire();
  if (!result.ok) bounce("error", result.error);
  bounce("ok", "School updated.");
}

export async function addGrowthHireLead(formData: FormData) {
  await requireHr();
  const result = await addGrowthHireLeadRow({
    fullName: field(formData, "fullName"),
    email: field(formData, "email"),
    school: field(formData, "school"),
    major: field(formData, "major"),
    gradYear: field(formData, "gradYear"),
    messageStatus: asMessageStatus(field(formData, "messageStatus")),
    stage: asStage(field(formData, "stage")),
    notes: field(formData, "notes"),
    hasResume: field(formData, "hasResume") === "on",
  });
  refreshHire();
  if (!result.ok) bounce("error", result.error, "candidates");
  bounce("ok", "Candidate added.", "candidates");
}

export async function updateGrowthHireLead(formData: FormData) {
  await requireHr();
  const result = await updateGrowthHireLeadRow({
    id: field(formData, "id"),
    email: field(formData, "email"),
    school: field(formData, "school"),
    major: field(formData, "major"),
    gradYear: field(formData, "gradYear"),
    messageStatus: asMessageStatus(field(formData, "messageStatus")),
    stage: asStage(field(formData, "stage")),
    nextFollowUp: field(formData, "nextFollowUp"),
    notes: field(formData, "notes"),
    hasResume: field(formData, "hasResume") === "on",
  });
  refreshHire();
  if (!result.ok) bounce("error", result.error, "candidates");
  bounce("ok", "Candidate updated.", "candidates");
}
