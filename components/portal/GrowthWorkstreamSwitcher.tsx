"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3, CalendarDays, LayoutGrid, Megaphone, PawPrint } from "lucide-react";

type Role = "admin" | "manager" | "intern";

const NAV = {
  manager: [
    ["Community Studio", "/manager/community-studio", LayoutGrid],
    ["Guru Match", "/manager/community-studio/guru-match", PawPrint],
    ["Event Match", "/manager/community-studio/event-match", CalendarDays],
    ["Content Studio", "/manager/campaigns-content", Megaphone],
    ["Social Intelligence", "/manager/metrics?view=social-intelligence", BarChart3],
  ],
  intern: [
    ["Community Studio", "/intern/community-studio", LayoutGrid],
    ["Guru Match", "/intern/community-studio/guru-match", PawPrint],
    ["Event Match", "/intern/community-studio/event-match", CalendarDays],
    ["Content Studio", "/intern/content", Megaphone],
    ["Social Intelligence", "/intern/social-intelligence", BarChart3],
  ],
  admin: [
    ["Community Studio", "/admin/growth", LayoutGrid],
    ["Guru Match", "/admin/growth/guru-match", PawPrint],
    ["Event Match", "/admin/growth/event-match", CalendarDays],
    ["Content Studio", "/admin/growth/content", Megaphone],
    ["Social Intelligence", "/admin/growth/social-intelligence", BarChart3],
  ],
} as const;

function inWorkstream(path: string, role: Role): boolean {
  if (role === "admin")
    return path === "/admin/growth" || path.startsWith("/admin/growth/") ||
      path === "/admin/sales-marketing/content";
  if (role === "manager")
    return path.startsWith("/manager/community-studio") ||
      path === "/manager/campaigns-content" || path === "/manager/metrics";
  return path.startsWith("/intern/community-studio") ||
    ["/intern/content", "/intern/metrics", "/intern/social-intelligence"].includes(path);
}

function selected(path: string): number {
  if (path.endsWith("/guru-match")) return 1;
  if (path.endsWith("/event-match")) return 2;
  if (path.includes("/campaigns-content") || path.endsWith("/content")) return 3;
  if (path.endsWith("/metrics") || path.includes("/social-intelligence")) return 4;
  return 0;
}

/** One-tap switching from any matching staff workflow. Previous stays inside SitGuru. */
export default function GrowthWorkstreamSwitcher({role}:{role:Role}) {
  const path = usePathname();
  const [previous,setPrevious] = useState<string>("");
  const visible = inWorkstream(path,role);
  useEffect(()=>{
    if(!visible)return;
    const key="sitguru:workflow:last:"+role;
    try{
      const last=sessionStorage.getItem(key)||"";
      setPrevious(last!==path && inWorkstream(last,role)?last:"");
      if(last!==path)sessionStorage.setItem(key,path);
    }catch{setPrevious("");}
  },[path,role,visible]);

  if(!visible)return null;
  const tabs=NAV[role];
  const active=selected(path);
  const base="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 sm:px-4 sm:text-sm";
  return <nav aria-label="SitGuru workspaces: switch between events, Gurus, content and reporting"
    className="sticky top-[64px] z-30 mb-4 w-full min-w-0 max-w-full rounded-2xl border border-emerald-100 bg-white/95 p-2 shadow-sm backdrop-blur sm:top-[72px] sm:p-3">
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
      <span className="text-[11px] font-black uppercase tracking-wide text-emerald-800">SitGuru · Quick Switch</span>
      <Link href={previous||tabs[0][1]}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-black text-[#0F2744] hover:bg-blue-50"
        title={previous?"Return to previous workspace":"Return to Community Studio"}>
        <ArrowLeft size={15} aria-hidden="true"/>{previous?"Previous workspace":"Studio home"}
      </Link>
    </div>
    <div className="flex w-full min-w-0 gap-2 overflow-x-auto pb-1">
      {tabs.map(([label,href,Icon],index)=>
        <Link key={href} href={href} aria-current={active===index?"page":undefined}
          className={base+" "+(active===index
            ?"border-emerald-800 bg-[#0D5C3A] text-white shadow-sm"
            :"border-emerald-100 bg-[#F0FDF4] text-[#0D5C3A] hover:bg-emerald-100")}>
          <Icon size={16} aria-hidden="true"/>{label}
        </Link>
      )}
    </div>
  </nav>;
}
