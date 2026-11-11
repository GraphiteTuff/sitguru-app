"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AccountRoleSwitcher } from "@/components/sitguru/AccountRoleSwitcher";
import {
  mergeApprovedAdminSwitchRole,
  resolveAuthorizedRolesFromProfile,
  resolveDashboardRoleFromPath,
  switchPortalRoles,
  type DashboardSwitchRole,
} from "@/lib/dashboard/role-switch";
import { isAdminPathAllowedForModules } from "@/lib/admin/portal-areas";
import type { AdminNavAccess } from "@/lib/admin/nav-access";
import { isSitGuruSuperUser } from "@/lib/sitguru/display";
import {
  ChevronDown,
  ChevronUp,
  Home,
  LogOut,
  MessageCircle,
  Settings,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { clearCompanionSessionOnLogout } from "@/lib/chat/clear-companion-session";

type AdminAccount = {
  displayName: string;
  email: string;
  roleLabel: string;
};

const SUPER_ADMIN_EMAILS = new Set(["jason@sitguru.com", "nette@sitguru.com"]);

function normalizeEmail(email?: string | null) {
  return (email || "").trim().toLowerCase();
}

function getStoredSessionEmail() {
  if (typeof window === "undefined") {
    return null;
  }

  const possibleKeys = [
    "sitguru-session",
    "sb-session",
    "supabase.auth.token",
  ];

  for (const key of possibleKeys) {
    const storedValue =
      window.sessionStorage.getItem(key) || window.localStorage.getItem(key);

    if (!storedValue) {
      continue;
    }

    try {
      const parsed = JSON.parse(storedValue);

      const email =
        parsed?.user?.email ||
        parsed?.currentSession?.user?.email ||
        parsed?.session?.user?.email ||
        parsed?.access_token?.user?.email;

      if (email) {
        return normalizeEmail(email);
      }
    } catch {
      continue;
    }
  }

  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const key = window.sessionStorage.key(index);

    if (!key || !key.includes("auth")) {
      continue;
    }

    const storedValue = window.sessionStorage.getItem(key);

    if (!storedValue) {
      continue;
    }

    try {
      const parsed = JSON.parse(storedValue);
      const email =
        parsed?.user?.email ||
        parsed?.currentSession?.user?.email ||
        parsed?.session?.user?.email;

      if (email) {
        return normalizeEmail(email);
      }
    } catch {
      continue;
    }
  }

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (!key || !key.includes("auth")) {
      continue;
    }

    const storedValue = window.localStorage.getItem(key);

    if (!storedValue) {
      continue;
    }

    try {
      const parsed = JSON.parse(storedValue);
      const email =
        parsed?.user?.email ||
        parsed?.currentSession?.user?.email ||
        parsed?.session?.user?.email;

      if (email) {
        return normalizeEmail(email);
      }
    } catch {
      continue;
    }
  }

  return null;
}

function getAdminAccountFromEmail(email?: string | null): AdminAccount {
  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail === "jason@sitguru.com") {
    return {
      displayName: "Jason",
      email: "jason@sitguru.com",
      roleLabel: "SitGuru Super Admin",
    };
  }

  if (normalizedEmail === "nette@sitguru.com") {
    return {
      displayName: "Danette",
      email: "nette@sitguru.com",
      roleLabel: "SitGuru Super Admin",
    };
  }

  if (normalizedEmail.includes("sales") || normalizedEmail.includes("marketing")) {
    return {
      displayName: "Danette",
      email: normalizedEmail,
      roleLabel: "Sales & Marketing",
    };
  }

  if (normalizedEmail) {
    const nameFromEmail = normalizedEmail
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

    return {
      displayName: nameFromEmail || "Admin User",
      email: normalizedEmail,
      roleLabel: SUPER_ADMIN_EMAILS.has(normalizedEmail)
        ? "SitGuru Super Admin"
        : "SitGuru Admin",
    };
  }

  return {
    displayName: "Admin User",
    email: "Checking session...",
    roleLabel: "SitGuru Admin",
  };
}

