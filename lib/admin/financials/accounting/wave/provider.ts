import {
  disconnectAccountingConnection,
  loadAccountingConnection,
  markAccountingSync,
  readConnectionTokens,
  upsertAccountingConnection,
} from "../connections";
import type {
  AccountingAccount,
  AccountingBusiness,
  AccountingProviderAdapter,
} from "../types";
import { WAVE_ACCOUNTS_QUERY, WAVE_BUSINESSES_QUERY, waveGraphql } from "./graphql";
import { refreshWaveAccessToken } from "./oauth";

const PAGE_SIZE = 50;

type BusinessesPayload = {
  businesses?: {
    pageInfo?: { currentPage?: number; totalPages?: number; totalCount?: number };
    edges?: Array<{ node?: { id?: string; name?: string; isPersonal?: boolean } }>;
  };
};

type AccountsPayload = {
  business?: {
    id?: string;
    name?: string;
    accounts?: {
      pageInfo?: { currentPage?: number; totalPages?: number };
      edges?: Array<{
        node?: {
          id?: string;
          name?: string;
          type?: { name?: string; value?: string };
          subtype?: { name?: string; value?: string };
          isArchived?: boolean;
        };
      }>;
    };
  };
};

async function withFreshTokens() {
  const connection = await loadAccountingConnection("wave");
  if (!connection || connection.status === "disconnected") {
    throw new Error("Wave is not connected.");
  }
  const tokens = readConnectionTokens(connection);
  const expiresAt = connection.tokenExpiresAt
    ? new Date(connection.tokenExpiresAt).getTime()
    : 0;
  if (Number.isFinite(expiresAt) && expiresAt - Date.now() > 2 * 60 * 1000) {
    return { connection, accessToken: tokens.accessToken };
  }
  if (!tokens.refreshToken) {
    throw new Error("Wave needs to be reconnected.");
  }
  const refreshed = await refreshWaveAccessToken(tokens.refreshToken);
  const next = await upsertAccountingConnection({
    provider: "wave",
    organizationId: connection.organizationId,
    providerBusinessId: connection.providerBusinessId,
    providerBusinessName: connection.providerBusinessName,
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token || tokens.refreshToken,
    tokenExpiresAt: new Date(
      Date.now() + Number(refreshed.expires_in || 7200) * 1000,
    ).toISOString(),
    scopes: refreshed.scope || connection.scopes,
    status: connection.providerBusinessId ? "connected" : "action_required",
    actorEmail: connection.connectedEmail,
  });
  return { connection: next, accessToken: refreshed.access_token || tokens.accessToken };
}

export async function listWaveBusinesses(accessToken: string) {
  const businesses: AccountingBusiness[] = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages && page <= 20) {
    const data = await waveGraphql<BusinessesPayload>(accessToken, WAVE_BUSINESSES_QUERY, {
      page,
      pageSize: PAGE_SIZE,
    });
    totalPages = Number(data.businesses?.pageInfo?.totalPages || 1);
    for (const edge of data.businesses?.edges || []) {
      const id = String(edge.node?.id || "").trim();
      if (!id) continue;
      businesses.push({
        id,
        name: String(edge.node?.name || "Wave business").trim(),
        isPersonal: Boolean(edge.node?.isPersonal),
      });
    }
    page += 1;
  }
  return businesses;
}

export async function listWaveAccounts(accessToken: string, businessId: string) {
  const accounts: AccountingAccount[] = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages && page <= 20) {
    const data = await waveGraphql<AccountsPayload>(accessToken, WAVE_ACCOUNTS_QUERY, {
      businessId,
      page,
      pageSize: PAGE_SIZE,
    });
    totalPages = Number(data.business?.accounts?.pageInfo?.totalPages || 1);
    for (const edge of data.business?.accounts?.edges || []) {
      const id = String(edge.node?.id || "").trim();
      if (!id) continue;
      accounts.push({
        id,
        name: String(edge.node?.name || "Account").trim(),
        type: String(edge.node?.type?.value || edge.node?.type?.name || "").trim(),
        subtype: String(edge.node?.subtype?.value || edge.node?.subtype?.name || "").trim(),
        archived: Boolean(edge.node?.isArchived),
      });
    }
    page += 1;
  }
  return accounts;
}

export function createWaveProvider(): AccountingProviderAdapter {
  return {
    id: "wave",
    connectPath: "/api/tax/wave/connect",
    async disconnect() {
      await disconnectAccountingConnection("wave");
    },
    async refreshToken() {
      await withFreshTokens();
    },
    async getBusiness() {
      const { connection } = await withFreshTokens();
      if (!connection.providerBusinessId) return null;
      return {
        id: connection.providerBusinessId,
        name: connection.providerBusinessName || "Wave business",
      };
    },
    async getAccounts() {
      const { connection, accessToken } = await withFreshTokens();
      if (!connection.providerBusinessId) return [];
      return listWaveAccounts(accessToken, connection.providerBusinessId);
    },
    async healthCheck() {
      try {
        const { connection, accessToken } = await withFreshTokens();
        const businesses = await listWaveBusinesses(accessToken);
        const selected = businesses.find(
          (row) => row.id === connection.providerBusinessId,
        );
        await markAccountingSync({
          provider: "wave",
          status: connection.providerBusinessId ? "verified_readonly" : "action_required",
        });
        return {
          ok: true,
          detail: selected
            ? `Read-only check reached ${selected.name}.`
            : `${businesses.length} Wave business${businesses.length === 1 ? "" : "es"} visible.`,
        };
      } catch (error) {
        const detail =
          error instanceof Error ? error.message : "Wave health check failed.";
        await markAccountingSync({
          provider: "wave",
          status: "error",
          error: detail,
        });
        return { ok: false, detail };
      }
    },
  };
}
