// app/api/messaging/presence/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { touchUserPresence } from "@/lib/messaging/presence";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    isOnline?: boolean;
    deviceLabel?: string;
  };

  const result = await touchUserPresence({
    userId: user.id,
    isOnline: body.isOnline !== false,
    deviceLabel: body.deviceLabel,
  });

  return NextResponse.json({ ok: result.ok, error: "error" in result ? result.error : undefined });
}
