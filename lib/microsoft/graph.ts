/**
 * Server-only Microsoft Graph configuration.
 * Public SharePoint and Teams shortcut URLs stay in their existing env keys.
 * Channel message posting is not attempted with this application credential.
 */

import { appOnlyGraphMayCall } from "@/lib/microsoft/teams-notify";

export type MicrosoftGraphConfig = {
  configured: boolean;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  teamId: string;
  planId: string;
  siteId: string;
  driveId: string;
  internsRootId: string;
  readyBucketId: string;
  channelIds: Record<string, string>;
};

function env(name: string) {
  return String(process.env[name] || "").trim();
}

export function readMicrosoftGraphConfig(): MicrosoftGraphConfig {
  const tenantId = env("MICROSOFT_GRAPH_TENANT_ID");
  const clientId = env("MICROSOFT_GRAPH_CLIENT_ID");
  const clientSecret = env("MICROSOFT_GRAPH_CLIENT_SECRET");
  return {
    configured: Boolean(tenantId && clientId && clientSecret),
    tenantId,
    clientId,
    clientSecret,
    teamId: env("SITGURU_MICROSOFT_TEAM_ID"),
    planId: env("SITGURU_PLANNER_GROWTH_PLAN_ID"),
    siteId: env("SITGURU_SHAREPOINT_SITE_ID"),
    driveId: env("SITGURU_SHAREPOINT_DRIVE_ID"),
    internsRootId: env("SITGURU_SHAREPOINT_INTERNS_ROOT_ID"),
    readyBucketId: env("SITGURU_PLANNER_BUCKET_READY_ID"),
    channelIds: {
      "growth-strategy": env("SITGURU_TEAMS_CHANNEL_GROWTH_STRATEGY_ID"),
      "content-social": env("SITGURU_TEAMS_CHANNEL_CONTENT_SOCIAL_ID"),
      "intern-projects": env("SITGURU_TEAMS_CHANNEL_INTERN_PROJECTS_ID"),
      "partnerships-community": env("SITGURU_TEAMS_CHANNEL_PARTNERSHIPS_ID"),
      "analytics-results": env("SITGURU_TEAMS_CHANNEL_ANALYTICS_ID"),
    },
  };
}

export type GraphFailure = "not_configured" | "needs_access" | "conflict" | "error";

export type GraphResult<T> =
  | { ok: true; data: T; etag: string }
  | { ok: false; code: GraphFailure; message: string; etag: string };

type TokenResponse = { access_token?: string; error_description?: string };

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(config: MicrosoftGraphConfig) {
  if (!config.configured) return "";
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });
  const response = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`,
    { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body },
  );
  const payload = (await response.json().catch(() => ({}))) as TokenResponse;
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || "Microsoft token request failed.");
  }
  cachedToken = { value: payload.access_token, expiresAt: Date.now() + 50 * 60 * 1000 };
  return payload.access_token;
}

export async function graphRequest<T>(input: {
  method: "GET" | "POST" | "PATCH";
  path: string;
  body?: unknown;
  etag?: string;
  config?: MicrosoftGraphConfig;
}): Promise<GraphResult<T>> {
  const config = input.config || readMicrosoftGraphConfig();
  if (!config.configured) {
    return { ok: false, code: "not_configured", message: "Microsoft Graph is not configured.", etag: "" };
  }
  if (!appOnlyGraphMayCall(input.path)) {
    return {
      ok: false,
      code: "not_configured",
      message: "Application credentials cannot post Teams channel messages. ChannelMessage.Send is delegated only.",
      etag: "",
    };
  }
  try {
    const token = await accessToken(config);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
    if (input.body) headers["Content-Type"] = "application/json";
    if (input.etag) headers["If-Match"] = input.etag;
    const response = await fetch(`https://graph.microsoft.com/v1.0${input.path}`, {
      method: input.method,
      headers,
      body: input.body ? JSON.stringify(input.body) : undefined,
    });
    const etag = response.headers.get("etag") || "";
    if (response.status === 412 || response.status === 409) {
      return { ok: false, code: "conflict", message: "Microsoft record changed. Refresh and retry.", etag };
    }
    if (response.status === 403 || response.status === 404) {
      return { ok: false, code: "needs_access", message: "Microsoft access is not available for this resource.", etag };
    }
    const data = (await response.json().catch(() => ({}))) as T;
    if (!response.ok) {
      return { ok: false, code: "error", message: "Microsoft Graph request failed.", etag };
    }
    return { ok: true, data, etag };
  } catch (error) {
    console.warn("graphRequest", error instanceof Error ? error.message : error);
    return { ok: false, code: "error", message: "Microsoft Graph request failed.", etag: "" };
  }
}
