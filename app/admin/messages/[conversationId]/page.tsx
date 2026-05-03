import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeHelp,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  CreditCard,
  Handshake,
  MessageCircle,
  MessagesSquare,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  UsersRound,
  Wrench,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import AdminMessageComposer from "@/components/AdminMessageComposer";
import MessageAutoRefresh from "@/components/MessageAutoRefresh";

export const dynamic = "force-dynamic";

const SITGURU_MESSAGE_AVATAR_URL = "/images/sitguru-message-avatar.jpg";

type InquiryKey =
  | "booking"
  | "payment"
  | "guru-support"
  | "customer-support"
  | "safety"
  | "technical"
  | "partner"
  | "general";

type AnyRow = Record<string, unknown>;

type ConversationRow = {
  id: string;
  customer_id?: string | null;
  guru_id?: string | null;
  booking_id?: string | null;
  started_by_user_id?: string | null;
  subject?: string | null;
  topic?: string | null;
  status?: string | null;
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
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  profile_photo_url?: string | null;
  avatar_url?: string | null;
  profile_picture_url?: string | null;
  profile_image_url?: string | null;
  photo_url?: string | null;
  picture?: string | null;
  headshot_url?: string | null;
  image_url?: string | null;
  role?: string | null;
  user_role?: string | null;
  account_type?: string | null;
  type?: string | null;
};

type GuruProfileRow = {
  id?: string | number | null;
  user_id?: string | null;
  email?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  profile_photo_url?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
  photo_url?: string | null;
  profile_image_url?: string | null;
  headshot_url?: string | null;
};

type ConversationParticipantRow = {
  conversation_id?: string | null;
  user_id?: string | null;
  role?: string | null;
};

type ParticipantCard = {
  id: string;
  role: string;
  label: string;
  name: string;
  avatarUrl: string | null;
  href: string;
};

type SafeAdminQueryResponse = {
  data: unknown;
  error: unknown;
};

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

function getReadableRole(role?: string | null) {
  const normalized = normalizeRole(role);

  if (normalized === "admin") return "Admin";
  if (normalized === "guru") return "Guru";
  if (normalized === "customer") return "Customer";

  return "User";
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
    profile.name ||
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

function getGuruAvatar(guru?: GuruProfileRow | null) {
  if (!guru) return "";

  return (
    guru.profile_photo_url ||
    guru.avatar_url ||
    guru.profile_image_url ||
    guru.photo_url ||
    guru.headshot_url ||
    guru.image_url ||
    ""
  );
}

function mergeGuruProfilePhoto(
  profile: ProfileRow | null,
  guru?: GuruProfileRow | null,
): ProfileRow | null {
  if (!profile && !guru?.user_id) return profile;

  const guruAvatar = getGuruAvatar(guru);

  if (!guru) return profile;

  return {
    id: String(profile?.id || guru.user_id || ""),
    full_name:
      profile?.full_name ||
      guru.full_name ||
      guru.display_name ||
      guru.name ||
      [guru.first_name, guru.last_name].filter(Boolean).join(" ").trim() ||
      guru.email?.split("@")[0] ||
      "SitGuru User",
    display_name:
      profile?.display_name ||
      guru.display_name ||
      guru.full_name ||
      guru.name ||
      null,
    name: profile?.name || guru.name || guru.full_name || guru.display_name || null,
    first_name: profile?.first_name || guru.first_name || null,
    last_name: profile?.last_name || guru.last_name || null,
    email: profile?.email || guru.email || null,
    profile_photo_url: profile?.profile_photo_url || guruAvatar || null,
    avatar_url: profile?.avatar_url || guru.avatar_url || null,
    profile_image_url: profile?.profile_image_url || guru.profile_image_url || null,
    photo_url: profile?.photo_url || guru.photo_url || null,
    headshot_url: profile?.headshot_url || guru.headshot_url || null,
    image_url: profile?.image_url || guru.image_url || null,
    role: profile?.role || "guru",
    user_role: profile?.user_role || "guru",
    account_type: profile?.account_type || "guru",
    type: profile?.type || "guru",
  };
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "SG"
  );
}

function getFirstName(name?: string | null) {
  const safeName = String(name || "").trim();
  return safeName.split(/\s+/)[0] || "User";
}

function getMessageContent(message?: MessageRow | null) {
  return String(message?.content || message?.body || "").trim();
}

