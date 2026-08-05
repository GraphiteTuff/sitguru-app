"use client";

/**
 * Role companion shell.
 * - public-guru / onboarding → Scout (Guru companion)
 * - guru-workspace / workspace → Scout on dashboard
 * - public-ambassador / ambassador-onboarding → Taco
 * - ambassador-workspace → Taco on dashboard
 */

import type { ReactNode } from "react";
import AIScoutCompanion from "@/components/officers/AIScoutCompanion";
import AITacoCompanion from "@/components/officers/AITacoCompanion";

export type SitGuruLayoutMode =
  | "public-guru"
  | "guru-workspace"
  | "public-ambassador"
  | "ambassador-workspace";

type LayoutProps = {
  mode: SitGuruLayoutMode;
  children: ReactNode;
  className?: string;
};

export default function Layout({ mode, children, className }: LayoutProps) {
  const companion =
    mode === "public-guru" ? (
      <AIScoutCompanion mode="public-guru" />
    ) : mode === "guru-workspace" ? (
      <AIScoutCompanion mode="workspace" />
    ) : mode === "public-ambassador" ? (
      <AITacoCompanion mode="onboarding" />
    ) : (
      <AITacoCompanion mode="workspace" />
    );

  return (
    <>
      <div className={className}>{children}</div>
      {companion}
    </>
  );
}
