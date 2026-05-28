import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  role?: string | null;
  user_role?: string | null;
  account_type?: string | null;
  type?: string | null;
};

type MessageRow = {
  id: string;
  conversation_id?: string | null;
  sender_id?: string | null;
  recipient_id?: string | null;
  sender_role?: string | null;
  sender_role_snapshot?: string | null;
  sender_name_snapshot?: string | null;
  content?: string | null;
  body?: string | null;
  status?: string | null;
  read_at?: string | null;
  is_read?: boolean | null;
  is_deleted?: boolean | null;
  created_at?: string | null;
};

type ConversationParticipantRow = {
  conversation_id: string;
  user_id: string;
  role?: string | null;
};

const SUPER_ADMIN_EMAILS = new Set(["jason@sitguru.com", "nette@sitguru.com"]);

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanEmail(value: unknown) {
  return asString(value).toLowerCase();
}

function normalizeRole(role?: string | null) {
  const value = String(role || "").trim().toLowerCase();

  if (!value) return "";
  if (value === "provider" || value === "sitter") return "guru";

  if (
    value === "pet_parent" ||
    value === "pet-parent" ||
    value === "pet parent" ||
    value === "client" ||
    value === "pet_owner" ||
    value === "pet-owner"
  ) {
    return "customer";
  }

  if (
    value === "admin" ||
    value === "super_admin" ||
    value === "super-admin" ||
    value === "site_admin" ||
    value === "site-admin" ||
    value === "admin_user" ||
    value === "admin-user" ||
    value.includes("admin") ||
    value === "founder" ||
    value === "owner"
  ) {
    return "admin";
  }

  if (value === "partner" || value === "affiliate") {
    return "ambassador";
  }

  return value;
}

function getProfileRole(profile?: ProfileRow | null, email?: string | null) {
  const normalized = normalizeRole(
    profile?.role || profile?.user_role || profile?.account_type || profile?.type,
  );

  if (normalized) return normalized;

  if (SUPER_ADMIN_EMAILS.has(cleanEmail(email || profile?.email))) {
    return "admin";
  }

  return "user";
}

function getProfileName(profile?: ProfileRow | null) {
  if (!profile) return "SitGuru User";

  const candidate =
    profile.full_name ||
    profile.display_name ||
    (profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : null) ||
    profile.first_name ||
    profile.last_name ||
    profile.email?.split("@")[0] ||
    "SitGuru User";

  return String(candidate).trim() || "SitGuru User";
}

function getMessageBody(message?: MessageRow | null) {
  if (!message) return "";

  return asString(message.content) || asString(message.body);
}

function getPreview(message?: MessageRow | null) {
  const body = getMessageBody(message)
    .replace(/\s+/g, " ")
    .trim();

  if (!body) return "You have a new SitGuru message.";

  return body.length > 160 ? `${body.slice(0, 157)}...` : body;
}

function isUnreadMessageForUser(message: MessageRow, currentUserId: string) {
  const status = asString(message.status).toLowerCase();

  if (!message.id) return false;
  if (message.is_deleted === true) return false;
  if (!message.conversation_id) return false;
  if (message.sender_id === currentUserId) return false;

  if (message.recipient_id && message.recipient_id !== currentUserId) {
    return false;
  }

  if (message.is_read === false) return true;

  if (!message.read_at && status !== "read" && status !== "archived") {
    return true;
  }

  return false;
}

function getThreadHref({
  conversationId,
  currentUserRole,
}: {
  conversationId: string;
  currentUserRole: string;
}) {
  if (currentUserRole === "admin") {
    return `/admin/messages/${encodeURIComponent(conversationId)}`;
  }

  return `/messages/${encodeURIComponent(conversationId)}`;
}

async function safeRows<T>(query: PromiseLike<{ data: unknown; error: unknown }>) {
  try {
    const result = await query;

    if (result.error || !Array.isArray(result.data)) {
      return [] as T[];
    }

    return result.data as T[];
  } catch {
    return [] as T[];
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          alerts: [],
          unreadCount: 0,
        },
        { status: 200 },
      );
    }

    const currentProfileResult = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const currentProfile = (currentProfileResult.data || null) as ProfileRow | null;
    const currentUserRole = getProfileRole(currentProfile, user.email);

    const participantRows = await safeRows<ConversationParticipantRow>(
      supabaseAdmin
        .from("conversation_participants")
        .select("conversation_id,user_id,role")
        .eq("user_id", user.id)
        .limit(1000),
    );

    const participantConversationIds = participantRows
      .map((row) => asString(row.conversation_id))
      .filter(Boolean);

    if (participantConversationIds.length === 0) {
      return NextResponse.json({
        alerts: [],
        unreadCount: 0,
      });
    }

    const recentMessages = await safeRows<MessageRow>(
      supabaseAdmin
        .from("messages")
        .select("*")
        .in("conversation_id", participantConversationIds)
        .order("created_at", { ascending: false })
        .limit(200),
    );

    const unreadMessages = recentMessages.filter((message) =>
      isUnreadMessageForUser(message, user.id),
    );

    const senderIds = Array.from(
      new Set(
        unreadMessages
          .map((message) => asString(message.sender_id))
          .filter(Boolean),
      ),
    );

    const senderProfiles =
      senderIds.length > 0
        ? await safeRows<ProfileRow>(
            supabaseAdmin.from("profiles").select("*").in("id", senderIds),
          )
        : [];

    const senderProfileMap = new Map<string, ProfileRow>();

    senderProfiles.forEach((profile) => {
      if (profile.id) {
        senderProfileMap.set(profile.id, profile);
      }
    });

    const alerts = unreadMessages.slice(0, 5).map((message) => {
      const senderId = asString(message.sender_id);
      const senderProfile = senderProfileMap.get(senderId) || null;

      const senderName =
        asString(message.sender_name_snapshot) ||
        getProfileName(senderProfile) ||
        "SitGuru User";

      const senderRole =
        normalizeRole(message.sender_role || message.sender_role_snapshot) ||
        getProfileRole(senderProfile);

      const conversationId = asString(message.conversation_id);

      return {
        id: message.id,
        conversationId,
        senderName,
        senderRole,
        preview: getPreview(message),
        createdAt: asString(message.created_at),
        href: getThreadHref({
          conversationId,
          currentUserRole,
        }),
      };
    });

    return NextResponse.json({
      alerts,
      unreadCount: unreadMessages.length,
    });
  } catch (error) {
    console.error("Unread message alerts error:", error);

    return NextResponse.json(
      {
        alerts: [],
        unreadCount: 0,
      },
      { status: 200 },
    );
  }
}