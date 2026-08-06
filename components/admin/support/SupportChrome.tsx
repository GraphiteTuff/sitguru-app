import Link from "next/link";

export function StatCard({
  label,
  value,
  detail,
  tone = "emerald",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "emerald" | "sky" | "violet" | "amber" | "rose";
}) {
  const toneClass = {
    emerald: "border-emerald-400/20 bg-emerald-400/10",
    sky: "border-sky-400/20 bg-sky-400/10",
    violet: "border-violet-400/20 bg-violet-400/10",
    amber: "border-amber-400/20 bg-amber-400/10",
    rose: "border-rose-400/20 bg-rose-400/10",
  }[tone];

  return (
    <div className={`rounded-3xl border p-5 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-white">
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  );
}

export function ActionLink({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  if (primary) {
    return (
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:border-emerald-300/30 hover:bg-white/10"
    >
      {label}
    </Link>
  );
}

export function QueueCard({
  title,
  description,
  count,
  href,
}: {
  title: string;
  description: string;
  count: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-300/30 hover:bg-white/10"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
        </div>

        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-white">
          {count}
        </span>
      </div>

      <p className="mt-4 text-sm font-bold text-emerald-300">Open queue →</p>
    </Link>
  );
}

export function SupportAccessBanner({
  email,
  role,
  isSuperUser,
}: {
  email: string;
  role: string;
  isSuperUser: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-amber-400/25 bg-amber-400/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
          Super User access only
        </p>
        <p className="mt-1 text-sm font-semibold text-amber-50/90">
          For live-site safety, manage fields with discretion. Signed in as{" "}
          {email || "admin"} ({role || "admin"}).
        </p>
      </div>

      <span
        className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${
          isSuperUser
            ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-100"
            : "border-white/15 bg-white/10 text-white"
        }`}
      >
        {isSuperUser ? "Super User" : "Platform Admin"}
      </span>
    </div>
  );
}

export function SupportNotice({
  updated,
  action,
  emailStatus,
}: {
  updated: string;
  action: string;
  emailStatus: string;
}) {
  if (updated !== "1") {
    return null;
  }

  const actionLabel =
    action === "created"
      ? "Support case created"
      : action === "converted"
        ? "Support case converted to a dispute"
        : action === "convert_failed"
          ? "Support case could not be converted"
          : action === "assigned"
            ? "Support case assigned"
            : "Support case updated";

  const emailLabel =
    emailStatus === "sent"
      ? " and email sent to the sender."
      : emailStatus === "failed"
        ? ", but the email failed. Check the VS Code terminal or Resend logs."
        : ". No email was requested.";

  const message = `${actionLabel}${emailLabel}`;

  const classes =
    emailStatus === "sent"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
      : emailStatus === "failed" || action === "convert_failed"
        ? "border-rose-400/30 bg-rose-400/10 text-rose-100"
        : "border-sky-400/30 bg-sky-400/10 text-sky-100";

  return (
    <div className={`rounded-3xl border px-5 py-4 text-sm font-bold ${classes}`}>
      {message}
    </div>
  );
}

export function SupportAccessDenied() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-6 rounded-[32px] border border-rose-400/20 bg-slate-950/80 p-10 text-center shadow-[0_12px_60px_rgba(0,0,0,0.28)]">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-rose-400/30 bg-rose-400/10 text-2xl font-black text-rose-200">
        403
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight text-white">
          Support Management Locked
        </h1>
        <p className="text-sm font-semibold leading-6 text-slate-400">
          This SitGuru Support queue is restricted to Super Users and Admin
          Staff. Your session is missing admin privileges.
        </p>
      </div>
      <Link
        href="/admin"
        className="rounded-2xl bg-emerald-500 px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
      >
        Return to Admin Home
      </Link>
    </div>
  );
}
