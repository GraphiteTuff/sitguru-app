/**
 * Server-side chat audience resolver.
 * Authorization MUST come from the validated Supabase JWT session — never from
 * client-supplied role strings in the request body.
 *
 * SERVER ONLY — do not import from client components.
 */

import { getAdminIdentity, type AdminIdentity } from "@/lib/admin/access";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type ChatAudienceKind = "admin" | "ambassador" | "member" | "guest";

export type AmbassadorChatScope = {
  userId: string;
  ambassadorId: string;
  referralCode: string | null;
  fullName: string | null;
};

export type ChatAudience =
  | {
      kind: "admin";
      userId: string;
      email: string;
      admin: AdminIdentity;
    }
  | {
      kind: "ambassador";
      userId: string;
      email: string | null;
      ambassador: AmbassadorChatScope;
    }
  | {
      kind: "member";
      userId: string;
      email: string | null;
    }
  | {
      kind: "guest";
      userId: null;
      email: null;
    };

function normalize(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function ambassadorIsActive(row: {
  status?: string | null;
  dashboard_enabled?: boolean | null;
  login_enabled?: boolean | null;
}) {
  const status = normalize(row.status);
  if (
    ["archived", "inactive", "disabled", "suspended", "not a fit"].includes(
      status,
    )
  ) {
    return false;
  }
  // Prefer explicit workspace flags when present; treat null as allowed.
  if (row.dashboard_enabled === false || row.login_enabled === false) {
    return false;
  }
  return true;
}

async function lookupAmbassadorByUserId(
  userId: string,
  email: string | null,
): Promise<AmbassadorChatScope | null> {
  const columns =
    "id, user_id, full_name, referral_code, status, dashboard_enabled, login_enabled";

  const { data: byUserId, error } = await supabaseAdmin
    .from("ambassadors")
    .select(columns)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("[chat-audience] ambassador user_id lookup:", error.message);
  }

  if (byUserId?.id && ambassadorIsActive(byUserId)) {
    return {
      userId,
      ambassadorId: String(byUserId.id),
      referralCode: byUserId.referral_code
        ? String(byUserId.referral_code)
        : null,
      fullName: byUserId.full_name ? String(byUserId.full_name) : null,
    };
  }

  if (!email) return null;

  for (const emailColumn of ["login_email", "contact_email", "email"]) {
    const { data, error: emailError } = await supabaseAdmin
      .from("ambassadors")
      .select(columns)
      .ilike(emailColumn, email)
      .limit(1)
      .maybeSingle();

    if (emailError) {
      console.warn(
        `[chat-audience] ambassador ${emailColumn} lookup:`,
        emailError.message,
      );
      continue;
    }

    if (data?.id && ambassadorIsActive(data)) {
      return {
        userId,
        ambassadorId: String(data.id),
        referralCode: data.referral_code ? String(data.referral_code) : null,
        fullName: data.full_name ? String(data.full_name) : null,
      };
    }
  }

  return null;
}

/**
 * Resolve the active chat audience from the secure Supabase session cookie.
 * Order: admin → ambassador → authenticated member → guest.
 */
export async function resolveChatAudience(): Promise<ChatAudience> {
  const admin = await getAdminIdentity();
  if (admin?.canAccessAdmin) {
    return {
      kind: "admin",
      userId: admin.id,
      email: admin.email,
      admin,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({
    data: { user: null as null },
  }));

  if (!user?.id) {
    return { kind: "guest", userId: null, email: null };
  }

  const email = user.email ? String(user.email).trim().toLowerCase() : null;
  const ambassador = await lookupAmbassadorByUserId(user.id, email);

  if (ambassador) {
    return {
      kind: "ambassador",
      userId: user.id,
      email,
      ambassador,
    };
  }

  return {
    kind: "member",
    userId: user.id,
    email,
  };
}

/** Public / pet-parent surfaces must never expose business/social tools. */
export function audienceMayUseSocialTools(audience: ChatAudience): boolean {
  return audience.kind === "admin" || audience.kind === "ambassador";
}

/** Global brand / Rogue / Delilah pack metrics — admins only. */
export function audienceMayUseBrandSocialMetrics(
  audience: ChatAudience,
): boolean {
  return audience.kind === "admin";
}