const FOUNDER_ROLES: DashboardSwitchRole[] = [
  "parent",
  "guru",
  "ambassador",
  "intern",
  "manager",
  "growth",
  "admin",
];

export default function AdminAccountMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [account, setAccount] = useState<AdminAccount>(() =>
    getAdminAccountFromEmail(null),
  );
  const [growthOnly, setGrowthOnly] = useState(false);
  const [switchRoles, setSwitchRoles] = useState<DashboardSwitchRole[]>([]);
  const [modules, setModules] = useState<AdminNavAccess | null>(null);

  const visibleRoleLabel = growthOnly
    ? "Social & Growth Manager"
    : account.roleLabel;

  const topButtonRoleLabel = useMemo(() => {
    return visibleRoleLabel.replace("SitGuru ", "");
  }, [visibleRoleLabel]);

  useEffect(() => {
    let mounted = true;

    async function loadCurrentAdmin() {
      const storedEmail = getStoredSessionEmail();

      if (storedEmail && mounted) {
        setAccount(getAdminAccountFromEmail(storedEmail));
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const sessionEmail = session?.user?.email;

      if (sessionEmail && mounted) {
        setAccount(getAdminAccountFromEmail(sessionEmail));
      }

      const activeUser = session?.user;
      if (activeUser?.id && mounted) {
        const [{ data: profile }, { data: roleRows }, { data: hqAccess }] =
          await Promise.all([
            supabase
              .from("profiles")
              .select("role, account_type, signup_role")
              .eq("id", activeUser.id)
              .maybeSingle(),
            supabase.from("user_roles").select("role").eq("user_id", activeUser.id),
            supabase
              .from("admin_user_access")
              .select("role_key, is_active, portal_areas")
              .eq("user_id", activeUser.id)
              .eq("is_active", true)
              .maybeSingle(),
          ]);
        if (!mounted) return;
        setSwitchRoles(
          mergeApprovedAdminSwitchRole(
            resolveAuthorizedRolesFromProfile({
              profile: (profile as Record<string, unknown> | null) || null,
              roleRows: ((roleRows || []) as Array<{ role?: string | null }>).map(
                (row) => row.role,
              ),
              email: activeUser.email,
            }),
            {
              email: activeUser.email,
              roleKey: hqAccess?.role_key,
              isActive: Boolean(hqAccess?.is_active),
              portalAreas: hqAccess?.portal_areas,
            },
          ),
        );
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const userEmail = user?.email;

      if (userEmail && mounted) {
        setAccount(getAdminAccountFromEmail(userEmail));
        return;
      }

      if (!storedEmail && mounted) {
        setAccount({
          displayName: "Admin User",
          email: "Signed in",
          roleLabel: "SitGuru Admin",
        });
      }
    }

    loadCurrentAdmin();

    fetch("/api/admin/session")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        setGrowthOnly(data.workspace === "growth");
        if (data.modules) setModules(data.modules as AdminNavAccess);
        if (data.workspace === "growth") {
          setAccount((current) => ({
            ...current,
            roleLabel: "Social & Growth Manager",
          }));
        }
      })
      .catch(() => {});

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionEmail = session?.user?.email || getStoredSessionEmail();
      setAccount(getAdminAccountFromEmail(sessionEmail));
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    setOpen(false);
    clearCompanionSessionOnLogout();

    try {
      await supabase.auth.signOut();
    } catch {
      try {
        await fetch("/auth/signout", {
          method: "POST",
        });
      } catch {
        // Continue redirecting even if fallback endpoint is unavailable.
      }
    }

    router.push("/");
    router.refresh();
  }

  const adminSwitchRoles: DashboardSwitchRole[] = switchPortalRoles(
    isSitGuruSuperUser(account.email)
      ? FOUNDER_ROLES
      : switchRoles.length
        ? switchRoles
        : growthOnly
          ? ["growth"]
          : ["parent"],
  );

  const canShowAdminLink = (href: string) => {
    if (isSitGuruSuperUser(account.email) || !modules) return true;
    if (Object.values(modules).every(Boolean)) return true;
    return isAdminPathAllowedForModules(href, modules);
  };

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 max-w-[11.5rem] items-center gap-2 rounded-full bg-[#2563EB] pl-1.5 pr-1.5 text-white shadow-sm transition hover:bg-[#1D4ED8] focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 sm:pr-2.5 xl:max-w-[13rem] xl:pr-3"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open admin account menu"
      >
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white">
          <Image
            src="/images/sitguru-admin-avatar.jpg"
            alt="SitGuru Admin Avatar"
            fill
            sizes="32px"
            priority
            className="object-cover"
          />
        </span>

        <span className="hidden min-w-0 flex-1 text-left sm:block">
          <span className="block truncate text-xs font-black leading-tight text-white">
            {account.displayName}
          </span>

          <span className="hidden truncate text-[10px] font-semibold leading-tight text-white/80 xl:block">
            {topButtonRoleLabel}
          </span>
        </span>

        <span className="hidden shrink-0 text-white/90 sm:block">
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.75rem)] z-[999] max-h-[min(36rem,calc(100dvh-6rem))] w-80 overflow-y-auto overflow-x-hidden rounded-[1.75rem] border border-slate-200/80 bg-white text-left shadow-[0_22px_55px_rgba(15,39,68,0.18)]"
        >
          <div className="bg-gradient-to-r from-[#EFF6FF] via-white to-[#F0FDF4] p-5">
            <div className="flex items-center gap-4">
              <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                <Image
                  src="/images/sitguru-admin-avatar.jpg"
                  alt="SitGuru Admin Avatar"
                  fill
                  sizes="56px"
                  priority
                  className="object-cover"
                />
              </span>

              <div className="min-w-0">
                <p className="truncate text-lg font-black leading-tight text-[#0F2744]">
                  {account.displayName}
                </p>

                <p className="mt-1 truncate text-sm font-semibold text-slate-600">
                  {account.email}
                </p>

                <p className="mt-1 text-sm font-black text-[#2563EB]">
                  {visibleRoleLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-1 p-3">
            <AccountRoleSwitcher
              currentRole={resolveDashboardRoleFromPath(pathname) || "admin"}
              authorizedRoles={adminSwitchRoles}
              onNavigate={() => setOpen(false)}
              className="mb-1 rounded-2xl border border-sky-100 bg-[#EFF6FF] p-2"
            />

            {growthOnly ? null : (
              <>
            {canShowAdminLink("/admin/hr/growth-hire") ? (
            <Link
              href="/admin/hr/growth-hire"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold text-[#0F2744] transition hover:bg-[#EEF2F6]"
            >
              <Users size={18} className="text-[#2563EB]" />
              Hire Social
            </Link>
            ) : null}

            {canShowAdminLink("/admin/messages") ? (
            <Link
              href="/admin/messages"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold text-[#0F2744] transition hover:bg-[#EEF2F6]"
            >
              <MessageCircle size={18} className="text-[#2563EB]" />
              Messages
            </Link>
            ) : null}

            {canShowAdminLink("/admin/settings") ? (
            <Link
              href="/admin/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold text-[#0F2744] transition hover:bg-[#EEF2F6]"
            >
              <Settings size={18} className="text-[#2563EB]" />
              Settings
            </Link>
            ) : null}
              </>
            )}

            <Link
              href="/"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold text-[#0F2744] transition hover:bg-[#EEF2F6]"
            >
              <Home size={18} className="text-[#2563EB]" />
              Back to Homepage
            </Link>

            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-2 flex items-center gap-3 rounded-2xl bg-[#2563EB] px-4 py-3.5 text-left text-sm font-black text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <LogOut size={18} />
              {loggingOut ? "Logging out..." : "Log Out"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}