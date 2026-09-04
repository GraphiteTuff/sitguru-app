import Link from "next/link";
import type { LucideIcon } from "lucide-react";
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
    <div className="mx-auto max-w-6xl space-y-5 pb-4">
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
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5 ${className}`}
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

export function AdminWorkplaceDenied({
  title = "Admin access required.",
  detail,
}: {
  title?: string;
  detail?: string;
}) {
  return (
    <div className="min-h-screen bg-[#f7fbf8] px-6 py-10 text-slate-950">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-100 bg-white p-8 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-700">
          Access Restricted
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          {title}
        </h1>
        {detail ? (
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export type AdminWorkplaceAction = {
  href: string;
  label: string;
  detail: string;
  icon: LucideIcon;
  primary?: boolean;
  external?: boolean;
};

export function AdminWorkplaceActions({
  actions,
}: {
  actions: AdminWorkplaceAction[];
}) {
  return (
    <section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {actions.map((action) => {
        const Icon = action.icon;
        const className = action.primary
          ? "flex min-h-24 min-w-0 items-center gap-4 rounded-[1.6rem] px-5 py-4 text-white shadow-sm"
          : "flex min-h-24 min-w-0 items-center gap-4 rounded-[1.6rem] border border-emerald-100 bg-white px-5 py-4 shadow-sm";
        const body = (
          <>
            <span
              className={
                action.primary
                  ? "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15"
                  : "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#0D5C3A]"
              }
            >
              <Icon size={26} />
            </span>
            <span className="min-w-0">
              <span
                className={`block text-lg font-black ${
                  action.primary ? "!text-white" : "text-slate-950"
                }`}
              >
                {action.label}
              </span>
              <span
                className={`mt-1 block text-sm font-semibold ${
                  action.primary ? "!text-white/85" : "text-slate-500"
                }`}
              >
                {action.detail}
              </span>
            </span>
          </>
        );

        if (action.external) {
          return (
            <a
              key={`${action.href}-${action.label}`}
              href={action.href}
              target="_blank"
              rel="noreferrer"
              className={className}
              style={action.primary ? { background: "#0D5C3A" } : undefined}
            >
              {body}
            </a>
          );
        }

        return (
          <Link
            key={`${action.href}-${action.label}`}
            href={action.href}
            className={className}
            style={action.primary ? { background: "#0D5C3A" } : undefined}
          >
            {body}
          </Link>
        );
      })}
    </section>
  );
}

export function AdminWorkplaceHealth({
  sources,
  helper,
  links,
}: {
  sources: { id: string; label: string; ok: boolean; rowCount: number }[];
  helper?: string;
  links?: ReactNode;
}) {
  const healthy = sources.filter((source) => source.ok).length;

  return (
    <GrowthCard className="min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-black text-slate-950">Source health</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {helper || `${healthy} of ${sources.length} live`}
          </p>
        </div>
        {links ? <div className="flex flex-wrap gap-2">{links}</div> : null}
      </div>
      <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {sources.map((source) => (
          <div
            key={source.id}
            className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-black text-slate-950">
                {source.label}
              </p>
              <StatusPill value={source.ok ? "Connected" : "Pending"} />
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {new Intl.NumberFormat("en-US").format(source.rowCount)} rows
            </p>
          </div>
        ))}
      </div>
    </GrowthCard>
  );
}

export function StatusPill({ value }: { value: string }) {
  const tone = value.toLowerCase();
  const classes =
    tone.includes("ready") ||
    tone.includes("active") ||
    tone.includes("posted") ||
    tone.includes("connected")
      ? "bg-emerald-50 text-emerald-800"
      : tone.includes("review") || tone.includes("pending")
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
