/**
 * Temporary Trust & Safety Screening bypass.
 *
 * When enabled, Guru Trust & Safety / Checkr screening is treated as complete
 * (green) for all Gurus — including brand-new applicants — so onboarding is
 * not blocked. Flip to false when Checkr screening should be required again.
 */
export const TRUST_SAFETY_SCREENING_BYPASS_ENABLED = true;

export const TRUST_SAFETY_SCREENING_BYPASS = {
  enabled: TRUST_SAFETY_SCREENING_BYPASS_ENABLED,
  /** Stored/status value used when bypass is active. */
  status: "clear" as const,
  /** Short UI badge / checklist label. */
  label: "Complete",
  /** Guru-facing title. */
  title: "Trust & Safety Screening temporarily complete",
  /** Guru-facing helper copy. */
  description:
    "SitGuru has temporarily marked Trust & Safety Screening complete for all Gurus, including new applicants. No Checkr action is required right now.",
  helper:
    "You can continue onboarding. Screening may be required again later — SitGuru will notify you.",
  /** Admin-facing note. */
  adminNote:
    "Temporarily bypassed for all Gurus (including new applicants) until further notice. Checkr screening is not required right now.",
} as const;

export function isTrustSafetyScreeningBypassed() {
  return TRUST_SAFETY_SCREENING_BYPASS.enabled === true;
}

/** DB fields stamped so new and existing Guru rows stay green while bypassed. */
export function getTrustSafetyBypassStatusPayload(
  now = new Date().toISOString(),
) {
  return {
    background_check_status: TRUST_SAFETY_SCREENING_BYPASS.status,
    background_check_completed_at: now,
    checkr_status: TRUST_SAFETY_SCREENING_BYPASS.status,
    background_check_fee_amount: 0,
    background_check_fee_status: "waived_2026",
    background_check_fee_payment_option: "waived_2026",
    background_check_payment_plan_status: "waived_2026",
    background_check_reimbursement_balance: 0,
    background_check_reimbursement_status: "waived_2026",
  } as const;
}

export function isGuruTrustSafetyAlreadyBypassed(profile: {
  background_check_status?: string | null;
  checkr_status?: string | null;
} | null) {
  if (!profile) return false;

  const status = String(
    profile.background_check_status || profile.checkr_status || "",
  )
    .trim()
    .toLowerCase();

  return (
    status === TRUST_SAFETY_SCREENING_BYPASS.status ||
    status.includes("clear") ||
    status.includes("complete") ||
    status.includes("approved") ||
    status.includes("passed")
  );
}
