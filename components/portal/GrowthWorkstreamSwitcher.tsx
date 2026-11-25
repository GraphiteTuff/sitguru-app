"use client";
import { useBrowserSnapshot } from "@/hooks/useBrowserSnapshot";
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
  const lastPath = useBrowserSnapshot(() => {
    try { return sessionStorage.getItem("sitguru:workflow:last:" + role) || ""; }
    catch { return ""; }
  }, null);
  const routeKey = role + ":" + path;
  const [previousRouteKey, setPreviousRouteKey] = useState("");
  if (visible && lastPath !== null && previousRouteKey !== routeKey) {
    setPreviousRouteKey(routeKey);
    setPrevious(lastPath !== path && inWorkstream(lastPath, role) ? lastPath : "");
  }
  useEffect(() => {
    if (!visible || lastPath === null) return;
    try { sessionStorage.setItem("sitguru:workflow:last:" + role, path); }
    catch { /* storage unavailable */ }
  }, [path, role, visible, lastPath]);

  if(!visible)return null;
  const tabs=NAV[role];
  const active=selected(path);
  const base="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 sm:px-3";
  return <nav aria-label="SitGuru workspaces: switch between events, Gurus, content and reporting"
    className="relative mb-3 flex w-full min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-xl border border-emerald-100 bg-white px-2 py-2 shadow-sm sm:px-3">
    <span className="hidden shrink-0 text-[10px] font-black uppercase tracking-wide text-emerald-800 lg:inline">
      Quick Switch
    </span>
    <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto overscroll-x-contain">
      {tabs.map(([label,href,Icon],index)=>
        <Link key={href} href={href} aria-current={active===index?"page":undefined}
          className={base+" "+(active===index
            ?"border-emerald-800 bg-[#0D5C3A] text-white shadow-sm"
            :"border-emerald-100 bg-[#F0FDF4] text-[#0D5C3A] hover:bg-emerald-100")}>
          <Icon size={15} aria-hidden="true"/>{label}
        </Link>
      )}
    </div>
    <Link href={previous||tabs[0][1]}
      className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-black text-[#0F2744] hover:bg-blue-50"
      aria-label={previous?"Previous workspace":"Community Studio home"}
      title={previous?"Return to previous workspace":"Return to Community Studio"}>
      <ArrowLeft size={15} aria-hidden="true"/><span className="hidden sm:inline">{previous?"Back":"Home"}</span>
    </Link>
  </nav>;
}
