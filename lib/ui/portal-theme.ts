/**
 * Shared Pet Parent / Ambassador portal color language.
 * Aligns dashboards with marketing brand green (#0D5C3A) plus the brighter
 * sky / mint / multi-tone accents used on the Ambassador header cards —
 * avoiding the flat “dark green on mint green” wash.
 */

export const PORTAL_BRAND = {
  green: "#0D5C3A",
  greenDeep: "#09462C",
  greenBright: "#12B981",
  mint: "#10D8A6",
  sky: "#38BDF8",
  pageFrom: "#F7FBFD",
  pageVia: "#F3FAF8",
  pageTo: "#EEF6FF",
} as const;

/** Full-page wash: cream → soft mint → sky (marketing homepage feel). */
export const PORTAL_PAGE_BG =
  "bg-[linear-gradient(180deg,#F7FBFD_0%,#F3FAF8_48%,#EEF6FF_100%)]";

/** Sticky chrome. */
export const PORTAL_HEADER =
  "border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur";

/** Active nav pill — brand green, white label. */
export const PORTAL_NAV_ACTIVE =
  "bg-[#0D5C3A] text-white shadow-sm hover:bg-[#09462C]";

/** Idle nav link. */
export const PORTAL_NAV_IDLE =
  "text-slate-600 hover:bg-sky-50 hover:text-[#0D5C3A]";

/** Soft surface cards (replaces emerald-50 on emerald). */
export const PORTAL_SOFT_CARD =
  "border border-sky-100 bg-white shadow-sm";

export const PORTAL_ICON_TONES = [
  "bg-emerald-500 text-white",
  "bg-sky-500 text-white",
  "bg-amber-500 text-white",
  "bg-violet-500 text-white",
  "bg-rose-500 text-white",
  "bg-teal-500 text-white",
] as const;
