/**
 * Server-only companion viewer resolution (roles + preferred name).
 * Do not import from `"use client"` modules.
 */

import { supabaseAdmin } from "@/utils/supabase/admin";
import {
  isReservedPreferredName,
  sanitizePreferredName,
} from "@/lib/chat/homepage-name";
import { normalizeRogueUserType } from "@/lib/chat/rogue-user-type";
import {
  uniqueCompanionRoles,
  type CompanionViewerContext,
} from "@/lib/chat/companion-auth";

export async function resolveCompanionViewer(
  user: { id: string; user_metadata?: Record<string, unknown> | null } | null,
  bodyName?: string,
  bodyRole?: string,
): Promise<CompanionViewerContext> {
  if (!user?.id) {
    return {
      isAuthenticated: false,
      firstName: bodyName || null,
      roles: [normalizeRogueUserType(bodyRole || "Guest Pet Parent")],
    };
  }

  const [{ data: roleRows }, { data: profile }] = await Promise.all([
    supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .limit(12),
    supabaseAdmin
      .from("profiles")
      .select("first_name, full_name")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const roles = uniqueCompanionRoles([
    ...(roleRows || []).map((row) => row.role),
    bodyRole,
  ]);

  const meta = user.user_metadata || {};
  const metaFirst =
    typeof meta.first_name === "string"
      ? meta.first_name
      : typeof meta.full_name === "string"
        ? String(meta.full_name).split(/\s+/)[0]
        : "";
  const profileFirst =
    sanitizePreferredName(profile?.first_name) ||
    sanitizePreferredName(String(profile?.full_name || "").split(/\s+/)[0]) ||
    "";
  const firstName =
    sanitizePreferredName(bodyName) ||
    profileFirst ||
    sanitizePreferredName(metaFirst) ||
    null;

  return {
    isAuthenticated: true,
    firstName: firstName && !isReservedPreferredName(firstName) ? firstName : null,
    roles: roles.length ? roles : ["Pet Parent"],
  };
}
