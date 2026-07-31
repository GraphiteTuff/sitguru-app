/**
 * GET /api/parent/perks — current vault + recent ledger for the signed-in parent.
 */

import { NextResponse } from "next/server";
import {
  formatPawPerks,
  nextBadgeProgress,
  pointsToUsd,
} from "@/lib/pawperks/constants";
import {
  getParentPerksBalance,
  listParentPerkTransactions,
} from "@/lib/pawperks/ledger";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required." },
        { status: 401 },
      );
    }

    const [balance, transactions] = await Promise.all([
      getParentPerksBalance(user.id),
      listParentPerkTransactions(user.id, 50),
    ]);

    const progress = nextBadgeProgress(balance.lifetime_earned);

    return NextResponse.json({
      ok: true,
      balance: {
        pointsBalance: balance.points_balance,
        lifetimeEarned: balance.lifetime_earned,
        usdValue: pointsToUsd(balance.points_balance),
        label: formatPawPerks(balance.points_balance),
      },
      badge: progress,
      transactions,
    });
  } catch (error) {
    console.error("[parent/perks]", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load PawPerks vault.",
      },
      { status: 500 },
    );
  }
}
