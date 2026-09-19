import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { syncAuthEmailToSitGuruRecords } from "@/lib/auth/sync-auth-email";

export const dynamic = "force-dynamic";

/**
 * Idempotent: if the signed-in user's SitGuru profile/guru email is blank
 * and auth.users has an email (including Apple Private Relay), copy it over.
 * Never overwrites a non-empty contact_email or existing login email.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const result = await syncAuthEmailToSitGuruRecords({
      admin: supabaseAdmin as never,
      userId: user.id,
      authEmail: user.email,
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("sync-auth-email failed:", error);
    return NextResponse.json(
      { error: "Could not sync account email." },
      { status: 500 },
    );
  }
}
