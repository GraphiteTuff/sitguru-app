import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeHelp,
  BarChart3,
  Download,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  CreditCard,
  Handshake,
  Inbox,
  MessageCircle,
  MessagesSquare,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type InquiryKey =
  | "booking"
  | "payment"
  | "guru-support"
  | "customer-support"
  | "safety"
  | "technical"
  | "partner"
  | "general";

type SearchParams = {
  filter?: string;
  inquiry?: string;
  q?: string;
};

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

type AnyRow = Record<string, unknown>;

type ConversationRow = {
  id: string;
  customer_id?: string | null;
  guru_id?: string | null;
  booking_id?: string | null;
  started_by_user_id?: string | null;
  subject?: string | null;
  status?: string | null;
  topic?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_message_at?: string | null;
  last_message_preview?: string | null;
};

type MessageRow = {
  id: string;
  conversation_id?: string | null;
  sender_id?: string | null;
  recipient_id?: string | null;
  content?: string | null;
  body?: string | null;
  message_type?: string | null;
  topic?: string | null;
  status?: string | null;
  read_at?: string | null;
  is_read?: boolean | null;
  is_deleted?: boolean | null;
  created_at?: string | null;
  edited_at?: string | null;
};

type ProfileRow = {
  id: string;
  full_name?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  profile_photo_url?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
  photo_url?: string | null;
  picture?: string | null;
  headshot_url?: string | null;
  profile_image_url?: string | null;
  profile_picture_url?: string | null;
  role?: string | null;
  user_role?: string | null;
  account_type?: string | null;
  type?: string | null;
};

type ConversationParticipantRow = {
  conversation_id: string;
  user_id: string;
  role?: string | null;
};

type AdminThreadCard = {
  id: string;
  subject: string;
  preview: string;
  href: string;
  type: "guru-customer" | "guru-admin" | "customer-admin" | "general";
  inquiryType: InquiryKey;
  inquiryLabel: string;
  lastActivity: string | null;
  customerName: string | null;
  customerAvatar: string;
  guruName: string | null;
  guruAvatar: string;
  adminName: string | null;
  adminAvatar: string;
  unreadCount: number;
  status: string;
  messageCount: number;
  topic: string;
};

type SafeAdminQueryResponse = {
  data: unknown;
  error: unknown;
};

type ChartItem = {
  label: string;
  value: number;
  helper?: string;
  href?: string;
};

const adminRoutes = {
  dashboard: "/admin",
  messages: "/admin/messages",
  customers: "/admin/customers",
  gurus: "/admin/gurus",
  bookings: "/admin/bookings",
};

const filterLinks = [
  { key: "all", label: "All", href: "/admin/messages" },
  {
    key: "guru-customer",
    label: "Guru ↔ Customer",
    href: "/admin/messages?filter=guru-customer",
  },
  {
    key: "guru-admin",
    label: "Guru ↔ Admin",
    href: "/admin/messages?filter=guru-admin",
  },
  {
    key: "customer-admin",
    label: "Customer ↔ Admin",
    href: "/admin/messages?filter=customer-admin",
  },
  { key: "unread", label: "Unread", href: "/admin/messages?filter=unread" },
  { key: "read", label: "Read", href: "/admin/messages?filter=read" },
  {
    key: "escalations",
    label: "Escalations",
    href: "/admin/messages?filter=escalations",
  },
];

const inquiryTypes: Array<{
  key: InquiryKey;
  label: string;
  description: string;
  href: string;
}> = [
  {
    key: "booking",
    label: "Booking Help",
    description: "Scheduling, confirmations, changes, and booking questions",
    href: "/admin/messages?inquiry=booking",
  },
  {
    key: "payment",
    label: "Payment / Refund",
    description: "Payments, failed charges, refunds, disputes, and payouts",
    href: "/admin/messages?inquiry=payment",
  },
  {
    key: "guru-support",
    label: "Guru Support",
    description: "Guru profile, payout, availability, and service questions",
    href: "/admin/messages?inquiry=guru-support",
  },
  {
    key: "customer-support",
    label: "Customer Support",
    description: "Pet parent account, care, and general customer questions",
    href: "/admin/messages?inquiry=customer-support",
  },
  {
    key: "safety",
    label: "Safety / Trust",
    description: "Safety, incidents, background checks, and urgent concerns",
    href: "/admin/messages?inquiry=safety",
  },
  {
    key: "technical",
    label: "Technical Issue",
    description: "Login, upload, app, page, or button problems",
    href: "/admin/messages?inquiry=technical",
  },
  {
    key: "partner",
    label: "Partner / Referral",
    description: "Partner, ambassador, affiliate, and referral questions",
    href: "/admin/messages?inquiry=partner",
  },
  {
    key: "general",
    label: "General Inquiry",
    description: "Other messages that do not match a specific issue type",
    href: "/admin/messages?inquiry=general",
  },
];

const chartColors = [
  "#166534",
  "#16a34a",
  "#22c55e",
  "#84cc16",
  "#0f766e",
  "#0ea5e9",
  "#8b5cf6",
  "#f59e0b",
];

const defaultAdminAvatar = "/images/sitguru-message-avatar.jpg";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getText(row: AnyRow | null | undefined, keys: string[], fallback = "") {
  if (!row) return fallback;

  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }

  return fallback;
}

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

