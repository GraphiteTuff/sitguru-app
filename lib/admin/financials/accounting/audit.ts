import { supabaseAdmin } from "@/lib/supabase/admin";

export async function writeAccountingAudit(input: {
  action: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  const payload = {
    actor_id: input.actorId || null,
    actor_email: input.actorEmail || null,
    actor_role: input.actorRole || null,
    action: input.action,
    area: "financials.tax_center.accounting",
    target_type: "accounting_connection",
    target_id: input.targetId || null,
    metadata: input.metadata || {},
    created_at: new Date().toISOString(),
  };

  try {
    await supabaseAdmin.from("financial_audit_logs").insert(payload);
  } catch {
    // Optional in some environments.
  }

  try {
    await supabaseAdmin.from("admin_audit_logs").insert(payload);
  } catch {
    // Optional in some environments.
  }
}
