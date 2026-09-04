import { NextResponse } from "next/server";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";
import { writeAccountingAudit } from "@/lib/admin/financials/accounting/audit";
import { upsertAccountingConnection } from "@/lib/admin/financials/accounting/connections";
import {
  consumeWaveOAuthState,
  exchangeWaveAuthorizationCode,
  taxCenterReturnUrl,
} from "@/lib/admin/financials/accounting/wave/oauth";
import { listWaveBusinesses } from "@/lib/admin/financials/accounting/wave/provider";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const financeCheck = await requireFinanceAdminApi();
  if (!financeCheck.identity) {
    return NextResponse.redirect(new URL("/admin/login", origin));
  }

  const params = new URL(request.url).searchParams;
  const error = params.get("error");
  const code = params.get("code")?.trim() || "";
  const state = params.get("state")?.trim() || "";

  if (error) {
    return NextResponse.redirect(
      taxCenterReturnUrl(origin, `?wave=error&detail=${encodeURIComponent(error)}`),
    );
  }
  if (!code || !state) {
    return NextResponse.redirect(taxCenterReturnUrl(origin, "?wave=error&detail=missing_oauth_code"));
  }

  try {
    const saved = await consumeWaveOAuthState(state);
    if (!saved) {
      return NextResponse.redirect(
        taxCenterReturnUrl(origin, "?wave=error&detail=expired_state"),
      );
    }

    const tokens = await exchangeWaveAuthorizationCode(code);
    const businesses = await listWaveBusinesses(tokens.access_token || "");
    const tokenBusiness = tokens.businessId
      ? businesses.find((row) => row.id === tokens.businessId)
      : null;
    const selected =
      tokenBusiness || (businesses.length === 1 ? businesses[0] : null);

    await upsertAccountingConnection({
      provider: "wave",
      organizationId: saved.organizationId,
      providerBusinessId: selected?.id || tokens.businessId || null,
      providerBusinessName: selected?.name || null,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: new Date(
        Date.now() + Number(tokens.expires_in || 7200) * 1000,
      ).toISOString(),
      scopes: tokens.scope || "",
      status: selected ? "connected" : "action_required",
      actorId: saved.actorId,
      actorEmail: saved.actorEmail,
    });

    await writeAccountingAudit({
      action: "accounting.wave.connected",
      actorId: saved.actorId,
      actorEmail: saved.actorEmail,
      actorRole: financeCheck.identity.role,
      metadata: {
        businessCount: businesses.length,
        selected: Boolean(selected),
      },
    });

    if (!selected) {
      return NextResponse.redirect(taxCenterReturnUrl(origin, "?wave=pick"));
    }
    return NextResponse.redirect(taxCenterReturnUrl(origin, "?wave=connected"));
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : "Wave connect failed.";
    return NextResponse.redirect(
      taxCenterReturnUrl(origin, `?wave=error&detail=${encodeURIComponent(message)}`),
    );
  }
}
