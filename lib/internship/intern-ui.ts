/** Shared intern-portal press states. Keep targets ≥44px and obvious on hover/click. */
export const internPressClass =
  "transition duration-150 ease-out hover:-translate-y-px hover:shadow-md active:translate-y-0 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5C3A]";

export const internPrimaryBtnClass = `inline-flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-[#0D5C3A] px-5 text-sm font-black !text-white hover:bg-[#09472d] ${internPressClass}`;

export const internGhostBtnClass = `inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-900 hover:border-emerald-400 hover:bg-emerald-50 ${internPressClass}`;

export const internPillBtnClass = `inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-black ${internPressClass}`;
