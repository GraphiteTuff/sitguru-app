import { NextResponse } from "next/server";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";
import { completeQuickBooksOAuth } from "@/lib/admin/financials/quickbooks-online";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function deskUrl(request: Request, query: string) {
  return new URL(`/admin/financials/tax-reports/quickbooks${query}`, new URL(request.url).origin);
}

export async function GET(request: Request) {
  const financeCheck = await requireFinanceAdminApi();
  if (!financeCheck.identity) {
    return NextResponse.redirect(new URL("/admin/login", new URL(request.url).origin));
  }

  const params = new URL(request.url).searchParams;
  const error = params.get("error");
  const code = params.get("code")?.trim() || "";
  const state = params.get("state")?.trim() || "";
  const realmId = params.get("realmId")?.trim() || "";

  if (error) {
    return NextResponse.redirect(deskUrl(request, `?error=${encodeURIComponent(error)}`));
  }
  if (!code || !state || !realmId) {
    return NextResponse.redirect(deskUrl(request, "?error=missing_oauth_code"));
  }

  try {
    await completeQuickBooksOAuth({ code, state, realmId });
    return NextResponse.redirect(deskUrl(request, "?connected=1"));
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "QuickBooks connect failed.";
    return NextResponse.redirect(deskUrl(request, `?error=${encodeURIComponent(message)}`));
  }
}
