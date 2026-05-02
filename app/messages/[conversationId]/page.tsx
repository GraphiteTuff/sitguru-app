import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import Header from "@/components/Header";
import MessageThreadComposer from "@/components/MessageThreadComposer";
import MessageAutoRefresh from "@/components/MessageAutoRefresh";

export const dynamic = "force-dynamic";

const SITGURU_MESSAGE_AVATAR_URL = "/images/sitguru-message-avatar.jpg";

type ConversationRow = {
  id: string;
  customer_id?: string | null;
  guru_id?: string | null;
  booking_id?: string | null;
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
  created_at?: string | null;
  topic?: string | null;
  message_type?: string | null;
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
};

type ConversationParticipantRow = {
  conversation_id?: string | null;
  user_id?: string | null;
  role?: string | null;
};

function normalizeRole(role?: string | null) {
  const value = String(role || "").trim().toLowerCase();

  if (!value) return "";
  if (value === "provider" || value === "sitter") return "guru";
  if (value === "pet_parent" || value === "pet-parent") return "customer";
  if (value === "owner" || value === "pet_owner" || value === "pet-owner") {
    return "customer";
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

function getDisplayNameForRole(profile: ProfileRow | null, role?: string | null) {
  const normalized = normalizeRole(role);

  if (normalized === "admin") return "SitGuru Admin";

  return getProfileName(profile);
}

function getProfilePhotoUrl(profile?: ProfileRow | null) {
  if (!profile) return null;

  return (
    profile.profile_photo_url || profile.avatar_url || profile.image_url || null
  );
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
    return SITGURU_MESSAGE_AVATAR_URL;
  }

  return profileImageUrl || null;
}

function getGuruProfilePhotoUrl(guru?: GuruProfileRow | null) {
  if (!guru) return null;

  return (
    guru.profile_photo_url ||
    guru.avatar_url ||
    guru.image_url ||
    guru.photo_url ||
    guru.profile_image_url ||
    null
  );
}

function mergeGuruProfilePhoto(
  profile: ProfileRow | null,
  guru?: GuruProfileRow | null,
): ProfileRow | null {
  if (!profile && !guru?.user_id) return profile;

  const guruPhotoUrl = getGuruProfilePhotoUrl(guru);

  if (!guru) return profile;

  const profileRole = normalizeRole(profile?.role || profile?.account_type || "");
  const shouldUseGuruFields = profileRole === "guru";

  return {
    id: String(profile?.id || guru.user_id || ""),
    full_name:
      profile?.full_name ||
      (shouldUseGuruFields
        ? guru.full_name ||
          guru.display_name ||
          guru.name ||
          [guru.first_name, guru.last_name].filter(Boolean).join(" ").trim() ||
          guru.email?.split("@")[0]
        : null) ||
      "SitGuru User",
    display_name:
      profile?.display_name ||
      (shouldUseGuruFields
        ? guru.display_name || guru.full_name || guru.name
        : null) ||
      null,
    name:
      profile?.name ||
      (shouldUseGuruFields ? guru.name || guru.full_name || guru.display_name : null) ||
      null,
    first_name: profile?.first_name || (shouldUseGuruFields ? guru.first_name : null),
    last_name: profile?.last_name || (shouldUseGuruFields ? guru.last_name : null),
    email: profile?.email || guru.email || null,
    profile_photo_url:
      profile?.profile_photo_url || (shouldUseGuruFields ? guruPhotoUrl : null),
    avatar_url:
      profile?.avatar_url || (shouldUseGuruFields ? guru.avatar_url : null) || null,
    image_url:
      profile?.image_url || (shouldUseGuruFields ? guru.image_url : null) || null,
    role: profile?.role || (shouldUseGuruFields ? "guru" : "customer"),
    account_type:
      profile?.account_type || (shouldUseGuruFields ? "guru" : "customer"),
  };
}

function getFirstName(name?: string | null) {
  const safeName = String(name || "").trim();

  if (!safeName) return "Guru";

  return safeName.split(/\s+/)[0] || "Guru";
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

function getMessageContent(message?: MessageRow | null) {
  return String(message?.content || message?.body || "").trim();
}

function formatMessageTime(value?: string | null) {
  if (!value) return "";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleString("en-US", {
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

function getDashboardHref(role?: string | null) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "guru") return "/guru/dashboard";
  if (normalizedRole === "admin") return "/admin";

  return "/customer/dashboard";
}

function getConversationLabel(role?: string | null) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "guru") return "Guru Conversation";
  if (normalizedRole === "admin") return "Admin Support";
  if (normalizedRole === "customer") return "Customer Conversation";

  return "Conversation";
}

function getStatusClasses(status?: string | null) {
  const normalized = String(status || "").trim().toLowerCase();

  if (normalized === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalized === "confirmed" || normalized === "open") {
    return "border-emerald-200 bg-emerald-500 text-white";
  }

  if (
    normalized === "completed" ||
    normalized === "resolved" ||
    normalized === "closed"
  ) {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border-slate-200 bg-white text-slate-700";
}

function getSmsBubbleClasses({
  viewerRole,
  senderRole,
  isCurrentUserMessage,
}: {
  viewerRole?: string | null;
  senderRole?: string | null;
  isCurrentUserMessage: boolean;
}) {
  const viewer = normalizeRole(viewerRole);
  const sender = normalizeRole(senderRole);
  const isAdminView = viewer === "admin";

  if (isCurrentUserMessage) {
    if (sender === "admin") {
      return {
        bubble:
          "bg-teal-600 text-white rounded-[1.35rem] rounded-br-md shadow-[0_8px_18px_rgba(13,148,136,0.22)]",
        meta: "text-teal-700",
        body: "text-white",
      };
    }

    if (sender === "guru") {
      return {
        bubble:
          "bg-blue-600 text-white rounded-[1.35rem] rounded-br-md shadow-[0_8px_18px_rgba(37,99,235,0.20)]",
        meta: "text-blue-700",
        body: "text-white",
      };
    }

    return {
      bubble:
        "bg-emerald-500 text-white rounded-[1.35rem] rounded-br-md shadow-[0_8px_18px_rgba(16,185,129,0.22)]",
      meta: "text-emerald-700",
      body: "text-white",
    };
  }

  if (isAdminView && sender === "customer") {
    return {
      bubble:
        "bg-purple-600 text-white rounded-[1.35rem] rounded-bl-md shadow-[0_8px_18px_rgba(147,51,234,0.18)]",
      meta: "text-purple-700",
      body: "text-white",
    };
  }

  if (sender === "admin") {
    return {
      bubble:
        "bg-slate-900 text-white rounded-[1.35rem] rounded-bl-md shadow-[0_8px_18px_rgba(15,23,42,0.20)]",
      meta: "text-slate-700",
      body: "text-white",
    };
  }

  if (sender === "guru") {
    return {
      bubble:
        "bg-blue-600 text-white rounded-[1.35rem] rounded-bl-md shadow-[0_8px_18px_rgba(37,99,235,0.18)]",
      meta: "text-blue-700",
      body: "text-white",
    };
  }

  if (sender === "customer") {
    return {
      bubble:
        "bg-emerald-500 text-white rounded-[1.35rem] rounded-bl-md shadow-[0_8px_18px_rgba(16,185,129,0.18)]",
      meta: "text-emerald-700",
      body: "text-white",
    };
  }

  return {
    bubble:
      "bg-slate-100 text-slate-900 rounded-[1.35rem] rounded-bl-md shadow-sm",
    meta: "text-slate-600",
    body: "text-slate-900",
  };
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
    ? "h-8 w-8 rounded-full text-[11px]"
    : "h-14 w-14 rounded-full text-lg";

  if (imageUrl) {
    return (
      <div
        className={`${sizeClasses} shrink-0 overflow-hidden border-2 border-white bg-white shadow-[0_8px_18px_rgba(15,23,42,0.14)] ring-1 ring-emerald-100`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`flex ${sizeClasses} shrink-0 items-center justify-center border-2 border-white bg-emerald-50 font-black text-emerald-700 shadow-[0_8px_18px_rgba(15,23,42,0.14)] ring-1 ring-emerald-100`}
    >
      {getInitials(name)}
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-emerald-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}

function isMessageFromCurrentUser({
  message,
  currentUserId,
}: {
  message: MessageRow;
  currentUserId: string;
}) {
  const senderId = String(message.sender_id || "").trim();
  const recipientId = String(message.recipient_id || "").trim();

  if (senderId) {
    return senderId === currentUserId;
  }

  if (recipientId) {
    return recipientId !== currentUserId;
  }

  return false;
}

export default async function MessageConversationPage({
  params,
}: {
  params: Promise<{
    conversationId?: string;
    conversationid?: string;
    id?: string;
  }>;
}) {
  const routeParams = await params;
  const conversationId =
    routeParams.conversationId || routeParams.conversationid || routeParams.id || "";

  if (!conversationId) {
    notFound();
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/customer/login");
  }

  const { data: conversation, error: conversationError } = await supabaseAdmin
    .from("conversations")
    .select(
      "id, customer_id, guru_id, booking_id, subject, topic, status, created_at, updated_at, last_message_at, last_message_preview",
    )
    .eq("id", conversationId)
    .maybeSingle<ConversationRow>();

  if (conversationError) {
    console.error("Conversation load error:", conversationError.message);
  }

  if (!conversation) {
    notFound();
  }

  const [{ data: messages }, { data: participants }] = await Promise.all([
    supabaseAdmin
      .from("messages")
      .select(
        "id, conversation_id, sender_id, recipient_id, content, body, created_at, topic, message_type",
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("conversation_participants")
      .select("conversation_id, user_id, role")
      .eq("conversation_id", conversationId),
  ]);

  const safeMessages = (messages || []) as MessageRow[];
  const safeParticipants = (participants || []) as ConversationParticipantRow[];

  const participantRoleMap = new Map<string, string>();
  safeParticipants.forEach((participant) => {
    const participantId = String(participant.user_id || "").trim();

    if (!participantId) return;

    participantRoleMap.set(participantId, normalizeRole(participant.role || ""));
  });

  const allowedUserIds = new Set(
    [
      conversation.customer_id || "",
      conversation.guru_id || "",
      ...safeParticipants.map((participant) => participant.user_id || ""),
    ].filter(Boolean),
  );

  if (!allowedUserIds.has(user.id)) {
    redirect("/customer/dashboard");
  }

  const profileIds = Array.from(
    new Set(
      [
        user.id,
        conversation.customer_id || "",
        conversation.guru_id || "",
        ...safeParticipants.map((participant) => participant.user_id || ""),
        ...safeMessages.flatMap((message) => [
          message.sender_id || "",
          message.recipient_id || "",
        ]),
      ].filter(Boolean),
    ),
  );

  const { data: profiles } = profileIds.length
    ? await supabaseAdmin
        .from("profiles")
        .select(
          "id, full_name, first_name, last_name, email, profile_photo_url, avatar_url, image_url, role, account_type",
        )
        .in("id", profileIds)
    : { data: [] as ProfileRow[] };

  const { data: guruProfiles } = profileIds.length
    ? await supabaseAdmin.from("gurus").select("*").in("user_id", profileIds)
    : { data: [] as GuruProfileRow[] };

  const guruProfileMap = new Map<string, GuruProfileRow>();
  ((guruProfiles || []) as GuruProfileRow[]).forEach((guruProfile) => {
    const guruUserId = String(guruProfile.user_id || "").trim();

    if (guruUserId) {
      guruProfileMap.set(guruUserId, guruProfile);
    }
  });

  const profileMap = new Map<string, ProfileRow>();
  ((profiles || []) as ProfileRow[]).forEach((profile) => {
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

  const currentUserProfile = profileMap.get(user.id) || null;
  const currentUserRole = normalizeRole(
    participantRoleMap.get(user.id) ||
      currentUserProfile?.role ||
      currentUserProfile?.account_type ||
      (user.id === conversation.customer_id
        ? "customer"
        : user.id === conversation.guru_id
          ? "guru"
          : ""),
  );

  const inboxHref =
    currentUserRole === "guru"
      ? "/guru/dashboard/messages"
      : currentUserRole === "admin"
        ? "/admin/messages"
        : "/messages";

  const otherParticipantId =
    Array.from(allowedUserIds).find((participantId) => participantId !== user.id) ||
    "";

  const otherProfile = otherParticipantId
    ? profileMap.get(otherParticipantId) || null
    : null;

  const otherRole = normalizeRole(
    participantRoleMap.get(otherParticipantId) ||
      otherProfile?.role ||
      otherProfile?.account_type ||
      (otherParticipantId === conversation.customer_id
        ? "customer"
        : otherParticipantId === conversation.guru_id
          ? "guru"
          : ""),
  );

  const otherName = getDisplayNameForRole(otherProfile, otherRole);
  const otherProfileImageUrl = getProfilePhotoUrl(otherProfile);
  const otherImageUrl = getMessageAvatarUrl({
    senderRole: otherRole,
    profileImageUrl: otherProfileImageUrl,
  });

  const subject =
    String(conversation.topic || "").trim() ||
    String(conversation.subject || "").trim() ||
    "Conversation";

  const topic = String(conversation.topic || subject || "Other").trim();
  const status = String(conversation.status || "open").trim();
  const dashboardHref = getDashboardHref(currentUserRole);
  const conversationLabel = getConversationLabel(otherRole);

  const lastActivity =
    conversation.last_message_at ||
    safeMessages[safeMessages.length - 1]?.created_at ||
    conversation.updated_at ||
    conversation.created_at ||
    null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_30%),linear-gradient(180deg,#ffffff,#f2fbf7_48%,#ffffff)] text-slate-950">
      <Header />
      <MessageAutoRefresh intervalMs={1000} />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.10)]">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_30%),linear-gradient(135deg,#ffffff,#ecfdf5)] p-6 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <Link
                  href={inboxHref}
                  className="inline-flex rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                >
                  ← Back to inbox
                </Link>

                <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-emerald-600">
                  {conversationLabel}
                </p>

                <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
                  {subject}
                </h1>

                <p className="mt-4 max-w-4xl text-base font-semibold leading-8 text-slate-700">
                  Keep pet care details, timing, routines, medications, booking
                  questions, application updates, and account support clear in one
                  thread.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                    {otherRole === "admin" ? "Admin Support" : conversationLabel}
                  </span>

                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">
                    Topic: {topic}
                  </span>

                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">
                    Last activity: {formatLongDateTime(lastActivity)}
                  </span>
                </div>
              </div>

              <span
                className={`inline-flex w-fit rounded-full border px-5 py-2 text-sm font-black uppercase tracking-[0.18em] shadow-sm ${getStatusClasses(
                  status,
                )}`}
              >
                {status}
              </span>
            </div>
          </div>

          <div className="grid gap-6 bg-[#f7fcfa] p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_330px]">
            <section className="space-y-6">
              <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-600">
                      Thread
                    </p>

                    <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                      Message history
                    </h2>
                  </div>

                  <Link
                    href={dashboardHref}
                    className="inline-flex rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                  >
                    Dashboard
                  </Link>
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-emerald-100 bg-[#eefaf4] p-4 sm:p-5">
                  {safeMessages.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-dashed border-emerald-200 bg-white px-6 py-12 text-center">
                      <h3 className="text-2xl font-black text-slate-950">
                        No messages yet
                      </h3>

                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                        Start the conversation with clear details so SitGuru can
                        help faster.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {safeMessages.map((message) => {
                        const senderId = String(message.sender_id || "").trim();
                        const fallbackSenderProfile = senderId
                          ? profileMap.get(senderId) || null
                          : null;

                        const isCurrentUserMessage = isMessageFromCurrentUser({
                          message,
                          currentUserId: user.id,
                        });

                        const senderRole = isCurrentUserMessage
                          ? currentUserRole ||
                            normalizeRole(fallbackSenderProfile?.role)
                          : otherRole || normalizeRole(fallbackSenderProfile?.role);

                        const senderProfile = isCurrentUserMessage
                          ? currentUserProfile || fallbackSenderProfile
                          : otherProfile || fallbackSenderProfile;

                        const senderName = getDisplayNameForRole(
                          senderProfile,
                          senderRole,
                        );

                        const senderProfileImageUrl =
                          getProfilePhotoUrl(senderProfile);

                        const senderImageUrl = getMessageAvatarUrl({
                          senderRole,
                          profileImageUrl: senderProfileImageUrl,
                        });

                        const senderRoleLabel =
                          normalizeRole(senderRole) === "guru"
                            ? `${getFirstName(senderName)} · Guru`
                            : getReadableRole(senderRole);

                        const styles = getSmsBubbleClasses({
                          viewerRole: currentUserRole,
                          senderRole,
                          isCurrentUserMessage,
                        });

                        return (
                          <article
                            key={message.id}
                            className={`flex w-full flex-col ${
                              isCurrentUserMessage ? "items-end" : "items-start"
                            }`}
                          >
                            <div
                              className={`mb-1 flex max-w-[82%] items-center gap-2 px-10 text-[11px] font-black uppercase tracking-[0.12em] ${
                                isCurrentUserMessage
                                  ? "justify-end text-right"
                                  : "justify-start"
                              } ${styles.meta}`}
                            >
                              <span>{senderRoleLabel}</span>
                              <span className="font-bold opacity-70">
                                {formatMessageTime(message.created_at)}
                              </span>
                            </div>

                            <div
                              className={`flex max-w-[82%] items-end gap-2 ${
                                isCurrentUserMessage
                                  ? "flex-row-reverse"
                                  : "flex-row"
                              }`}
                            >
                              <Avatar
                                name={senderName}
                                imageUrl={senderImageUrl}
                                compact
                              />

                              <div className={`px-4 py-2.5 ${styles.bubble}`}>
                                <p
                                  className={`whitespace-pre-wrap text-[15px] leading-6 ${
                                    styles.body
                                  } ${
                                    isCurrentUserMessage ? "text-right" : ""
                                  }`}
                                >
                                  {getMessageContent(message) ||
                                    "Message content unavailable."}
                                </p>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
                <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-600">
                  Reply
                </p>

                <div className="mt-4">
                  <MessageThreadComposer
                    conversationId={conversation.id}
                    currentUserId={user.id}
                    currentTopic={topic}
                  />
                </div>
              </section>
            </section>

            <aside className="space-y-6">
              <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-600">
                  Participant
                </p>

                <div className="mt-5 flex items-center gap-4">
                  <Avatar name={otherName} imageUrl={otherImageUrl} />

                  <div>
                    <p className="text-lg font-black text-slate-950">
                      {otherName}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {getReadableRole(otherRole)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  <Link
                    href={inboxHref}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-600"
                  >
                    Back to inbox
                  </Link>

                  <Link
                    href={dashboardHref}
                    className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                  >
                    Back to dashboard
                  </Link>
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-600">
                  Care Clarity
                </p>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                  Keep messages useful
                </h2>

                <div className="mt-5 space-y-3">
                  {[
                    "Mention the pet name, care dates, and what kind of help you need.",
                    "Share medications, routines, feeding notes, and anything safety-related.",
                    "Use Admin support for platform, booking, refund, or account questions.",
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

              <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-600">
                  Thread Details
                </p>

                <div className="mt-5 grid gap-3">
                  <DetailCard label="Topic" value={topic} />
                  <DetailCard
                    label="Subject"
                    value={conversation.subject || "Direct Admin Support"}
                  />
                  <DetailCard label="Status" value={status} />
                </div>
              </section>
            </aside>
          </div>
        </section>
      </section>
    </main>
  );
}