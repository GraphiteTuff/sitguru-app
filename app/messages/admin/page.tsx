import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ConversationRow = {
  id: string;
  customer_id?: string | null;
  guru_id?: string | null;
  subject?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_message_at?: string | null;
};

type ProfileRow = {
  id: string;
  role?: string | null;
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

  return value;
}

async function getGuruRecord(userId: string, email?: string | null) {
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
    .select("id, role, created_at, first_name, full_name, email")
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
  role: string
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

  const petName = String(params.petName || "").trim();
  const bookingId = String(params.booking_id || params.bookingId || "").trim();

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
    .select("id, role, created_at, first_name, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const currentProfile = (currentProfileData ?? null) as ProfileRow | null;
  const currentUserRole = normalizeRoleValue(currentProfile?.role);

  const guruRecord = await getGuruRecord(user.id, user.email);
  const guruParticipantId =
    String(guruRecord?.user_id || user.id).trim() || user.id;

  const adminProfile = await getPrimaryAdminProfile();

  if (!adminProfile?.id) {
    redirect("/messages");
  }

  const adminUserId = String(adminProfile.id).trim();

  const isGuruUser =
    currentUserRole === "guru" ||
    currentUserRole === "provider" ||
    currentUserRole === "sitter" ||
    Boolean(guruRecord);

  const participantUserId = isGuruUser ? guruParticipantId : user.id;

  const [asGuruResult, asCustomerResult] = await Promise.all([
    supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("guru_id", participantUserId)
      .eq("customer_id", adminUserId)
      .order("updated_at", { ascending: false })
      .limit(1),
    supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("guru_id", adminUserId)
      .eq("customer_id", participantUserId)
      .order("updated_at", { ascending: false })
      .limit(1),
  ]);

  const existingConversation =
    ((asGuruResult.data ?? [])[0] as ConversationRow | undefined) ||
    ((asCustomerResult.data ?? [])[0] as ConversationRow | undefined);

  if (existingConversation?.id) {
    await addParticipantIfMissing(
      existingConversation.id,
      participantUserId,
      isGuruUser ? "guru" : "customer"
    );
    await addParticipantIfMissing(existingConversation.id, adminUserId, "admin");

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
    customer_id: adminUserId,
    guru_id: participantUserId,
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
      insertConversationError?.message || "Unknown error"
    );
    redirect("/messages");
  }

  await addParticipantIfMissing(
    insertedConversation.id,
    participantUserId,
    isGuruUser ? "guru" : "customer"
  );
  await addParticipantIfMissing(insertedConversation.id, adminUserId, "admin");

  redirect(`/messages/${insertedConversation.id}`);
}