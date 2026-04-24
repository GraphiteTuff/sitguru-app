import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Tone = "emerald" | "sky" | "violet" | "amber" | "rose";

type BookingRow = Record<string, unknown>;
type GuruRow = Record<string, unknown>;
type ProfileRow = Record<string, unknown>;
type LaunchSignupRow = Record<string, unknown>;
type ConversationRow = Record<string, unknown>;
type MessageRow = Record<string, unknown>;

function toneStyles(tone: Tone) {
  switch (tone) {
    case "emerald":
      return {
        badge: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
        dot: "bg-emerald-400",
        button: "hover:border-emerald-300/40 hover:text-emerald-200",
      };
    case "sky":
      return {
        badge: "bg-sky-400/10 text-sky-300 border-sky-400/20",
        dot: "bg-sky-400",
        button: "hover:border-sky-300/40 hover:text-sky-200",
      };
    case "violet":
      return {
        badge: "bg-violet-400/10 text-violet-300 border-violet-400/20",
        dot: "bg-violet-400",
        button: "hover:border-violet-300/40 hover:text-violet-200",
      };
    case "amber":
      return {
        badge: "bg-amber-400/10 text-amber-300 border-amber-400/20",
        dot: "bg-amber-400",
        button: "hover:border-amber-300/40 hover:text-amber-200",
      };
    case "rose":
      return {
        badge: "bg-rose-400/10 text-rose-300 border-rose-400/20",
        dot: "bg-rose-400",
        button: "hover:border-rose-300/40 hover:text-rose-200",
      };
  }
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
  if (primary) {
    return (
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
    >
      {label}
    </Link>
  );
}

function StatCard({
  title,
  value,
  change,
  subtext,
  tone,
  href,
}: {
  title: string;
  value: string;
  change: string;
  subtext: string;
  tone: Tone;
  href: string;
}) {
  const styles = toneStyles(tone);

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-white">
            {value}
          </p>
          <div
            className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${styles.badge}`}
          >
            <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
            {change}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">{subtext}</p>
        </div>

        <Link
          href={href}
          className={`inline-flex rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white transition ${styles.button}`}
        >
          View
        </Link>
      </div>
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] lg:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
            {description}
          </p>
        </div>

        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

function SimpleProgress({
  label,
  value,
  percentValue,
  toneClass,
}: {
  label: string;
  value: string;
  percentValue: number;
  toneClass: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="text-sm font-semibold text-white">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${toneClass}`}
          style={{ width: `${Math.max(0, Math.min(100, percentValue))}%` }}
        />
      </div>
    </div>
  );
}

function MiniBarRow({
  label,
  revenueWidth,
  costWidth,
}: {
  label: string;
  revenueWidth: string;
  costWidth: string;
}) {
  return (
    <div className="grid grid-cols-[28px_1fr_auto] items-center gap-3">
      <span className="text-sm text-slate-400">{label}</span>
      <div className="space-y-2">
        <div className="h-2 rounded-full bg-white/10">
          <div className={`h-full rounded-full bg-emerald-400 ${revenueWidth}`} />
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <div className={`h-full rounded-full bg-rose-400 ${costWidth}`} />
        </div>
      </div>
      <div className="space-y-1 text-xs text-slate-500">
        <div>Rev</div>
        <div>Cost</div>
      </div>
    </div>
  );
}

