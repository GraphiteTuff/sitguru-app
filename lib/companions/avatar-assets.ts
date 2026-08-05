/**
 * Canonical AI Pet Companion avatar assets.
 * Role map (locked):
 * - Scout → Guru companion (`/images/scout-avatar.png`)
 * - Taco  → Ambassador companion (`/images/taco-avatar.png`)
 */

export const SCOUT_AVATAR = {
  /** Official circular Meet-the-Pack Scout portrait (GSP / Guru Matching Officer). */
  src: "/images/scout-avatar.png",
  alt: "Scout, Guru Matching Officer",
  /**
   * Match Rogue launcher face crop (HomepageChatBubble SitGuruAvatar).
   * Asset is reframed to Rogue fill; keep the same object-position.
   */
  objectPosition: "50% 28%",
} as const;

export const TACO_AVATAR = {
  /** Official circular Meet-the-Pack Taco portrait (Ambassador Advocate). */
  src: "/images/taco-avatar.png",
  alt: "Taco, Ambassador Advocate",
  /** Match Rogue launcher face crop. */
  objectPosition: "50% 28%",
} as const;

/**
 * Floating companion launcher — same 60px round size as Rogue
 * (`.homepage-chat-launcher`). Prefer the Rogue launcher class on the button;
 * this utility keeps size parity when used alone.
 */
export const COMPANION_FAB_CLASS =
  "h-[60px] w-[60px] shrink-0 overflow-hidden rounded-full transition-all hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2";

/** Bottom-right dock — tip + avatar row (mirrors Rogue homepage bubble). */
export const COMPANION_DOCK_CLASS =
  "fixed bottom-6 right-6 z-[9999] font-sans flex flex-row items-center justify-end gap-2.5 max-w-[min(100vw-1.5rem,22rem)]";
