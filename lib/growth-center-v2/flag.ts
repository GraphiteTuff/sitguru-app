import { supabaseAdmin } from "@/lib/supabase/admin";
import { GROWTH_CENTER_V2_FLAG } from "./types";

/**
 * Growth Center 2.0 flag.
 * Env override wins; otherwise growth_center_settings.row enabled=true.
 * Defaults ON so completed first-party Insights ship without a separate toggle step.
 */
export async function isGrowthCenterV2Enabled(): Promise<boolean> {
  const env = process.env.GROWTH_CENTER_V2 || process.env.NEXT_PUBLIC_GROWTH_CENTER_V2;
  if (env === "0" || env === "false" || env === "off") return false;
  if (env === "1" || env === "true" || env === "on") return true;

  try {
    const { data, error } = await supabaseAdmin
      .from("growth_center_settings")
      .select("flag_key,enabled")
      .eq("flag_key", GROWTH_CENTER_V2_FLAG)
      .maybeSingle();
    if (error) {
      // Table may not exist yet — treat as enabled for additive rollout.
      return true;
    }
    if (!data) return true;
    return Boolean((data as { enabled?: boolean }).enabled);
  } catch {
    return true;
  }
}
