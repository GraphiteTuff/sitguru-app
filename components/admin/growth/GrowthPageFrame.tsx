import Link from "next/link";
import type { ReactNode } from "react";

export function GrowthPageFrame({
  kicker = "Growth Portal",
  title,
  detail,
  children,
  action,
}: {
  kicker?: string;
  title: string;
  detail?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-4">
      <section
        className="public-dark-section overflow-hidden rounded-[1.75rem] border border-emerald-100 p-5 shadow-sm sm:p-7"
        data-brand-green
        style={{ background: "#0D5C3A" }}
      >
        <p className="text-xs font-black uppercase tracking-[0.24em] !text-white">
          {kicker}
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black leading-tight tracking-tight !text-white sm:text-4xl">
              {title}
            </h1>
            {detail ? (
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 !text-white/90">
                {detail}
              </p>
            ) : null}
          </div>
          {action}
        </div>
      </section>
      {children}
    </div>
  );
}

export function GrowthCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5 ${className}`}
    >
      {children}
    </section>
  );
}

export function GrowthPrimaryLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-2xl px-4 text-sm font-black !text-white"
      style={{ background: "#0D5C3A" }}
    >
      {children}
    </Link>
  );
}

export function StatusPill({ value }: { value: string }) {
  const tone = value.toLowerCase();
  const classes =
    tone.includes("ready") || tone.includes("active") || tone.includes("posted")
      ? "bg-emerald-50 text-emerald-800"
      : tone.includes("review")
        ? "bg-amber-50 text-amber-800"
        : tone.includes("pause") || tone.includes("draft")
          ? "bg-slate-100 text-slate-700"
          : "bg-sky-50 text-sky-800";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${classes}`}
    >
      {value}
    </span>
  );
}
