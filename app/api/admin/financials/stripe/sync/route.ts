import { NextResponse } from "next/server";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";
import { syncStripeLedger } from "@/lib/stripe/sync-ledger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const financeCheck = await requireFinanceAdminApi();
  if (!financeCheck.identity) {
    return financeCheck.response;
  }

  try {
    const result = await syncStripeLedger({
      balanceLimit: 300,
      payoutLimit: 100,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 207 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to sync Stripe ledger",
      },
      { status: 500 },
    );
  }
}
