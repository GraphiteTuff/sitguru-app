import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import AdminMessageComposer from "@/components/AdminMessageComposer";
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
  guru?: GuruProfileRow | null
): ProfileRow | null {
  if (!profile && !guru?.user_id) return profile;

  const guruPhotoUrl = getGuruProfilePhotoUrl(guru);

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
    profile_photo_url: profile?.profile_photo_url || guruPhotoUrl,
    avatar_url: profile?.avatar_url || guru.avatar_url || null,
    image_url: profile?.image_url || guru.image_url || null,
    role: profile?.role || "guru",
    account_type: profile?.account_type || "guru",
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

function getTopicLabel(topic?: string | null) {
  return String(topic || "").trim();
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
  conversation: ConversationRow;
  participantRoleMap: Map<string, string>;
  profile?: ProfileRow | null;
}) {
  if (senderId === currentAdminId) return "admin";

  const participantRole = normalizeRole(participantRoleMap.get(senderId));
  if (participantRole) return participantRole;

  const profileRole = normalizeRole(profile?.role);
  if (profileRole) return profileRole;

  const profileAccountType = normalizeRole(profile?.account_type);
  if (profileAccountType) return profileAccountType;

  if (senderId && senderId === conversation.customer_id) return "customer";
  if (senderId && senderId === conversation.guru_id) return "guru";

  return "customer";
}

