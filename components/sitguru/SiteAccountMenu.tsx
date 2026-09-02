"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, LogOut, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AccountRoleSwitcher } from "@/components/sitguru/AccountRoleSwitcher";
import {
  resolveAuthorizedRolesFromProfile,
  resolveDashboardRoleFromPath,
  type DashboardSwitchRole,
} from "@/lib/dashboard/role-switch";
import {
  normalizePetParentAvatarUrl,
  resolvePetParentAvatarUrl,
} from "@/lib/pet-parent-avatar";

type LoadedAccount = {
  name: string;
  email: string;
  avatarUrl: string | null;
  authorizedRoles: DashboardSwitchRole[];
};

function getInitials(name: string, email: string) {
  const value = (name || email || "SG").replace(/@.*/, "");
  const parts = value.split(/[\s._-]+/).filter(Boolean);
  return `${parts[0]?.charAt(0) || "S"}${parts[1]?.charAt(0) || ""}`.toUpperCase();
}

export function SiteAccountMenu({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState<LoadedAccount | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadAccount() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted || !user) {
        setAccount(null);
        return;
      }

      const email = user.email || "";
      const [{ data: profile }, { data: roleRows }, { data: guru }, { data: ambassador }] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", user.id),
          supabase.from("gurus").select("id").eq("user_id", user.id).maybeSingle(),
          supabase
            .from("ambassadors")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

      const authorizedRoles = resolveAuthorizedRolesFromProfile({
        profile: (profile as Record<string, unknown> | null) || null,
        roleRows: ((roleRows || []) as Array<{ role?: string | null }>).map(
          (row) => row.role,
        ),
        metadata: {
          ...(user.app_metadata || {}),
          ...(user.user_metadata || {}),
        },
        email,
        hasGuruRecord: Boolean(guru?.id),
        hasAmbassadorRecord: Boolean(ambassador?.id),
      });

      const firstLast = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim();
      setAccount({
        name:
          profile?.display_name ||
          profile?.full_name ||
          profile?.name ||
          firstLast ||
          email ||
          "My Account",
        email,
        avatarUrl: normalizePetParentAvatarUrl(
          resolvePetParentAvatarUrl(profile),
        ),
        authorizedRoles,
      });
    }

    loadAccount();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => loadAccount(), 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (!account) return null;

  const initials = getInitials(account.name, account.email);
  const currentRole = resolveDashboardRoleFromPath(pathname);

  async function handleLogout() {
    setOpen(false);
    try {
      await supabase.auth.signOut();
    } catch {
      // Keep the local redirect even if sign-out is already clean.
    }
    router.replace("/");
    router.refresh();
  }

  function Avatar({ sizeClass }: { sizeClass: string }) {
    return (
      <span
        className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white text-sm font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-100`}
      >
        {account.avatarUrl ? (
          <Image
            src={account.avatarUrl}
            alt={`${account.name} profile photo`}
            width={64}
            height={64}
            className="sg-face-photo h-full w-full"
            unoptimized
          />
        ) : (
          initials || <UserRound className="h-5 w-5" />
        )}
      </span>
    );
  }

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1.5 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-100 focus:outline-none focus:ring-4 focus:ring-emerald-100"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open account menu"
      >
        <Avatar sizeClass={compact ? "h-9 w-9" : "h-11 w-11"} />
        {compact ? null : (
          <span className="hidden max-w-[100px] truncate text-sm font-semibold text-slate-950 xl:block">
            {account.name}
          </span>
        )}
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.75rem)] z-[999] w-80 overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white text-left shadow-[0_22px_55px_rgba(15,23,42,0.18)]"
        >
          <div className="bg-[linear-gradient(135deg,#ecfdf5_0%,#eff6ff_100%)] p-5">
            <div className="flex items-center gap-4">
              <Avatar sizeClass="h-16 w-16" />
              <div className="min-w-0">
                <p className="truncate text-xl font-semibold leading-tight text-slate-950">
                  {account.name}
                </p>
                {account.email ? (
                  <p className="mt-1 truncate text-sm font-medium text-slate-500">
                    {account.email}
                  </p>
                ) : null}
                <AccountRoleSwitcher
                  currentRole={currentRole}
                  authorizedRoles={account.authorizedRoles}
                  onNavigate={() => setOpen(false)}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-1 p-3">
            <Link
              href="/customer/dashboard"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="rounded-2xl px-4 py-3 text-[15px] font-semibold text-slate-800 transition hover:bg-emerald-50 hover:text-emerald-700"
            >
              Pet Parent
            </Link>
            <Link
              href="/guru/dashboard"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="rounded-2xl px-4 py-3 text-[15px] font-semibold text-slate-800 transition hover:bg-emerald-50 hover:text-emerald-700"
            >
              Guru
            </Link>
            <Link
              href="/ambassador/dashboard"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="rounded-2xl px-4 py-3 text-[15px] font-semibold text-slate-800 transition hover:bg-emerald-50 hover:text-emerald-700"
            >
              Ambassador
            </Link>
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="rounded-2xl px-4 py-3 text-[15px] font-semibold text-slate-800 transition hover:bg-emerald-50 hover:text-emerald-700"
            >
              Admin
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="mt-2 flex items-center gap-3 rounded-2xl bg-emerald-600 px-4 py-4 text-left text-[15px] font-semibold text-white transition hover:bg-emerald-700"
            >
              <LogOut className="h-5 w-5" />
              Log Out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
