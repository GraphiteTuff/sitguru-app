import { randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const QUICKBOOKS_ACCOUNTING_SCOPE = "com.intuit.quickbooks.accounting";
export const QUICKBOOKS_MINOR_VERSION = "75";

export type QuickBooksEnvironment = "sandbox" | "production";

export type QuickBooksConnection = {
  id: string;
  realmId: string;
  companyName: string;
  environment: QuickBooksEnvironment;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: string;
  refreshExpiresAt: string | null;
  connectedEmail: string;
  lastPushedAt: string | null;
  lastPushDocNumber: string | null;
  lastPushJournalId: string | null;
  lastPushError: string | null;
};

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  x_refresh_token_expires_in?: number;
  error?: string;
  error_description?: string;
};

function asTrimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function getQuickBooksEnvironment(): QuickBooksEnvironment {
  const explicit = asTrimmed(process.env.QUICKBOOKS_ENVIRONMENT).toLowerCase();
  if (explicit === "sandbox") return "sandbox";
  if (explicit === "production") return "production";
  return process.env.VERCEL_ENV === "production" ? "production" : "sandbox";
}

export function getQuickBooksConfig() {
  const clientId = asTrimmed(process.env.QUICKBOOKS_CLIENT_ID);
  const clientSecret = asTrimmed(process.env.QUICKBOOKS_CLIENT_SECRET);
  const environment = getQuickBooksEnvironment();
  const redirectUri =
    asTrimmed(process.env.QUICKBOOKS_REDIRECT_URI) ||
    (environment === "production"
      ? "https://www.sitguru.com/api/admin/financials/quickbooks/callback"
      : "http://localhost:3000/api/admin/financials/quickbooks/callback");

  return {
    clientId,
    clientSecret,
    environment,
    redirectUri,
    configured: Boolean(clientId && clientSecret),
    authorizeUrl: "https://appcenter.intuit.com/connect/oauth2",
    tokenUrl: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
    apiBase:
      environment === "production"
        ? "https://quickbooks.api.intuit.com"
        : "https://sandbox-quickbooks.api.intuit.com",
  };
}

export function getQuickBooksPublicStatus() {
  const config = getQuickBooksConfig();
  return {
    configured: config.configured,
    environment: config.environment,
    redirectUri: config.redirectUri,
    hasClientId: Boolean(config.clientId),
    hasClientSecret: Boolean(config.clientSecret),
  };
}

