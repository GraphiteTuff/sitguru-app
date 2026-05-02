import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type GuruBackgroundCheckRow = {
  id: string;
  name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  background_check_status: string | null;
  background_check_completed_at: string | null;
  checkr_candidate_id: string | null;
  checkr_report_id: string | null;
  checkr_invitation_id: string | null;
  checkr_invitation_url: string | null;
  checkr_package_slug: string | null;
  checkr_last_webhook_at: string | null;
  created_at: string | null;
};

type GuruBackgroundCheckDetail = {
  guru_id: string;
  status: string;
  checkr_candidate_id: string | null;
  checkr_invitation_id: string | null;
  checkr_report_id: string | null;
  package_slug: string | null;
  invitation_url: string | null;
  started_at: string | null;
  completed_at: string | null;
  last_webhook_at: string | null;
};

const STATUS_OPTIONS = [
  "not_started",
  "invited",
  "pending",
  "clear",
  "consider",
  "suspended",
  "canceled",
  "failed",
];

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getSiteUrl() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";

  if (siteUrl.startsWith("http://") || siteUrl.startsWith("https://")) {
    return siteUrl;
  }

  return `https://${siteUrl}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function getDisplayName(guru: GuruBackgroundCheckRow) {
  return guru.name || guru.full_name || guru.email || "Unnamed Guru";
}

function getStatusClass(status?: string | null) {
  switch (status) {
    case "clear":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200 ring-emerald-400/20";
    case "consider":
      return "border-amber-400/20 bg-amber-400/10 text-amber-200 ring-amber-400/20";
    case "pending":
    case "invited":
      return "border-sky-400/20 bg-sky-400/10 text-sky-200 ring-sky-400/20";
    case "suspended":
    case "failed":
    case "canceled":
      return "border-rose-400/20 bg-rose-400/10 text-rose-200 ring-rose-400/20";
    default:
      return "border-white/10 bg-white/5 text-slate-300 ring-white/10";
  }
}

function getStatusLabel(status?: string | null) {
  return (status || "not_started").replaceAll("_", " ");
}

async function updateGuruBackgroundStatus(formData: FormData) {
  "use server";

  const guruId = String(formData.get("guruId") || "");
  const status = String(formData.get("status") || "");

  if (!guruId || !STATUS_OPTIONS.includes(status)) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const completedAt =
    status === "clear" ||
    status === "consider" ||
    status === "failed" ||
    status === "canceled"
      ? now
      : null;

  await supabase
    .from("gurus")
    .update({
      background_check_status: status,
      background_check_completed_at: completedAt,
      checkr_last_webhook_at: now,
    })
    .eq("id", guruId);

  await supabase.from("guru_background_checks").upsert(
    {
      guru_id: guruId,
      status,
      completed_at: completedAt,
      last_webhook_at: now,
    },
    {
      onConflict: "guru_id",
    },
  );

  revalidatePath("/admin/background-checks");
  revalidatePath("/admin/guru-approvals");
  revalidatePath("/admin/gurus");
}

async function startCheckrInvite(formData: FormData) {
  "use server";

  const guruId = String(formData.get("guruId") || "");

  if (!guruId) {
    return;
  }

  await fetch(`${getSiteUrl()}/api/checkr/create-invitation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ guruId }),
    cache: "no-store",
  });

  revalidatePath("/admin/background-checks");
  revalidatePath("/admin/guru-approvals");
  revalidatePath("/admin/gurus");
}

