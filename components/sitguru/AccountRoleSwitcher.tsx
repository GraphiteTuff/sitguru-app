"use client";

import Link from "next/link";
import {
  DASHBOARD_SWITCH_TARGETS,
  getAuthorizedDashboardTargets,
  type DashboardSwitchRole,
} from "@/lib/dashboard/role-switch";

export function AccountRoleSwitcher({
  currentRole,
  authorizedRoles,
  onNavigate,
}: {
  currentRole: DashboardSwitchRole | null;
  authorizedRoles: readonly DashboardSwitchRole[];
  onNavigate?: () => void;
}) {
  const targets = getAuthorizedDashboardTargets({
    authorizedRoles,
    includeAdmin: true,
  });

  if (targets.length < 2) return null;

  return (
    <div className="mt-2">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
        Switch role
      </p>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        {targets.map((target) => {
          const active = target.id === currentRole;

          return (
            <Link
              key={target.id}
              href={target.path}
              role="menuitem"
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={
                active
                  ? "rounded-lg bg-[#0D5C3A] px-2 py-1.5 text-center text-[11px] font-black text-white"
                  : "rounded-lg border border-emerald-100 bg-white px-2 py-1.5 text-center text-[11px] font-black text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-50"
              }
            >
              {target.shortLabel}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export { DASHBOARD_SWITCH_TARGETS };
