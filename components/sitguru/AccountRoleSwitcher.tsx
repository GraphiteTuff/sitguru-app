"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Megaphone, PawPrint, Shield, Sprout, UserRound } from "lucide-react";
import {
  getAuthorizedDashboardTargets,
  type DashboardSwitchRole,
} from "@/lib/dashboard/role-switch";

const ROLE_ICONS: Record<DashboardSwitchRole, typeof PawPrint> = {
  parent: PawPrint,
  guru: UserRound,
  ambassador: Megaphone,
  intern: GraduationCap,
  manager: Sprout,
  growth: Sprout,
  admin: Shield,
};

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
  const router = useRouter();
  const [pendingRole, setPendingRole] = useState<DashboardSwitchRole | null>(null);
  const targets = getAuthorizedDashboardTargets({
    authorizedRoles,
    includeAdmin,
  });

  if (targets.length < 2) return null;

  return (
    <div
      className={
        className ||
        "rounded-2xl border border-emerald-100 bg-emerald-50 p-2"
      }
    >
      <p className="px-2 pb-1 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-800">
        Switch Your SitGuru Role
      </p>
      {targets.map((target) => {
        const Icon = ROLE_ICONS[target.id];
        const active = target.id === currentRole;
        const pending = pendingRole === target.id;
        return (
          <button
            key={target.id}
            type="button"
            role="menuitem"
            aria-current={active ? "page" : undefined}
            disabled={pending}
            onClick={() => {
              if (active || pendingRole) return;
              setPendingRole(target.id);
              onNavigate?.();
              router.push(target.path);
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
              active ? "bg-white ring-2 ring-[#0D5C3A]" : "hover:bg-white"
            }`}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#0D5C3A]">
              {pending ? (
                <span className="relative grid h-5 w-5 place-items-center" aria-hidden>
                  <span className="absolute inset-0 animate-spin rounded-full border-2 border-[#D1FAE5] border-t-[#0D5C3A] motion-reduce:animate-none" />
                  <PawPrint className="h-3 w-3" />
                </span>
              ) : (
                <Icon className="h-4 w-4" aria-hidden />
              )}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-[14px] font-black tracking-[-0.01em] text-[#102819]">
                {target.shortLabel}
                {active ? (
                  <span className="rounded-full bg-[#0D5C3A] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide !text-white">
                    Active
                  </span>
                ) : null}
              </span>
              <span className="block text-xs font-semibold text-slate-600">{target.helper}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
