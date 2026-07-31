"use client";

import type { ReactNode } from "react";

type FloatingActionStackProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Shared viewport dock for floating controls (scroll-to-top, homepage chat, etc.).
 * Children must opt into pointer-events-auto; the dock itself ignores pointer events.
 */
export default function FloatingActionStack({
  children,
  className = "",
}: FloatingActionStackProps) {
  return (
    <div
      className={[
        "pointer-events-none fixed bottom-4 right-4 z-50",
        "flex flex-row items-end gap-3",
        "md:bottom-6 md:right-6 md:flex-col md:items-center md:gap-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-floating-action-stack
    >
      {children}
    </div>
  );
}
