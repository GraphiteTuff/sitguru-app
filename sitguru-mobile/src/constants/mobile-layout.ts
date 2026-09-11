/**
 * Mobile-first layout tokens (dp). StyleSheet equivalent of a NativeWind scale —
 * NativeWind is not installed; keep tokens here so every screen shares one system.
 */

export const TOUCH_MIN = 48;

export const MobileSpace = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

/** Extra scroll padding so content clears sticky footers + bottom nav. */
export const StickyFooterClearance = {
  actionOnly: 88,
  actionPlusNav: 148,
  navOnly: 84,
} as const;

/**
 * Thumb zone: keep primary CTAs in the lower ~30% of the viewport.
 * Pair with StickyActionBar + locked bottom tab nav.
 */
export const ThumbZone = {
  stickyActionMinHeight: 64,
  swipeAcceptDecline: 'Swipe right to accept · Swipe left to decline',
} as const;

export const MobileType = {
  title: 24,
  section: 18,
  body: 16,
  label: 14,
  caption: 13,
  micro: 12,
} as const;

/**
 * Phone text-size follow: RN scales these sizes up to
 * MAX_FONT_SIZE_MULTIPLIER in `@/lib/a11y/type-scale`.
 * Prefer minHeight over height so larger letters wrap instead of clipping.
 */
