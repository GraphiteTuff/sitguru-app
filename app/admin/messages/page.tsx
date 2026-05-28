import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  BadgeHelp,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  Handshake,
  Inbox,
  MessageCircle,
  MessagesSquare,
  Search,
  Send,
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
  | "direct"
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
  threadType?: string;
  recipientId?: string;
  recipientEmail?: string;
  recipientName?: string;
  recipientRole?: string;
  messageCategory?: string;
  department?: string;
  departmentLabel?: string;
  source?: string;
  ambassadorId?: string;
  ambassadorName?: string;
  ambassadorEmail?: string;
  referralCode?: string;
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
  sender_role?: string | null;
  recipient_role?: string | null;
  sender_name_snapshot?: string | null;
  sender_email_snapshot?: string | null;
  sender_phone_snapshot?: string | null;
  sender_role_snapshot?: string | null;
  recipient_name_snapshot?: string | null;
  recipient_email_snapshot?: string | null;
  recipient_phone_snapshot?: string | null;
  recipient_role_snapshot?: string | null;
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

type AdminAccessRow = {
  user_id?: string | null;
  email?: string | null;
  role_key?: string | null;
  department_key?: string | null;
  is_active?: boolean | string | null;
};

type AdminThreadCard = {
  id: string;
  subject: string;
  preview: string;
  href: string;
  type: "guru-customer" | "guru-admin" | "customer-admin" | "internal" | "general";
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
  users: "/admin/users",
  settings: "/admin/settings",
};

const filterLinks = [
  { key: "all", label: "All", href: "/admin/messages" },
  {
    key: "internal",
    label: "Internal HQ",
    href: "/admin/messages?filter=internal",
  },
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
    key: "direct",
    label: "Direct Message",
    description: "Clean one-to-one outreach between SitGuru and a specific person",
    href: "/admin/messages?inquiry=direct",
  },
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
    description: "Pet Parent account, care, and general customer questions",
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

const departmentShortcuts = [
  {
    key: "executive",
    label: "Executive / Founder",
    description: "CEO, founders, owners, and super users.",
  },
  {
    key: "billing_finance",
    label: "Billing & Finance",
    description: "Stripe, payouts, financial statements, NFCU/Plaid, and reconciliation.",
  },
  {
    key: "customer_service",
    label: "Customer Service",
    description: "Pet Parents, Gurus, bookings, messages, and support issues.",
  },
  {
    key: "trust_safety",
    label: "Trust & Safety",
    description: "Guru approvals, Checkr, screening, safety, and bookable readiness.",
  },
  {
    key: "tech_support",
    label: "Tech Support",
    description: "Logins, MFA, bugs, integrations, webhooks, and system health.",
  },
  {
    key: "sales_marketing",
    label: "Sales & Marketing",
    description: "Partners, affiliates, referrals, campaigns, and growth programs.",
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
const superAdminEmails = new Set(["jason@sitguru.com", "nette@sitguru.com"]);

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalBoolean(value: unknown) {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "1"].includes(normalized)) return true;
    if (["false", "no", "0"].includes(normalized)) return false;
  }

  return Boolean(value);
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
    value === "admin-user" ||
    value.includes("admin") ||
    value === "founder" ||
    value === "owner"
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

function shortenId(value?: string | null) {
  const cleanValue = String(value || "").trim();
  if (!cleanValue) return "";
  return cleanValue.length > 12
    ? `${cleanValue.slice(0, 8)}…${cleanValue.slice(-4)}`
    : cleanValue;
}

function getMessageSenderRole(message?: MessageRow | null) {
  return normalizeRole(
    message?.sender_role ||
      message?.sender_role_snapshot ||
      ""
  );
}

function getMessageRecipientRole(message?: MessageRow | null) {
  return normalizeRole(
    message?.recipient_role ||
      message?.recipient_role_snapshot ||
      ""
  );
}

