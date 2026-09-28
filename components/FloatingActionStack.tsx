"use client";

import type { ReactNode } from "react";
import { useBrowserChromeInset } from "@/hooks/useBrowserChromeInset";

type FloatingActionStackProps = {
  children: ReactNode;
  className?: string;
  /** Lift above the Pet Parent bottom nav dock on mobile. */
  aboveBottomNav?: boolean;
};

/**
 * Shared viewport dock for floating controls (homepage chat, etc.).
 * Children must opt into pointer-events-auto; the dock itself ignores pointer events.
 * Bottom offset clears iOS Safari chrome via --sg-chrome-bottom + safe-area.
 */
export default function FloatingActionStack({
  children,
  className = "",
  aboveBottomNav = false,
}: FloatingActionStackProps) {
  useBrowserChromeInset();

  const mobileBottom = aboveBottomNav
    ? "bottom-[calc(4.35rem+env(safe-area-inset-bottom,0px)+var(--sg-chrome-bottom,0px))]"
    : "bottom-[calc(1rem+env(safe-area-inset-bottom,0px)+var(--sg-chrome-bottom,0px))]";

  return (
    <div
      className={[
        "pointer-events-none fixed right-4 z-50",
        mobileBottom,
        "flex flex-row items-end gap-3 overflow-visible",
        "md:bottom-6 md:right-6 md:flex-col md:items-end md:gap-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-floating-action-stack
      data-above-bottom-nav={aboveBottomNav ? "true" : "false"}
    >
      {children}
    </div>
  );
}