export default async function AdminBackgroundChecksPage() {
  const supabase = getSupabaseAdminClient();

  const { data: gurus, error: gurusError } = await supabase
    .from("gurus")
    .select(
      [
        "id",
        "name",
        "full_name",
        "email",
        "phone",
        "city",
        "state",
        "background_check_status",
        "background_check_completed_at",
        "checkr_candidate_id",
        "checkr_report_id",
        "checkr_invitation_id",
        "checkr_invitation_url",
        "checkr_package_slug",
        "checkr_last_webhook_at",
        "created_at",
      ].join(","),
    )
    .order("created_at", { ascending: false });

  const { data: backgroundChecks } = await supabase
    .from("guru_background_checks")
    .select(
      [
        "guru_id",
        "status",
        "checkr_candidate_id",
        "checkr_invitation_id",
        "checkr_report_id",
        "package_slug",
        "invitation_url",
        "started_at",
        "completed_at",
        "last_webhook_at",
      ].join(","),
    );

  const backgroundCheckByGuruId = new Map<string, GuruBackgroundCheckDetail>();

  const safeBackgroundChecks = Array.isArray(backgroundChecks)
    ? (backgroundChecks as unknown as GuruBackgroundCheckDetail[])
    : [];

  safeBackgroundChecks.forEach((check) => {
    if (check?.guru_id) {
      backgroundCheckByGuruId.set(check.guru_id, check);
    }
  });

  const rows = Array.isArray(gurus)
    ? (gurus as unknown as GuruBackgroundCheckRow[])
    : [];

  const total = rows.length;

  const clearCount = rows.filter(
    (guru) =>
      guru.background_check_status === "clear" ||
      backgroundCheckByGuruId.get(guru.id)?.status === "clear",
  ).length;

  const reviewCount = rows.filter((guru) => {
    const status =
      guru.background_check_status || backgroundCheckByGuruId.get(guru.id)?.status;

    return (
      status === "consider" ||
      status === "suspended" ||
      status === "failed" ||
      status === "canceled"
    );
  }).length;

  const pendingCount = rows.filter((guru) => {
    const status =
      guru.background_check_status || backgroundCheckByGuruId.get(guru.id)?.status;

    return status === "invited" || status === "pending";
  }).length;

  if (gurusError) {
    return (
      <main className="p-4 text-white sm:p-6 lg:p-8">
        <div className="rounded-[2rem] border border-rose-400/20 bg-rose-400/10 p-6 text-rose-100">
          <h1 className="text-xl font-black">Background Checks</h1>
          <p className="mt-2 text-sm leading-6">
            Could not load Guru background checks: {gurusError.message}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-4 text-white sm:p-6 lg:p-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_26%),linear-gradient(180deg,#0f172a_0%,#020617_100%)] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
              Admin Portal
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Guru Background Checks
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Review Checkr progress, resend invitations, open invite links, and
              control whether Gurus are approved to receive bookings.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/guru-approvals"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:border-emerald-300/40 hover:bg-emerald-400/10 hover:text-emerald-200"
            >
              Review Gurus
            </Link>

            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
            >
              Open Admin
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Total Gurus
            </p>
            <p className="mt-3 text-3xl font-black text-white">{total}</p>
            <p className="mt-2 text-sm text-slate-400">
              Guru records available for background check tracking.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">
              Clear
            </p>
            <p className="mt-3 text-3xl font-black text-emerald-100">
              {clearCount}
            </p>
            <p className="mt-2 text-sm text-emerald-50/80">
              Gurus cleared to move toward bookable status.
            </p>
          </div>

          <div className="rounded-3xl border border-sky-400/20 bg-sky-400/10 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-200">
              Pending / Invited
            </p>
            <p className="mt-3 text-3xl font-black text-sky-100">
              {pendingCount}
            </p>
            <p className="mt-2 text-sm text-sky-50/80">
              Invites sent or Checkr reports currently processing.
            </p>
          </div>

          <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200">
              Needs Review
            </p>
            <p className="mt-3 text-3xl font-black text-amber-100">
              {reviewCount}
            </p>
            <p className="mt-2 text-sm text-amber-50/80">
              Checkr results requiring admin attention.
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/70 shadow-[0_14px_50px_rgba(0,0,0,0.26)]">
        <div className="border-b border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Checkr Control
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                Background Check Control
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
                Checkr status is updated automatically by webhooks. Manual
                status changes are available for admin review, testing, and
                launch support.
              </p>
            </div>

            <Link
              href="/admin/guru-approvals"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Back to Approvals
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left">
            <thead className="bg-slate-950/50">
              <tr>
                <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Guru
                </th>
                <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Status
                </th>
                <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Checkr Details
                </th>
                <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Last Update
                </th>
                <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Admin Controls
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10 bg-slate-950/30">
              {rows.map((guru) => {
                const detail = backgroundCheckByGuruId.get(guru.id);
                const status =
                  guru.background_check_status ||
                  detail?.status ||
                  "not_started";

                const invitationUrl =
                  guru.checkr_invitation_url || detail?.invitation_url;

                const candidateId =
                  guru.checkr_candidate_id || detail?.checkr_candidate_id;

                const reportId = guru.checkr_report_id || detail?.checkr_report_id;

                const invitationId =
                  guru.checkr_invitation_id || detail?.checkr_invitation_id;

                const packageSlug =
                  guru.checkr_package_slug || detail?.package_slug;

                const lastWebhook =
                  guru.checkr_last_webhook_at || detail?.last_webhook_at;

                return (
                  <tr key={guru.id} className="align-top transition hover:bg-white/5">
                    <td className="px-5 py-5">
                      <div className="min-w-60">
                        <Link
                          href={`/admin/gurus/${encodeURIComponent(guru.id)}`}
                          className="font-black text-white transition hover:text-emerald-300"
                        >
                          {getDisplayName(guru)}
                        </Link>

                        <p className="mt-1 text-sm text-slate-400">
                          {guru.email || "No email"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {[guru.city, guru.state].filter(Boolean).join(", ") ||
                            "No location"}
                        </p>

                        <p className="mt-2 max-w-72 break-all text-xs text-slate-600">
                          Guru ID: {guru.id}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-5">
                      <span
                        className={[
                          "inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ring-1",
                          getStatusClass(status),
                        ].join(" ")}
                      >
                        {getStatusLabel(status)}
                      </span>

                      {guru.background_check_completed_at ? (
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          Completed:{" "}
                          <span className="text-slate-300">
                            {formatDate(guru.background_check_completed_at)}
                          </span>
                        </p>
                      ) : null}
                    </td>

                    <td className="px-5 py-5">
                      <div className="min-w-80 space-y-2 text-xs text-slate-500">
                        <p>
                          <span className="font-bold text-slate-300">
                            Candidate:
                          </span>{" "}
                          <span className="break-all text-slate-400">
                            {candidateId || "—"}
                          </span>
                        </p>

                        <p>
                          <span className="font-bold text-slate-300">
                            Invitation:
                          </span>{" "}
                          <span className="break-all text-slate-400">
                            {invitationId || "—"}
                          </span>
                        </p>

                        <p>
                          <span className="font-bold text-slate-300">Report:</span>{" "}
                          <span className="break-all text-slate-400">
                            {reportId || "—"}
                          </span>
                        </p>

                        <p>
                          <span className="font-bold text-slate-300">
                            Package:
                          </span>{" "}
                          <span className="break-all text-slate-400">
                            {packageSlug || "—"}
                          </span>
                        </p>

                        {invitationUrl ? (
                          <a
                            href={invitationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-200 transition hover:border-emerald-300/40 hover:bg-emerald-400/15"
                          >
                            Open Checkr Invite
                          </a>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-5 py-5">
                      <p className="text-sm font-semibold text-slate-300">
                        {formatDate(lastWebhook)}
                      </p>

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Started:{" "}
                        <span className="text-slate-400">
                          {formatDate(detail?.started_at)}
                        </span>
                      </p>
                    </td>

                    <td className="px-5 py-5">
                      <div className="flex min-w-72 flex-col gap-3">
                        <form action={startCheckrInvite}>
                          <input type="hidden" name="guruId" value={guru.id} />

                          <button
                            type="submit"
                            className="w-full rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-slate-950 shadow-sm transition hover:bg-emerald-400"
                          >
                            {status === "not_started"
                              ? "Start Checkr Invite"
                              : "Resend / Restart Invite"}
                          </button>
                        </form>

                        <form
                          action={updateGuruBackgroundStatus}
                          className="flex gap-2"
                        >
                          <input type="hidden" name="guruId" value={guru.id} />

                          <select
                            name="status"
                            defaultValue={status}
                            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option.replaceAll("_", " ")}
                              </option>
                            ))}
                          </select>

                          <button
                            type="submit"
                            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-white/10"
                          >
                            Save
                          </button>
                        </form>

                        <Link
                          href={`/admin/gurus/${encodeURIComponent(guru.id)}`}
                          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
                        >
                          Review Guru
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-sm font-semibold text-slate-400"
                  >
                    No Gurus found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}