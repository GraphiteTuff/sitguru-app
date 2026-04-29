import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SafeProfileRow = {
  id: string;
  email?: string | null;
  role?: string | null;
  account_type?: string | null;
  full_name?: string | null;
};

type ParticipantRow = {
  conversation_id?: string | null;
  user_id?: string | null;
  role?: string | null;
};

type ConversationRow = {
  id: string;
  customer_id?: string | null;
  guru_id?: string | null;
  subject?: string | null;
  topic?: string | null;
  created_at?: string | null;
};

const SAFE_PROFILE_SELECT = "id, email, role, account_type, full_name";

function normalizeAdminProfile(profile: SafeProfileRow) {
  return {
    id: profile.id,
    email: profile.email || null,
    role: profile.role || "admin",
    account_type: profile.account_type || "admin",
    full_name: profile.full_name || "Admin HQ",
    display_name: "Admin HQ",
    name: "Admin HQ",
    first_name: null,
    last_name: null,
    avatar_url: null,
    profile_photo_url: null,
    image_url: null,
  };
}

async function getProfileById(id?: string | null) {
  const safeId = String(id || "").trim();

  if (!safeId) return null;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select(SAFE_PROFILE_SELECT)
    .eq("id", safeId)
    .maybeSingle();

  if (error || !data) return null;

  return data as SafeProfileRow;
}

async function findMarkedAdminProfile() {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select(SAFE_PROFILE_SELECT)
    .or(
      "role.eq.admin,role.eq.owner,role.eq.super_admin,account_type.eq.admin,account_type.eq.owner,account_type.eq.super_admin"
    )
    .limit(1);

  if (!error && data && data.length > 0) {
    return data[0] as SafeProfileRow;
  }

  return null;
}

async function findAdminFromParticipants() {
  const { data, error } = await supabaseAdmin
    .from("conversation_participants")
    .select("conversation_id, user_id, role")
    .eq("role", "admin")
    .limit(1);

  if (error || !data || data.length === 0) return null;

  return getProfileById((data[0] as ParticipantRow).user_id || null);
}

async function findAdminFromExistingSupportThread(currentUserId: string) {
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .select("id, customer_id, guru_id, subject, topic, created_at")
    .or(`customer_id.eq.${currentUserId},guru_id.eq.${currentUserId}`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data || data.length === 0) return null;

  const supportThread = (data as ConversationRow[]).find((conversation) => {
    const text = `${conversation.subject || ""} ${conversation.topic || ""}`.toLowerCase();

    return (
      text.includes("admin") ||
      text.includes("support") ||
      text.includes("payout") ||
      text.includes("verification") ||
      text.includes("safety")
    );
  });

  if (!supportThread) return null;

  const possibleAdminId =
    supportThread.customer_id === currentUserId
      ? supportThread.guru_id
      : supportThread.customer_id;

  return getProfileById(possibleAdminId || null);
}

async function findAdminByEmailOrName() {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select(SAFE_PROFILE_SELECT)
    .or("email.ilike.%admin%,email.ilike.%support%,email.ilike.%sitguru%,full_name.ilike.%admin%")
    .limit(1);

  if (!error && data && data.length > 0) {
    return data[0] as SafeProfileRow;
  }

  return null;
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const adminProfile =
    (await findMarkedAdminProfile()) ||
    (await findAdminFromParticipants()) ||
    (await findAdminFromExistingSupportThread(user.id)) ||
    (await findAdminByEmailOrName());

  if (adminProfile?.id && adminProfile.id !== user.id) {
    return NextResponse.json({
      admin: normalizeAdminProfile(adminProfile),
    });
  }

  return NextResponse.json(
    {
      error:
        "Admin HQ profile was not found. Set one profile row to role='admin' or account_type='admin'.",
    },
    { status: 404 }
  );
}