function getSnapshotName({
  userId,
  role,
  messages,
  direction,
}: {
  userId: string;
  role: "customer" | "guru" | "admin" | "user";
  messages: MessageRow[];
  direction: "sender" | "recipient" | "either";
}) {
  for (const message of [...messages].reverse()) {
    const senderMatches = message.sender_id === userId;
    const recipientMatches = message.recipient_id === userId;

    if (
      (direction === "sender" || direction === "either") &&
      senderMatches &&
      message.sender_name_snapshot
    ) {
      return message.sender_name_snapshot;
    }

    if (
      (direction === "recipient" || direction === "either") &&
      recipientMatches &&
      message.recipient_name_snapshot
    ) {
      return message.recipient_name_snapshot;
    }
  }

  if (role === "customer") return `Archived Pet Parent ${shortenId(userId)}`;
  if (role === "guru") return `Archived Guru ${shortenId(userId)}`;
  if (role === "admin") return `SitGuru Admin ${shortenId(userId)}`;

  return `Archived SitGuru User ${shortenId(userId)}`;
}

function getSnapshotAvatar() {
  return "";
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
  const raw = [conversation?.topic, message?.topic, message?.message_type]
    .filter(Boolean)
    .join(" ")
    .trim()
    .toLowerCase();

  if (!raw) return "";

  if (
    raw.includes("direct") ||
    raw.includes("direct_message") ||
    raw.includes("direct message")
  ) {
    return "direct";
  }

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
    raw.includes("stripe")
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

  if (raw.includes("internal") || raw.includes("department")) return "general";
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
    search.includes("direct message") ||
    search.includes("direct_guru") ||
    search.includes("direct_customer") ||
    search.includes("direct_ambassador") ||
    search.includes("direct_admin") ||
    search.includes("direct_staff")
  ) {
    return "direct";
  }

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
    search.includes("technical") ||
    search.includes("webhook") ||
    search.includes("mfa")
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
    search.includes("confirmation")
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
  if (key === "direct") return <MessageCircle size={22} />;
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
  if (type === "internal") return "Internal HQ";
  if (type === "guru-admin") return "Guru ↔ Admin";
  if (type === "guru-customer") return "Guru ↔ Customer";
  if (type === "customer-admin") return "Customer ↔ Admin";
  return "General";
}

