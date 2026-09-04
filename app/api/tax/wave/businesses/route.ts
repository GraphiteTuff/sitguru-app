import { NextResponse } from "next/server";
import { requireFinanceAdminApi } from "@/lib/admin/financials/access";
import {
  loadAccountingConnection,
  readConnectionTokens,
  upsertAccountingConnection,
} from "@/lib/admin/financials/accounting/connections";
import {
  createWaveProvider,
  listWaveBusinesses,
} from "@/lib/admin/financials/accounting/wave/provider";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const financeCheck = await requireFinanceAdminApi();
  if (!financeCheck.identity) return financeCheck.response;

  const connection = await loadAccountingConnection("wave");
  if (!connection || connection.status === "disconnected") {
    return NextResponse.json({ error: "Wave is not connected." }, { status: 400 });
  }

  await createWaveProvider().refreshToken();
  const fresh = await loadAccountingConnection("wave");
  const tokens = readConnectionTokens(fresh!);
  const businesses = await listWaveBusinesses(tokens.accessToken);
  return NextResponse.json({ ok: true, businesses });
}

export async function POST(request: Request) {
  const financeCheck = await requireFinanceAdminApi();
  if (!financeCheck.identity) return financeCheck.response;

  const body = (await request.json().catch(() => null)) as {
    businessId?: string;
    businessName?: string;
  } | null;
  const businessId = String(body?.businessId || "").trim();
  if (!businessId) {
    return NextResponse.json({ error: "Choose a Wave business." }, { status: 400 });
  }

  const connection = await loadAccountingConnection("wave");
  if (!connection) {
    return NextResponse.json({ error: "Wave is not connected." }, { status: 400 });
  }

  await upsertAccountingConnection({
    provider: "wave",
    organizationId: connection.organizationId,
    providerBusinessId: businessId,
    providerBusinessName: String(body?.businessName || "").trim() || "Wave business",
    status: "connected",
    actorEmail: financeCheck.identity.email,
  });

  return NextResponse.json({ ok: true });
}
