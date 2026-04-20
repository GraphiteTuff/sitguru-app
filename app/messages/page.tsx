import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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
  [key: string]: unknown;
};

type ConversationParticipantRow = {
  conversation_id: string;
  user_id: string;
  role?: string | null;
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
  petLabel: string | null;
  bookingLabel: string | null;
};

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

  const candidate =
    profile.profile_photo_url || profile.avatar_url || profile.image_url || null;

  return candidate ? String(candidate) : null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
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

function normalizeRoleValue(role?: string | null) {
  const value = String(role || "").trim().toLowerCase();

  if (!value) return "";
  if (value === "provider" || value === "sitter") return "guru";

  return value;
}

function normalizeRoleLabel(role?: string | null) {
  const value = normalizeRoleValue(role);

  if (!value) return "User";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getStatusClasses(status?: string | null) {
  const normalized = String(status || "").trim().toLowerCase();

  if (normalized === "pending") {
    return "border-amber-300/30 bg-amber-400/10 text-amber-100";
  }

  if (normalized === "confirmed") {
    return "border-emerald-300/30 bg-emerald-400/10 text-emerald-100";
  }

  if (normalized === "completed") {
    return "border-sky-300/30 bg-sky-400/10 text-sky-100";
  }

  return "border-white/20 bg-white/10 text-white";
}

function getThreadKind(
  otherParticipants: ConversationParticipantRow[],
  conversation: ConversationRow
): InboxConversation["threadKind"] {
  const roles = otherParticipants.map((row) => normalizeRoleValue(row.role));

  const hasAdmin = roles.includes("admin");
  const hasGuru = roles.includes("guru") || Boolean(conversation.guru_id);
  const hasCustomer = roles.includes("customer") || Boolean(conversation.customer_id);

  const subjectText = String(conversation.subject || "").trim().toLowerCase();
  const looksLikeAdmin =
    subjectText.includes("admin") ||
    subjectText.includes("support") ||
    subjectText.includes("refund") ||
    subjectText.includes("escalation") ||
    subjectText.includes("payout");

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
    return "border-amber-300/30 bg-amber-400/10 text-amber-100";
  }

  if (kind === "guru") {
    return "border-emerald-300/30 bg-emerald-400/10 text-emerald-100";
  }

  if (kind === "customer") {
    return "border-sky-300/30 bg-sky-400/10 text-sky-100";
  }

  return "border-white/20 bg-white/10 text-white";
}

