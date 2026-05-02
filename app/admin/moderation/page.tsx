import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

type SupportRow = Record<string, unknown>;
type DisputeRow = Record<string, unknown>;
type BookingRow = Record<string, unknown>;

type ModerationItem = {
  id: string;
  source: "support" | "dispute" | "booking";
  title: string;
  subtitle: string;
  person: string;
  status: string;
  priority: string;
  createdAt: string;
  href: string;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getPriorityTone(priority: string) {
  const normalized = priority.toLowerCase();

  if (normalized === "urgent") {
    return "border-rose-400/30 bg-rose-400/10 text-rose-100";
  }

  if (normalized === "high") {
    return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  }

  return "border-sky-400/30 bg-sky-400/10 text-sky-100";
}

function getStatusTone(status: string) {
  const normalized = status.toLowerCase();

  if (["resolved", "closed", "approved", "complete", "completed"].includes(normalized)) {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  }

  if (["review", "investigating", "pending", "pending_response"].some((item) =>
    normalized.includes(item)
  )) {
    return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  }

  return "border-sky-400/30 bg-sky-400/10 text-sky-100";
}

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string
): Promise<T[]> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Moderation query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Moderation query skipped for ${label}:`, error);
    return [];
  }
}

function supportToModeration(row: SupportRow): ModerationItem {
  const id = asString(row.id);
  const caseNumber = asString(row.case_number) || asString(row.support_number) || "Support case";
  const subject = asString(row.subject) || "Support intake needs review";
  const body = asString(row.message_body) || asString(row.body) || "";
  const senderName = asString(row.sender_name) || "Sender";
  const senderEmail = asString(row.sender_email) || asString(row.email);
  const priority = asString(row.priority) || "normal";
  const status = asString(row.status) || "new";

  return {
    id,
    source: "support",
    title: `${caseNumber}: ${subject}`,
    subtitle: body || "Support message is awaiting admin review.",
    person: senderEmail ? `${senderName} · ${senderEmail}` : senderName,
    status,
    priority,
    createdAt: asString(row.created_at),
    href: "/admin/support",
  };
}

function disputeToModeration(row: DisputeRow): ModerationItem {
  const id = asString(row.id);
  const disputeNumber = asString(row.dispute_number) || "Dispute case";
  const issueSummary = asString(row.issue_summary) || "Dispute case needs admin review.";
  const customerName = asString(row.customer_name) || "Customer";
  const customerEmail = asString(row.customer_email) || asString(row.sender_email);
  const priority = asString(row.priority) || "normal";
  const status = asString(row.status) || "open";
  const refundAmount = asNumber(row.refund_amount);
  const financialImpact = asNumber(row.financial_impact);
  const impact = Math.max(refundAmount, financialImpact);

  return {
    id,
    source: "dispute",
    title: `${disputeNumber}: ${asString(row.issue_type) || "Dispute"}`,
    subtitle:
      impact > 0
        ? `${issueSummary} Financial impact: $${impact.toFixed(2)}.`
        : issueSummary,
    person: customerEmail ? `${customerName} · ${customerEmail}` : customerName,
    status,
    priority,
    createdAt: asString(row.created_at),
    href: "/admin/disputes",
  };
}

function bookingToModeration(row: BookingRow): ModerationItem {
  const id = asString(row.id);
  const status = asString(row.status) || "booking";
  const customerName = asString(row.customer_name) || "Customer";
  const guruName = asString(row.guru_name) || "Guru";
  const total = asNumber(row.total_amount) || asNumber(row.amount);

  return {
    id,
    source: "booking",
    title: `Booking review${id ? `: ${id.slice(0, 8)}` : ""}`,
    subtitle:
      total > 0
        ? `Booking between ${customerName} and ${guruName}. Payment value: $${total.toFixed(
            2
          )}.`
        : `Booking between ${customerName} and ${guruName}.`,
    person: `${customerName} → ${guruName}`,
    status,
    priority: "normal",
    createdAt: asString(row.created_at),
    href: "/admin/bookings",
  };
}

async function getModerationData() {
  const supportRows = await safeRows<SupportRow>(
    supabaseAdmin
      .from("support_intake_cases")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    "support_intake_cases"
  );

  const disputeRows = await safeRows<DisputeRow>(
    supabaseAdmin
      .from("dispute_cases")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    "dispute_cases"
  );

  const bookingRows = await safeRows<BookingRow>(
    supabaseAdmin
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    "bookings"
  );

  const supportItems = supportRows
    .filter((row) => {
      const status = asString(row.status).toLowerCase();
      return !["closed", "resolved", "complete", "completed"].includes(status);
    })
    .map(supportToModeration);

  const disputeItems = disputeRows
    .filter((row) => {
      const status = asString(row.status).toLowerCase();
      return !["closed", "resolved"].includes(status);
    })
    .map(disputeToModeration);

  const bookingItems = bookingRows
    .filter((row) => {
      const status = asString(row.status).toLowerCase();
      return [
        "pending",
        "pending_review",
        "under_review",
        "payment_review",
        "flagged",
        "disputed",
      ].includes(status);
    })
    .map(bookingToModeration);

  const queue = [...supportItems, ...disputeItems, ...bookingItems].sort(
    (a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();

      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
    }
  );

  const urgent = queue.filter((item) =>
    ["urgent", "high"].includes(item.priority.toLowerCase())
  );

  const payoutHoldItems = disputeItems.filter((item) =>
    item.subtitle.toLowerCase().includes("financial impact")
  );

  return {
    queue,
    supportItems,
    disputeItems,
    bookingItems,
    urgent,
    payoutHoldItems,
    totals: {
      queue: queue.length,
      support: supportItems.length,
      disputes: disputeItems.length,
      bookings: bookingItems.length,
      urgent: urgent.length,
      payoutHolds: payoutHoldItems.length,
    },
  };
}

function ActionLink({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
          : "inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black text-white transition hover:border-emerald-300/30 hover:bg-white/10"
      }
    >
      {label}
    </Link>
  );
}

function StatCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "emerald" | "rose" | "amber" | "sky" | "violet";
}) {
  const toneClass = {
    emerald: "border-emerald-400/20 bg-emerald-400/10",
    rose: "border-rose-400/20 bg-rose-400/10",
    amber: "border-amber-400/20 bg-amber-400/10",
    sky: "border-sky-400/20 bg-sky-400/10",
    violet: "border-violet-400/20 bg-violet-400/10",
  }[tone];

  return (
    <div className={`rounded-3xl border p-5 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-white">
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{detail}</p>
    </div>
  );
}

