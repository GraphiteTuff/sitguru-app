/**
 * Service-role Supabase helpers — SERVER ONLY.
 *
 * ❌ Do not import from `"use client"` modules. Browser builds cannot read
 *    SUPABASE_SERVICE_ROLE_KEY and will crash if this initializes eagerly.
 *
 * ✅ Browser: `@/lib/supabase/client` or `@/utils/supabase/client`
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  hasPrivilegedAdminAccess,
  isEnvAllowlistedAdminEmail,
} from "@/lib/admin/privileged-admin";
import { isHardcodedSuperUserEmail } from "@/lib/admin/super-users";

export function createSupabaseAdminClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "createSupabaseAdminClient is server-only. Use @/lib/supabase/client with NEXT_PUBLIC_SUPABASE_ANON_KEY in the browser.",
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Lazy proxy so accidental client bundling does not throw at module evaluate
 * time (Missing SUPABASE_SERVICE_ROLE_KEY blank-screen crash).
 */
function createLazyAdmin(): SupabaseClient {
  let cached: SupabaseClient | null = null;
  return new Proxy({} as SupabaseClient, {
    get(_target, prop, receiver) {
      if (!cached) cached = createSupabaseAdminClient();
      const value = Reflect.get(cached, prop, receiver);
      return typeof value === "function" ? value.bind(cached) : value;
    },
  });
}

/**
 * Backwards-compatible admin client export.
 *
 * Some existing admin files still import:
 *
 * import { supabaseAdmin } from "@/lib/supabase/admin";
 *
 * Keep this export so older admin dashboard files continue working while newer
 * files can use createSupabaseAdminClient().
 */
export const supabaseAdmin = createLazyAdmin();

export function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") || "";

  if (!authHeader.startsWith("Bearer ")) {
    return "";
  }

  return authHeader.replace("Bearer ", "").trim();
}

export async function requireAdminUser(request: Request) {
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    throw new Error("Missing authorization token.");
  }

  const supabaseAdminClient = createSupabaseAdminClient();

  const {
    data: { user },
    error: userError,
  } = await supabaseAdminClient.auth.getUser(accessToken);

  if (userError || !user) {
    throw new Error("Unable to verify your account.");
  }

  const { data: profile, error: profileError } = await supabaseAdminClient
    .from("profiles")
    .select("id, role, account_status")
    .eq("id", user.id)
    .maybeSingle();

  const privileged = hasPrivilegedAdminAccess({
    email: user.email,
    role: profile?.role,
  });

  // HQ super users share a Pet Parent profile (role = customer). Email
  // allowlists grant admin the same way proxy and getAdminIdentity do.
  const emailBypass =
    isHardcodedSuperUserEmail(user.email) ||
    isEnvAllowlistedAdminEmail(user.email);

  if (!privileged) {
    if (profileError || !profile) {
      throw new Error("Unable to verify admin profile.");
    }
    throw new Error("Admin access required.");
  }

  if (
    !emailBypass &&
    profile?.account_status &&
    profile.account_status !== "active"
  ) {
    throw new Error("Admin account is not active.");
  }

  return {
    supabaseAdmin: supabaseAdminClient,
    adminUser: user,
    adminProfile: profile ?? {
      id: user.id,
      role: "super_admin",
      account_status: "active",
    },
  };
}

export async function requireAuthenticatedUser(request: Request) {
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    throw new Error("Missing authorization token.");
  }

  const supabaseAdminClient = createSupabaseAdminClient();

  const {
    data: { user },
    error: userError,
  } = await supabaseAdminClient.auth.getUser(accessToken);

  if (userError || !user) {
    throw new Error("Unable to verify your account. Please log in again.");
  }

  return {
    supabaseAdmin: supabaseAdminClient,
    user,
  };
}
