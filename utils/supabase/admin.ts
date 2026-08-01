/**
 * Service-role Supabase client — SERVER ONLY.
 *
 * ❌ Never import from `"use client"` or any module client components import.
 *    `SUPABASE_SERVICE_ROLE_KEY` is not available in the browser; reading it
 *    there caused the production blank-screen crash.
 *
 * ✅ Browser: `@/utils/supabase/client` (NEXT_PUBLIC_SUPABASE_ANON_KEY)
 * ✅ Server UI session: `@/utils/supabase/server`
 * ✅ Guru card encode/decode (client-safe): `@/lib/gurus/guru-chat-snapshot`
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function createServiceRoleClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "supabaseAdmin is server-only and must not load in the browser. Use @/utils/supabase/client with NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseServiceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Lazy proxy: importing this module in a client bundle must not throw at
 * evaluate-time (env key is undefined in the browser). Privileged calls still
 * fail immediately if invoked client-side.
 */
function createLazyAdmin(): SupabaseClient {
  let cached: SupabaseClient | null = null;
  return new Proxy({} as SupabaseClient, {
    get(_target, prop, receiver) {
      if (!cached) cached = createServiceRoleClient();
      const value = Reflect.get(cached, prop, receiver);
      return typeof value === "function" ? value.bind(cached) : value;
    },
  });
}

export const supabaseAdmin = createLazyAdmin();
