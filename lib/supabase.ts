/**
 * Legacy browser Supabase entrypoint.
 * Keep lazy — never throw at module evaluation or Next/Vercel page-data
 * collection fails when env is not yet injected into the worker.
 */
export {
  createClient,
  getSupabaseBrowserClient,
  supabase,
} from "@/lib/supabase/client";
