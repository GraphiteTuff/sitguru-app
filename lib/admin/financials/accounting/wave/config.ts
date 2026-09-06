function asTrimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export const WAVE_READ_SCOPES = [
  "user:read",
  "business:read",
  "account:read",
].join(" ");

export const WAVE_SYNC_SCOPES = [
  "user:read",
  "business:read",
  "account:read",
  "account:write",
  "transaction:read",
  "transaction:write",
].join(" ");

export function waveWebBusinessId(providerBusinessId: string) {
  const raw = asTrimmed(providerBusinessId);
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)
  ) {
    return raw;
  }
  try {
    const normalized = raw.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const decoded =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    const match = decoded.match(/^Business:(.+)$/i);
    if (match?.[1]) return match[1].trim();
  } catch {
    // Keep the original id if it is not a Wave GraphQL global id.
  }
  return raw;
}

export function waveAppUrl(providerBusinessId?: string | null) {
  const id = waveWebBusinessId(asTrimmed(providerBusinessId));
  if (!id) return "https://next.waveapps.com";
  return `https://next.waveapps.com/${id}/reports/account-transactions`;
}

export function hasWaveWriteScope(scopes: string) {
  const parts = String(scopes || "")
    .split(/[\s,]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return (
    parts.includes("transaction:write") ||
    parts.includes("transaction:*") ||
    parts.includes("transaction:create")
  );
}

export function getWaveConfig() {
  const clientId = asTrimmed(process.env.WAVE_CLIENT_ID);
  const clientSecret = asTrimmed(process.env.WAVE_CLIENT_SECRET);
  const graphqlUrl =
    asTrimmed(process.env.WAVE_GRAPHQL_URL) ||
    "https://gql.waveapps.com/graphql/public";
  const redirectUri =
    asTrimmed(process.env.WAVE_REDIRECT_URI) ||
    "https://www.sitguru.com/api/tax/wave/callback";

  return {
    clientId,
    clientSecret,
    graphqlUrl,
    redirectUri,
    authorizeUrl: "https://api.waveapps.com/oauth2/authorize/",
    tokenUrl: "https://api.waveapps.com/oauth2/token/",
    configured: Boolean(clientId && clientSecret),
    scopes: WAVE_SYNC_SCOPES,
  };
}

export function getWavePublicStatus() {
  const config = getWaveConfig();
  return {
    configured: config.configured,
    redirectUri: config.redirectUri,
    hasClientId: Boolean(config.clientId),
    hasClientSecret: Boolean(config.clientSecret),
    graphqlUrl: config.graphqlUrl,
  };
}
