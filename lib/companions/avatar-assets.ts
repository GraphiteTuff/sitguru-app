/**
 * Canonical AI Pet Companion avatar assets.
 * Keep these aligned with homepage "Meet the Pack" + About pet portraits.
 */

export const SCOUT_AVATAR = {
  /** Official circular Meet-the-Pack Scout portrait (GSP / Guru Matching Officer). */
  src: "/images/scout-avatar.png",
  alt: "Scout, Guru Matching Officer",
  objectPosition: "center 22%",
} as const;

export const TACO_AVATAR = {
  /** Official circular Meet-the-Pack Taco portrait (Ambassador Advocate). */
  src: "/images/taco-avatar.png",
  alt: "Taco, Ambassador Advocate",
  objectPosition: "center 22%",
} as const;

/** @deprecated Delilah is not the Ambassador companion — use TACO_AVATAR. */
export const DELILAH_AVATAR = TACO_AVATAR;

/** Shared floating action-bubble framing for onboarding companions. */
export const COMPANION_FAB_CLASS =
  "h-14 w-14 overflow-hidden rounded-full border-2 border-white shadow-xl transition-all hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2";

export const COMPANION_DOCK_CLASS =
  "fixed bottom-6 right-6 z-[9999] font-sans";
