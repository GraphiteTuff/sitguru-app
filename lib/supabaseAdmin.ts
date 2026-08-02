/**
 * Legacy path for service-role Supabase — SERVER ONLY.
 * Re-exports the lazy admin client so module evaluation does not crash
 * during builds when env vars are not present at import time.
 *
 * Prefer `@/lib/supabase/admin` for new code.
 */

export {
  createSupabaseAdminClient,
  getBearerToken,
  requireAdminUser,
  requireAuthenticatedUser,
  supabaseAdmin,
} from "@/lib/supabase/admin";
