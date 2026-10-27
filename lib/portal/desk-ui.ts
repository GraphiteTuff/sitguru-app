/** Shared Manager Desk + Intern Portal visual tokens (mockup palette). */

export const DESK_UI = {
  pageBg: "bg-[#F4F7FB]",
  navy: "#0F2744",
  teal: "#0D5C3A",
  link: "text-[#2563EB] hover:text-[#1D4ED8]",
  card: "rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,39,68,0.05)]",
  search:
    "min-h-11 w-full min-w-0 rounded-full border-0 bg-[#EEF2F6] pl-10 pr-4 text-sm font-medium text-[#0F2744] outline-none placeholder:text-slate-400 ring-0 focus:ring-2 focus:ring-[#2563EB]/25",
  sidebarActive: "bg-[#2563EB] text-white shadow-sm",
  primary: "bg-[#2563EB] text-white",
  sidebarIdle: "text-[#0F2744] hover:bg-[#EEF2F6]",
} as const;

export const DESK_STAT = {
  amber: {
    wrap: "border-amber-100/80 bg-[#FFF4ED]",
    iconWrap: "bg-[#FFEDD5] text-[#EA580C]",
    value: "text-[#C2410C]",
  },
  sky: {
    wrap: "border-sky-100/80 bg-[#EFF6FF]",
    iconWrap: "bg-[#DBEAFE] text-[#2563EB]",
    value: "text-[#1D4ED8]",
  },
  green: {
    wrap: "border-emerald-100/80 bg-[#F0FDF4]",
    iconWrap: "bg-[#DCFCE7] text-[#15803D]",
    value: "text-[#166534]",
  },
  violet: {
    wrap: "border-violet-100/80 bg-[#F5F3FF]",
    iconWrap: "bg-[#EDE9FE] text-[#7C3AED]",
    value: "text-[#6D28D9]",
  },
  teal: {
    wrap: "border-teal-100/80 bg-[#F0FDFA]",
    iconWrap: "bg-[#CCFBF1] text-[#0F766E]",
    value: "text-[#0F766E]",
  },
  peach: {
    wrap: "border-orange-100/80 bg-[#FFF7ED]",
    iconWrap: "bg-[#FFEDD5] text-[#EA580C]",
    value: "text-[#C2410C]",
  },
} as const;

export function deskInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.charAt(0) || "S"}${parts[1]?.charAt(0) || ""}`.toUpperCase();
}

/** Header job title. "Growth Manager" stays on its own line, like the desk mockup. */
export function deskRoleLines(title: string): string[] {
  const trimmed = title.trim();
  const manager = trimmed.match(/^(.*)\s+Growth Manager$/i);
  if (manager?.[1]) return [manager[1].trim(), "Growth Manager"];
  return trimmed ? [trimmed] : [];
}
