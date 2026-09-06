import { supabaseAdmin } from "@/lib/supabase/admin";
import { SITGURU_ACCOUNTING_ORG_ID, type AccountingAccountMapping } from "../types";

function asTrimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function loadAccountMappings(
  provider: "wave" | "quickbooks" = "wave",
  organizationId = SITGURU_ACCOUNTING_ORG_ID,
): Promise<AccountingAccountMapping[]> {
  const { data, error } = await supabaseAdmin
    .from("accounting_account_mappings")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("provider", provider);
  if (error || !data) return [];
  return data.map((row) => ({
    sitguruAccountKey: asTrimmed(row.sitguru_account_key) as AccountingAccountMapping["sitguruAccountKey"],
    sitguruAccountName: asTrimmed(row.sitguru_account_name),
    providerAccountId: asTrimmed(row.provider_account_id),
    providerAccountName: asTrimmed(row.provider_account_name),
    providerAccountType: asTrimmed(row.provider_account_type),
    mappingSource: asTrimmed(row.mapping_source) === "manual" ? "manual" : "suggested",
  }));
}

export async function saveAccountMappings(
  mappings: AccountingAccountMapping[],
  provider: "wave" | "quickbooks" = "wave",
  organizationId = SITGURU_ACCOUNTING_ORG_ID,
) {
  if (!mappings.length) return;
  const { error } = await supabaseAdmin.from("accounting_account_mappings").upsert(
    mappings.map((row) => ({
      organization_id: organizationId,
      provider,
      sitguru_account_key: row.sitguruAccountKey,
      sitguru_account_name: row.sitguruAccountName,
      provider_account_id: row.providerAccountId || null,
      provider_account_name: row.providerAccountName || null,
      provider_account_type: row.providerAccountType || null,
      mapping_source: row.mappingSource,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "organization_id,provider,sitguru_account_key" },
  );
  if (error) throw new Error(error.message || "Could not save Wave account mappings.");
}

export async function recordWaveSync(input: {
  externalId: string;
  status: "ok" | "skipped" | "error";
  error?: string;
  eventId?: string;
  organizationId?: string;
}) {
  const { error } = await supabaseAdmin.from("accounting_sync_records").upsert(
    {
      organization_id: input.organizationId || SITGURU_ACCOUNTING_ORG_ID,
      provider: "wave",
      accounting_event_id: input.eventId || null,
      external_id: input.externalId,
      sync_status: input.status,
      sync_error: input.error || null,
      synced_at: new Date().toISOString(),
    },
    { onConflict: "organization_id,provider,external_id" },
  );
  if (error) {
    console.warn("Wave sync record skipped:", error.message);
  }
}

export async function loadSyncedExternalIds(
  organizationId = SITGURU_ACCOUNTING_ORG_ID,
) {
  const { data } = await supabaseAdmin
    .from("accounting_sync_records")
    .select("external_id, sync_status")
    .eq("organization_id", organizationId)
    .eq("provider", "wave")
    .eq("sync_status", "ok");
  return new Set((data || []).map((row) => asTrimmed(row.external_id)).filter(Boolean));
}
