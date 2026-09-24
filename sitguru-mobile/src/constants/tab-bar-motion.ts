/**
 * Floating bubble tab bar — App Store pattern:
 * Scroll = browse. Tap a tab = go. Never swipe across tabs to change sections.
 * Scroll down → compact and stay compact while reading.
 * Scroll up or return to top → expand. Tap a tab → bubble slides. Never swipe tabs.
 */
export const TAB_BAR_MOTION = {
  /** Per-frame delta that counts as a real scroll direction. */
  scrollThresholdPx: 4,
  expandDelayMs: 220,

  /** Horizontal slide of the persistent selection bubble. */
  slideSpring: {
    damping: 18,
    stiffness: 280,
    mass: 0.7,
    overshootClamping: false,
  },

  /** Brief width stretch while the bubble travels. */
  stretchSpring: {
    damping: 18,
    stiffness: 260,
    mass: 0.5,
    overshootClamping: false,
  },

  /** Return to resting bubble size. */
  settleSpring: {
    damping: 20,
    stiffness: 220,
    mass: 0.62,
    overshootClamping: false,
  },

  /** Capsule shrink / expand. */
  compactSpring: {
    damping: 24,
    stiffness: 220,
    mass: 0.72,
    overshootClamping: true,
  },

  /** Icon emphasis. */
  iconSpring: {
    damping: 18,
    stiffness: 300,
    mass: 0.5,
    overshootClamping: false,
  },

  /** Idle capsule stays ~92% wide so it still reads as navigation. */
  expandedWidthPct: 0.92,
  /**
   * Instagram-style compress: stay recognizably wide.
   * 0.96 × 92% ≈ 88% of the screen — not a tiny collapsed control.
   */
  compactScaleX: 0.9,
  compactScaleY: 0.82,
  compactTranslateY: 8,
  compactBubbleScale: 0.88,
} as const;
