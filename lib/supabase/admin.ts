import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient() {
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
 * Backwards-compatible admin client export.
 *
 * Some existing admin files still import:
 *
 * import { supabaseAdmin } from "@/lib/supabase/admin";
 *
 * Keep this export so older admin dashboard files continue working while newer
 * files can use createSupabaseAdminClient().
 */
export const supabaseAdmin = createSupabaseAdminClient();

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
    .single();

  if (profileError || !profile) {
    throw new Error("Unable to verify admin profile.");
  }

  if (profile.role !== "admin") {
    throw new Error("Admin access required.");
  }

  if (profile.account_status && profile.account_status !== "active") {
    throw new Error("Admin account is not active.");
  }

  return {
    supabaseAdmin: supabaseAdminClient,
    adminUser: user,
    adminProfile: profile,
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