"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AccountRoleSwitcher } from "@/components/sitguru/AccountRoleSwitcher";
import { resolveDashboardRoleFromPath } from "@/lib/dashboard/role-switch";
import { isSitGuruSuperUser } from "@/lib/sitguru/display";
import {
  ChevronDown,
  ChevronUp,
  Home,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Settings,
  ShieldCheck,
  Megaphone,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

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

const FOUNDER_ROLES = ["parent", "guru", "ambassador", "admin"] as const;

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

  const topButtonRoleLabel = useMemo(() => {
    return account.roleLabel.replace("SitGuru ", "");
  }, [account.roleLabel]);

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
        if (data.workspace === "growth") {
          setAccount((current) => ({
            ...current,
            roleLabel: "Social & Community",
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

  const adminSwitchRoles = isSitGuruSuperUser(account.email)
    ? FOUNDER_ROLES
    : growthOnly
      ? ([] as const)
      : (["parent", "admin"] as const);

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 max-w-[11.5rem] items-center gap-2 rounded-full border border-green-800 bg-green-800 pl-1.5 pr-2.5 text-white shadow-sm transition hover:bg-green-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-100 xl:max-w-[13rem] xl:pr-3"
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

        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate text-xs font-black leading-tight text-white">
            {account.displayName}
          </span>

          <span className="hidden truncate text-[10px] font-semibold leading-tight text-white/80 xl:block">
            {topButtonRoleLabel}
          </span>
        </span>

        <span className="shrink-0 text-white/90">
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.75rem)] z-[999] w-80 overflow-hidden rounded-[1.75rem] border border-[#dce9df] bg-white text-left shadow-[0_22px_55px_rgba(15,23,42,0.18)]"
        >
          <div className="bg-[linear-gradient(135deg,#ecfdf5_0%,#eff6ff_100%)] p-5">
            <div className="flex items-center gap-4">
              <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-100 bg-white shadow-sm">
                <Image
                  src="/images/sitguru-admin-avatar.jpg"
                  alt="SitGuru Admin Avatar"
                  fill
                  sizes="64px"
                  priority
                  className="object-cover"
                />
              </span>

              <div className="min-w-0">
                <p className="truncate text-xl font-black leading-tight text-slate-950">
                  {account.displayName}
                </p>

                <p className="mt-1 truncate text-sm font-semibold text-slate-600">
                  {account.email}
                </p>

                <p className="mt-1 text-base font-black text-green-800">
                  {account.roleLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-1 p-3">
            <AccountRoleSwitcher
              currentRole={resolveDashboardRoleFromPath(pathname) || "admin"}
              authorizedRoles={adminSwitchRoles}
              onNavigate={() => setOpen(false)}
              className="mb-1 rounded-2xl border border-emerald-100 bg-emerald-50 p-2"
            />
            <Link
              href="/admin/growth"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-black text-slate-800 transition hover:bg-green-50 hover:text-green-800"
            >
              <Megaphone size={19} className="text-green-800" />
              Growth Portal
            </Link>

            {growthOnly ? null : (
              <>
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-black text-slate-800 transition hover:bg-green-50 hover:text-green-800"
            >
              <LayoutDashboard size={19} className="text-green-800" />
              Dashboard
            </Link>

            <Link
              href="/admin/hr/growth-hire"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-black text-slate-800 transition hover:bg-green-50 hover:text-green-800"
            >
              <Users size={19} className="text-green-800" />
              Hire Social
            </Link>

            <Link
              href="/admin/messages"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-black text-slate-800 transition hover:bg-green-50 hover:text-green-800"
            >
              <MessageCircle size={19} className="text-green-800" />
              Messages
            </Link>

            <Link
              href="/admin/customers"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-black text-slate-800 transition hover:bg-green-50 hover:text-green-800"
            >
              <Users size={19} className="text-green-800" />
              Customers
            </Link>

            <Link
              href="/admin/gurus"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-black text-slate-800 transition hover:bg-green-50 hover:text-green-800"
            >
              <ShieldCheck size={19} className="text-green-800" />
              Gurus
            </Link>

            <Link
              href="/admin/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-black text-slate-800 transition hover:bg-green-50 hover:text-green-800"
            >
              <Settings size={19} className="text-green-800" />
              Settings
            </Link>
              </>
            )}

            <Link
              href="/"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-black text-slate-800 transition hover:bg-green-50 hover:text-green-800"
            >
              <Home size={19} className="text-green-800" />
              Back to Homepage
            </Link>

            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-2 flex items-center gap-3 rounded-2xl bg-green-800 px-4 py-4 text-left text-base font-black text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <LogOut size={20} />
              {loggingOut ? "Logging out..." : "Log Out"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}