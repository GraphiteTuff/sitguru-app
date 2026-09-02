"use client";

import Link from "next/link";
import { Repeat2 } from "lucide-react";
import {
  DASHBOARD_SWITCH_TARGETS,
  getAvailableDashboardSwitches,
  type DashboardSwitchRole,
} from "@/lib/dashboard/role-switch";

export function AccountRoleSwitcher({
  currentRole,
  authorizedRoles,
  onNavigate,
  includeAdmin = true,
  className,
}: {
  currentRole: DashboardSwitchRole | null;
  authorizedRoles: readonly DashboardSwitchRole[];
  onNavigate?: () => void;
  includeAdmin?: boolean;
  className?: string;
}) {
  const targets = getAvailableDashboardSwitches({
    currentRole,
    authorizedRoles,
    includeAdmin,
  });

  if (!targets.length) return null;

  return (
    <div
      className={
        className ||
        "rounded-2xl border border-emerald-100 bg-emerald-50 p-2"
      }
    >
      <p className="px-2 pb-1 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
        Switch Portal
      </p>
      {targets.map((target) => (
        <Link
          key={target.id}
          href={target.path}
          role="menuitem"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold tracking-[-0.01em] text-emerald-900 transition hover:bg-white"
        >
          <Repeat2 className="h-4 w-4 shrink-0" />
          {target.label}
        </Link>
      ))}
    </div>
  );
}

export { DASHBOARD_SWITCH_TARGETS };
