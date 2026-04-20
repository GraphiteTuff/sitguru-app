import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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
};

type ConversationParticipantRow = {
  conversation_id: string;
  user_id: string;
  role?: string | null;
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

function getMessageContent(message?: MessageRow | null) {
  const value = message?.content || message?.body || "";
  return String(value).trim();
}

function normalizeRole(role?: string | null) {
  const value = String(role || "").trim().toLowerCase();
  if (!value) return "";
  if (value === "provider" || value === "sitter") return "guru";
  return value;
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

async function sendAdminMessage(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/customer/login");
  }

  const { data: currentProfile } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle<{ id: string; role?: string | null }>();

  if (normalizeRole(currentProfile?.role) !== "admin") {
    redirect("/customer/dashboard");
  }

  const conversationId = String(formData.get("conversationId") || "").trim();
  const body = String(formData.get("body") || "").trim();

  if (!conversationId || !body) {
    return;
  }

  const { data: participants } = await supabaseAdmin
    .from("conversation_participants")
    .select("conversation_id, user_id, role")
    .eq("conversation_id", conversationId);

  const safeParticipants = (participants || []) as ConversationParticipantRow[];

  const recipientIds = safeParticipants
    .map((participant) => participant.user_id)
    .filter((participantUserId) => participantUserId && participantUserId !== user.id);

  const primaryRecipientId = recipientIds[0] || null;

  const { error: insertError } = await supabaseAdmin.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    recipient_id: primaryRecipientId,
    body,
    content: body,
  });

  if (insertError) {
    console.error("Admin message send error:", insertError.message);
    return;
  }

  await supabaseAdmin
    .from("conversations")
    .update({
      last_message_at: new Date().toISOString(),
      last_message_preview: body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${conversationId}`);
}

export default async function AdminMessageConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/customer/login");
  }

  const { data: adminProfile } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle<{ id: string; role?: string | null }>();

  if (normalizeRole(adminProfile?.role) !== "admin") {
    redirect("/customer/dashboard");
  }

  const { data: conversation, error: conversationError } = await supabaseAdmin
    .from("conversations")
    .select(
      "id, customer_id, guru_id, booking_id, subject, status, created_at, updated_at, last_message_at, last_message_preview"
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
      .select("id, conversation_id, sender_id, recipient_id, content, body, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("conversation_participants")
      .select("conversation_id, user_id, role")
      .eq("conversation_id", conversationId),
  ]);

  const safeMessages = (messages || []) as MessageRow[];
  const safeParticipants = (participants || []) as ConversationParticipantRow[];

  const profileIds = Array.from(
    new Set(
      [
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
          "id, full_name, display_name, name, first_name, last_name, email, profile_photo_url, avatar_url, image_url, role"
        )
        .in("id", profileIds)
    : { data: [] as ProfileRow[] };

  const profileMap = new Map<string, ProfileRow>();
  ((profiles || []) as ProfileRow[]).forEach((profile) => {
    profileMap.set(profile.id, profile);
  });

  const participantProfiles = safeParticipants.map((participant) => {
    const profile = profileMap.get(participant.user_id) || null;
    return {
      userId: participant.user_id,
      role: normalizeRole(participant.role || profile?.role || null),
      profile,
      name: getProfileName(profile),
      imageUrl: getProfilePhotoUrl(profile),
    };
  });

  const subjectText = String(conversation.subject || "").trim().toLowerCase();
  const looksLikeAdminSupport =
    subjectText.includes("admin") ||
    subjectText.includes("support") ||
    subjectText.includes("payout") ||
    subjectText.includes("refund") ||
    subjectText.includes("escalation");

  const hasAdminParticipant = participantProfiles.some(
    (participant) => participant.role === "admin"
  );

  const threadType =
    hasAdminParticipant || looksLikeAdminSupport ? "Guru ↔ Admin" : "Guru ↔ Customer";

  const subject =
    String(conversation.subject || "").trim() ||
    (hasAdminParticipant || looksLikeAdminSupport
      ? "Admin support conversation"
      : "Customer care conversation");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#1f3158_0%,_#0b1220_55%,_#060b16_100%)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.04] shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <section className="border-b border-white/10 px-6 py-8 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Link
                  href="/admin/messages"
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  ← Back to Admin Messages
                </Link>

                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                  {threadType}
                </p>

                <h1 className="mt-3 text-3xl font-black leading-tight text-white sm:text-5xl">
                  {subject}
                </h1>

                <p className="mt-4 text-base text-white/75">
                  Last activity:{" "}
                  <span className="font-semibold text-white">
                    {formatLongDateTime(
                      conversation.last_message_at ||
                        conversation.updated_at ||
                        conversation.created_at
                    )}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {participantProfiles.map((participant) => (
                <div
                  key={participant.userId}
                  className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.05] px-4 py-3"
                >
                  <Avatar name={participant.name} imageUrl={participant.imageUrl} />
                  <div>
                    <p className="text-base font-bold text-white">{participant.name}</p>
                    <p className="text-sm capitalize text-white/70">
                      {participant.role || "user"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="px-6 py-8 sm:px-8 lg:px-10">
            <div className="rounded-[30px] border border-white/10 bg-[#06112c] p-5 sm:p-6">
              <div className="space-y-4">
                {safeMessages.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center">
                    <h2 className="text-xl font-bold text-white">No messages yet</h2>
                    <p className="mt-2 text-white/70">
                      This thread exists, but no messages have been sent yet.
                    </p>
                  </div>
                ) : (
                  safeMessages.map((message) => {
                    const senderProfile = message.sender_id
                      ? profileMap.get(message.sender_id)
                      : null;
                    const senderName = getProfileName(senderProfile);
                    const senderRole = normalizeRole(senderProfile?.role);
                    const isAdminSender = senderRole === "admin";

                    return (
                      <div
                        key={message.id}
                        className={`max-w-3xl rounded-[26px] border px-5 py-4 ${
                          isAdminSender
                            ? "ml-auto border-emerald-400/25 bg-emerald-400/10"
                            : "mr-auto border-white/12 bg-white/[0.05]"
                        }`}
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-white">{senderName}</span>
                          <span className="text-xs uppercase tracking-[0.22em] text-white/60">
                            {senderRole || "user"}
                          </span>
                          <span className="text-xs text-white/50">
                            {formatMessageTime(message.created_at)}
                          </span>
                        </div>

                        <p className="whitespace-pre-wrap text-base leading-7 text-white/90">
                          {getMessageContent(message)}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <form action={sendAdminMessage} className="mt-6">
              <input type="hidden" name="conversationId" value={conversation.id} />

              <div className="rounded-[30px] border border-white/10 bg-[#08152f] p-5 sm:p-6">
                <label
                  htmlFor="body"
                  className="mb-3 block text-sm font-semibold uppercase tracking-[0.25em] text-white/70"
                >
                  Send Admin Message
                </label>

                <textarea
                  id="body"
                  name="body"
                  rows={5}
                  placeholder="Reply inside this thread as Admin..."
                  className="w-full rounded-[22px] border border-white/12 bg-white/[0.05] px-5 py-4 text-base text-white outline-none placeholder:text-white/35"
                  required
                />

                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex min-h-[58px] items-center justify-center rounded-[20px] bg-[#10d3a0] px-8 text-lg font-bold text-[#03131c] transition hover:translate-y-[-1px] hover:brightness-105"
                  >
                    Send Message
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}