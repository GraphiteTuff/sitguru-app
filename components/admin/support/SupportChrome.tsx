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
    emerald: "border-emerald-100 bg-emerald-50",
    sky: "border-sky-100 bg-sky-50",
    violet: "border-violet-100 bg-violet-50",
    amber: "border-amber-100 bg-amber-50",
    rose: "border-rose-100 bg-rose-50",
  }[tone];

  const valueClass = {
    emerald: "text-emerald-950",
    sky: "text-sky-950",
    violet: "text-violet-950",
    amber: "text-amber-950",
    rose: "text-rose-950",
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-black tracking-tight ${valueClass}`}>
        {value}
      </p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
        {detail}
      </p>
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
        className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-700 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
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
      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/60"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            {description}
          </p>
        </div>

        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
          {count}
        </span>
      </div>

      <p className="mt-3 text-sm font-black text-emerald-700">Open queue →</p>
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
    <div className="flex flex-col gap-3 rounded-[24px] border border-amber-100 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
          Super User access only
        </p>
        <p className="mt-1 text-sm font-semibold text-amber-950/80">
          For live-site safety, manage fields with discretion. Signed in as{" "}
          {email || "admin"} ({role || "admin"}).
        </p>
      </div>

      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
          isSuperUser
            ? "bg-emerald-100 text-emerald-800"
            : "bg-white text-slate-700 ring-1 ring-slate-200"
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
        ? ", but the email failed. Check Resend logs."
        : ". No email was requested.";

  const message = `${actionLabel}${emailLabel}`;

  const classes =
    emailStatus === "sent"
      ? "border-emerald-100 bg-emerald-50 text-emerald-900"
      : emailStatus === "failed" || action === "convert_failed"
        ? "border-rose-100 bg-rose-50 text-rose-800"
        : "border-sky-100 bg-sky-50 text-sky-900";

  return (
    <div className={`rounded-[24px] border px-5 py-4 text-sm font-bold ${classes}`}>
      {message}
    </div>
  );
}

export function SupportAccessDenied() {
  return (
    <main className="min-h-screen bg-[#f8fbf6] px-4 py-10">
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-6 rounded-[30px] border border-rose-100 bg-white p-10 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-2xl font-black text-rose-700">
          403
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-slate-950">
            Support Management Locked
          </h1>
          <p className="text-sm font-semibold leading-6 text-slate-500">
            This SitGuru Support queue is restricted to Super Users and Admin
            Staff. Your session is missing admin privileges.
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-2xl bg-emerald-700 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-800"
        >
          Return to Admin Home
        </Link>
      </div>
    </main>
  );
}
