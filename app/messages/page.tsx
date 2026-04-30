import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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
  const hasGuru = participantRoles.includes("guru") || Boolean(conversation.guru_id);
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

function getTopicLabel(conversation: ConversationRow, latestMessage?: MessageRow | null) {
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
  if (normalized === "admin") return "/admin";

  return "/customer/dashboard";
}

function getActiveFilterClasses(isActive: boolean) {
  if (isActive) {
    return "border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/20";
  }

  return "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700";
}

function SidebarMetric({ value }: { value: string }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-slate-800">
      {value}
    </div>
  );
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

  if (currentUserRole === "guru") {
    redirect("/guru/dashboard/messages");
  }

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

  const participantsByConversationId = new Map<string, ConversationParticipantRow[]>();
  allParticipants.forEach((participant) => {
    const conversationId = participant.conversation_id || "";

    if (!conversationId) return;

    const list = participantsByConversationId.get(conversationId) || [];
    list.push(participant);
    participantsByConversationId.set(conversationId, list);
  });

  const inboxConversations: InboxConversation[] = conversations.map((conversation) => {
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
      kind === "admin"
        ? "SitGuru Admin"
        : getProfileName(firstOtherProfile);

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
  });

  const filteredConversations = inboxConversations.filter((conversation) => {
    if (activeFilter === "unread") return conversation.unread;
    if (activeFilter === "guru") return conversation.threadKind === "guru";
    if (activeFilter === "admin") return conversation.threadKind === "admin";
    if (activeFilter === "customer") return conversation.threadKind === "customer";

    return true;
  });

  const totalConversations = inboxConversations.length;
  const unreadCount = inboxConversations.filter((conversation) => conversation.unread).length;
  const guruCount = inboxConversations.filter((conversation) => conversation.threadKind === "guru").length;
  const adminCount = inboxConversations.filter((conversation) => conversation.threadKind === "admin").length;

  const adminThread = inboxConversations.find(
    (conversation) => conversation.threadKind === "admin"
  );

  const filterLinks = [
    { label: "All", value: "all", href: "/messages" },
    { label: "Guru", value: "guru", href: "/messages?filter=guru" },
    { label: "Admin", value: "admin", href: "/messages?filter=admin" },
    { label: "Unread", value: "unread", href: "/messages?filter=unread" },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_28%),linear-gradient(180deg,#ffffff,#f2fbf7_48%,#ffffff)] text-slate-950">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.10)]">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_30%),linear-gradient(135deg,#ffffff,#ecfdf5)] p-6 sm:p-8">
            <Link
              href={dashboardHref}
              className="inline-flex rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            >
              ← Back to dashboard
            </Link>

            <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-emerald-600">
              SitGuru Messaging
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
              Message Center
            </h1>

            <p className="mt-4 max-w-4xl text-base font-semibold leading-8 text-slate-700">
              Keep care details, booking questions, and support conversations
              organized in one place. Choose a conversation below to continue
              messaging SitGuru Admin, a Guru, or a customer.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <div className="rounded-[1.3rem] border border-emerald-100 bg-white px-6 py-4 shadow-sm">
                <p className="text-3xl font-black text-slate-950">
                  {totalConversations}
                </p>
                <p className="mt-1 text-sm font-black text-slate-600">
                  conversations
                </p>
              </div>

              <div className="rounded-[1.3rem] border border-emerald-100 bg-white px-6 py-4 shadow-sm">
                <p className="text-3xl font-black text-slate-950">
                  {unreadCount}
                </p>
                <p className="mt-1 text-sm font-black text-slate-600">
                  unread
                </p>
              </div>

              <Link
                href="/search?intent=message-guru"
                className="inline-flex min-h-[86px] items-center justify-center rounded-[1.3rem] bg-emerald-500 px-7 text-base font-black text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600"
              >
                Find a Guru
              </Link>
            </div>
          </div>

          <div className="grid gap-6 bg-[#f7fcfa] p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-600">
                    Inbox
                  </p>

                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    Your conversations
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  {filterLinks.map((filter) => (
                    <Link
                      key={filter.value}
                      href={filter.href}
                      className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${getActiveFilterClasses(
                        activeFilter === filter.value ||
                          (!resolvedSearchParams?.filter && filter.value === "all")
                      )}`}
                    >
                      {filter.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-emerald-100 bg-emerald-50/60 p-4 sm:p-5">
                {filteredConversations.length ? (
                  <div className="space-y-4">
                    {filteredConversations.map((conversation) => (
                      <article
                        key={conversation.id}
                        className="rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex gap-4">
                            <Avatar
                              name={conversation.otherUserName}
                              imageUrl={conversation.otherUserPhotoUrl}
                            />

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-xl font-black text-slate-950">
                                  {conversation.otherUserName}
                                </h3>

                                {conversation.unread ? (
                                  <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                                    New
                                  </span>
                                ) : null}
                              </div>

                              <div className="mt-2 flex flex-wrap gap-2">
                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${getThreadKindClasses(
                                    conversation.threadKind
                                  )}`}
                                >
                                  {getThreadKindLabel(conversation.threadKind)}
                                </span>

                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-700">
                                  {conversation.otherUserRole}
                                </span>

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClasses(
                                    conversation.status
                                  )}`}
                                >
                                  {conversation.status}
                                </span>

                                {conversation.bookingLabel ? (
                                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-700">
                                    {conversation.bookingLabel}
                                  </span>
                                ) : null}
                              </div>

                              <p className="mt-3 text-base font-black text-slate-950">
                                {conversation.subject}
                              </p>

                              <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                                {conversation.preview}
                              </p>

                              <p className="mt-4 text-xs font-bold text-slate-500">
                                {formatDateTime(conversation.lastActivity)}
                              </p>
                            </div>
                          </div>

                          <Link
                            href={conversation.href}
                            className="inline-flex shrink-0 items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-600"
                          >
                            Open thread →
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-emerald-200 bg-white px-6 py-12 text-center">
                    <h3 className="text-2xl font-black text-slate-950">
                      No conversations found
                    </h3>
                    <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                      Your message center will show conversations with SitGuru
                      Admin, Gurus, and booking contacts as they are created.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                      <Link
                        href="/search?intent=message-guru"
                        className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-600"
                      >
                        Find a Guru
                      </Link>
                      <Link
                        href={dashboardHref}
                        className="rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                      >
                        Back to dashboard
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <aside className="space-y-6">
              <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-600">
                  Communication Center
                </p>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                  Need help or care?
                </h2>

                <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
                  Start with SitGuru Admin for account, safety, booking, or
                  platform support. To message a Guru, choose the Guru first from
                  Find Care.
                </p>

                <div className="mt-6 grid gap-3">
                  <Link
                    href={adminThread?.href || "/messages?filter=admin"}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-600"
                  >
                    Message Admin
                  </Link>

                  <Link
                    href="/customer/pets"
                    className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                  >
                    Go to My Pets
                  </Link>

                  <Link
                    href="/search?intent=message-guru"
                    className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                  >
                    Find a Guru
                  </Link>
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-600">
                  Messaging Overview
                </p>

                <div className="mt-5 grid gap-3">
                  <SidebarMetric
                    value={`${guruCount} Guru conversation${
                      guruCount === 1 ? "" : "s"
                    } active`}
                  />
                  <SidebarMetric
                    value={`${adminCount} Admin support thread${
                      adminCount === 1 ? "" : "s"
                    }`}
                  />
                  <SidebarMetric
                    value={`${unreadCount} unread update${
                      unreadCount === 1 ? "" : "s"
                    } waiting`}
                  />
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-600">
                  Helpful Reminder
                </p>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                  Clear messages save time
                </h2>

                <div className="mt-5 space-y-3">
                  {[
                    "Include pet names, care dates, and the kind of help you need.",
                    "Use Admin for account, booking, refund, verification, or safety questions.",
                    "Use Find Care first if you want to message a specific Guru.",
                  ].map((tip) => (
                    <div
                      key={tip}
                      className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold leading-7 text-slate-700"
                    >
                      {tip}
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </section>
      </section>
    </main>
  );
}