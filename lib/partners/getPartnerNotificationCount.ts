import { createClient } from "@/lib/supabase/server";

export async function getPartnerNotificationCount() {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("partner_message_notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  if (error) {
    console.error("Partner notification count error:", error);
    return 0;
  }

  return count ?? 0;
}