function ModerationSourceBadge({ source }: { source: ModerationItem["source"] }) {
  const config = {
    support: "border-sky-400/30 bg-sky-400/10 text-sky-100",
    dispute: "border-rose-400/30 bg-rose-400/10 text-rose-100",
    booking: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  }[source];

  return (
    <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase ${config}`}>
      {source}
    </span>
  );
}

export default async function AdminModerationPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const data = await getModerationData();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(244,63,94,0.12),_transparent_30%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-rose-500/10 p-6 shadow-[0_12px_60px_rgba(0,0,0,0.28)] lg:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                Admin / Moderation
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                SitGuru moderation command center.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Review live support issues, dispute escalations, booking flags,
                refund concerns, and trust-related cases from one operational
                queue.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionLink href="/admin/fraud" label="Fraud Risk" />
              <ActionLink href="/admin/support" label="Support" />
              <ActionLink href="/admin/disputes" label="Disputes" primary />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Open Queue"
              value={data.totals.queue.toLocaleString()}
              detail="Combined moderation items needing review."
              tone="emerald"
            />
            <StatCard
              label="Support"
              value={data.totals.support.toLocaleString()}
              detail="Open support intake cases."
              tone="sky"
            />
            <StatCard
              label="Disputes"
              value={data.totals.disputes.toLocaleString()}
              detail="Open dispute cases requiring action."
              tone="rose"
            />
            <StatCard
              label="Booking Flags"
              value={data.totals.bookings.toLocaleString()}
              detail="Bookings marked pending or under review."
              tone="violet"
            />
            <StatCard
              label="Payout Holds"
              value={data.totals.payoutHolds.toLocaleString()}
              detail="Cases that may affect Guru payouts."
              tone="amber"
            />
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                  Review Queue
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                  Cases needing moderation.
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Support, dispute, and booking records are pulled from
                  Supabase and grouped into one review surface.
                </p>
              </div>

              <ActionLink href="/admin/support" label="Open Support Queue" />
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white/5 text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Source
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Case
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Person
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Status
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Opened
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/10 bg-slate-950/40">
                    {data.queue.length ? (
                      data.queue.slice(0, 60).map((item) => (
                        <tr key={`${item.source}-${item.id}`} className="align-top transition hover:bg-white/5">
                          <td className="px-4 py-4">
                            <ModerationSourceBadge source={item.source} />
                            <div className="mt-2">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black ${getPriorityTone(
                                  item.priority
                                )}`}
                              >
                                {item.priority || "Normal"}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <p className="font-black text-white">{item.title}</p>
                            <p className="mt-1 max-w-md text-sm leading-6 text-slate-400">
                              {item.subtitle}
                            </p>
                          </td>

                          <td className="px-4 py-4 font-semibold text-slate-200">
                            {item.person}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black ${getStatusTone(
                                item.status
                              )}`}
                            >
                              {item.status.replace(/_/g, " ") || "Open"}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-slate-400">
                            {formatDate(item.createdAt)}
                          </td>

                          <td className="px-4 py-4">
                            <Link
                              href={item.href}
                              className="inline-flex rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-400"
                            >
                              Review
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                          No moderation cases found. New support, dispute, or
                          flagged booking records will appear here.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Payout Protection
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                48-hour review window.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Guru payouts are released 48 hours after completed care unless a
                support case, refund request, chargeback, or safety review is
                open. Moderation keeps payout decisions aligned with customer
                trust and Guru fairness.
              </p>

              <div className="mt-5 space-y-3">
                {[
                  "Open refund request → hold payout review.",
                  "Trust or safety concern → escalate before release.",
                  "Resolved case → release, reduce, or cancel payout.",
                  "No issue after 48 hours → payout becomes eligible.",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm font-bold text-slate-300"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-300">
                Quick Actions
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                Jump to review tools.
              </h2>

              <div className="mt-5 grid gap-3">
                <ActionLink href="/admin/support" label="Review Support Intake" />
                <ActionLink href="/admin/disputes" label="Review Disputes" />
                <ActionLink href="/admin/fraud" label="Open Fraud Detection" />
                <ActionLink href="/admin/bookings" label="Review Bookings" />
                <ActionLink href="/admin/payments" label="Review Payments" />
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}
