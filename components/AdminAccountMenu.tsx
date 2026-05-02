"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

export default function AdminAccountMenu() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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
          <span className="block truncate text-sm font-black text-white">
            Admin User
          </span>

          <span className="block truncate text-xs font-semibold text-white/85">
            Super Admin
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
                  Admin User
                </p>

                <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                  admin@sitguru.com
                </p>

                <p className="mt-1 text-base font-black text-green-800">
                  SitGuru Admin
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