function basicAuth(clientId: string, clientSecret: string) {
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

export async function createQuickBooksOAuthState(actor: {
  id: string;
  email: string;
}) {
  const state = randomBytes(24).toString("hex");
  const { error } = await supabaseAdmin.from("admin_quickbooks_oauth_states").insert({
    state,
    actor_id: actor.id,
    actor_email: actor.email,
    created_at: new Date().toISOString(),
  });
  if (error) {
    throw new Error(error.message || "Could not start QuickBooks authorization.");
  }
  return state;
}

export function buildQuickBooksAuthorizeUrl(state: string) {
  const config = getQuickBooksConfig();
  const url = new URL(config.authorizeUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", QUICKBOOKS_ACCOUNTING_SCOPE);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
}

async function consumeOAuthState(state: string) {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("admin_quickbooks_oauth_states")
    .select("state, actor_id, actor_email, created_at")
    .eq("state", state)
    .maybeSingle();

  if (error || !data) return null;
  await supabaseAdmin.from("admin_quickbooks_oauth_states").delete().eq("state", state);
  if (String(data.created_at || "") < cutoff) return null;
  return data;
}

async function exchangeTokens(body: URLSearchParams) {
  const config = getQuickBooksConfig();
  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth(config.clientId, config.clientSecret)}`,
    },
    body,
  });
  const payload = (await response.json()) as TokenResponse;
  if (!response.ok || !payload.access_token || !payload.refresh_token) {
    throw new Error(
      payload.error_description || payload.error || "QuickBooks token exchange failed.",
    );
  }
  return payload;
}

function mapConnection(row: Record<string, unknown>): QuickBooksConnection {
  return {
    id: asTrimmed(row.id),
    realmId: asTrimmed(row.realm_id),
    companyName: asTrimmed(row.company_name) || "QuickBooks company",
    environment: asTrimmed(row.environment) === "production" ? "production" : "sandbox",
    accessToken: asTrimmed(row.access_token),
    refreshToken: asTrimmed(row.refresh_token),
    tokenExpiresAt: asTrimmed(row.token_expires_at),
    refreshExpiresAt: asTrimmed(row.refresh_expires_at) || null,
    connectedEmail: asTrimmed(row.connected_email),
    lastPushedAt: asTrimmed(row.last_pushed_at) || null,
    lastPushDocNumber: asTrimmed(row.last_push_doc_number) || null,
    lastPushJournalId: asTrimmed(row.last_push_journal_id) || null,
    lastPushError: asTrimmed(row.last_push_error) || null,
  };
}

export async function loadQuickBooksConnection() {
  const { data, error } = await supabaseAdmin
    .from("admin_quickbooks_connections")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return mapConnection(data as Record<string, unknown>);
}

export function getQuickBooksSafeConnection(connection: QuickBooksConnection | null) {
  if (!connection) return null;
  return {
    companyName: connection.companyName,
    environment: connection.environment,
    realmId: connection.realmId,
    connectedEmail: connection.connectedEmail,
    lastPushedAt: connection.lastPushedAt,
    lastPushDocNumber: connection.lastPushDocNumber,
    lastPushJournalId: connection.lastPushJournalId,
    lastPushError: connection.lastPushError,
  };
}

async function saveConnection(input: {
  realmId: string;
  companyName: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn?: number;
  actorId?: string;
  actorEmail?: string;
}) {
  const now = Date.now();
  const payload = {
    realm_id: input.realmId,
    company_name: input.companyName,
    environment: getQuickBooksEnvironment(),
    access_token: input.accessToken,
    refresh_token: input.refreshToken,
    token_expires_at: new Date(now + input.expiresIn * 1000).toISOString(),
    refresh_expires_at: input.refreshExpiresIn
      ? new Date(now + input.refreshExpiresIn * 1000).toISOString()
      : null,
    connected_by: input.actorId || null,
    connected_email: input.actorEmail || null,
    last_push_error: null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("admin_quickbooks_connections")
    .upsert(payload, { onConflict: "realm_id" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Could not save QuickBooks connection.");
  }
  return mapConnection(data as Record<string, unknown>);
}

export async function qboRequest<T>(
  connection: QuickBooksConnection,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const config = getQuickBooksConfig();
  const url = `${config.apiBase}${path}${path.includes("?") ? "&" : "?"}minorversion=${QUICKBOOKS_MINOR_VERSION}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${connection.accessToken}`,
      ...(init?.headers || {}),
    },
  });
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as T & { Fault?: { Error?: { Message?: string; Detail?: string }[] } }) : ({} as T);
  if (!response.ok) {
    const fault = (payload as { Fault?: { Error?: { Message?: string; Detail?: string }[] } }).Fault?.Error?.[0];
    throw new Error(fault?.Detail || fault?.Message || `QuickBooks request failed (${response.status}).`);
  }
  return payload;
}

export async function refreshQuickBooksConnection(connection: QuickBooksConnection) {
  const expiresAt = new Date(connection.tokenExpiresAt).getTime();
  if (Number.isFinite(expiresAt) && expiresAt - Date.now() > 2 * 60 * 1000) {
    return connection;
  }

  const tokens = await exchangeTokens(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: connection.refreshToken,
    }),
  );

  return saveConnection({
    realmId: connection.realmId,
    companyName: connection.companyName,
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token!,
    expiresIn: Number(tokens.expires_in || 3600),
    refreshExpiresIn: Number(tokens.x_refresh_token_expires_in || 0) || undefined,
    actorId: undefined,
    actorEmail: connection.connectedEmail,
  });
}

export async function completeQuickBooksOAuth(input: {
  code: string;
  state: string;
  realmId: string;
}) {
  const savedState = await consumeOAuthState(input.state);
  if (!savedState) {
    throw new Error("QuickBooks authorization expired. Connect again from Tax Center.");
  }

  const config = getQuickBooksConfig();
  const tokens = await exchangeTokens(
    new URLSearchParams({
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: config.redirectUri,
    }),
  );

  const draft = await saveConnection({
    realmId: input.realmId,
    companyName: "QuickBooks company",
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token!,
    expiresIn: Number(tokens.expires_in || 3600),
    refreshExpiresIn: Number(tokens.x_refresh_token_expires_in || 0) || undefined,
    actorId: asTrimmed(savedState.actor_id) || undefined,
    actorEmail: asTrimmed(savedState.actor_email) || undefined,
  });

  try {
    const info = await qboRequest<{
      CompanyInfo?: { CompanyName?: string; LegalName?: string };
    }>(draft, `/v3/company/${draft.realmId}/companyinfo/${draft.realmId}`);
    const companyName =
      asTrimmed(info.CompanyInfo?.CompanyName) ||
      asTrimmed(info.CompanyInfo?.LegalName) ||
      draft.companyName;
    return saveConnection({
      realmId: draft.realmId,
      companyName,
      accessToken: draft.accessToken,
      refreshToken: draft.refreshToken,
      expiresIn: Math.max(
        60,
        Math.round((new Date(draft.tokenExpiresAt).getTime() - Date.now()) / 1000),
      ),
      actorEmail: draft.connectedEmail,
    });
  } catch {
    return draft;
  }
}

export async function disconnectQuickBooks() {
  const connection = await loadQuickBooksConnection();
  if (!connection) return;
  await supabaseAdmin.from("admin_quickbooks_connections").delete().eq("id", connection.id);
}

export async function markQuickBooksPush(input: {
  connectionId: string;
  docNumber: string;
  journalId?: string;
  error?: string;
}) {
  await supabaseAdmin
    .from("admin_quickbooks_connections")
    .update({
      last_pushed_at: input.error ? null : new Date().toISOString(),
      last_push_doc_number: input.docNumber,
      last_push_journal_id: input.journalId || null,
      last_push_error: input.error || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.connectionId);
}