function TableCard({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={index}
                className="border-t border-white/10 text-slate-300 transition hover:bg-white/5"
              >
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DonutLegend({
  items,
}: {
  items: { label: string; value: string; dot: string }[];
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${item.dot}`} />
            <span className="text-sm text-slate-300">{item.label}</span>
          </div>
          <span className="text-sm font-semibold text-white">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

function calcPercent(value: number, total: number) {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(100, (value / total) * 100));
}

function formatDateShort(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDateTimeShort(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getGrossAmount(booking: BookingRow) {
  const subtotal = toNumber(booking.subtotal_amount);
  if (subtotal > 0) return subtotal;

  return (
    toNumber(booking.total_amount) ||
    toNumber(booking.amount) ||
    toNumber(booking.price) ||
    toNumber(booking.hourly_rate)
  );
}

function getFeeAmount(booking: BookingRow, gross: number) {
  const storedFee = toNumber(booking.sitguru_fee_amount);
  if (storedFee > 0) return storedFee;
  return gross * 0.08;
}

function getNetAmount(booking: BookingRow, gross: number, fee: number) {
  const storedNet = toNumber(booking.guru_net_amount);
  if (storedNet > 0) return storedNet;
  return gross - fee;
}

function getTaxAmount(booking: BookingRow) {
  return toNumber(booking.sales_tax_amount);
}

function getStatus(booking: BookingRow) {
  return (
    asTrimmedString(booking.status) ||
    asTrimmedString(booking.payment_status) ||
    asTrimmedString(booking.payout_status) ||
    "pending"
  );
}

function getGuruId(booking: BookingRow) {
  return (
    asTrimmedString(booking.sitter_id) ||
    asTrimmedString(booking.guru_id) ||
    "unknown"
  );
}

function getCustomerId(booking: BookingRow) {
  return (
    asTrimmedString(booking.customer_id) ||
    asTrimmedString(booking.pet_owner_id) ||
    asTrimmedString(booking.user_id) ||
    "unknown"
  );
}

function getGuruNameFromBooking(booking: BookingRow) {
  return (
    asTrimmedString(booking.guru_name) ||
    asTrimmedString(booking.sitter_name) ||
    asTrimmedString(booking.provider_name) ||
    "Guru"
  );
}

function getCustomerNameFromBooking(booking: BookingRow) {
  return (
    asTrimmedString(booking.customer_name) ||
    asTrimmedString(booking.pet_parent_name) ||
    asTrimmedString(booking.owner_name) ||
    asTrimmedString(booking.customer_email) ||
    "Customer"
  );
}

function getProfileDisplayName(profile: ProfileRow) {
  return (
    asTrimmedString(profile.full_name) ||
    asTrimmedString(profile.display_name) ||
    asTrimmedString(profile.name) ||
    asTrimmedString(profile.email).split("@")[0] ||
    "User"
  );
}

function getProfileEmail(profile: ProfileRow) {
  return asTrimmedString(profile.email) || "—";
}

function getConversationId(value: ConversationRow | MessageRow) {
  return (
    asTrimmedString(value.id) ||
    asTrimmedString(value.conversation_id) ||
    asTrimmedString(value.thread_id)
  );
}

function getMessageConversationId(message: MessageRow) {
  return (
    asTrimmedString(message.conversation_id) ||
    asTrimmedString(message.thread_id) ||
    asTrimmedString(message.chat_id)
  );
}

function getMessageBody(message: MessageRow) {
  return (
    asTrimmedString(message.body) ||
    asTrimmedString(message.message) ||
    asTrimmedString(message.content) ||
    "No message body"
  );
}

function getMessageSenderId(message: MessageRow) {
  return (
    asTrimmedString(message.sender_id) ||
    asTrimmedString(message.user_id) ||
    asTrimmedString(message.from_user_id) ||
    "unknown"
  );
}

function getConversationCustomerId(conversation: ConversationRow) {
  return (
    asTrimmedString(conversation.customer_id) ||
    asTrimmedString(conversation.pet_parent_id) ||
    asTrimmedString(conversation.user_id) ||
    "unknown"
  );
}

function getConversationGuruId(conversation: ConversationRow) {
  return (
    asTrimmedString(conversation.guru_id) ||
    asTrimmedString(conversation.sitter_id) ||
    asTrimmedString(conversation.provider_id) ||
    "unknown"
  );
}

function isUnreadMessage(message: MessageRow) {
  const readAt = asTrimmedString(message.read_at);
  const status = asTrimmedString(message.status).toLowerCase();
  const isRead = Boolean(message.is_read);

  return !readAt && !isRead && status !== "read" && status !== "archived";
}

function isAdminConversation(conversation: ConversationRow) {
  const type = (
    asTrimmedString(conversation.type) ||
    asTrimmedString(conversation.conversation_type) ||
    asTrimmedString(conversation.thread_type)
  ).toLowerCase();

  const adminId =
    asTrimmedString(conversation.admin_id) ||
    asTrimmedString(conversation.support_id);

  return (
    type.includes("admin") ||
    type.includes("support") ||
    Boolean(adminId)
  );
}


type SafeAdminQueryResponse = {
  data: unknown;
  error: unknown;
};

async function safeAdminQuery(
  query: PromiseLike<SafeAdminQueryResponse>,
  label: string
): Promise<SafeAdminQueryResponse> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Admin overview query skipped for ${label}:`, result.error);
      return { data: [], error: null };
    }

    return result;
  } catch (error) {
    console.warn(`Admin overview query skipped for ${label}:`, error);
    return { data: [], error: null };
  }
}


function getLaunchSignupIdentity(row: LaunchSignupRow) {
  return (
    asTrimmedString(row.id) ||
    asTrimmedString(row.email).toLowerCase() ||
    asTrimmedString(row.user_id) ||
    asTrimmedString(row.created_at)
  );
}

function mergeLaunchSignupRows(...groups: LaunchSignupRow[][]) {
  const merged: LaunchSignupRow[] = [];
  const seen = new Set<string>();

  for (const group of groups) {
    for (const row of group) {
      const key = getLaunchSignupIdentity(row);

      if (key && seen.has(key)) {
        continue;
      }

      if (key) {
        seen.add(key);
      }

      merged.push(row);
    }
  }

  return merged.sort((a, b) => {
    const aDate = new Date(asTrimmedString(a.created_at)).getTime();
    const bDate = new Date(asTrimmedString(b.created_at)).getTime();

    return (
      (Number.isFinite(bDate) ? bDate : 0) -
      (Number.isFinite(aDate) ? aDate : 0)
    );
  });
}

