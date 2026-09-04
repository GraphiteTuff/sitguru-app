function asTrimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export const WAVE_READ_SCOPES = [
  "user:read",
  "business:read",
  "account:read",
].join(" ");

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
    scopes: WAVE_READ_SCOPES,
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
