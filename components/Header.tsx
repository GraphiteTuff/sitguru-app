"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const links = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Find Care" },
  { href: "/become-a-sitter", label: "Become a Guru" },
  { href: "/bookings", label: "Bookings" },
  { href: "/dashboard", label: "Dashboard" },
];

type InboxMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  is_read?: boolean | null;
};

type SenderProfile = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  account_type?: string | null;
  role?: string | null;
};

export default function Header() {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<InboxMessage[]>([]);

  const pathname = usePathname();

  // 🔥 DARK MODE DETECTION
  const isDarkPage =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/guru");

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  async function loadInboxPreview() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setUserId(user.id);

    const { data } = await supabase
      .from("messages")
      .select("*")
      .limit(5);

    setMessages(data || []);
  }

  useEffect(() => {
    loadInboxPreview();
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-md ${
        isDarkPage
          ? "bg-slate-900 border-slate-800 shadow-lg"
          : "bg-white/95 border-slate-200"
      }`}
    >
      <div className="page-container flex h-16 items-center justify-between gap-4">

        {/* LOGO */}
        <Link href="/" className="flex flex-col leading-none">
          <span
            className={`text-[2.1rem] font-black tracking-tight ${
              isDarkPage ? "text-white" : "text-slate-900"
            }`}
          >
            <span className="text-emerald-500">Sit</span>Guru
          </span>

          <span
            className={`mt-1 text-[11px] italic ${
              isDarkPage ? "text-white/85" : "text-slate-500"
            }`}
          >
            Trusted Pet Care. Simplified.
          </span>
        </Link>

        {/* NAV */}
        <nav className="hidden items-center gap-2 xl:flex">
          {links.map((link) => {
            const active = isActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`btn-ghost ${
                  isDarkPage
                    ? active
                      ? "bg-white/15 text-white"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                    : active
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-700 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* RIGHT SIDE */}
        <div className="hidden items-center gap-3 lg:flex">

          <Link
            href="/login"
            className={`text-sm font-semibold ${
              isDarkPage
                ? "text-white/90 hover:text-white"
                : "text-slate-700 hover:text-slate-900"
            }`}
          >
            Customer Login
          </Link>

          <Link
            href="/guru/login"
            className={`text-sm font-semibold ${
              isDarkPage
                ? "text-white/90 hover:text-white"
                : "text-slate-700 hover:text-slate-900"
            }`}
          >
            Guru Login
          </Link>

          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-sm"
          >
            Get Started
          </Link>
        </div>

        {/* MOBILE */}
        <button
          onClick={() => setOpen(!open)}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${
            isDarkPage
              ? "border-white/20 bg-white/10 text-white"
              : "border-slate-300 bg-white text-slate-900"
          } lg:hidden`}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>
    </header>
  );
}