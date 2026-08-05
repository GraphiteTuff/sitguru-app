/**
 * GlobalDashboardSwitcher — shared Switch Dashboard control for
 * Pet Parent, Guru, and Ambassador navigation shells.
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  LayoutDashboard,
  PawPrint,
  Repeat2,
  Shield,
  UsersRound,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  getAvailableDashboardSwitches,
  resolveDashboardRoleFromPath,
  type DashboardAccessFlags,
  type DashboardSwitchRole,
  type DashboardSwitchTarget,
} from "@/lib/dashboard/role-switch";

type GlobalDashboardSwitcherProps = {
  /** Force current role; otherwise inferred from pathname. */
  currentRole?: DashboardSwitchRole | null;
  /** Optional precomputed access flags (skips client role fetch). */
  access?: DashboardAccessFlags | null;
  /** nav = header pill, panel = stacked card list, sheet = mobile drawer block */
  variant?: "nav" | "panel" | "sheet";
  className?: string;
  includeAdmin?: boolean;
};

function roleIcon(id: DashboardSwitchRole) {
  if (id === "parent") return PawPrint;
  if (id === "guru") return Repeat2;
  if (id === "ambassador") return UsersRound;
  return Shield;
}

function normalizeRoleToken(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function inferAccessFromProfile(profile: Record<string, unknown> | null) {
  const role = normalizeRoleToken(profile?.role);
  const accountType = normalizeRoleToken(profile?.account_type);
  const blob = `${role} ${accountType}`;

  const access: DashboardAccessFlags = {
    parent:
      blob.includes("pet_parent") ||
      blob.includes("customer") ||
      blob.includes("parent") ||
      true, // Pet Parent workspace is generally available once signed in
    guru:
      blob.includes("guru") ||
      blob.includes("provider") ||
      blob.includes("sitter"),
    ambassador: blob.includes("ambassador"),
    admin: blob.includes("admin") || blob.includes("super_admin"),
  };

  return access;
}

export default function GlobalDashboardSwitcher({
  currentRole: currentRoleProp,
  access: accessProp,
  variant = "nav",
  className = "",
  includeAdmin = true,
}: GlobalDashboardSwitcherProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [access, setAccess] = useState<DashboardAccessFlags | null>(
    accessProp || null,
  );
  const [loading, setLoading] = useState(!accessProp);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const currentRole =
    currentRoleProp ?? resolveDashboardRoleFromPath(pathname);

  useEffect(() => {
    if (accessProp) {
      setAccess(accessProp);
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) {
          if (!cancelled) {
            setAccess({ parent: true });
            setLoading(false);
          }
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role,account_type")
          .eq("id", user.id)
          .maybeSingle();

        // Also check ambassadors / guru_profiles lightly for multi-role users.
        const [{ count: ambassadorCount }, { count: guruCount }] =
          await Promise.all([
            supabase
              .from("ambassadors")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id),
            supabase
              .from("guru_profiles")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id),
          ]);

        const inferred = inferAccessFromProfile(
          (profile as Record<string, unknown> | null) || null,
        );
        if ((ambassadorCount || 0) > 0) inferred.ambassador = true;
        if ((guruCount || 0) > 0) inferred.guru = true;

        if (!cancelled) {
          setAccess(inferred);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setAccess({ parent: true });
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessProp]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const availableRoles = useMemo(
    () =>
      getAvailableDashboardSwitches({
        currentRole,
        access,
        includeAdmin,
      }),
    [access, currentRole, includeAdmin],
  );

  if (loading) {
    return (
      <div
        className={`h-11 w-40 animate-pulse rounded-full bg-emerald-50 ${className}`}
        aria-hidden
      />
    );
  }

  if (availableRoles.length === 0) return null;

  if (variant === "panel" || variant === "sheet") {
    return (
      <div
        className={`w-full rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 sm:p-4 ${className}`}
      >
        <p className="px-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
          Switch Dashboard
        </p>
        <div className="mt-2 grid w-full gap-1.5">
          {availableRoles.map((role) => (
            <SwitchLinkRow
              key={role.id}
              role={role}
              onNavigate={() => setOpen(false)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-11 w-full min-w-[11.5rem] max-w-full items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold tracking-[-0.01em] text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 sm:min-w-[12.5rem]"
      >
        <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
        <span className="whitespace-nowrap">Switch Dashboard</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.55rem)] z-[80] w-[min(18rem,calc(100vw-1.5rem))] origin-top-right rounded-2xl border border-slate-100 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-fadeIn"
        >
          <p className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
            Switch Dashboard
          </p>
          <div className="grid gap-1">
            {availableRoles.map((role) => (
              <SwitchLinkRow
                key={role.id}
                role={role}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SwitchLinkRow({
  role,
  onNavigate,
}: {
  role: DashboardSwitchTarget;
  onNavigate?: () => void;
}) {
  const Icon = roleIcon(role.id);
  return (
    <Link
      href={role.path}
      role="menuitem"
      onClick={onNavigate}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-transparent bg-white px-3 py-3 text-left transition hover:border-emerald-100 hover:bg-emerald-50 active:scale-[0.99]"
    >
      <span className="inline-flex min-w-0 items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-black tracking-tight text-slate-800">
            {role.label}
          </span>
          <span className="mt-0.5 block truncate text-[10px] font-semibold text-slate-500">
            {role.helper}
          </span>
        </span>
      </span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden />
    </Link>
  );
}
