import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolveRequestUser } from "@/lib/supabase/request-auth";

export type PartnerAccount = {
  id: string;
  owner_user_id: string | null;
  business_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  slug: string | null;
  status: string | null;
};

export async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id || null;
}

export async function getPartnerForUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("partners")
    .select(
      "id, owner_user_id, business_name, contact_name, email, phone, website, city, state, zip_code, slug, status",
    )
    .eq("owner_user_id", userId)
    .in("status", ["active", "paused"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("Partner lookup failed:", error);
    return null;
  }

  return (data as PartnerAccount | null) || null;
}

export async function requirePartnerAccount() {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return { ok: false as const, error: "Authentication required.", userId: null, partner: null };
  }

  const partner = await getPartnerForUser(userId);

  if (!partner) {
    return {
      ok: false as const,
      error: "Active partner account required.",
      userId,
      partner: null,
    };
  }

  return { ok: true as const, userId, partner, error: null };
}

export async function requirePartnerAccountFromRequest(request: Request) {
  const resolved = await resolveRequestUser(request);
  const userId = resolved?.user.id || null;

  if (!userId) {
    return { ok: false as const, error: "Authentication required.", userId: null, partner: null };
  }

  const partner = await getPartnerForUser(userId);

  if (!partner) {
    return {
      ok: false as const,
      error: "Active partner account required.",
      userId,
      partner: null,
    };
  }

  return { ok: true as const, userId, partner, error: null };
}

export async function getPartnerByIdAdmin(partnerId: string) {
  const { data } = await supabaseAdmin
    .from("partners")
    .select(
      "id, owner_user_id, business_name, contact_name, email, phone, website, city, state, zip_code, slug, status",
    )
    .eq("id", partnerId)
    .maybeSingle();

  return (data as PartnerAccount | null) || null;
}
