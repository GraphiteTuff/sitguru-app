import { getWaveConfig } from "./config";

type GraphQLError = {
  message?: string;
  extensions?: { code?: string };
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: GraphQLError[];
};

function sanitizeWaveError(message: string) {
  return message
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, "Bearer [redacted]")
    .replace(/access_token[=:][^&\s]+/gi, "access_token=[redacted]")
    .replace(/refresh_token[=:][^&\s]+/gi, "refresh_token=[redacted]");
}

export class WaveGraphQLError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "WAVE_GRAPHQL") {
    super(sanitizeWaveError(message));
    this.status = status;
    this.code = code;
  }
}

export async function waveGraphql<T>(
  accessToken: string,
  query: string,
  variables: Record<string, unknown> = {},
) {
  const config = getWaveConfig();
  const response = await fetch(config.graphqlUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const text = await response.text();
  let payload: GraphQLResponse<T> = {};
  try {
    payload = text ? (JSON.parse(text) as GraphQLResponse<T>) : {};
  } catch {
    throw new WaveGraphQLError("Wave returned a non-JSON response.", response.status);
  }

  if (!response.ok || payload.errors?.length) {
    const first = payload.errors?.[0];
    throw new WaveGraphQLError(
      first?.message || `Wave GraphQL failed (${response.status}).`,
      response.status,
      first?.extensions?.code || "WAVE_GRAPHQL",
    );
  }

  if (!payload.data) {
    throw new WaveGraphQLError("Wave GraphQL returned no data.");
  }

  return payload.data;
}

export const WAVE_BUSINESSES_QUERY = `
  query SitGuruWaveBusinesses($page: Int!, $pageSize: Int!) {
    businesses(page: $page, pageSize: $pageSize) {
      pageInfo { currentPage totalPages totalCount }
      edges { node { id name isPersonal } }
    }
  }
`;

export const WAVE_ACCOUNTS_QUERY = `
  query SitGuruWaveAccounts($businessId: ID!, $page: Int!, $pageSize: Int!) {
    business(id: $businessId) {
      id
      name
      accounts(page: $page, pageSize: $pageSize) {
        pageInfo { currentPage totalPages totalCount }
        edges {
          node {
            id
            name
            description
            type { name value }
            subtype { name value }
            isArchived
          }
        }
      }
    }
  }
`;
