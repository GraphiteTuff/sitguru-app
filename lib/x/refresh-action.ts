"use server";

import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getXConfig, syncAuthorizedX } from "@/lib/x/social-analytics";

const X_SYNC_COOLDOWN_MS = 30 * 60 * 1000;

export async function refreshXFollowers(formData: FormData) {
  const identity = await getAdminIdentity();
  if (!identity?.isSuperUser) {
    redirect("/manager/results?x=not_authorized");
  }
  if (formData.get("confirm") !== "yes") {
    redirect("/manager/results?x=not_confirmed");
  }
  let result = "sync_failed";
  try {
    const config = getXConfig();
    const { data, error } = await supabaseAdmin
      .from("growth_social_connections")
      .select("status,last_synced_at,metadata")
      .eq("platform", "x")
      .maybeSingle();
    const meta = data?.metadata as { environment?: unknown } | null | undefined;
    if (error || !data || data.status !== "connected" || meta?.environment !== config.mode) {
      result = "not_connected";
    } else if (
      data.last_synced_at &&
      Number.isFinite(Date.parse(data.last_synced_at)) &&
      Date.now() - Date.parse(data.last_synced_at) < X_SYNC_COOLDOWN_MS
    ) {
      result = "too_soon";
    } else {
      // Explicit founder action only. Each X user lookup may consume API credits.
      await syncAuthorizedX();
      result = "synced";
    }
  } catch {
    // Never expose credentials or provider response bodies.
    result = "sync_failed";
  }
  redirect("/manager/results?x=" + result);
}
