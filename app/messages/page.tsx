import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import Header from "@/components/Header";
import { resolvePetParentAvatarUrl } from "@/lib/pet-parent-avatar";
import { resolveAuthorizedRolesFromProfile } from "@/lib/dashboard/role-switch";
import {
  messageConversationHref,
  messageInboxHref,
  messageSupportHref,
  normalizeMessagePortal,
  resolveAuthorizedMessagePortal,
} from "@/lib/messaging/portal-context";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    filter?: string;
    role?: string;
    returnTo?: string;
    q?: string;
  }>;
};

type ConversationRow = {
  id: string;
  customer_id?: string | null;
  guru_id?: string | null;
  booking_id?: string | null;
  subject?: string | null;
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
  topic?: string | null;
  created_at?: string | null;
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
  photo_url?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
  role?: string | null;
  account_type?: string | null;
};

type ConversationParticipantRow = {
  id?: string | null;
  conversation_id?: string | null;
  user_id?: string | null;
  role?: string | null;
  last_read_at?: string | null;
  is_muted?: boolean | null;
  is_archived?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type InboxConversation = {
  id: string;
  otherUserIds: string[];
  otherUserName: string;
  otherUserRole: string;
  otherUserPhotoUrl: string | null;
  subject: string;
  preview: string;
  status: string;
  lastActivity: string | null;
  unread: boolean;
  href: string;
  threadKind: "guru" | "admin" | "customer" | "mixed";
  bookingLabel: string | null;
  topicLabel: string | null;
};

function normalizeRoleValue(role?: string | null) {
  const value = String(role || "").trim().toLowerCase();

  if (!value) return "";
  if (value === "provider" || value === "sitter") return "guru";

  return value;
}

function normalizeRoleLabel(role?: string | null) {
  const value = normalizeRoleValue(role);

  if (value === "admin") return "Admin";
  if (value === "guru") return "Guru";
  if (value === "customer") return "Customer";

  return "User";
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

function getProfilePhotoUrl(profile?: ProfileRow | null) {
  return resolvePetParentAvatarUrl(profile) || null;
}

function firstName(name: string) {
  return name.trim().split(/\s+/).filter(Boolean)[0] || name;
}

function getInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "SU";
}

function getMessagePreview(message?: MessageRow | null) {
  const value = message?.content || message?.body || "";
  return String(value).trim();
}

function formatDateTime(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const day = parsed.toLocaleDateString("en-US", { timeZone: "America/New_York" });
  const today = new Date().toLocaleDateString("en-US", { timeZone: "America/New_York" });
  const yesterday = new Date(Date.now() - 86_400_000).toLocaleDateString("en-US", { timeZone: "America/New_York" });
  if (day === today) {
    return parsed.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
  }
  if (day === yesterday) return "Yesterday";
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });
}

function isAfterDate(dateA?: string | null, dateB?: string | null) {
  if (!dateA) return false;
  if (!dateB) return true;

  const parsedA = new Date(dateA);
  const parsedB = new Date(dateB);

  if (Number.isNaN(parsedA.getTime())) return false;
  if (Number.isNaN(parsedB.getTime())) return true;

  return parsedA.getTime() > parsedB.getTime();
}

function getThreadKind({
  viewerId,
  otherParticipants,
  conversation,
  profilesById,
}: {
  viewerId: string;
  otherParticipants: ConversationParticipantRow[];
  conversation: ConversationRow;
  profilesById: Map<string, ProfileRow>;
}): InboxConversation["threadKind"] {
  const participantRoles = otherParticipants.map((participant) => {
    const profile = participant.user_id
      ? profilesById.get(participant.user_id)
      : null;

    return normalizeRoleValue(
      participant.role || profile?.role || profile?.account_type || ""
    );
  });

  const hasAdmin = participantRoles.includes("admin");
  const otherIsGuru = participantRoles.includes("guru") || (
    Boolean(conversation.guru_id) && conversation.guru_id !== viewerId
  );
  const otherIsCustomer = participantRoles.includes("customer") || (
    Boolean(conversation.customer_id) && conversation.customer_id !== viewerId
  );

  const subjectText = String(conversation.subject || "").trim().toLowerCase();
  const looksLikeAdmin =
    subjectText.includes("admin") ||
    subjectText.includes("support") ||
    subjectText.includes("refund") ||
    subjectText.includes("escalation") ||
    subjectText.includes("payout") ||
    subjectText.includes("verification") ||
    subjectText.includes("background");

  if (hasAdmin || looksLikeAdmin) return "admin";
  if (otherIsCustomer) return "customer";
  if (otherIsGuru) return "guru";
  return "mixed";
}

