/**
 * Rogue / Delilah social metrics tools with server-enforced RBAC.
 *
 * - Admin: brand / rogue / delilah (global) metrics only
 * - Ambassador: forced filter to their own ambassadorId (never brand/global)
 * - Pet parents / guests: do not register these tools at all
 *
 * Authorization relies on validated backend session identity passed into the
 * factory — never on model-supplied entityId / text prompts alone.
 *
 * SERVER ONLY — do not import from client components.
 */

import { tool } from "ai";
import { z } from "zod";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { fetchLiveSocialFollowers } from "@/services/socialMediaClient";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  resolveChatAudience,
  type AmbassadorChatScope,
} from "@/lib/chat/chat-audience";

const ADMIN_ALLOWED_ENTITY_IDS = new Set(["brand", "rogue", "delilah"]);

type SocialToolParams = {
  entityId?: string;
};

function denyDigest(message: string) {
  return `UNAUTHORIZED: ${message} Do not invent follower counts.`;
}

async function runScopedFetch(entityId: string): Promise<string> {
  const result = await fetchLiveSocialFollowers(supabaseAdmin as never, {
    entityId,
  });
  return result.digest;
}

/**
 * Admin Rogue — global brand / persona metrics.
 * Re-validates admin session on every tool invocation.
 */
export function createAdminBrandSocialFollowersTool() {
  return tool({
    description:
      "Admin-only: fetch SitGuru global social follower metrics (brand, rogue, delilah). Returns current_followers, baseline_followers, and delta. Rejects non-admin callers and never returns another ambassador's private rows.",
    parameters: z.object({
      entityId: z
        .enum(["brand", "rogue", "delilah"])
        .optional()
        .describe("Global entity to fetch. Defaults to brand."),
    }),
    execute: async (params: SocialToolParams) => {
      const admin = await getAdminIdentity();
      if (!admin?.canAccessAdmin) {
        return denyDigest(
          "Admin role required for global brand social metrics.",
        );
      }

      const requested = String(params?.entityId || "brand")
        .trim()
        .toLowerCase();
      if (!ADMIN_ALLOWED_ENTITY_IDS.has(requested)) {
        return denyDigest(
          "Admins may only query brand, rogue, or delilah global entities.",
        );
      }

      return runScopedFetch(requested);
    },
  });
}

/**
 * Delilah / ambassador surface — forced to the session ambassadorId.
 * Model-supplied entityId is ignored.
 */
export function createAmbassadorSocialFollowersTool(
  ambassador: AmbassadorChatScope,
) {
  const lockedEntityId = String(ambassador.ambassadorId || "").trim();

  return tool({
    description:
      "Ambassador-only (Delilah): fetch THIS ambassador's referral / social metrics row. The server force-filters to the signed-in ambassador id — you cannot query brand or other ambassadors. Report current_followers, baseline_followers, and delta from the digest only.",
    parameters: z.object({
      // Kept for schema compatibility; ignored server-side.
      entityId: z
        .string()
        .optional()
        .describe("Ignored. Server injects the signed-in ambassador id."),
    }),
    execute: async (_params: SocialToolParams) => {
      void _params;
      if (!lockedEntityId) {
        return denyDigest("Ambassador session is missing an ambassador id.");
      }

      // Re-validate JWT session on every invocation — never trust text/entityId.
      const audience = await resolveChatAudience();
      if (audience.kind !== "ambassador") {
        return denyDigest(
          "Ambassador account required for Delilah social metrics.",
        );
      }
      if (audience.ambassador.ambassadorId !== lockedEntityId) {
        return denyDigest(
          "Ambassador session mismatch — refusing social metrics.",
        );
      }

      return runScopedFetch(audience.ambassador.ambassadorId);
    },
  });
}

/**
 * @deprecated Unscoped tool — do not register on public chat routes.
 * Kept as an explicit deny so accidental imports cannot leak data.
 */
export const fetchLiveSocialFollowersTool = tool({
  description:
    "Deprecated unscoped social metrics tool. Always denied — use createAdminBrandSocialFollowersTool or createAmbassadorSocialFollowersTool.",
  parameters: z.object({
    entityId: z.string().optional(),
  }),
  execute: async () =>
    denyDigest(
      "Unscoped social metrics tool is disabled. Use a role-scoped factory.",
    ),
});
