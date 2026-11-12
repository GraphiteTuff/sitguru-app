/**
 * Single source of truth for public companion routes and support contacts.
 * Prefer these over hard-coded paths in prompts, CTAs, and tools.
 */

import { SITE_CONFIG } from "@/lib/config/site";

/** Canonical Pet Parent signup (verified live route). */
export const PARENT_SIGNUP_PATH = "/signup?role=pet_parent";

/** Canonical Guru application entry. */
export const GURU_APPLY_PATH = "/become-a-guru";

/** Canonical Ambassador application ( /ambassador/join redirects here ). */
export const AMBASSADOR_APPLICATION_PATH = "/programs/ambassadors/apply";

/** Legacy alias kept only as a redirect target — never emit as the primary CTA. */
export const AMBASSADOR_JOIN_ALIAS_PATH = "/ambassador/join";

/** Billing / Marketplace Support help article. */
export const BILLING_HELP_PATH = "/help/billing/payments-and-payouts";

/** Public contact page for human support. */
export const CONTACT_PATH = "/contact";

/** Public PetPerks terms page. */
export const PETPERKS_PATH = "/petperks";

/** Public events hub. */
export const EVENTS_PATH = "/events";

/** Public Guru search. */
export const SEARCH_PATH = "/search";

export const SUPPORT_EMAIL = SITE_CONFIG.supportEmail;

export const COMPANION_CANONICAL = {
  supportEmail: SUPPORT_EMAIL,
  parentSignupPath: PARENT_SIGNUP_PATH,
  guruApplyPath: GURU_APPLY_PATH,
  ambassadorApplyPath: AMBASSADOR_APPLICATION_PATH,
  billingHelpPath: BILLING_HELP_PATH,
  contactPath: CONTACT_PATH,
  petperksPath: PETPERKS_PATH,
  eventsPath: EVENTS_PATH,
  searchPath: SEARCH_PATH,
} as const;

/** Honest human-help copy — never claims a live teammate was notified. */
export function buildHonestHumanHelpReply(opts?: { includeContactPage?: boolean }) {
  const contact =
    opts?.includeContactPage === false
      ? ""
      : ` or visit **${CONTACT_PATH}**`;
  return `I'm a SitGuru AI companion, not a person. I can't transfer this chat or confirm that a teammate was notified. For human assistance, email **${SUPPORT_EMAIL}**${contact}.`;
}
