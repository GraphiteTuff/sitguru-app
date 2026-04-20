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

function getThreadKind(conversation: ConversationRow, otherProfile?: ProfileRow | null) {
  const subjectText = String(conversation.subject || "").trim().toLowerCase();
  const otherRole = normalizeRoleValue(otherProfile?.role);

  const looksLikeAdmin =
    subjectText.includes("admin") ||
    subjectText.includes("support") ||
    subjectText.includes("refund") ||
    subjectText.includes("escalation") ||
    subjectText.includes("payout");

  if (otherRole === "admin" || looksLikeAdmin) {
    return "admin";
  }

  if (otherRole === "guru") {
    return "guru";
  }

  return "conversation";
}

function getThreadKindLabel(kind: "admin" | "guru" | "conversation") {
  if (kind === "admin") return "Admin Support";
  if (kind === "guru") return "Guru Conversation";
  return "Conversation";
}

function getThreadKindClasses(kind: "admin" | "guru" | "conversation") {
  if (kind === "admin") {
    return "border-amber-300/30 bg-amber-400/10 text-amber-100";
  }

  if (kind === "guru") {
    return "border-emerald-300/30 bg-emerald-400/10 text-emerald-100";
  }

  return "border-white/20 bg-white/10 text-white";
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

async function sendConversationMessage(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/customer/login");
  }

  const conversationId = String(formData.get("conversationId") || "").trim();
  const recipientId = String(formData.get("recipientId") || "").trim();
  const body = String(formData.get("body") || "").trim();

  if (!conversationId || !recipientId || !body) {
    return;
  }

  const { error: insertError } = await supabaseAdmin.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    recipient_id: recipientId,
    body,
    content: body,
  });

  if (insertError) {
    console.error("Conversation send message error:", insertError.message);
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

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);
}

