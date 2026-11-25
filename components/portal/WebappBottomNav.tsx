"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { useBrowserChromeInset } from "@/hooks/useBrowserChromeInset";
import { SITGURU_MOBILE_NAV as NAV, SITGURU_MOBILE_NAV_INSET } from "@/lib/portal/mobile-nav-style";

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

  useEffect(() => {
    if (!moreOpen) return;
    document.body.setAttribute("data-sitguru-more-open", "1");
    return () => document.body.removeAttribute("data-sitguru-more-open");
  }, [moreOpen]);
  useBrowserChromeInset();
  const moreActive = more.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <>
      {moreOpen ? (
        <div className="fixed inset-x-0 z-[97] px-3 xl:hidden" style={{ bottom: "calc(6.5rem + env(safe-area-inset-bottom, 0px) + var(--sg-chrome-bottom, 0px))" }}>
          <div className="max-h-[50vh] overflow-y-auto rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-[0_-8px_28px_rgba(15,23,42,0.08)]">
            {more.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={`block rounded-xl px-3 py-3 text-sm font-black ${
                    active ? NAV.active : NAV.idle
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
        className={`${NAV.surface} !z-[96] xl:hidden`}
        style={SITGURU_MOBILE_NAV_INSET}
        aria-label={label}
        data-webapp-bottom-nav
      >
        <div className={NAV.grid}>
          {items.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`${NAV.tab} ${active ? NAV.active : NAV.idle}`}
              >
                <span className={`${NAV.icon} ${active ? NAV.iconActive : ""}`}>
                  <Icon className={`${NAV.iconSize} ${active ? NAV.iconStrokeActive : NAV.iconStrokeIdle}`} aria-hidden />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            aria-label="More portal pages"
            className={`${NAV.tab} ${moreOpen || moreActive ? NAV.active : NAV.idle}`}
          >
            <span className={`${NAV.icon} ${moreOpen || moreActive ? NAV.iconActive : ""}`}>
              <MoreHorizontal className={`${NAV.iconSize} ${moreOpen || moreActive ? NAV.iconStrokeActive : NAV.iconStrokeIdle}`} aria-hidden />
            </span>
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
