/**
 * SAFE CLIENT FIX — browser / `"use client"` Supabase access.
 *
 * ✅ NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (or publishable key)
 * ❌ Never use SUPABASE_SERVICE_ROLE_KEY here
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/** Lazy singleton — avoid eager createClient() throwing on import. */
let browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) browserClient = createClient();
  return browserClient;
}

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop, receiver) {
    const client = getSupabaseBrowserClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
