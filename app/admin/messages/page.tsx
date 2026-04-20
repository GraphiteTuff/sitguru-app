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

type AdminThreadCard = {
  id: string;
  subject: string;
  preview: string;
  href: string;
  type: "guru-customer" | "guru-admin";
  lastActivity: string | null;
  customerName: string | null;
  guruName: string | null;
  adminName: string | null;
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

function normalizeRole(role?: string | null) {
  const value = String(role || "").trim().toLowerCase();

  if (!value) return "";
  if (value === "provider" || value === "sitter") return "guru";

  return value;
}

function formatRelativeTime(value?: string | null) {
  if (!value) return "No recent activity";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No recent activity";

  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.floor(diffMs / 1000 / 60);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getThreadTypeLabel(type: AdminThreadCard["type"]) {
  return type === "guru-admin" ? "Guru ↔ Admin" : "Guru ↔ Customer";
}

function getThreadTypeClasses(type: AdminThreadCard["type"]) {
  return type === "guru-admin"
    ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
    : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
}

function getCardBorderClasses(type: AdminThreadCard["type"]) {
  return type === "guru-admin"
    ? "border-amber-400/20"
    : "border-cyan-400/20";
}

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const activeFilter =
    params?.filter === "guru-admin" || params?.filter === "guru-customer"
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

  const { data: adminProfile, error: adminProfileError } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle<{ id: string; role?: string | null }>();

  const normalizedAdminRole = normalizeRole(adminProfile?.role);

  if (adminProfileError || normalizedAdminRole !== "admin") {
    redirect("/customer/dashboard");
  }

  const { data: conversations, error: conversationsError } = await supabaseAdmin
    .from("conversations")
    .select(
      "id, customer_id, guru_id, booking_id, subject, status, created_at, updated_at, last_message_at, last_message_preview"
    )
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false, nullsFirst: false });

  if (conversationsError) {
    console.error("Admin conversations load error:", conversationsError.message);
  }

  const safeConversations = ((conversations || []) as ConversationRow[]).filter(Boolean);
  const conversationIds = safeConversations.map((conversation) => conversation.id);

  const [{ data: participants }, { data: messages }] = await Promise.all([
    conversationIds.length
      ? supabaseAdmin
          .from("conversation_participants")
          .select("conversation_id, user_id, role")
          .in("conversation_id", conversationIds)
      : Promise.resolve({ data: [] as ConversationParticipantRow[] }),
    conversationIds.length
      ? supabaseAdmin
          .from("messages")
          .select("id, conversation_id, sender_id, recipient_id, content, body, created_at")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as MessageRow[] }),
  ]);

  const safeParticipants = (participants || []) as ConversationParticipantRow[];
  const safeMessages = (messages || []) as MessageRow[];

  const profileIds = Array.from(
    new Set(
      [
        ...safeConversations.flatMap((conversation) => [
          conversation.customer_id || "",
          conversation.guru_id || "",
        ]),
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

  const participantMap = new Map<string, ConversationParticipantRow[]>();
  safeParticipants.forEach((participant) => {
    const existing = participantMap.get(participant.conversation_id) || [];
    existing.push(participant);
    participantMap.set(participant.conversation_id, existing);
  });

  const latestMessageMap = new Map<string, MessageRow>();
  safeMessages.forEach((message) => {
    if (!message.conversation_id) return;
    if (!latestMessageMap.has(message.conversation_id)) {
      latestMessageMap.set(message.conversation_id, message);
    }
  });

  const adminThreads: AdminThreadCard[] = safeConversations
    .map((conversation) => {
      const participantsForConversation = participantMap.get(conversation.id) || [];

      const participantRoles = participantsForConversation.map((participant) =>
        normalizeRole(participant.role)
      );

      const hasAdminParticipant = participantRoles.includes("admin");
      const hasGuruParticipant =
        participantRoles.includes("guru") || Boolean(conversation.guru_id);
      const hasCustomerParticipant =
        participantRoles.includes("customer") || Boolean(conversation.customer_id);

      const subjectText = String(conversation.subject || "").trim().toLowerCase();
      const looksLikeAdminSupport =
        subjectText.includes("admin") ||
        subjectText.includes("support") ||
        subjectText.includes("payout") ||
        subjectText.includes("refund") ||
        subjectText.includes("escalation");

      const threadType: AdminThreadCard["type"] =
        hasAdminParticipant || looksLikeAdminSupport ? "guru-admin" : "guru-customer";

      const guruProfile = conversation.guru_id
        ? profileMap.get(conversation.guru_id)
        : participantsForConversation
            .map((participant) => profileMap.get(participant.user_id))
            .find((profile) => normalizeRole(profile?.role) === "guru");

      const customerProfile = conversation.customer_id
        ? profileMap.get(conversation.customer_id)
        : participantsForConversation
            .map((participant) => profileMap.get(participant.user_id))
            .find((profile) => normalizeRole(profile?.role) === "customer");

      const adminParticipant = participantsForConversation.find(
        (participant) => normalizeRole(participant.role) === "admin"
      );
      const adminDisplayProfile = adminParticipant?.user_id
        ? profileMap.get(adminParticipant.user_id)
        : profileMap.get(user.id);

      const latestMessage = latestMessageMap.get(conversation.id);

      const preview =
        String(
          latestMessage?.content ||
            latestMessage?.body ||
            conversation.last_message_preview ||
            ""
        ).trim() || "No messages yet.";

      const subject =
        String(conversation.subject || "").trim() ||
        (threadType === "guru-admin"
          ? "Admin support conversation"
          : "Customer care conversation");

      return {
        id: conversation.id,
        subject,
        preview,
        href: `/admin/messages/${conversation.id}`,
        type: threadType,
        lastActivity:
          latestMessage?.created_at ||
          conversation.last_message_at ||
          conversation.updated_at ||
          conversation.created_at ||
          null,
        customerName:
          hasCustomerParticipant || conversation.customer_id
            ? getProfileName(customerProfile || null)
            : null,
        guruName:
          hasGuruParticipant || conversation.guru_id
            ? getProfileName(guruProfile || null)
            : null,
        adminName:
          threadType === "guru-admin" ? getProfileName(adminDisplayProfile || null) : null,
      };
    })
    .filter((thread) =>
      activeFilter === "all" ? true : thread.type === activeFilter
    )
    .sort((a, b) => {
      const aTime = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
      const bTime = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
      return bTime - aTime;
    });

  const allGuruCustomer = adminThreads.filter((thread) => thread.type === "guru-customer").length;
  const allGuruAdmin = adminThreads.filter((thread) => thread.type === "guru-admin").length;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#1f3158_0%,_#0b1220_55%,_#060b16_100%)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.04] shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <section className="border-b border-white/10 px-6 py-8 sm:px-8 lg:px-10">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                  Message Oversight
                </p>
                <h1 className="max-w-4xl text-4xl font-black leading-[0.95] text-white sm:text-5xl lg:text-7xl">
                  Guru, customer, and admin conversation review
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/85 sm:text-xl">
                  Give Admin a fast oversight view of recent Guru ↔ Customer and
                  Guru ↔ Admin threads with subjects, latest previews,
                  participant visibility, and direct open-thread access.
                </p>
              </div>

              <div className="flex flex-col gap-4 lg:items-end">
                <Link
                  href="/admin/messages"
                  className="inline-flex min-h-[72px] items-center justify-center rounded-[24px] bg-[#10d3a0] px-8 text-center text-2xl font-bold text-[#03131c] shadow-lg transition hover:translate-y-[-1px] hover:brightness-105"
                >
                  Open Messages
                </Link>

                <Link
                  href="/admin/messages?filter=guru-admin"
                  className={`inline-flex min-h-[72px] items-center justify-center rounded-[24px] border px-6 text-center text-xl font-semibold transition hover:border-white/30 hover:bg-white/10 ${
                    activeFilter === "guru-admin"
                      ? "border-white/25 bg-white/12 text-white"
                      : "border-white/15 bg-white/[0.05] text-white/90"
                  }`}
                >
                  Guru ↔ Admin
                </Link>

                <Link
                  href="/admin/messages?filter=guru-customer"
                  className={`inline-flex min-h-[72px] items-center justify-center rounded-[24px] border px-6 text-center text-xl font-semibold transition hover:border-white/30 hover:bg-white/10 ${
                    activeFilter === "guru-customer"
                      ? "border-white/25 bg-white/12 text-white"
                      : "border-white/15 bg-white/[0.05] text-white/90"
                  }`}
                >
                  Guru ↔ Customer
                </Link>
              </div>
            </div>
          </section>

          <section className="px-6 py-8 sm:px-8 lg:px-10">
            <div className="space-y-6">
              {adminThreads.length === 0 ? (
                <div className="rounded-[30px] border border-dashed border-white/15 bg-[#07122c] px-6 py-12 text-center">
                  <h2 className="text-2xl font-bold text-white">No conversations found</h2>
                  <p className="mt-3 text-base text-white/70">
                    There are no threads matching the selected filter yet.
                  </p>
                </div>
              ) : (
                adminThreads.map((thread) => (
                  <div
                    key={thread.id}
                    className={`grid gap-6 rounded-[32px] border bg-[#041032] px-6 py-7 shadow-[0_16px_40px_rgba(0,0,0,0.28)] lg:grid-cols-[minmax(0,1fr)_220px] ${getCardBorderClasses(
                      thread.type
                    )}`}
                  >
                    <div>
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-bold ${getThreadTypeClasses(
                            thread.type
                          )}`}
                        >
                          {getThreadTypeLabel(thread.type)}
                        </span>

                        <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/75">
                          Last activity · {formatRelativeTime(thread.lastActivity)}
                        </span>
                      </div>

                      <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl">
                        {thread.subject}
                      </h2>

                      <p className="mt-3 max-w-4xl text-lg leading-8 text-white/85">
                        {thread.preview}
                      </p>

                      <div className="mt-6 flex flex-wrap gap-3">
                        {thread.customerName ? (
                          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-base font-semibold text-white">
                            Customer: {thread.customerName}
                          </span>
                        ) : null}

                        {thread.guruName ? (
                          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-base font-semibold text-white">
                            Guru: {thread.guruName}
                          </span>
                        ) : null}

                        {thread.adminName ? (
                          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-base font-semibold text-white">
                            Admin: {thread.adminName}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-start justify-start lg:justify-end">
                      <Link
                        href={thread.href}
                        className="inline-flex min-h-[76px] min-w-[180px] items-center justify-center rounded-[24px] border border-white/15 bg-white/[0.05] px-6 text-center text-2xl font-bold text-white transition hover:border-white/30 hover:bg-white/10"
                      >
                        Open Thread
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[28px] border border-white/12 bg-white/[0.05] px-6 py-6">
                <p className="text-xs uppercase tracking-[0.32em] text-white/75">
                  Active reviewed threads
                </p>
                <p className="mt-4 text-5xl font-black text-white">{adminThreads.length}</p>
              </div>

              <div className="rounded-[28px] border border-white/12 bg-white/[0.05] px-6 py-6">
                <p className="text-xs uppercase tracking-[0.32em] text-white/75">
                  Guru ↔ Customer
                </p>
                <p className="mt-4 text-5xl font-black text-white">{allGuruCustomer}</p>
              </div>

              <div className="rounded-[28px] border border-white/12 bg-white/[0.05] px-6 py-6">
                <p className="text-xs uppercase tracking-[0.32em] text-white/75">
                  Guru ↔ Admin
                </p>
                <p className="mt-4 text-5xl font-black text-white">{allGuruAdmin}</p>
              </div>

              <div className="rounded-[28px] border border-white/12 bg-white/[0.05] px-6 py-6">
                <p className="text-xs uppercase tracking-[0.32em] text-white/75">
                  Escalations open
                </p>
                <p className="mt-4 text-5xl font-black text-white">{allGuruAdmin}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}