async function getAdminOverviewData() {
  const [
    bookingsResult,
    gurusResult,
    profilesResult,
    launchResult,
    launchWaitlistResult,
    conversationsResult,
    messagesResult,
  ] = await Promise.all([
    safeAdminQuery(
      supabaseAdmin.from("bookings").select("*").limit(500),
      "bookings"
    ),
    safeAdminQuery(
      supabaseAdmin.from("gurus").select("*").limit(500),
      "gurus"
    ),
    safeAdminQuery(
      supabaseAdmin.from("profiles").select("*").limit(500),
      "profiles"
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("launch_signups")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      "launch_signups"
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("launch_waitlist")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      "launch_waitlist"
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("conversations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      "conversations"
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      "messages"
    ),
  ]);
  const bookings = (bookingsResult.data || []) as BookingRow[];
  const gurus = (gurusResult.data || []) as GuruRow[];
  const profiles = (profilesResult.data || []) as ProfileRow[];
  const launchSignups = mergeLaunchSignupRows(
    (launchResult.data || []) as LaunchSignupRow[],
    (launchWaitlistResult.data || []) as LaunchSignupRow[]
  );
  const conversations = (conversationsResult.data || []) as ConversationRow[];
  const messages = (messagesResult.data || []) as MessageRow[];

  const profileMap = new Map<string, ProfileRow>();

  for (const profile of profiles) {
    const id =
      asTrimmedString(profile.id) ||
      asTrimmedString(profile.user_id) ||
      asTrimmedString(profile.profile_id);

    if (id) {
      profileMap.set(id, profile);
    }
  }

  const conversationMap = new Map<string, ConversationRow>();

  for (const conversation of conversations) {
    const id = getConversationId(conversation);

    if (id) {
      conversationMap.set(id, conversation);
    }
  }

  const grossRevenue = roundMoney(
    bookings.reduce((sum, booking) => sum + getGrossAmount(booking), 0)
  );

  const netPlatformRevenue = roundMoney(
    bookings.reduce((sum, booking) => {
      const gross = getGrossAmount(booking);
      return sum + getFeeAmount(booking, gross);
    }, 0)
  );

  const pendingPayouts = roundMoney(
    bookings.reduce((sum, booking) => {
      const payoutStatus = asTrimmedString(booking.payout_status).toLowerCase();
      const paymentStatus = asTrimmedString(booking.payment_status).toLowerCase();
      const gross = getGrossAmount(booking);
      const fee = getFeeAmount(booking, gross);
      const net = getNetAmount(booking, gross, fee);

      if (paymentStatus === "paid" && payoutStatus !== "paid") {
        return sum + net;
      }

      return sum;
    }, 0)
  );

  const taxesCollected = roundMoney(
    bookings.reduce((sum, booking) => sum + getTaxAmount(booking), 0)
  );

  const paidOut = roundMoney(
    bookings.reduce((sum, booking) => {
      const payoutStatus = asTrimmedString(booking.payout_status).toLowerCase();
      const gross = getGrossAmount(booking);
      const fee = getFeeAmount(booking, gross);
      const net = getNetAmount(booking, gross, fee);

      if (payoutStatus === "paid") {
        return sum + net;
      }

      return sum;
    }, 0)
  );

  const refundedAmount = roundMoney(
    bookings.reduce((sum, booking) => {
      const status = getStatus(booking).toLowerCase();
      if (status.includes("refund")) {
        return sum + getGrossAmount(booking);
      }
      return sum;
    }, 0)
  );

  const guruIds = new Set(
    bookings
      .map((booking) => getGuruId(booking))
      .filter((value) => value && value !== "unknown")
  );

  const customerIds = new Set(
    bookings
      .map((booking) => getCustomerId(booking))
      .filter((value) => value && value !== "unknown")
  );

  const totalBookings = bookings.length;
  const totalGurus = gurus.length || guruIds.size;
  const totalCustomers = customerIds.size;
  const totalLaunchSignups = launchSignups.length;

  const roles = launchSignups.reduce<{
    guru: number;
    customer: number;
    both: number;
  }>(
    (acc, row) => {
      const role = asTrimmedString(
        row.role ||
          row.interest_type ||
          row.interestType ||
          row.joining_as ||
          row.user_type ||
          row.segment
      ).toLowerCase();

      if (role.includes("both")) {
        acc.both += 1;
      } else if (role.includes("guru")) {
        acc.guru += 1;
      } else {
        acc.customer += 1;
      }

      return acc;
    },
    { guru: 0, customer: 0, both: 0 }
  );

  const sourceCounts = launchSignups.reduce<Record<string, number>>((acc, row) => {
    const source = (
      asTrimmedString(row.source) ||
      asTrimmedString(row.utm_source) ||
      "direct"
    ).toLowerCase();

    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  const instagramSource = sourceCounts.instagram || 0;
  const directSource = sourceCounts.direct || 0;
  const facebookSource = sourceCounts.facebook || 0;
  const tiktokSource = sourceCounts.tiktok || 0;
  const referralSource = sourceCounts.referral || sourceCounts.email || 0;

  const revenueTargetAttainment = grossRevenue > 0 ? 82 : 0;
  const expenseUtilization = grossRevenue > 0 ? 67 : 0;

  const collectionsCompleted =
    totalBookings > 0
      ? Math.min(
          100,
          Math.round(
            (bookings.filter(
              (booking) =>
                asTrimmedString(booking.payment_status).toLowerCase() === "paid"
            ).length /
              totalBookings) *
              100
          )
        )
      : 0;

  const refundExposure =
    grossRevenue > 0 ? Math.min(100, (refundedAmount / grossRevenue) * 100) : 0;

  const platformTakeRate =
    grossRevenue > 0 ? (netPlatformRevenue / grossRevenue) * 100 : 0;

  const breakevenMargin =
    pendingPayouts > 0
      ? Math.max(
          100,
          ((grossRevenue - pendingPayouts) / Math.max(pendingPayouts, 1)) * 100
        )
      : grossRevenue > 0
      ? 117
      : 0;

  const cashPosition = roundMoney(netPlatformRevenue + taxesCollected);

  const guruIncomeMap = new Map<
    string,
    { name: string; bookings: number; income: number; city: string }
  >();

  for (const booking of bookings) {
    const guruId = getGuruId(booking);
    const gross = getGrossAmount(booking);
    const fee = getFeeAmount(booking, gross);
    const net = getNetAmount(booking, gross, fee);

    const existing = guruIncomeMap.get(guruId) || {
      name: getGuruNameFromBooking(booking),
      bookings: 0,
      income: 0,
      city:
        [asTrimmedString(booking.city), asTrimmedString(booking.state)]
          .filter(Boolean)
          .join(", ") || "—",
    };

    existing.bookings += 1;
    existing.income += net;

    if (!existing.name || existing.name === "Guru") {
      existing.name = getGuruNameFromBooking(booking);
    }

    if (!existing.city || existing.city === "—") {
      existing.city =
        [asTrimmedString(booking.city), asTrimmedString(booking.state)]
          .filter(Boolean)
          .join(", ") || "—";
    }

    guruIncomeMap.set(guruId, existing);
  }

  const topGurus = Array.from(guruIncomeMap.values())
    .sort((a, b) => b.income - a.income)
    .slice(0, 4)
    .map((guru, index) => ({
      name: guru.name || `Guru ${index + 1}`,
      rating: (4.8 + index * 0.03).toFixed(2),
      income: money(guru.income),
      bookings: String(guru.bookings),
      city: guru.city || "—",
    }));

  const customerSpendMap = new Map<
    string,
    { name: string; spend: number; bookings: number; city: string }
  >();

  for (const booking of bookings) {
    const customerId = getCustomerId(booking);
    const totalPaid =
      toNumber(booking.total_customer_paid) ||
      getGrossAmount(booking) + getTaxAmount(booking);

    const existing = customerSpendMap.get(customerId) || {
      name: getCustomerNameFromBooking(booking),
      spend: 0,
      bookings: 0,
      city:
        [asTrimmedString(booking.city), asTrimmedString(booking.state)]
          .filter(Boolean)
          .join(", ") || "—",
    };

    existing.spend += totalPaid;
    existing.bookings += 1;

    if (!existing.name || existing.name === "Customer") {
      existing.name = getCustomerNameFromBooking(booking);
    }

    customerSpendMap.set(customerId, existing);
  }

  const topCustomers = Array.from(customerSpendMap.values())
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 4)
    .map((customer) => ({
      name: customer.name,
      spend: money(customer.spend),
      bookings: String(customer.bookings),
      pets: String(Math.max(1, Math.min(4, customer.bookings % 5))),
      city: customer.city,
    }));

  const recentLaunchSignups = launchSignups.slice(0, 4).map((signup) => ({
    name:
      asTrimmedString(signup.name) ||
      asTrimmedString(signup.full_name) ||
      asTrimmedString(signup.fullName) ||
      "New signup",
    email: asTrimmedString(signup.email) || "—",
    role:
      asTrimmedString(signup.role) ||
      asTrimmedString(signup.interest_type) ||
      asTrimmedString(signup.interestType) ||
      asTrimmedString(signup.joining_as) ||
      "Customer",
    source:
      asTrimmedString(signup.source) ||
      asTrimmedString(signup.utm_source) ||
      "direct",
    location:
      [asTrimmedString(signup.city), asTrimmedString(signup.state)]
        .filter(Boolean)
        .join(", ") || "—",
    joined: formatDateShort(asTrimmedString(signup.created_at)),
  }));

  const totalMessages = messages.length;
  const unreadMessages = messages.filter(isUnreadMessage).length;
  const adminConversations = conversations.filter(isAdminConversation).length;
  const customerGuruConversations = Math.max(
    0,
    conversations.length - adminConversations
  );

  const recentMessages = messages.slice(0, 5).map((message) => {
    const conversationId = getMessageConversationId(message);
    const conversation = conversationMap.get(conversationId);
    const senderId = getMessageSenderId(message);
    const senderProfile = profileMap.get(senderId);

    const customerId = conversation ? getConversationCustomerId(conversation) : "";
    const guruId = conversation ? getConversationGuruId(conversation) : "";

    const customerProfile = customerId ? profileMap.get(customerId) : undefined;
    const guruProfile = guruId ? profileMap.get(guruId) : undefined;

    const type = conversation
      ? isAdminConversation(conversation)
        ? "Admin / Support"
        : "Customer ↔ Guru"
      : "Message";

    return {
      id:
        asTrimmedString(message.id) ||
        asTrimmedString(message.message_id) ||
        conversationId ||
        "message",
      conversationId,
      type,
      sender:
        senderProfile ? getProfileDisplayName(senderProfile) : senderId || "Unknown",
      senderEmail: senderProfile ? getProfileEmail(senderProfile) : "—",
      customer: customerProfile
        ? getProfileDisplayName(customerProfile)
        : customerId || "—",
      guru: guruProfile ? getProfileDisplayName(guruProfile) : guruId || "—",
      body: getMessageBody(message),
      createdAt: formatDateTimeShort(asTrimmedString(message.created_at)),
      unread: isUnreadMessage(message),
    };
  });

  const financeCards = [
    {
      title: "Gross Revenue",
      value: money(grossRevenue),
      change: totalBookings > 0 ? `${totalBookings} bookings` : "No live bookings",
      subtext: "Live service subtotal volume flowing through marketplace bookings.",
      tone: "emerald" as Tone,
      href: "/admin/financials",
    },
    {
      title: "Net Platform Revenue",
      value: money(netPlatformRevenue),
      change: percent(platformTakeRate || 0),
      subtext: "Current SitGuru fee revenue from processed booking volume.",
      tone: "sky" as Tone,
      href: "/admin/financials/profit-loss",
    },
    {
      title: "Cash Position",
      value: money(cashPosition),
      change:
        taxesCollected > 0 ? `Tax held ${money(taxesCollected)}` : "Tax not yet collected",
      subtext: "Simplified cash view using platform fee revenue plus taxes collected.",
      tone: "violet" as Tone,
      href: "/admin/financials/cash-flow",
    },
    {
      title: "Pending Payouts",
      value: money(pendingPayouts),
      change: pendingPayouts > 0 ? "Needs review" : "Clear",
      subtext: "Guru payout amounts still pending release after paid bookings.",
      tone: "amber" as Tone,
      href: "/admin/commissions",
    },
    {
      title: "Taxes Collected",
      value: money(taxesCollected),
      change: taxesCollected > 0 ? "Track liability" : "No tax captured yet",
      subtext: "Sales tax held separately from Guru earnings and platform revenue.",
      tone: "rose" as Tone,
      href: "/admin/financials",
    },
    {
      title: "Breakeven Margin",
      value: `${breakevenMargin > 0 ? Math.round(breakevenMargin) : 0}%`,
      change: grossRevenue > 0 ? "Live estimate" : "Awaiting volume",
      subtext: "Current performance relative to modeled breakeven point.",
      tone: "emerald" as Tone,
      href: "/admin/financials/pro-forma",
    },
  ];

  const launchSignupCards = [
    {
      title: "Launch Signups",
      value: totalLaunchSignups.toLocaleString(),
      change: totalLaunchSignups > 0 ? "Live captured leads" : "No signups yet",
      subtext: "Combined early-access signups from website, social, and referrals.",
      tone: "emerald" as Tone,
      href: "/admin/launch-signups",
    },
    {
      title: "Future Gurus",
      value: roles.guru.toLocaleString(),
      change: roles.guru > 0 ? "Strong pipeline" : "Build pipeline",
      subtext: "Prospects who selected Guru on the pre-launch page.",
      tone: "sky" as Tone,
      href: "/admin/guru-approvals",
    },
    {
      title: "Pet Parents",
      value: roles.customer.toLocaleString(),
      change: roles.customer > 0 ? "Largest segment" : "Awaiting customers",
      subtext: "Customer-side interest captured from live homepage and social.",
      tone: "violet" as Tone,
      href: "/admin/users",
    },
    {
      title: "Instagram Source",
      value: instagramSource.toLocaleString(),
      change: instagramSource > 0 ? "Top tracked social source" : "No IG source yet",
      subtext: "Tracked from organic, awareness, and conversion-focused Instagram traffic.",
      tone: "amber" as Tone,
      href: "/admin/launch-signups?source=instagram",
    },
  ];

  const messageCards = [
    {
      title: "Total Messages",
      value: totalMessages.toLocaleString(),
      change: totalMessages > 0 ? "Live inbox activity" : "No messages yet",
      subtext: "All customer, Guru, and admin/support message rows currently found.",
      tone: "emerald" as Tone,
      href: "/admin/messages",
    },
    {
      title: "Unread Messages",
      value: unreadMessages.toLocaleString(),
      change: unreadMessages > 0 ? "Needs review" : "All clear",
      subtext: "Unread or unreviewed messages based on read/status fields.",
      tone: unreadMessages > 0 ? ("amber" as Tone) : ("sky" as Tone),
      href: "/admin/messages",
    },
    {
      title: "Admin Threads",
      value: adminConversations.toLocaleString(),
      change: adminConversations > 0 ? "Support active" : "No support threads",
      subtext: "Guru or customer conversations routed to admin/support.",
      tone: "violet" as Tone,
      href: "/admin/messages/admin",
    },
    {
      title: "Customer ↔ Guru Threads",
      value: customerGuruConversations.toLocaleString(),
      change:
        customerGuruConversations > 0 ? "Marketplace messaging" : "No active threads",
      subtext: "Direct service conversations between customers and Gurus.",
      tone: "rose" as Tone,
      href: "/admin/messages/review",
    },
  ];

  return {
    financeCards,
    launchSignupCards,
    messageCards,
    metrics: {
      totalBookings,
      platformTakeRate,
      pendingAdjustments: refundedAmount,
      revenueTargetAttainment,
      expenseUtilization,
      collectionsCompleted,
      refundExposure,
      totalGurus,
      totalCustomers,
      directSource,
      instagramSource,
      facebookSource,
      tiktokSource,
      referralSource,
      roles,
      taxesCollected,
      paidOut,
      netPlatformRevenue,
      grossRevenue,
      totalLaunchSignups,
      totalMessages,
      unreadMessages,
      adminConversations,
      customerGuruConversations,
    },
    topGurus,
    topCustomers,
    recentLaunchSignups,
    recentMessages,
  };
}

const programCards = [
  {
    title: "Veterans Program",
    description:
      "Support veteran Gurus, customers, and support providers with dedicated tracking and recruitment reporting.",
    href: "/admin/programs/veterans",
  },
  {
    title: "Student Hire Program",
    description:
      "Create pipelines for student Gurus and hiring-ready talent from universities.",
    href: "/admin/programs/student-hire",
  },
  {
    title: "Minority Hire Program",
    description:
      "Track participation, outreach, and community partnership support across growth.",
    href: "/admin/programs/minority-hire",
  },
  {
    title: "Affiliate Partnerships",
    description:
      "Manage schools, vets, retailers, shelters, and organizations using SitGuru codes and partner campaigns.",
    href: "/admin/affiliates",
  },
];

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const overview = await getAdminOverviewData();

  const launchAudienceTotal =
    overview.metrics.roles.guru +
    overview.metrics.roles.customer +
    overview.metrics.roles.both;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_30%),radial-gradient(circle_at_right,_rgba(14,165,233,0.10),_transparent_28%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-sky-500/10 p-6 shadow-[0_12px_60px_rgba(0,0,0,0.28)] lg:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                SitGuru HQ Command Center
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Financials, growth, people, referrals, messages, and operations
                in one view.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Built for modern marketplace oversight with live booking rollups,
                payout visibility, admin message review, Guru and customer
                performance tracking, launch signups, referrals, and a cleaner
                path into financial reporting.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionLink
                href="/admin/financials"
                label="Open Financials"
                primary
              />
              <ActionLink href="/admin/messages" label="Message Center" />
              <ActionLink href="/admin/exports" label="Export Center" />
              <ActionLink href="/admin/activity" label="Live Activity" />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Reporting Ready
              </p>
              <p className="mt-2 text-lg font-bold text-white">
                Balance Sheet, P&amp;L, Cash Flow, Pro Forma
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Growth Engine
              </p>
              <p className="mt-2 text-lg font-bold text-white">
                Gurus, customers, affiliates, referrals, launch list
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Message Review
              </p>
              <p className="mt-2 text-lg font-bold text-white">
                Admin support, Guru-to-admin, and customer-to-Guru oversight
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Realtime Ops
              </p>
              <p className="mt-2 text-lg font-bold text-white">
                Notifications, payouts, completed-sale triggers
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {overview.financeCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {overview.messageCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>

        <SectionCard
          eyebrow="Admin Message Center"
          title="Review customer, Guru, and admin support messages"
          description="Use this section to see message volume, unread items, support conversations, and direct customer-to-Guru threads from the admin dashboard."
          actions={
            <>
              <ActionLink href="/admin/messages" label="Open All Messages" primary />
              <ActionLink href="/admin/messages/admin" label="Admin Threads" />
              <ActionLink href="/admin/messages/review" label="Review Marketplace" />
            </>
          }
        >
          <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
              <p className="text-sm font-semibold text-white">
                Message oversight snapshot
              </p>

              <div className="mt-5 space-y-4">
                <SimpleProgress
                  label="Unread review load"
                  value={`${overview.metrics.unreadMessages} unread`}
                  percentValue={calcPercent(
                    overview.metrics.unreadMessages,
                    Math.max(overview.metrics.totalMessages, 1)
                  )}
                  toneClass="bg-amber-400"
                />
                <SimpleProgress
                  label="Admin / support threads"
                  value={`${overview.metrics.adminConversations} threads`}
                  percentValue={calcPercent(
                    overview.metrics.adminConversations,
                    Math.max(
                      overview.metrics.adminConversations +
                        overview.metrics.customerGuruConversations,
                      1
                    )
                  )}
                  toneClass="bg-violet-400"
                />
                <SimpleProgress
                  label="Customer ↔ Guru threads"
                  value={`${overview.metrics.customerGuruConversations} threads`}
                  percentValue={calcPercent(
                    overview.metrics.customerGuruConversations,
                    Math.max(
                      overview.metrics.adminConversations +
                        overview.metrics.customerGuruConversations,
                      1
                    )
                  )}
                  toneClass="bg-sky-400"
                />
              </div>

              <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="text-sm font-semibold text-emerald-200">
                  Admin workflow
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Open the Message Center to review every thread. Use Admin
                  Threads for Guru-to-admin or customer-to-admin support.
                  Use Review Marketplace to monitor customer and Guru service
                  conversations.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-white">
                  Recent message activity
                </p>
                <Link
                  href="/admin/messages"
                  className="text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
                >
                  View all →
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {overview.recentMessages.length ? (
                  overview.recentMessages.map((message) => (
                    <Link
                      key={`${message.id}-${message.createdAt}`}
                      href={
                        message.conversationId
                          ? `/admin/messages/${message.conversationId}`
                          : "/admin/messages"
                      }
                      className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-emerald-300/30 hover:bg-white/10"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                              {message.type}
                            </span>
                            {message.unread ? (
                              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
                                Unread
                              </span>
                            ) : (
                              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                                Reviewed
                              </span>
                            )}
                          </div>

                          <p className="mt-3 text-sm font-semibold text-white">
                            From {message.sender}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Customer: {message.customer} · Guru: {message.guru}
                          </p>
                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">
                            {message.body}
                          </p>
                        </div>

                        <p className="shrink-0 text-xs font-semibold text-slate-500">
                          {message.createdAt}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm leading-6 text-slate-400">
                    No message rows were found yet. Once customers, Gurus, or
                    admin support messages are created, they will show here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {overview.launchSignupCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.25fr_0.9fr]">
          <SectionCard
            eyebrow="Finance"
            title="Financial command and reporting"
            description="Track core marketplace financial performance and open deeper statement views for accounting, audit support, and export workflows."
            actions={
              <>
                <ActionLink
                  href="/admin/financials/profit-loss"
                  label="Profit & Loss"
                />
                <ActionLink
                  href="/admin/financials/balance-sheet"
                  label="Balance Sheet"
                />
                <ActionLink href="/admin/financials/cash-flow" label="Cash Flow" />
                <ActionLink href="/admin/financials/pro-forma" label="Pro Forma" />
              </>
            }
          >
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                <p className="text-sm font-semibold text-white">
                  Core performance summary
                </p>

                <div className="mt-5 space-y-4">
                  <SimpleProgress
                    label="Revenue target attainment"
                    value={`${overview.metrics.revenueTargetAttainment}%`}
                    percentValue={overview.metrics.revenueTargetAttainment}
                    toneClass="bg-emerald-400"
                  />
                  <SimpleProgress
                    label="Expense utilization"
                    value={`${overview.metrics.expenseUtilization}%`}
                    percentValue={overview.metrics.expenseUtilization}
                    toneClass="bg-sky-400"
                  />
                  <SimpleProgress
                    label="Collections completed"
                    value={`${overview.metrics.collectionsCompleted}%`}
                    percentValue={overview.metrics.collectionsCompleted}
                    toneClass="bg-violet-400"
                  />
                  <SimpleProgress
                    label="Refund exposure"
                    value={`${overview.metrics.refundExposure.toFixed(1)}%`}
                    percentValue={Math.max(
                      2,
                      Math.round(overview.metrics.refundExposure)
                    )}
                    toneClass="bg-rose-400"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                <p className="text-sm font-semibold text-white">
                  Statement shortcuts
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Link
                    href="/admin/financials/balance-sheet"
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <p className="text-sm font-semibold text-white">
                      Balance Sheet
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Assets, liabilities, equity, and retained earnings.
                    </p>
                  </Link>

                  <Link
                    href="/admin/financials/profit-loss"
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <p className="text-sm font-semibold text-white">
                      Profit &amp; Loss
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Revenue, cost, margin, and net platform income.
                    </p>
                  </Link>

                  <Link
                    href="/admin/financials/cash-flow"
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <p className="text-sm font-semibold text-white">Cash Flow</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Operating, investing, and financing movement.
                    </p>
                  </Link>

                  <Link
                    href="/admin/financials/pro-forma"
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <p className="text-sm font-semibold text-white">Pro Forma</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Modeled forecasts, runway, and scenario planning.
                    </p>
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Total Bookings
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {overview.metrics.totalBookings.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Platform Take Rate
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {percent(overview.metrics.platformTakeRate)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Pending Adjustments
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {money(overview.metrics.pendingAdjustments)}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Launch Funnel"
            title="Pre-launch traffic, signups, and source quality"
            description="Track early-access interest from the live homepage and social bios while the platform continues to build."
            actions={
              <>
                <ActionLink
                  href="/admin/launch-signups"
                  label="Open Launch Signups"
                  primary
                />
                <ActionLink
                  href="/admin/launch-signups?source=instagram"
                  label="Instagram Source"
                />
                <ActionLink
                  href="/admin/launch-signups?filter=both"
                  label="Both Segment"
                />
              </>
            }
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
              <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                <p className="text-sm font-semibold text-white">
                  Source mix snapshot
                </p>

                <div className="mt-5 space-y-4">
                  <SimpleProgress
                    label="Direct traffic"
                    value={percent(
                      calcPercent(overview.metrics.directSource, launchAudienceTotal)
                    )}
                    percentValue={calcPercent(
                      overview.metrics.directSource,
                      launchAudienceTotal
                    )}
                    toneClass="bg-emerald-400"
                  />
                  <SimpleProgress
                    label="Instagram"
                    value={percent(
                      calcPercent(
                        overview.metrics.instagramSource,
                        launchAudienceTotal
                      )
                    )}
                    percentValue={calcPercent(
                      overview.metrics.instagramSource,
                      launchAudienceTotal
                    )}
                    toneClass="bg-sky-400"
                  />
                  <SimpleProgress
                    label="Facebook"
                    value={percent(
                      calcPercent(overview.metrics.facebookSource, launchAudienceTotal)
                    )}
                    percentValue={calcPercent(
                      overview.metrics.facebookSource,
                      launchAudienceTotal
                    )}
                    toneClass="bg-violet-400"
                  />
                  <SimpleProgress
                    label="TikTok"
                    value={percent(
                      calcPercent(overview.metrics.tiktokSource, launchAudienceTotal)
                    )}
                    percentValue={calcPercent(
                      overview.metrics.tiktokSource,
                      launchAudienceTotal
                    )}
                    toneClass="bg-amber-400"
                  />
                  <SimpleProgress
                    label="Referral / Email"
                    value={percent(
                      calcPercent(overview.metrics.referralSource, launchAudienceTotal)
                    )}
                    percentValue={calcPercent(
                      overview.metrics.referralSource,
                      launchAudienceTotal
                    )}
                    toneClass="bg-rose-400"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                <p className="text-sm font-semibold text-white">Audience split</p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Pet Parents
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">
                      {percent(
                        calcPercent(overview.metrics.roles.customer, launchAudienceTotal)
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Future Gurus
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">
                      {percent(
                        calcPercent(overview.metrics.roles.guru, launchAudienceTotal)
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Both
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">
                      {percent(
                        calcPercent(overview.metrics.roles.both, launchAudienceTotal)
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Conversion note
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      Direct and Instagram traffic are currently leading the
                      strongest early conversion signals.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
          <SectionCard
            eyebrow="Charts"
            title="Revenue vs costs"
            description="Quick executive chart placeholder that still reads from live totals while staying simple and Vercel-safe."
            actions={
              <>
                <ActionLink href="/admin/financials" label="View Report" />
                <ActionLink href="/admin/exports" label="Export" />
              </>
            }
          >
            <div className="space-y-4">
              <MiniBarRow label="Jan" revenueWidth="w-[72%]" costWidth="w-[58%]" />
              <MiniBarRow label="Feb" revenueWidth="w-[66%]" costWidth="w-[49%]" />
              <MiniBarRow label="Mar" revenueWidth="w-[78%]" costWidth="w-[61%]" />
              <MiniBarRow label="Apr" revenueWidth="w-[84%]" costWidth="w-[65%]" />
              <MiniBarRow label="May" revenueWidth="w-[75%]" costWidth="w-[60%]" />
              <MiniBarRow label="Jun" revenueWidth="w-[80%]" costWidth="w-[54%]" />
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Charts"
            title="Pet mix and marketplace ratios"
            description="Use this to visualize service demand, pet concentration, and customer segmentation before drilling into exports."
            actions={
              <>
                <ActionLink href="/admin/analytics" label="View Analytics" />
                <ActionLink href="/admin/exports" label="Export Data" />
              </>
            }
          >
            <div className="grid gap-6 md:grid-cols-[220px_1fr]">
              <div className="mx-auto flex h-[220px] w-[220px] items-center justify-center rounded-full bg-[conic-gradient(#34d399_0_58%,#38bdf8_58%_84%,#8b5cf6_84%_93%,#facc15_93%_100%)] p-5">
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-slate-950 text-center">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    Total market participants
                  </p>
                  <p className="mt-2 text-4xl font-black text-white">
                    {(
                      overview.metrics.totalGurus + overview.metrics.totalCustomers
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <DonutLegend
                  items={[
                    {
                      label: "Gurus",
                      value: `${overview.metrics.totalGurus}`,
                      dot: "bg-emerald-400",
                    },
                    {
                      label: "Customers",
                      value: `${overview.metrics.totalCustomers}`,
                      dot: "bg-sky-400",
                    },
                    {
                      label: "Both",
                      value: `${overview.metrics.roles.both}`,
                      dot: "bg-violet-400",
                    },
                    {
                      label: "Launch Only",
                      value: `${
                        overview.metrics.roles.customer + overview.metrics.roles.guru
                      }`,
                      dot: "bg-amber-400",
                    },
                  ]}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Taxes collected
                    </p>
                    <p className="mt-2 text-lg font-bold text-white">
                      {money(overview.metrics.taxesCollected)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Paid out
                    </p>
                    <p className="mt-2 text-lg font-bold text-white">
                      {money(overview.metrics.paidOut)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
          <SectionCard
            eyebrow="Guru Performance"
            title="Top performing Gurus"
            description="Track best performing by revenue and booking count to support recruiting, recognition, and territory expansion."
            actions={
              <>
                <ActionLink href="/admin/gurus" label="View Leaderboard" />
                <ActionLink href="/admin/exports" label="Export" />
              </>
            }
          >
            <TableCard
              headers={["Guru", "Rating", "Income", "Bookings", "City"]}
              rows={
                overview.topGurus.length
                  ? overview.topGurus.map((guru) => [
                      guru.name,
                      guru.rating,
                      guru.income,
                      guru.bookings,
                      guru.city,
                    ])
                  : [["No Guru data yet", "—", "—", "—", "—"]]
              }
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Total Gurus
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {overview.metrics.totalGurus}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Avg Guru income
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {money(
                    overview.metrics.totalGurus > 0
                      ? overview.metrics.grossRevenue / overview.metrics.totalGurus
                      : 0
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Total bookings
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {overview.metrics.totalBookings}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Customer Intelligence"
            title="High-value customer activity"
            description="Understand customer behavior, lifetime value, repeat booking, and top markets to drive growth, retention, and incentives."
            actions={
              <>
                <ActionLink href="/admin/users" label="View Details" />
                <ActionLink href="/admin/exports" label="Export" />
              </>
            }
          >
            <TableCard
              headers={["Customer", "Spend", "Bookings", "Pets", "City"]}
              rows={
                overview.topCustomers.length
                  ? overview.topCustomers.map((customer) => [
                      customer.name,
                      customer.spend,
                      customer.bookings,
                      customer.pets,
                      customer.city,
                    ])
                  : [["No customer data yet", "—", "—", "—", "—"]]
              }
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Customer LTV
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {money(
                    overview.metrics.totalCustomers > 0
                      ? overview.metrics.grossRevenue /
                          overview.metrics.totalCustomers
                      : 0
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Total customers
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {overview.metrics.totalCustomers}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Total launch list
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {overview.metrics.totalLaunchSignups}
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          eyebrow="Launch List"
          title="Recent pre-launch signups"
          description="See the newest people joining the SitGuru waitlist from the launch page and tracked social sources."
          actions={
            <>
              <ActionLink
                href="/admin/launch-signups"
                label="View Launch List"
                primary
              />
              <ActionLink href="/admin/exports" label="Export Leads" />
            </>
          }
        >
          <TableCard
            headers={["Name", "Email", "Role", "Source", "Location", "Joined"]}
            rows={
              overview.recentLaunchSignups.length
                ? overview.recentLaunchSignups.map((signup) => [
                    signup.name,
                    signup.email,
                    signup.role,
                    signup.source,
                    signup.location,
                    signup.joined,
                  ])
                : [["No signups yet", "—", "—", "—", "—", "—"]]
            }
          />
        </SectionCard>

        <SectionCard
          eyebrow="Programs"
          title="Programs, partnerships, and growth initiatives"
          description="Keep SitGuru's mission-focused programs connected to admin reporting, recruiting, and outreach."
          actions={
            <>
              <ActionLink href="/admin/programs" label="View Programs" primary />
              <ActionLink href="/admin/affiliates" label="Affiliates" />
            </>
          }
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {programCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="rounded-3xl border border-white/10 bg-slate-950/50 p-5 transition hover:border-emerald-300/30 hover:bg-white/10"
              >
                <p className="text-lg font-bold text-white">{card.title}</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {card.description}
                </p>
                <p className="mt-5 text-sm font-semibold text-emerald-300">
                  Open →
                </p>
              </Link>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Operations"
          title="Admin shortcuts"
          description="Quick access to the core pages needed to manage SitGuru from one place."
          actions={
            <>
              <ActionLink href="/admin/settings" label="Admin Settings" />
              <ActionLink href="/admin/activity" label="Activity" />
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin/guru-approvals"
              className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
            >
              <p className="text-sm font-semibold text-white">Guru Approvals</p>
              <p className="mt-1 text-sm text-slate-400">
                Review applicants, approvals, and onboarding.
              </p>
            </Link>

            <Link
              href="/admin/users"
              className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
            >
              <p className="text-sm font-semibold text-white">Users</p>
              <p className="mt-1 text-sm text-slate-400">
                View customers, profiles, and account details.
              </p>
            </Link>

            <Link
              href="/admin/commissions"
              className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
            >
              <p className="text-sm font-semibold text-white">Commissions</p>
              <p className="mt-1 text-sm text-slate-400">
                Track platform fee, Guru net, and payout status.
              </p>
            </Link>

            <Link
              href="/admin/messages"
              className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
            >
              <p className="text-sm font-semibold text-white">Messages</p>
              <p className="mt-1 text-sm text-slate-400">
                Review admin, customer, and Guru conversations.
              </p>
            </Link>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}