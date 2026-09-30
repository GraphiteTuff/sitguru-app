import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/access";
import {
  getCredentialSettings,
  listAdminCredentials,
  listCredentialProvidersForAdmin,
  updateCredentialProvider,
  updateCredentialSettings,
} from "@/lib/credentials/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await requireAdminApi();
  if (admin.response) return admin.response;

  const tab = request.nextUrl.searchParams.get("tab") || "pending";

  try {
    const [credentials, providers, settings] = await Promise.all([
      listAdminCredentials(tab),
      listCredentialProvidersForAdmin(),
      getCredentialSettings(),
    ]);
    return NextResponse.json({ ok: true, credentials, providers, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load credentials.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdminApi();
  if (admin.response) return admin.response;

  const body = (await request.json().catch(() => ({}))) as {
    settings?: Record<string, string>;
    provider?: {
      id: string;
      publicUrl?: string | null;
      trainingUrl?: string | null;
      partnerUrl?: string | null;
      promoCode?: string | null;
      active?: boolean;
      logoAuthorized?: boolean;
      isPartner?: boolean;
    };
  };

  try {
    if (body.settings) await updateCredentialSettings(body.settings);
    if (body.provider?.id) await updateCredentialProvider(body.provider);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save settings.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
