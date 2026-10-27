"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { useBrowserChromeInset } from "@/hooks/useBrowserChromeInset";

export type WebappTab = {
  label: string;
  href: string;
  icon: LucideIcon;
  match: (path: string) => boolean;
};

/**
 * Same phone dock as the main SitGuru web app: flush bar, icon pill, label.
 * A More button opens the rest of the menu so every page keeps one bar.
 */
export default function WebappBottomNav({
  items,
  more,
  label,
}: {
  items: WebappTab[];
  more: Array<{ label: string; href: string }>;
  label: string;
}) {
  const pathname = usePathname() || "";
  const [moreOpen, setMoreOpen] = useState(false);
  useBrowserChromeInset();
  const moreActive = more.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <>
      {moreOpen ? (
        <div className="fixed inset-x-0 z-[60] px-3 xl:hidden" style={{ bottom: "calc(4.6rem + env(safe-area-inset-bottom, 0px) + var(--sg-chrome-bottom, 0px))" }}>
          <div className="max-h-[50vh] overflow-y-auto rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-[0_-8px_28px_rgba(15,23,42,0.08)]">
            {more.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={`block rounded-xl px-3 py-3 text-sm font-black ${
                    active ? "bg-[#EFF6FF] text-[#2563EB]" : "text-[#0F2744]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
      <nav
        className="pointer-events-auto fixed inset-x-0 z-[60] border-t border-slate-200/90 bg-white/96 shadow-[0_-8px_28px_rgba(15,23,42,0.08)] backdrop-blur-md xl:hidden"
        style={{
          bottom: "var(--sg-chrome-bottom, 0px)",
          paddingBottom: "max(0.4rem, calc(env(safe-area-inset-bottom, 0px) + 0.15rem))",
        }}
        aria-label={label}
      >
        <div className="grid grid-cols-5 gap-0 px-1 pt-1">
          {items.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[10px] font-black leading-tight transition active:scale-[0.97] ${
                  active ? "text-[#2563EB]" : "text-slate-500 active:bg-slate-50"
                }`}
              >
                <span className={`grid h-8 w-12 place-items-center rounded-2xl ${active ? "bg-[#EFF6FF]" : ""}`}>
                  <Icon className={`h-[22px] w-[22px] ${active ? "stroke-[2.35]" : "stroke-[2]"}`} aria-hidden />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[10px] font-black leading-tight ${
              moreOpen || moreActive ? "text-[#2563EB]" : "text-slate-500"
            }`}
          >
            <span className={`grid h-8 w-12 place-items-center rounded-2xl ${moreOpen || moreActive ? "bg-[#EFF6FF]" : ""}`}>
              <MoreHorizontal className="h-[22px] w-[22px]" aria-hidden />
            </span>
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
