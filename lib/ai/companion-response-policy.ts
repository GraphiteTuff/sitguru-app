/**
 * Verified public answers for questions where a generated response could
 * misstate SitGuru trust, fees, referrals, or human-support capabilities.
 *
 * Keep this small and deterministic. Other questions go to normal retrieval.
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

  // Never imply that an unimplemented live-human connection exists.
  if (
    /\b(are you (a |an )?(real person|human|bot|ai)|are you real|who (is|was) (that |the )?(live )?teammate|did you (actually )?(contact|notify|send|escalate)|talk to (a |an )?(real )?(person|human|agent)|speak (to|with) (a |an )?(person|human|agent)|connect me to (a |an )?(person|human|agent)|live teammate)\b/.test(q)
  ) {
    return "I'm a SitGuru AI companion, not a person. I cannot transfer this chat to a human or confirm that someone was notified. For help from the team, email **" + SUPPORT + "** or visit **/contact**.";
  }

  // Safety and verification statements must not be invented.
  if (
    /\b(background[- ]?checks?|background[- ]?screening|insurance|insured|safety guarantee|guaranteed safe)\b/.test(q)
  ) {
    return "SitGuru describes required profile and trust steps, but I can't confirm a platform-wide background-check, insurance, or safety guarantee from the currently published information. Read **/become-a-guru** for the stated steps or ask **" + SUPPORT + "** about a specific policy.";
  }

  // Launch policy: do not infer a future amount, payer, or effective date.
  if (
    /\b(marketplace support|booking fee|service fee|platform fee|per[- ]?booking fee|2\.99|\$5|\$2\.99|20% fee)\b/.test(q)
  ) {
    return "SitGuru currently shows **Marketplace Support — Free** during launch. A future per-booking fee, its payer, and its start date are not published in Help. See **" + BILLING_HELP_PATH + "**; for questions about a particular booking, contact **" + SUPPORT + "**.";
  }

  if (/\b(petperks|give \$?10|get \$?10|refer a guru.*\$?20|guru referral reward)\b/.test(q)) {
    return "**PetPerks:** Give $10, Get $10 in SitGuru credit after a referred friend's first eligible paid booking is completed. Refer a Guru to earn $20 in credit after the Guru is approved and completes their first eligible paid booking. These are conditional credits, not cash or guaranteed earnings. See **/petperks**.";
  }

  // A single canonical route exists; /ambassador/join is only a redirect.
  if (
    companion === "taco" &&
    /\b(sign ?up|apply|join|register|application)\b/.test(q) &&
    /\b(ambassador|taco|program|sign ?up|apply)\b/.test(q)
  ) {
    return "To apply as a SitGuru Ambassador, open **" + AMBASSADOR_APPLICATION_PATH + "**. Once approved, you can access the Ambassador referral tools, including your link and QR code. I can't submit the application in chat.";
  }

  return null;
}
