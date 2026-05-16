
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  ClipboardList,
  HandCoins,
  HeartHandshake,
  Megaphone,
  ShieldCheck,
  Users,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DbRow = Record<string, unknown>;

type SafeQueryResponse = {
  data: unknown;
  error: unknown;
};

async function safeRows<T>(
  query: PromiseLike<SafeQueryResponse>,
  label: string,
): Promise<{ rows: T[]; warning: string | null }> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Admin referral drilldown query skipped for ${label}:`, result.error);

      return {
        rows: [],
        warning: `${label}: table or columns not available yet`,
      };
    }

    return {
      rows: Array.isArray(result.data) ? (result.data as T[]) : [],
      warning: null,
    };
  } catch (error) {
    console.warn(`Admin referral drilldown query skipped for ${label}:`, error);

    return {
      rows: [],
      warning: `${label}: unable to load`,
    };
  }
}

function asString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(String(value).replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstString(row: DbRow, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = asString(row[key]);

    if (value) return value;
  }

  return fallback;
}

function firstNumber(row: DbRow, keys: string[]) {
  for (const key of keys) {
    const value = asNumber(row[key]);

    if (value) return value;
  }

  return 0;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value: unknown) {
  const raw = asString(value);

  if (!raw) return "—";

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDisplayName(row: DbRow, fallback = "Unknown") {
  const firstName = firstString(row, ["first_name", "firstName"]);
  const lastName = firstString(row, ["last_name", "lastName"]);

  if (firstName || lastName) return `${firstName} ${lastName}`.trim();

  return firstString(
    row,
    [
      "full_name",
      "display_name",
      "name",
      "customer_name",
      "pet_parent_name",
      "guru_name",
      "ambassador_name",
      "partner_name",
      "business_name",
      "email",
    ],
    fallback,
  );
}

function getEmail(row: DbRow) {
  return firstString(row, ["email", "customer_email", "guru_email", "applicant_email"]);
}

function getStatus(row: DbRow) {
  return firstString(
    row,
    [
      "status",
      "reward_status",
      "payout_status",
      "booking_status",
      "application_status",
      "approval_status",
    ],
    "pending",
  );
}

function getDate(row: DbRow) {
  return firstString(row, ["created_at", "updated_at", "booking_date", "submitted_at", "paid_at"]);
}

function isTruthyReferralValue(value: unknown) {
  const normalized = asString(value).toLowerCase();

  if (!normalized) return false;

  return !["none", "null", "undefined", "n/a", "na", "no", "false"].includes(normalized);
}

function hasReferralSignal(row: DbRow) {
  const referralKeys = [
    "referral_code",
    "referral",
    "referred_by",
    "referred_by_user_id",
    "referred_by_customer_id",
    "referrer_id",
    "referrer_user_id",
    "invite_code",
    "source_code",
    "partner_code",
    "ambassador_code",
    "affiliate_code",
    "signup_referral_code",
  ];

  return referralKeys.some((key) => isTruthyReferralValue(row[key]));
}

function getReferralCode(row: DbRow) {
  return firstString(row, [
    "referral_code",
    "signup_referral_code",
    "invite_code",
    "source_code",
    "partner_code",
    "ambassador_code",
    "affiliate_code",
    "code",
  ], "—");
}

function getSource(row: DbRow) {
  return firstString(row, [
    "source",
    "referral_source",
    "partner_source",
    "utm_source",
    "program",
    "program_type",
    "type",
  ], "Referral");
}

function getAmount(row: DbRow) {
  return firstNumber(row, [
    "amount",
    "reward_amount",
    "credit_amount",
    "payout_amount",
    "commission_amount",
    "total",
  ]);
}

function isCustomerProfile(row: DbRow) {
  const role = firstString(row, ["role", "account_type", "user_type"]).toLowerCase();

  return (
    role.includes("customer") ||
    role.includes("pet_parent") ||
    role.includes("pet parent") ||
    Boolean(row["is_customer"])
  );
}

function isGuruProfile(row: DbRow) {
  const role = firstString(row, ["role", "account_type", "user_type"]).toLowerCase();
  const signupSelection = firstString(row, ["signup_selection"]).toLowerCase();

  return role.includes("guru") || signupSelection.includes("guru") || Boolean(row["is_guru"]);
}

function isCompleted(row: DbRow) {
  const status = getStatus(row).toLowerCase();
  const paymentStatus = firstString(row, ["payment_status", "stripe_payment_status"]).toLowerCase();

  return (
    status.includes("complete") ||
    status.includes("completed") ||
    status.includes("paid") ||
    status.includes("credited") ||
    status.includes("issued") ||
    paymentStatus.includes("paid") ||
    paymentStatus.includes("captured") ||
    paymentStatus.includes("succeeded")
  );
}

function isPending(row: DbRow) {
  const status = getStatus(row).toLowerCase();

  return (
    status.includes("pending") ||
    status.includes("review") ||
    status.includes("submitted") ||
    status.includes("qualified") ||
    status.includes("approved")
  );
}

function getProgram(row: DbRow) {
  return firstString(row, ["program", "program_type", "application_type", "type", "source"]);
}

function pageShell({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof Users;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-w-0 space-y-5">
      <section className="overflow-hidden rounded-[32px] border border-green-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/admin/referrals"
              className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-2 text-sm font-black text-green-900 transition hover:bg-green-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Growth & Referrals
            </Link>

            <p className="text-xs font-black uppercase tracking-[0.2em] text-green-800">
              {eyebrow}
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              {title}
            </h1>

            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600 sm:text-base">
              {description}
            </p>
          </div>

          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-3xl bg-green-50 text-green-800 ring-1 ring-green-100">
            <Icon className="h-6 w-6" />
          </span>
        </div>
      </section>

      {children}
    </div>
  );
}

function KpiCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-[28px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
            {label}
          </p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-green-50 text-green-800 ring-1 ring-green-100">
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
        {detail}
      </p>
    </div>
  );
}

function WarningBox({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null;

  return (
    <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5">
      <p className="text-sm font-black text-amber-950">
        Some optional referral tables are not available yet.
      </p>
      <div className="mt-2 grid gap-1 text-sm font-semibold leading-6 text-amber-900 md:grid-cols-2">
        {warnings.map((warning) => (
          <p key={warning}>• {warning}</p>
        ))}
      </div>
    </section>
  );
}

function DataTable({
  rows,
  emptyText,
  columns,
}: {
  rows: DbRow[];
  emptyText: string;
  columns: Array<{
    label: string;
    render: (row: DbRow) => React.ReactNode;
  }>;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#e3ece5] bg-white shadow-sm">
      <div className="border-b border-[#edf3ee] bg-[#fbfcf9] p-5">
        <h2 className="text-xl font-black text-slate-950">Detail Rows</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Showing available Supabase rows for this referral category.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-white">
            <tr className="border-b border-[#edf3ee]">
              {columns.map((column) => (
                <th
                  key={column.label}
                  className="px-5 py-4 text-xs font-black uppercase tracking-[0.1em] text-slate-500"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length ? (
              rows.slice(0, 50).map((row, index) => (
                <tr
                  key={`${firstString(row, ["id", "email", "created_at"], String(index))}-${index}`}
                  className="border-b border-[#f1f5f2] last:border-0"
                >
                  {columns.map((column) => (
                    <td key={column.label} className="px-5 py-4 align-top font-semibold text-slate-700">
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-12 text-center text-sm font-bold text-slate-500"
                >
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const normalized = value.toLowerCase();

  const className =
    normalized.includes("paid") ||
    normalized.includes("complete") ||
    normalized.includes("credited") ||
    normalized.includes("approved")
      ? "border-green-200 bg-green-50 text-green-800"
      : normalized.includes("fail") ||
          normalized.includes("reject") ||
          normalized.includes("cancel") ||
          normalized.includes("refund") ||
          normalized.includes("dispute")
        ? "border-red-200 bg-red-50 text-red-800"
        : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${className}`}>
      {value || "pending"}
    </span>
  );
}

