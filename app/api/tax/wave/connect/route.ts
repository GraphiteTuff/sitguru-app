import { NextResponse } from "next/server";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";
import { isWaveAccountingEnabled } from "@/lib/admin/financials/accounting/catalog";
import { getWaveConfig } from "@/lib/admin/financials/accounting/wave/config";
import {
  buildWaveAuthorizeUrl,
  createWaveOAuthState,
} from "@/lib/admin/financials/accounting/wave/oauth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const financeCheck = await requireFinanceAdminApi();
  if (!financeCheck.identity) return financeCheck.response;

  const origin = new URL(request.url).origin;
  const force = new URL(request.url).searchParams.get("reconnect") === "1";
  if (!isWaveAccountingEnabled() || !getWaveConfig().configured) {
    return NextResponse.redirect(
      new URL("/admin/financials/tax-reports?wave=coming_soon", origin),
    );
  }

  const state = await createWaveOAuthState({
    actorId: financeCheck.identity.id,
    actorEmail: financeCheck.identity.email,
  });
  return NextResponse.redirect(buildWaveAuthorizeUrl(state, { force }));
}