function getThreadKindLabel(kind: InboxConversation["threadKind"], viewerIsGuru: boolean) {
  if (kind === "admin") return "SitGuru";
  if (kind === "customer") return viewerIsGuru ? "Pet Parent" : "Pet Parent";
  if (kind === "guru") return "Guru";
  return "Conversation";
}

function getThreadKindClasses(kind: InboxConversation["threadKind"]) {
  if (kind === "admin") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (kind === "guru") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (kind === "customer") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getStatusClasses(status?: string | null) {
  const normalized = String(status || "").trim().toLowerCase();

  if (normalized === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalized === "confirmed" || normalized === "open") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    normalized === "completed" ||
    normalized === "resolved" ||
    normalized === "closed"
  ) {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getBookingLabel(conversation: ConversationRow) {
  if (!conversation.booking_id) return null;
  return "About a booking";
}

function getConversationSubject(conversation: ConversationRow, kind: string) {
  const subject = String(conversation.subject || "").trim();

  if (subject) return subject;

  if (kind === "admin") return "Direct Admin Support";
  if (kind === "guru") return "Guru Conversation";
  if (kind === "customer") return "Customer Conversation";

  return "SitGuru Conversation";
}

function getTopicLabel(
  conversation: ConversationRow,
  latestMessage?: MessageRow | null
) {
  const topic = String(latestMessage?.topic || "").trim();

  if (topic) return topic;

  const subject = String(conversation.subject || "").trim();

  if (subject) return subject;

  return null;
}

function Avatar({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string | null;
}) {
  return (
    <span className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-emerald-100">
      <span className="absolute inset-0 bg-white" />
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="relative z-[1] h-full w-full object-cover object-center" />
      ) : (
        <span className="relative z-[1] text-sm font-black text-[#0D5C3A]">{getInitials(name)}</span>
      )}
    </span>
  );
}

async function safeRows<T>(
  request: PromiseLike<{ data: unknown; error: unknown }>,
  label: string
): Promise<T[]> {
  try {
    const result = await request;

    if (result.error) {
      console.warn(`Messages inbox query skipped for ${label}:`, result.error);
      return [];
    }

    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`Messages inbox query failed for ${label}:`, error);
    return [];
  }
}

function getDashboardHref(role?: string | null) {
  const normalized = normalizeRoleValue(role);

  if (normalized === "guru") return "/guru/dashboard";
  if (normalized === "ambassador") return "/ambassador/dashboard";
  if (normalized === "admin") return "/admin";

  return "/customer/dashboard";
}

function safeReturnPath(value: string | undefined, role: string) {
  const path = String(value || "").trim();
  if (role === "guru" && (path === "/guru/dashboard" || path.startsWith("/guru/dashboard/"))) return path;
  if (path === "/customer/dashboard" || path.startsWith("/customer/dashboard/")) return path;
  if (path === "/ambassador/dashboard" || path.startsWith("/ambassador/dashboard/")) return path;
  return getDashboardHref(role);
}

function inboxHref(role: string, returnTo: string, filter = "all", query = "") {
  return messageInboxHref(role, returnTo, filter, query);
}

function getActiveFilterClasses(isActive: boolean) {
  if (isActive) {
    return "border-[#0D5C3A] bg-[#0D5C3A] !text-white";
  }

  return "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50";
}

