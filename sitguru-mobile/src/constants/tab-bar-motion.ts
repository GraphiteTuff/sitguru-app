/**
 * Shared spring / threshold tokens for the floating bubble tab bar.
 * High damping keeps bounce subtle; stiffness stays snappy.
 */
export const TAB_BAR_MOTION = {
  scrollThresholdPx: 12,
  expandDelayMs: 200,

  /** Horizontal slide of the persistent selection bubble. */
  slideSpring: {
    damping: 22,
    stiffness: 280,
    mass: 0.72,
    overshootClamping: false,
  },

  /** Brief width stretch while the bubble travels. */
  stretchSpring: {
    damping: 18,
    stiffness: 340,
    mass: 0.42,
    overshootClamping: false,
  },

  /** Return to resting bubble size. */
  settleSpring: {
    damping: 20,
    stiffness: 260,
    mass: 0.55,
    overshootClamping: false,
  },

  /** Capsule shrink / expand. */
  compactSpring: {
    damping: 20,
    stiffness: 240,
    mass: 0.68,
    overshootClamping: false,
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
  compactScaleX: 0.96,
  compactScaleY: 0.88,
  compactTranslateY: 5,
  compactBubbleScale: 0.92,
} as const;
