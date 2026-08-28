"use server";

import { revalidatePath } from "next/cache";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  listCommunityMarkets,
  updateCommunityMarket,
} from "@/lib/community/market-queries";
import type { CommunityMarketUpdateInput } from "@/lib/community/markets";
import {
  previewCommunityMarketSync,
  syncGoogleCommunityEventDiscoveries,
} from "@/lib/community/google-events-sync";

async function requireAdminAction() {
  const admin = await getAdminIdentity();
  if (!admin?.canAccessAdmin) {
    return { ok: false as const, error: "Admin access required." };
  }
  return { ok: true as const, admin };
}

export async function saveCommunityMarketAction(
  marketId: string,
  input: CommunityMarketUpdateInput,
) {
  const gate = await requireAdminAction();
  if (!gate.ok) return gate;

  const result = await updateCommunityMarket(marketId, input);
  if (result.ok) {
    revalidatePath("/admin/community/markets");
    revalidatePath("/admin/community/events/featured");
    revalidatePath("/");
    revalidatePath("/community/events");
  }
  return result;
}

export async function previewCommunityMarketSyncAction(marketId?: string) {
  const gate = await requireAdminAction();
  if (!gate.ok) return gate;

  const plan = await previewCommunityMarketSync({
    marketId,
    forceRefresh: true,
  });
  return { ok: true as const, plan };
}

export async function syncCommunityMarketNowAction(marketId?: string) {
  const gate = await requireAdminAction();
  if (!gate.ok) return gate;

  const result = await syncGoogleCommunityEventDiscoveries({
    marketId,
    forceRefresh: true,
  });

  revalidatePath("/admin/community/markets");
  revalidatePath("/admin/community/events/featured");
  revalidatePath("/");
  revalidatePath("/community/events");

  return result;
}

export async function pauseCommunityMarketAction(marketId: string) {
  const gate = await requireAdminAction();
  if (!gate.ok) return gate;

  const result = await updateCommunityMarket(marketId, {
    marketTier: "paused",
  });
  if (result.ok) {
    revalidatePath("/admin/community/markets");
  }
  return result;
}

export async function listCommunityMarketsAction() {
  const gate = await requireAdminAction();
  if (!gate.ok) return { ...gate, markets: [] };
  const markets = await listCommunityMarkets();
  return { ok: true as const, markets };
}
