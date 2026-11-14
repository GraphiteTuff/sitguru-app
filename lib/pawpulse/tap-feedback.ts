/**
 * Sitewide, non-blocking acknowledgement of a click or tap.
 *
 * A brief spinning paw confirms the control received the interaction.
 * It never asserts that a save, payment, or submission succeeded.
 * Components with a real async lifecycle should continue using PawPulse.
 */
export type TapFeedbackIntent = "press" | "navigate" | "submit";

export type TapFeedbackTarget = {
  tagName: string;
  role?: string | null;
  type?: string | null;
  href?: string | null;
  target?: string | null;
  disabled?: boolean;
  ariaDisabled?: string | null;
  skip?: boolean;
};

export const TAP_PAW_PRESS_MS = 850;
export const TAP_PAW_NAVIGATE_MS = 1800;
export const TAP_PAW_SUBMIT_MS = 2400;

export function classifyTapFeedback(target: TapFeedbackTarget): TapFeedbackIntent | null {
  if (target.disabled || target.ariaDisabled === "true" || target.skip) return null;
  const tag = target.tagName.toLowerCase();
  const role = (target.role || "").toLowerCase();
  const type = (target.type || "").toLowerCase();

  if (tag === "a") {
    if (!target.href || /^\s*(javascript:|#(?:$|\s))/i.test(target.href)) return null;
    return target.target === "_blank" ? "press" : "navigate";
  }

  if (tag === "button") return type === "submit" ? "submit" : "press";
  if (tag === "input" && (type === "submit" || type === "image")) return "submit";
  if (tag === "input" && (type === "button" || type === "reset" || type === "checkbox" || type === "radio")) return "press";
  if (tag === "select" || tag === "summary") return "press";

  if (["button", "tab", "switch", "checkbox", "radio", "menuitem", "option"].includes(role)) {
    return "press";
  }
  return null;
}

export function tapFeedbackLifetime(intent: TapFeedbackIntent): number {
  if (intent === "submit") return TAP_PAW_SUBMIT_MS;
  if (intent === "navigate") return TAP_PAW_NAVIGATE_MS;
  return TAP_PAW_PRESS_MS;
}

/** Clamp the tiny paw to the viewport even on narrow phones. */
export function tapPawPosition(
  x: number,
  y: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  const clamp = (value: number, low: number, high: number) =>
    Math.min(Math.max(value, low), Math.max(low, high));
  return {
    left: clamp(x + 12, 6, viewportWidth - 38),
    top: clamp(y - 13, 6, viewportHeight - 38),
  };
}
