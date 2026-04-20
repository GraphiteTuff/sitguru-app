"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import SiteLogo from "@/components/SiteLogo";

const links = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Find Care" },
  { href: "/become-a-guru", label: "Become a Guru" },
  { href: "/bookings", label: "Bookings" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isDarkPage =
    pathname.startsWith("/admin") || pathname.startsWith("/guru");

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-md ${
        isDarkPage
          ? "border-slate-800 bg-slate-900 shadow-lg"
          : "border-slate-200 bg-white/95"
      }`}
    >
      <div className="page-container flex h-16 items-center justify-between gap-4">
        <SiteLogo
          priority
          wrapperClassName="h-14 w-[250px] sm:w-[270px] lg:w-[290px]"
        />

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
                      : "text-white/90 hover:bg-white/10 hover:text-white"
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
            className="inline-flex h-11 items-center justify-center rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Get Started
          </Link>
        </div>

        <button
          onClick={() => setOpen((prev) => !prev)}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${
            isDarkPage
              ? "bg-white/10 text-white"
              : "border-slate-300 bg-white text-slate-900"
          } lg:hidden`}
          aria-label="Toggle menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <div
          className={`border-t px-4 py-4 lg:hidden ${
            isDarkPage
              ? "border-slate-800 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="page-container flex flex-col gap-2">
            {links.map((link) => {
              const active = isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                    isDarkPage
                      ? active
                        ? "bg-white/15 text-white"
                        : "text-white/90 hover:bg-white/10 hover:text-white"
                      : active
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="mt-2 grid gap-2 border-t border-white/10 pt-3">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                  isDarkPage
                    ? "text-white/90 hover:bg-white/10 hover:text-white"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                Customer Login
              </Link>

              <Link
                href="/guru/login"
                onClick={() => setOpen(false)}
                className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                  isDarkPage
                    ? "text-white/90 hover:bg-white/10 hover:text-white"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                Guru Login
              </Link>

              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="mt-1 inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}