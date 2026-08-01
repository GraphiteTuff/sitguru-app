/**
 * Temporary Trust & Safety Screening bypass.
 *
 * When enabled, Guru Trust & Safety / Checkr screening is treated as complete
 * (green) for all Gurus so onboarding is not blocked. Flip to false when
 * Checkr screening should be required again.
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
    "SitGuru has temporarily marked Trust & Safety Screening complete for all Gurus. No Checkr action is required right now.",
  helper:
    "You can continue onboarding. Screening may be required again later — SitGuru will notify you.",
  /** Admin-facing note. */
  adminNote:
    "Temporarily bypassed for all Gurus until further notice. Checkr screening is not required right now.",
} as const;

export function isTrustSafetyScreeningBypassed() {
  return TRUST_SAFETY_SCREENING_BYPASS.enabled === true;
}
