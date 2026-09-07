/** SitGuru Green for intern brand kit, Canva, and intern-portal chrome. */
export const SITGURU_BRAND_GREEN = "#166534";
export const SITGURU_BRAND_GREEN_DARK = "#102417";
export const SITGURU_BRAND_GREEN_LIGHT = "#CFE6D5";

/** Shared intern-portal press states. Keep targets ≥44px and obvious on hover/click. */
export const internPressClass =
  "transition duration-150 ease-out hover:-translate-y-px hover:shadow-md active:translate-y-0 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#166534]";

export const internPrimaryBtnClass = `inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-[#166534] px-5 text-sm font-black !text-white hover:bg-[#102417] ${internPressClass}`;

export const internGhostBtnClass = `inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-900 hover:border-emerald-400 hover:bg-emerald-50 ${internPressClass}`;

export const internPillBtnClass = `inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-black ${internPressClass}`;

export const INTERN_PAGE_HASH = "#profile";
export const INTERN_PAGE_QUERY = "edit";
export const INTERN_PAGE_QUERY_VALUE = "page";
export const INTERN_OPEN_PAGE_EVENT = "sitguru:intern-open-page";
export const INTERN_PAGE_HREF = `/intern?${INTERN_PAGE_QUERY}=${INTERN_PAGE_QUERY_VALUE}`;

export function internPageHashActive() {
  return typeof window !== "undefined" && window.location.hash === INTERN_PAGE_HASH;
}
