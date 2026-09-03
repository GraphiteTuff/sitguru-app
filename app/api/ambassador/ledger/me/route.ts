// app/api/ambassador/ledger/me/route.ts
/**
 * Self-service ledger stats for authenticated Ambassador / Admin accounts.
 * Access is additive: user_roles, live ambassadors row, or founder email.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  canAccessAmbassadorLedger,
  loadSelfServiceStats,
} from "@/lib/ambassador/ledger";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await canAccessAmbassadorLedger({
    userId: user.id,
    email: user.email,
  });

  if (!allowed) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "This login does not have an Ambassador workspace yet. Ask SitGuru Admin to connect your Ambassador profile.",
      },
      { status: 403 },
    );
  }

  const stats = await loadSelfServiceStats(user.id, user.email);
  if (!stats) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Your Ambassador referral code is not connected yet. Open Ambassador referrals to initialize tracking.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, ...stats });
}
