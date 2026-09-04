import { randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SITGURU_ACCOUNTING_ORG_ID } from "../types";
import { getWaveConfig } from "./config";

const STATE_TTL_MS = 15 * 60 * 1000;

function asTrimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export type WaveOAuthState = {
  state: string;
  organizationId: string;
  actorId: string;
  actorEmail: string;
  returnPath: string;
};

export function isValidWaveOAuthStateFormat(state: string) {
  return /^[a-f0-9]{48}$/.test(asTrimmed(state));
}

export async function createWaveOAuthState(input: {
  actorId: string;
  actorEmail: string;
  organizationId?: string;
  returnPath?: string;
}) {
  const state = randomBytes(24).toString("hex");
  const organizationId = input.organizationId || SITGURU_ACCOUNTING_ORG_ID;
  const returnPath = input.returnPath || "/admin/financials/tax-reports";
  const { error } = await supabaseAdmin.from("accounting_oauth_states").insert({
    state,
    provider: "wave",
    organization_id: organizationId,
    actor_id: input.actorId,
    actor_email: input.actorEmail,
    return_path: returnPath,
    created_at: new Date().toISOString(),
  });
  if (error) {
    throw new Error(error.message || "Could not start Wave authorization.");
  }
  return state;
}

export function buildWaveAuthorizeUrl(state: string, options?: { force?: boolean }) {
  const config = getWaveConfig();
  const url = new URL(config.authorizeUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scopes);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("approval_prompt", options?.force ? "force" : "auto");
  return url.toString();
}

export async function consumeWaveOAuthState(state: string): Promise<WaveOAuthState | null> {
  if (!isValidWaveOAuthStateFormat(state)) return null;
  const cutoff = new Date(Date.now() - STATE_TTL_MS).toISOString();
  const { data, error } = await supabaseAdmin
    .from("accounting_oauth_states")
    .select("state, organization_id, actor_id, actor_email, return_path, created_at")
    .eq("state", state)
    .eq("provider", "wave")
    .maybeSingle();

  if (error || !data) return null;
  await supabaseAdmin.from("accounting_oauth_states").delete().eq("state", state);
  if (String(data.created_at || "") < cutoff) return null;

  return {
    state: asTrimmed(data.state),
    organizationId: asTrimmed(data.organization_id) || SITGURU_ACCOUNTING_ORG_ID,
    actorId: asTrimmed(data.actor_id),
    actorEmail: asTrimmed(data.actor_email),
    returnPath: asTrimmed(data.return_path) || "/admin/financials/tax-reports",
  };
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  businessId?: string;
  userId?: string;
  error?: string;
  error_description?: string;
};

async function postWaveToken(body: URLSearchParams) {
  const config = getWaveConfig();
  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const payload = (await response.json()) as TokenResponse;
  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description || payload.error || "Wave token exchange failed.",
    );
  }
  return payload;
}

export async function exchangeWaveAuthorizationCode(code: string) {
  const config = getWaveConfig();
  return postWaveToken(
    new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
    }),
  );
}

export async function refreshWaveAccessToken(refreshToken: string) {
  const config = getWaveConfig();
  return postWaveToken(
    new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      redirect_uri: config.redirectUri,
    }),
  );
}

export function taxCenterReturnUrl(origin: string, query: string) {
  return new URL(`/admin/financials/tax-reports${query}`, origin);
}
