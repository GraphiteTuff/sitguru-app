"use client";

import SharedGuruDashboardHeader from "@/app/guru/dashboard/GuruDashboardHeader";

/**
 * Backward-compatible Guru header entry point. The Guru dashboard, older
 * settings/profile pages and shared portal all use the same account avatar,
 * role switcher, and scroll-safe Manager/Intern menu.
 */
type LegacyGuruTab = "dashboard" | "bookings" | "messages" | "profile" | "availability" | "earnings" | "resources" | "settings";

type GuruDashboardHeaderProps = {
  active?: LegacyGuruTab;
  displayName?: string | null;
  imageUrl?: string | null;
  tierLabel?: string | null;
  profileCompletion?: number | null;
};

export default function GuruDashboardHeader({ active, ...rest }: GuruDashboardHeaderProps) {
  const knownTab = active === "resources" || active === "settings" ? undefined : active;
  return <SharedGuruDashboardHeader active={knownTab} {...rest} />;
}
