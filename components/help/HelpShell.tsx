// components/help/HelpShell.tsx
import Link from "next/link";
import type { ReactNode } from "react";
import HelpSearchBar from "@/components/help/HelpSearchBar";

type HelpShellProps = {
  children: ReactNode;
  /** Show compact header search (article pages) */
  showHeaderSearch?: boolean;
};

export default function HelpShell({
  children,
  showHeaderSearch = true,
}: HelpShellProps) {
  return (
    <div
      className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_45%,#ecfdf5_100%)] text-slate-950"
      style={{ fontFamily: "var(--font-sans), var(--sitguru-font-sans)" }}
    >
      <header className="sticky top-0 z-40 border-b border-emerald-100/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/help"
              className="text-sm font-black tracking-[-0.02em] text-emerald-800"
            >
              SitGuru Help
            </Link>
            <span className="hidden text-slate-300 sm:inline" aria-hidden="true">
              /
            </span>
            <Link
              href="/"
              className="hidden text-xs font-bold text-slate-500 hover:text-slate-800 sm:inline"
            >
              Home
            </Link>
          </div>

          {showHeaderSearch ? (
            <div className="w-full sm:max-w-md sm:flex-1">
              <HelpSearchBar variant="header" placeholder="Search help…" />
            </div>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>

      <footer className="border-t border-emerald-100 bg-white/70">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs font-semibold text-slate-500 sm:px-6">
          <p>SitGuru Knowledge Base · PawReport Live</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/help" className="hover:text-emerald-800">
              Help home
            </Link>
            <Link href="/help/billing" className="hover:text-emerald-800">
              Billing
            </Link>
            <Link href="/contact" className="hover:text-emerald-800">
              Contact
            </Link>
            <a
              href="mailto:support@sitguru.com"
              className="hover:text-emerald-800"
            >
              Email support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
