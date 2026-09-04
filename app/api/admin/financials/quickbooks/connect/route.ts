import { NextResponse } from "next/server";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";
import {
  buildQuickBooksAuthorizeUrl,
  createQuickBooksOAuthState,
  getQuickBooksConfig,
} from "@/lib/admin/financials/quickbooks-online";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const financeCheck = await requireFinanceAdminApi();
  if (!financeCheck.identity) return financeCheck.response;

  const origin = new URL(request.url).origin;
  const config = getQuickBooksConfig();
  if (!config.configured) {
    return NextResponse.redirect(
      new URL("/admin/financials/tax-reports/quickbooks?error=missing_credentials", origin),
    );
  }

  const state = await createQuickBooksOAuthState(financeCheck.identity);
  return NextResponse.redirect(buildQuickBooksAuthorizeUrl(state));
}