function getPetLabel(subject?: string | null, preview?: string | null) {
  const combined = `${String(subject || "")} ${String(preview || "")}`.trim();
  if (!combined) return null;

  const patterns = [
    /\babout\s+([A-Z][a-zA-Z'-]+)/,
    /\bfor\s+([A-Z][a-zA-Z'-]+)/,
    /\bpet\s*:\s*([A-Z][a-zA-Z'-]+)/i,
    /\bregarding\s+([A-Z][a-zA-Z'-]+)/,
  ];

  for (const pattern of patterns) {
    const match = combined.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

function getBookingLabel(conversation: ConversationRow) {
  if (!conversation.booking_id) return null;
  return `Booking #${String(conversation.booking_id)}`;
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
      <div className="h-14 w-14 overflow-hidden rounded-[18px] border border-white/20 bg-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/20 bg-white/10 text-lg font-black text-white">
      {getInitials(name)}
    </div>
  );
}

async function resolveDashboardHref(userId: string, fallbackRole?: string | null) {
  const [guruByUserId, guruById] = await Promise.all([
    supabaseAdmin.from("gurus").select("id, user_id").eq("user_id", userId).limit(1),
    supabaseAdmin.from("gurus").select("id, user_id").eq("id", userId).limit(1),
  ]);

  const hasGuruRecord =
    (guruByUserId.data?.length ?? 0) > 0 || (guruById.data?.length ?? 0) > 0;

  if (hasGuruRecord) {
    return "/guru/dashboard";
  }

  const normalizedRole = String(fallbackRole || "").toLowerCase().trim();

  if (normalizedRole === "admin") {
    return "/admin";
  }

  return "/customer/dashboard";
}

export default async function MessagesInboxPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  const params = (await searchParams) || {};
  const activeFilter =
    params.filter === "admin" ||
    params.filter === "guru" ||
    params.filter === "unread"
      ? params.filter
      : "all";

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/customer/login");
  }

  const { data: currentProfileData } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const currentProfile = (currentProfileData ?? null) as ProfileRow | null;
  const dashboardHref = await resolveDashboardHref(user.id, currentProfile?.role);

  const { data: myParticipantRows, error: myParticipantRowsError } = await supabaseAdmin
    .from("conversation_participants")
    .select("conversation_id, user_id, role")
    .eq("user_id", user.id)
    .returns<ConversationParticipantRow[]>();

  if (myParticipantRowsError) {
    console.error(
      "Messages inbox participant query error:",
      myParticipantRowsError.message
    );
  }

  const conversationIds = Array.from(
    new Set((myParticipantRows ?? []).map((row) => row.conversation_id).filter(Boolean))
  );

  const { data: conversationsData, error: conversationsError } =
    conversationIds.length > 0
      ? await supabaseAdmin
          .from("conversations")
          .select("*")
          .in("id", conversationIds)
          .order("last_message_at", { ascending: false })
          .returns<ConversationRow[]>()
      : { data: [], error: null as { message?: string } | null };

  if (conversationsError) {
    console.error("Messages inbox conversations error:", conversationsError.message);
  }

  const conversations = (conversationsData ?? []).sort((a, b) => {
    const aTime = new Date(
      a.last_message_at || a.updated_at || a.created_at || 0
    ).getTime();
    const bTime = new Date(
      b.last_message_at || b.updated_at || b.created_at || 0
    ).getTime();

    return bTime - aTime;
  });

  const { data: allParticipantRows, error: allParticipantRowsError } =
    conversationIds.length > 0
      ? await supabaseAdmin
          .from("conversation_participants")
          .select("conversation_id, user_id, role")
          .in("conversation_id", conversationIds)
          .returns<ConversationParticipantRow[]>()
      : { data: [], error: null as { message?: string } | null };

  if (allParticipantRowsError) {
    console.error(
      "Messages inbox all participants error:",
      allParticipantRowsError.message
    );
  }

  const { data: latestMessagesData, error: latestMessagesError } =
    conversationIds.length > 0
      ? await supabaseAdmin
          .from("messages")
          .select("*")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false })
          .returns<MessageRow[]>()
      : { data: [], error: null as { message?: string } | null };

  if (latestMessagesError) {
    console.error(
      "Messages inbox latest messages error:",
      latestMessagesError.message
    );
  }

  const latestMessageByConversation = new Map<string, MessageRow>();

  for (const message of (latestMessagesData ?? []) as MessageRow[]) {
    const conversationId = String(message.conversation_id || "").trim();
    if (!conversationId || latestMessageByConversation.has(conversationId)) {
      continue;
    }
    latestMessageByConversation.set(conversationId, message);
  }

  const participantIds = Array.from(
    new Set((allParticipantRows ?? []).map((row) => row.user_id).filter(Boolean))
  );

  const { data: profileRowsData, error: profilesError } =
    participantIds.length > 0
      ? await supabaseAdmin.from("profiles").select("*").in("id", participantIds)
      : { data: [], error: null as { message?: string } | null };

  if (profilesError) {
    console.error("Messages inbox profiles error:", profilesError.message);
  }

  const profileMap = new Map<string, ProfileRow>();
  for (const profile of (profileRowsData ?? []) as ProfileRow[]) {
    profileMap.set(String(profile.id), profile);
  }

  const participantsByConversation = new Map<string, ConversationParticipantRow[]>();
  for (const row of (allParticipantRows ?? []) as ConversationParticipantRow[]) {
    const list = participantsByConversation.get(row.conversation_id) ?? [];
    list.push(row);
    participantsByConversation.set(row.conversation_id, list);
  }

  const allInboxConversations: InboxConversation[] = conversations.map((conversation) => {
    const participantRows = participantsByConversation.get(conversation.id) ?? [];
    const otherParticipants = participantRows.filter((row) => row.user_id !== user.id);

    const otherUserIds = otherParticipants.map((row) => row.user_id);
    const otherUserNames = otherParticipants.map((row) =>
      getProfileName(profileMap.get(row.user_id) ?? null)
    );
    const otherUserRoles = otherParticipants.map((row) =>
      normalizeRoleLabel(row.role)
    );
    const firstOtherProfile =
      otherParticipants.length > 0
        ? profileMap.get(otherParticipants[0].user_id) ?? null
        : null;

    const latestMessage = latestMessageByConversation.get(conversation.id) ?? null;
    const unread =
      !!latestMessage?.recipient_id &&
      String(latestMessage.recipient_id) === user.id;

    const threadKind = getThreadKind(otherParticipants, conversation);
    const subject =
      conversation.subject?.trim() ||
      (threadKind === "admin"
        ? "Admin support conversation"
        : "Direct conversation");

    const preview =
      conversation.last_message_preview?.trim() ||
      getMessagePreview(latestMessage) ||
      "Open this conversation to continue messaging.";

    return {
      id: conversation.id,
      otherUserIds,
      otherUserName:
        otherUserNames.length > 0 ? otherUserNames.join(", ") : "SitGuru User",
      otherUserRole:
        otherUserRoles.length > 0 ? otherUserRoles.join(" • ") : "User",
      otherUserPhotoUrl: getProfilePhotoUrl(firstOtherProfile),
      subject,
      preview,
      status: conversation.status?.trim() || "open",
      lastActivity:
        conversation.last_message_at ||
        latestMessage?.created_at ||
        conversation.updated_at ||
        conversation.created_at ||
        null,
      unread,
      href: `/messages/${conversation.id}`,
      threadKind,
      petLabel: getPetLabel(subject, preview),
      bookingLabel: getBookingLabel(conversation),
    };
  });

  const inboxConversations = allInboxConversations.filter((conversation) => {
    if (activeFilter === "guru") return conversation.threadKind === "guru";
    if (activeFilter === "admin") return conversation.threadKind === "admin";
    if (activeFilter === "unread") return conversation.unread;
    return true;
  });

  const unreadCount = allInboxConversations.filter((item) => item.unread).length;
  const guruCount = allInboxConversations.filter((item) => item.threadKind === "guru").length;
  const adminCount = allInboxConversations.filter((item) => item.threadKind === "admin").length;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.10),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_22%),linear-gradient(180deg,#020617_0%,#0b1220_46%,#020617_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-white/15 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(17,24,39,0.97),rgba(15,23,42,0.98))] shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Link
                  href={dashboardHref}
                  className="inline-flex items-center text-sm font-semibold text-white transition hover:text-white/80"
                >
                  ← Back to dashboard
                </Link>

                <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-white/80">
                  SitGuru Messaging
                </p>

                <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Clear communication for every pet
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-8 text-white/90">
                  Keep care details, booking questions, and support conversations
                  organized in one place. The best experience starts with clear
                  pet-centered communication.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="rounded-[18px] border border-white/20 bg-white/10 px-5 py-4 text-center">
                  <p className="text-2xl font-black text-white">
                    {allInboxConversations.length}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white/85">
                    conversations
                  </p>
                </div>

                <div className="rounded-[18px] border border-white/20 bg-white/10 px-5 py-4 text-center">
                  <p className="text-2xl font-black text-white">{unreadCount}</p>
                  <p className="mt-1 text-sm font-semibold text-white/85">unread</p>
                </div>

                <Link
                  href="/search"
                  className="inline-flex items-center justify-center rounded-[18px] bg-emerald-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  Find a Guru
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[0.72fr_0.28fr]">
          <div className="rounded-[28px] border border-white/15 bg-slate-900/90 p-6 shadow-[0_20px_50px_rgba(2,6,23,0.35)] backdrop-blur-xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                  Inbox
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                  Your active message threads
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/messages"
                  className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
                    activeFilter === "all"
                      ? "border-white/25 bg-white/15 text-white"
                      : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  All
                </Link>
                <Link
                  href="/messages?filter=guru"
                  className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
                    activeFilter === "guru"
                      ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
                      : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  Guru
                </Link>
                <Link
                  href="/messages?filter=admin"
                  className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
                    activeFilter === "admin"
                      ? "border-amber-300/30 bg-amber-400/10 text-amber-100"
                      : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  Admin
                </Link>
                <Link
                  href="/messages?filter=unread"
                  className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
                    activeFilter === "unread"
                      ? "border-sky-300/30 bg-sky-400/10 text-sky-100"
                      : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  Unread
                </Link>
              </div>
            </div>

            {inboxConversations.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-white/20 bg-slate-950/90 p-6">
                <p className="text-lg font-bold text-white">No conversations yet</p>
                <p className="mt-2 text-sm leading-7 text-white/85">
                  Once you start messaging a Guru or open an Admin support thread,
                  your conversations will appear here.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/search"
                    className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
                  >
                    Find a Guru
                  </Link>
                  <Link
                    href="/messages/admin"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Message Admin
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {inboxConversations.map((conversation) => (
                  <Link
                    key={conversation.id}
                    href={conversation.href}
                    className="block rounded-[24px] border border-white/15 bg-slate-950/95 p-5 transition hover:border-white/30 hover:bg-slate-950"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar
                        name={conversation.otherUserName}
                        imageUrl={conversation.otherUserPhotoUrl}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-lg font-bold text-white">
                                {conversation.otherUserName}
                              </p>

                              {conversation.unread ? (
                                <span className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                                  New
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <span
                                className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${getThreadKindClasses(
                                  conversation.threadKind
                                )}`}
                              >
                                {getThreadKindLabel(conversation.threadKind)}
                              </span>

                              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/85">
                                {conversation.otherUserRole}
                              </span>

                              {conversation.petLabel ? (
                                <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/85">
                                  Pet: {conversation.petLabel}
                                </span>
                              ) : null}

                              {conversation.bookingLabel ? (
                                <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/85">
                                  {conversation.bookingLabel}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold capitalize ${getStatusClasses(
                              conversation.status
                            )}`}
                          >
                            {conversation.status}
                          </div>
                        </div>

                        <p className="mt-4 text-sm font-semibold text-white">
                          {conversation.subject}
                        </p>

                        <p className="mt-1 line-clamp-2 text-sm leading-7 text-white/85">
                          {conversation.preview}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs font-medium text-white/75">
                            {formatDateTime(conversation.lastActivity)}
                          </p>

                          <span className="text-sm font-semibold text-white">
                            Open thread →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-white/15 bg-slate-900/90 p-6 shadow-[0_20px_50px_rgba(2,6,23,0.35)] backdrop-blur-xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                Communication center
              </p>

              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                Keep care clear and easy
              </h2>

              <p className="mt-3 text-sm leading-7 text-white/85">
                The best customer experience starts with a pet profile, a clear
                care request, and the right conversation with your Guru or Admin.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/messages/admin"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  Message Admin
                </Link>

                <Link
                  href="/customer/dashboard"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Go to My Pets
                </Link>

                <Link
                  href="/search"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Find a Guru
                </Link>
              </div>
            </section>

            <section className="rounded-[28px] border border-white/15 bg-[linear-gradient(135deg,rgba(5,150,105,0.18),rgba(15,23,42,0.94))] p-6 shadow-[0_20px_50px_rgba(2,6,23,0.35)]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                Messaging overview
              </p>

              <div className="mt-6 space-y-3">
                <div className="rounded-[18px] border border-white/15 bg-slate-950/95 px-4 py-4 text-sm font-medium text-white">
                  {guruCount} Guru conversation{guruCount === 1 ? "" : "s"} active
                </div>
                <div className="rounded-[18px] border border-white/15 bg-slate-950/95 px-4 py-4 text-sm font-medium text-white">
                  {adminCount} Admin support thread{adminCount === 1 ? "" : "s"}
                </div>
                <div className="rounded-[18px] border border-white/15 bg-slate-950/95 px-4 py-4 text-sm font-medium text-white">
                  {unreadCount} unread update{unreadCount === 1 ? "" : "s"} waiting
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-white/15 bg-slate-900/90 p-6 shadow-[0_20px_50px_rgba(2,6,23,0.35)] backdrop-blur-xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                Helpful reminder
              </p>

              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                Talk about the pet, not just the booking
              </h2>

              <p className="mt-3 text-sm leading-7 text-white/85">
                Share routines, medications, timing, behavior, and anything your
                Guru should know. Strong pet details lead to smoother care.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/customer/dashboard"
                  className="inline-flex items-center justify-center rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Update My Pets
                </Link>

                <Link
                  href={dashboardHref}
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Back to dashboard
                </Link>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}