export default async function AdminAmbassadorReferralsPage() {
  const [applicationsResult, bookingsResult, payoutsResult, rewardsResult] = await Promise.all([
    safeRows<DbRow>(supabaseAdmin.from("program_applications").select("*").limit(5000), "program_applications"),
    safeRows<DbRow>(supabaseAdmin.from("bookings").select("*").limit(5000), "bookings"),
    safeRows<DbRow>(supabaseAdmin.from("partner_payouts").select("*").limit(5000), "partner_payouts"),
    safeRows<DbRow>(supabaseAdmin.from("referral_rewards").select("*").limit(5000), "referral_rewards"),
  ]);

  const applications = applicationsResult.rows.filter((row) => getProgram(row).toLowerCase().includes("ambassador"));
  const bookingRows = bookingsResult.rows.filter((row) => Boolean(firstString(row, ["ambassador_id", "ambassador_code"])));
  const payoutRows = payoutsResult.rows.filter((row) => getSource(row).toLowerCase().includes("ambassador") || Boolean(firstString(row, ["ambassador_id", "ambassador_code"])));
  const rewardRows = rewardsResult.rows.filter((row) => getSource(row).toLowerCase().includes("ambassador"));
  const rows = [...applications, ...bookingRows, ...rewardRows, ...payoutRows];

  return pageShell({
    eyebrow: "Admin / Referrals / Ambassadors",
    title: "Ambassador Referrals",
    description:
      "Drill-down view for Ambassador applications, Ambassador-sourced Pet Parent and Guru growth, booking activity, rewards, and program performance.",
    icon: Megaphone,
    children: (
      <>
        <WarningBox warnings={[applicationsResult.warning, bookingsResult.warning, payoutsResult.warning, rewardsResult.warning].filter(Boolean) as string[]} />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Applications" value={formatNumber(applications.length)} detail="Ambassador program application rows." icon={ClipboardList} />
          <KpiCard label="Booking signals" value={formatNumber(bookingRows.length)} detail="Bookings with ambassador source fields." icon={CheckCircle2} />
          <KpiCard label="Pending rewards" value={money([...rewardRows, ...payoutRows].filter(isPending).reduce((sum, row) => sum + getAmount(row), 0))} detail="Pending Ambassador reward or payout liability." icon={BadgeDollarSign} />
          <KpiCard label="Issued rewards" value={money([...rewardRows, ...payoutRows].filter(isCompleted).reduce((sum, row) => sum + getAmount(row), 0))} detail="Paid, credited, issued, or completed Ambassador rewards." icon={HandCoins} />
        </section>

        <DataTable
          rows={rows}
          emptyText="No Ambassador referral rows found yet."
          columns={[
            { label: "Name / Email", render: (row) => <div><p className="font-black text-slate-950">{getDisplayName(row, "Ambassador")}</p><p className="text-xs text-slate-500">{getEmail(row) || "—"}</p></div> },
            { label: "Program / Source", render: (row) => getProgram(row) || getSource(row) },
            { label: "Referral Code", render: (row) => getReferralCode(row) },
            { label: "Status", render: (row) => <StatusPill value={getStatus(row)} /> },
            { label: "Amount", render: (row) => money(getAmount(row)) },
            { label: "Date", render: (row) => formatDate(getDate(row)) },
          ]}
        />
      </>
    ),
  });
}
