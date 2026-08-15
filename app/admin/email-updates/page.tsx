import Link from "next/link";
import { ArrowLeft, Download, Mail } from "lucide-react";
import { getAdminIdentity } from "@/lib/admin/access";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type EmailUpdateSubscriber = {
  id: string;
  email: string;
  full_name: string | null;
  status: "subscribed" | "unsubscribed";
  source: string;
  user_id: string | null;
  subscribed_at: string;
  unsubscribed_at: string | null;
  created_at: string;
};

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminEmailUpdatesPage({
  searchParams,
}: {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessAdmin) {
    return (
      <div className="min-h-screen bg-[#f7fbf8] px-6 py-10 text-slate-950">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-100 bg-white p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-700">
            Access Restricted
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
            Admin access required.
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Sign in with an authorized SitGuru admin or marketing account to open
            Email Updates.
          </p>
        </div>
      </div>
    );
  }

  const resolved = searchParams ? await searchParams : {};
  const statusFilter =
    typeof resolved.status === "string" ? resolved.status : "subscribed";
  const search =
    typeof resolved.q === "string" ? resolved.q.trim().toLowerCase() : "";

  let query = supabaseAdmin
    .from("email_update_subscribers")
    .select(
      "id, email, full_name, status, source, user_id, subscribed_at, unsubscribed_at, created_at",
    )
    .order("subscribed_at", { ascending: false })
    .limit(500);

  if (statusFilter === "subscribed" || statusFilter === "unsubscribed") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;

  const [{ count: totalSubscribed }, { count: totalUnsubscribed }] =
    await Promise.all([
      supabaseAdmin
        .from("email_update_subscribers")
        .select("id", { count: "exact", head: true })
        .eq("status", "subscribed"),
      supabaseAdmin
        .from("email_update_subscribers")
        .select("id", { count: "exact", head: true })
        .eq("status", "unsubscribed"),
    ]);

  const rows = ((data || []) as EmailUpdateSubscriber[]).filter((row) => {
    if (!search) return true;
    return (
      row.email.toLowerCase().includes(search) ||
      String(row.full_name || "")
        .toLowerCase()
        .includes(search) ||
      String(row.source || "")
        .toLowerCase()
        .includes(search)
    );
  });

  const subscribedCount =
    typeof totalSubscribed === "number"
      ? totalSubscribed
      : rows.filter((row) => row.status === "subscribed").length;
  const unsubscribedCount =
    typeof totalUnsubscribed === "number"
      ? totalUnsubscribed
      : rows.filter((row) => row.status === "unsubscribed").length;

  const csv = [
    ["email", "full_name", "status", "source", "subscribed_at", "unsubscribed_at"].join(
      ",",
    ),
    ...rows.map((row) =>
      [
        row.email,
        row.full_name || "",
        row.status,
        row.source,
        row.subscribed_at,
        row.unsubscribed_at || "",
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    ),
  ].join("\n");

  return (
    <div className="min-h-screen bg-[#f7fbf8] px-4 py-8 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/admin/sales-marketing"
              className="inline-flex items-center gap-2 text-sm font-black text-emerald-800 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Sales & Marketing
            </Link>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
              Email Updates
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              Subscribers who opted in for SitGuru news, offers, and
              announcements from the site footer and related forms.
            </p>
          </div>

          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
            download={`sitguru-email-updates-${statusFilter}.csv`}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#0D5C3A] px-4 py-2.5 text-sm font-black !text-white transition hover:bg-[#0a4a2e]"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        </div>

        {error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
            Could not load subscribers yet. Apply the{" "}
            <code className="rounded bg-white px-1.5 py-0.5">
              20260812_email_update_subscribers
            </code>{" "}
            migration in Supabase, then refresh. ({error.message})
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
              Showing
            </p>
            <p className="mt-2 text-3xl font-black">{number(rows.length)}</p>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
              Subscribed total
            </p>
            <p className="mt-2 text-3xl font-black">{number(subscribedCount)}</p>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
              Unsubscribed total
            </p>
            <p className="mt-2 text-3xl font-black">{number(unsubscribedCount)}</p>
          </div>
        </div>

        <form className="flex flex-wrap gap-3 rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
          <input
            name="q"
            defaultValue={search}
            placeholder="Search email, name, or source"
            className="min-h-11 min-w-[220px] flex-1 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />
          <select
            name="status"
            defaultValue={statusFilter}
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-emerald-400"
          >
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="all">All statuses</option>
          </select>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-700 px-5 text-sm font-black text-white"
          >
            Filter
          </button>
        </form>

        <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-emerald-50 text-xs font-black uppercase tracking-[0.12em] text-emerald-800">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Subscribed</th>
                  <th className="px-4 py-3">Account</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm font-semibold text-slate-500"
                    >
                      <Mail className="mx-auto mb-2 h-6 w-6 text-emerald-700" />
                      No email update subscribers match this filter yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-slate-100 align-top"
                    >
                      <td className="px-4 py-3 font-bold text-slate-950">
                        {row.email}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-600">
                        {row.full_name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${
                            row.status === "subscribed"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-600">
                        {row.source}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-600">
                        {formatDate(row.subscribed_at)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-600">
                        {row.user_id ? (
                          <Link
                            href={`/admin/customers/${row.user_id}`}
                            className="text-emerald-800 hover:underline"
                          >
                            View profile
                          </Link>
                        ) : (
                          "Guest"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
