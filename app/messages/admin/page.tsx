// app/messages/admin/page.tsx
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

type ProfileRow = {
  id: string;
  role?: string | null;
  account_type?: string | null;
  created_at?: string | null;
  first_name?: string | null;
  full_name?: string | null;
  email?: string | null;
};

type GuruRow = {
  id?: string | number | null;
  user_id?: string | null;
  email?: string | null;
};

function normalizeRoleValue(role?: string | null) {
  const value = String(role || "").trim().toLowerCase();

  if (!value) return "";
  if (value === "provider" || value === "sitter") return "guru";
  if (value === "pet_parent" || value === "pet-parent") return "customer";
  if (value === "owner" || value === "pet_owner" || value === "pet-owner") {
    return "customer";
  }

  return value;
}

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

function getDisplayName(
  profile: ProfileRow | null,
  fallbackEmail?: string | null,
) {
  return (
    cleanText(profile?.full_name) ||
    cleanText([profile?.first_name].filter(Boolean).join(" ")) ||
    cleanText(fallbackEmail) ||
    "SitGuru User"
  );
}

function getDashboardHref(role?: string | null) {
  const normalized = normalizeRoleValue(role);

  if (normalized === "guru") return "/guru/dashboard";
  if (normalized === "admin") return "/admin";

  return "/customer/dashboard";
}

async function getGuruRecordForConfirmedGuru(
  userId: string,
  email?: string | null,
) {
  const byUserId = await supabaseAdmin
    .from("gurus")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!byUserId.error && byUserId.data) {
    return byUserId.data as GuruRow;
  }

  if (email) {
    const byEmail = await supabaseAdmin
      .from("gurus")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (!byEmail.error && byEmail.data) {
      return byEmail.data as GuruRow;
    }
  }

  return null;
}

async function getPrimaryAdminProfile() {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, role, account_type, created_at, first_name, full_name, email")
    .eq("role", "admin")
    .order("created_at", { ascending: true })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0] as ProfileRow;
}

async function addParticipantIfMissing(
  conversationId: string,
  userId: string,
  role: string,
) {
  const safeConversationId = String(conversationId || "").trim();
  const safeUserId = String(userId || "").trim();
  const safeRole = String(role || "").trim().toLowerCase();

  if (!safeConversationId || !safeUserId) return;

  const existing = await supabaseAdmin
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .eq("conversation_id", safeConversationId)
    .eq("user_id", safeUserId)
    .maybeSingle();

  if (!existing.error && existing.data) {
    return;
  }

  await supabaseAdmin.from("conversation_participants").insert({
    conversation_id: safeConversationId,
    user_id: safeUserId,
    role: safeRole || null,
    is_muted: false,
    is_archived: false,
  });
}

async function updateParticipantRole({
  conversationId,
  userId,
  role,
}: {
  conversationId: string;
  userId: string;
  role: string;
}) {
  await supabaseAdmin
    .from("conversation_participants")
    .update({
      role,
      updated_at: new Date().toISOString(),
    })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
}

async function createStarterMessageIfMissing({
  conversationId,
  adminUserId,
  participantDisplayName,
}: {
  conversationId: string;
  adminUserId: string;
  participantDisplayName: string;
}) {
  const existingMessages = await supabaseAdmin
    .from("messages")
    .select("id")
    .eq("conversation_id", conversationId)
    .limit(1);

  if (!existingMessages.error && existingMessages.data?.length) {
    return;
  }

  const message = `Hi ${participantDisplayName}, you are connected with SitGuru Admin Support. How can we help with your account, booking, pets, PawPerks, or care questions?`;

  await supabaseAdmin.from("messages").insert({
    conversation_id: conversationId,
    sender_id: adminUserId,
    recipient_id: null,
    topic: "admin_support",
    content: message,
    body: message,
    created_at: new Date().toISOString(),
  });
}

async function createNotificationIfPossible({
  userId,
  title,
  body,
  href,
}: {
  userId: string;
  title: string;
  body: string;
  href: string;
}) {
  try {
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title,
      body,
      type: "message",
      href,
      is_read: false,
    });
  } catch {
    // Notifications should never block opening the admin support thread.
  }
}

