import { supabaseAdmin } from "@/lib/supabase/admin";
import { decryptSecret, encryptSecret } from "./encryption";
import {
  SITGURU_ACCOUNTING_ORG_ID,
  type AccountingConnectionRecord,
  type AccountingConnectionStatus,
  type AccountingProviderId,
  type AccountingSyncStatus,
  type SafeAccountingConnection,
} from "./types";

function asTrimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function mapRow(row: Record<string, unknown>): AccountingConnectionRecord {
  return {
    id: asTrimmed(row.id),
    organizationId: asTrimmed(row.organization_id) || SITGURU_ACCOUNTING_ORG_ID,
    provider: asTrimmed(row.provider) as AccountingProviderId,
    providerBusinessId: asTrimmed(row.provider_business_id),
    providerBusinessName: asTrimmed(row.provider_business_name),
    accessTokenEncrypted: asTrimmed(row.access_token_encrypted),
    refreshTokenEncrypted: asTrimmed(row.refresh_token_encrypted),
    tokenExpiresAt: asTrimmed(row.token_expires_at) || null,
    scopes: asTrimmed(row.scopes),
    status: (asTrimmed(row.status) || "disconnected") as AccountingConnectionStatus,
    lastSyncAt: asTrimmed(row.last_sync_at) || null,
    lastSyncStatus: (asTrimmed(row.last_sync_status) ||
      null) as AccountingSyncStatus | null,
    lastSyncError: asTrimmed(row.last_sync_error) || null,
    connectedEmail: asTrimmed(row.connected_email),
  };
}

export function formatLastSyncLabel(value: string | null) {
  if (!value) return "Never synchronized";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never synchronized";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function toSafeConnection(
  row: AccountingConnectionRecord | null,
): SafeAccountingConnection | null {
  if (!row || row.status === "disconnected") return null;
  return {
    provider: row.provider,
    status: row.status,
    businessId: row.providerBusinessId,
    businessName: row.providerBusinessName || "Wave business",
    connectedEmail: row.connectedEmail,
    lastSyncAt: row.lastSyncAt,
    lastSyncStatus: row.lastSyncStatus,
    lastSyncError: row.lastSyncError,
    lastSyncLabel: formatLastSyncLabel(row.lastSyncAt),
  };
}

export async function loadAccountingConnection(
  provider: AccountingProviderId,
  organizationId = SITGURU_ACCOUNTING_ORG_ID,
) {
  const { data, error } = await supabaseAdmin
    .from("accounting_connections")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("provider", provider)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as Record<string, unknown>);
}

export function readConnectionTokens(row: AccountingConnectionRecord) {
  return {
    accessToken: decryptSecret(row.accessTokenEncrypted),
    refreshToken: decryptSecret(row.refreshTokenEncrypted),
  };
}

export async function upsertAccountingConnection(input: {
  provider: AccountingProviderId;
  organizationId?: string;
  providerBusinessId?: string | null;
  providerBusinessName?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenExpiresAt?: string | null;
  scopes?: string | null;
  status: AccountingConnectionStatus;
  lastSyncAt?: string | null;
  lastSyncStatus?: AccountingSyncStatus | null;
  lastSyncError?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
}) {
  const organizationId = input.organizationId || SITGURU_ACCOUNTING_ORG_ID;
  const payload: Record<string, unknown> = {
    organization_id: organizationId,
    provider: input.provider,
    status: input.status,
    updated_at: new Date().toISOString(),
  };

  if (input.providerBusinessId !== undefined) {
    payload.provider_business_id = input.providerBusinessId;
  }
  if (input.providerBusinessName !== undefined) {
    payload.provider_business_name = input.providerBusinessName;
  }
  if (input.accessToken) {
    payload.access_token_encrypted = encryptSecret(input.accessToken);
  }
  if (input.refreshToken) {
    payload.refresh_token_encrypted = encryptSecret(input.refreshToken);
  }
  if (input.tokenExpiresAt !== undefined) {
    payload.token_expires_at = input.tokenExpiresAt;
  }
  if (input.scopes !== undefined) payload.scopes = input.scopes;
  if (input.lastSyncAt !== undefined) payload.last_sync_at = input.lastSyncAt;
  if (input.lastSyncStatus !== undefined) {
    payload.last_sync_status = input.lastSyncStatus;
  }
  if (input.lastSyncError !== undefined) {
    payload.last_sync_error = input.lastSyncError;
  }
  if (input.actorId) payload.connected_by = input.actorId;
  if (input.actorEmail) payload.connected_email = input.actorEmail;

  const { data, error } = await supabaseAdmin
    .from("accounting_connections")
    .upsert(payload, { onConflict: "organization_id,provider" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Could not save accounting connection.");
  }
  return mapRow(data as Record<string, unknown>);
}

export async function markAccountingSync(input: {
  provider: AccountingProviderId;
  status: AccountingSyncStatus;
  error?: string | null;
  organizationId?: string;
}) {
  await supabaseAdmin
    .from("accounting_connections")
    .update({
      last_sync_at: new Date().toISOString(),
      last_sync_status: input.status,
      last_sync_error: input.error || null,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", input.organizationId || SITGURU_ACCOUNTING_ORG_ID)
    .eq("provider", input.provider);
}

export async function disconnectAccountingConnection(
  provider: AccountingProviderId,
  organizationId = SITGURU_ACCOUNTING_ORG_ID,
) {
  await supabaseAdmin
    .from("accounting_connections")
    .update({
      status: "disconnected",
      access_token_encrypted: null,
      refresh_token_encrypted: null,
      token_expires_at: null,
      last_sync_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId)
    .eq("provider", provider);
}
