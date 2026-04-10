"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Find Care" },
  { href: "/become-a-sitter", label: "Become a Sitter" },
  { href: "/bookings", label: "Bookings" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="page-container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="text-2xl font-black tracking-tight text-slate-900">
          <span className="text-emerald-600">Paw</span>
          <span>Necto</span>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active
                    ? "btn-ghost bg-slate-100 text-slate-900"
                    : "btn-ghost"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="btn-secondary">
            Log in
          </Link>

          <Link href="/signup" className="btn-primary">
            Get started
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-900 lg:hidden"
          aria-label="Toggle menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="page-container flex flex-col gap-2 py-4">
            {links.map((link) => {
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={
                    active
                      ? "rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900"
                      : "rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="btn-secondary w-full"
              >
                Log in
              </Link>

              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="btn-primary w-full"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}