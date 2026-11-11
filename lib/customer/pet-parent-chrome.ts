/**
 * Pet Parent mobile chrome — which routes keep the bottom tab bar
 * and how Rogue / content should clear it.
 *
 * Tab bar is flush to the bottom (native-app style). Heights assume
 * ~3.5rem tab row + safe-area + Safari chrome inset.
 */

/** Rogue FAB sits just above the flush tab bar. */
export const CUSTOMER_FLOAT_STACK_BOTTOM =
  "calc(4.35rem + env(safe-area-inset-bottom, 0px) + var(--sg-chrome-bottom, 0px))";

export const CUSTOMER_FLOAT_STACK_BOTTOM_SOLO =
  "calc(1rem + env(safe-area-inset-bottom, 0px) + var(--sg-chrome-bottom, 0px))";

/** Content spacer so lists/forms scroll clear of the tab bar. */
export const CUSTOMER_BOTTOM_NAV_CONTENT_PAD =
  "calc(5.25rem + env(safe-area-inset-bottom, 0px) + var(--sg-chrome-bottom, 0px))";

export function isPetParentBottomNavPath(
  pathname: string | null | undefined,
): boolean {
  if (!pathname) return false;

  // Auth / onboarding — keep chrome-free.
  if (
    pathname === "/customer/login" ||
    pathname.startsWith("/customer/login/") ||
    pathname === "/customer/signup" ||
    pathname.startsWith("/customer/signup/")
  ) {
    return false;
  }

  // Live walk tracking is full-screen — no dock.
  if (pathname === "/parent" || pathname.startsWith("/parent/")) {
    return false;
  }

  if (pathname === "/customer" || pathname.startsWith("/customer/")) {
    return true;
  }

  if (pathname === "/messages" || pathname.startsWith("/messages/")) {
    return true;
  }

  if (pathname === "/bookings" || pathname.startsWith("/bookings/")) {
    return true;
  }

  if (pathname === "/pets" || pathname.startsWith("/pets/")) {
    return true;
  }

  // Find Care destinations linked from the dock.
  if (
    pathname === "/search" ||
    pathname.startsWith("/search/") ||
    pathname === "/find-care" ||
    pathname.startsWith("/find-care/") ||
    pathname === "/pet-gurus" ||
    pathname.startsWith("/pet-gurus/") ||
    pathname.startsWith("/book/")
  ) {
    return true;
  }

  return false;
}

/** Compact Rogue launcher (no speech tip) on dense app surfaces. */
export function isCompactRogueLauncherPath(
  pathname: string | null | undefined,
): boolean {
  if (!pathname || pathname === "/") return false;
  return isPetParentBottomNavPath(pathname);
}