export default async function MessageConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  if (!conversationId) {
    notFound();
  }

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

  const { data: conversationData, error: conversationError } = await supabaseAdmin
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (conversationError) {
    console.error("Conversation detail error:", conversationError.message);
  }

  const conversation = (conversationData ?? null) as ConversationRow | null;

  if (!conversation) {
    notFound();
  }

  const isParticipant =
    String(conversation.customer_id || "") === user.id ||
    String(conversation.guru_id || "") === user.id;

  if (!isParticipant) {
    redirect("/messages");
  }

  const otherUserId =
    String(conversation.customer_id || "") === user.id
      ? String(conversation.guru_id || "").trim()
      : String(conversation.customer_id || "").trim();

  const idsToLoad = [user.id, otherUserId].filter(Boolean);

  const { data: profileRowsData, error: profilesError } =
    idsToLoad.length > 0
      ? await supabaseAdmin.from("profiles").select("*").in("id", idsToLoad)
      : { data: [], error: null as { message?: string } | null };

  if (profilesError) {
    console.error("Conversation profiles error:", profilesError.message);
  }

  const profileMap = new Map<string, ProfileRow>();
  for (const profile of (profileRowsData ?? []) as ProfileRow[]) {
    profileMap.set(String(profile.id), profile);
  }

  const otherUserProfile = otherUserId ? profileMap.get(otherUserId) ?? null : null;
  const currentUserProfile = profileMap.get(user.id) ?? currentProfile;
  const otherUserName = getProfileName(otherUserProfile);
  const otherUserRole = normalizeRoleLabel(otherUserProfile?.role);
  const currentUserName = getProfileName(currentUserProfile);

  const { data: messagesData, error: messagesError } = await supabaseAdmin
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (messagesError) {
    console.error("Conversation messages error:", messagesError.message);
  }

  const messages = (messagesData ?? []) as MessageRow[];

  const petLabel = getPetLabel(
    conversation.subject,
    conversation.last_message_preview || messages.at(-1)?.body || messages.at(-1)?.content
  );
  const bookingLabel = getBookingLabel(conversation);
  const threadKind = getThreadKind(conversation, otherUserProfile);
  const subject =
    String(conversation.subject || "").trim() ||
    (threadKind === "admin" ? "Admin support conversation" : "Care conversation");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.10),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_22%),linear-gradient(180deg,#020617_0%,#0b1220_46%,#020617_100%)] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-white/15 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(17,24,39,0.97),rgba(15,23,42,0.98))] shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Link
                  href="/messages"
                  className="inline-flex items-center text-sm font-semibold text-white transition hover:text-white/80"
                >
                  ← Back to inbox
                </Link>

                <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-white/80">
                  Conversation
                </p>

                <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                  {subject}
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/85 sm:text-base">
                  Keep pet care details, timing, routines, medications, and booking
                  questions clear in one thread.
                </p>
              </div>

              <div
                className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] ${getStatusClasses(
                  conversation.status
                )}`}
              >
                {String(conversation.status || "open")}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getThreadKindClasses(
                  threadKind
                )}`}
              >
                {getThreadKindLabel(threadKind)}
              </span>

              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85">
                {otherUserRole}: {otherUserName}
              </span>

              {petLabel ? (
                <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85">
                  Pet: {petLabel}
                </span>
              ) : null}

              {bookingLabel ? (
                <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85">
                  {bookingLabel}
                </span>
              ) : null}

              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85">
                Last activity:{" "}
                <span className="ml-1 text-white">
                  {formatLongDateTime(
                    conversation.last_message_at ||
                      conversation.updated_at ||
                      conversation.created_at
                  )}
                </span>
              </span>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[0.72fr_0.28fr]">
          <div className="rounded-[28px] border border-white/15 bg-slate-900/90 p-6 shadow-[0_20px_50px_rgba(2,6,23,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                  Thread
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                  Message history
                </h2>
              </div>

              <Link
                href={dashboardHref}
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Dashboard
              </Link>
            </div>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-slate-950/95 p-4 sm:p-5">
              {messages.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center">
                  <h3 className="text-xl font-bold text-white">No messages yet</h3>
                  <p className="mt-2 text-sm leading-7 text-white/75">
                    Start the conversation with clear care details so your Guru or
                    Admin can help faster.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const senderId = String(message.sender_id || "").trim();
                    const senderProfile = profileMap.get(senderId) ?? null;
                    const senderName =
                      senderId === user.id ? currentUserName : getProfileName(senderProfile);
                    const senderRole =
                      senderId === user.id
                        ? normalizeRoleLabel(currentUserProfile?.role)
                        : normalizeRoleLabel(senderProfile?.role);

                    const isCurrentUser = senderId === user.id;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-3xl rounded-[24px] border px-5 py-4 shadow-sm ${
                            isCurrentUser
                              ? "border-emerald-300/30 bg-emerald-400/10"
                              : "border-white/12 bg-white/[0.05]"
                          }`}
                        >
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {senderName}
                            </span>
                            <span className="text-[11px] uppercase tracking-[0.18em] text-white/60">
                              {senderRole}
                            </span>
                            <span className="text-[11px] text-white/50">
                              {formatMessageTime(message.created_at)}
                            </span>
                          </div>

                          <p className="whitespace-pre-wrap text-sm leading-7 text-white/90 sm:text-base">
                            {getMessageContent(message)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {otherUserId ? (
              <form action={sendConversationMessage} className="mt-6">
                <input type="hidden" name="conversationId" value={conversation.id} />
                <input type="hidden" name="recipientId" value={otherUserId} />

                <div className="rounded-[24px] border border-white/15 bg-slate-950/95 p-5">
                  <label
                    htmlFor="body"
                    className="mb-3 block text-xs font-bold uppercase tracking-[0.2em] text-white/80"
                  >
                    Reply
                  </label>

                  <textarea
                    id="body"
                    name="body"
                    rows={5}
                    placeholder={
                      threadKind === "admin"
                        ? "Describe the issue clearly so support can help faster..."
                        : "Share care details, timing, routines, medications, or questions..."
                    }
                    className="w-full rounded-[20px] border border-white/12 bg-white/[0.05] px-4 py-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-emerald-400/40 sm:text-base"
                    required
                  />

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs leading-6 text-white/65">
                      Tip: the clearest care happens when you mention the pet, the
                      schedule, and anything your Guru should know.
                    </p>

                    <button
                      type="submit"
                      className="inline-flex min-h-[52px] items-center justify-center rounded-[18px] bg-emerald-500 px-6 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
                    >
                      Send message
                    </button>
                  </div>
                </div>
              </form>
            ) : null}
          </div>

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-white/15 bg-slate-900/90 p-6 shadow-[0_20px_50px_rgba(2,6,23,0.35)] backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <Avatar
                  name={otherUserName}
                  imageUrl={getProfilePhotoUrl(otherUserProfile)}
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                    Participant
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                    {otherUserName}
                  </h2>
                  <p className="mt-2 text-sm text-white/80">{otherUserRole}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/messages"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  Back to inbox
                </Link>

                <Link
                  href={dashboardHref}
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Back to dashboard
                </Link>
              </div>
            </section>

            <section className="rounded-[28px] border border-white/15 bg-[linear-gradient(135deg,rgba(5,150,105,0.18),rgba(15,23,42,0.94))] p-6 shadow-[0_20px_50px_rgba(2,6,23,0.35)]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                Care clarity
              </p>

              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                Keep messages useful
              </h2>

              <div className="mt-5 space-y-3">
                <div className="rounded-[18px] border border-white/15 bg-slate-950/95 px-4 py-4 text-sm leading-7 text-white/90">
                  Mention the pet name, care dates, and what kind of help you need.
                </div>
                <div className="rounded-[18px] border border-white/15 bg-slate-950/95 px-4 py-4 text-sm leading-7 text-white/90">
                  Share medications, routines, feeding notes, and anything safety-related.
                </div>
                <div className="rounded-[18px] border border-white/15 bg-slate-950/95 px-4 py-4 text-sm leading-7 text-white/90">
                  Use Admin support for platform, booking, refund, or account questions.
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-white/15 bg-slate-900/90 p-6 shadow-[0_20px_50px_rgba(2,6,23,0.35)] backdrop-blur-xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                Thread details
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-[18px] border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/90">
                  <span className="font-semibold text-white">Subject:</span> {subject}
                </div>

                <div className="rounded-[18px] border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/90">
                  <span className="font-semibold text-white">Status:</span>{" "}
                  {String(conversation.status || "open")}
                </div>

                {petLabel ? (
                  <div className="rounded-[18px] border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/90">
                    <span className="font-semibold text-white">Pet:</span> {petLabel}
                  </div>
                ) : null}

                {bookingLabel ? (
                  <div className="rounded-[18px] border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/90">
                    <span className="font-semibold text-white">Booking:</span> {bookingLabel}
                  </div>
                ) : null}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}