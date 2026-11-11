import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL ||
  "";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

/**
 * Shared browser Supabase client.
 *
 * Keep default auth storage (do not point this at `@/lib/supabase/client`).
 * Never throw during module evaluation — Vercel page-data workers can miss
 * NEXT_PUBLIC_* briefly and that used to fail the whole production build.
 * Runtime browser bundles still receive real NEXT_PUBLIC_* values from Next.
 */
export const supabase = createBrowserClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "public-anon-placeholder-key",
);