export default async function MessagesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const requestedRole = normalizeRoleValue(resolvedSearchParams.role || "");
  const activeFilter = String(resolvedSearchParams.filter || "all").toLowerCase();
  const searchText = String(resolvedSearchParams.q || "").trim().toLowerCase();

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const next = inboxHref(requestedRole || "customer", safeReturnPath(resolvedSearchParams.returnTo, requestedRole || "customer"));
    redirect(requestedRole === "guru" ? `/guru/login?next=${encodeURIComponent(next)}` : `/customer/login?next=${encodeURIComponent(next)}`);
  }

  const currentProfileRows = await safeRows<ProfileRow>(
    supabaseAdmin
      .from("profiles")
      .select(
        "id, full_name, display_name, name, first_name, last_name, email, profile_photo_url, photo_url, avatar_url, role, account_type"
      )
      .eq("id", user.id),
    "current profile"
  );

  const currentProfile = currentProfileRows[0] || null;
  const [roleRowsResult, guruRowsResult] = await Promise.all([
    supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id),
    supabaseAdmin.from("gurus").select("id").eq("user_id", user.id).limit(1),
  ]);
  const authorizedRoles = resolveAuthorizedRolesFromProfile({
    profile: (currentProfile || null) as Record<string, unknown> | null,
    roleRows: ((roleRowsResult.data || []) as Array<{ role?: string | null }>).map((row) => row.role),
    email: user.email,
    hasGuruRecord: Boolean(guruRowsResult.data?.length),
  });
  const currentUserRole = resolveAuthorizedMessagePortal({
    requestedRole,
    returnTo: resolvedSearchParams.returnTo,
    authorizedRoles,
    fallbackRole: currentProfile?.role || currentProfile?.account_type,
  });
  const requestedPortal = normalizeMessagePortal(requestedRole);
  if (requestedPortal && requestedPortal !== currentUserRole) {
    redirect(inboxHref(currentUserRole, safeReturnPath(resolvedSearchParams.returnTo, currentUserRole), activeFilter, searchText));
  }
  const viewerIsGuru = currentUserRole === "guru";
  if (!viewerIsGuru && currentUserRole === "admin") redirect("/admin/messages");
  const dashboardHref = safeReturnPath(resolvedSearchParams.returnTo, currentUserRole);

  const myParticipantRows = await safeRows<ConversationParticipantRow>(
    supabaseAdmin
      .from("conversation_participants")
      .select("*")
      .eq("user_id", user.id),
    "my conversation participants"
  );

  const participantConversationIds = myParticipantRows
    .map((participant) => participant.conversation_id || "")
    .filter(Boolean);

  const conversationsById = new Map<string, ConversationRow>();

  if (participantConversationIds.length > 0) {
    const participantConversations = await safeRows<ConversationRow>(
      supabaseAdmin
        .from("conversations")
        .select(
          "id, customer_id, guru_id, booking_id, subject, status, created_at, updated_at, last_message_at, last_message_preview"
        )
        .in("id", participantConversationIds),
      "participant conversations"
    );

    participantConversations.forEach((conversation) => {
      conversationsById.set(conversation.id, conversation);
    });
  }

  const ownedConversations = await safeRows<ConversationRow>(
    supabaseAdmin
      .from("conversations")
      .select(
        "id, customer_id, guru_id, booking_id, subject, status, created_at, updated_at, last_message_at, last_message_preview"
      )
      .or(`customer_id.eq.${user.id},guru_id.eq.${user.id}`),
    "owned conversations"
  );

  ownedConversations.forEach((conversation) => {
    conversationsById.set(conversation.id, conversation);
  });

  const conversations = Array.from(conversationsById.values()).sort((a, b) => {
    const aDate = new Date(
      a.last_message_at || a.updated_at || a.created_at || 0
    ).getTime();
    const bDate = new Date(
      b.last_message_at || b.updated_at || b.created_at || 0
    ).getTime();

    return bDate - aDate;
  });

  const conversationIds = conversations.map((conversation) => conversation.id);

  const [allParticipants, allMessages] = await Promise.all([
    conversationIds.length
      ? safeRows<ConversationParticipantRow>(
          supabaseAdmin
            .from("conversation_participants")
            .select("*")
            .in("conversation_id", conversationIds),
          "all conversation participants"
        )
      : Promise.resolve([]),
    conversationIds.length
      ? safeRows<MessageRow>(
          supabaseAdmin
            .from("messages")
            .select(
              "id, conversation_id, sender_id, recipient_id, content, body, topic, created_at"
            )
            .in("conversation_id", conversationIds)
            .order("created_at", { ascending: true }),
          "all messages"
        )
      : Promise.resolve([]),
  ]);

  const profileIds = Array.from(
    new Set(
      [
        user.id,
        ...conversations.flatMap((conversation) => [
          conversation.customer_id || "",
          conversation.guru_id || "",
        ]),
        ...allParticipants.map((participant) => participant.user_id || ""),
        ...allMessages.flatMap((message) => [
          message.sender_id || "",
          message.recipient_id || "",
        ]),
      ].filter(Boolean)
    )
  );

  const profileRows = profileIds.length
    ? await safeRows<ProfileRow>(
        supabaseAdmin
          .from("profiles")
          .select(
            "id, full_name, display_name, name, first_name, last_name, email, profile_photo_url, photo_url, avatar_url, role, account_type"
          )
          .in("id", profileIds),
        "profiles"
      )
    : [];

  const profilesById = new Map<string, ProfileRow>();
  profileRows.forEach((profile) => {
    profilesById.set(profile.id, profile);
  });

  if (currentProfile) {
    profilesById.set(currentProfile.id, currentProfile);
  }

  const messagesByConversationId = new Map<string, MessageRow[]>();
  allMessages.forEach((message) => {
    const conversationId = message.conversation_id || "";

    if (!conversationId) return;

    const list = messagesByConversationId.get(conversationId) || [];
    list.push(message);
    messagesByConversationId.set(conversationId, list);
  });

  const participantsByConversationId = new Map<
    string,
    ConversationParticipantRow[]
  >();

  allParticipants.forEach((participant) => {
    const conversationId = participant.conversation_id || "";

    if (!conversationId) return;

    const list = participantsByConversationId.get(conversationId) || [];
    list.push(participant);
    participantsByConversationId.set(conversationId, list);
  });

  const inboxConversations: InboxConversation[] = conversations.map(
    (conversation) => {
      const participants = participantsByConversationId.get(conversation.id) || [];
      const otherParticipants = participants.filter(
        (participant) => participant.user_id && participant.user_id !== user.id
      );

      const messages = messagesByConversationId.get(conversation.id) || [];
      const latestMessage = messages[messages.length - 1] || null;

      const fallbackOtherIds = [
        conversation.customer_id || "",
        conversation.guru_id || "",
      ].filter((id) => id && id !== user.id);

      const otherUserIds = Array.from(
        new Set(
          [
            ...otherParticipants.map((participant) => participant.user_id || ""),
            ...fallbackOtherIds,
          ].filter(Boolean)
        )
      );

      const kind = getThreadKind({
        viewerId: user.id,
        otherParticipants,
        conversation,
        profilesById,
      });

      const firstOtherProfile =
        otherUserIds.length > 0 ? profilesById.get(otherUserIds[0]) || null : null;

      const otherUserName = firstName(kind === "admin" ? "SitGuru" : getProfileName(firstOtherProfile));

      const otherUserRole =
        kind === "admin"
          ? "Admin"
          : normalizeRoleLabel(
              otherParticipants[0]?.role ||
                firstOtherProfile?.role ||
                firstOtherProfile?.account_type ||
                kind
            );

      const otherUserPhotoUrl =
        kind === "admin" ? null : getProfilePhotoUrl(firstOtherProfile);

      const currentParticipant = participants.find(
        (participant) => participant.user_id === user.id
      );

      const lastActivity =
        conversation.last_message_at ||
        latestMessage?.created_at ||
        conversation.updated_at ||
        conversation.created_at ||
        null;

      const unread =
        Boolean(latestMessage?.sender_id && latestMessage.sender_id !== user.id) &&
        isAfterDate(lastActivity, currentParticipant?.last_read_at);

      const preview =
        conversation.last_message_preview ||
        getMessagePreview(latestMessage) ||
        "Conversation started.";

      const topicLabel = getTopicLabel(conversation, latestMessage);
      const subject = getConversationSubject(conversation, kind);

      return {
        id: conversation.id,
        otherUserIds,
        otherUserName,
        otherUserRole,
        otherUserPhotoUrl,
        subject,
        preview,
        status: String(conversation.status || "open"),
        lastActivity,
        unread,
        href: messageConversationHref(conversation.id, currentUserRole, dashboardHref),
        threadKind: kind,
        bookingLabel: getBookingLabel(conversation),
        topicLabel,
      };
    }
  );

  const filteredConversations = inboxConversations.filter((conversation) => {
    if (activeFilter === "unread" && !conversation.unread) return false;
    if ((activeFilter === "parents" || activeFilter === "customer") && conversation.threadKind !== "customer") return false;
    if (activeFilter === "guru" && conversation.threadKind !== "guru") return false;
    if (activeFilter === "admin" && conversation.threadKind !== "admin") return false;
    if (!searchText) return true;
    const haystack = `${conversation.otherUserName} ${conversation.preview} ${conversation.subject}`.toLowerCase();
    return haystack.includes(searchText);
  });

  const unreadCount = inboxConversations.filter(
    (conversation) => conversation.unread
  ).length;

  const adminThread = inboxConversations.find(
    (conversation) => conversation.threadKind === "admin"
  );

  const adminMessageHref = adminThread?.href || messageSupportHref(currentUserRole, dashboardHref);

  const filterLinks = viewerIsGuru
    ? [
        { label: "All", value: "all", href: inboxHref(currentUserRole, dashboardHref) },
        { label: "Pet Parents", value: "parents", href: inboxHref(currentUserRole, dashboardHref, "parents") },
        { label: "SitGuru", value: "admin", href: inboxHref(currentUserRole, dashboardHref, "admin") },
        { label: "Unread", value: "unread", href: inboxHref(currentUserRole, dashboardHref, "unread") },
      ]
    : [
        { label: "All", value: "all", href: inboxHref(currentUserRole, dashboardHref) },
        { label: "Gurus", value: "guru", href: inboxHref(currentUserRole, dashboardHref, "guru") },
        { label: "SitGuru", value: "admin", href: inboxHref(currentUserRole, dashboardHref, "admin") },
        { label: "Unread", value: "unread", href: inboxHref(currentUserRole, dashboardHref, "unread") },
      ];

  return (
    <main
      className="min-h-dvh bg-[#f7fcfa] pb-[max(1rem,env(safe-area-inset-bottom))] font-light text-slate-950"
      style={{
        fontFamily:
          '"Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontWeight: 300,
      }}
    >
      <Header />

      <section className="mx-auto max-w-3xl px-3 py-3 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Link href={dashboardHref} className="text-sm font-bold text-[#0D5C3A]">
              ← {viewerIsGuru ? "Guru dashboard" : "Dashboard"}
            </Link>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Messages
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {viewerIsGuru
                ? "Pet parents and SitGuru, by first name."
                : "Care chats, by first name."}{" "}
              {unreadCount} unread
            </p>
          </div>
          <Link
            href={adminMessageHref}
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white"
          >
            SitGuru
          </Link>
        </div>

        <form action="/messages" className="mt-4">
          <input type="hidden" name="role" value={currentUserRole || ""} />
          <input type="hidden" name="returnTo" value={dashboardHref} />
          {activeFilter !== "all" ? <input type="hidden" name="filter" value={activeFilter} /> : null}
          <input
            name="q"
            defaultValue={resolvedSearchParams.q || ""}
            placeholder={viewerIsGuru ? "Search pet parents" : "Search messages"}
            className="min-h-12 w-full rounded-full border border-emerald-100 bg-white px-4 text-sm font-semibold text-slate-950 outline-none focus:border-[#0D5C3A]"
          />
        </form>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filterLinks.map((filter) => (
            <Link
              key={filter.value}
              href={filter.href}
              className={`inline-flex min-h-12 shrink-0 items-center rounded-2xl border px-4 text-sm font-black ${getActiveFilterClasses(
                activeFilter === filter.value ||
                  (!resolvedSearchParams?.filter && filter.value === "all"),
              )}`}
            >
              {filter.label}
            </Link>
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white">
          {filteredConversations.length ? (
            filteredConversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={conversation.href}
                className="flex min-h-16 items-center gap-3 border-b border-emerald-50 px-3 py-3 last:border-b-0 active:bg-emerald-50 sm:px-4"
              >
                <Avatar
                  name={conversation.otherUserName}
                  imageUrl={conversation.otherUserPhotoUrl}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className={`truncate text-[17px] ${
                        conversation.unread
                          ? "font-black text-slate-950"
                          : "font-bold text-slate-800"
                      }`}
                    >
                      {conversation.otherUserName}
                    </p>
                    <span className="shrink-0 text-xs font-bold text-slate-400">
                      {formatDateTime(conversation.lastActivity)}
                    </span>
                  </div>
                  <p className="truncate text-xs font-bold text-emerald-700">
                    {getThreadKindLabel(conversation.threadKind, viewerIsGuru)}
                    {conversation.bookingLabel ? ` · ${conversation.bookingLabel}` : ""}
                  </p>
                  <p
                    className={`mt-0.5 truncate text-sm ${
                      conversation.unread
                        ? "font-semibold text-slate-700"
                        : "font-medium text-slate-500"
                    }`}
                  >
                    {conversation.preview || conversation.subject}
                  </p>
                </div>
                {conversation.unread ? (
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#0D5C3A]" />
                ) : null}
              </Link>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <h2 className="text-xl font-black text-slate-950">
                {viewerIsGuru ? "No pet parent messages yet" : "No conversations yet"}
              </h2>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                {viewerIsGuru
                  ? "When a pet parent writes about care, the chat shows up here with their first name and photo."
                  : "Message SitGuru, or find a Guru to start a care chat."}
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Link
                  href={adminMessageHref}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0D5C3A] px-5 text-sm font-black !text-white"
                >
                  Message SitGuru
                </Link>
                <Link
                  href={viewerIsGuru ? dashboardHref : "/search"}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 text-sm font-black text-[#0D5C3A]"
                >
                  {viewerIsGuru ? "Back to dashboard" : "Find a Guru"}
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
