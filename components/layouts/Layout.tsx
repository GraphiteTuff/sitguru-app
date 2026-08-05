"use client";

/**
 * Role companion shell — mounts Scout / Taco from layout mode + current path.
 * Public routes (/become-a-guru, /ambassadors) never hit useGuruAuth.
 */

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AIScoutCompanion from "@/components/officers/AIScoutCompanion";
import {
  getBotConfig,
  type CompanionLayoutMode,
} from "@/lib/companions/bot-config";

export type SitGuruLayoutMode = CompanionLayoutMode;

type LayoutProps = {
  /** Optional — when omitted, companions resolve from the current path only. */
  mode?: SitGuruLayoutMode;
  children: ReactNode;
  className?: string;
};

export default function Layout({
  mode = "auto",
  children,
  className,
}: LayoutProps) {
  const pathname = usePathname();
  const currentPath =
    pathname ||
    (typeof window !== "undefined" ? window.location.pathname : "");

  const bot = getBotConfig({ mode, currentPath });

  // Never call useGuruAuth here — public companions must mount as guests.
  const companion = bot.shouldRender ? (
    <AIScoutCompanion mode={mode} currentPath={currentPath} />
  ) : null;

  return (
    <>
      <div
        className={className}
        data-sitguru-layout-mode={mode}
        data-sitguru-bot-variant={bot.variant ?? "none"}
        data-sitguru-bot-surface={bot.surface ?? "none"}
        data-sitguru-layout-public={
          bot.surface === "public-guru" || bot.surface === "onboarding"
            ? "true"
            : "false"
        }
      >
        {children}
      </div>
      {companion}
    </>
  );
}
