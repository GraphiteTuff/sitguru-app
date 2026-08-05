"use client";

/**
 * Role companion shell.
 * - public-guru → Scout (unauthenticated Become a Guru / application)
 * - guru-workspace → Scout on dashboard (auth personalizes; FAB still mounts)
 * - public-ambassador → Taco
 * - ambassador-workspace → Taco on dashboard
 *
 * Public Guru onboarding paths bypass any Guru-auth companion gating even when
 * a parent route still declares `guru-workspace` (e.g. `/guru/*` layout).
 */

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AIScoutCompanion from "@/components/officers/AIScoutCompanion";
import AITacoCompanion from "@/components/officers/AITacoCompanion";
import { isPublicGuruOnboardingPath } from "@/lib/companions/scout-routes";

export type SitGuruLayoutMode =
  | "public-guru"
  | "guru-workspace"
  | "public-ambassador"
  | "ambassador-workspace"
  /** @deprecated Prefer `public-guru` */
  | "onboarding"
  /** @deprecated Prefer `guru-workspace` */
  | "workspace";

type LayoutProps = {
  mode: SitGuruLayoutMode;
  children: ReactNode;
  className?: string;
};

function resolveCompanionMode(
  mode: SitGuruLayoutMode,
  pathname: string | null,
): SitGuruLayoutMode {
  // Public onboarding always wins — never require useGuruAuth / workspace auth.
  if (mode === "public-guru" || mode === "onboarding") return "public-guru";
  if (isPublicGuruOnboardingPath(pathname)) return "public-guru";

  if (mode === "guru-workspace" || mode === "workspace") return "guru-workspace";
  if (mode === "public-ambassador") return "public-ambassador";
  return "ambassador-workspace";
}

export default function Layout({ mode, children, className }: LayoutProps) {
  const pathname = usePathname();
  const companionMode = resolveCompanionMode(mode, pathname);

  const companion =
    companionMode === "public-guru" ? (
      <AIScoutCompanion mode="public-guru" />
    ) : companionMode === "guru-workspace" ? (
      <AIScoutCompanion mode="workspace" />
    ) : companionMode === "public-ambassador" ? (
      <AITacoCompanion mode="onboarding" />
    ) : (
      <AITacoCompanion mode="workspace" />
    );

  return (
    <>
      <div
        className={className}
        data-sitguru-layout-mode={companionMode}
        data-sitguru-layout-public={
          companionMode === "public-guru" || companionMode === "public-ambassador"
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
