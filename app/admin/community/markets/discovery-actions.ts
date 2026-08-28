"use server";

import { revalidatePath } from "next/cache";
import { getAdminIdentity } from "@/lib/admin/access";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function overrideDiscoveryPetRelevanceAction(
  discoveryId: string,
  score: number | null,
) {
  const admin = await getAdminIdentity();
  if (!admin?.canAccessAdmin) {
    return { ok: false as const, error: "Admin access required." };
  }

  const override =
    score == null || Number.isNaN(score)
      ? null
      : Math.max(0, Math.min(100, Math.round(score)));

  const { error } = await supabaseAdmin
    .from("community_event_discoveries")
    .update({
      pet_relevance_override: override,
      qualifying_pet_event: (override ?? 0) >= 70,
      updated_at: new Date().toISOString(),
    })
    .eq("id", discoveryId);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/community");
  revalidatePath("/admin/community/markets");
  return { ok: true as const, error: null };
}