export default async function AdminMessageEntryPage({
  searchParams,
}: {
  searchParams?: Promise<{
    pet?: string;
    petId?: string;
    petName?: string;
    booking_id?: string;
    bookingId?: string;
  }>;
}) {
  const params = (await searchParams) || {};

  const petName = cleanText(params.petName || params.pet);
  const bookingId = cleanText(params.booking_id || params.bookingId);

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
    .select("id, role, account_type, created_at, first_name, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const currentProfile = (currentProfileData ?? null) as ProfileRow | null;

  const currentUserRole =
    normalizeRoleValue(currentProfile?.role) ||
    normalizeRoleValue(currentProfile?.account_type) ||
    "customer";

  const participantDisplayName = getDisplayName(currentProfile, user.email);

  const adminProfile = await getPrimaryAdminProfile();

  if (!adminProfile?.id) {
    redirect("/messages");
  }

  const adminUserId = String(adminProfile.id).trim();

  /**
   * IMPORTANT:
   * Do not classify a user as a Guru just because an old row exists in public.gurus.
   * The user's current profile role/account_type must explicitly say guru.
   * This prevents customer accounts like Amy Jones from being pulled into Guru flows.
   */
  const isGuruUser =
    currentUserRole === "guru" ||
    currentUserRole === "provider" ||
    currentUserRole === "sitter";

  const guruRecord = isGuruUser
    ? await getGuruRecordForConfirmedGuru(user.id, user.email)
    : null;

  const guruParticipantId =
    String(guruRecord?.user_id || user.id).trim() || user.id;

  const participantUserId = isGuruUser ? guruParticipantId : user.id;
  const participantRole = isGuruUser ? "guru" : "customer";

  const dashboardHref = getDashboardHref(currentUserRole);

  const [customerAdminResult, guruAdminResult, legacyReverseResult] =
    await Promise.all([
      supabaseAdmin
        .from("conversations")
        .select("*")
        .eq("customer_id", participantUserId)
        .eq("guru_id", adminUserId)
        .order("updated_at", { ascending: false })
        .limit(1),

      isGuruUser
        ? supabaseAdmin
            .from("conversations")
            .select("*")
            .eq("guru_id", participantUserId)
            .eq("customer_id", adminUserId)
            .order("updated_at", { ascending: false })
            .limit(1)
        : Promise.resolve({ data: [], error: null }),

      /**
       * Legacy cleanup lookup:
       * If an old customer account was accidentally saved as guru_id and admin as customer_id,
       * find it so we can correct and reuse it.
       */
      !isGuruUser
        ? supabaseAdmin
            .from("conversations")
            .select("*")
            .eq("guru_id", participantUserId)
            .eq("customer_id", adminUserId)
            .order("updated_at", { ascending: false })
            .limit(1)
        : Promise.resolve({ data: [], error: null }),
    ]);

  const existingConversation =
    ((customerAdminResult.data ?? [])[0] as ConversationRow | undefined) ||
    ((guruAdminResult.data ?? [])[0] as ConversationRow | undefined) ||
    ((legacyReverseResult.data ?? [])[0] as ConversationRow | undefined);

  if (existingConversation?.id) {
    /**
     * If the current user is a customer, force the conversation shape to:
     * customer_id = current user
     * guru_id = admin profile
     *
     * This keeps Amy Customer ↔ SitGuru Admin clean even if a previous thread
     * was created while Amy had stale Guru data.
     */
    if (!isGuruUser) {
      await supabaseAdmin
        .from("conversations")
        .update({
          customer_id: participantUserId,
          guru_id: adminUserId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingConversation.id);
    }

    await addParticipantIfMissing(
      existingConversation.id,
      participantUserId,
      participantRole,
    );
    await addParticipantIfMissing(existingConversation.id, adminUserId, "admin");

    await updateParticipantRole({
      conversationId: existingConversation.id,
      userId: participantUserId,
      role: participantRole,
    });

    await updateParticipantRole({
      conversationId: existingConversation.id,
      userId: adminUserId,
      role: "admin",
    });

    await createStarterMessageIfMissing({
      conversationId: existingConversation.id,
      adminUserId,
      participantDisplayName,
    });

    redirect(`/messages/${existingConversation.id}`);
  }

  const nowIso = new Date().toISOString();

  const subjectParts = ["Direct Admin Support"];
  if (petName) {
    subjectParts.push(`for ${petName}`);
  }
  if (bookingId) {
    subjectParts.push(`Booking #${bookingId}`);
  }

  const subject = subjectParts.join(" · ");
  const preview = petName
    ? `Admin support thread created for ${petName}.`
    : "Admin support thread created.";

  const insertPayload = {
    customer_id: isGuruUser ? adminUserId : participantUserId,
    guru_id: isGuruUser ? participantUserId : adminUserId,
    booking_id: bookingId || null,
    started_by_user_id: user.id,
    subject,
    status: "open",
    last_message_at: nowIso,
    last_message_preview: preview,
    created_at: nowIso,
    updated_at: nowIso,
  };

  const { data: insertedConversation, error: insertConversationError } =
    await supabaseAdmin
      .from("conversations")
      .insert(insertPayload)
      .select("*")
      .single();

  if (insertConversationError || !insertedConversation?.id) {
    console.error(
      "Admin support conversation create error:",
      insertConversationError?.message || "Unknown error",
    );
    redirect(dashboardHref);
  }

  await addParticipantIfMissing(
    insertedConversation.id,
    participantUserId,
    participantRole,
  );
  await addParticipantIfMissing(insertedConversation.id, adminUserId, "admin");

  await updateParticipantRole({
    conversationId: insertedConversation.id,
    userId: participantUserId,
    role: participantRole,
  });

  await updateParticipantRole({
    conversationId: insertedConversation.id,
    userId: adminUserId,
    role: "admin",
  });

  await createStarterMessageIfMissing({
    conversationId: insertedConversation.id,
    adminUserId,
    participantDisplayName,
  });

  await createNotificationIfPossible({
    userId: participantUserId,
    title: "Admin support thread started",
    body: "SitGuru Admin Support is ready to help.",
    href: `/messages/${insertedConversation.id}`,
  });

  redirect(`/messages/${insertedConversation.id}`);
}
