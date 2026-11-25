/**
 * Shared Guru-inspired mobile web tab-bar styling across SitGuru portals.
 * Keep role-specific labels/links while making every tab the same shape.
 */
export const SITGURU_MOBILE_NAV = {
  surface:
    "pointer-events-auto fixed inset-x-0 z-[60] border-t border-emerald-200 bg-white/95 shadow-[0_-10px_28px_rgba(15,23,42,0.09)] backdrop-blur-md",
  grid: "mx-auto grid max-w-[650px] grid-cols-5 gap-0.5 px-1.5 pt-1.5",
  tab:
    "flex min-h-[65px] min-w-0 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 py-1 text-[12px] font-black leading-tight transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600",
  active: "bg-emerald-50 text-[#0D5C3A]",
  idle: "text-slate-700 hover:bg-emerald-50",
  icon: "grid h-9 w-11 shrink-0 place-items-center rounded-2xl",
  iconActive: "bg-white",
  iconSize: "h-[24px] w-[24px]",
  iconStrokeActive: "stroke-[2.4]",
  iconStrokeIdle: "stroke-[2]",
} as const;

export const SITGURU_MOBILE_NAV_INSET = {
  bottom: "var(--sg-chrome-bottom, 0px)",
  paddingBottom: "max(0.4rem, calc(env(safe-area-inset-bottom, 0px) + 0.15rem))",
} as const;

export const SITGURU_MOBILE_NAV_CONTENT_PAD =
  "calc(6rem + env(safe-area-inset-bottom, 0px) + var(--sg-chrome-bottom, 0px))";
