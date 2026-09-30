import { NextRequest, NextResponse } from "next/server";
import { processCredentialExpirations } from "@/lib/credentials/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") || "";
  if (!cronSecret) return process.env.NODE_ENV !== "production";
  return authorization === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await processCredentialExpirations();
    return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Expiration job failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
