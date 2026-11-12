/**
 * Narrow, deterministic policy responses for public SitGuru AI companions.
 *
 * Safety/consistency intercepts only — NOT a replacement for Help retrieval,
 * live tools, or open-ended conversation.
 */
import {
  AMBASSADOR_APPLICATION_PATH,
  BILLING_HELP_PATH,
  CONTACT_PATH,
  PETPERKS_PATH,
  SUPPORT_EMAIL,
  buildHonestHumanHelpReply,
} from "@/lib/companions/canonical";

export type PublicCompanionId = "rogue" | "scout" | "taco" | "delilah";

const SUPPORT = SUPPORT_EMAIL;

export function getCompanionPolicyAnswer(
  companion: PublicCompanionId,
  message: string,
): string | null {
  const q = String(message || "").trim().toLowerCase();
  if (!q) return null;

  // AI identity / recursive "who is that teammate?" — never re-fallback.
  if (
    /\b(are you (a |an )?(real person|human|bot|ai)|are you real|is (rogue|scout|taco|delilah) (a |an )?(real person|human|bot|ai)|live teammate|who (is|was) (that |the )?(live )?teammate|did you (actually )?(contact|notify|send|escalate)|talk to (a |an )?(real )?(person|human|agent)|speak (to|with) (a |an )?(person|human|agent)|connect me to (a |an )?(person|human|agent)|can i talk to a human|can i speak to a human)\b/.test(
      q,
    )
  ) {
    return buildHonestHumanHelpReply();
  }

  if (
    /\b(how (do|can) i contact sitguru|how do i (reach|contact) support|support (email|address|phone|number)|contact (sitguru )?support)\b/.test(
      q,
    )
  ) {
    return `You can reach SitGuru support at **${SUPPORT}** or use **${CONTACT_PATH}**. I can't confirm a live teammate is connected to this chat.`;
  }

  // Do not imply platform-wide background checks, insurance, or guarantees.
  if (
    /\b(background[- ]?checks?|background[- ]?screening|insurance|insured|safety guarantee|guaranteed safe)\b/.test(
      q,
    )
  ) {
    return `SitGuru describes required identity, safety, account, and payout trust steps before a Guru is bookable. I can't verify a platform-wide background-check, insurance, or safety guarantee from the currently published details. See **/become-a-guru** or ask **${SUPPORT}** for policy specifics.`;
  }

  // Launch fee state — never assert unpublished dollar amounts as current.
  if (
    /\b(marketplace support|booking fees?|service fees?|platform fees?|per[- ]?booking fees?|monthly fee|2\.99|20%|11%|\$5|\$50|cheaper than rover)\b/.test(
      q,
    ) &&
    /\b(sitguru|fee|charge|pay|marketplace|rover|cost|2\.99|\$5|\$50)\b/.test(q)
  ) {
    return `SitGuru's booking flow currently shows **Marketplace Support — Free** during launch. No future per-booking amount, payer, or effective date is published in Help. See **${BILLING_HELP_PATH}** or ask **${SUPPORT}** for clarification; I can't promise SitGuru is cheaper than another platform.`;
  }

  // Explicit negation: "$10 to $20" is not a published single reward.
  if (
    /\b(\$?10\s*(?:to|[-–])\s*\$?20)\b/.test(q) &&
    /\b(petperks|reward|ambassador|guru)\b/.test(q)
  ) {
    return `I can't verify a general **$10 to $20 PetPerks reward**. The published terms instead describe **Give $10 Get $10** for an eligible referred Pet Parent booking and **$20** in credit for an eligible referred Guru after approval and a first paid booking. Rewards are conditional SitGuru credits, not guaranteed cash. See **${PETPERKS_PATH}**.`;
  }

  if (
    /\b(petperks|give \$?10|get \$?10|refer a guru.*\$?20|guru referral reward)\b/.test(
      q,
    )
  ) {
    return `**PetPerks:** Give $10, Get $10 in SitGuru care credit after a friend's first eligible paid booking completes. Refer a Guru to earn $20 credit after approval and their first eligible paid booking completes. These conditional credits are not cash or guaranteed earnings. See **${PETPERKS_PATH}**.`;
  }

  // Informational Guru signup — do not trap in ZIP matching intake.
  if (
    (companion === "rogue" || companion === "scout") &&
    /\b(how (do|can) i become a (guru|sitter|walker)|become a sitguru guru|start (as|as a) guru|guru (signup|sign[- ]?up|application)|apply (to be|as) a guru)\b/.test(
      q,
    ) &&
    !/\b\d{5}\b|\bin (philly|philadelphia|[a-z]+,?\s*[a-z]{2})\b/i.test(q)
  ) {
    return `Creating a Guru profile is free. Open **/become-a-guru** to see the steps, then finish signup when you're ready — I can't submit the application in chat. [[cta:guru]]`;
  }

  if (companion === "taco") {
    if (/\b(ambassador\/join)\b/.test(q)) {
      return `**/ambassador/join** is a redirect to the canonical Ambassador application: **${AMBASSADOR_APPLICATION_PATH}**. Your referral link and QR tools become available after approval.`;
    }
    const exclusions =
      /\b(business|rescue|reapply|re-apply|rejected|denied|eligible|eligibility|age limit|approval time|approved yet|after i applied|application status)\b/.test(
        q,
      );
    const clearApplicationIntent =
      /\b(where (is|do i|can i)|which (sign|application)|how do i (apply|join|become|sign)|sign me up|application (form|link)|sign[- ]?up link|apply (now|link)|ready to (join|apply)|want to (join|become)|join as an ambassador|ambassador application)\b/.test(
        q,
      ) || /\b(programs\/ambassadors\/apply)\b/.test(q);
    if (!exclusions && clearApplicationIntent) {
      return `Apply as a SitGuru Ambassador at **${AMBASSADOR_APPLICATION_PATH}**. After approval, use your referral link and QR tools to share SitGuru and track qualifying activity in your dashboard. I can't submit an application in chat.`;
    }
  }

  return null;
}
