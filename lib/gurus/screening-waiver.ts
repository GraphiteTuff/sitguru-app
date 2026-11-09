/**
 * Admin Trust & Safety screening waiver.
 * Distinct from Checkr clear/passed — never treat a waiver as verified screening.
 */

export const SCREENING_WAIVED_BY_ADMIN = "waived_by_admin";

export const SCREENING_WAIVER_SCOPES = [
  "trust_safety_screening",
  "checkr_invitation",
] as const;

export type ScreeningWaiverScope = (typeof SCREENING_WAIVER_SCOPES)[number];

export type ScreeningWaiverInput = {
  adminUserId: string;
  reason: string;
  scope?: ScreeningWaiverScope;
  now?: string;
};

export function isScreeningWaivedByAdmin(status?: string | null) {
  return (
    String(status || "")
      .trim()
      .toLowerCase() === SCREENING_WAIVED_BY_ADMIN
  );
}

/** Checklist / activation satisfied — not a verified credential. */
export function isScreeningRequirementSatisfied(input: {
  backgroundCheckStatus?: string | null;
  checkrStatus?: string | null;
  globallyBypassed?: boolean;
}) {
  if (input.globallyBypassed) return true;
  if (isScreeningWaivedByAdmin(input.backgroundCheckStatus)) return true;
  const combined = `${input.backgroundCheckStatus || ""} ${input.checkrStatus || ""}`
    .trim()
    .toLowerCase();
  return (
    combined.includes("clear") ||
    combined.includes("complete") ||
    combined.includes("approved") ||
    combined.includes("passed")
  );
}

/** True only when screening was actually cleared — never for admin waiver. */
export function isScreeningVerifiedBadge(status?: string | null) {
  if (isScreeningWaivedByAdmin(status)) return false;
  const value = String(status || "")
    .trim()
    .toLowerCase();
  return (
    value === "clear" ||
    value === "completed" ||
    value === "complete" ||
    value === "passed" ||
    value === "approved"
  );
}

export function screeningDisplayLabel(status?: string | null) {
  if (isScreeningWaivedByAdmin(status)) return "Waived by Admin";
  if (isScreeningVerifiedBadge(status)) return "Screening clear";
  const value = String(status || "")
    .trim()
    .toLowerCase();
  if (!value || value === "not_started") return "Not started";
  if (value.includes("pending") || value.includes("invited")) return "In progress";
  return value.replaceAll("_", " ");
}

export function buildScreeningWaiverPayload(input: ScreeningWaiverInput) {
  const reason = String(input.reason || "").trim();
  if (!input.adminUserId) {
    return { ok: false as const, error: "An authorized administrator must approve this waiver." };
  }
  if (reason.length < 8) {
    return {
      ok: false as const,
      error: "Enter a clear waiver reason (at least 8 characters).",
    };
  }
  const now = input.now || new Date().toISOString();
  const scope = input.scope || "trust_safety_screening";
  return {
    ok: true as const,
    guruUpdate: {
      background_check_status: SCREENING_WAIVED_BY_ADMIN,
      screening_waiver_status: SCREENING_WAIVED_BY_ADMIN,
      screening_waived_at: now,
      screening_waived_by: input.adminUserId,
      screening_waiver_reason: reason,
      screening_waiver_scope: scope,
      updated_at: now,
    },
    audit: {
      action: "waived guru trust and safety screening",
      area: "trust_safety",
      metadata: {
        status: SCREENING_WAIVED_BY_ADMIN,
        reason,
        scope,
        verified_screening: false,
      },
    },
  };
}