function normalizeRole(role?: string | null) {
  const value = String(role || "").trim().toLowerCase();

  if (!value) return "";
  if (value === "provider" || value === "sitter") return "guru";
  if (value === "pet_parent" || value === "pet parent" || value === "client") {
    return "customer";
  }
  if (
    value === "admin" ||
    value === "super_admin" ||
    value === "super-admin" ||
    value === "site_admin" ||
    value === "site-admin" ||
    value === "admin_user" ||
    value === "admin-user"
  ) {
    return "admin";
  }

  return value;
}

function getProfileRole(profile?: ProfileRow | null) {
  if (!profile) return "";

  return normalizeRole(
    profile.role || profile.user_role || profile.account_type || profile.type,
  );
}

function getProfileName(profile?: ProfileRow | null) {
  if (!profile) return "SitGuru User";

  const candidate =
    profile.full_name ||
    profile.display_name ||
    (profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : null) ||
    profile.first_name ||
    profile.last_name ||
    profile.email?.split("@")[0] ||
    "SitGuru User";

  return String(candidate).trim() || "SitGuru User";
}

function getProfileAvatar(profile?: ProfileRow | null) {
  if (!profile) return "";

  return (
    profile.avatar_url ||
    profile.profile_photo_url ||
    profile.profile_picture_url ||
    profile.profile_image_url ||
    profile.photo_url ||
    profile.picture ||
    profile.headshot_url ||
    profile.image_url ||
    ""
  );
}

