"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import {
  getAuthorizedDashboardTargets,
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
  const targets = getAuthorizedDashboardTargets({
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
      role="group"
      aria-label="Switch workspace"
    >
      <p className="px-2 pb-1 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
        Switch workspace
      </p>
      {targets.map((target) => {
        const selected = target.id === currentRole;

        if (selected) {
          return (
            <div
              key={target.id}
              role="menuitem"
              aria-current="true"
              className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-[14px] font-semibold tracking-[-0.01em] text-emerald-950 ring-1 ring-emerald-200"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block">{target.shortLabel}</span>
                <span className="block text-[11px] font-medium text-emerald-700/80">
                  Current workspace
                </span>
              </span>
            </div>
          );
        }

        return (
          <Link
            key={target.id}
            href={target.path}
            role="menuitem"
            aria-current={undefined}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold tracking-[-0.01em] text-emerald-900 transition hover:bg-white"
          >
            <span
              aria-hidden
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-transparent"
            />
            <span className="min-w-0 flex-1">
              <span className="block">{target.shortLabel}</span>
              <span className="block text-[11px] font-medium text-emerald-700/70">
                {target.helper}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export { DASHBOARD_SWITCH_TARGETS } from "@/lib/dashboard/role-switch";
