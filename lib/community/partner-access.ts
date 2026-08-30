import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolveRequestUser } from "@/lib/supabase/request-auth";
import { slugifyEventTitle } from "@/lib/community/slug";

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

async function makeUniqueHostSlug(baseName: string) {
  const base = slugifyEventTitle(baseName).slice(0, 40) || "pet-event-host";

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const slug =
      attempt === 0
        ? `${base}-events`
        : `${base}-events-${Math.random().toString(36).slice(2, 7)}`;

    const { data } = await supabaseAdmin
      .from("partners")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!data) return slug;
  }

  return `${base}-events-${Date.now().toString(36)}`;
}

async function makeUniqueHostReferralCode(baseName: string) {
  const base = slugifyEventTitle(baseName)
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase();

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = `HOST${base || "SG"}${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    const { data } = await supabaseAdmin
      .from("partners")
      .select("id")
      .eq("referral_code", code)
      .maybeSingle();

    if (!data) return code;
  }

  return `HOST${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Auto-create a lightweight active Partner so Pet Parents can use Pet Event
 * Manager / one-click create without a full Partner application.
 */
export async function ensureEventHostPartnerForUser(
  userId: string,
): Promise<PartnerAccount | null> {
  const existing = await getPartnerForUser(userId);
  if (existing) return existing;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const meta = (user?.user_metadata || {}) as Record<string, unknown>;
  const metaText = (key: string) => {
    const value = meta[key];
    return typeof value === "string" ? value.trim() : "";
  };

  let profile: {
    full_name?: string | null;
    display_name?: string | null;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
  } | null = null;

  {
    const { data, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("full_name, display_name, email, phone, city, state, zip_code")
      .eq("id", userId)
      .maybeSingle();
    if (!profileError) {
      profile = data;
    }
  }

  const contactName =
    profile?.full_name?.trim() ||
    profile?.display_name?.trim() ||
    metaText("full_name") ||
    metaText("name") ||
    user?.email?.split("@")[0] ||
    "Pet Event Host";

  const email =
    profile?.email?.trim() ||
    user?.email ||
    metaText("email") ||
    `${userId.slice(0, 8)}@sitguru.host`;

  const businessName = `${contactName}'s Pet Events`;
  const slug = await makeUniqueHostSlug(contactName);
  const referralCode = await makeUniqueHostReferralCode(contactName);

  const { data: partner, error } = await supabaseAdmin
    .from("partners")
    .insert({
      owner_user_id: userId,
      partner_type: "local_partner",
      business_name: businessName,
      contact_name: contactName,
      email,
      phone: profile?.phone || metaText("phone") || null,
      business_type: "Pet Event Host",
      city: profile?.city || metaText("city") || null,
      state: profile?.state || metaText("state") || null,
      zip_code: profile?.zip_code || metaText("zip_code") || null,
      slug,
      referral_code: referralCode,
      commission_type: "fixed",
      status: "active",
      approved_at: new Date().toISOString(),
    })
    .select(
      "id, owner_user_id, business_name, contact_name, email, phone, website, city, state, zip_code, slug, status",
    )
    .single();

  if (error || !partner) {
    console.error("ensureEventHostPartnerForUser:", error);
    // Race: another request may have created the row.
    return getPartnerForUser(userId);
  }

  return partner as PartnerAccount;
}

export async function requirePartnerAccount() {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return {
      ok: false as const,
      error: "Authentication required.",
      userId: null,
      partner: null,
    };
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

/**
 * Pet Event hosting gate: signed-in Pet Parents get a host Partner stub if needed.
 * Guests still fail with Authentication required (callers redirect to signup).
 */
export async function requireEventHostPartnerAccount() {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return {
      ok: false as const,
      error: "Authentication required.",
      userId: null,
      partner: null,
    };
  }

  const partner = await ensureEventHostPartnerForUser(userId);

  if (!partner) {
    return {
      ok: false as const,
      error: "Unable to set up Pet Event hosting for this account.",
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
    return {
      ok: false as const,
      error: "Authentication required.",
      userId: null,
      partner: null,
    };
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

export async function requireEventHostPartnerAccountFromRequest(
  request: Request,
) {
  const resolved = await resolveRequestUser(request);
  const userId = resolved?.user.id || null;

  if (!userId) {
    return {
      ok: false as const,
      error: "Authentication required.",
      userId: null,
      partner: null,
    };
  }

  const partner = await ensureEventHostPartnerForUser(userId);

  if (!partner) {
    return {
      ok: false as const,
      error: "Unable to set up Pet Event hosting for this account.",
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
