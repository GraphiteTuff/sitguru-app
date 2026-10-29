import { supabaseAdmin } from "@/lib/supabase/admin";

export type IntegrationProvider = "planner" | "sharepoint" | "teams" | "canva";

export type AssignmentIntegration = {
  provider: IntegrationProvider;
  externalId: string;
  externalParentId: string;
  externalUrl: string;
  status: string;
  lastError: string;
  etag: string;
  metadata: Record<string, unknown>;
};

function text(value: unknown) {
  return String(value || "").trim();
}

export async function listAssignmentIntegrations(assignmentIds: string[]) {
  if (!assignmentIds.length) return [] as Array<AssignmentIntegration & { assignmentId: string }>;
  const { data, error } = await supabaseAdmin
    .from("assignment_integrations")
    .select("assignment_id,provider,external_id,external_parent_id,external_url,status,last_error,external_etag,metadata")
    .in("assignment_id", assignmentIds);
  if (error) {
    console.warn("assignment integrations", error.message);
    return [];
  }
  return (data || []).map((row) => ({
    assignmentId: text(row.assignment_id),
    provider: text(row.provider) as IntegrationProvider,
    externalId: text(row.external_id),
    externalParentId: text(row.external_parent_id),
    externalUrl: text(row.external_url),
    status: text(row.status) || "not_configured",
    lastError: text(row.last_error),
    etag: text(row.external_etag),
    metadata: row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : {},
  }));
}

export async function upsertAssignmentIntegration(input: {
  assignmentId: string;
  provider: IntegrationProvider;
  externalId?: string;
  externalParentId?: string;
  externalUrl?: string;
  status: string;
  lastError?: string;
  etag?: string;
  metadata?: Record<string, unknown>;
}) {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("assignment_integrations").upsert(
    {
      assignment_id: input.assignmentId,
      provider: input.provider,
      external_id: input.externalId || "",
      external_parent_id: input.externalParentId || "",
      external_url: input.externalUrl || "",
      status: input.status,
      last_error: input.lastError || "",
      external_etag: input.etag || "",
      metadata: input.metadata || {},
      last_synced_at: now,
      updated_at: now,
    },
    { onConflict: "assignment_id,provider" },
  );
  if (error) console.warn("upsert assignment integration", error.message);
  return !error;
}

export async function microsoftIdentityStatus(userId: string) {
  if (!userId) return "needs_access";
  const { data, error } = await supabaseAdmin
    .from("microsoft_user_links")
    .select("status,entra_object_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data?.entra_object_id) return "needs_access";
  return text(data.status) || "connected";
}
