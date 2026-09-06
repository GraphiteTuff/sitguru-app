import { INTERNSHIP_PORTAL_PATH } from "@/lib/internship/constants";

export const INTERNSHIP_GROWTH_PATH = `${INTERNSHIP_PORTAL_PATH}/growth`;

/** Keep intern login deep-links inside the student portal. */
export function internSafeNext(value: string | null | undefined) {
  const next = String(value || "").trim();
  if (!next.startsWith(INTERNSHIP_PORTAL_PATH)) return INTERNSHIP_PORTAL_PATH;
  if (next.startsWith("//") || next.includes("://") || next.includes("\\")) {
    return INTERNSHIP_PORTAL_PATH;
  }
  return next.split("#")[0] || INTERNSHIP_PORTAL_PATH;
}
