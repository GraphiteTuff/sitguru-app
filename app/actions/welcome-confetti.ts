"use server";

import { createClient } from "@/utils/supabase/server";

export async function markWelcomeConfettiSeen() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ has_seen_welcome_confetti: true })
    .eq("id", user.id);

  return { ok: !error };
}