function getAdminAvatar(profile?: ProfileRow | null) {
  return getProfileAvatar(profile) || defaultAdminAvatar;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatRelativeTime(value?: string | null) {
  if (!value) return "No recent activity";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No recent activity";

  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.floor(diffMs / 1000 / 60);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

function getMessageBody(message?: MessageRow | null) {
  if (!message) return "";

  return asString(message.content) || asString(message.body);
}

function isUnreadMessage(message: MessageRow) {
  const status = asString(message.status).toLowerCase();

  if (message.is_read === false) return true;
  if (!message.read_at && status !== "read" && status !== "archived") {
    return true;
  }

  return false;
}

function getStoredInquiryType(
  conversation?: ConversationRow | null,
  message?: MessageRow | null,
): InquiryKey | "" {
  const raw = [
    conversation?.topic,
    message?.topic,
    message?.message_type,
  ]
    .filter(Boolean)
    .join(" ")
    .trim()
    .toLowerCase();

  if (!raw) return "";

  if (
    raw.includes("booking") ||
    raw.includes("schedule") ||
    raw.includes("application question")
  ) {
    return "booking";
  }

  if (
    raw.includes("payment") ||
    raw.includes("refund") ||
    raw.includes("payout") ||
    raw.includes("billing") ||
    raw.includes("dispute") ||
    raw.includes("stripe") ||
    raw.includes("stripe / payout")
  ) {
    return "payment";
  }

  if (
    raw.includes("identity") ||
    raw.includes("verification") ||
    raw.includes("background") ||
    raw.includes("safety") ||
    raw.includes("trust") ||
    raw.includes("incident")
  ) {
    return "safety";
  }

  if (
    raw.includes("technical") ||
    raw.includes("bug") ||
    raw.includes("login") ||
    raw.includes("upload") ||
    raw.includes("issue")
  ) {
    return "technical";
  }

  if (
    raw.includes("partner") ||
    raw.includes("referral") ||
    raw.includes("affiliate") ||
    raw.includes("ambassador")
  ) {
    return "partner";
  }

  if (raw.includes("guru") || raw.includes("sitter") || raw.includes("provider")) {
    return "guru-support";
  }

  if (
    raw.includes("customer") ||
    raw.includes("pet parent") ||
    raw.includes("client")
  ) {
    return "customer-support";
  }

  if (raw.includes("other")) return "general";

  return "";
}

function classifyInquiryType(
  conversation: ConversationRow | null,
  latestMessage: MessageRow | null,
  preview: string,
) {
  const storedType = getStoredInquiryType(conversation, latestMessage);
  if (storedType) return storedType;

  const search = [
    conversation?.subject,
    conversation?.status,
    conversation?.topic,
    conversation?.last_message_preview,
    latestMessage?.topic,
    latestMessage?.message_type,
    preview,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    search.includes("refund") ||
    search.includes("payment") ||
    search.includes("charge") ||
    search.includes("billing") ||
    search.includes("invoice") ||
    search.includes("dispute") ||
    search.includes("chargeback") ||
    search.includes("payout") ||
    search.includes("paid") ||
    search.includes("stripe")
  ) {
    return "payment";
  }

  if (
    search.includes("safety") ||
    search.includes("unsafe") ||
    search.includes("incident") ||
    search.includes("emergency") ||
    search.includes("concern") ||
    search.includes("background") ||
    search.includes("checkr") ||
    search.includes("trust") ||
    search.includes("identity") ||
    search.includes("verification") ||
    search.includes("report")
  ) {
    return "safety";
  }

  if (
    search.includes("login") ||
    search.includes("password") ||
    search.includes("bug") ||
    search.includes("error") ||
    search.includes("broken") ||
    search.includes("not working") ||
    search.includes("upload") ||
    search.includes("photo") ||
    search.includes("app") ||
    search.includes("website") ||
    search.includes("button") ||
    search.includes("technical")
  ) {
    return "technical";
  }

  if (
    search.includes("partner") ||
    search.includes("affiliate") ||
    search.includes("ambassador") ||
    search.includes("referral") ||
    search.includes("campaign") ||
    search.includes("reward") ||
    search.includes("network program")
  ) {
    return "partner";
  }

  if (
    search.includes("book") ||
    search.includes("booking") ||
    search.includes("schedule") ||
    search.includes("reschedule") ||
    search.includes("cancel") ||
    search.includes("appointment") ||
    search.includes("availability") ||
    search.includes("confirmed") ||
    search.includes("confirmation") ||
    search.includes("application question")
  ) {
    return "booking";
  }

  if (
    search.includes("guru") ||
    search.includes("sitter") ||
    search.includes("provider") ||
    search.includes("profile") ||
    search.includes("service area") ||
    search.includes("availability")
  ) {
    return "guru-support";
  }

  if (
    search.includes("customer") ||
    search.includes("pet parent") ||
    search.includes("client") ||
    search.includes("account") ||
    search.includes("pet") ||
    search.includes("care")
  ) {
    return "customer-support";
  }

  return "general";
}

function getInquiryLabel(key: InquiryKey) {
  return inquiryTypes.find((item) => item.key === key)?.label || "General Inquiry";
}

function getInquiryIcon(key: InquiryKey) {
  if (key === "booking") return <CalendarCheck size={22} />;
  if (key === "payment") return <CreditCard size={22} />;
  if (key === "guru-support") return <UsersRound size={22} />;
  if (key === "customer-support") return <UserRound size={22} />;
  if (key === "safety") return <ShieldCheck size={22} />;
  if (key === "technical") return <Wrench size={22} />;
  if (key === "partner") return <Handshake size={22} />;
  return <BadgeHelp size={22} />;
}

function isEscalationThread(thread: AdminThreadCard) {
  const search =
    `${thread.subject} ${thread.preview} ${thread.status} ${thread.topic}`.toLowerCase();

  return (
    thread.type === "guru-admin" ||
    thread.inquiryType === "payment" ||
    thread.inquiryType === "safety" ||
    search.includes("escalation") ||
    search.includes("refund") ||
    search.includes("payout") ||
    search.includes("dispute") ||
    search.includes("urgent") ||
    search.includes("support")
  );
}

function getThreadTypeLabel(type: AdminThreadCard["type"]) {
  if (type === "guru-admin") return "Guru ↔ Admin";
  if (type === "guru-customer") return "Guru ↔ Customer";
  if (type === "customer-admin") return "Customer ↔ Admin";
  return "General";
}

function getThreadTypeClasses(type: AdminThreadCard["type"]) {
  if (type === "guru-admin") {
    return "border-amber-200 bg-amber-100 text-amber-900";
  }

  if (type === "guru-customer") {
    return "border-emerald-200 bg-emerald-100 text-emerald-900";
  }

  if (type === "customer-admin") {
    return "border-sky-200 bg-sky-100 text-sky-900";
  }

  return "border-slate-200 bg-slate-100 text-slate-800";
}

function getInquiryClasses(type: InquiryKey) {
  if (type === "payment") return "border-orange-200 bg-orange-100 text-orange-900";
  if (type === "safety") return "border-rose-200 bg-rose-100 text-rose-900";
  if (type === "technical") return "border-violet-200 bg-violet-100 text-violet-900";
  if (type === "partner") return "border-cyan-200 bg-cyan-100 text-cyan-900";
  if (type === "booking") return "border-emerald-200 bg-emerald-100 text-emerald-900";
  if (type === "guru-support") return "border-lime-200 bg-lime-100 text-lime-900";
  if (type === "customer-support") return "border-sky-200 bg-sky-100 text-sky-900";
  return "border-slate-200 bg-slate-100 text-slate-800";
}

function filterButtonClasses(active: boolean) {
  return active
    ? "rounded-2xl bg-green-800 px-4 py-2.5 text-sm font-black text-white shadow-sm"
    : "rounded-2xl border border-green-200 bg-white px-4 py-2.5 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50";
}

function getThreadKeyFromMessage(message: MessageRow) {
  return message.conversation_id || `direct-message-${message.id}`;
}

function buildThreadTypeChart(threads: AdminThreadCard[]) {
  const types: Array<AdminThreadCard["type"]> = [
    "guru-customer",
    "guru-admin",
    "customer-admin",
    "general",
  ];

  return types
    .map((type) => {
      const matching = threads.filter((thread) => thread.type === type);

      return {
        label: getThreadTypeLabel(type),
        value: matching.length,
        helper: `${number(
          matching.reduce((sum, thread) => sum + thread.unreadCount, 0),
        )} unread`,
        href:
          type === "general"
            ? "/admin/messages"
            : `/admin/messages?filter=${type}`,
      };
    })
    .filter((item) => item.value > 0);
}

function buildInquiryChart(threads: AdminThreadCard[]) {
  return inquiryTypes
    .map((inquiry) => {
      const matching = threads.filter(
        (thread) => thread.inquiryType === inquiry.key,
      );

      return {
        label: inquiry.label,
        value: matching.length,
        helper: `${number(
          matching.reduce((sum, thread) => sum + thread.unreadCount, 0),
        )} unread · ${number(matching.filter(isEscalationThread).length)} review`,
        href: inquiry.href,
      };
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

function buildUnreadInquiryChart(threads: AdminThreadCard[]) {
  return inquiryTypes
    .map((inquiry) => {
      const matching = threads.filter(
        (thread) => thread.inquiryType === inquiry.key,
      );

      return {
        label: inquiry.label,
        value: matching.reduce((sum, thread) => sum + thread.unreadCount, 0),
        helper: `${number(matching.length)} threads`,
        href: `${inquiry.href}&filter=unread`,
      };
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

async function safeAdminQuery(
  query: PromiseLike<SafeAdminQueryResponse>,
  label: string,
): Promise<SafeAdminQueryResponse> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Admin messages query skipped for ${label}:`, result.error);
      return { data: [], error: null };
    }

    return result;
  } catch (error) {
    console.warn(`Admin messages query skipped for ${label}:`, error);
    return { data: [], error: null };
  }
}

function Avatar({
  name,
  src,
  icon,
  className = "h-11 w-11",
}: {
  name: string;
  src?: string | null;
  icon?: ReactNode;
  className?: string;
}) {
  if (src) {
    return (
      <img
        alt={name}
        src={src}
        className={`${className} shrink-0 rounded-full border border-green-100 object-cover shadow-sm`}
      />
    );
  }

  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center rounded-full border border-green-100 bg-green-50 text-xs font-black text-green-800 shadow-sm`}
    >
      {icon || getInitials(name) || "SG"}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-800 transition group-hover:bg-green-800 group-hover:text-white">
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-500">{detail}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="group rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      {content}
    </div>
  );
}

function InquiryStatCard({
  inquiry,
  value,
  unread,
  reviewCount,
}: {
  inquiry: (typeof inquiryTypes)[number];
  value: number;
  unread: number;
  reviewCount: number;
}) {
  return (
    <Link
      href={inquiry.href}
      className="group rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-800 transition group-hover:bg-green-800 group-hover:text-white">
        {getInquiryIcon(inquiry.key)}
      </div>

      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {inquiry.label}
      </p>

      <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
        {number(value)}
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-500">
        {number(unread)} unread · {number(reviewCount)} review
      </p>
    </Link>
  );
}

function DonutChart({
  title,
  total,
  items,
}: {
  title: string;
  total: number;
  items: ChartItem[];
}) {
  const safeTotal = items.reduce((sum, item) => sum + item.value, 0);
  let start = 0;

  const gradient =
    safeTotal > 0
      ? items
          .map((item, index) => {
            const size = (item.value / safeTotal) * 360;
            const end = start + size;
            const segment = `${chartColors[index % chartColors.length]} ${start}deg ${end}deg`;
            start = end;
            return segment;
          })
          .join(", ")
      : "#e5e7eb 0deg 360deg";

  return (
    <div className="grid items-center gap-5 sm:grid-cols-[180px_1fr] xl:grid-cols-1 2xl:grid-cols-[180px_1fr]">
      <div className="relative mx-auto h-[180px] w-[180px]">
        <div
          className="h-full w-full rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
        />
        <div className="absolute inset-[34px] flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
          <span className="text-3xl font-black text-slate-950">
            {number(total)}
          </span>
          <span className="text-xs font-bold text-slate-500">{title}</span>
        </div>
      </div>

      <div className="space-y-3">
        {items.length ? (
          items.map((item, index) => (
            <Link
              href={item.href || adminRoutes.messages}
              key={item.label}
              className="flex items-center justify-between gap-3 rounded-2xl p-2 text-sm font-bold transition hover:bg-green-50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{
                    backgroundColor: chartColors[index % chartColors.length],
                  }}
                />
                <div className="min-w-0">
                  <p className="truncate text-slate-700">{item.label}</p>
                  <p className="truncate text-xs text-slate-400">
                    {item.helper}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-slate-950">
                {number(item.value)}
              </span>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-500">
            No chart data yet.
          </div>
        )}
      </div>
    </div>
  );
}

function HorizontalBarChart({
  title,
  valueLabel,
  items,
  emptyLabel = "No chart data found yet.",
}: {
  title: string;
  valueLabel: string;
  items: ChartItem[];
  emptyLabel?: string;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 0);

  return (
    <div className="rounded-[24px] border border-[#edf3ee] bg-[#fbfcf9] p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-base font-black text-slate-950">{title}</h3>
        <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
          {valueLabel}
        </span>
      </div>

      <div className="space-y-4">
        {items.length ? (
          items.map((item, index) => {
            const width = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            const chart = (
              <>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">
                      {item.label}
                    </p>
                    {item.helper ? (
                      <p className="truncate text-xs font-bold text-slate-500">
                        {item.helper}
                      </p>
                    ) : null}
                  </div>

                  <p className="shrink-0 text-sm font-black text-green-800">
                    {number(item.value)}
                  </p>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-green-800"
                    style={{
                      width: `${Math.max(3, width)}%`,
                      backgroundColor: chartColors[index % chartColors.length],
                    }}
                  />
                </div>
              </>
            );

            if (item.href) {
              return (
                <Link
                  key={`${item.label}-${index}`}
                  href={item.href}
                  className="block rounded-2xl border border-transparent p-2 transition hover:border-green-100 hover:bg-white hover:shadow-sm"
                >
                  {chart}
                </Link>
              );
            }

            return <div key={`${item.label}-${index}`}>{chart}</div>;
          })
        ) : (
          <div className="rounded-2xl border border-white bg-white p-4 text-sm font-bold text-slate-500">
            {emptyLabel}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubblePreview({ thread }: { thread: AdminThreadCard }) {
  return (
    <Link
      href={thread.href}
      className="block rounded-[28px] border border-[#e3ece5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getThreadTypeClasses(
                thread.type,
              )}`}
            >
              {getThreadTypeLabel(thread.type)}
            </span>

            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getInquiryClasses(
                thread.inquiryType,
              )}`}
            >
              {thread.inquiryLabel}
            </span>

            {thread.topic ? (
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
                {thread.topic}
              </span>
            ) : null}

            {thread.unreadCount > 0 ? (
              <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-black text-green-800">
                {number(thread.unreadCount)} unread
              </span>
            ) : (
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">
                Read
              </span>
            )}

            {isEscalationThread(thread) ? (
              <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-black text-rose-800">
                Review
              </span>
            ) : null}

            <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
              {formatRelativeTime(thread.lastActivity)}
            </span>
          </div>

          <h2 className="truncate text-xl font-black text-slate-950">
            {thread.subject}
          </h2>

          <div className="mt-4 max-w-4xl rounded-[24px] bg-[#f8fbf6] p-4">
            <p className="line-clamp-3 text-sm font-semibold leading-6 text-slate-600">
              {thread.preview}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {thread.customerName ? (
              <ParticipantPill
                label="Customer"
                name={thread.customerName}
                avatar={thread.customerAvatar}
                icon={<UserRound size={16} />}
              />
            ) : null}

            {thread.guruName ? (
              <ParticipantPill
                label="Guru"
                name={thread.guruName}
                avatar={thread.guruAvatar}
                icon={<UsersRound size={16} />}
              />
            ) : null}

            {thread.adminName ? (
              <ParticipantPill
                label="Admin"
                name={thread.adminName}
                avatar={thread.adminAvatar}
                icon={<ShieldAlert size={16} />}
              />
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 lg:items-end">
          <span className="rounded-2xl border border-green-100 bg-[#f7faf4] px-4 py-3 text-sm font-black text-green-900">
            Open Thread →
          </span>
          <span className="text-xs font-bold text-slate-400">
            {number(thread.messageCount)} messages · Last activity{" "}
            {formatDate(thread.lastActivity)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function ParticipantPill({
  label,
  name,
  avatar,
  icon,
}: {
  label: string;
  name: string;
  avatar?: string;
  icon: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#edf3ee] bg-white px-3 py-2 shadow-sm">
      <Avatar name={name} src={avatar} icon={icon} className="h-7 w-7" />
      <span className="text-xs font-black text-slate-500">{label}:</span>
      <span className="max-w-[180px] truncate text-xs font-black text-slate-900">
        {name}
      </span>
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[28px] border border-dashed border-[#d7e4da] bg-white p-10 text-center shadow-sm">
      <MessageCircle className="mx-auto mb-3 text-slate-400" size={42} />
      <h2 className="text-xl font-black text-slate-950">
        No conversations found
      </h2>
      <p className="mt-2 text-sm font-semibold text-slate-500">
        There are no threads matching this search, filter, or inquiry type yet.
      </p>
    </div>
  );
}

export default async function AdminMessagesPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const activeFilter = params.filter || "all";
  const activeInquiry = (params.inquiry || "all") as InquiryKey | "all";
  const query = String(params.q || "").trim().toLowerCase();

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login");
  }

  const [
    adminProfileResult,
    conversationsResult,
    messagesResult,
    participantsResult,
  ] = await Promise.all([
    safeAdminQuery(
      supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle(),
      "admin profile",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("conversations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      "conversations",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000),
      "messages",
    ),
    safeAdminQuery(
      supabaseAdmin
        .from("conversation_participants")
        .select("*")
        .limit(5000),
      "conversation_participants",
    ),
  ]);

  const adminProfile = adminProfileResult.data as ProfileRow | null;

  const safeConversations = (
    (conversationsResult.data || []) as ConversationRow[]
  ).filter(Boolean);

  const safeMessages = ((messagesResult.data || []) as MessageRow[]).filter(
    (message) => Boolean(message) && message.is_deleted !== true,
  );

  const safeParticipants = (
    (participantsResult.data || []) as ConversationParticipantRow[]
  ).filter(Boolean);

  const conversationMap = new Map<string, ConversationRow>();

  safeConversations.forEach((conversation) => {
    if (conversation.id) conversationMap.set(conversation.id, conversation);
  });

  const threadMessageMap = new Map<string, MessageRow[]>();

  safeMessages.forEach((message) => {
    const threadKey = getThreadKeyFromMessage(message);
    const existing = threadMessageMap.get(threadKey) || [];
    existing.push(message);
    threadMessageMap.set(threadKey, existing);
  });

  const allThreadKeys = Array.from(
    new Set([
      ...safeConversations.map((conversation) => conversation.id),
      ...Array.from(threadMessageMap.keys()),
    ]),
  );

  const participantMap = new Map<string, ConversationParticipantRow[]>();

  safeParticipants.forEach((participant) => {
    const existing = participantMap.get(participant.conversation_id) || [];
    existing.push(participant);
    participantMap.set(participant.conversation_id, existing);
  });

  const profileIds = Array.from(
    new Set(
      [
        user.id,
        ...safeConversations.flatMap((conversation) => [
          conversation.customer_id || "",
          conversation.guru_id || "",
          conversation.started_by_user_id || "",
        ]),
        ...safeParticipants.map((participant) => participant.user_id || ""),
        ...safeMessages.flatMap((message) => [
          message.sender_id || "",
          message.recipient_id || "",
        ]),
      ].filter(Boolean),
    ),
  );

  const profilesResult = profileIds.length
    ? await safeAdminQuery(
        supabaseAdmin
          .from("profiles")
          .select("*")
          .in("id", profileIds)
          .limit(5000),
        "profiles",
      )
    : { data: [], error: null };

  const profileMap = new Map<string, ProfileRow>();

  ((profilesResult.data || []) as ProfileRow[]).forEach((profile) => {
    if (profile.id) profileMap.set(profile.id, profile);
  });

  if (adminProfile?.id) {
    profileMap.set(adminProfile.id, adminProfile);
  }

  const allThreads: AdminThreadCard[] = allThreadKeys
    .map((threadKey) => {
      const conversation =
        conversationMap.get(threadKey) ||
        ({
          id: threadKey,
          subject: null,
          status: "open",
          created_at: null,
          updated_at: null,
          last_message_at: null,
          last_message_preview: null,
          topic: null,
        } as ConversationRow);

      const threadMessages = (threadMessageMap.get(threadKey) || []).sort(
        (a, b) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bTime - aTime;
        },
      );

      const latestMessage = threadMessages[0] || null;

      const participantsForConversation =
        participantMap.get(conversation.id) || [];

      const participantProfiles = participantsForConversation
        .map((participant) => profileMap.get(participant.user_id))
        .filter(Boolean) as ProfileRow[];

      const messageProfileIds = Array.from(
        new Set(
          threadMessages.flatMap((message) => [
            message.sender_id || "",
            message.recipient_id || "",
          ]),
        ),
      ).filter(Boolean);

      const messageProfiles = messageProfileIds
        .map((profileId) => profileMap.get(profileId))
        .filter(Boolean) as ProfileRow[];

      const allProfiles = [...participantProfiles, ...messageProfiles];

      const participantRoles = participantsForConversation.map((participant) =>
        normalizeRole(participant.role),
      );

      const hasAdminParticipant =
        participantRoles.includes("admin") ||
        allProfiles.some((profile) => getProfileRole(profile) === "admin") ||
        messageProfileIds.includes(user.id);

      const hasGuruParticipant =
        participantRoles.includes("guru") ||
        allProfiles.some((profile) => getProfileRole(profile) === "guru") ||
        Boolean(conversation.guru_id);

      const hasCustomerParticipant =
        participantRoles.includes("customer") ||
        allProfiles.some((profile) => getProfileRole(profile) === "customer") ||
        Boolean(conversation.customer_id);

      const subjectText = String(conversation.subject || "")
        .trim()
        .toLowerCase();
      const statusText = String(conversation.status || "")
        .trim()
        .toLowerCase();

      const looksLikeAdminSupport =
        subjectText.includes("admin") ||
        subjectText.includes("support") ||
        subjectText.includes("payout") ||
        subjectText.includes("refund") ||
        subjectText.includes("dispute") ||
        subjectText.includes("escalation") ||
        statusText.includes("escalation");

      let threadType: AdminThreadCard["type"] = "general";

      if (hasGuruParticipant && hasCustomerParticipant && !hasAdminParticipant) {
        threadType = "guru-customer";
      } else if (
        hasGuruParticipant &&
        (hasAdminParticipant || looksLikeAdminSupport)
      ) {
        threadType = "guru-admin";
      } else if (
        hasCustomerParticipant &&
        (hasAdminParticipant || looksLikeAdminSupport)
      ) {
        threadType = "customer-admin";
      } else if (hasAdminParticipant || looksLikeAdminSupport) {
        threadType = "customer-admin";
      }

      const guruProfile = conversation.guru_id
        ? profileMap.get(conversation.guru_id)
        : allProfiles.find((profile) => getProfileRole(profile) === "guru");

      const customerProfile = conversation.customer_id
        ? profileMap.get(conversation.customer_id)
        : allProfiles.find((profile) => getProfileRole(profile) === "customer");

      const adminDisplayProfile =
        allProfiles.find((profile) => getProfileRole(profile) === "admin") ||
        profileMap.get(user.id) ||
        adminProfile;

      const unreadCount = threadMessages.filter(isUnreadMessage).length;

      const preview =
        getMessageBody(latestMessage) ||
        String(conversation.last_message_preview || "").trim() ||
        "No messages yet.";

      const inquiryType = classifyInquiryType(
        conversation,
        latestMessage,
        preview,
      );

      const topic =
        asString(latestMessage?.topic) ||
        asString(conversation.topic) ||
        asString(latestMessage?.message_type);

      const subject =
        String(conversation.subject || "").trim() ||
        topic ||
        (threadType === "guru-admin"
          ? "Admin support conversation"
          : threadType === "guru-customer"
            ? "Customer care conversation"
            : "SitGuru conversation");

      return {
        id: conversation.id,
        subject,
        preview,
        href: `/admin/messages/${conversation.id}`,
        type: threadType,
        inquiryType,
        inquiryLabel: getInquiryLabel(inquiryType),
        lastActivity:
          latestMessage?.created_at ||
          conversation.last_message_at ||
          conversation.updated_at ||
          conversation.created_at ||
          null,
        customerName:
          hasCustomerParticipant || conversation.customer_id
            ? getProfileName(customerProfile || null)
            : null,
        customerAvatar: getProfileAvatar(customerProfile || null),
        guruName:
          hasGuruParticipant || conversation.guru_id
            ? getProfileName(guruProfile || null)
            : null,
        guruAvatar: getProfileAvatar(guruProfile || null),
        adminName:
          hasAdminParticipant || looksLikeAdminSupport
            ? getProfileName(adminDisplayProfile || null) || "Admin HQ"
            : null,
        adminAvatar: getAdminAvatar(adminDisplayProfile || null),
        unreadCount,
        status: conversation.status || "",
        messageCount: threadMessages.length,
        topic,
      };
    })
    .sort((a, b) => {
      const aTime = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
      const bTime = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
      return bTime - aTime;
    });

  const filteredThreads = allThreads.filter((thread) => {
    const searchText = [
      thread.subject,
      thread.preview,
      thread.type,
      thread.inquiryLabel,
      thread.topic,
      thread.customerName,
      thread.guruName,
      thread.adminName,
      thread.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (query && !searchText.includes(query)) return false;

    if (activeFilter === "unread" && thread.unreadCount <= 0) return false;
    if (activeFilter === "read" && thread.unreadCount > 0) return false;
    if (activeFilter === "escalations" && !isEscalationThread(thread)) {
      return false;
    }

    if (
      activeFilter !== "all" &&
      activeFilter !== "unread" &&
      activeFilter !== "read" &&
      activeFilter !== "escalations" &&
      thread.type !== activeFilter
    ) {
      return false;
    }

    if (activeInquiry !== "all" && thread.inquiryType !== activeInquiry) {
      return false;
    }

    return true;
  });

  const guruCustomerCount = allThreads.filter(
    (thread) => thread.type === "guru-customer",
  ).length;

  const guruAdminCount = allThreads.filter(
    (thread) => thread.type === "guru-admin",
  ).length;

  const customerAdminCount = allThreads.filter(
    (thread) => thread.type === "customer-admin",
  ).length;

  const unreadThreads = allThreads.filter(
    (thread) => thread.unreadCount > 0,
  ).length;

  const escalationThreads = allThreads.filter(isEscalationThread).length;

  const unreadMessages = allThreads.reduce(
    (sum, thread) => sum + thread.unreadCount,
    0,
  );

  const activeInquiryMeta =
    activeInquiry === "all"
      ? null
      : inquiryTypes.find((item) => item.key === activeInquiry);

  const inquiryChart = buildInquiryChart(allThreads);
  const unreadInquiryChart = buildUnreadInquiryChart(allThreads);
  const threadTypeChart = buildThreadTypeChart(allThreads);

  return (
    <main className="min-h-screen bg-[#f9faf5] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="flex flex-col justify-between gap-4 rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm lg:flex-row lg:items-end">
          <div>
            <Link
              href={adminRoutes.dashboard}
              className="mb-4 inline-flex items-center gap-2 text-sm font-black text-green-800 transition hover:text-green-950"
            >
              <ArrowLeft size={17} />
              Back to Admin Dashboard
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-800 text-white">
                <MessagesSquare size={26} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
                  Admin / Message Center Intelligence
                </p>
                <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-4xl">
                  Message Center
                </h1>
                <p className="mt-1 max-w-4xl text-base font-semibold text-slate-600">
                  Communicate across SitGuru while measuring what customers,
                  Gurus, admins, and partners are asking about so issues can be
                  spotted and reduced.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/admin/messages/export"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <Download size={17} />
              Export CSV
            </Link>

            <Link
              href={adminRoutes.customers}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <UserRound size={17} />
              Customers
            </Link>

            <Link
              href={adminRoutes.gurus}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <UsersRound size={17} />
              Gurus
            </Link>

            <Link
              href={adminRoutes.bookings}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
            >
              <Inbox size={18} />
              Bookings
            </Link>
          </div>
        </div>

        {(activeFilter !== "all" || activeInquiry !== "all" || query) ? (
          <section className="flex flex-col justify-between gap-4 rounded-[26px] border border-green-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-green-700">
                Active Drill-Down
              </p>
              <p className="mt-1 text-sm font-bold text-slate-600">
                Showing {number(filteredThreads.length)} of{" "}
                {number(allThreads.length)} threads
                {activeFilter !== "all" ? ` · Filter: ${activeFilter}` : ""}
                {activeInquiryMeta ? ` · Inquiry: ${activeInquiryMeta.label}` : ""}
                {query ? ` · Search: ${query}` : ""}
              </p>
            </div>

            <Link
              href={adminRoutes.messages}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
            >
              <X size={16} />
              Clear Drill-Down
            </Link>
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={<MessagesSquare size={22} />}
            label="Total Threads"
            value={number(allThreads.length)}
            detail={`${number(filteredThreads.length)} visible with filters`}
            href={adminRoutes.messages}
          />

          <StatCard
            icon={<UsersRound size={22} />}
            label="Guru ↔ Customer"
            value={number(guruCustomerCount)}
            detail="Customer care conversations"
            href="/admin/messages?filter=guru-customer"
          />

          <StatCard
            icon={<ShieldAlert size={22} />}
            label="Guru ↔ Admin"
            value={number(guruAdminCount)}
            detail="Admin support and Guru operations"
            href="/admin/messages?filter=guru-admin"
          />

          <StatCard
            icon={<UserRound size={22} />}
            label="Customer ↔ Admin"
            value={number(customerAdminCount)}
            detail="Customer support conversations"
            href="/admin/messages?filter=customer-admin"
          />

          <StatCard
            icon={<Clock3 size={22} />}
            label="Unread"
            value={number(unreadMessages)}
            detail={`${number(unreadThreads)} threads need attention`}
            href="/admin/messages?filter=unread"
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<ShieldAlert size={22} />}
            label="Escalations"
            value={number(escalationThreads)}
            detail="Refund, payout, dispute, support, or safety review"
            href="/admin/messages?filter=escalations"
          />

          <StatCard
            icon={<CheckCircle2 size={22} />}
            label="Read Threads"
            value={number(allThreads.length - unreadThreads)}
            detail="Threads without unread messages"
            href="/admin/messages?filter=read"
          />

          <StatCard
            icon={<MessageCircle size={22} />}
            label="Messages Loaded"
            value={number(safeMessages.length)}
            detail="Direct from Supabase messages table"
          />

          <StatCard
            icon={<UsersRound size={22} />}
            label="Participants"
            value={number(safeParticipants.length)}
            detail="Conversation participant rows"
          />
        </section>

        <section className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-black text-slate-950">
              Inquiry Type KPIs
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Measure what people are communicating about so SitGuru can reduce
              recurring booking, payment, safety, technical, and support issues.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {inquiryTypes.map((inquiry) => {
              const matching = allThreads.filter(
                (thread) => thread.inquiryType === inquiry.key,
              );
              const unread = matching.reduce(
                (sum, thread) => sum + thread.unreadCount,
                0,
              );
              const reviewCount = matching.filter(isEscalationThread).length;

              return (
                <InquiryStatCard
                  key={inquiry.key}
                  inquiry={inquiry}
                  value={matching.length}
                  unread={unread}
                  reviewCount={reviewCount}
                />
              );
            })}
          </div>
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-12">
          <div className="xl:col-span-4">
            <div className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <BarChart3 className="text-green-800" size={22} />
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Thread Type Mix
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Who is communicating with whom.
                  </p>
                </div>
              </div>

              <DonutChart
                title="Threads"
                total={allThreads.length}
                items={threadTypeChart}
              />
            </div>
          </div>

          <div className="xl:col-span-8">
            <div className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-black text-slate-950">
                  Message Intelligence Charts
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Drill into issue categories and unread work by inquiry type.
                </p>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <HorizontalBarChart
                  title="Threads by Inquiry Type"
                  valueLabel="Threads"
                  items={inquiryChart}
                />

                <HorizontalBarChart
                  title="Unread by Inquiry Type"
                  valueLabel="Unread"
                  items={unreadInquiryChart}
                  emptyLabel="No unread inquiry data found yet."
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Conversation Records
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Search, filter, drill down, and open admin-visible message
                threads.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {filterLinks.map((filter) => (
                <Link
                  key={filter.key}
                  href={filter.href}
                  className={filterButtonClasses(activeFilter === filter.key)}
                >
                  {filter.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-[#edf3ee] bg-[#fbfcf9] p-4">
            <form
              action={adminRoutes.messages}
              className="grid gap-3 xl:grid-cols-[1.3fr_1fr_auto_auto]"
            >
              {activeFilter !== "all" ? (
                <input type="hidden" name="filter" value={activeFilter} />
              ) : null}

              <label className="relative">
                <span className="sr-only">Search messages</span>
                <Search
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  name="q"
                  defaultValue={params.q || ""}
                  placeholder="Search subject, preview, customer, Guru, admin, topic..."
                  className="h-12 w-full rounded-2xl border border-green-100 bg-white pl-11 pr-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-green-300 focus:ring-4 focus:ring-green-100"
                />
              </label>

              <select
                name="inquiry"
                defaultValue={activeInquiry}
                className="h-12 w-full rounded-2xl border border-green-100 bg-white px-4 text-sm font-black text-slate-800 outline-none transition focus:border-green-300 focus:ring-4 focus:ring-green-100"
              >
                <option value="all">Inquiry Type: All</option>
                {inquiryTypes.map((inquiry) => (
                  <option key={inquiry.key} value={inquiry.key}>
                    Inquiry Type: {inquiry.label}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-green-800 px-5 text-sm font-black text-white transition hover:bg-green-900"
              >
                Search
              </button>

              <Link
                href={adminRoutes.messages}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-green-200 bg-white px-5 text-sm font-black text-green-900 transition hover:bg-green-50"
              >
                Reset
              </Link>
            </form>
          </div>
        </section>

        <section className="space-y-4">
          {filteredThreads.length ? (
            filteredThreads.map((thread) => (
              <MessageBubblePreview key={thread.id} thread={thread} />
            ))
          ) : (
            <EmptyState />
          )}
        </section>

        <div className="rounded-[26px] border border-green-100 bg-white p-4 text-sm font-semibold text-slate-500 shadow-sm">
          <span className="font-black text-green-900">
            Supabase coordination:
          </span>{" "}
          this page now reads directly from `messages` first, then connects
          matching rows from `conversations`, `conversation_participants`, and
          `profiles`. This fixes missing test messages when message rows exist
          but conversation data is incomplete. Inquiry type uses `topic`,
          `message_type`, subject, and message body to classify communication
          patterns.
        </div>
      </div>
    </main>
  );
}