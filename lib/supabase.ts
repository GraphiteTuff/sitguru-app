import { createBrowserClient, type SupabaseClient } from "@supabase/ssr";

/**
 * Shared browser Supabase client used across public + Admin pages.
 *
 * Important:
 * - Do not throw at module evaluation (breaks Next/Vercel page-data collection).
 * - Do not change storage/session key here — `@/lib/supabase/client` is the
 *   opt-in sessionStorage variant. This module must keep default auth storage
 *   or existing sessions flap and the whole site flash-reloads.
 */
let browserClient: SupabaseClient | null = null;

function getBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase browser environment variables.");
  }

  browserClient = createBrowserClient(supabaseUrl, supabaseKey);
  return browserClient;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    // Avoid Promise-like coercion / await loops on the proxy.
    if (prop === "then") return undefined;

    const client = getBrowserClient();
    const value = Reflect.get(client as object, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
