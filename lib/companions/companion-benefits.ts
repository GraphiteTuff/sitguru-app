/**
 * Companion benefits pill labels + exact markdown replies for Scout / Taco / Rogue / Delilah.
 * Keep punchy — short opener, tight bullets, one CTA line.
 */

export type CompanionId = "scout" | "taco" | "rogue" | "delilah";

export const COMPANION_BENEFITS_CHIP_ID = "companion_benefits" as const;

export const COMPANION_BENEFITS_LABEL: Record<CompanionId, string> = {
  scout: "Guru Benefits",
  taco: "Ambassador Benefits",
  rogue: "Pet Parent Benefits",
  delilah: "Event Host Benefits",
};

/** User-facing chip prompt shown in the transcript when the benefits pill is tapped. */
export const COMPANION_BENEFITS_USER_PROMPT: Record<CompanionId, string> = {
  scout: "Tell me about Guru Benefits",
  taco: "Tell me about Ambassador Benefits",
  rogue: "Tell me about Pet Parent Benefits",
  delilah: "Tell me about Event Host Benefits",
};

export const SCOUT_GURU_BENEFITS_RESPONSE = `**Guru Benefits** after you finish verification:

* 💸 Keep more of what you earn
* 👑 Verified profile credibility
* 🚀 Stronger search visibility
* 🛡️ Secure payouts after setup
* 🎒 Tools, Academy, and pack perks

Start free, follow **@SitGuruOfficial**, and subscribe for tips. [[cta:guru]] [[cta:social]] [[cta:email]]`;

export const TACO_AMBASSADOR_BENEFITS_RESPONSE = `**Ambassador Benefits** — grow the pack with style:

* 💰 Eligible rewards under current terms
* 💎 Verified Ambassador badge
* 📈 Referral tools + dashboard metrics
* 🚀 Creator / campus / community reach
* 🎟️ PetPerks share path + pack drops

Claim your code, follow **@SitGuruOfficial**, and subscribe. [[cta:ambassador]] [[cta:social]] [[cta:email]]`;

export const ROGUE_PET_PARENT_BENEFITS_RESPONSE = `**Pet Parent Benefits** — peace of mind for your pack:

* 🛡️ Vetted, community-trusted Gurus
* 📸 PawReport Live updates during care
* 💳 Secure in-app booking + payments
* 🎁 PawPerks + local Pet Events

Create a free account, follow **@SitGuruOfficial**, and subscribe. [[cta:parent]] [[cta:social]] [[cta:email]]`;

export const DELILAH_EVENT_HOST_BENEFITS_RESPONSE = `**Event Host Benefits** for Partner Events:

* 📌 Partner Events stay first in the feed
* 🙋 Live Yes / Maybe / No attendance
* 📣 Branded share tools
* 🗺️ Local discovery on Pet Events
* 🤝 Easy guest signup paths

Publish a draft, follow **@SitGuruOfficial**, and subscribe. [[cta:community_parent]] [[cta:social]] [[cta:email]]`;

export const COMPANION_BENEFITS_RESPONSE: Record<CompanionId, string> = {
  scout: SCOUT_GURU_BENEFITS_RESPONSE,
  taco: TACO_AMBASSADOR_BENEFITS_RESPONSE,
  rogue: ROGUE_PET_PARENT_BENEFITS_RESPONSE,
  delilah: DELILAH_EVENT_HOST_BENEFITS_RESPONSE,
};

export function getCompanionBenefitsChip(companion: CompanionId) {
  return {
    id: COMPANION_BENEFITS_CHIP_ID,
    label: COMPANION_BENEFITS_LABEL[companion],
    prompt: COMPANION_BENEFITS_USER_PROMPT[companion],
    response: COMPANION_BENEFITS_RESPONSE[companion],
  } as const;
}
