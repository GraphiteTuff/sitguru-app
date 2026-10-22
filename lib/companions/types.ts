/**
 * Shared types for SitGuru AI companions (Rogue, Scout, Taco, Delilah).
 */

export const COMPANION_IDS = ["rogue", "scout", "taco", "delilah"] as const;

export type CompanionId = (typeof COMPANION_IDS)[number];

export type CompanionWorkspaceRole =
  | "guest"
  | "pet_parent"
  | "guru"
  | "ambassador"
  | "partner"
  | "admin";

export type CompanionMemoryScope = "shared" | "companion";

export type CompanionMemoryCategory =
  | "preference"
  | "care"
  | "location"
  | "schedule"
  | "communication"
  | "other";

export type CompanionMemorySource =
  | "explicit_user"
  | "user_correction"
  | "user_forget"
  | "system";

export type CompanionMessageRole = "user" | "assistant" | "system";

export function isCompanionId(value: unknown): value is CompanionId {
  return (
    typeof value === "string" &&
    (COMPANION_IDS as readonly string[]).includes(value.toLowerCase())
  );
}

export function normalizeCompanionId(
  value: unknown,
  fallback: CompanionId = "rogue",
): CompanionId {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  return isCompanionId(raw) ? raw : fallback;
}