function isUnreadMessage(message: MessageRow) {
  const status = asString(message.status).toLowerCase();

  if (message.is_read === false) return true;
  if (!message.read_at && status !== "read" && status !== "archived") {
    return true;
  }

  return false;
}

function formatMessageTime(value?: string | null) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatLongDateTime(value?: string | null) {
  if (!value) return "No recent activity";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No recent activity";

  return parsed.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

  if (raw.includes("other")) return "general";

  return "";
}

function classifyInquiryType(
  conversation: ConversationRow | null,
  latestMessage: MessageRow | null,
  preview: string,
): InquiryKey {
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
  if (key === "booking") return "Booking Help";
  if (key === "payment") return "Payment / Refund";
  if (key === "guru-support") return "Guru Support";
  if (key === "customer-support") return "Customer Support";
  if (key === "safety") return "Safety / Trust";
  if (key === "technical") return "Technical Issue";
  if (key === "partner") return "Partner / Referral";
  return "General Inquiry";
}

function getInquiryIcon(key: InquiryKey) {
  if (key === "booking") return <CalendarCheck size={18} />;
  if (key === "payment") return <CreditCard size={18} />;
  if (key === "guru-support") return <UsersRound size={18} />;
  if (key === "customer-support") return <UserRound size={18} />;
  if (key === "safety") return <ShieldCheck size={18} />;
  if (key === "technical") return <Wrench size={18} />;
  if (key === "partner") return <Handshake size={18} />;
  return <BadgeHelp size={18} />;
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

function getThreadType({
  conversation,
  messages,
  participantRoleMap,
  profileMap,
  currentAdminId,
}: {
  conversation: ConversationRow | null;
  messages: MessageRow[];
  participantRoleMap: Map<string, string>;
  profileMap: Map<string, ProfileRow>;
  currentAdminId: string;
}) {
  const roles = new Set<string>();

  for (const role of participantRoleMap.values()) {
    const normalized = normalizeRole(role);
    if (normalized) roles.add(normalized);
  }

  for (const message of messages) {
    const ids = [message.sender_id || "", message.recipient_id || ""].filter(Boolean);

    for (const id of ids) {
      if (id === currentAdminId) roles.add("admin");

      const profileRole = getProfileRole(profileMap.get(id));
      if (profileRole) roles.add(profileRole);
    }
  }

  if (conversation?.customer_id) roles.add("customer");
  if (conversation?.guru_id) roles.add("guru");

  const search = `${conversation?.subject || ""} ${conversation?.status || ""}`.toLowerCase();
  const looksLikeAdminSupport =
    search.includes("admin") ||
    search.includes("support") ||
    search.includes("payout") ||
    search.includes("refund") ||
    search.includes("dispute") ||
    search.includes("escalation");

  const hasAdmin = roles.has("admin") || looksLikeAdminSupport;
  const hasGuru = roles.has("guru");
  const hasCustomer = roles.has("customer");

  if (hasGuru && hasCustomer && !hasAdmin) return "Guru ↔ Customer";
  if (hasGuru && hasAdmin) return "Guru ↔ Admin";
  if (hasCustomer && hasAdmin) return "Customer ↔ Admin";
  if (hasAdmin) return "Admin Conversation";

  return "General Conversation";
}

function getSenderRole({
  senderId,
  currentAdminId,
  conversation,
  participantRoleMap,
  profile,
}: {
  senderId: string;
  currentAdminId: string;
  conversation: ConversationRow | null;
  participantRoleMap: Map<string, string>;
  profile?: ProfileRow | null;
}) {
  if (senderId === currentAdminId) return "admin";

  const participantRole = normalizeRole(participantRoleMap.get(senderId));
  if (participantRole) return participantRole;

  const profileRole = getProfileRole(profile);
  if (profileRole) return profileRole;

  if (senderId && senderId === conversation?.customer_id) return "customer";
  if (senderId && senderId === conversation?.guru_id) return "guru";

  return "customer";
}

function getMessageAvatarUrl({
  senderRole,
  profileImageUrl,
}: {
  senderRole?: string | null;
  profileImageUrl?: string | null;
}) {
  const normalized = normalizeRole(senderRole);

  if (normalized === "admin") {
    return profileImageUrl || SITGURU_MESSAGE_AVATAR_URL;
  }

  return profileImageUrl || null;
}

async function safeAdminQuery(
  query: PromiseLike<SafeAdminQueryResponse>,
  label: string,
): Promise<SafeAdminQueryResponse> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Admin message thread query skipped for ${label}:`, result.error);
      return { data: [], error: null };
    }

    return result;
  } catch (error) {
    console.warn(`Admin message thread query skipped for ${label}:`, error);
    return { data: [], error: null };
  }
}

function Avatar({
  name,
  imageUrl,
  compact = false,
}: {
  name: string;
  imageUrl?: string | null;
  compact?: boolean;
}) {
  const sizeClasses = compact
    ? "h-10 w-10 rounded-2xl text-xs"
    : "h-12 w-12 rounded-2xl text-sm";

  if (imageUrl) {
    return (
      <div
        className={`${sizeClasses} shrink-0 overflow-hidden border border-green-100 bg-white shadow-sm`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`flex ${sizeClasses} shrink-0 items-center justify-center border border-green-100 bg-green-50 font-black text-green-800 shadow-sm`}
    >
      {getInitials(name)}
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e3ece5] bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        <span className="text-green-800">{icon}</span>
        {label}
      </div>
      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function ParticipantPill({ participant }: { participant: ParticipantCard }) {
  return (
    <Link
      href={participant.href}
      className="inline-flex items-center gap-3 rounded-2xl border border-[#e3ece5] bg-white px-4 py-3 shadow-sm transition hover:border-green-200 hover:bg-green-50"
    >
      <Avatar name={participant.name} imageUrl={participant.avatarUrl} compact />
      <div className="min-w-0">
        <p className="max-w-[210px] truncate text-sm font-black text-slate-950">
          {participant.name}
        </p>
        <p className="text-xs font-bold text-slate-500">{participant.label}</p>
      </div>
    </Link>
  );
}

function MessageBubble({
  message,
  currentAdminId,
  conversation,
  participantRoleMap,
  profileMap,
}: {
  message: MessageRow;
  currentAdminId: string;
  conversation: ConversationRow | null;
  participantRoleMap: Map<string, string>;
  profileMap: Map<string, ProfileRow>;
}) {
  const senderId = String(message.sender_id || "").trim();
  const senderProfile = senderId ? profileMap.get(senderId) || null : null;

  const senderRole = getSenderRole({
    senderId,
    currentAdminId,
    conversation,
    participantRoleMap,
    profile: senderProfile,
  });

  const normalizedRole = normalizeRole(senderRole);
  const isAdminMessage = senderId === currentAdminId || normalizedRole === "admin";
  const senderName =
    normalizedRole === "admin" ? "SitGuru Admin" : getProfileName(senderProfile);
  const senderImageUrl = getMessageAvatarUrl({
    senderRole,
    profileImageUrl: getProfileAvatar(senderProfile),
  });

  const roleLabel =
    normalizedRole === "guru"
      ? `${getFirstName(senderName)} · Guru`
      : getReadableRole(senderRole);

  const topic = asString(message.topic) || asString(message.message_type);
  const content = getMessageContent(message) || "Message content unavailable.";

  return (
    <article
      className={`flex w-full items-end gap-3 ${
        isAdminMessage ? "justify-end" : "justify-start"
      }`}
    >
      {!isAdminMessage ? (
        <Avatar name={senderName} imageUrl={senderImageUrl} compact />
      ) : null}

      <div
        className={`max-w-[88%] rounded-[26px] border px-5 py-4 shadow-sm sm:max-w-[78%] ${
          isAdminMessage
            ? "rounded-br-md border-green-200 bg-green-800 text-white"
            : normalizedRole === "guru"
              ? "rounded-bl-md border-sky-100 bg-sky-50 text-slate-950"
              : "rounded-bl-md border-violet-100 bg-violet-50 text-slate-950"
        }`}
      >
        <div
          className={`mb-2 flex flex-wrap items-center gap-2 ${
            isAdminMessage ? "justify-end text-right" : ""
          }`}
        >
          <span
            className={`text-sm font-black ${
              isAdminMessage ? "text-white" : "text-slate-950"
            }`}
          >
            {senderName}
          </span>

          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
              isAdminMessage
                ? "border-white/20 bg-white/10 text-white"
                : "border-white bg-white text-slate-600"
            }`}
          >
            {roleLabel}
          </span>

          {topic ? (
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                isAdminMessage
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white bg-white text-slate-500"
              }`}
            >
              {topic}
            </span>
          ) : null}

          <span
            className={`text-xs font-semibold ${
              isAdminMessage ? "text-white/75" : "text-slate-400"
            }`}
          >
            {formatMessageTime(message.created_at)}
          </span>
        </div>

        <p
          className={`whitespace-pre-wrap text-base leading-7 ${
            isAdminMessage ? "text-right text-white" : "text-slate-700"
          }`}
        >
          {content}
        </p>
      </div>

      {isAdminMessage ? (
        <Avatar name={senderName} imageUrl={senderImageUrl} compact />
      ) : null}
    </article>
  );
}

export default async function AdminMessageConversationPage({
  params,
}: {
  params: Promise<{
    conversationId?: string;
    conversationid?: string;
    id?: string;
  }>;
}) {
  const routeParams = await params;
  const routeId =
    routeParams.conversationId || routeParams.conversationid || routeParams.id || "";

  if (!routeId) {
    notFound();
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/admin/login");
  }

  const messageIdFromDirectRoute = routeId.startsWith("direct-message-")
    ? routeId.replace("direct-message-", "")
    : "";

  const [adminProfileResult, conversationResult, routeMessagesResult] =
    await Promise.all([
      safeAdminQuery(
        supabaseAdmin.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        "admin profile",
      ),
      routeId.startsWith("direct-message-")
        ? Promise.resolve({ data: null, error: null })
        : safeAdminQuery(
            supabaseAdmin
              .from("conversations")
              .select("*")
              .eq("id", routeId)
              .maybeSingle(),
            "conversation",
          ),
      messageIdFromDirectRoute
        ? safeAdminQuery(
            supabaseAdmin
              .from("messages")
              .select("*")
              .eq("id", messageIdFromDirectRoute)
              .limit(1),
            "direct message",
          )
        : safeAdminQuery(
            supabaseAdmin
              .from("messages")
              .select("*")
              .eq("conversation_id", routeId)
              .order("created_at", { ascending: true })
              .limit(5000),
            "messages",
          ),
    ]);

  const adminProfile = adminProfileResult.data as ProfileRow | null;
  const conversation = conversationResult.data as ConversationRow | null;

  let safeMessages = ((routeMessagesResult.data || []) as MessageRow[]).filter(
    (message) => Boolean(message) && message.is_deleted !== true,
  );

  if (!conversation && safeMessages.length === 0 && !messageIdFromDirectRoute) {
    const directMessageResult = await safeAdminQuery(
      supabaseAdmin.from("messages").select("*").eq("id", routeId).limit(1),
      "message by id",
    );

    safeMessages = ((directMessageResult.data || []) as MessageRow[]).filter(
      (message) => Boolean(message) && message.is_deleted !== true,
    );
  }

  if (!conversation && safeMessages.length === 0) {
    notFound();
  }

  const conversationId = conversation?.id || safeMessages[0]?.conversation_id || "";

  const participantsResult = conversationId
    ? await safeAdminQuery(
        supabaseAdmin
          .from("conversation_participants")
          .select("*")
          .eq("conversation_id", conversationId)
          .limit(5000),
        "conversation participants",
      )
    : { data: [], error: null };

  const safeParticipants = (
    (participantsResult.data || []) as ConversationParticipantRow[]
  ).filter(Boolean);

  const participantRoleMap = new Map<string, string>();

  safeParticipants.forEach((participant) => {
    const participantId = String(participant.user_id || "").trim();
    if (!participantId) return;

    participantRoleMap.set(participantId, normalizeRole(participant.role || ""));
  });

  const profileIds = Array.from(
    new Set(
      [
        user.id,
        conversation?.customer_id || "",
        conversation?.guru_id || "",
        conversation?.started_by_user_id || "",
        ...safeParticipants.map((participant) => participant.user_id || ""),
        ...safeMessages.flatMap((message) => [
          message.sender_id || "",
          message.recipient_id || "",
        ]),
      ].filter(Boolean),
    ),
  );

  const [profilesResult, guruProfilesResult] = await Promise.all([
    profileIds.length
      ? safeAdminQuery(
          supabaseAdmin.from("profiles").select("*").in("id", profileIds),
          "profiles",
        )
      : Promise.resolve({ data: [], error: null }),
    profileIds.length
      ? safeAdminQuery(
          supabaseAdmin.from("gurus").select("*").in("user_id", profileIds),
          "guru profiles",
        )
      : Promise.resolve({ data: [], error: null }),
  ]);

  const guruProfileMap = new Map<string, GuruProfileRow>();

  ((guruProfilesResult.data || []) as GuruProfileRow[]).forEach((guruProfile) => {
    const guruUserId = String(guruProfile.user_id || "").trim();
    if (guruUserId) guruProfileMap.set(guruUserId, guruProfile);
  });

  const profileMap = new Map<string, ProfileRow>();

  ((profilesResult.data || []) as ProfileRow[]).forEach((profile) => {
    const guruProfile = guruProfileMap.get(profile.id) || null;
    const mergedProfile = mergeGuruProfilePhoto(profile, guruProfile);

    if (mergedProfile?.id) {
      profileMap.set(mergedProfile.id, mergedProfile);
    }
  });

  guruProfileMap.forEach((guruProfile, guruUserId) => {
    if (!profileMap.has(guruUserId)) {
      const mergedProfile = mergeGuruProfilePhoto(null, guruProfile);

      if (mergedProfile?.id) {
        profileMap.set(mergedProfile.id, mergedProfile);
      }
    }
  });

  if (adminProfile?.id) {
    profileMap.set(adminProfile.id, {
      ...adminProfile,
      avatar_url: adminProfile.avatar_url || SITGURU_MESSAGE_AVATAR_URL,
    });
  }

  const sortedMessages = [...safeMessages].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return aTime - bTime;
  });

  const latestMessage = sortedMessages[sortedMessages.length - 1] || null;
  const preview =
    getMessageContent(latestMessage) ||
    conversation?.last_message_preview ||
    conversation?.subject ||
    "Conversation";

  const inquiryType = classifyInquiryType(conversation, latestMessage, preview);
  const inquiryLabel = getInquiryLabel(inquiryType);
  const topic =
    asString(latestMessage?.topic) ||
    asString(conversation?.topic) ||
    asString(latestMessage?.message_type) ||
    inquiryLabel;

  const subject =
    String(conversation?.topic || "").trim() ||
    String(conversation?.subject || "").trim() ||
    topic ||
    "SitGuru Conversation";

  const status = String(conversation?.status || latestMessage?.status || "open").trim();
  const lastActivity =
    latestMessage?.created_at ||
    conversation?.last_message_at ||
    conversation?.updated_at ||
    conversation?.created_at ||
    null;

  const threadType = getThreadType({
    conversation,
    messages: sortedMessages,
    participantRoleMap,
    profileMap,
    currentAdminId: user.id,
  });

  const unreadCount = sortedMessages.filter(isUnreadMessage).length;

  const participantIds = Array.from(
    new Set(
      [
        conversation?.customer_id || "",
        conversation?.guru_id || "",
        ...safeParticipants.map((participant) => participant.user_id || ""),
        ...sortedMessages.flatMap((message) => [
          message.sender_id || "",
          message.recipient_id || "",
        ]),
      ].filter(Boolean),
    ),
  ).filter((participantId) => {
    if (participantId === user.id) return false;

    const roleFromParticipant = normalizeRole(participantRoleMap.get(participantId));
    const roleFromProfile = getProfileRole(profileMap.get(participantId));

    return roleFromParticipant !== "admin" && roleFromProfile !== "admin";
  });

  const participants: ParticipantCard[] = participantIds.map((participantId) => {
    const profile = profileMap.get(participantId) || null;
    const role =
      normalizeRole(participantRoleMap.get(participantId)) ||
      getProfileRole(profile) ||
      (participantId === conversation?.customer_id
        ? "customer"
        : participantId === conversation?.guru_id
          ? "guru"
          : "user");

    const name = role === "admin" ? "SitGuru Admin" : getProfileName(profile);
    const label =
      role === "guru" ? `${getFirstName(name)} · Guru` : getReadableRole(role);
    const avatarUrl = getMessageAvatarUrl({
      senderRole: role,
      profileImageUrl: getProfileAvatar(profile),
    });

    const href =
      role === "guru"
        ? `/admin/gurus/${participantId}`
        : role === "customer"
          ? `/admin/customers/${participantId}`
          : "/admin/messages";

    return {
      id: participantId,
      role,
      label,
      name,
      avatarUrl,
      href,
    };
  });

  return (
    <main className="min-h-screen bg-[#f9faf5] px-4 py-5 sm:px-6 lg:px-8">
      <MessageAutoRefresh intervalMs={3000} />

      <div className="mx-auto max-w-[1400px] space-y-5">
        <section className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <Link
                href="/admin/messages"
                className="mb-4 inline-flex items-center gap-2 text-sm font-black text-green-800 transition hover:text-green-950"
              >
                <ArrowLeft size={17} />
                Back to Message Center
              </Link>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-800 text-white">
                  <MessagesSquare size={26} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
                    Admin / Message Thread
                  </p>
                  <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-4xl">
                    {subject}
                  </h1>
                  <p className="mt-1 max-w-4xl text-base font-semibold text-slate-600">
                    {threadType} · Last activity{" "}
                    <span className="font-black text-slate-800">
                      {formatLongDateTime(lastActivity)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-black text-green-900">
                <CheckCircle2 size={16} />
                {status}
              </span>

              <span
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black ${getInquiryClasses(
                  inquiryType,
                )}`}
              >
                {getInquiryIcon(inquiryType)}
                {inquiryLabel}
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatPill
            icon={<MessageCircle size={16} />}
            label="Messages"
            value={number(sortedMessages.length)}
          />
          <StatPill
            icon={<Clock3 size={16} />}
            label="Unread"
            value={number(unreadCount)}
          />
          <StatPill
            icon={<UsersRound size={16} />}
            label="Participants"
            value={number(participants.length)}
          />
          <StatPill
            icon={<ShieldAlert size={16} />}
            label="Thread Type"
            value={threadType}
          />
        </section>

        <section className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-black text-slate-950">
              Thread Participants
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              People connected to this conversation from messages, participants,
              profiles, and conversation metadata.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ParticipantPill
              participant={{
                id: user.id,
                role: "admin",
                label: "Admin",
                name: "SitGuru Admin",
                avatarUrl:
                  getProfileAvatar(profileMap.get(user.id)) ||
                  SITGURU_MESSAGE_AVATAR_URL,
                href: "/admin/messages",
              }}
            />

            {participants.length ? (
              participants.map((participant) => (
                <ParticipantPill key={participant.id} participant={participant} />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#d7e4da] bg-[#fbfcf9] px-4 py-3 text-sm font-bold text-slate-500">
                No non-admin participants found yet.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Message History
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Bubble view using the same Message Center intelligence and avatar
                rules.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {topic ? (
                <span className="rounded-2xl border border-green-100 bg-[#f7faf4] px-4 py-2 text-xs font-black text-green-900">
                  Topic: {topic}
                </span>
              ) : null}

              {conversationId ? (
                <span className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-600">
                  Conversation ID: {conversationId}
                </span>
              ) : (
                <span className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black text-amber-900">
                  Direct message row
                </span>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#edf3ee] bg-[#fbfcf9] p-4 sm:p-5">
            <div className="space-y-5">
              {sortedMessages.length ? (
                sortedMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    currentAdminId={user.id}
                    conversation={conversation}
                    participantRoleMap={participantRoleMap}
                    profileMap={profileMap}
                  />
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-[#d7e4da] bg-white px-6 py-10 text-center">
                  <MessageCircle className="mx-auto mb-3 text-slate-400" size={42} />
                  <h2 className="text-xl font-black text-slate-950">
                    No messages yet
                  </h2>
                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    This thread exists, but no messages have been sent yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-green-100 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-black text-slate-950">
              Send Admin Message
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Reply as SitGuru Admin. The admin avatar uses{" "}
              <span className="font-black text-green-900">
                sitguru-message-avatar.jpg
              </span>
              .
            </p>
          </div>

          {conversationId ? (
            <AdminMessageComposer
              conversationId={conversationId}
              currentTopic={topic || "Other"}
            />
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
              This is a direct message row without a conversation ID. Create or
              connect a conversation before replying from admin.
            </div>
          )}
        </section>

        <div className="rounded-[26px] border border-green-100 bg-white p-4 text-sm font-semibold text-slate-500 shadow-sm">
          <span className="font-black text-green-900">
            Supabase coordination:
          </span>{" "}
          this thread page reads directly from `messages`, connects
          `conversations`, `conversation_participants`, `profiles`, and `gurus`
          when available, and supports both normal conversation threads and
          direct message rows.
        </div>
      </div>
    </main>
  );
}