function getAdminBubbleStyles(role?: string | null) {
  const normalized = normalizeRole(role);

  if (normalized === "admin") {
    return {
      bubble:
        "border-emerald-400/30 bg-emerald-500/15 text-white shadow-[0_18px_40px_rgba(16,185,129,0.12)]",
      badge: "border-emerald-300/30 bg-emerald-400/10 text-emerald-200",
      topic: "border-white/15 bg-white/10 text-slate-100",
      time: "text-white/70",
      body: "text-white/95",
      tail: "rounded-br-md",
    };
  }

  if (normalized === "guru") {
    return {
      bubble:
        "border-sky-400/30 bg-sky-500/15 text-white shadow-[0_18px_40px_rgba(14,165,233,0.10)]",
      badge: "border-sky-300/30 bg-sky-400/10 text-sky-200",
      topic: "border-white/15 bg-white/10 text-slate-100",
      time: "text-white/70",
      body: "text-white/95",
      tail: "rounded-bl-md",
    };
  }

  return {
    bubble:
      "border-violet-400/30 bg-violet-500/15 text-white shadow-[0_18px_40px_rgba(139,92,246,0.10)]",
    badge: "border-violet-300/30 bg-violet-400/10 text-violet-200",
    topic: "border-white/15 bg-white/10 text-slate-100",
    time: "text-white/70",
    body: "text-white/95",
    tail: "rounded-bl-md",
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
    ? "h-11 w-11 rounded-[16px] text-sm"
    : "h-14 w-14 rounded-[18px] text-lg";

  if (imageUrl) {
    return (
      <div
        className={`${sizeClasses} overflow-hidden border border-white/20 bg-white/10`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`flex ${sizeClasses} shrink-0 items-center justify-center border border-white/20 bg-white/10 font-black text-white`}
    >
      {getInitials(name)}
    </div>
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

  const { data: adminProfile } = await supabaseAdmin
    .from("profiles")
    .select("id, role, account_type")
    .eq("id", user.id)
    .maybeSingle<{
      id: string;
      role?: string | null;
      account_type?: string | null;
    }>();

  const normalizedAdminRole = normalizeRole(
    adminProfile?.role || adminProfile?.account_type || null
  );

  if (normalizedAdminRole !== "admin") {
    redirect("/dashboard");
  }

  const { data: conversation, error: conversationError } = await supabaseAdmin
    .from("conversations")
    .select(
      "id, customer_id, guru_id, booking_id, subject, topic, status, created_at, updated_at, last_message_at, last_message_preview"
    )
    .eq("id", conversationId)
    .maybeSingle<ConversationRow>();

  if (conversationError) {
    console.error("Admin conversation load error:", conversationError.message);
  }

  if (!conversation) {
    notFound();
  }

  const [{ data: messages }, { data: participants }] = await Promise.all([
    supabaseAdmin
      .from("messages")
      .select(
        "id, conversation_id, sender_id, recipient_id, content, body, created_at, topic, message_type"
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
      ].filter(Boolean)
    )
  );

  const { data: profiles } = profileIds.length
    ? await supabaseAdmin
        .from("profiles")
        .select(
          "id, full_name, first_name, last_name, email, profile_photo_url, avatar_url, image_url, role, account_type"
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

  const participantProfiles = safeParticipants
    .filter((participant) => participant.user_id !== user.id)
    .map((participant) => {
      const profile = participant.user_id
        ? profileMap.get(participant.user_id) || null
        : null;

      const role = normalizeRole(
        participant.role || profile?.role || profile?.account_type || null
      );

      return {
        userId: participant.user_id || "",
        role,
        profile,
        name: getDisplayNameForRole(profile, role),
        imageUrl: getMessageAvatarUrl({
          senderRole: role,
          profileImageUrl: getProfilePhotoUrl(profile),
        }),
      };
    });

  const subject =
    String(conversation.topic || "").trim() ||
    String(conversation.subject || "").trim() ||
    "Conversation";

  const topic = String(conversation.topic || subject || "Other").trim();
  const status = String(conversation.status || "open").trim();

  const hasGuru = participantProfiles.some(
    (participant) => normalizeRole(participant.role) === "guru"
  );

  const hasCustomer = participantProfiles.some(
    (participant) => normalizeRole(participant.role) === "customer"
  );

  const threadType = hasGuru
    ? "Guru ↔ Admin"
    : hasCustomer
      ? "Customer ↔ Admin"
      : "Admin Conversation";

  const lastActivity =
    conversation.last_message_at ||
    safeMessages[safeMessages.length - 1]?.created_at ||
    conversation.updated_at ||
    conversation.created_at ||
    null;

  return (
    <main className="min-h-screen !text-white">
      <MessageAutoRefresh intervalMs={1000} />

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.04] shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,211,160,0.16),transparent_28%),linear-gradient(135deg,#1e293b,#0f172a)] px-6 py-8 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Link
                  href="/admin/messages"
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  ← Back to Admin Messages
                </Link>

                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300">
                  {threadType}
                </p>

                <h1 className="mt-3 text-3xl font-black leading-tight text-white sm:text-5xl">
                  {subject}
                </h1>

                <p className="mt-4 text-base text-white/75">
                  Last activity:{" "}
                  <span className="font-semibold text-white">
                    {formatLongDateTime(lastActivity)}
                  </span>
                </p>
              </div>

              <span className="inline-flex w-fit rounded-full border border-emerald-300/30 bg-emerald-400/10 px-5 py-2 text-sm font-black uppercase tracking-[0.18em] text-emerald-100">
                {status}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {participantProfiles.map((participant) => (
                <div
                  key={participant.userId}
                  className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.05] px-4 py-3"
                >
                  <Avatar
                    name={participant.name}
                    imageUrl={participant.imageUrl}
                  />
                  <div>
                    <p className="text-base font-bold text-white">
                      {participant.name}
                    </p>
                    <p className="text-sm text-white/70">
                      {normalizeRole(participant.role) === "guru"
                        ? `${getFirstName(participant.name)} · Guru`
                        : getReadableRole(participant.role)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="px-6 py-8 sm:px-8 lg:px-10">
            <div className="rounded-[30px] border border-white/10 bg-[#06112c] p-5 sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
                Message History
              </p>

              <div className="mt-5 space-y-5">
                {safeMessages.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center">
                    <h2 className="text-xl font-bold text-white">
                      No messages yet
                    </h2>
                    <p className="mt-2 text-white/70">
                      This thread exists, but no messages have been sent yet.
                    </p>
                  </div>
                ) : (
                  safeMessages.map((message) => {
                    const senderId = String(message.sender_id || "").trim();
                    const senderProfile = senderId
                      ? profileMap.get(senderId) || null
                      : null;

                    const senderRole = getSenderRole({
                      senderId,
                      currentAdminId: user.id,
                      conversation,
                      participantRoleMap,
                      profile: senderProfile,
                    });

                    const senderName = getDisplayNameForRole(
                      senderProfile,
                      senderRole
                    );
                    const senderProfileImageUrl = getProfilePhotoUrl(senderProfile);
                    const senderImageUrl = getMessageAvatarUrl({
                      senderRole,
                      profileImageUrl: senderProfileImageUrl,
                    });
                    const senderRoleLabel =
                      normalizeRole(senderRole) === "guru"
                        ? `${getFirstName(senderName)} · Guru`
                        : getReadableRole(senderRole);
                    const topicLabel = getTopicLabel(message.topic || topic);
                    const isAdminMessage =
                      senderId === user.id || normalizeRole(senderRole) === "admin";
                    const styles = getAdminBubbleStyles(senderRole);

                    return (
                      <article
                        key={message.id}
                        className={`flex w-full items-end gap-3 ${
                          isAdminMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isAdminMessage ? (
                          <Avatar
                            name={senderName}
                            imageUrl={senderImageUrl}
                            compact
                          />
                        ) : null}

                        <div
                          className={`max-w-[88%] rounded-[26px] border px-5 py-4 sm:max-w-[82%] ${
                            styles.bubble
                          } ${isAdminMessage ? styles.tail : "rounded-bl-md"}`}
                        >
                          <div
                            className={`mb-2 flex flex-wrap items-center gap-2 ${
                              isAdminMessage ? "justify-end text-right" : ""
                            }`}
                          >
                            <span className="text-sm font-black text-white">
                              {senderName}
                            </span>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${styles.badge}`}
                            >
                              {senderRoleLabel}
                            </span>

                            {topicLabel ? (
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${styles.topic}`}
                              >
                                {topicLabel}
                              </span>
                            ) : null}

                            <span
                              className={`text-xs font-semibold ${styles.time}`}
                            >
                              {formatMessageTime(message.created_at)}
                            </span>
                          </div>

                          <p
                            className={`whitespace-pre-wrap text-base leading-7 ${
                              styles.body
                            } ${isAdminMessage ? "text-right" : ""}`}
                          >
                            {getMessageContent(message) ||
                              "Message content unavailable."}
                          </p>
                        </div>

                        {isAdminMessage ? (
                          <Avatar
                            name={senderName}
                            imageUrl={senderImageUrl}
                            compact
                          />
                        ) : null}
                      </article>
                    );
                  })
                )}
              </div>
            </div>

            <section className="mt-6 rounded-[30px] border border-emerald-400/20 bg-emerald-400/10 p-5 sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
                Send Admin Message
              </p>

              <div className="mt-4">
                <AdminMessageComposer
                  conversationId={conversation.id}
                  currentTopic={topic}
                />
              </div>
            </section>
          </section>
        </div>
      </section>
    </main>
  );
}