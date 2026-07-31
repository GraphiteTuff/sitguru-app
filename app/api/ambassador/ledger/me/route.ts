// app/api/ambassador/ledger/me/route.ts
/**
 * Self-service ledger stats for authenticated AMBASSADOR / ADMIN accounts.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { loadSelfServiceStats } from "@/lib/ambassador/ledger";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role,account_type")
    .eq("id", user.id)
    .maybeSingle();

  const role = String(
    (profile as { role?: string } | null)?.role || "",
  ).toLowerCase();
  const accountType = String(
    (profile as { account_type?: string } | null)?.account_type || "",
  ).toLowerCase();

  const allowed =
    role === "admin" ||
    role === "super_admin" ||
    role === "ambassador" ||
    accountType.includes("ambassador");

  if (!allowed) {
    // Also allow if they have an ambassador_profiles row
    const { data: ledgerProfile } = await supabaseAdmin
      .from("ambassador_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!ledgerProfile?.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
  }

  const stats = await loadSelfServiceStats(user.id);
  if (!stats) {
    return NextResponse.json(
      { ok: false, error: "No ambassador ledger profile found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, ...stats });
}
