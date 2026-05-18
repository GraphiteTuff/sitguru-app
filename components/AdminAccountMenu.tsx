"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Home,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Settings,
  ShieldCheck,
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

export default function AdminAccountMenu() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [account, setAccount] = useState<AdminAccount>(() =>
    getAdminAccountFromEmail(null),
  );

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

  return (
    <div ref={menuRef} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-4 rounded-[1.35rem] border border-green-800 bg-green-800 px-4 py-3 text-white shadow-sm transition hover:bg-green-900 focus:outline-none focus:ring-4 focus:ring-green-100"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open admin account menu"
      >
        <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-100 bg-white shadow-sm ring-2 ring-white/40">
          <Image
            src="/images/sitguru-admin-avatar.jpg"
            alt="SitGuru Admin Avatar"
            fill
            sizes="56px"
            priority
            className="object-cover"
          />
        </span>

        <span className="min-w-0 pr-1 text-left">
          <span className="block max-w-[9rem] truncate text-sm font-black text-white">
            {account.displayName}
          </span>

          <span className="block max-w-[9rem] truncate text-xs font-semibold text-white/85">
            {topButtonRoleLabel}
          </span>
        </span>

        <span className="text-white">
          {open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
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