function getThreadTypeClasses(type: AdminThreadCard["type"]) {
  if (type === "internal") {
    return "border-violet-200 bg-violet-100 text-violet-900";
  }

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
  if (type === "direct") return "border-green-200 bg-green-100 text-green-900";
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
    "internal",
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

function getIntentFromParams(params: SearchParams) {
  const threadType = asString(params.threadType);
  const recipientId = asString(params.recipientId);
  const recipientEmail = asString(params.recipientEmail);
  const recipientName = asString(params.recipientName);
  const recipientRole = asString(params.recipientRole);
  const messageCategory = asString(params.messageCategory);
  const department = asString(params.department);
  const departmentLabel = asString(params.departmentLabel);
  const source = asString(params.source);
  const ambassadorId = asString(params.ambassadorId);
  const ambassadorName = asString(params.ambassadorName);
  const ambassadorEmail = asString(params.ambassadorEmail);
  const referralCode = asString(params.referralCode);

  if (
    !threadType &&
    !recipientId &&
    !recipientEmail &&
    !department &&
    !ambassadorId &&
    !ambassadorEmail
  ) {
    return null;
  }

  const isAmbassadorContext = Boolean(ambassadorId || ambassadorEmail || referralCode);

  return {
    threadType:
      threadType ||
      (department
        ? "internal_department"
        : isAmbassadorContext
          ? "ambassador_support"
          : "internal"),
    recipientId,
    recipientEmail: recipientEmail || ambassadorEmail,
    recipientName: recipientName || ambassadorName,
    recipientRole: recipientRole || (isAmbassadorContext ? "ambassador" : ""),
    messageCategory,
    department,
    departmentLabel,
    source,
    ambassadorId,
    ambassadorName,
    ambassadorEmail,
    referralCode,
    isDepartment: Boolean(department),
    isAmbassadorContext,
  };
}

function getDepartmentMessageHref(params: {
  department: string;
  departmentLabel: string;
}) {
  const query = new URLSearchParams({
    threadType: "internal_department",
    department: params.department,
    departmentLabel: params.departmentLabel,
  });

  return `/admin/messages?${query.toString()}`;
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

async function safeRows<T>(
  query: PromiseLike<SafeAdminQueryResponse>,
  label: string,
): Promise<T[]> {
  const result = await safeAdminQuery(query, label);

  return Array.isArray(result.data) ? (result.data as unknown as T[]) : [];
}

async function createInternalThread(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/admin/login");
  }

  const threadType = String(formData.get("threadType") || "internal").trim();
  const recipientId = String(formData.get("recipientId") || "").trim();
  const recipientEmail = String(formData.get("recipientEmail") || "").trim();
  const recipientName = String(formData.get("recipientName") || "").trim();
  const recipientRole = normalizeRole(
    String(formData.get("recipientRole") || "").trim(),
  );
  const messageCategory =
    String(formData.get("messageCategory") || "direct").trim() || "direct";
  const department = String(formData.get("department") || "").trim();
  const departmentLabel = String(formData.get("departmentLabel") || "").trim();
  const source = String(formData.get("source") || "").trim();
  const ambassadorId = String(formData.get("ambassadorId") || "").trim();
  const ambassadorName = String(formData.get("ambassadorName") || "").trim();
  const ambassadorEmail = String(formData.get("ambassadorEmail") || "").trim();
  const referralCode = String(formData.get("referralCode") || "").trim();

  const isDirectThread = threadType.startsWith("direct");
  const isGuruThread = recipientRole === "guru" || threadType === "direct_guru";
  const isCustomerThread =
    recipientRole === "customer" || threadType === "direct_customer";
  const isAmbassadorThread =
    threadType.startsWith("ambassador") ||
    threadType === "direct_ambassador" ||
    recipientRole === "ambassador" ||
    Boolean(ambassadorId || ambassadorEmail || referralCode);

  const recipientLabel =
    departmentLabel ||
    recipientName ||
    ambassadorName ||
    recipientEmail ||
    ambassadorEmail ||
    "SitGuru User";

  const categoryLabel = getInquiryLabel((messageCategory || "direct") as InquiryKey);
  const defaultSubject = departmentLabel
    ? `Internal Message: ${departmentLabel}`
    : `${categoryLabel}: SitGuru Admin ↔ ${recipientLabel}`;

  const subject = String(formData.get("subject") || "").trim() || defaultSubject;
  const body =
    String(formData.get("body") || "").trim() ||
    `Hi ${recipientLabel},\n\n`;

  const now = new Date().toISOString();
  const topic = isDirectThread
    ? "direct_message"
    : isAmbassadorThread
      ? "ambassador_support"
      : department
        ? "internal_department"
        : messageCategory || "internal";

  const preview = body.slice(0, 240);

  const conversationPayload: Record<string, unknown> = {
    subject,
    status: "open",
    topic,
    started_by_user_id: user.id,
    last_message_at: now,
    last_message_preview: preview,
    created_at: now,
    updated_at: now,
  };

  if (isGuruThread && recipientId) {
    conversationPayload.guru_id = recipientId;
  }

  if (isCustomerThread && recipientId) {
    conversationPayload.customer_id = recipientId;
  }

  const { data: conversation, error: conversationError } = await supabaseAdmin
    .from("conversations")
    .insert(conversationPayload)
    .select("id")
    .single();

  if (conversationError || !conversation?.id) {
    console.error("Message thread create failed:", conversationError);
    redirect(
      `/admin/messages?compose_error=${encodeURIComponent(
        conversationError?.message || "Could not create message thread.",
      )}`,
    );
  }

  const conversationId = String(conversation.id);

  const participantRows: ConversationParticipantRow[] = [
    {
      conversation_id: conversationId,
      user_id: user.id,
      role: superAdminEmails.has(String(user.email || "").toLowerCase())
        ? "admin"
        : "admin",
    },
  ];

  if (recipientId && recipientId !== user.id) {
    participantRows.push({
      conversation_id: conversationId,
      user_id: recipientId,
      role: recipientRole || "user",
    });
  }

  if (department) {
    const departmentMembers = await safeRows<AdminAccessRow>(
      supabaseAdmin
        .from("admin_user_access")
        .select("user_id,email,role_key,department_key,is_active")
        .eq("department_key", department)
        .limit(100),
      "admin_user_access_department_participants",
    );

    for (const member of departmentMembers) {
      const memberId = asString(member.user_id);
      const active =
        member.is_active === undefined ? true : getOptionalBoolean(member.is_active);

      if (!active || !memberId || memberId === user.id) continue;

      participantRows.push({
        conversation_id: conversationId,
        user_id: memberId,
        role: normalizeRole(member.role_key) || "admin",
      });
    }
  }

  const uniqueParticipants = Array.from(
    new Map(participantRows.map((row) => [row.user_id, row])).values(),
  );

  if (uniqueParticipants.length > 0) {
    const { error: participantError } = await supabaseAdmin
      .from("conversation_participants")
      .insert(uniqueParticipants);

    if (participantError) {
      console.warn("Message conversation participants skipped:", participantError);
    }
  }

  const { error: messageError } = await supabaseAdmin.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    recipient_id: recipientId || null,
    sender_role: "admin",
    recipient_role: recipientRole || null,
    sender_name_snapshot: user.email || "SitGuru Admin",
    sender_email_snapshot: user.email || null,
    sender_role_snapshot: "admin",
    recipient_name_snapshot: recipientLabel,
    recipient_email_snapshot: recipientEmail || ambassadorEmail || null,
    recipient_role_snapshot: recipientRole || null,
    content: body,
    body,
    message_type: threadType,
    topic,
    status: "unread",
    is_read: false,
    created_at: now,
  });

  if (messageError) {
    console.error("Message create failed:", messageError);
  }

  if (recipientId && recipientId !== user.id) {
    try {
      const { error: notificationError } = await supabaseAdmin
        .from("notifications")
        .insert({
          user_id: recipientId,
          title: "New SitGuru Message",
          body: preview || "You have a new message from SitGuru.",
          type: "message",
          href: `/messages/${conversationId}`,
          is_read: false,
          created_at: now,
        });

      if (notificationError) {
        console.warn("Message notification skipped:", notificationError);
      }
    } catch (notificationError) {
      console.warn("Message notification skipped:", notificationError);
    }
  }

  await supabaseAdmin.from("admin_audit_logs").insert({
    actor_id: user.id,
    actor_email: user.email || null,
    action: isDirectThread
      ? "direct_message_thread_created"
      : "message_thread_created",
    area: "admin.messages",
    target_type: "conversation",
    target_id: conversationId,
    metadata: {
      thread_type: threadType,
      message_category: messageCategory || null,
      recipient_id: recipientId || null,
      recipient_email: recipientEmail || null,
      recipient_name: recipientName || null,
      recipient_role: recipientRole || null,
      department: department || null,
      department_label: departmentLabel || null,
      source: source || null,
      ambassador_id: ambassadorId || null,
      ambassador_name: ambassadorName || null,
      ambassador_email: ambassadorEmail || null,
      referral_code: referralCode || null,
      super_admin_actor: superAdminEmails.has(
        String(user.email || "").toLowerCase(),
      ),
    },
    created_at: now,
  });

  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${conversationId}`);
  redirect(`/admin/messages/${conversationId}`);
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

function InternalComposer({
  intent,
}: {
  intent: NonNullable<ReturnType<typeof getIntentFromParams>>;
}) {
  const recipientLabel =
    intent.departmentLabel ||
    intent.recipientName ||
    intent.ambassadorName ||
    intent.recipientEmail ||
    intent.ambassadorEmail ||
    "SitGuru User";

  const normalizedRole = normalizeRole(intent.recipientRole);
  const defaultCategory = (intent.messageCategory || "direct") as InquiryKey;
  const categoryLabel = getInquiryLabel(defaultCategory);
  const isDirectThread = intent.threadType.startsWith("direct");
  const composerLabel = isDirectThread ? "Direct Message Draft" : "Message Draft";
  const submitLabel = isDirectThread ? "Start Direct Message" : "Start Message";

  const defaultSubject = intent.isAmbassadorContext
    ? `${categoryLabel}: SitGuru Admin ↔ ${recipientLabel}`
    : intent.isDepartment
      ? `Internal Message: ${recipientLabel}`
      : `${categoryLabel}: SitGuru Admin ↔ ${recipientLabel}`;

  const defaultBody = intent.isAmbassadorContext
    ? `Hi ${recipientLabel},\n\n`
    : intent.isDepartment
      ? `Hi ${recipientLabel},\n\n`
      : `Hi ${recipientLabel},\n\n`;

  return (
    <section className="rounded-[30px] border border-green-200 bg-green-50 p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
            {composerLabel}
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-green-950">
            Message {recipientLabel}
          </h2>
          <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-green-900">
            Choose a category, confirm the recipient, write the first message,
            and SitGuru will create a clean thread with unread status for the
            recipient. Direct messages start fresh and do not route into old
            support threads.
          </p>
        </div>

        <Link
          href="/admin/messages"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-100"
        >
          <X size={16} />
          Clear draft
        </Link>
      </div>

      <form action={createInternalThread} className="mt-5 grid gap-4">
        <input type="hidden" name="recipientId" value={intent.recipientId} />
        <input type="hidden" name="recipientEmail" value={intent.recipientEmail} />
        <input type="hidden" name="recipientName" value={intent.recipientName} />
        <input type="hidden" name="recipientRole" value={intent.recipientRole} />
        <input type="hidden" name="department" value={intent.department} />
        <input type="hidden" name="departmentLabel" value={intent.departmentLabel} />
        <input type="hidden" name="source" value={intent.source} />
        <input type="hidden" name="ambassadorId" value={intent.ambassadorId} />
        <input type="hidden" name="ambassadorName" value={intent.ambassadorName} />
        <input type="hidden" name="ambassadorEmail" value={intent.ambassadorEmail} />
        <input type="hidden" name="referralCode" value={intent.referralCode} />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
                  Who are you messaging?
                </span>
                <select
                  name="threadType"
                  defaultValue={intent.threadType || "internal"}
                  className="min-h-12 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
                >
                  <option value="direct_guru">Guru</option>
                  <option value="direct_customer">Pet Parent</option>
                  <option value="direct_ambassador">Ambassador</option>
                  <option value="internal_department">Internal Department</option>
                  <option value="internal">SitGuru Admin / Staff</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
                  Message category
                </span>
                <select
                  name="messageCategory"
                  defaultValue={defaultCategory}
                  className="min-h-12 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
                >
                  {inquiryTypes.map((inquiry) => (
                    <option key={inquiry.key} value={inquiry.key}>
                      {inquiry.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
                Subject
              </span>
              <input
                name="subject"
                defaultValue={defaultSubject}
                className="min-h-12 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
                Message
              </span>
              <textarea
                name="body"
                defaultValue={defaultBody}
                rows={7}
                className="rounded-2xl border border-green-200 bg-white px-4 py-3 text-base font-semibold leading-7 text-slate-900 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
              />
            </label>
          </div>

          <div className="rounded-[26px] border border-green-200 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Recipient
            </p>

            <div className="mt-3 flex items-center gap-3">
              <Avatar
                name={recipientLabel}
                src=""
                icon={
                  normalizedRole === "guru" ? (
                    <UsersRound size={18} />
                  ) : normalizedRole === "customer" ? (
                    <UserRound size={18} />
                  ) : (
                    <ShieldAlert size={18} />
                  )
                }
                className="h-12 w-12"
              />
              <div className="min-w-0">
                <p className="truncate text-xl font-black text-slate-950">
                  {recipientLabel}
                </p>
                <p className="truncate text-sm font-bold text-slate-500">
                  {normalizedRole || intent.departmentLabel || "SitGuru"}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 rounded-2xl bg-[#f8fbf6] p-4 text-sm font-semibold text-slate-600">
              {intent.recipientEmail ? <p>Email: {intent.recipientEmail}</p> : null}
              {intent.recipientRole ? <p>Role: {intent.recipientRole}</p> : null}
              {intent.department ? <p>Department: {intent.department}</p> : null}
              {intent.source ? <p>Source: {intent.source}</p> : null}
              {intent.ambassadorName ? <p>Ambassador: {intent.ambassadorName}</p> : null}
              {intent.ambassadorEmail ? <p>Ambassador Email: {intent.ambassadorEmail}</p> : null}
              {intent.referralCode ? <p>Referral Code: {intent.referralCode}</p> : null}
            </div>

            <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 p-4 text-xs font-bold leading-5 text-green-900">
              The first message will be saved as unread for the recipient and
              routed through SitGuru Messages with avatars and chat bubbles.
            </div>

            <button
              type="submit"
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
            >
              <Send size={17} />
              {submitLabel}
            </button>
          </div>
        </div>
      </form>
    </section>
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
  const composeIntent = getIntentFromParams(params);

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
    (message) => Boolean(message),
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

  const profilesResult =
    profileIds.length > 0
      ? await safeAdminQuery(
          supabaseAdmin.from("profiles").select("*").in("id", profileIds),
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

  const allThreads: AdminThreadCard[] = allThreadKeys.map((threadKey) => {
    const conversation = conversationMap.get(threadKey) || null;
    const messages = (threadMessageMap.get(threadKey) || []).sort((a, b) => {
      const aTime = new Date(a.created_at || "").getTime();
      const bTime = new Date(b.created_at || "").getTime();

      return (
        (Number.isFinite(aTime) ? aTime : 0) -
        (Number.isFinite(bTime) ? bTime : 0)
      );
    });

    const latestMessage = messages[messages.length - 1] || null;
    const preview =
      conversation?.last_message_preview ||
      getMessageBody(latestMessage) ||
      "No message preview available yet.";
    const lastActivity =
      conversation?.last_message_at ||
      conversation?.updated_at ||
      latestMessage?.created_at ||
      conversation?.created_at ||
      null;
    const participants = participantMap.get(threadKey) || [];
    const participantRoleMap = new Map(
      participants.map((participant) => [
        participant.user_id,
        normalizeRole(participant.role),
      ]),
    );

    const customerId =
      conversation?.customer_id ||
      participants.find((participant) => normalizeRole(participant.role) === "customer")
        ?.user_id ||
      messages.find((message) => {
        const senderRole =
          getProfileRole(profileMap.get(message.sender_id || "")) ||
          getMessageSenderRole(message);
        return senderRole === "customer";
      })?.sender_id ||
      messages.find((message) => {
        const recipientRole =
          getProfileRole(profileMap.get(message.recipient_id || "")) ||
          getMessageRecipientRole(message);
        return recipientRole === "customer";
      })?.recipient_id ||
      "";
    const guruId =
      conversation?.guru_id ||
      participants.find((participant) => normalizeRole(participant.role) === "guru")
        ?.user_id ||
      messages.find((message) => {
        const senderRole =
          getProfileRole(profileMap.get(message.sender_id || "")) ||
          getMessageSenderRole(message);
        return senderRole === "guru";
      })?.sender_id ||
      messages.find((message) => {
        const recipientRole =
          getProfileRole(profileMap.get(message.recipient_id || "")) ||
          getMessageRecipientRole(message);
        return recipientRole === "guru";
      })?.recipient_id ||
      "";
    const adminId =
      participants.find((participant) => normalizeRole(participant.role) === "admin")
        ?.user_id ||
      messages.find((message) => {
        const senderRole =
          getProfileRole(profileMap.get(message.sender_id || "")) ||
          getMessageSenderRole(message);
        return senderRole === "admin" || message.sender_id === user.id;
      })?.sender_id ||
      messages.find((message) => {
        const recipientRole =
          getProfileRole(profileMap.get(message.recipient_id || "")) ||
          getMessageRecipientRole(message);
        return recipientRole === "admin";
      })?.recipient_id ||
      conversation?.started_by_user_id ||
      ""; 

    const customerProfile = customerId ? profileMap.get(customerId) || null : null;
    const guruProfile = guruId ? profileMap.get(guruId) || null : null;
    const adminProfileForThread = adminId ? profileMap.get(adminId) || null : null;
    const topic = conversation?.topic || latestMessage?.topic || latestMessage?.message_type || "";
    const normalizedTopic = topic.toLowerCase();
    const subject = conversation?.subject || "SitGuru Message Thread";

    let type: AdminThreadCard["type"] = "general";

    if (
      normalizedTopic.includes("internal") ||
      subject.toLowerCase().includes("internal message")
    ) {
      type = "internal";
    } else if (customerId && guruId && !adminId) {
      type = "guru-customer";
    } else if (guruId && adminId) {
      type = "guru-admin";
    } else if (customerId && adminId) {
      type = "customer-admin";
    } else if (adminId && !customerId && !guruId) {
      type = "internal";
    }

    const inquiryType = classifyInquiryType(conversation, latestMessage, preview);

    const unreadCount = messages.filter(isUnreadMessage).length;

    const status =
      conversation?.status ||
      latestMessage?.status ||
      (unreadCount > 0 ? "Unread" : "Open");

    return {
      id: threadKey,
      subject,
      preview,
      href: `${adminRoutes.messages}/${encodeURIComponent(threadKey)}`,
      type,
      inquiryType,
      inquiryLabel: getInquiryLabel(inquiryType),
      lastActivity,
      customerName: customerId
        ? customerProfile
          ? getProfileName(customerProfile)
          : getSnapshotName({
              userId: customerId,
              role: "customer",
              messages,
              direction: "either",
            })
        : null,
      customerAvatar: customerProfile
        ? getProfileAvatar(customerProfile)
        : getSnapshotAvatar(),
      guruName: guruId
        ? guruProfile
          ? getProfileName(guruProfile)
          : getSnapshotName({
              userId: guruId,
              role: "guru",
              messages,
              direction: "either",
            })
        : null,
      guruAvatar: guruProfile ? getProfileAvatar(guruProfile) : getSnapshotAvatar(),
      adminName: adminId
        ? adminProfileForThread
          ? getProfileName(adminProfileForThread)
          : getSnapshotName({
              userId: adminId,
              role: "admin",
              messages,
              direction: "either",
            })
        : null,
      adminAvatar: adminProfileForThread
        ? getAdminAvatar(adminProfileForThread)
        : defaultAdminAvatar,
      unreadCount,
      status,
      messageCount: messages.length,
      topic,
    };
  });

  const filteredThreads = allThreads
    .filter((thread) => {
      if (activeFilter === "unread") return thread.unreadCount > 0;
      if (activeFilter === "read") return thread.unreadCount === 0;
      if (activeFilter === "escalations") return isEscalationThread(thread);
      if (
        ["internal", "guru-customer", "guru-admin", "customer-admin", "general"].includes(
          activeFilter,
        )
      ) {
        return thread.type === activeFilter;
      }

      return true;
    })
    .filter((thread) => {
      if (activeInquiry === "all") return true;
      return thread.inquiryType === activeInquiry;
    })
    .filter((thread) => {
      if (!query) return true;

      const haystack = [
        thread.subject,
        thread.preview,
        thread.customerName,
        thread.guruName,
        thread.adminName,
        thread.inquiryLabel,
        thread.status,
        thread.topic,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    })
    .sort((a, b) => {
      const aTime = new Date(a.lastActivity || "").getTime();
      const bTime = new Date(b.lastActivity || "").getTime();

      return (
        (Number.isFinite(bTime) ? bTime : 0) -
        (Number.isFinite(aTime) ? aTime : 0)
      );
    });

  const unreadMessages = allThreads.reduce(
    (sum, thread) => sum + thread.unreadCount,
    0,
  );
  const unreadThreads = allThreads.filter((thread) => thread.unreadCount > 0).length;
  const escalationThreads = allThreads.filter(isEscalationThread).length;
  const internalThreads = allThreads.filter((thread) => thread.type === "internal").length;
  const threadTypeChart = buildThreadTypeChart(allThreads);
  const inquiryChart = buildInquiryChart(allThreads);
  const unreadInquiryChart = buildUnreadInquiryChart(allThreads);

  return (
    <main className="min-h-screen bg-[#f9faf5] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <section className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <Link
                href={adminRoutes.dashboard}
                className="mb-4 inline-flex items-center gap-2 text-sm font-black text-green-800 transition hover:text-green-950"
              >
                ← Back to Admin Dashboard
              </Link>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-800 text-white">
                  <MessagesSquare size={26} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
                    Admin / Message Center
                  </p>
                  <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-4xl">
                    SitGuru Message Center
                  </h1>
                  <p className="mt-1 max-w-4xl text-base font-semibold text-slate-600">
                    Manage customer, Guru, support, safety, payment, technical,
                    partner, and internal HQ conversations from one Admin inbox. Message history stays visible even when a Pet Parent or Guru profile is archived, hidden, or no longer available.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={adminRoutes.users}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
              >
                <UsersRound size={17} />
                User Directory
              </Link>

              <Link
                href="/admin/messages/export"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
              >
                <Download size={17} />
                Export
              </Link>

              <Link
                href="/admin/messages?threadType=internal&messageCategory=direct"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
              >
                <Send size={17} />
                Start Message
              </Link>
            </div>
          </div>
        </section>

        {composeIntent ? <InternalComposer intent={composeIntent} /> : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={<Inbox size={22} />}
            label="Threads"
            value={number(allThreads.length)}
            detail={`${number(filteredThreads.length)} visible with current filters`}
            href="/admin/messages"
          />
          <StatCard
            icon={<Clock3 size={22} />}
            label="Unread"
            value={number(unreadMessages)}
            detail={`${number(unreadThreads)} threads need attention`}
            href="/admin/messages?filter=unread"
          />
          <StatCard
            icon={<ShieldAlert size={22} />}
            label="Escalations"
            value={number(escalationThreads)}
            detail="Refund, payout, dispute, support, or safety review"
            href="/admin/messages?filter=escalations"
          />
          <StatCard
            icon={<MessagesSquare size={22} />}
            label="Internal HQ"
            value={number(internalThreads)}
            detail="Department and staff conversations"
            href="/admin/messages?filter=internal"
          />
          <StatCard
            icon={<MessageCircle size={22} />}
            label="Messages Loaded"
            value={number(safeMessages.length)}
            detail="Direct from Supabase messages table"
          />
        </section>

        <section className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                HQ Department Messaging
              </h2>
              <p className="mt-1 max-w-4xl text-sm font-semibold text-slate-500">
                Start internal conversations with SitGuru departments directly
                from the Message Center.
              </p>
            </div>

            <Link
              href={adminRoutes.settings}
              className="inline-flex items-center justify-center rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-black text-green-900 transition hover:bg-green-100"
            >
              Manage HQ Access
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {departmentShortcuts.map((department) => (
              <Link
                key={department.key}
                href={getDepartmentMessageHref({
                  department: department.key,
                  departmentLabel: department.label,
                })}
                className="rounded-[24px] border border-[#edf3ee] bg-[#fbfcf9] p-4 transition hover:border-green-200 hover:bg-green-50"
              >
                <h3 className="text-lg font-black text-slate-950">
                  {department.label}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  {department.description}
                </p>
                <p className="mt-4 text-sm font-black text-green-800">
                  Message department →
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-12">
          <div className="xl:col-span-4">
            <div className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-black text-slate-950">
                  Thread Types
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Conversation mix by operational relationship.
                </p>
              </div>

              <HorizontalBarChart
                title="Thread Mix"
                valueLabel="Threads"
                items={threadTypeChart}
              />
            </div>
          </div>

          <div className="xl:col-span-8">
            <div className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-black text-slate-950">
                  Inquiry Type KPIs
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Measure what people are communicating about so SitGuru can
                  reduce recurring booking, payment, safety, technical, and
                  support issues.
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
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Message Queues
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Filter by thread type, unread status, escalation level, inquiry
                type, or search terms.
              </p>
            </div>

            <form className="flex w-full max-w-xl items-center gap-2 rounded-2xl border border-[#e3ece5] bg-white px-4 py-3 shadow-sm">
              <Search size={17} className="text-slate-400" />
              <input
                name="q"
                defaultValue={params.q || ""}
                placeholder="Search messages, names, subjects..."
                className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
              />
              {activeFilter !== "all" ? (
                <input type="hidden" name="filter" value={activeFilter} />
              ) : null}
              {activeInquiry !== "all" ? (
                <input type="hidden" name="inquiry" value={activeInquiry} />
              ) : null}
            </form>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
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

          <div className="grid gap-4">
            {filteredThreads.length ? (
              filteredThreads.map((thread) => (
                <MessageBubblePreview key={thread.id} thread={thread} />
              ))
            ) : (
              <EmptyState />
            )}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-black text-slate-950">
                Inquiry Distribution
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Threads grouped by business function.
              </p>
            </div>

            <HorizontalBarChart
              title="Inquiry Types"
              valueLabel="Threads"
              items={inquiryChart}
            />
          </div>

          <div className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-black text-slate-950">
                Unread Priority
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Unread messages grouped by inquiry type.
              </p>
            </div>

            <HorizontalBarChart
              title="Unread by Type"
              valueLabel="Unread"
              items={unreadInquiryChart}
              emptyLabel="No unread message queues found."
            />
          </div>
        </section>

        <div className="rounded-[26px] border border-green-100 bg-white p-4 text-sm font-semibold text-slate-500 shadow-sm">
          <span className="font-black text-green-900">
            Supabase coordination:
          </span>{" "}
          this page reads `conversations`, `messages`,
          `conversation_participants`, and `profiles`. Internal HQ messaging is
          created from User Directory or department shortcuts and writes new
          rows back to `conversations`, `conversation_participants`, and
          `messages`. Message rows are treated as permanent support history and
          should not be deleted during Pet Parent or Guru cleanup.
        </div>
      </div>
    </main>
  );
}
