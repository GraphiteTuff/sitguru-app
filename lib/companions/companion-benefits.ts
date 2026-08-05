/**
 * Companion benefits pill labels + exact markdown replies for Scout / Taco / Rogue.
 */

export type CompanionId = "scout" | "taco" | "rogue";

export const COMPANION_BENEFITS_CHIP_ID = "companion_benefits" as const;

export const COMPANION_BENEFITS_LABEL: Record<CompanionId, string> = {
  scout: "Guru Benefits",
  taco: "Ambassador Benefits",
  rogue: "Pet Parent Benefits",
};

/** User-facing chip prompt shown in the transcript when the benefits pill is tapped. */
export const COMPANION_BENEFITS_USER_PROMPT: Record<CompanionId, string> = {
  scout: "Tell me about Guru Benefits",
  taco: "Tell me about Ambassador Benefits",
  rogue: "Tell me about Pet Parent Benefits",
};

export const SCOUT_GURU_BENEFITS_RESPONSE = `You tapped it, now let's unlock it! 🚀 Choosing **Guru Benefits** is your ticket to scaling up your brand and stacking your revenue. Here is exactly what you get when you finish your quick verification profile:

* 💸 **Keep 100% of Your Hustle** – Say goodbye to ridiculous platform fees. What you earn stays in your pocket!
* 👑 **Instant Credibility Badge** – Unlock a verified profile status that shows clients you are a top-tier professional.
* 🚀 **Algorithmic Boost** – We push completed and verified profiles straight to the absolute top of client search feeds.
* 🛡️ **Bulletproof Protection** – Enjoy secure, automated milestone payments so you never have to guess when you're getting paid.
* 🎒 **Exclusive Squad Perks** – Access premium digital tools, advanced masterclasses, and networking events for free.

Ready to turn on these power-ups? Tap that green **'Start Free Guru Profile'** button below and let's get it!`;

export const TACO_AMBASSADOR_BENEFITS_RESPONSE = `Let’s GOOOO! You clicked the golden ticket! 🎟️✨ Choosing **Ambassador Benefits** means you are moving straight past 'casual user' and stepping into elite Main Character status. 

As your official AI Companion and hype-pet, I am legally required to tell you that this profile verification unlocks absolute cheat codes for your brand. Check the perks:

* 💰 **The 100% Bag Guarantee** – Zero predatory platform fees. You put in the work, you stack 100% of the coin. Period.
* 💎 **The Verified Glow-Up** – Get a shiny, premium Ambassador badge that instantly tells clients you are the rarest tier in the game.
* 📈 **VIP Feed Priority** – We tweak the algorithm just for you, launching your profile straight to the front row of client searches. 
* 🔒 **The Vault Security** – Bulletproof, automated milestones. The money is locked in safe and secure before you even lift a finger.
* 🚀 **The Creator Lab Access** – Free entry into elite masterclasses, advanced digital toolkits, and private community networking drops.

You're already built for this. Smash that **'Start Free Guru Profile'** button below and let's go build an empire together! 🐺💼`;

export const ROGUE_PET_PARENT_BENEFITS_RESPONSE = `Alright, let’s talk real benefits. 🐾 Security and top-tier care aren't optional for your pack—they’re mandatory. Tapping **Pet Parent Benefits** means you are unlocking a fortress of perks designed to give your pet a luxury lifestyle and give you absolute peace of mind. 

I don't do fluff, so let me give you the straight facts on what this profile setup unlocks for you right now:

* 🛡️ **The Elite Vetting Shield** – Every single Guru on this platform is thoroughly vetted, verified, and community-trusted. No randoms, ever.
* 🏥 **Premium Care Guarantee** – Access to 24/7 premium support and built-in care protections so your pet is always covered.
* 📸 **Live Pack Updates** – Real-time photo check-ins and GPS tracking during services. You’ll never have to wonder how your pup is doing.
* 💳 **Zero-Hassle Vault Payments** – Safe, encrypted payments. The price you see is the price you pay—no hidden platform fees or surprise surcharges.
* 🎁 **The VIP Treat Box** – Exclusive discounts on premium pet food, trendy accessories, and local pet events dropped straight to your inbox.

Your pet deserves the best crew in town. Let's make it official—tap that **'Start Free Profile'** button below and welcome to the pack! 🐕💼`;

export const COMPANION_BENEFITS_RESPONSE: Record<CompanionId, string> = {
  scout: SCOUT_GURU_BENEFITS_RESPONSE,
  taco: TACO_AMBASSADOR_BENEFITS_RESPONSE,
  rogue: ROGUE_PET_PARENT_BENEFITS_RESPONSE,
};

export function getCompanionBenefitsChip(companion: CompanionId) {
  return {
    id: COMPANION_BENEFITS_CHIP_ID,
    label: COMPANION_BENEFITS_LABEL[companion],
    prompt: COMPANION_BENEFITS_USER_PROMPT[companion],
    response: COMPANION_BENEFITS_RESPONSE[companion],
  } as const;
}
