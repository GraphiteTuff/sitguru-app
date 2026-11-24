import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, PawPrint } from "lucide-react";

/**
 * Shared SitGuru visual language for Guru workspace pages.
 * Green panels always use light text; forms and data cards remain light.
 */
export default function GuruPageHero({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: { href: string; label: string };
  children?: ReactNode;
}) {
  return (
    <section
      data-brand-green="true"
      className="relative overflow-hidden rounded-[1.75rem] border border-emerald-800/15 bg-[linear-gradient(125deg,#06462F_0%,#08734A_62%,#0C8756_100%)] p-5 shadow-[0_16px_42px_rgba(8,90,57,0.14)] sm:rounded-[2rem] sm:p-7 lg:p-8"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-lime-300/15 blur-3xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <Link
            href="/guru/dashboard"
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold !text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-4 focus-visible:outline-white/70"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Guru Home
          </Link>
          <p className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] !text-[#F7E7B0]">
            <PawPrint className="h-4 w-4" aria-hidden="true" />
            {eyebrow}
          </p>
          <h1 className="mt-2 max-w-4xl text-[clamp(1.9rem,4vw,3.25rem)] font-black leading-tight tracking-tight !text-white">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 !text-[#EAF7EF] sm:text-base">
            {description}
          </p>
          {children ? <div className="mt-4">{children}</div> : null}
        </div>
        {action ? (
          <Link
            href={action.href}
            className="inline-flex min-h-[56px] shrink-0 items-center justify-center rounded-2xl bg-white px-5 py-3 text-center text-sm font-black !text-[#06462F] shadow-md transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300"
          >
            {action.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
