import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    filter?: string;
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
  if (!profile) return null;

  return (
    profile.profile_photo_url || profile.avatar_url || profile.image_url || null
  );
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
  if (!value) return "No recent activity";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No recent activity";

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
  otherParticipants,
  conversation,
  profilesById,
}: {
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
  const hasGuru =
    participantRoles.includes("guru") || Boolean(conversation.guru_id);
  const hasCustomer =
    participantRoles.includes("customer") || Boolean(conversation.customer_id);

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
  if (hasGuru) return "guru";
  if (hasCustomer) return "customer";

  return "mixed";
}

function getThreadKindLabel(kind: InboxConversation["threadKind"]) {
  if (kind === "admin") return "Admin Support";
  if (kind === "guru") return "Guru Conversation";
  if (kind === "customer") return "Customer Conversation";
  return "Shared Thread";
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
  return `Booking #${String(conversation.booking_id)}`;
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
  if (imageUrl) {
    return (
      <div className="h-14 w-14 overflow-hidden rounded-[18px] border border-emerald-100 bg-white shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-emerald-100 bg-emerald-50 text-lg font-black text-emerald-700 shadow-sm">
      {getInitials(name)}
    </div>
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

function getActiveFilterClasses(isActive: boolean) {
  if (isActive) {
    return "border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/20";
  }

  return "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700";
}

export default async function MessagesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const activeFilter = String(resolvedSearchParams?.filter || "all").toLowerCase();

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/customer/login");
  }

  const currentProfileRows = await safeRows<ProfileRow>(
    supabaseAdmin
      .from("profiles")
      .select(
        "id, full_name, display_name, name, first_name, last_name, email, profile_photo_url, avatar_url, image_url, role, account_type"
      )
      .eq("id", user.id),
    "current profile"
  );

  const currentProfile = currentProfileRows[0] || null;
  const currentUserRole = normalizeRoleValue(
    currentProfile?.role || currentProfile?.account_type || ""
  );

  if (currentUserRole === "admin") {
    redirect("/admin/messages");
  }

  const dashboardHref = getDashboardHref(currentUserRole);

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
            "id, full_name, display_name, name, first_name, last_name, email, profile_photo_url, avatar_url, image_url, role, account_type"
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
        otherParticipants,
        conversation,
        profilesById,
      });

      const firstOtherProfile =
        otherUserIds.length > 0 ? profilesById.get(otherUserIds[0]) || null : null;

      const otherUserName =
        kind === "admin" ? "SitGuru Admin" : getProfileName(firstOtherProfile);

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
        href: `/messages/${conversation.id}`,
        threadKind: kind,
        bookingLabel: getBookingLabel(conversation),
        topicLabel,
      };
    }
  );

  const filteredConversations = inboxConversations.filter((conversation) => {
    if (activeFilter === "unread") return conversation.unread;
    if (activeFilter === "guru") return conversation.threadKind === "guru";
    if (activeFilter === "admin") return conversation.threadKind === "admin";
    if (activeFilter === "customer") return conversation.threadKind === "customer";

    return true;
  });

  const totalConversations = inboxConversations.length;
  const unreadCount = inboxConversations.filter(
    (conversation) => conversation.unread
  ).length;

  const adminThread = inboxConversations.find(
    (conversation) => conversation.threadKind === "admin"
  );

  const adminMessageHref = adminThread?.href || "/messages/admin";

  const filterLinks =
    currentUserRole === "guru"
      ? [
          { label: "All", value: "all", href: "/messages?role=guru" },
          {
            label: "Pet Parents",
            value: "guru",
            href: "/messages?filter=guru&role=guru",
          },
          { label: "Admin", value: "admin", href: "/messages?filter=admin&role=guru" },
          { label: "Unread", value: "unread", href: "/messages?filter=unread&role=guru" },
        ]
      : [
          { label: "All", value: "all", href: "/messages" },
          { label: "Guru", value: "guru", href: "/messages?filter=guru" },
          { label: "Admin", value: "admin", href: "/messages?filter=admin" },
          { label: "Unread", value: "unread", href: "/messages?filter=unread" },
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
            <Link
              href={dashboardHref}
              className="text-sm font-black text-emerald-700"
            >
              ← Dashboard
            </Link>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Messages
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {unreadCount} unread · {totalConversations} conversations
            </p>
          </div>
          <Link
            href={adminMessageHref}
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black text-white"
          >
            Admin
          </Link>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                    {getThreadKindLabel(conversation.threadKind)}
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
              <h2 className="text-xl font-black text-slate-950">No conversations yet</h2>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                Message SitGuru Admin, or find a Guru to start care chat.
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Link
                  href={adminMessageHref}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0D5C3A] px-5 text-sm font-black text-white"
                >
                  Message Admin
                </Link>
                <Link
                  href="/search"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 text-sm font-black text-emerald-700"
                >
                  Find a Guru
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
