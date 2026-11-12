/**
 * Narrow, deterministic policy responses for public SitGuru AI companions.
 *
 * These are safety/consistency intercepts, NOT a replacement for live Help
 * retrieval, authenticated actions, or real conversation memory.
 */
import { SITE_CONFIG } from "@/lib/config/site";

export type PublicCompanionId = "rogue" | "scout" | "taco" | "delilah";

export const AMBASSADOR_APPLICATION_PATH = "/programs/ambassadors/apply";
export const BILLING_HELP_PATH = "/help/billing/payments-and-payouts";

const SUPPORT = SITE_CONFIG.supportEmail;

export function getCompanionPolicyAnswer(
  companion: PublicCompanionId,
  message: string,
): string | null {
  const q = String(message || "").trim().toLowerCase();
  if (!q) return null;

  // The four companions are AI, never human. A real transfer/ticket requires
  // an actual successful backend handoff, which this function cannot perform.
  if (
    /\b(are you (a |an )?(real person|human|bot|ai)|are you real|is (rogue|scout|taco|delilah) (a |an )?(real person|human|bot|ai)|live teammate|who (is|was) (that |the )?(live )?teammate|did you (actually )?(contact|notify|send|escalate)|talk to (a |an )?(real )?(person|human|agent)|speak (to|with) (a |an )?(person|human|agent)|connect me to (a |an )?(person|human|agent)|can i talk to a human|can i speak to a human)\b/.test(q)
  ) {
    return "I'm a SitGuru AI companion, not a person. I can't transfer this chat or confirm that a teammate was notified. For human assistance, email **" + SUPPORT + "** or visit **/contact**.";
  }

  if (
    /\b(how (do|can) i contact sitguru|how do i (reach|contact) support|support (email|address|phone|number)|contact (sitguru )?support)\b/.test(q)
  ) {
    return "You can reach SitGuru support at **" + SUPPORT + "** or use **/contact**. I can't confirm a live teammate is connected to this chat.";
  }

  // Do not imply a platform-wide check, insurance coverage, or guarantee.
  if (
    /\b(background[- ]?checks?|background[- ]?screening|insurance|insured|safety guarantee|guaranteed safe)\b/.test(q)
  ) {
    return "SitGuru describes required identity, safety, account, and payout trust steps before a Guru is bookable. I can't verify a platform-wide background-check, insurance, or safety guarantee from the currently published details. See **/become-a-guru** or ask **" + SUPPORT + "** for policy specifics.";
  }

  // Launch state. Never reveal an unpublished proposed fee as though active.
  if (
    /\b(marketplace support|booking fees?|service fees?|platform fees?|per[- ]?booking fees?|monthly fee|2\.99|20%|11%|\$5|\$50|cheaper than rover)\b/.test(q) &&
    /\b(sitguru|fee|charge|pay|marketplace|rover|cost|2\.99|\$5|\$50)\b/.test(q)
  ) {
    return "SitGuru's booking flow currently shows **Marketplace Support — Free** during launch. No future per-booking amount, payer, or effective date is published in Help. See **" + BILLING_HELP_PATH + "** or ask **" + SUPPORT + "** for clarification; I can't promise SitGuru is cheaper than another platform.";
  }

  // The "$10 to $20" advertising range is not a verified single reward.
  if (/\b(\$?10\s*(?:to|[-–])\s*\$?20)\b/.test(q) && /\b(petperks|reward|ambassador|guru)\b/.test(q)) {
    return "I can't verify a general **$10 to $20 PetPerks reward**. The published terms instead describe **Give $10 Get $10** for an eligible referred Pet Parent booking and **$20** in credit for an eligible referred Guru after approval and a first paid booking. Rewards are conditional SitGuru credits, not guaranteed cash. See **/petperks**.";
  }

  if (/\b(petperks|give \$?10|get \$?10|refer a guru.*\$?20|guru referral reward)\b/.test(q)) {
    return "**PetPerks:** Give $10, Get $10 in SitGuru care credit after a friend's first eligible paid booking completes. Refer a Guru to earn $20 credit after approval and their first eligible paid booking completes. These conditional credits are not cash or guaranteed earnings. See **/petperks**.";
  }

  // Keep eligibility decisions, rejection appeals, and Partner applications
  // OUT of the generic Ambassador link shortcut.
  if (companion === "taco") {
    if (/\b(ambassador\/join)\b/.test(q)) {
      return "**/ambassador/join** is a redirect to the canonical Ambassador application: **" + AMBASSADOR_APPLICATION_PATH + "**. Your referral link and QR tools become available after approval.";
    }
    const exclusions =
      /\b(business|rescue|reapply|re-apply|rejected|denied|eligible|eligibility|age limit|approval time|approved yet|after i applied|application status)\b/.test(q);
    const clearApplicationIntent =
      /\b(where (is|do i|can i)|which (sign|application)|how do i (apply|join|become|sign)|sign me up|application form|sign[- ]?up link|apply now|ready to (join|apply)|want to (join|become)|join as an ambassador)\b/.test(q) ||
      /\b(programs\/ambassadors\/apply)\b/.test(q);
    if (!exclusions && clearApplicationIntent) {
      return "Apply as a SitGuru Ambassador at **" + AMBASSADOR_APPLICATION_PATH + "**. After approval, use your referral link and QR tools to share SitGuru and track qualifying activity in your dashboard. I can't submit an application in chat.";
    }
  }

  return null;
}
